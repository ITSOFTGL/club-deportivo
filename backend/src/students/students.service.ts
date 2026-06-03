// backend/src/students/students.service.ts
import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaymentStatus, Prisma, UserRole } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto } from './dto/create-student.dto';
import { UpdateStudentDto } from './dto/update-student.dto';
import {
  getMembershipStatus,
  parseLocalDateInput,
} from '../common/utils/membership.util';
import { getStudentMonthlyFee } from '../common/utils/student-fee.util';
import {
  imageExtensionFromUpload,
  isValidImageUpload,
} from '../common/utils/upload-image.util';

@Injectable()
export class StudentsService {
  constructor(private readonly prismaService: PrismaService) {}

  private async withMembership<T extends { id: string }>(students: T[]) {
    if (students.length === 0) return [];

    const ids = students.map((s) => s.id);
    const paidPayments = await this.prismaService.prisma.payment.findMany({
      where: {
        students: { some: { id: { in: ids } } },
        status: PaymentStatus.PAID,
        expiresAt: { not: null },
      },
      select: { expiresAt: true, students: { select: { id: true } } },
      orderBy: { expiresAt: 'desc' },
    });

    const paidUntilMap = new Map<string, Date>();
    for (const payment of paidPayments) {
      if (!payment.expiresAt) continue;
      for (const st of payment.students) {
        const current = paidUntilMap.get(st.id);
        if (!current || payment.expiresAt > current) {
          paidUntilMap.set(st.id, payment.expiresAt);
        }
      }
    }

    return students.map((student) => {
      const paidUntil = paidUntilMap.get(student.id);
      const membership = getMembershipStatus(paidUntil);
      const withCategory = student as typeof student & {
        category?: { monthlyPrice?: number | null };
        discountPercent?: number | null;
        monthlyFeeOverride?: number | null;
      };
      const photoPath = (student as { profilePhotoUrl?: string | null; updatedAt?: Date })
        .profilePhotoUrl;
      const updatedAt = (student as { updatedAt?: Date }).updatedAt;
      const profilePhotoUrlWithCache = photoPath
        ? `${photoPath.split('?')[0]}?v=${updatedAt ? new Date(updatedAt).getTime() : Date.now()}`
        : null;

      return {
        ...student,
        profilePhotoUrl: profilePhotoUrlWithCache,
        membershipPaidUntil: paidUntil?.toISOString() ?? null,
        membershipActive: membership.membershipActive,
        membershipStatus: membership.status,
        membershipLabel: membership.label,
        membershipDaysRemaining: membership.daysRemaining,
        categoryMonthlyPrice: withCategory.category?.monthlyPrice ?? 0,
        effectiveMonthlyFee: getStudentMonthlyFee(withCategory),
      };
    });
  }

  async create(createDto: CreateStudentDto) {
    return this.prismaService.prisma.student.create({
      data: {
        name: createDto.name,
        lastName: createDto.lastName,
        birthDate: parseLocalDateInput(createDto.birthDate),
        documentId: createDto.documentId,
        gender: createDto.gender,
        weight: createDto.weight,
        height: createDto.height,
        shoeSize: createDto.shoeSize,
        shirtSize: createDto.shirtSize,
        pantsSize: createDto.pantsSize,
        medicalNotes: createDto.medicalNotes,
        bloodType: createDto.bloodType,
        emergencyContact: createDto.emergencyContact,
        emergencyPhone: createDto.emergencyPhone,
        school: createDto.school,
        grade: createDto.grade,
        parentId: createDto.parentId || undefined,
        enrollmentDate: createDto.enrollmentDate
          ? parseLocalDateInput(createDto.enrollmentDate)
          : parseLocalDateInput(new Date()),
        branchId: createDto.branchId,
        categoryId: createDto.categoryId,
        discountPercent: createDto.discountPercent ?? 0,
        monthlyFeeOverride: createDto.monthlyFeeOverride,
        profilePhotoUrl: createDto.profilePhotoUrl,
        status: 'ACTIVE',
      },
      include: { parent: true, branch: true, category: true, guardians: true },
    });
  }

  async findAll() {
    const rows = await this.prismaService.prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: { parent: true, branch: true, category: true, guardians: true },
    });
    return this.withMembership(rows);
  }

  async findByParent(parentId: string) {
    const parent = await this.prismaService.prisma.user.findUnique({
      where: { id: parentId },
    });
    if (!parent) return [];

    const orFilters: Prisma.StudentWhereInput[] = [{ parentId }];
    const email = parent.email?.trim();
    if (email) {
      orFilters.push({
        guardians: {
          some: { isActive: true, email: { equals: email, mode: 'insensitive' } },
        },
      });
    }
    if (parent.documentId) {
      orFilters.push({
        guardians: {
          some: { isActive: true, documentId: parent.documentId },
        },
      });
    }

    const rows = await this.prismaService.prisma.student.findMany({
      where: { status: 'ACTIVE', OR: orFilters },
      include: { branch: true, category: true, parent: true, guardians: true },
    });

    const toLink = rows.filter((s) => !s.parentId);
    if (toLink.length > 0) {
      await this.prismaService.prisma.student.updateMany({
        where: { id: { in: toLink.map((s) => s.id) } },
        data: { parentId },
      });
      for (const s of toLink) {
        s.parentId = parentId;
      }
    }

    return this.withMembership(rows);
  }

  private async assertParentCanAccessStudent(
    studentId: string,
    parentId: string,
  ) {
    const children = await this.findByParent(parentId);
    if (!children.some((c) => c.id === studentId)) {
      throw new ForbiddenException('No tiene acceso a este alumno');
    }
  }

  async findByTeacher(teacherId: string, categoryShiftId?: string) {
    const assignments =
      await this.prismaService.prisma.teacherAssignment.findMany({
        where: {
          teacherId,
          isActive: true,
          ...(categoryShiftId ? { categoryShiftId } : {}),
        },
        include: { categoryShift: true },
      });

    if (assignments.length === 0) return [];

    const scopes = assignments
      .map((a) => a.categoryShift)
      .filter((cs): cs is NonNullable<typeof cs> => Boolean(cs))
      .map((cs) => ({ categoryId: cs.categoryId, branchId: cs.branchId }));

    if (scopes.length === 0) return [];

    const rows = await this.prismaService.prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        OR: scopes.map((s) => ({
          categoryId: s.categoryId,
          branchId: s.branchId,
        })),
      },
      include: { parent: true, branch: true, category: true, guardians: true },
      orderBy: [
        { branch: { name: 'asc' } },
        { category: { name: 'asc' } },
        { lastName: 'asc' },
      ],
    });
    return this.withMembership(rows);
  }

  async findByCategoryIds(categoryIds: string[]) {
    if (!categoryIds.length) return [];
    const rows = await this.prismaService.prisma.student.findMany({
      where: { categoryId: { in: categoryIds }, status: 'ACTIVE' },
      include: { parent: true, branch: true, category: true, guardians: true },
    });
    return this.withMembership(rows);
  }

  async findMembershipAlerts() {
    const rows = await this.findAll();
    const alertStatuses = new Set(['NONE', 'EXPIRED', 'LAST_DAY', 'EXPIRING']);

    return rows
      .filter((s) => alertStatuses.has(s.membershipStatus as string))
      .filter((s) => {
        if (s.membershipStatus === 'EXPIRING') {
          return (s.membershipDaysRemaining ?? 99) <= 5;
        }
        return true;
      })
      .sort((a, b) => {
        const order: Record<string, number> = {
          EXPIRED: 0,
          NONE: 1,
          LAST_DAY: 2,
          EXPIRING: 3,
        };
        const oa = order[a.membershipStatus as string] ?? 9;
        const ob = order[b.membershipStatus as string] ?? 9;
        if (oa !== ob) return oa - ob;
        return (a.membershipDaysRemaining ?? 0) - (b.membershipDaysRemaining ?? 0);
      });
  }

  async findOne(id: string, actor?: AuthUser) {
    const student = await this.prismaService.prisma.student.findUnique({
      where: { id },
      include: { parent: true, branch: true, category: true, guardians: true },
    });
    if (!student) throw new NotFoundException('Alumno no encontrado');
    if (actor?.role === UserRole.PARENT) {
      await this.assertParentCanAccessStudent(id, actor.id);
    }
    const [enriched] = await this.withMembership([student]);
    return enriched;
  }

  async update(id: string, updateDto: UpdateStudentDto) {
    await this.findOne(id);

    const data: Record<string, unknown> = {};

    if (updateDto.name !== undefined) data.name = updateDto.name;
    if (updateDto.lastName !== undefined) data.lastName = updateDto.lastName;
    if (updateDto.birthDate !== undefined) {
      data.birthDate = parseLocalDateInput(updateDto.birthDate);
    }
    if (updateDto.documentId !== undefined) data.documentId = updateDto.documentId;
    if (updateDto.gender !== undefined) data.gender = updateDto.gender;
    if (updateDto.weight !== undefined) data.weight = updateDto.weight;
    if (updateDto.height !== undefined) data.height = updateDto.height;
    if (updateDto.shoeSize !== undefined) data.shoeSize = updateDto.shoeSize;
    if (updateDto.shirtSize !== undefined) data.shirtSize = updateDto.shirtSize;
    if (updateDto.pantsSize !== undefined) data.pantsSize = updateDto.pantsSize;
    if (updateDto.medicalNotes !== undefined) {
      data.medicalNotes = updateDto.medicalNotes;
    }
    if (updateDto.bloodType !== undefined) data.bloodType = updateDto.bloodType;
    if (updateDto.emergencyContact !== undefined) {
      data.emergencyContact = updateDto.emergencyContact;
    }
    if (updateDto.emergencyPhone !== undefined) {
      data.emergencyPhone = updateDto.emergencyPhone;
    }
    if (updateDto.school !== undefined) data.school = updateDto.school;
    if (updateDto.grade !== undefined) data.grade = updateDto.grade;
    if (updateDto.parentId !== undefined) data.parentId = updateDto.parentId;
    if (updateDto.branchId !== undefined) data.branchId = updateDto.branchId;
    if (updateDto.categoryId !== undefined) data.categoryId = updateDto.categoryId;
    if (updateDto.status !== undefined) data.status = updateDto.status;
    if (updateDto.discountPercent !== undefined) {
      data.discountPercent = updateDto.discountPercent;
    }
    if (updateDto.enrollmentDate !== undefined) {
      data.enrollmentDate = parseLocalDateInput(updateDto.enrollmentDate);
    }
    if (updateDto.monthlyFeeOverride !== undefined) {
      data.monthlyFeeOverride = updateDto.monthlyFeeOverride;
    }
    if (updateDto.profilePhotoUrl !== undefined) {
      data.profilePhotoUrl = updateDto.profilePhotoUrl;
    }

    return this.prismaService.prisma.student.update({
      where: { id },
      data,
      include: { parent: true, branch: true, category: true, guardians: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prismaService.prisma.student.update({
      where: { id },
      data: { status: 'INACTIVE' },
    });
  }

  async findBirthdaysToday() {
    const now = new Date();
    const month = now.getMonth();
    const day = now.getDate();

    const students = await this.prismaService.prisma.student.findMany({
      where: { status: 'ACTIVE' },
      include: {
        category: true,
        branch: true,
        parent: { select: { id: true, name: true, lastName: true, phone: true } },
        guardians: {
          where: { isActive: true },
          orderBy: { isPrimary: 'desc' },
          take: 2,
        },
      },
      orderBy: [{ lastName: 'asc' }, { name: 'asc' }],
    });

    return students
      .filter((s) => {
        const b = new Date(s.birthDate);
        return b.getMonth() === month && b.getDate() === day;
      })
      .map((s) => {
        const birth = new Date(s.birthDate);
        let age = now.getFullYear() - birth.getFullYear();
        if (
          now.getMonth() < birth.getMonth() ||
          (now.getMonth() === birth.getMonth() && now.getDate() < birth.getDate())
        ) {
          age -= 1;
        }
        const g = s.guardians.find((x) => x.isPrimary) ?? s.guardians[0];
        return {
          id: s.id,
          name: s.name,
          lastName: s.lastName,
          birthDate: s.birthDate,
          age,
          profilePhotoUrl: s.profilePhotoUrl,
          category: s.category?.name,
          branch: s.branch?.name,
          parentPhone: g?.phone ?? s.parent?.phone ?? null,
          parentName: g
            ? `${g.name} ${g.lastName}`
            : s.parent
              ? `${s.parent.name} ${s.parent.lastName}`
              : null,
        };
      });
  }

  async uploadProfilePhoto(
    id: string,
    file?: { buffer: Buffer; mimetype?: string; originalname?: string },
  ) {
    if (!isValidImageUpload(file)) {
      throw new BadRequestException(
        'Imagen inválida. Use JPG o PNG (máx. 3 MB).',
      );
    }
    const upload = file!;
    await this.findOne(id);

    const ext = imageExtensionFromUpload(upload);
    const dir = path.join(process.cwd(), 'uploads', 'students');
    fs.mkdirSync(dir, { recursive: true });
    const filename = `${id}.${ext}`;
    fs.writeFileSync(path.join(dir, filename), upload.buffer);
    const storedPath = `/uploads/students/${filename}`;

    const row = await this.prismaService.prisma.student.update({
      where: { id },
      data: { profilePhotoUrl: storedPath },
      include: { parent: true, branch: true, category: true, guardians: true },
    });

    return {
      ...row,
      profilePhotoUrl: `${storedPath}?v=${Date.now()}`,
    };
  }
}

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { validatePassword } from '../common/utils/password.util';
import { UserRole, UserStatus, Prisma } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';

@Injectable()
export class GuardiansService {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.prisma;
  }

  /** Cuenta de acceso nueva o usuario PARENT existente (correo/documento). */
  private async resolveParentUserId(
    createDto: CreateGuardianDto,
  ): Promise<string | undefined> {
    if (createDto.createUserAccount) {
      if (!createDto.email?.trim()) {
        throw new BadRequestException(
          'El correo es obligatorio para crear cuenta de acceso',
        );
      }
      if (!createDto.password) {
        throw new BadRequestException(
          'La contraseña es obligatoria para crear cuenta de acceso',
        );
      }
      const pwdCheck = validatePassword(createDto.password);
      if (!pwdCheck.valid) {
        throw new BadRequestException(pwdCheck.message);
      }

      const email = createDto.email.trim().toLowerCase();
      const exists = await this.prisma.user.findUnique({ where: { email } });
      if (exists) {
        if (exists.role !== UserRole.PARENT) {
          throw new ConflictException(
            'El correo ya está registrado con otro rol. Use otro correo o vincule desde Usuarios.',
          );
        }
        return exists.id;
      }

      const docExists = await this.prisma.user.findUnique({
        where: { documentId: createDto.documentId },
      });
      if (docExists) {
        throw new ConflictException(
          'El documento ya está registrado como usuario',
        );
      }

      const hashed = await bcrypt.hash(createDto.password, 10);
      const user = await this.prisma.user.create({
        data: {
          email,
          password: hashed,
          name: createDto.name,
          lastName: createDto.lastName,
          phone: createDto.phone,
          documentId: createDto.documentId,
          role: UserRole.PARENT,
          status: UserStatus.ACTIVE,
          approvalStatus: 'APPROVED',
        },
      });
      return user.id;
    }

    if (createDto.email?.trim()) {
      const byEmail = await this.prisma.user.findFirst({
        where: {
          email: createDto.email.trim().toLowerCase(),
          role: UserRole.PARENT,
          status: UserStatus.ACTIVE,
        },
      });
      if (byEmail) return byEmail.id;
    }

    const byDoc = await this.prisma.user.findFirst({
      where: {
        documentId: createDto.documentId,
        role: UserRole.PARENT,
        status: UserStatus.ACTIVE,
      },
    });
    if (byDoc) return byDoc.id;

    return undefined;
  }

  async create(createDto: CreateGuardianDto) {
    const studentIds = [
      createDto.studentId,
      ...(createDto.additionalStudentIds ?? []),
    ].filter((id, i, arr) => id && arr.indexOf(id) === i);

    for (const sid of studentIds) {
      const student = await this.prisma.student.findUnique({
        where: { id: sid },
      });
      if (!student) throw new NotFoundException(`Alumno ${sid} no encontrado`);
    }

    const parentUserId = await this.resolveParentUserId(createDto);

    type CreatedGuardian = Prisma.GuardianGetPayload<{
      include: { student: true };
    }>;
    const created: CreatedGuardian[] = [];
    for (let i = 0; i < studentIds.length; i++) {
      const sid = studentIds[i];
      const guardian = await this.prisma.guardian.create({
        data: {
          studentId: sid,
          name: createDto.name,
          lastName: createDto.lastName,
          documentId:
            studentIds.length === 1
              ? createDto.documentId
              : `${createDto.documentId}-${i + 1}`,
          phone: createDto.phone,
          email: createDto.email?.trim() || null,
          relationship: createDto.relationship,
          isPrimary: createDto.isPrimary ?? false,
        },
        include: { student: true },
      });
      created.push(guardian);

      if (parentUserId) {
        await this.prisma.student.update({
          where: { id: sid },
          data: { parentId: parentUserId },
        });
      }
    }

    return {
      ...created[0],
      linkedStudents: studentIds.length,
      userAccountCreated: Boolean(parentUserId),
      loginLinked: Boolean(parentUserId),
    };
  }

  async findAll() {
    return this.prisma.guardian.findMany({
      where: { isActive: true },
      include: { student: { include: { category: true, branch: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByStudent(studentId: string) {
    return this.prisma.guardian.findMany({
      where: { studentId, isActive: true },
      include: { student: { include: { category: true, branch: true } } },
    });
  }

  async findByCategoryShiftScope(categoryShiftId: string) {
    const cs = await this.prisma.categoryShift.findUnique({
      where: { id: categoryShiftId },
    });
    if (!cs) throw new NotFoundException('Grupo no encontrado');

    return this.prisma.guardian.findMany({
      where: {
        isActive: true,
        student: {
          status: 'ACTIVE',
          categoryId: cs.categoryId,
          branchId: cs.branchId,
        },
      },
      include: {
        student: { include: { category: true, branch: true } },
      },
      orderBy: [{ student: { lastName: 'asc' } }, { name: 'asc' }],
    });
  }

  async findOne(id: string) {
    const guardian = await this.prisma.guardian.findUnique({
      where: { id },
      include: { student: true },
    });
    if (!guardian) throw new NotFoundException('Apoderado no encontrado');
    return guardian;
  }

  async update(id: string, updateDto: UpdateGuardianDto) {
    await this.findOne(id);
    return this.prisma.guardian.update({
      where: { id },
      data: updateDto,
      include: { student: true },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.guardian.update({
      where: { id },
      data: { isActive: false },
    });
  }
}

import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { AttendanceStatus, Prisma, UserRole } from '@prisma/client';
import type { AuthUser } from '../common/decorators/current-user.decorator';
import { PrismaService } from '../prisma/prisma.service';

function localDayRange(dateInput: string): { start: Date; end: Date } {
  const [y, m, d] = dateInput.split('-').map(Number);
  return {
    start: new Date(y, m - 1, d, 0, 0, 0, 0),
    end: new Date(y, m - 1, d, 23, 59, 59, 999),
  };
}

function monthRange(year: number, month: number) {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 0, 23, 59, 59, 999);
  return { start, end };
}

function toDateKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

@Injectable()
export class AttendancesReportsService {
  constructor(private readonly prismaService: PrismaService) {}

  private get prisma() {
    return this.prismaService.prisma;
  }

  private async getTeacherScopes(teacherId: string) {
    const assignments = await this.prisma.teacherAssignment.findMany({
      where: { teacherId, isActive: true },
      include: { categoryShift: true },
    });
    return assignments
      .map((a) => a.categoryShift)
      .filter(Boolean)
      .map((cs) => ({
        categoryId: cs!.categoryId,
        branchId: cs!.branchId,
      }));
  }

  private async assertStudentInActorScope(
    student: { categoryId: string; branchId: string },
    actor: AuthUser,
  ) {
    if (actor.role === UserRole.SUPER_ADMIN || actor.role === UserRole.ADMIN) {
      return;
    }
    if (actor.role === UserRole.TEACHER) {
      const scopes = await this.getTeacherScopes(actor.id);
      const ok = scopes.some(
        (s) =>
          s.categoryId === student.categoryId &&
          s.branchId === student.branchId,
      );
      if (!ok) {
        throw new ForbiddenException('Alumno fuera de sus categorías asignadas');
      }
      return;
    }
    throw new ForbiddenException('Sin permiso');
  }

  private studentScopeWhere(
    actor: AuthUser,
    filters?: { categoryId?: string; branchId?: string },
  ): Prisma.StudentWhereInput {
    const base: Prisma.StudentWhereInput = {
      status: 'ACTIVE',
      ...(filters?.categoryId ? { categoryId: filters.categoryId } : {}),
      ...(filters?.branchId ? { branchId: filters.branchId } : {}),
    };

    if (actor.role === UserRole.TEACHER) {
      return base;
    }
    return base;
  }

  async getMonthlyReport(
    actor: AuthUser,
    year: number,
    month: number,
    categoryId?: string,
    branchId?: string,
  ) {
    const { start, end } = monthRange(year, month);

    let studentWhere: Prisma.StudentWhereInput = {
      status: 'ACTIVE',
      ...(categoryId ? { categoryId } : {}),
      ...(branchId ? { branchId } : {}),
    };

    if (actor.role === UserRole.TEACHER) {
      const scopes = await this.getTeacherScopes(actor.id);
      if (scopes.length === 0) {
        return { year, month, listDays: [], students: [] };
      }
      studentWhere = {
        ...studentWhere,
        OR: scopes.map((s) => ({
          categoryId: categoryId ?? s.categoryId,
          branchId: branchId ?? s.branchId,
        })),
      };
    } else if (
      actor.role !== UserRole.SUPER_ADMIN &&
      actor.role !== UserRole.ADMIN
    ) {
      throw new ForbiddenException('Sin permiso para este reporte');
    }

    const students = await this.prisma.student.findMany({
      where: studentWhere,
      select: {
        id: true,
        name: true,
        lastName: true,
        profilePhotoUrl: true,
        category: { select: { name: true } },
        branch: { select: { name: true } },
      },
      orderBy: [{ lastName: 'asc' }, { name: 'asc' }],
    });

    if (students.length === 0) {
      return { year, month, listDays: [], students: [] };
    }

    const studentIds = students.map((s) => s.id);

    const attendances = await this.prisma.attendance.findMany({
      where: {
        studentId: { in: studentIds },
        createdAt: { gte: start, lte: end },
      },
      include: { shift: true, student: true },
      orderBy: { createdAt: 'asc' },
    });

    const listDaysMap = new Map<
      string,
      {
        date: string;
        shiftName: string;
        recordsCount: number;
      }
    >();

    for (const a of attendances) {
      if (!a.studentId) continue;
      const date = toDateKey(a.createdAt);
      const key = `${date}|${a.shiftId}`;
      const existing = listDaysMap.get(key);
      if (existing) {
        existing.recordsCount += 1;
      } else {
        listDaysMap.set(key, {
          date,
          shiftName: a.shift?.name ?? '—',
          recordsCount: 1,
        });
      }
    }

    const listDays = [...listDaysMap.values()].sort((a, b) =>
      a.date.localeCompare(b.date),
    );

    const byStudentDate = new Map<string, Map<string, AttendanceStatus>>();
    for (const a of attendances) {
      if (!a.studentId) continue;
      const date = toDateKey(a.createdAt);
      if (!byStudentDate.has(a.studentId)) {
        byStudentDate.set(a.studentId, new Map());
      }
      byStudentDate.get(a.studentId)!.set(date, a.status);
    }

    const uniqueListDates = [...new Set(listDays.map((d) => d.date))];

    const reportStudents = students.map((st) => {
      const dayMap = byStudentDate.get(st.id) ?? new Map();
      const byDay: Record<string, string> = {};
      const absences: string[] = [];

      for (const date of uniqueListDates) {
        const status = dayMap.get(date);
        if (!status) {
          byDay[date] = 'SIN_REGISTRO';
          absences.push(date);
        } else if (
          status === AttendanceStatus.ABSENT ||
          status === AttendanceStatus.PENDING
        ) {
          byDay[date] = 'NO';
          absences.push(date);
        } else {
          byDay[date] = 'SI';
        }
      }

      return {
        studentId: st.id,
        name: st.name,
        lastName: st.lastName,
        category: st.category?.name,
        branch: st.branch?.name,
        profilePhotoUrl: st.profilePhotoUrl,
        byDay,
        absences,
      };
    });

    return {
      year,
      month,
      listDays,
      listDates: uniqueListDates,
      students: reportStudents,
    };
  }

  async searchAbsences(
    actor: AuthUser,
    params: {
      search?: string;
      studentId?: string;
      from: string;
      to: string;
      categoryId?: string;
      branchId?: string;
    },
  ) {
    const from = localDayRange(params.from).start;
    const to = localDayRange(params.to).end;

    let students;

    if (params.studentId) {
      const st = await this.prisma.student.findUnique({
        where: { id: params.studentId },
        include: {
          category: true,
          branch: true,
          guardians: true,
          parent: { select: { name: true, lastName: true, phone: true } },
        },
      });
      if (!st) throw new NotFoundException('Alumno no encontrado');
      await this.assertStudentInActorScope(st, actor);
      students = [st];
    } else if (params.search?.trim()) {
      const q = params.search.trim();
      let where: Prisma.StudentWhereInput = {
        status: 'ACTIVE',
        OR: [
          { name: { contains: q, mode: 'insensitive' } },
          { lastName: { contains: q, mode: 'insensitive' } },
        ],
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
        ...(params.branchId ? { branchId: params.branchId } : {}),
      };

      if (actor.role === UserRole.TEACHER) {
        const scopes = await this.getTeacherScopes(actor.id);
        if (scopes.length === 0) return { results: [] };
        where = {
          AND: [
            where,
            {
              OR: scopes.map((s) => ({
                categoryId: params.categoryId ?? s.categoryId,
                branchId: params.branchId ?? s.branchId,
              })),
            },
          ],
        };
      } else if (
        actor.role !== UserRole.SUPER_ADMIN &&
        actor.role !== UserRole.ADMIN
      ) {
        throw new ForbiddenException('Sin permiso');
      }

      students = await this.prisma.student.findMany({
        where,
        include: {
          category: true,
          branch: true,
          guardians: true,
          parent: { select: { name: true, lastName: true, phone: true } },
        },
        take: 20,
      });
    } else {
      throw new NotFoundException('Indique nombre o alumno');
    }

    const results: any[] = [];

    for (const st of students) {
      const attendances = await this.prisma.attendance.findMany({
        where: {
          studentId: st.id,
          createdAt: { gte: from, lte: to },
        },
        include: { shift: true },
        orderBy: { createdAt: 'desc' },
      });

      const missed: Array<{ date: string; status: string; shiftName: string }> =
        [];

      for (const a of attendances) {
        if (
          a.status === AttendanceStatus.ABSENT ||
          a.status === AttendanceStatus.PENDING
        ) {
          missed.push({
            date: toDateKey(a.createdAt),
            status: a.status,
            shiftName: a.shift?.name ?? '—',
          });
        }
      }

      const scopeAttendances = await this.prisma.attendance.findMany({
        where: {
          createdAt: { gte: from, lte: to },
          student: {
            categoryId: st.categoryId,
            branchId: st.branchId,
            status: 'ACTIVE',
          },
        },
        select: { createdAt: true, studentId: true, status: true },
      });

      const listDates = new Set<string>();
      for (const a of scopeAttendances) {
        listDates.add(toDateKey(a.createdAt));
      }

      const presentDates = new Set(
        attendances
          .filter(
            (a) =>
              a.status === AttendanceStatus.PRESENT ||
              a.status === AttendanceStatus.LATE,
          )
          .map((a) => toDateKey(a.createdAt)),
      );

      for (const date of listDates) {
        if (!presentDates.has(date)) {
          const already = missed.some((m) => m.date === date);
          if (!already) {
            missed.push({ date, status: 'SIN_REGISTRO', shiftName: '—' });
          }
        }
      }

      missed.sort((a, b) => b.date.localeCompare(a.date));

      const primaryGuardian =
        st.guardians?.find((g) => g.isPrimary) ?? st.guardians?.[0];

      results.push({
        studentId: st.id,
        name: st.name,
        lastName: st.lastName,
        category: st.category?.name,
        branch: st.branch?.name,
        profilePhotoUrl: st.profilePhotoUrl,
        parentPhone:
          primaryGuardian?.phone ?? st.parent?.phone ?? null,
        parentName: primaryGuardian
          ? `${primaryGuardian.name} ${primaryGuardian.lastName}`
          : st.parent
            ? `${st.parent.name} ${st.parent.lastName}`
            : null,
        missed,
        missedCount: missed.length,
      });
    }

    return { from: params.from, to: params.to, results };
  }

  async findForParent(
    parentId: string,
    opts?: { from?: string; to?: string; studentId?: string },
  ) {
    const parent = await this.prisma.user.findUnique({ where: { id: parentId } });
    if (!parent) return [];

    const orFilters: Prisma.StudentWhereInput[] = [{ parentId }];
    if (parent.email) {
      orFilters.push({
        guardians: {
          some: {
            isActive: true,
            email: { equals: parent.email, mode: 'insensitive' },
          },
        },
      });
    }

    const children = await this.prisma.student.findMany({
      where: {
        status: 'ACTIVE',
        OR: orFilters,
        ...(opts?.studentId ? { id: opts.studentId } : {}),
      },
      select: { id: true },
    });

    const childIds = children.map((c) => c.id);
    if (childIds.length === 0) return [];

    const createdAt: Prisma.DateTimeFilter | undefined =
      opts?.from && opts?.to
        ? {
            gte: localDayRange(opts.from).start,
            lte: localDayRange(opts.to).end,
          }
        : undefined;

    return this.prisma.attendance.findMany({
      where: {
        studentId: { in: childIds },
        ...(createdAt ? { createdAt } : {}),
      },
      include: {
        shift: true,
        student: { include: { category: true, branch: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

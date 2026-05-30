import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { getMembershipStatus } from '../common/utils/membership.util';
import { formatDaysOfWeek } from '../common/utils/schedule.util';

const ACTIVE_STUDENT_STATUS = 'ACTIVE';

@Injectable()
export class ReportsService {
  constructor(private readonly prismaService: PrismaService) {}

  async getDashboard() {
    const prisma = this.prismaService.prisma;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalStudents,
      activeStudents,
      totalCategories,
      totalShifts,
      pendingPayments,
      paidPaymentsMonth,
      totalAttendancesMonth,
      studentsByCategory,
      paymentsByStatus,
    ] = await Promise.all([
      prisma.student.count(),
      prisma.student.count({
        where: { status: ACTIVE_STUDENT_STATUS },
      }),
      prisma.category.count({ where: { isActive: true } }),
      prisma.shift.count({ where: { isActive: true } }),
      prisma.paymentHistory.count({ where: { status: 'PENDING' } }),
      prisma.payment.aggregate({
        where: {
          status: PaymentStatus.PAID,
          paymentDate: { gte: startOfMonth },
        },
        _sum: { total: true },
        _count: { id: true },
      }),
      prisma.attendance.count({
        where: { createdAt: { gte: startOfMonth } },
      }),
      prisma.student.groupBy({
        by: ['categoryId'],
        where: { status: ACTIVE_STUDENT_STATUS },
        _count: { _all: true },
      }),
      prisma.payment.groupBy({
        by: ['status'],
        _count: { _all: true },
      }),
    ]);

    const categories = await prisma.category.findMany({
      select: { id: true, name: true },
    });
    const categoryMap = new Map(categories.map((c) => [c.id, c.name]));

    return {
      summary: {
        totalStudents,
        activeStudents,
        totalCategories,
        totalShifts,
        pendingPayments,
        monthlyRevenue: paidPaymentsMonth._sum.total ?? 0,
        monthlyPaidCount: paidPaymentsMonth._count.id,
        monthlyAttendances: totalAttendancesMonth,
      },
      studentsByCategory: studentsByCategory.map((row) => ({
        categoryId: row.categoryId,
        categoryName: categoryMap.get(row.categoryId) ?? 'Sin categoría',
        count: row._count._all,
      })),
      paymentsByStatus: paymentsByStatus.map((row) => ({
        status: row.status,
        count: row._count._all,
      })),
    };
  }

  async getPaymentsExport() {
    const prisma = this.prismaService.prisma;
    const payments = await prisma.payment.findMany({
      include: {
        students: {
          include: { category: true, parent: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return payments.map((p) => {
      const student = p.students[0];
      return {
        alumno: student
          ? `${student.name} ${student.lastName}`
          : '—',
        categoria: student?.category?.name ?? '—',
        monto: p.total,
        metodo: p.method,
        estado: p.status,
        fechaPago: p.paymentDate,
        vence: p.expiresAt,
        meses: p.monthsCovered,
      };
    });
  }

  async getTeachersExport() {
    const prisma = this.prismaService.prisma;
    const teachers = await prisma.user.findMany({
      where: { role: 'TEACHER', status: 'ACTIVE' },
      include: {
        teacherProfile: true,
        teacherAssignments: {
          where: { isActive: true },
          include: {
            categoryShift: {
              include: { category: true, shift: true, branch: true },
            },
          },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    const rows: Array<{
      nombre: string;
      telefono: string;
      email: string;
      categoria: string;
      sucursal: string;
      dias: string;
      horario: string;
    }> = [];

    for (const t of teachers) {
      const base = {
        nombre: `${t.name} ${t.lastName}`,
        telefono: t.phone ?? t.teacherProfile?.phone ?? '—',
        email: t.email,
      };
      if (!t.teacherAssignments.length) {
        rows.push({
          ...base,
          categoria: '—',
          sucursal: '—',
          dias: '—',
          horario: '—',
        });
        continue;
      }
      for (const a of t.teacherAssignments) {
        const cs = a.categoryShift;
        if (!cs) {
          rows.push({
            ...base,
            categoria: '—',
            sucursal: '—',
            dias: '—',
            horario: '—',
          });
          continue;
        }
        rows.push({
          ...base,
          categoria: cs.category?.name ?? '—',
          sucursal: cs.branch?.name ?? '—',
          dias: formatDaysOfWeek(cs.daysOfWeek),
          horario: `${cs.startTime} – ${cs.endTime}`,
        });
      }
    }
    return rows;
  }

  async getCategoriesStudentsExport(
    categoryId?: string,
    branchId?: string,
  ) {
    const prisma = this.prismaService.prisma;
    const students = await prisma.student.findMany({
      where: {
        status: ACTIVE_STUDENT_STATUS,
        ...(categoryId ? { categoryId } : {}),
        ...(branchId ? { branchId } : {}),
      },
      include: {
        category: true,
        branch: true,
        parent: true,
        guardians: { where: { isActive: true }, orderBy: { isPrimary: 'desc' } },
      },
      orderBy: [{ category: { name: 'asc' } }, { lastName: 'asc' }],
    });

    const paidPayments = await prisma.payment.findMany({
      where: {
        students: { some: { id: { in: students.map((s) => s.id) } } },
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

    const now = new Date();
    return students.map((s) => {
      const paidUntil = paidUntilMap.get(s.id);
      const contact =
        s.parent ??
        s.guardians.find((g) => g.isPrimary) ??
        s.guardians[0];
      return {
        categoria: s.category.name,
        sucursal: s.branch.name,
        alumno: `${s.name} ${s.lastName}`,
        nacimiento: s.birthDate,
        padre: contact ? `${contact.name} ${contact.lastName}` : '—',
        telefonoPadre: contact?.phone ?? '—',
        mensualidadHasta: paidUntil ?? null,
        alDia: paidUntil ? paidUntil >= now : false,
        descuento: s.discountPercent ?? 0,
      };
    });
  }

  async getParentsContactsExport(
    search?: string,
    branchId?: string,
    categoryId?: string,
  ) {
    const prisma = this.prismaService.prisma;

    const guardians = await prisma.guardian.findMany({
      where: {
        isActive: true,
        ...(search
          ? {
              OR: [
                { phone: { contains: search } },
                { name: { contains: search, mode: 'insensitive' } },
                { lastName: { contains: search, mode: 'insensitive' } },
                { email: { contains: search, mode: 'insensitive' } },
              ],
            }
          : {}),
        student: {
          status: ACTIVE_STUDENT_STATUS,
          ...(branchId ? { branchId } : {}),
          ...(categoryId ? { categoryId } : {}),
        },
      },
      include: {
        student: { include: { category: true, branch: true } },
      },
      orderBy: [{ lastName: 'asc' }, { name: 'asc' }],
    });

    return guardians.map((g) => ({
      apoderado: `${g.name} ${g.lastName}`,
      telefono: g.phone ?? '—',
      email: g.email ?? '—',
      hijo: g.student ? `${g.student.name} ${g.student.lastName}` : '—',
      categoria: g.student?.category?.name ?? '—',
      sucursal: g.student?.branch?.name ?? '—',
      relacion: g.relationship,
      whatsapp: g.phone
        ? `https://wa.me/${g.phone.replace(/\D/g, '')}`
        : null,
    }));
  }

  async getPaymentsMembershipExport(params: {
    from?: string;
    to?: string;
    branchId?: string;
    categoryId?: string;
  }) {
    const prisma = this.prismaService.prisma;
    const from = params.from ? new Date(params.from) : undefined;
    const to = params.to ? new Date(params.to) : undefined;
    if (to) to.setHours(23, 59, 59, 999);

    const students = await prisma.student.findMany({
      where: {
        status: ACTIVE_STUDENT_STATUS,
        ...(params.branchId ? { branchId: params.branchId } : {}),
        ...(params.categoryId ? { categoryId: params.categoryId } : {}),
      },
      include: {
        category: true,
        branch: true,
        parent: true,
        guardians: { where: { isActive: true }, take: 1 },
      },
      orderBy: [
        { branch: { name: 'asc' } },
        { category: { name: 'asc' } },
        { lastName: 'asc' },
      ],
    });

    const ids = students.map((s) => s.id);
    const paidPayments = await prisma.payment.findMany({
      where: {
        students: { some: { id: { in: ids } } },
        status: PaymentStatus.PAID,
        expiresAt: { not: null },
        ...(from || to
          ? {
              paymentDate: {
                ...(from ? { gte: from } : {}),
                ...(to ? { lte: to } : {}),
              },
            }
          : {}),
      },
      select: {
        expiresAt: true,
        paymentDate: true,
        total: true,
        students: { select: { id: true } },
      },
      orderBy: { expiresAt: 'desc' },
    });

    const paidUntilMap = new Map<string, Date>();
    const lastPaymentMap = new Map<string, Date>();
    for (const payment of paidPayments) {
      if (!payment.expiresAt) continue;
      for (const st of payment.students) {
        const current = paidUntilMap.get(st.id);
        if (!current || payment.expiresAt > current) {
          paidUntilMap.set(st.id, payment.expiresAt);
          if (payment.paymentDate) {
            lastPaymentMap.set(st.id, payment.paymentDate);
          }
        }
      }
    }

    const now = new Date();
    return students.map((s) => {
      const paidUntil = paidUntilMap.get(s.id);
      const membership = getMembershipStatus(paidUntil, now);
      const contact = s.parent ?? s.guardians[0];
      return {
        sucursal: s.branch.name,
        categoria: s.category.name,
        alumno: `${s.name} ${s.lastName}`,
        apoderado: contact ? `${contact.name} ${contact.lastName}` : '—',
        telefono: contact?.phone ?? '—',
        estadoMensualidad: membership.label,
        vence: paidUntil ?? null,
        ultimoPago: lastPaymentMap.get(s.id) ?? null,
        alDia: membership.membershipActive,
      };
    });
  }
}

import { Injectable } from '@nestjs/common';
import { PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

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

    return teachers.map((t) => ({
      nombre: `${t.name} ${t.lastName}`,
      email: t.email,
      telefono: t.phone ?? t.teacherProfile?.phone ?? '—',
      asignaciones: t.teacherAssignments
        .map(
          (a) =>
            `${a.categoryShift?.category?.name ?? '?'} / ${a.categoryShift?.shift?.name ?? '?'} (${a.categoryShift?.branch?.name ?? '?'})`,
        )
        .join('; ') || 'Sin asignación',
    }));
  }

  async getCategoriesStudentsExport(categoryId?: string) {
    const prisma = this.prismaService.prisma;
    const students = await prisma.student.findMany({
      where: {
        status: ACTIVE_STUDENT_STATUS,
        ...(categoryId ? { categoryId } : {}),
      },
      include: {
        category: true,
        branch: true,
        parent: true,
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
      return {
        categoria: s.category.name,
        sucursal: s.branch.name,
        alumno: `${s.name} ${s.lastName}`,
        nacimiento: s.birthDate,
        padre: `${s.parent.name} ${s.parent.lastName}`,
        telefonoPadre: s.parent.phone ?? '—',
        mensualidadHasta: paidUntil ?? null,
        alDia: paidUntil ? paidUntil >= now : false,
        descuento: s.discountPercent ?? 0,
      };
    });
  }

  async getParentsContactsExport(search?: string) {
    const prisma = this.prismaService.prisma;
    const parents = await prisma.user.findMany({
      where: {
        role: 'PARENT',
        status: 'ACTIVE',
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
      },
      include: {
        children: {
          where: { status: ACTIVE_STUDENT_STATUS },
          include: { category: true },
        },
      },
      orderBy: { lastName: 'asc' },
    });

    return parents.map((p) => ({
      nombre: `${p.name} ${p.lastName}`,
      email: p.email,
      telefono: p.phone ?? '—',
      whatsapp: p.phone
        ? `https://wa.me/${p.phone.replace(/\D/g, '')}`
        : null,
      hijos: p.children
        .map((s) => `${s.name} ${s.lastName} (${s.category.name})`)
        .join('; '),
    }));
  }
}

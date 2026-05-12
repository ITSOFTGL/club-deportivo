import { PrismaClient, UserRole, UserStatus, CategoryType, Gender, BloodType, GuardianRelationship } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

// Prisma 7 requiere el adaptador
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log('🌱 Sembrando datos de prueba...\n');

  const hashedPassword = await bcrypt.hash('123456', 10);

  // ============================================
  // 1. USUARIOS
  // ============================================
  console.log('📋 Creando usuarios...');

  const superAdmin = await prisma.user.upsert({
    where: { email: 'superadmin@club.com' },
    update: {},
    create: {
      email: 'superadmin@club.com',
      name: 'Juan',
      lastName: 'Pérez',
      password: hashedPassword,
      role: UserRole.SUPER_ADMIN,
      status: UserStatus.ACTIVE,
      approvalStatus: 'APPROVED',
      emailVerified: true,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@club.com' },
    update: {},
    create: {
      email: 'admin@club.com',
      name: 'María',
      lastName: 'López',
      password: hashedPassword,
      role: UserRole.ADMIN,
      status: UserStatus.ACTIVE,
      approvalStatus: 'APPROVED',
      emailVerified: true,
    },
  });

  const teacher = await prisma.user.upsert({
    where: { email: 'profesor@club.com' },
    update: {},
    create: {
      email: 'profesor@club.com',
      name: 'Carlos',
      lastName: 'Gómez',
      password: hashedPassword,
      role: UserRole.TEACHER,
      status: UserStatus.ACTIVE,
      approvalStatus: 'APPROVED',
      emailVerified: true,
    },
  });

  const collector = await prisma.user.upsert({
    where: { email: 'cobrador@club.com' },
    update: {},
    create: {
      email: 'cobrador@club.com',
      name: 'Ana',
      lastName: 'Martínez',
      password: hashedPassword,
      role: UserRole.COLLECTOR,
      status: UserStatus.ACTIVE,
      approvalStatus: 'APPROVED',
      emailVerified: true,
    },
  });

  const parent = await prisma.user.upsert({
    where: { email: 'padre@club.com' },
    update: {},
    create: {
      email: 'padre@club.com',
      name: 'Pedro',
      lastName: 'Rodríguez',
      password: hashedPassword,
      role: UserRole.PARENT,
      status: UserStatus.ACTIVE,
      approvalStatus: 'APPROVED',
      emailVerified: true,
    },
  });

  console.log('✅ Usuarios creados');

  // ============================================
  // 2. SUCURSALES
  // ============================================
  console.log('\n📋 Creando sucursales...');

  const branchCentral = await prisma.branch.upsert({
    where: { name: 'Sede Central' },
    update: {},
    create: {
      name: 'Sede Central',
      location: 'Av. Principal 123',
      phone: '591-1234567',
      email: 'central@club.com',
      schedule: 'Lun a Vie 8:00 - 20:00',
      isActive: true,
    },
  });

  const branchNorth = await prisma.branch.upsert({
    where: { name: 'Sede Norte' },
    update: {},
    create: {
      name: 'Sede Norte',
      location: 'Calle Los Pinos 456',
      phone: '591-7654321',
      email: 'norte@club.com',
      schedule: 'Lun a Vie 9:00 - 21:00',
      isActive: true,
    },
  });

  console.log('✅ Sucursales creadas');

  // ============================================
  // 3. CATEGORÍAS
  // ============================================
  console.log('\n📋 Creando categorías...');

  const sub6 = await prisma.category.upsert({
    where: { name: 'Sub 6' },
    update: {},
    create: {
      name: 'Sub 6',
      description: 'Categoría para niños de 5-6 años',
      type: CategoryType.SPORT,
      monthlyPrice: 200,
      maxCapacity: 15,
      minAge: 5,
      maxAge: 6,
      isActive: true,
      branchId: branchCentral.id,
    },
  });

  const sub7 = await prisma.category.upsert({
    where: { name: 'Sub 7' },
    update: {},
    create: {
      name: 'Sub 7',
      description: 'Categoría para niños de 6-7 años',
      type: CategoryType.SPORT,
      monthlyPrice: 200,
      maxCapacity: 15,
      minAge: 6,
      maxAge: 7,
      isActive: true,
      branchId: branchCentral.id,
    },
  });

  console.log('✅ Categorías creadas');

  // ============================================
  // 4. TURNOS BASE
  // ============================================
  console.log('\n📋 Creando turnos base...');

  let morningShift = await prisma.shift.findFirst({ where: { name: 'MAÑANA' } });
  if (!morningShift) {
    morningShift = await prisma.shift.create({
      data: {
        name: 'MAÑANA',
        startTime: '08:00',
        endTime: '12:00',
        isActive: true,
      },
    });
  }

  let afternoonShift = await prisma.shift.findFirst({ where: { name: 'TARDE' } });
  if (!afternoonShift) {
    afternoonShift = await prisma.shift.create({
      data: {
        name: 'TARDE',
        startTime: '14:00',
        endTime: '18:00',
        isActive: true,
      },
    });
  }

  console.log('✅ Turnos base creados');

  // ============================================
  // 5. CATEGORY_SHIFTS
  // ============================================
  console.log('\n📋 Creando turnos por categoría...');

  const categoryShiftSub6 = await prisma.categoryShift.create({
    data: {
      categoryId: sub6.id,
      branchId: branchCentral.id,
      shiftId: afternoonShift.id,
      name: 'Sub 6 - Sede Central - Tarde',
      startTime: '16:00',
      endTime: '17:00',
      daysOfWeek: 'LUNES,MIERCOLES,VIERNES',
      totalCapacity: 15,
      monthlyPrice: 200,
      enrollmentStart: new Date(),
      enrollmentEnd: new Date('2025-12-31'),
      isActive: true,
    },
  });

  console.log('✅ Turnos por categoría creados');

  // ============================================
  // 6. ESTUDIANTE (hijo del padre)
  // ============================================
  console.log('\n📋 Creando estudiante...');

  const student = await prisma.student.create({
    data: {
      name: 'Luis',
      lastName: 'Rodríguez',
      birthDate: new Date('2018-05-15'),
      gender: Gender.MASCULINO,
      weight: 25,
      height: 120,
      bloodType: BloodType.O_POSITIVE,
      emergencyContact: 'María López',
      emergencyPhone: '789456123',
      school: 'San Agustín',
      status: 'ACTIVE',
      parentId: parent.id,
      branchId: branchCentral.id,
      categoryId: sub6.id,
    },
  });

  console.log('✅ Estudiante creado');

  // ============================================
  // 7. APODERADO (GUARDIAN)
  // ============================================
  console.log('\n📋 Creando apoderado...');

  await prisma.guardian.create({
    data: {
      studentId: student.id,
      name: 'María',
      lastName: 'López',
      documentId: '87654321',
      phone: '789456123',
      email: 'maria@example.com',
      relationship: GuardianRelationship.MADRE,
      isPrimary: true,
    },
  });

  console.log('✅ Apoderado creado');

  // ============================================
  // 8. INSCRIPCIÓN
  // ============================================
  console.log('\n📋 Inscribiendo estudiante...');

  await prisma.enrollment.create({
    data: {
      studentId: student.id,
      categoryShiftId: categoryShiftSub6.id,
      status: 'ENROLLED',
      startDate: new Date(),
      enrolledBy: parent.id,
    },
  });

  console.log('✅ Estudiante inscrito');

  // ============================================
  // 9. PRODUCTOS (Uniformes)
  // ============================================
  console.log('\n📋 Creando productos...');

  await prisma.product.createMany({
    data: [
      {
        name: 'Camiseta Titular 2024',
        sku: 'UNI-CAM-TIT-001',
        productType: 'UNIFORM',
        price: 150,
        stock: 50,
        minStock: 10,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['ROJO', 'BLANCO'],
        isActive: true,
        branchId: branchCentral.id,
      },
      {
        name: 'Short Deportivo',
        sku: 'UNI-SHO-001',
        productType: 'UNIFORM',
        price: 80,
        stock: 100,
        minStock: 20,
        sizes: ['S', 'M', 'L', 'XL'],
        colors: ['NEGRO', 'AZUL'],
        isActive: true,
        branchId: branchCentral.id,
      },
    ],
  });

  console.log('✅ Productos creados');

  // ============================================
  // RESUMEN
  // ============================================
  console.log('\n' + '='.repeat(50));
  console.log('🎉 SEED COMPLETADO EXITOSAMENTE!');
  console.log('='.repeat(50));
  console.log('\n📋 CREDENCIALES DE PRUEBA:');
  console.log('  🔑 superadmin@club.com / 123456');
  console.log('  🔑 admin@club.com / 123456');
  console.log('  🔑 profesor@club.com / 123456');
  console.log('  🔑 cobrador@club.com / 123456');
  console.log('  🔑 padre@club.com / 123456');
  console.log('\n📊 DATOS CREADOS:');
  console.log(`  👥 Usuarios: 5`);
  console.log(`  🏢 Sucursales: 2`);
  console.log(`  🏅 Categorías: 2`);
  console.log(`  🕐 Turnos: 2`);
  console.log(`  🧒 Estudiantes: 1`);
  console.log(`  👩 Apoderados: 1`);
  console.log(`  🎽 Productos: 2`);
  console.log('='.repeat(50));
}

main()
  .catch((e) => {
    console.error('❌ Error en seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
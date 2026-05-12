import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { BranchesModule } from './branches/branches.module';
import { CategoriesModule } from './categories/categories.module';
import { ShiftsModule } from './shifts/shifts.module';
import { CategoryShiftsModule } from './category-shifts/category-shifts.module';
import { TeacherAssignmentsModule } from './teacher-assignments/teacher-assignments.module';
import { TeacherProfilesModule } from './teacher-profiles/teacher-profiles.module';
import { StudentsModule } from './students/students.module';
import { GuardiansModule } from './guardians/guardians.module';
import { StudentDocumentsModule } from './student-documents/student-documents.module';
import { EnrollmentsModule } from './enrollments/enrollments.module';
import { PaymentsModule } from './payments/payments.module';
import { PaymentPlansModule } from './payment-plans/payment-plans.module';
import { AttendancesModule } from './attendances/attendances.module';
import { EventsModule } from './events/events.module';
import { EventRegistrationsModule } from './event-registrations/event-registrations.module';
import { ProductsModule } from './products/products.module';
import { OrdersModule } from './orders/orders.module';
import { ChatModule } from './chat/chat.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MetricsModule } from './metrics/metrics.module';
import { ReportsModule } from './reports/reports.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AuthModule,
    UsersModule,
    BranchesModule,
    CategoriesModule,
    ShiftsModule,
    CategoryShiftsModule,
    TeacherAssignmentsModule,
    TeacherProfilesModule,
    StudentsModule,
    GuardiansModule,
    StudentDocumentsModule,
    EnrollmentsModule,
    PaymentsModule,
    PaymentPlansModule,
    AttendancesModule,
    EventsModule,
    EventRegistrationsModule,
    ProductsModule,
    OrdersModule,
    ChatModule,
    NotificationsModule,
    MetricsModule,
    ReportsModule,
  ],
})
export class AppModule {}
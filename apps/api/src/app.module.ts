import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD, APP_INTERCEPTOR, APP_FILTER } from '@nestjs/core';

import { PrismaModule } from './prisma/prisma.module';
import { MailModule } from './modules/mail/mail.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { TenantsModule } from './modules/tenants/tenants.module';
import { StoresModule } from './modules/stores/stores.module';
import { ProductsModule } from './modules/products/products.module';
import { PosModule } from './modules/pos/pos.module';
import { AuditModule } from './modules/audit/audit.module';
import { ReportsModule } from './modules/reports/reports.module';
import { ModifiersModule } from './modules/modifiers/modifiers.module';
import { CustomersModule } from './modules/customers/customers.module';
import { DiscountsModule } from './modules/discounts/discounts.module';
import { TablesModule } from './modules/tables/tables.module';

import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { TenantThrottlerGuard } from './common/guards/tenant-throttler.guard';
import { AuditLogInterceptor } from './common/interceptors/audit-log.interceptor';
import { TransformResponseInterceptor } from './common/interceptors/transform-response.interceptor';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaExceptionFilter } from './common/filters/prisma-exception.filter';
import { TenantMiddleware } from './common/middleware/tenant.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Por usuario y minuto. Cada página del dashboard dispara ~8 peticiones.
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 200 }]),
    PrismaModule,
    MailModule,
    AuthModule,
    UsersModule,
    TenantsModule,
    StoresModule,
    ProductsModule,
    PosModule,
    AuditModule,
    ReportsModule,
    ModifiersModule,
    CustomersModule,
    DiscountsModule,
    TablesModule,
  ],
  providers: [
    // Guards globales
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: TenantThrottlerGuard },
    // Interceptors globales
    { provide: APP_INTERCEPTOR, useClass: TransformResponseInterceptor },
    { provide: APP_INTERCEPTOR, useClass: AuditLogInterceptor },
    // Filtros globales
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    { provide: APP_FILTER, useClass: PrismaExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}

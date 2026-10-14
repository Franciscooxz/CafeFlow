import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ReportsService } from './reports.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Reports')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Roles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN)
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'KPIs principales del dashboard' })
  getDashboard(@CurrentUser() user: any) {
    return this.reportsService.getDashboard(user.tenantId);
  }

  @Get('sales-trend')
  @ApiOperation({ summary: 'Tendencia de ventas por día' })
  @ApiQuery({ name: 'days', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false, type: String, description: 'YYYY-MM-DD' })
  @ApiQuery({ name: 'to', required: false, type: String, description: 'YYYY-MM-DD' })
  getSalesTrend(
    @CurrentUser() user: any,
    @Query('days') days?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getSalesTrend(
      user.tenantId,
      days ? parseInt(days) : 7,
      from,
      to,
    );
  }

  @Get('top-products')
  @ApiOperation({ summary: 'Productos más vendidos' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getTopProducts(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getTopProducts(
      user.tenantId,
      limit ? parseInt(limit) : 8,
      from,
      to,
    );
  }

  @Get('by-category')
  @ApiOperation({ summary: 'Ventas por categoría' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getSalesByCategory(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getSalesByCategory(user.tenantId, from, to);
  }

  @Get('payment-stats')
  @ApiOperation({ summary: 'Desglose por método de pago' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getPaymentStats(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getPaymentStats(user.tenantId, from, to);
  }

  @Get('recent-orders')
  @ApiOperation({ summary: 'Últimas ventas' })
  @ApiQuery({ name: 'limit', required: false })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getRecentOrders(
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getRecentOrders(
      user.tenantId,
      limit ? parseInt(limit) : 10,
      from,
      to,
    );
  }

  @Get('summary')
  @ApiOperation({ summary: 'Resumen completo para página de reportes (con date range)' })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  getRangeSummary(
    @CurrentUser() user: any,
    @Query('from') from?: string,
    @Query('to') to?: string,
  ) {
    return this.reportsService.getRangeSummary(user.tenantId, from, to);
  }
}

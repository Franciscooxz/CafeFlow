import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { PosService } from './pos.service';
import { PosGateway } from './pos.gateway';
import { toKdsOrder } from './kds.mapper';
import { CreateOrderDto, UpdateFulfillmentDto } from './dto/create-order.dto';
import { OpenShiftDto, CloseShiftDto } from './dto/open-shift.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('POS')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('pos')
export class PosController {
  constructor(
    private readonly posService: PosService,
    private readonly posGateway: PosGateway,
  ) {}

  // ─── SHIFTS ───────────────────────────────────────────────────────────────

  @Post('shifts/open')
  @Roles(Role.CASHIER, Role.MANAGER, Role.OWNER)
  @ApiOperation({ summary: 'Abrir turno' })
  async openShift(@Body() dto: OpenShiftDto, @CurrentUser() user: any) {
    return this.posService.openShift(dto, user.id, user.tenantId);
  }

  @Post('shifts/:id/close')
  @Roles(Role.CASHIER, Role.MANAGER, Role.OWNER)
  @ApiOperation({ summary: 'Cerrar turno' })
  async closeShift(
    @Param('id') id: string,
    @Body() dto: CloseShiftDto,
    @CurrentUser() user: any,
  ) {
    return this.posService.closeShift(id, dto, user.id, user.tenantId);
  }

  @Get('shifts/current')
  @Roles(Role.CASHIER, Role.MANAGER, Role.OWNER)
  @ApiOperation({ summary: 'Obtener turno actual' })
  getCurrentShift(@CurrentUser() user: any) {
    return this.posService.getCurrentShift(user.id, user.tenantId);
  }

  @Get('shifts/:id/orders')
  @Roles(Role.CASHIER, Role.MANAGER, Role.OWNER)
  getOrdersByShift(@Param('id') id: string, @CurrentUser() user: any) {
    return this.posService.getOrdersByShift(id, user.tenantId);
  }

  // ─── ORDERS ───────────────────────────────────────────────────────────────

  @Post('orders')
  @Roles(Role.CASHIER, Role.MANAGER, Role.OWNER)
  @ApiOperation({ summary: 'Crear orden / venta' })
  async createOrder(@Body() dto: CreateOrderDto, @CurrentUser() user: any) {
    const { order, stockUpdates } = await this.posService.createOrder(
      dto,
      user.id,
      user.tenantId,
    );

    this.posGateway.emitOrderCreated(user.tenantId, toKdsOrder(order));
    this.posGateway.emitStockUpdated(
      user.tenantId,
      stockUpdates.map(({ id, name, stock }) => ({ id, name, stock })),
    );
    for (const { id, name, stock, isLow } of stockUpdates) {
      if (isLow) this.posGateway.emitLowStockAlert(user.tenantId, { id, name, stock });
    }

    return order;
  }

  @Post('orders/:id/cancel')
  @Roles(Role.CASHIER, Role.MANAGER, Role.OWNER)
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Cancelar orden' })
  async cancelOrder(
    @Param('id') id: string,
    @Body('reason') reason: string,
    @CurrentUser() user: any,
  ) {
    const order = await this.posService.cancelOrder(id, user, user.tenantId, reason);
    this.posGateway.emitOrderCancelled(user.tenantId, { id: order.id, storeId: order.storeId });
    return order;
  }

  @Patch('orders/:id/fulfillment')
  @Roles(Role.CASHIER, Role.MANAGER, Role.OWNER)
  @ApiOperation({ summary: 'Cambiar estado en barra: recibido, en preparación, listo, entregado' })
  async updateFulfillment(
    @Param('id') id: string,
    @Body() dto: UpdateFulfillmentDto,
    @CurrentUser() user: any,
  ) {
    const order = await this.posService.updateFulfillment(id, dto.status, user.id, user.tenantId);
    this.posGateway.emitOrderStatus(user.tenantId, order);
    return order;
  }

  @Get('stock-alerts')
  @Roles(Role.CASHIER, Role.MANAGER, Role.OWNER)
  @ApiOperation({ summary: 'Alertas de stock bajo' })
  getStockAlerts(@CurrentUser() user: any) {
    return this.posService.getStockAlerts(user.tenantId);
  }

  // ─── KDS ──────────────────────────────────────────────────────────────────

  @Get('kds')
  @Roles(Role.CASHIER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Órdenes recientes para Kitchen Display System' })
  getKdsOrders(
    @CurrentUser() user: any,
    @Query('storeId') storeId?: string,
    @Query('hours') hours?: string,
  ) {
    const sid = storeId ?? user.storeId;
    return this.posService.getKdsOrders(sid, user.tenantId, hours ? parseInt(hours) : 4);
  }

  @Get('low-stock-count')
  @Roles(Role.CASHIER, Role.MANAGER, Role.OWNER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Conteo de productos con stock bajo' })
  getLowStockCount(@CurrentUser() user: any) {
    return this.posService.getLowStockCount(user.tenantId);
  }
}

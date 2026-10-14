import { Controller, Get, Post, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { DiscountsService } from './discounts.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, DiscountType } from '@prisma/client';

@ApiTags('Discounts')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('discounts')
export class DiscountsController {
  constructor(private readonly discountsService: DiscountsService) {}

  @Get()
  @Roles(Role.OWNER, Role.MANAGER, Role.SUPER_ADMIN)
  findAll(@CurrentUser() user: any) {
    return this.discountsService.findAll(user.tenantId);
  }

  @Post()
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Crear código de descuento' })
  create(
    @Body()
    body: {
      code: string;
      type: DiscountType;
      value: number;
      minOrder?: number;
      maxUses?: number;
      expiresAt?: string;
    },
    @CurrentUser() user: any,
  ) {
    return this.discountsService.create(user.tenantId, body);
  }

  @Patch(':id/toggle')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Activar/desactivar código de descuento' })
  toggle(@Param('id') id: string, @CurrentUser() user: any) {
    return this.discountsService.toggle(id, user.tenantId);
  }

  @Post('validate')
  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Validar código de descuento en POS' })
  validate(
    @Body() body: { code: string; orderTotal: number; storeId?: string },
    @CurrentUser() user: any,
  ) {
    return this.discountsService.validate(
      user.tenantId,
      body.code,
      body.orderTotal,
      body.storeId,
    );
  }
}

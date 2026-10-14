import { Controller, Get, Post, Put, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { CustomersService } from './customers.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Customers')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('customers')
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Get()
  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  findAll(@CurrentUser() user: any) {
    return this.customersService.findAll(user.tenantId);
  }

  @Get('search')
  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @ApiOperation({ summary: 'Buscar cliente por nombre/telefono/email' })
  search(@Query('q') q: string, @CurrentUser() user: any) {
    return this.customersService.search(user.tenantId, q ?? '');
  }

  @Post()
  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  create(
    @Body() body: { name: string; phone?: string; email?: string },
    @CurrentUser() user: any,
  ) {
    return this.customersService.create(user.tenantId, body);
  }

  @Put(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() body: { name?: string; phone?: string; email?: string },
    @CurrentUser() user: any,
  ) {
    return this.customersService.update(id, user.tenantId, body);
  }

  @Get(':id/orders')
  @Roles(Role.OWNER, Role.MANAGER)
  getOrders(@Param('id') id: string, @CurrentUser() user: any) {
    return this.customersService.getOrders(id, user.tenantId);
  }
}

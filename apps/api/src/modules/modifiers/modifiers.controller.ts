import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { ModifiersService } from './modifiers.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Modifiers')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('modifiers')
export class ModifiersController {
  constructor(private readonly modifiersService: ModifiersService) {}

  @Get()
  @ApiOperation({ summary: 'Listar grupos de modificadores' })
  findAll(@CurrentUser() user: any) {
    return this.modifiersService.findAll(user.tenantId);
  }

  @Post()
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Crear grupo de modificadores' })
  createGroup(
    @Body() body: { name: string; required?: boolean; multiSelect?: boolean; sortOrder?: number },
    @CurrentUser() user: any,
  ) {
    return this.modifiersService.createGroup(user.tenantId, body);
  }

  @Put(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Actualizar grupo' })
  updateGroup(
    @Param('id') id: string,
    @Body() body: { name?: string; required?: boolean; multiSelect?: boolean; sortOrder?: number },
    @CurrentUser() user: any,
  ) {
    return this.modifiersService.updateGroup(id, user.tenantId, body);
  }

  @Patch(':id/toggle')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Activar/desactivar grupo' })
  toggleGroup(@Param('id') id: string, @CurrentUser() user: any) {
    return this.modifiersService.toggleGroup(id, user.tenantId);
  }

  @Post(':id/items')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Agregar modificador al grupo' })
  addItem(
    @Param('id') groupId: string,
    @Body() body: { name: string; priceAdjustment?: number },
    @CurrentUser() user: any,
  ) {
    return this.modifiersService.addItem(groupId, user.tenantId, body);
  }

  @Put(':groupId/items/:itemId')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Actualizar modificador' })
  updateItem(
    @Param('groupId') groupId: string,
    @Param('itemId') itemId: string,
    @Body() body: { name?: string; priceAdjustment?: number },
    @CurrentUser() user: any,
  ) {
    return this.modifiersService.updateItem(groupId, itemId, user.tenantId, body);
  }

  @Patch(':groupId/items/:itemId/toggle')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Activar/desactivar modificador' })
  toggleItem(
    @Param('groupId') groupId: string,
    @Param('itemId') itemId: string,
    @CurrentUser() user: any,
  ) {
    return this.modifiersService.toggleItem(groupId, itemId, user.tenantId);
  }

  @Put('products/:productId/assign')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Asignar grupos de modificadores a un producto' })
  assignToProduct(
    @Param('productId') productId: string,
    @Body('groupIds') groupIds: string[],
    @CurrentUser() user: any,
  ) {
    return this.modifiersService.assignGroupsToProduct(productId, user.tenantId, groupIds);
  }

  @Get('products/:productId')
  @ApiOperation({ summary: 'Obtener grupos de modificadores de un producto' })
  getProductGroups(@Param('productId') productId: string, @CurrentUser() user: any) {
    return this.modifiersService.getProductModifierGroups(productId, user.tenantId);
  }
}

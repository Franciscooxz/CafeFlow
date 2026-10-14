import { Controller, Get, Post, Body, Param, Put, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { StoresService } from './stores.service';
import { CreateStoreDto } from './dto/create-store.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Stores')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('stores')
export class StoresController {
  constructor(private readonly storesService: StoresService) {}

  @Post()
  @Roles(Role.OWNER, Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear sede' })
  create(@Body() dto: CreateStoreDto, @CurrentUser() user: any) {
    return this.storesService.create(dto, user.tenantId);
  }

  @Get()
  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  findAll(@CurrentUser() user: any) {
    return this.storesService.findAll(user.tenantId);
  }

  @Get(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.storesService.findOne(id, user.tenantId);
  }

  @Put(':id')
  @Roles(Role.OWNER)
  update(
    @Param('id') id: string,
    @Body() dto: CreateStoreDto,
    @CurrentUser() user: any,
  ) {
    return this.storesService.update(id, user.tenantId, dto);
  }
}

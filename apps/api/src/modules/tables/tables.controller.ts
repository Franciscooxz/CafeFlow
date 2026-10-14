import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TablesService } from './tables.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role, TableStatus } from '@prisma/client';

@ApiTags('Tables')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('tables')
export class TablesController {
  constructor(private readonly tablesService: TablesService) {}

  @Get()
  @ApiOperation({ summary: 'Listar mesas' })
  findAll(@CurrentUser() user: any, @Query('storeId') storeId?: string) {
    return this.tablesService.findAll(user.tenantId, storeId ?? user.storeId);
  }

  @Post()
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Crear mesa' })
  create(
    @Body() dto: { storeId: string; number: number; name?: string; capacity?: number; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.tablesService.create(user.tenantId, dto);
  }

  @Patch(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Actualizar mesa' })
  update(
    @Param('id') id: string,
    @Body() dto: { name?: string; capacity?: number; notes?: string },
    @CurrentUser() user: any,
  ) {
    return this.tablesService.update(id, user.tenantId, dto);
  }

  @Patch(':id/status')
  @Roles(Role.CASHIER, Role.MANAGER, Role.OWNER)
  @ApiOperation({ summary: 'Cambiar estado de mesa' })
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: TableStatus,
    @CurrentUser() user: any,
  ) {
    return this.tablesService.updateStatus(id, user.tenantId, status);
  }

  @Delete(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Eliminar mesa' })
  remove(@Param('id') id: string, @CurrentUser() user: any) {
    return this.tablesService.remove(id, user.tenantId);
  }
}

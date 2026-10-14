import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Patch,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { TenantsService } from './tenants.service';
import { CreateTenantDto } from './dto/create-tenant.dto';
import { UpdateBrandingDto } from './dto/update-branding.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Role } from '@prisma/client';

@ApiTags('Tenants')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('tenants')
export class TenantsController {
  constructor(private readonly tenantsService: TenantsService) {}

  @Post()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Crear empresa (solo Super Admin)' })
  create(
    @Body() dto: CreateTenantDto & { ownerEmail: string; ownerPassword: string },
  ) {
    return this.tenantsService.create(dto, dto.ownerEmail, dto.ownerPassword);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN)
  @ApiOperation({ summary: 'Listar todas las empresas' })
  findAll() {
    return this.tenantsService.findAll();
  }

  @Get('me/branding')
  @ApiOperation({ summary: 'Marca del negocio actual (color y logo)' })
  getBranding(@CurrentUser() user: any) {
    return this.tenantsService.getBranding(user.tenantId);
  }

  @Put('me/branding')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Actualizar color de marca y logo. null elimina el valor' })
  updateBranding(@Body() dto: UpdateBrandingDto, @CurrentUser() user: any) {
    return this.tenantsService.updateBranding(user.tenantId, dto);
  }

  @Patch('me/onboarding-complete')
  @Roles(Role.OWNER)
  @ApiOperation({ summary: 'Marcar el onboarding del negocio actual como completado' })
  completeOnboarding(@CurrentUser() user: any) {
    return this.tenantsService.completeOnboarding(user.tenantId);
  }

  @Get(':id')
  @Roles(Role.SUPER_ADMIN, Role.OWNER)
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    // 404 y no 403: no revelar si existe un negocio ajeno con ese id.
    if (user.role !== Role.SUPER_ADMIN && user.tenantId !== id) {
      throw new NotFoundException('Tenant no encontrado');
    }
    return this.tenantsService.findOne(id);
  }
}

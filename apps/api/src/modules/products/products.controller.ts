import {
  Controller,
  Get,
  Post,
  Put,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { CreateProductDto } from './dto/create-product.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Role } from '@prisma/client';

@ApiTags('Products')
@ApiBearerAuth()
@UseGuards(RolesGuard)
@Controller('products')
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  // ─── Categorías (rutas estáticas PRIMERO para evitar conflicto con :id) ───

  @Get('categories')
  findCategories(@CurrentUser() user: any) {
    return this.productsService.findCategories(user.tenantId);
  }

  @Post('categories')
  @Roles(Role.OWNER, Role.MANAGER)
  createCategory(
    @Body() body: { name: string; color?: string; sortOrder?: number },
    @CurrentUser() user: any,
  ) {
    return this.productsService.createCategory(
      user.tenantId,
      body.name,
      body.color,
      body.sortOrder,
    );
  }

  @Put('categories/:id')
  @Roles(Role.OWNER, Role.MANAGER)
  updateCategory(
    @Param('id') id: string,
    @Body() body: { name?: string; color?: string; sortOrder?: number },
    @CurrentUser() user: any,
  ) {
    return this.productsService.updateCategory(id, user.tenantId, body);
  }

  @Patch('categories/:id/toggle')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Activar/desactivar categoría' })
  toggleCategory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.toggleCategoryActive(id, user.tenantId);
  }

  // ─── Productos ─────────────────────────────────────────────────────────────

  @Post()
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Crear producto' })
  create(@Body() dto: CreateProductDto, @CurrentUser() user: any) {
    return this.productsService.create(dto, user.tenantId);
  }

  @Post('bulk')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Importar productos en masa' })
  bulkCreate(
    @Body('items') items: Partial<CreateProductDto>[],
    @CurrentUser() user: any,
  ) {
    return this.productsService.bulkCreate(items, user.tenantId);
  }

  @Get()
  @ApiQuery({ name: 'active', required: false, type: Boolean })
  findAll(@CurrentUser() user: any, @Query('active') active?: string) {
    return this.productsService.findAll(user.tenantId, active === 'true');
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.findOne(id, user.tenantId);
  }

  @Get(':id/stock-movements')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Historial de movimientos de stock' })
  getStockMovements(
    @Param('id') id: string,
    @CurrentUser() user: any,
    @Query('limit') limit?: string,
  ) {
    return this.productsService.getStockMovements(
      id,
      user.tenantId,
      limit ? parseInt(limit) : 20,
    );
  }

  @Get(':id/history')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Historial de auditoría del producto' })
  getHistory(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.getProductHistory(id, user.tenantId);
  }

  @Put(':id')
  @Roles(Role.OWNER, Role.MANAGER)
  update(
    @Param('id') id: string,
    @Body() dto: Partial<CreateProductDto>,
    @CurrentUser() user: any,
  ) {
    return this.productsService.update(id, user.tenantId, dto);
  }

  @Patch(':id/toggle')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Activar/desactivar producto' })
  toggleActive(@Param('id') id: string, @CurrentUser() user: any) {
    return this.productsService.toggleProductActive(id, user.tenantId);
  }

  @Patch(':id/stock')
  @Roles(Role.OWNER, Role.MANAGER)
  @ApiOperation({ summary: 'Ajustar stock manualmente' })
  adjustStock(
    @Param('id') id: string,
    @Body('adjustment') adjustment: number,
    @Body('notes') notes: string,
    @CurrentUser() user: any,
  ) {
    return this.productsService.adjustStock(id, user.tenantId, adjustment, user.id, notes);
  }
}

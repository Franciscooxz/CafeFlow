import {
  IsArray,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FulfillmentStatus, PaymentMethod } from '@prisma/client';

export class OrderItemDto {
  @ApiProperty()
  @IsString()
  productId: string;

  @ApiProperty({ example: 2 })
  @IsNumber()
  @Min(0.001)
  quantity: number;

  @ApiPropertyOptional({ type: [String] })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  modifierIds?: string[];
}

export class CreateOrderDto {
  @ApiProperty({ example: 'store-demo-1' })
  @IsString()
  storeId: string;

  @ApiProperty({ example: 'shift-id-here' })
  @IsString()
  shiftId: string;

  @ApiProperty({ type: [OrderItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  @ApiProperty({ enum: PaymentMethod })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cashReceived?: number;

  @ApiPropertyOptional({ example: 20000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  cardAmount?: number;

  @ApiPropertyOptional({ example: 'CAFE10' })
  @IsOptional()
  @IsString()
  discountCode?: string;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  discountAmount?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  customerId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  tableId?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;

  @ApiPropertyOptional({ example: 'Ana', description: 'Nombre para llamar al cliente en barra' })
  @IsOptional()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(40)
  callName?: string;
}

export class UpdateFulfillmentDto {
  @ApiProperty({ enum: FulfillmentStatus })
  @IsEnum(FulfillmentStatus)
  status: FulfillmentStatus;
}

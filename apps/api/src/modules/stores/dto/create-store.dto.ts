import { IsString, IsOptional, IsNumber, IsIn, Min, Max } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SUPPORTED_CURRENCIES, SUPPORTED_TIMEZONES } from '../../../common/currency';

export class CreateStoreDto {
  @ApiProperty({ example: 'Sucursal Centro' })
  @IsString()
  name: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  address?: string;

  @ApiPropertyOptional({ example: 'COP', enum: SUPPORTED_CURRENCIES })
  @IsOptional()
  @IsIn(SUPPORTED_CURRENCIES, { message: `currency debe ser una de: ${SUPPORTED_CURRENCIES.join(', ')}` })
  currency?: string;

  @ApiPropertyOptional({ example: 0.19 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  taxRate?: number;

  // Se valida contra una lista cerrada porque el valor llega a AT TIME ZONE en
  // las consultas de reportes.
  @ApiPropertyOptional({ example: 'America/Bogota', enum: SUPPORTED_TIMEZONES })
  @IsOptional()
  @IsIn(SUPPORTED_TIMEZONES, {
    message: `timezone debe ser una de: ${SUPPORTED_TIMEZONES.join(', ')}`,
  })
  timezone?: string;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  phone?: string;
}

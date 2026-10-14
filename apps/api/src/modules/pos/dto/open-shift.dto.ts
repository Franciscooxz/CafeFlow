import { IsNumber, IsString, IsOptional, Min } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class OpenShiftDto {
  @ApiProperty({ example: 'store-demo-1' })
  @IsString()
  storeId: string;

  @ApiPropertyOptional({ example: 50000 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  openingCash?: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

export class CloseShiftDto {
  @ApiProperty({ example: 120000 })
  @IsNumber()
  @Min(0)
  closingCash: number;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  notes?: string;
}

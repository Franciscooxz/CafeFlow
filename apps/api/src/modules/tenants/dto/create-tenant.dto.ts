import { IsString, MinLength, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateTenantDto {
  @ApiProperty({ example: 'Mi Café Tokio' })
  @IsString()
  @MinLength(2)
  name: string;

  @ApiProperty({ example: 'mi-cafe-tokio' })
  @IsString()
  @Matches(/^[a-z0-9-]+$/, { message: 'El slug solo puede contener letras minúsculas, números y guiones' })
  slug: string;
}

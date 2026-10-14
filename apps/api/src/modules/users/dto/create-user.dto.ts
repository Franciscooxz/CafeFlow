import { IsEmail, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '@prisma/client';

export class CreateUserDto {
  @ApiProperty({ example: 'ana@demo-cafe.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'Ana' })
  @IsString()
  firstName: string;

  @ApiProperty({ example: 'López' })
  @IsString()
  lastName: string;

  @ApiProperty({ example: 'password123' })
  @IsString()
  @MinLength(6)
  password: string;

  @ApiProperty({ enum: Role, example: Role.CASHIER })
  @IsEnum(Role)
  role: Role;

  @ApiPropertyOptional()
  @IsOptional()
  @IsString()
  storeId?: string;

  @ApiPropertyOptional({ default: 'es' })
  @IsOptional()
  @IsString()
  locale?: string;
}

import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({ example: 'owner@demo-cafe.com' })
  @IsEmail({}, { message: 'Email inválido' })
  email: string;
}

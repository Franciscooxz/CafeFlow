import { IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({ description: 'Token del enlace enviado por correo' })
  @IsString()
  @Matches(/^[A-Za-z0-9_-]{43}$/, { message: 'El enlace no es válido' })
  token: string;

  @ApiProperty({ example: 'nuevaClave2026' })
  @IsString()
  @MinLength(8, { message: 'La contraseña debe tener al menos 8 caracteres' })
  // bcrypt ignora todo lo que pase de 72 bytes.
  @MaxLength(72, { message: 'La contraseña no puede superar 72 caracteres' })
  newPassword: string;
}

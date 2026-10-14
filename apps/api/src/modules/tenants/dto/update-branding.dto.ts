import { IsOptional, Matches, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

// ~110 KB de imagen. El frontend entrega un WebP de 256px que suele pesar 10-40 KB.
export const MAX_LOGO_DATA_URL_LENGTH = 150_000;

export class UpdateBrandingDto {
  @ApiPropertyOptional({ example: '#00704A', nullable: true })
  @IsOptional()
  @Matches(/^#[0-9a-fA-F]{6}$/, { message: 'brandColor debe ser un color hex como #00704A' })
  brandColor?: string | null;

  @ApiPropertyOptional({ example: 'data:image/webp;base64,UklGR...', nullable: true })
  @IsOptional()
  @MaxLength(MAX_LOGO_DATA_URL_LENGTH, { message: 'El logo es demasiado pesado' })
  @Matches(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/, {
    message: 'logoUrl debe ser una imagen PNG, JPEG o WebP en base64',
  })
  logoUrl?: string | null;
}

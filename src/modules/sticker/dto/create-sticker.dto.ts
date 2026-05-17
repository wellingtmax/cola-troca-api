import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
} from 'class-validator';

import { StickerRarity } from '@prisma/client';

export class CreateStickerDto {
  @IsString()
  albumId: string;

  @IsNumber()
  number: number;

  @IsString()
  name: string;

  @IsEnum(StickerRarity)
  rarity: StickerRarity;

  @IsUrl()
  imageUrl: string;

  @IsOptional()
  @IsBoolean()
  isSpecial?: boolean;
}
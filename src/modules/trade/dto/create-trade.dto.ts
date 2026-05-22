import {
  IsArray,
  IsString,
  ArrayMinSize,
} from 'class-validator';

export class CreateTradeDto {

  @IsString()
  receiverTradeCode: string;

  @IsArray()
  @ArrayMinSize(1)
  offeredStickerIds: string[];

  @IsArray()
  @ArrayMinSize(1)
  requestedStickerIds: string[];
}
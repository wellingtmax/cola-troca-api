import { 
    IsArray,
    ArrayMinSize
 } from "class-validator";

 export class CounterTradeDto {
    @IsArray()
    @ArrayMinSize(1)
    counterStickerIds: string[];
 }
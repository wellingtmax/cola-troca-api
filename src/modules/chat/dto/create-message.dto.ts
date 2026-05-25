import { 
    IsOptional,
    IsString,
    MaxLength,
 } from "class-validator";

 export class CreateMessageDto {
    @IsString()
    @MaxLength(1000)
    content: string;

    @IsOptional()
    @IsString()
    replyToId?: string;
 }
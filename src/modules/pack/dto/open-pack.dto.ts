import { IsEnum, IsString } from "class-validator";

export enum PackType {
    SMALL ='SMALL',
    MEDIUM = 'MEDIUM',
    LARGE = 'LARGE',
}

export class OpenPackDto {
    @IsString()
    albumId: string;

    @IsEnum(PackType)
    packType: PackType;
}
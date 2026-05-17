import {
    IsNumber,
    IsString,
    IsUrl,
} from 'class-validator'

export class CreateAlbumDto {

    @IsString()
    themeName: string;

    @IsUrl()
    coverUrl: string;

    @IsNumber()
    price: number;
}
import { IsString } from 'class-validator';

export class CreateCoinCheckoutDto {
  @IsString()
  packageId: string;
}
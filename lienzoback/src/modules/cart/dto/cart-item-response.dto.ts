import { IsUUID, IsNumber, IsString, IsOptional } from 'class-validator';

export class CartItemResponseDto {
  @IsUUID()
  id: string;

  @IsString()
  name: string;

  @IsNumber()
  price: number;

  @IsNumber()
  quantity: number;

  @IsString()
  @IsOptional()
  imgUrl?: string;

  @IsNumber()
  totalItemPrice: number;
}

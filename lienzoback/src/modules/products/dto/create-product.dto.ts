// import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID } from 'class-validator';
// export class CreateProductDto {
//   @IsString()
//   name: string;

//   @IsString()
//   description: string;

//   @IsNumber()
//   price: number;

//   @IsNumber()
//   stock: number;

//   // @IsOptional()
//   // @IsString()
//   // imgUrl?: string;

//   @IsBoolean()
//   @IsOptional()
//   isActive?: boolean;

//   @IsNumber()
//   caloricLevel: number;

//   @IsUUID()
//   categoryId: string;

//   @IsOptional()
//   @IsString({ each: true })
//   ingredients?: string[];
// }
import { IsString, IsNumber, IsBoolean, IsOptional, IsUUID } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateProductDto {
  @IsString()
  name: string;

  @IsString()
  description: string;

  @IsNumber()
  @Type(() => Number)
  price: number;

  @IsNumber()
  @Type(() => Number)
  stock: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsNumber()
  @Type(() => Number)
  caloricLevel: number;

  @IsUUID()
  categoryId: string;

  @IsOptional()
  @IsString({ each: true })
  ingredients?: string[];
}

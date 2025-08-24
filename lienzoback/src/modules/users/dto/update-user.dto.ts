import { PartialType } from '@nestjs/mapped-types';
import { CreateUserDto } from './create-user.dto';
import { IsOptional, IsString, IsNumber, IsDateString, IsEnum, IsBoolean } from 'class-validator';
import { Roles, Diet } from '../entities/user.entity'; // 1. Importamos 'Diet'

export class UpdateUserDto extends PartialType(CreateUserDto) {
  @IsOptional()
  @IsString()
  name?: string;

  @IsOptional()
  @IsString()
  address?: string;

  @IsOptional()
  @IsNumber()
  phone?: number;

  @IsOptional()
  @IsDateString()
  birthday?: string;

  // 2. AÑADIMOS EL CAMPO 'diet' QUE FALTABA
  @IsOptional()
  @IsEnum(Diet) // Le decimos que el valor debe ser uno de los del enum 'Diet'
  diet?: Diet;

  @IsOptional()
  @IsEnum(Roles, { message: 'roles debe ser user, admin o banned' })
  roles?: Roles;

  @IsOptional()
  @IsBoolean()
  isSuscribed?: boolean;
}

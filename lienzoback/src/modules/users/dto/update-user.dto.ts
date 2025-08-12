import { IsString, IsOptional, IsNumber, IsDateString, IsBoolean, IsEnum } from 'class-validator';
import { Roles } from '../entities/user.entity';

export class UpdateUserDto {
  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @IsOptional()
  phone?: number;

  @IsDateString()
  @IsOptional()
  birthday?: Date;

  @IsBoolean()
  @IsOptional()
  isSuscribed?: boolean;

  @IsEnum(Roles)
  @IsOptional()
  roles?: Roles;
}

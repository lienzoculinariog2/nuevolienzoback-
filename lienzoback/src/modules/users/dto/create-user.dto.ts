import { IsString, IsEmail, IsNotEmpty } from 'class-validator';
// import { Roles } from '../entities/user.entity'; // Comentamos esto temporalmente

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  id: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

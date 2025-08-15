import { IsString, IsEmail, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateUserDto {
  @IsString()
  @IsNotEmpty()
  auth0Id: string;

  @IsString()
  @IsOptional() // <-- Con esto, el campo 'name' es opcional
  name?: string;

  @IsEmail()
  @IsNotEmpty()
  email: string;
}

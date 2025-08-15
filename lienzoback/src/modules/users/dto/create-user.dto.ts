import { IsString, IsEmail, IsNumber, IsDateString, IsNotEmpty, Length } from 'class-validator';

export class CreateUserDto {
  @IsNotEmpty({ message: 'El nombre no puede estar vacío' })
  @IsString({ message: 'El nombre debe ser una cadena de texto' })
  @Length(2, 50, { message: 'El nombre debe tener entre 2 y 50 caracteres' })
  name: string;

  @IsNotEmpty({ message: 'El email no puede estar vacío' })
  @IsEmail({}, { message: 'El formato del email es incorrecto' })
  email: string;

  @IsNotEmpty({ message: 'La contraseña no puede estar vacía' })
  @IsString({ message: 'La contraseña debe ser una cadena de texto' })
  @Length(8, 100, { message: 'La contraseña debe tener al menos 8 caracteres' })
  password: string;

  @IsNotEmpty({ message: 'La dirección no puede estar vacía' })
  @IsString({ message: 'La dirección debe ser una cadena de texto' })
  address: string;

  @IsNotEmpty({ message: 'El teléfono no puede estar vacío' })
  @IsNumber({}, { message: 'El teléfono debe ser un número' })
  phone: number;

  @IsNotEmpty({ message: 'La fecha de nacimiento no puede estar vacía' })
  @IsDateString(
    {},
    { message: 'La fecha de nacimiento debe tener un formato de fecha válido (YYYY-MM-DD)' },
  )
  birthday: Date;
}

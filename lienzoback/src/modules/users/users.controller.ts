// src/users/users.controller.ts
import { Controller, Put, Body, UseGuards, Req } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from './entities/user.entity';
import type { RequestWithUser } from '../common/utils/request-with-user.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Req() req: RequestWithUser, // Usa la nueva interfaz aquí
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Users> {
    // TypeScript ahora sabe que req.user existe y su tipo
    const auth0Id = req.user.sub;
    console.log(`Petición de actualización de perfil para el usuario con ID: ${auth0Id}`);

    return this.usersService.update(auth0Id, updateUserDto);
  }
}

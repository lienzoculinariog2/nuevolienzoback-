// // // src/users/users.controller.ts
// import { Controller, Put, Get, Body, UseGuards, Req } from '@nestjs/common';
// import { AuthGuard } from '@nestjs/passport';
// import { UsersService } from './users.service';
// import { UpdateUserDto } from './dto/update-user.dto';
// import { Users } from './entities/user.entity';
// import type { RequestWithUser } from '../common/utils/request-with-user.interface';

// @Controller('users')
// export class UsersController {
//   constructor(private readonly usersService: UsersService) {}

//   @Get('profile')
//   @UseGuards(AuthGuard('jwt'))
//   async getProfile(@Req() req: RequestWithUser): Promise<Users> {
//     const auth0Id = req.user.sub;
//     console.log(`Solicitud de perfil del usuario con ID: ${auth0Id}`);
//     return this.usersService.findOneByAuth0Id(auth0Id);
//   }

//   @Put('profile')
//   @UseGuards(AuthGuard('jwt'))
//   async updateProfile(
//     @Req() req: RequestWithUser,
//     @Body() updateUserDto: UpdateUserDto,
//   ): Promise<Users> {
//     const auth0Id = req.user.sub;
//     console.log(`Petición de actualización de perfil para el usuario con ID: ${auth0Id}`);
//     return this.usersService.update(auth0Id, updateUserDto);
//   }
// }
// src/users/users.controller.ts
// src/users/users.controller.ts
// src/users/users.controller.ts
import { Controller, Put, Get, Body, UseGuards, Req, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from './entities/user.entity';
import type { RequestWithUser } from '../common/utils/request-with-user.interface';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  // Nuevo endpoint: Maneja el login y crea el usuario si es la primera vez.
  @Post('login')
  @UseGuards(AuthGuard('jwt'))
  async login(@Req() req: RequestWithUser): Promise<Users> {
    const auth0Id = req.user.sub;
    console.log(`Solicitud de login para el usuario con ID: ${auth0Id}`);
    return this.usersService.findOrCreate(auth0Id);
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: RequestWithUser): Promise<Users> {
    const auth0Id = req.user.sub;
    console.log(`Solicitud de perfil del usuario con ID: ${auth0Id}`);
    return this.usersService.findOneByAuth0Id(auth0Id);
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Users> {
    const auth0Id = req.user.sub;
    console.log(`Petición de actualización de perfil para el usuario con ID: ${auth0Id}`);
    return this.usersService.update(auth0Id, updateUserDto);
  }
}

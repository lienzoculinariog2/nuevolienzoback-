import { Controller, Put, Body, UseGuards, Req, Get, Post } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { UpdateUserDto } from './dto/update-user.dto';
import { Users } from './entities/user.entity';
import type { RequestWithUser } from '../common/utils/request-with-user.interface';
import { CreateUserDto } from './dto/create-user.dto';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post('get-or-create')
  async getOrCreateUser(
    @Body() body: { auth0Id: string; email: string; name?: string },
  ): Promise<Users> {
    try {
      const user = await this.usersService.findOneByAuth0Id(body.auth0Id);
      return user;
    } catch (error) {
      const createUserDto: CreateUserDto = {
        auth0Id: body.auth0Id,
        email: body.email,
        name: body.name,
      };
      const newUser = await this.usersService.create(createUserDto);
      return newUser;
    }
  }

  @Get('profile')
  @UseGuards(AuthGuard('jwt'))
  async getProfile(@Req() req: RequestWithUser): Promise<Users> {
    const auth0Id = req.user.sub;
    return this.usersService.findOneByAuth0Id(auth0Id);
  }

  @Put('profile')
  @UseGuards(AuthGuard('jwt'))
  async updateProfile(
    @Req() req: RequestWithUser,
    @Body() updateUserDto: UpdateUserDto,
  ): Promise<Users> {
    const auth0Id = req.user.sub;
    return this.usersService.update(auth0Id, updateUserDto);
  }
}

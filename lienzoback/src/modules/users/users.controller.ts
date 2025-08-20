import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  UseGuards,
  Req,
  ForbiddenException,
  Put,
} from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { Roles, Users } from './entities/user.entity';
import type { RequestWithUser } from '../common/utils/request-with-user.interface';
import { RolesGuard } from '../common/guard/roles.guard';
import { HasRoles } from '../decorators/roles';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(AuthGuard('jwt'))
  async findAll(): Promise<Users[]> {
    return this.usersService.findAll();
  }

  @Post()
  @UseGuards(AuthGuard('jwt'))
  async create(@Body() createUserDto: CreateUserDto): Promise<Users> {
    return this.usersService.create(createUserDto);
  }

  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async findOne(@Param('id') id: string): Promise<Users> {
    return this.usersService.findOneById(id);
  }

  @Patch(':id')
  @UseGuards(AuthGuard('jwt'))
  async update(
    @Param('id') id: string,
    @Body() updateUserDto: UpdateUserDto,
    @Req() req: RequestWithUser,
  ): Promise<Users> {
    if (id !== req.user.sub) {
      throw new ForbiddenException('No tienes permiso para actualizar este perfil.');
    }
    return this.usersService.update(id, updateUserDto);
  }
  @Put(':id/admin')
  @UseGuards(AuthGuard('jwt'), RolesGuard)
  @HasRoles(Roles.ADMIN)
  async promoteToAdmin(@Param('id') id: string): Promise<Users> {
    const userToUpdate = await this.usersService.findOneById(id);

    // ✅ Correct: Create a DTO with only the fields you're updating
    const updateUserDto: Partial<UpdateUserDto> = {
      roles: Roles.ADMIN,
    };

    return this.usersService.update(id, updateUserDto);
  }
}

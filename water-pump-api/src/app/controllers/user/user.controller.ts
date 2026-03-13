import { Controller, Get, Post, Put, Delete, Body, Param, HttpException, HttpStatus, UseGuards } from '@nestjs/common';
import { User } from 'src/app/schemas/user.schema';
import { UserService } from 'src/app/services/user/user.service';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';

@UseGuards(JwtAuthGuard)
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) { }

  @Get('list')
  getUsers(): Promise<User[]> {
    return this.userService.getUsers();
  }

  @Post('create')
  createUser(@Body() user: User): Promise<User> {
    if (!user.password || !user.login) {
      throw new HttpException('Поля login и password обязательны.', HttpStatus.BAD_REQUEST);
    }
    return this.userService.createUser(user);
  }

  @Put('update/:id')
  async updateUser(
    @Param('id') id: string,
    @Body() user: Partial<User>
  ): Promise<User> {
    return this.userService.updateUser(id, user);
  }

  @Put('update/:id/password')
  async updatePassword(@Param('id') id: string, @Body('newPassword') newPassword: string): Promise<void> {
    await this.userService.updatePassword(id, newPassword);
  }

  @Delete('delete/:login')
  deleteUser(@Param('login') login: string): Promise<void> {
    return this.userService.deleteUser(login);
  }
}

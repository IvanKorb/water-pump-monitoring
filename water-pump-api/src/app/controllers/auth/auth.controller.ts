import { Controller, Post, Body, ConflictException, Get, Param, NotFoundException } from '@nestjs/common';
import { AuthService } from 'src/app/services/auth/auth.service';
import { User } from 'src/app/schemas/user.schema';

@Controller('auth')
export class AuthController { 
  constructor(private authService: AuthService) {}

  @Post('login')
  async login(@Body() user: User) {
    const token = await this.authService.login(user);
    if (!token) {
      return {};
    }
    return { token };
  }

  @Post('register')
  async register(@Body() user: User) {
    const existingUser = await this.authService.findByLogin(user.login);
    if (existingUser) {
      throw new ConflictException('Пользователь с таким логином уже существует');
    }
    return this.authService.register(user);
  }

  @Get('getRole/:id')
  async getRole(@Param('id') id: string): Promise<{ role: string }> {
      const user = await this.authService.findById(id);
      if (!user) {
          throw new NotFoundException('Пользователь не найден');
      }
      return { role: user.role || 'guest' };
  }
}

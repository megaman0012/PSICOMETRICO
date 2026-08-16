import { Controller, Post, Body, UseGuards, Request, Get, UnauthorizedException } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UsuariosService } from '../usuarios/usuarios.service';
import { AuthenticatedRequest } from './authenticated-request';

const INVALID_CREDENTIALS_DELAY_MS = 600;

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usuariosService: UsuariosService,
  ) {}

  @Throttle({ default: { limit: 5, ttl: 900000 } })
  @Post('login')
  async login(@Body() loginDto: LoginDto) {
    const user = await this.authService.validateUser(loginDto.email, loginDto.password);
    if (!user) {
      await sleep(INVALID_CREDENTIALS_DELAY_MS);
      throw new UnauthorizedException('Credenciales inválidas');
    }
    return this.authService.login(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getProfile(@Request() req: AuthenticatedRequest) {
    // Devolver información completa del usuario (excluyendo password por seguridad)
    return this.usuariosService.encontrarPorId(req.user.id);
  }
}

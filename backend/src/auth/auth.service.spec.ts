import { Test, TestingModule } from '@nestjs/testing';
import { JwtService } from '@nestjs/jwt';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcryptjs';

jest.mock('bcryptjs', () => ({
  compare: jest.fn(),
}));

const mockPrismaService = {
  usuario: {
    findUnique: jest.fn(),
  },
};

const mockJwtService = {
  sign: jest.fn(),
};

describe('AuthService', () => {
  let service: AuthService;
  let prismaService: PrismaService;
  let jwtService: JwtService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: JwtService, useValue: mockJwtService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prismaService = module.get<PrismaService>(PrismaService);
    jwtService = module.get<JwtService>(JwtService);
    (bcrypt.compare as jest.Mock).mockResolvedValue(true);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('validateUser', () => {
    it('should return user without password when credentials are valid', async () => {
      (prismaService.usuario.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'admin@psicometrico.com',
        password: '$2a$10$hash',
        nombre: 'Administrador',
        rol: 'ADMIN',
      });

      const result = await service.validateUser('admin@psicometrico.com', 'Admin123!');

      expect(result).toEqual({
        id: 1,
        email: 'admin@psicometrico.com',
        nombre: 'Administrador',
        rol: 'ADMIN',
      });
      expect(prismaService.usuario.findUnique).toHaveBeenCalledWith({
        where: { email: 'admin@psicometrico.com' },
      });
      expect(bcrypt.compare).toHaveBeenCalledWith('Admin123!', '$2a$10$hash');
    });

    it('should return null when the password is wrong', async () => {
      (prismaService.usuario.findUnique as jest.Mock).mockResolvedValue({
        id: 1,
        email: 'admin@psicometrico.com',
        password: '$2a$10$hash',
        nombre: 'Administrador',
        rol: 'ADMIN',
      });
      (bcrypt.compare as jest.Mock).mockResolvedValue(false);

      const result = await service.validateUser('admin@psicometrico.com', 'incorrecta');

      expect(result).toBeNull();
    });

    it('should return null when the user does not exist', async () => {
      (prismaService.usuario.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await service.validateUser('noexiste@psicometrico.com', 'Admin123!');

      expect(result).toBeNull();
      expect(bcrypt.compare).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should return an access token with email, sub and rol in the payload', async () => {
      (jwtService.sign as jest.Mock).mockReturnValue('fake.jwt.token');

      const result = await service.login({ id: 1, email: 'a@b.com', rol: 'ADMIN' });

      expect(jwtService.sign).toHaveBeenCalledWith({
        email: 'a@b.com',
        sub: 1,
        rol: 'ADMIN',
      });
      expect(result).toEqual({ access_token: 'fake.jwt.token' });
    });
  });
});

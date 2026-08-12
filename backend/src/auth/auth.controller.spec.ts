import { AuthController } from './auth.controller';

describe('AuthController', () => {
  let controller: AuthController;
  let authService: { validateUser: jest.Mock; login: jest.Mock };
  let usuariosService: { encontrarPorId: jest.Mock };

  beforeEach(() => {
    authService = {
      validateUser: jest.fn(),
      login: jest.fn(),
    };
    usuariosService = {
      encontrarPorId: jest.fn(),
    };
    controller = new AuthController(
      authService as any,
      usuariosService as any,
    );
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('login', () => {
    it('debe devolver un token cuando las credenciales son válidas', async () => {
      const usuario = { id: 1, email: 'a@b.com', rol: 'ADMIN' };
      authService.validateUser.mockResolvedValue(usuario);
      authService.login.mockResolvedValue({ access_token: 'jwt' });

      const resultado = await controller.login({
        email: 'a@b.com',
        password: 'Admin123!',
      } as any);

      expect(authService.validateUser).toHaveBeenCalledWith('a@b.com', 'Admin123!');
      expect(authService.login).toHaveBeenCalledWith(usuario);
      expect(resultado).toEqual({ access_token: 'jwt' });
    });

    it('debe devolver credenciales inválidas cuando el usuario no existe', async () => {
      authService.validateUser.mockResolvedValue(null);

      const resultado = await controller.login({
        email: 'no@existe.com',
        password: 'Admin123!',
      } as any);

      expect(authService.login).not.toHaveBeenCalled();
      expect(resultado).toEqual({ message: 'Credenciales inválidas' });
    });

    it('debe devolver credenciales inválidas cuando la contraseña es incorrecta', async () => {
      authService.validateUser.mockResolvedValue(null);

      const resultado = await controller.login({
        email: 'a@b.com',
        password: 'Incorrecta1!',
      } as any);

      expect(resultado).toEqual({ message: 'Credenciales inválidas' });
    });
  });

  describe('getProfile', () => {
    it('debe devolver el perfil del usuario autenticado', async () => {
      const perfil = {
        id: 1,
        email: 'a@b.com',
        nombre: 'Administrador',
        rol: 'ADMIN',
      };
      usuariosService.encontrarPorId.mockResolvedValue(perfil);

      const resultado = await controller.getProfile({
        user: { id: 1 },
      } as any);

      expect(usuariosService.encontrarPorId).toHaveBeenCalledWith(1);
      expect(resultado).toEqual(perfil);
    });
  });
});

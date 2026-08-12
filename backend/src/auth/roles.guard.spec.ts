import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext } from '@nestjs/common';
import { ROLES_KEY } from './roles.decorator';

function crearContexto(usuario: { rol?: string } | null): ExecutionContext {
  return {
    getHandler: () => ({}),
    getClass: () => ({}),
    switchToHttp: () => ({ getRequest: () => ({ user: usuario }) }),
  } as unknown as ExecutionContext;
}

describe('RolesGuard', () => {
  let reflector: Reflector;
  let guard: RolesGuard;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('debe permitir el acceso si no hay roles requeridos definidos', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(undefined);

    const permitido = guard.canActivate(crearContexto({ rol: 'EVALUADOR' }));

    expect(permitido).toBe(true);
    expect(reflector.getAllAndOverride).toHaveBeenCalledWith(ROLES_KEY, [
      expect.any(Object),
      expect.any(Object),
    ]);
  });

  it('debe permitir el acceso si el usuario tiene un rol requerido', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN', 'EVALUADOR']);

    const permitido = guard.canActivate(crearContexto({ rol: 'ADMIN' }));

    expect(permitido).toBe(true);
  });

  it('debe denegar el acceso si el rol del usuario no está permitido', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const permitido = guard.canActivate(crearContexto({ rol: 'EVALUADOR' }));

    expect(permitido).toBe(false);
  });

  it('debe denegar el acceso si el usuario no tiene rol', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const permitido = guard.canActivate(crearContexto({ rol: undefined }));

    expect(permitido).toBe(false);
  });

  it('debe denegar el acceso si no hay usuario en la petición (401 previo falló)', () => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(['ADMIN']);

    const permitido = guard.canActivate(crearContexto(null));

    expect(permitido).toBe(false);
  });
});

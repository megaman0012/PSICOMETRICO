import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { authService } from '../services/api';
import type { Usuario } from '../types';

interface AuthContextType {
  usuario: Usuario | null;
  cargando: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  cargando: true,
  login: async () => {},
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const usuarioGuardado = localStorage.getItem('usuario');
    if (token && usuarioGuardado) {
      setUsuario(JSON.parse(usuarioGuardado));
      setCargando(false);
      authService.me().then(setUsuario).catch(() => {});
    } else if (token) {
      authService
        .me()
        .then((u) => {
          setUsuario(u);
          localStorage.setItem('usuario', JSON.stringify(u));
        })
        .catch(() => {})
        .finally(() => setCargando(false));
    } else {
      setCargando(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const { access_token } = await authService.login(email, password);
    localStorage.setItem('token', access_token);
    const perfil = await authService.me();
    localStorage.setItem('usuario', JSON.stringify(perfil));
    setUsuario(perfil);
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('usuario');
    setUsuario(null);
  };

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);

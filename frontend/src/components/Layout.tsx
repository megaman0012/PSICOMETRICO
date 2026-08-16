import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import type { ReactNode } from 'react';

const links = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/pruebas', label: 'Pruebas' },
  { to: '/baterias', label: 'Baterías' },
  { to: '/invitaciones', label: 'Invitaciones' },
  { to: '/candidatos', label: 'Candidatos' },
  { to: '/aplicar', label: 'Aplicar Prueba' },
  { to: '/resultados', label: 'Resultados' },
  { to: '/historial', label: 'Historial' },
  { to: '/reportes', label: 'Reportes' },
];

export default function Layout({ children }: { children: ReactNode }) {
  const { usuario, logout } = useAuth();
  const navigate = useNavigate();

  const cerrarSesion = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-blue-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-8">
              <span className="text-xl font-bold">Plataforma Psicométrica</span>
              <div className="hidden md:flex space-x-2">
                {links.map((link) => (
                  <NavLink
                    key={link.to}
                    to={link.to}
                    end={link.end}
                    className={({ isActive }) =>
                      `px-3 py-2 rounded-md text-sm font-medium ${
                        isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'
                      }`
                    }
                  >
                    {link.label}
                  </NavLink>
                ))}
                {usuario?.rol === 'ADMIN' && (
                  <>
                    <NavLink
                      to="/admin-pruebas"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium ${
                          isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'
                        }`
                      }
                    >
                      Admin Pruebas
                    </NavLink>
                    <NavLink
                      to="/usuarios"
                      className={({ isActive }) =>
                        `px-3 py-2 rounded-md text-sm font-medium ${
                          isActive ? 'bg-blue-700 text-white' : 'text-blue-100 hover:bg-blue-700'
                        }`
                      }
                    >
                      Usuarios
                    </NavLink>
                  </>
                )}
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {usuario && (
                <span className="text-sm text-blue-100">
                  {usuario.nombre} ({usuario.rol})
                </span>
              )}
              <button
                onClick={cerrarSesion}
                className="text-sm bg-blue-700 hover:bg-blue-900 px-3 py-1.5 rounded-md"
              >
                Cerrar sesión
              </button>
            </div>
          </div>
        </div>
      </nav>
      <main className="max-w-7xl mx-auto px-4 py-6">{children}</main>
    </div>
  );
}

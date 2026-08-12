import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Pruebas from './pages/Pruebas';
import PruebaDetalle from './pages/PruebaDetalle';
import Candidatos from './pages/Candidatos';
import AplicarPrueba from './pages/AplicarPrueba';
import Resultados from './pages/Resultados';
import Historial from './pages/Historial';
import Reportes from './pages/Reportes';
import Usuarios from './pages/Usuarios';
import AdministrarPruebas from './pages/AdministrarPruebas';

function RutasProtegidas() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Routes>
        <Route index element={<Dashboard />} />
        <Route path="pruebas" element={<Pruebas />} />
        <Route path="pruebas/:id" element={<PruebaDetalle />} />
        <Route path="candidatos" element={<Candidatos />} />
        <Route path="aplicar" element={<AplicarPrueba />} />
        <Route path="resultados" element={<Resultados />} />
        <Route path="historial" element={<Historial />} />
        <Route path="reportes" element={<Reportes />} />
        <Route
          path="usuarios"
          element={usuario.rol === 'ADMIN' ? <Usuarios /> : <Navigate to="/" replace />}
        />
        <Route
          path="admin-pruebas"
          element={usuario.rol === 'ADMIN' ? <AdministrarPruebas /> : <Navigate to="/" replace />}
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Layout>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/*" element={<RutasProtegidas />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Layout from './components/Layout';
import Login from './pages/Login';

const Dashboard = lazy(() => import('./pages/Dashboard'));
const Pruebas = lazy(() => import('./pages/Pruebas'));
const PruebaDetalle = lazy(() => import('./pages/PruebaDetalle'));
const Candidatos = lazy(() => import('./pages/Candidatos'));
const AplicarPrueba = lazy(() => import('./pages/AplicarPrueba'));
const Resultados = lazy(() => import('./pages/Resultados'));
const Historial = lazy(() => import('./pages/Historial'));
const Reportes = lazy(() => import('./pages/Reportes'));
const Usuarios = lazy(() => import('./pages/Usuarios'));
const AdministrarPruebas = lazy(() => import('./pages/AdministrarPruebas'));

function FallbackCarga() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
    </div>
  );
}

function RutasProtegidas() {
  const { usuario, cargando } = useAuth();

  if (cargando) {
    return <FallbackCarga />;
  }

  if (!usuario) {
    return <Navigate to="/login" replace />;
  }

  return (
    <Layout>
      <Suspense fallback={<FallbackCarga />}>
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
      </Suspense>
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

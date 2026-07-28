import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider, MutationCache } from '@tanstack/react-query';
import './index.css';
import { AuthProvider } from './features/auth/context/AuthContext';
import { notify, getErrorMessage } from './components/ui/toast';
import App from './App.tsx';

const queryClient = new QueryClient({
  // Red de seguridad global: CUALQUIER mutación que falle (crear/editar/eliminar/asignar,
  // en cualquier página) avisa acá, siempre — antes, la enorme mayoría de los hooks no
  // tenían onError y el error se perdía en silencio (el usuario veía que "no pasó nada").
  // Los pocos lugares que ya manejan el error de forma más específica (ej. un mensaje
  // pegado al campo del formulario) conviven bien con este toast genérico adicional.
  mutationCache: new MutationCache({
    onError: (error) => notify.error(getErrorMessage(error)),
  }),
  defaultOptions: {
    queries: {
      // Datos "frescos" por 30s: evita refetches redundantes en cada mount/focus.
      // Las queries de realtime (carreras/unidades) igual pollean con su refetchInterval.
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <App />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  </StrictMode>,
);

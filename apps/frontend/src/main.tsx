import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import './index.css';
import { AuthProvider } from './features/auth/context/AuthContext';
import App from './App.tsx';

const queryClient = new QueryClient({
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

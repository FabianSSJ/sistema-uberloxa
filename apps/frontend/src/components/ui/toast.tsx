import toast, { Toaster, ToastBar } from 'react-hot-toast';
import { X } from 'lucide-react';

/**
 * Toaster global del sistema. Se monta UNA sola vez en App.
 * Todo el estilo, posicion y animacion del toast vive aca: una sola fuente de verdad.
 */
export const AppToaster = () => (
  <Toaster
    position="top-right"
    gutter={10}
    toastOptions={{
      duration: 3000,
      style: {
        borderRadius: '12px',
        background: '#ffffff',
        color: '#1f2937',
        boxShadow: '0 10px 30px -8px rgba(0,0,0,0.18), 0 0 0 1px rgba(0,0,0,0.04)',
        padding: '12px 14px',
        fontSize: '14px',
        fontWeight: 500,
        maxWidth: '380px',
      },
      success: { iconTheme: { primary: '#16a34a', secondary: '#ffffff' } },
      error: { iconTheme: { primary: '#dc2626', secondary: '#ffffff' }, duration: 4500 },
    }}
  >
    {(t) => (
      <ToastBar toast={t}>
        {({ icon, message }) => (
          <div className="flex items-center gap-2">
            {icon}
            <div className="flex-1">{message}</div>
            {t.type !== 'loading' && (
              <button
                onClick={() => toast.dismiss(t.id)}
                className="ml-1 p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md transition-colors"
                aria-label="Cerrar"
              >
                <X size={15} />
              </button>
            )}
          </div>
        )}
      </ToastBar>
    )}
  </Toaster>
);

/**
 * Helper unico para disparar notificaciones desde cualquier lado.
 * Usar notify.success / notify.error en vez de toast directo, asi el estilo
 * y el comportamiento quedan centralizados y consistentes.
 */
export const notify = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  info: (message: string) => toast(message),
};

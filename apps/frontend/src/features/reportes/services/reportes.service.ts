import api from '../../../core/api/axios';

export const reportesService = {
  /** Descarga el PDF del informe (Blob). Sin `fecha`, es el de hoy; con `fecha` y `hasta`, un rango. */
  descargarPDF: async (fecha?: string, hasta?: string): Promise<Blob> => {
    const params: Record<string, string> = {};
    if (fecha) params.fecha = fecha;
    if (hasta) params.hasta = hasta;
    const { data } = await api.get('/reportes/pdf', { responseType: 'blob', params });
    return data as Blob;
  },
  /** Dispara el envío del informe por WhatsApp ahora. */
  enviarAhora: async (): Promise<{ ok: boolean; detalle: string }> => {
    const { data } = await api.post('/reportes/enviar');
    return data;
  },
  /** Estado de conexión de WhatsApp (si ya se escaneó el QR). */
  estadoWhatsapp: async (): Promise<{ conectado: boolean }> => {
    const { data } = await api.get('/reportes/whatsapp/estado');
    return data;
  },
};

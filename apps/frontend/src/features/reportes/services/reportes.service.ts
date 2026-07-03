import api from '../../../core/api/axios';

export const reportesService = {
  /** Descarga el PDF del informe de hoy (Blob). */
  descargarPDF: async (): Promise<Blob> => {
    const { data } = await api.get('/reportes/pdf', { responseType: 'blob' });
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

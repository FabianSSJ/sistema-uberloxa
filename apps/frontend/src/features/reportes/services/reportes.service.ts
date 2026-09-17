import api from '../../../core/api/axios';

export const reportesService = {
  /** Descarga el PDF del informe (Blob). Sin `fecha`, es el de hoy; con `fecha` y `hasta`, un rango; con `hora`, franja horaria. */
  descargarPDF: async (fecha?: string, hasta?: string, hora?: string | number): Promise<Blob> => {
    const params: Record<string, string | number> = {};
    if (fecha) params.fecha = fecha;
    if (hasta) params.hasta = hasta;
    if (hora !== undefined && hora !== '') params.hora = hora;
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

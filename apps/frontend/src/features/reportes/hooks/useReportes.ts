import { useMutation, useQuery } from '@tanstack/react-query';
import { reportesService } from '../services/reportes.service';
import { notify } from '../../../components/ui/toast';

export const useEstadoWhatsapp = () =>
  useQuery({
    queryKey: ['reportes', 'whatsapp', 'estado'],
    queryFn: reportesService.estadoWhatsapp,
    refetchInterval: 5000,
  });

export const useEnviarReporte = () =>
  useMutation({
    mutationFn: reportesService.enviarAhora,
    onSuccess: (r) => (r.ok ? notify.success('Informe enviado por WhatsApp ✅') : notify.error(r.detalle)),
    onError: () => notify.error('No se pudo enviar el informe.'),
  });

/** Descarga el PDF y dispara la bajada en el navegador. */
export const descargarInformeHoy = async () => {
  try {
    const blob = await reportesService.descargarPDF();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Informe_UberLoxa_hoy.pdf';
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    notify.error('No se pudo descargar el informe.');
  }
};

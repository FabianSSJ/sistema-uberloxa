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
    // Si la promesa rechaza (network/backend down), el handler global de mutaciones
    // (main.tsx) ya avisa — acá solo cubrimos el caso "200 OK pero r.ok = false"
    // (ej. WhatsApp no conectado), que no es un error de mutación, es de negocio.
    onSuccess: (r) => (r.ok ? notify.success('Informe enviado por WhatsApp ✅') : notify.error(r.detalle)),
  });

/**
 * Descarga el PDF y dispara la bajada en el navegador. Sin `fecha`, es el informe de hoy;
 * con `fecha` y `hasta` (distintos), el informe del rango completo; con `hora`, franja horaria.
 */
export const descargarInforme = async (fecha?: string, hasta?: string, hora?: string | number) => {
  try {
    const blob = await reportesService.descargarPDF(fecha, hasta, hora);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const pad = (n: number) => String(n).padStart(2, '0');
    let sufijoHora = '';
    if (typeof hora === 'string' && hora) {
      sufijoHora = `_${hora.replace(':', '-').replace('-', '_a_').replace(':', '-')}`;
    } else if (typeof hora === 'number' && !isNaN(hora)) {
      sufijoHora = `_${pad(hora)}hs_a_${pad((hora + 1) % 24)}hs`;
    }
    const nombre = fecha && hasta && hasta !== fecha ? `${fecha}_al_${hasta}` : (fecha || 'hoy');
    a.download = `Informe_UberLoxa_${nombre}${sufijoHora}.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  } catch {
    notify.error('No se pudo descargar el informe.');
  }
};

/**
 * Badge del codigo de cliente: representacion UNICA y consistente en todo el sistema.
 * Siempre azul, siempre "Cód. NN" con padding a 2 digitos. Si manana cambia el formato,
 * se cambia aca y se actualiza en toda la app.
 */
interface CodigoBadgeProps {
  codigo?: number | null;
  className?: string;
}

export const formatCodigo = (codigo?: number | null): string =>
  codigo != null ? String(codigo).padStart(2, '0') : '—';

export const CodigoBadge = ({ codigo, className = '' }: CodigoBadgeProps) => (
  <span
    className={`inline-flex items-center bg-blue-50 text-blue-700 border border-blue-100 text-[0.6875rem] font-bold font-mono px-2 py-1 rounded-md whitespace-nowrap ${className}`}
  >
    Cód. {formatCodigo(codigo)}
  </span>
);

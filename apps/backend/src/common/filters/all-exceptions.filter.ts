import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { Prisma } from '../../../generated/prisma/client';

/**
 * Red de seguridad global: SIN esto, cualquier service que no capture un error de Prisma
 * (ej. P2003 al borrar un registro con dependientes, P2025 en un update/delete concurrente)
 * devuelve un 500 crudo de Nest con el detalle interno — antes solo marcas/modelos lo
 * manejaban a mano. Los HttpException ya lanzados a propósito (NotFoundException,
 * ConflictException con mensaje específico, etc.) pasan tal cual: este filtro solo agrega
 * una traducción sensata para lo que nadie previó todavía.
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger('ExceptionsFilter');

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const { status, message } = this.resolve(exception);

    // Solo lo verdaderamente inesperado (5xx) se loguea con stack completo server-side —
    // los 4xx (validaciones, ownership, conflictos) son parte normal del flujo, no ruido.
    if (status >= 500) {
      this.logger.error(`${request.method} ${request.url} -> ${status}`, (exception as Error)?.stack);
    }

    response.status(status).json({
      statusCode: status,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }

  private resolve(exception: unknown): { status: number; message: string | string[] } {
    if (exception instanceof HttpException) {
      const res = exception.getResponse();
      const message = typeof res === 'string' ? res : ((res as any).message ?? exception.message);
      return { status: exception.getStatus(), message };
    }

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      // Cast explícito: el `instanceof` de arriba ya lo garantiza en runtime, pero el tipado
      // de esta clase en el cliente generado no siempre deja que TS lo angoste solo.
      const prismaError = exception as Prisma.PrismaClientKnownRequestError;
      switch (prismaError.code) {
        case 'P2002': {
          const campo = (prismaError.meta?.target as string[] | undefined)?.join(', ') || 'un campo único';
          return { status: HttpStatus.CONFLICT, message: `Ya existe un registro con ese valor (${campo}).` };
        }
        case 'P2003':
          return { status: HttpStatus.CONFLICT, message: 'No se puede completar la operación: hay registros relacionados que dependen de este.' };
        case 'P2025':
          return { status: HttpStatus.NOT_FOUND, message: 'El registro no existe (puede que ya lo hayan eliminado o editado).' };
        default:
          return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Error de base de datos inesperado.' };
      }
    }

    return { status: HttpStatus.INTERNAL_SERVER_ERROR, message: 'Ocurrió un error inesperado. Intentá de nuevo; si persiste, avisá a soporte.' };
  }
}

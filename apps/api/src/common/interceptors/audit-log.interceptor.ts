import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service';

const MUTABLE_METHODS = ['POST', 'PUT', 'PATCH', 'DELETE'];
const MAX_AUDIT_STRING_LENGTH = 1000;

// Solo campos escalares de primer nivel: guardar relaciones anidadas (ítems de
// una orden, modificadores, etc.) multiplicaba el tamaño de audit_logs por venta.
function pickScalars(data: unknown): Prisma.InputJsonObject | null {
  if (!data || typeof data !== 'object' || Array.isArray(data)) return null;
  const result: Record<string, string | number | boolean | null> = {};
  for (const [key, value] of Object.entries(data)) {
    if (typeof value === 'string' && value.length > MAX_AUDIT_STRING_LENGTH) {
      // Imágenes en base64 (logo) u otros blobs: se registra que cambió, no el contenido.
      result[key] = `[${value.length} caracteres omitidos]`;
    } else if (
      value === null ||
      typeof value === 'string' ||
      typeof value === 'number' ||
      typeof value === 'boolean'
    ) {
      result[key] = value;
    } else if (value instanceof Date) {
      result[key] = value.toISOString();
    } else if (Prisma.Decimal.isDecimal(value)) {
      result[key] = (value as Prisma.Decimal).toNumber();
    }
  }
  return result;
}

@Injectable()
export class AuditLogInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const req = context.switchToHttp().getRequest();

    if (!MUTABLE_METHODS.includes(req.method)) {
      return next.handle();
    }

    const user = req.user;
    // Solo del JWT: X-Tenant-ID lo controla el cliente.
    const tenantId = user?.tenantId ?? null;

    // Determina entity desde la URL: /api/v1/users/123 → entity = 'users'
    const urlParts = req.path.replace('/api/v1/', '').split('/');
    const entity = urlParts[0] ?? 'unknown';
    const entityId = urlParts[1] ?? null;

    const action = {
      POST: 'CREATE',
      PUT: 'UPDATE',
      PATCH: 'UPDATE',
      DELETE: 'DELETE',
    }[req.method];

    return next.handle().pipe(
      tap(async (responseData) => {
        if (!user?.id) return;

        try {
          await this.prisma.auditLog.create({
            data: {
              tenantId,
              userId: user.id,
              action,
              entity,
              // En un POST de creación el id no está en la URL, solo en la respuesta.
              entityId:
                entityId ?? (typeof responseData?.id === 'string' ? responseData.id : null),
              newValue: pickScalars(responseData) ?? undefined,
              ipAddress: req.ip,
              userAgent: req.headers['user-agent'],
            },
          });
        } catch {
          // Audit log never fails silently — no queremos que rompa la operación
        }
      }),
    );
  }
}

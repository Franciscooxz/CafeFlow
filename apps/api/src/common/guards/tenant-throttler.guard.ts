import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';

@Injectable()
export class TenantThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Con sesión: un contador por usuario, así las tablets de un mismo local
    // (misma IP pública) no se bloquean entre sí. req.user existe porque
    // JwtAuthGuard se registra antes en app.module.
    if (req.user?.id) return `user:${req.user.id}`;

    // Sin sesión (login, forgot-password): por cuenta. Detrás del proxy de Next
    // req.ip es la de Next para todos, y X-Forwarded-For lo puede falsificar el
    // cliente salvo que un proxy propio lo sobrescriba (ver TRUST_PROXY).
    const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    if (email) return `email:${email}`;

    // Nunca X-Tenant-ID: lo controla el cliente y daría un contador nuevo por petición.
    return `ip:${req.ip ?? 'unknown'}`;
  }
}

import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request & { tenantId?: string }, _res: Response, next: NextFunction) {
    // Extrae tenantId del header X-Tenant-ID o del subdomain
    const tenantId =
      (req.headers['x-tenant-id'] as string) ??
      this.extractFromSubdomain(req.hostname);

    if (tenantId) {
      req.tenantId = tenantId;
    }

    next();
  }

  private extractFromSubdomain(hostname: string): string | null {
    const parts = hostname.split('.');
    // subdomain.cafeflow.app → subdomain es el tenant slug
    if (parts.length >= 3 && parts[0] !== 'www' && parts[0] !== 'api') {
      return parts[0];
    }
    return null;
  }
}

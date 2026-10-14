import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async findAll(
    tenantId: string,
    options: {
      page?: number;
      limit?: number;
      userId?: string;
      entity?: string;
      action?: string;
    } = {},
  ) {
    const { page = 1, limit = 50, userId, entity, action } = options;

    const where = {
      tenantId,
      ...(userId && { userId }),
      ...(entity && { entity }),
      ...(action && { action }),
    };

    const [logs, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        include: {
          user: { select: { firstName: true, lastName: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      logs,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }
}

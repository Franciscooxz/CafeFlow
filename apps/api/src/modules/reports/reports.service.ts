import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { Decimal, ZERO, roundMoney } from '../../common/money';
import {
  DEFAULT_TIMEZONE,
  addDaysYmd,
  startOfDayUtc,
  ymdInTimezone,
} from '../../common/timezone';

@Injectable()
export class ReportsService {
  constructor(private prisma: PrismaService) {}

  // ─── Helpers ──────────────────────────────────────────────────────────────

  // Los "días" de los reportes son días de la tienda, no del servidor (que en
  // producción corre en UTC: a las 7 pm de Bogotá ya es el día siguiente).
  private async tenantTimezone(tenantId: string): Promise<string> {
    const store = await this.prisma.store.findFirst({
      where: { tenantId },
      orderBy: { createdAt: 'asc' },
      select: { timezone: true },
    });
    return store?.timezone ?? DEFAULT_TIMEZONE;
  }

  private async rangeWhere(tenantId: string, from?: string, to?: string) {
    const createdAt: { gte?: Date; lt?: Date } = {};
    if (from || to) {
      const tz = await this.tenantTimezone(tenantId);
      if (from) createdAt.gte = startOfDayUtc(from, tz);
      if (to) createdAt.lt = startOfDayUtc(addDaysYmd(to, 1), tz);
    }
    return {
      tenantId,
      status: 'COMPLETED' as const,
      ...(Object.keys(createdAt).length > 0 && { createdAt }),
    };
  }

  // ─── KPIs del dashboard ───────────────────────────────────────────────────

  async getDashboard(tenantId: string) {
    const tz = await this.tenantTimezone(tenantId);
    const today = ymdInTimezone(new Date(), tz);

    const todayStart = startOfDayUtc(today, tz);
    const weekStart = startOfDayUtc(addDaysYmd(today, -6), tz);
    const monthStart = startOfDayUtc(addDaysYmd(today, -29), tz);
    const prevMonthStart = startOfDayUtc(addDaysYmd(today, -59), tz);

    const [todayAgg, week, month, prevMonth, products, lowStockProducts] = await Promise.all([
      this.prisma.order.aggregate({
        where: { tenantId, status: 'COMPLETED', createdAt: { gte: todayStart } },
        _sum: { total: true },
        _count: true,
        _avg: { total: true },
      }),
      this.prisma.order.aggregate({
        where: { tenantId, status: 'COMPLETED', createdAt: { gte: weekStart } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: { tenantId, status: 'COMPLETED', createdAt: { gte: monthStart } },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: {
          tenantId,
          status: 'COMPLETED',
          createdAt: { gte: prevMonthStart, lt: monthStart },
        },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.product.count({ where: { tenantId, isActive: true } }),
      this.prisma.product.count({
        where: {
          tenantId,
          isActive: true,
          stock: { gt: 0, lte: this.prisma.product.fields.lowStockAlert },
        },
      }),
    ]);

    const monthSales = month._sum.total ?? ZERO;
    const prevMonthSales = prevMonth._sum.total ?? ZERO;
    const growth = prevMonthSales.greaterThan(0)
      ? monthSales
          .minus(prevMonthSales)
          .dividedBy(prevMonthSales)
          .times(100)
          .toDecimalPlaces(0, Decimal.ROUND_HALF_UP)
          .toNumber()
      : null;

    return {
      today: {
        sales: todayAgg._sum.total ?? 0,
        orders: todayAgg._count,
        avgTicket: roundMoney(todayAgg._avg.total ?? 0),
      },
      week: { sales: week._sum.total ?? 0, orders: week._count },
      month: { sales: monthSales, orders: month._count, growth },
      inventory: { totalProducts: products, lowStockProducts },
    };
  }

  // ─── Tendencia de ventas ──────────────────────────────────────────────────

  async getSalesTrend(tenantId: string, days = 7, from?: string, to?: string) {
    const tz = await this.tenantTimezone(tenantId);
    const endYmd = from && to ? to : ymdInTimezone(new Date(), tz);
    const startYmd = from && to ? from : addDaysYmd(endYmd, -(days - 1));
    const start = startOfDayUtc(startYmd, tz);
    const end = startOfDayUtc(addDaysYmd(endYmd, 1), tz);

    // "createdAt" es timestamp sin zona guardado en UTC: se pasa a UTC explícito
    // y luego a la zona de la tienda antes de truncar al día.
    const rows = await this.prisma.$queryRaw<
      { day: string; total: Decimal; orders: number }[]
    >`
      SELECT to_char(("createdAt" AT TIME ZONE 'UTC') AT TIME ZONE ${tz}, 'YYYY-MM-DD') AS day,
             SUM("total") AS total,
             COUNT(*)::int AS orders
      FROM "orders"
      WHERE "tenantId" = ${tenantId}
        AND "status" = 'COMPLETED'
        AND "createdAt" >= (${start.toISOString()}::timestamptz AT TIME ZONE 'UTC')
        AND "createdAt" <  (${end.toISOString()}::timestamptz AT TIME ZONE 'UTC')
      GROUP BY day
    `;
    const byDay = new Map(rows.map((r) => [r.day, r]));

    const result: { date: string; label: string; total: Decimal; orders: number }[] = [];
    for (let ymd = startYmd; ymd <= endYmd; ymd = addDaysYmd(ymd, 1)) {
      const row = byDay.get(ymd);
      result.push({
        date: ymd,
        label: new Date(`${ymd}T12:00:00Z`).toLocaleDateString('es-CO', {
          weekday: 'short',
          day: 'numeric',
          timeZone: 'UTC',
        }),
        total: row?.total ?? ZERO,
        orders: row?.orders ?? 0,
      });
    }
    return result;
  }

  // ─── Top productos ────────────────────────────────────────────────────────

  async getTopProducts(tenantId: string, limit = 8, from?: string, to?: string) {
    const where = await this.rangeWhere(tenantId, from, to);
    if (!from && !to) {
      const monthAgo = new Date();
      monthAgo.setDate(monthAgo.getDate() - 30);
      (where as any).createdAt = { gte: monthAgo };
    }

    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: where },
      _sum: { quantity: true, subtotal: true },
      orderBy: { _sum: { subtotal: 'desc' } },
      take: limit,
    });

    if (items.length === 0) return [];

    const productIds = items.map((i) => i.productId);
    // FIX: agregar tenantId al filtro para evitar cross-tenant data leak
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, tenantId },
      select: {
        id: true,
        name: true,
        price: true,
        category: { select: { name: true, color: true } },
      },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    return items
      .map((item) => ({
        product: productMap.get(item.productId),
        quantity: item._sum.quantity ?? 0,
        revenue: item._sum.subtotal ?? 0,
      }))
      .filter((item) => item.product !== undefined);
  }

  // ─── Ventas por categoría ─────────────────────────────────────────────────

  async getSalesByCategory(tenantId: string, from?: string, to?: string) {
    const orderWhere = await this.rangeWhere(tenantId, from, to);

    const items = await this.prisma.orderItem.groupBy({
      by: ['productId'],
      where: { order: orderWhere },
      _sum: { quantity: true, subtotal: true },
    });

    if (items.length === 0) return [];

    const productIds = items.map((i) => i.productId);
    // FIX: agregar tenantId al filtro para evitar cross-tenant data leak
    const products = await this.prisma.product.findMany({
      where: { id: { in: productIds }, tenantId },
      include: { category: { select: { id: true, name: true, color: true } } },
    });
    const productMap = new Map(products.map((p) => [p.id, p]));

    const categoryMap: Record<
      string,
      { name: string; color: string | null; revenue: Decimal; quantity: number }
    > = {};

    for (const item of items) {
      const product = productMap.get(item.productId);
      const catId = product?.categoryId ?? 'uncategorized';
      const catName = product?.category?.name ?? 'Sin categoría';
      const catColor = product?.category?.color ?? null;

      if (!categoryMap[catId]) {
        categoryMap[catId] = { name: catName, color: catColor, revenue: ZERO, quantity: 0 };
      }
      categoryMap[catId].revenue = categoryMap[catId].revenue.plus(item._sum.subtotal ?? 0);
      categoryMap[catId].quantity += item._sum.quantity ?? 0;
    }

    return Object.entries(categoryMap)
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.revenue.comparedTo(a.revenue));
  }

  // ─── Stats por método de pago ─────────────────────────────────────────────

  async getPaymentStats(tenantId: string, from?: string, to?: string) {
    const where = await this.rangeWhere(tenantId, from, to);

    const [cash, card, mixed] = await Promise.all([
      this.prisma.order.aggregate({
        where: { ...where, paymentMethod: 'CASH' },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: { ...where, paymentMethod: 'CARD' },
        _sum: { total: true },
        _count: true,
      }),
      this.prisma.order.aggregate({
        where: { ...where, paymentMethod: 'MIXED' },
        _sum: { total: true },
        _count: true,
      }),
    ]);

    return [
      { method: 'CASH', label: 'Efectivo', total: cash._sum.total ?? 0, count: cash._count },
      { method: 'CARD', label: 'Tarjeta', total: card._sum.total ?? 0, count: card._count },
      { method: 'MIXED', label: 'Mixto', total: mixed._sum.total ?? 0, count: mixed._count },
    ];
  }

  // ─── Últimas ventas ───────────────────────────────────────────────────────

  async getRecentOrders(tenantId: string, limit = 10, from?: string, to?: string) {
    const where = await this.rangeWhere(tenantId, from, to);
    return this.prisma.order.findMany({
      where,
      select: {
        id: true,
        ticketNumber: true,
        total: true,
        discountAmount: true,
        paymentMethod: true,
        createdAt: true,
        user: { select: { firstName: true, lastName: true } },
        store: { select: { name: true } },
        customer: { select: { name: true } },
        _count: { select: { items: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  // ─── Resumen de rango (para página /reports) ──────────────────────────────

  async getRangeSummary(tenantId: string, from?: string, to?: string) {
    const where = await this.rangeWhere(tenantId, from, to);

    const [agg, trend, categories, payments, topProducts] = await Promise.all([
      this.prisma.order.aggregate({
        where,
        _sum: { total: true, discountAmount: true },
        _count: true,
        _avg: { total: true },
      }),
      this.getSalesTrend(tenantId, 7, from, to),
      this.getSalesByCategory(tenantId, from, to),
      this.getPaymentStats(tenantId, from, to),
      this.getTopProducts(tenantId, 8, from, to),
    ]);

    return {
      summary: {
        totalSales: agg._sum.total ?? 0,
        totalOrders: agg._count,
        avgTicket: roundMoney(agg._avg.total ?? 0),
        totalDiscount: agg._sum.discountAmount ?? 0,
      },
      trend,
      categories,
      payments,
      topProducts,
    };
  }
}

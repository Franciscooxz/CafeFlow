import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import type { KdsOrder } from './kds.mapper';
import { corsOrigin } from '../../common/cors';

@WebSocketGateway({
  cors: {
    origin: corsOrigin,
    credentials: true,
  },
  namespace: '/pos',
})
export class PosGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(PosGateway.name);

  constructor(
    private jwtService: JwtService,
    private config: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      // 1. Token explícito en auth (legacy / tools externos)
      let token: string | null =
        client.handshake.auth?.token ??
        client.handshake.headers?.authorization?.replace('Bearer ', '') ??
        null;

      // 2. Cookie httpOnly access_token (nuevo flujo seguro)
      if (!token) {
        const cookieHeader = (client.handshake.headers?.cookie as string) ?? '';
        const match = cookieHeader.match(/(?:^|;\s*)access_token=([^;]+)/);
        token = match?.[1] ?? null;
      }

      if (!token) {
        client.disconnect();
        return;
      }

      const payload = this.jwtService.verify(token, {
        secret: this.config.get<string>('JWT_SECRET'),
      });

      // Unirse a room del tenant
      const tenantRoom = `tenant:${payload.tenantId}`;
      client.join(tenantRoom);

      // Unirse a room de la tienda si tiene una asignada
      if (payload.storeId) {
        client.join(`store:${payload.storeId}`);
      }

      client.data.userId = payload.sub;
      client.data.tenantId = payload.tenantId;
      client.data.storeId = payload.storeId;

      this.logger.log(
        `Client connected: ${client.id} | Tenant: ${payload.tenantId}`,
      );
    } catch {
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('ping')
  handlePing(@ConnectedSocket() client: Socket) {
    client.emit('pong', { time: Date.now() });
  }

  // ─── Métodos para emitir eventos desde el servicio POS ───────────────────

  emitStockUpdated(tenantId: string, products: Array<{ id: string; stock: number; name: string }>) {
    this.server.to(`tenant:${tenantId}`).emit('stock:updated', { products });
  }

  // Los eventos de pedidos van solo a la room del tenant (el payload trae storeId
  // para filtrar): emitir también a store:* los duplica en clientes que están en ambas.
  emitOrderCreated(tenantId: string, order: KdsOrder) {
    this.server.to(`tenant:${tenantId}`).emit('order:created', { order });
  }

  emitOrderStatus(tenantId: string, order: KdsOrder) {
    this.server.to(`tenant:${tenantId}`).emit('order:status', { order });
  }

  emitOrderCancelled(tenantId: string, order: { id: string; storeId: string }) {
    this.server.to(`tenant:${tenantId}`).emit('order:cancelled', { order });
  }

  emitLowStockAlert(tenantId: string, product: { id: string; name: string; stock: number }) {
    this.server.to(`tenant:${tenantId}`).emit('stock:low', { product });
  }
}

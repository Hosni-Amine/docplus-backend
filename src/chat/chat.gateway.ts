import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { EUserStatus } from '../common';
import { UserRepository } from '../user/user.repository';

export const CHAT_PRESENCE_STATUSES = ['online', 'away', 'busy'] as const;
export type ChatPresenceStatus = (typeof CHAT_PRESENCE_STATUSES)[number];

type PresenceEntry = {
  officeId: string;
  sockets: number;
  status: ChatPresenceStatus;
};

function parseStatus(value: unknown): ChatPresenceStatus {
  return CHAT_PRESENCE_STATUSES.includes(value as ChatPresenceStatus)
    ? (value as ChatPresenceStatus)
    : 'online';
}

/**
 * Push-only socket: clients send through the REST routes, and the server
 * emits `message:new` to every participant's room (`user:<id>`).
 * Presence is tracked in memory, so it only works with a single instance.
 */
@WebSocketGateway({ namespace: '/chat', cors: { origin: true } })
export class ChatGateway implements OnGatewayConnection, OnGatewayDisconnect {
  private readonly logger = new Logger(ChatGateway.name);

  /** userId -> open sockets of that user. */
  private readonly online = new Map<string, PresenceEntry>();

  @WebSocketServer()
  private readonly server: Server;

  constructor(
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
    private readonly userRepository: UserRepository,
  ) {}

  /** Same checks as AuthGuard, with the token sent in `auth.token`. */
  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth?.token;
      if (!token) throw new Error('No token provided');

      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.config.getOrThrow('JWT_SECRET'),
        algorithms: ['HS256'],
      });
      const user = await this.userRepository.findOne(
        { _id: payload.id },
        { select: 'status tokenVersion officeId' },
      );
      if (!user || user.status !== EUserStatus.ACTIVE) {
        throw new Error('User is missing, disabled, or deleted');
      }
      if ((payload.tokenVersion ?? -1) !== (user.tokenVersion ?? 0)) {
        throw new Error('Token has been revoked');
      }

      const userId = user._id.toString();
      await client.join(`user:${userId}`);

      if (!user.officeId) return;
      const officeId = user.officeId.toString();
      await client.join(`office:${officeId}`);

      // The client can leave while the checks above are awaited; counting it
      // then would keep the user online forever.
      if (!client.connected) return;
      client.data.userId = userId;

      const status = parseStatus(client.handshake.auth?.status);
      const entry = this.online.get(userId);
      if (entry) {
        entry.sockets += 1;
        this.setStatus(userId, status);
      } else {
        this.online.set(userId, { officeId, sockets: 1, status });
        client.broadcast
          .to(`office:${officeId}`)
          .emit('presence:update', { userId, status });
      }

      client.emit('presence:list', this.presenceList(officeId));
    } catch (error: any) {
      this.logger.warn(error?.message ?? 'Socket rejected');
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    const userId: string | undefined = client.data.userId;
    const entry = userId ? this.online.get(userId) : undefined;
    if (!userId || !entry) return;

    entry.sockets -= 1;
    if (entry.sockets > 0) return;

    this.online.delete(userId);
    this.server
      .to(`office:${entry.officeId}`)
      .emit('presence:update', { userId, status: 'offline' });
  }

  @SubscribeMessage('presence:set')
  handleSetStatus(
    @ConnectedSocket() client: Socket,
    @MessageBody() status: unknown,
  ) {
    const userId: string | undefined = client.data.userId;
    if (!userId || !this.online.has(userId)) return;
    this.setStatus(userId, parseStatus(status));
  }

  private setStatus(userId: string, status: ChatPresenceStatus) {
    const entry = this.online.get(userId);
    if (!entry || entry.status === status) return;

    entry.status = status;
    this.server
      .to(`office:${entry.officeId}`)
      .emit('presence:update', { userId, status });
  }

  private presenceList(officeId: string) {
    return [...this.online.entries()]
      .filter(([, entry]) => entry.officeId === officeId)
      .map(([userId, entry]) => ({ userId, status: entry.status }));
  }

  emitToUsers(userIds: string[], event: string, payload: unknown) {
    if (!userIds.length) return;
    this.server.to(userIds.map((id) => `user:${id}`)).emit(event, payload);
  }
}

import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*', // 生产环境应该限制为具体域名
    credentials: true,
  },
  namespace: '/chat',
})
export class ConversationGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server: Server;

  private logger: Logger = new Logger('ConversationGateway');
  private sessionSocketMap: Map<string, Set<string>> = new Map(); // sessionId -> Set<socketId>
  private socketSessionMap: Map<string, { sessionId: string, userType: string }> = new Map(); // socketId -> session info

  handleConnection(client: Socket) {
    this.logger.log(`客户端已连接: ${client.id}`);
  }

  async handleDisconnect(client: Socket) {
    this.logger.log(`客户端已断开: ${client.id}`);
    
    // 获取该socket对应的会话信息
    const sessionInfo = this.socketSessionMap.get(client.id);
    
    // 清理该socket的所有会话订阅
    this.sessionSocketMap.forEach((sockets, sessionId) => {
      if (sockets.has(client.id)) {
        sockets.delete(client.id);
        if (sockets.size === 0) {
          this.sessionSocketMap.delete(sessionId);
        }
      }
    });
    
    // 清理socket映射
    this.socketSessionMap.delete(client.id);
    
    // 如果是用户断开连接，通知该会话
    if (sessionInfo && sessionInfo.userType === 'user') {
      this.logger.log(`用户离开会话: ${sessionInfo.sessionId}`);
      // 向该会话广播用户离开消息
      this.server.to(sessionInfo.sessionId).emit('user-left', {
        sessionId: sessionInfo.sessionId,
        message: '用户已离开会话',
      });
    }
  }

  // 客户端加入会话房间
  @SubscribeMessage('join-session')
  handleJoinSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string; userType: 'user' | 'agent' },
  ) {
    const { sessionId, userType } = data;
    
    // 加入房间
    client.join(sessionId);
    
    // 记录socket与session的映射
    if (!this.sessionSocketMap.has(sessionId)) {
      this.sessionSocketMap.set(sessionId, new Set());
    }
    this.sessionSocketMap.get(sessionId)!.add(client.id);
    
    // 记录socket到session的映射
    this.socketSessionMap.set(client.id, { sessionId, userType });
    
    this.logger.log(`${userType} ${client.id} 加入会话: ${sessionId}`);
    
    return {
      success: true,
      message: `已加入会话 ${sessionId}`,
    };
  }

  // 客户端离开会话房间
  @SubscribeMessage('leave-session')
  handleLeaveSession(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { sessionId: string, userType?: string },
  ) {
    const { sessionId, userType } = data;
    
    client.leave(sessionId);
    
    // 清理映射
    const sockets = this.sessionSocketMap.get(sessionId);
    if (sockets) {
      sockets.delete(client.id);
      if (sockets.size === 0) {
        this.sessionSocketMap.delete(sessionId);
      }
    }
    
    // 获取并清理socket映射
    const sessionInfo = this.socketSessionMap.get(client.id);
    if (sessionInfo && sessionInfo.sessionId === sessionId) {
      this.socketSessionMap.delete(client.id);
    }
    
    this.logger.log(`客户端 ${client.id} 离开会话: ${sessionId}`);
    
    // 如果是用户主动离开，广播通知
    if (userType === 'user' || (sessionInfo && sessionInfo.userType === 'user')) {
      this.server.to(sessionId).emit('user-left', {
        sessionId,
        message: '用户已离开会话',
      });
    }
    
    return {
      success: true,
      message: `已离开会话 ${sessionId}`,
    };
  }

  // 广播新消息到指定会话
  broadcastMessage(sessionId: string, message: any) {
    this.logger.log(`广播消息到会话 ${sessionId}: ${JSON.stringify(message)}`);
    this.server.to(sessionId).emit('new-message', message);
  }

  // 广播会话状态变更（如转人工）
  broadcastSessionUpdate(sessionId: string, update: any) {
    this.logger.log(`广播会话更新到 ${sessionId}: ${JSON.stringify(update)}`);
    this.server.to(sessionId).emit('session-update', update);
  }

  // 通知客服有新会话需要处理
  notifyAgents(data: any) {
    this.logger.log('通知所有客服有新会话');
    this.server.emit('new-agent-session', data);
  }

  // 通知客服有新消息（包括未转人工的会话）
  notifyAgentsNewMessage(data: any) {
    this.logger.log('通知所有客服有新消息');
    this.server.emit('new-user-message', data);
  }
}


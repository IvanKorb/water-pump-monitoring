import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway(3002, {
  cors: {
    origin: '*',
  },
})
export class MqttGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  handleConnection(client: Socket) {
    console.log('[WS] Client connected:', client.id);
  }

  handleDisconnect(client: Socket) {
    console.log('[WS] Client disconnected:', client.id);
  }

  @SubscribeMessage('joinDevice')
  handleJoinDevice(
    @MessageBody() devEui: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('[WS] joinDevice from', client.id, '→', devEui);
    client.join(devEui);

    console.log('[WS] client rooms after join:', client.rooms);
  }

  @SubscribeMessage('leaveDevice')
  handleLeaveDevice(
    @MessageBody() devEui: string,
    @ConnectedSocket() client: Socket,
  ) {
    console.log('[WS] leaveDevice from', client.id, '→', devEui);
    client.leave(devEui);
    console.log('[WS] client rooms after leave:', client.rooms);
  }

  sendTelemetry(devEui: string, data: any) {
    console.log('[WS] sendTelemetry to room', devEui);
    this.server.to(devEui).emit('telemetry', data);
  }

  sendMessage(data: any) {
    const clientsCount = this.server.sockets.sockets.size;
    if (clientsCount > 0) {
      console.log('[WS] legacy sendMessage broadcast, clients:', clientsCount);
      this.server.sockets.emit('message', data);
    }
  }
}
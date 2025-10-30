import { Module } from '@nestjs/common';
import { ClientController } from './client.controller';
import { ClientService } from './client.service';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MessagesGateway } from 'src/websocket/messages.gateway';

@Module({
  imports: [PrismaModule],
  controllers: [ClientController],
  providers: [ClientService, MessagesGateway],
})
export class ClientModule {}

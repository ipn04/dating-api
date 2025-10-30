import {
  Controller,
  Param,
  Post,
  UseGuards,
  Req,
  HttpCode,
  Get,
  HttpStatus,
  Body,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/auth/jwt-auth.guard';
import { ClientService } from './client.service';

@Controller('client')
export class ClientController {
  constructor(private readonly clientService: ClientService) {}

  @UseGuards(JwtAuthGuard)
  @Post('like/:userId')
  @HttpCode(HttpStatus.OK)
  async likeUser(@Param('userId') userId: string, @Req() req) {
    const currentUserId = req.user.sub;
    return this.clientService.likeUser(currentUserId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('dislike/:userId')
  @HttpCode(HttpStatus.OK)
  async dislikeUser(@Param('userId') userId: string, @Req() req) {
    const currentUserId = req.user.sub;
    return this.clientService.dislikeUser(currentUserId, userId);
  }

  @UseGuards(JwtAuthGuard)
  @Get('match')
  @HttpCode(HttpStatus.OK)
  async getMatches(@Req() req) {
    const currentUserId = req.user.sub;
    return this.clientService.getUserMatches(currentUserId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('/messages/send/:receiverId')
  @HttpCode(HttpStatus.OK)
  async sendMessage(
    @Param('receiverId') receiverId: string,
    @Body('content') content: string,
    @Req() req,
  ) {
    const senderId = req.user.sub;
    console.log('receiverId:', receiverId, 'content:', content);

    return this.clientService.sendMessage(senderId, receiverId, content);
  }

  @UseGuards(JwtAuthGuard)
  @Get('/messages/match/:matchId')
  @HttpCode(HttpStatus.OK)
  async getMessages(@Param('matchId') matchId: string, @Req() req) {
    const userId = req.user.sub;

    return this.clientService.getMessages(userId, matchId);
  }

  @UseGuards(JwtAuthGuard)
  @Post('unmatch/:userId')
  @HttpCode(HttpStatus.OK)
  async removeMatch(@Param('userId') userId: string, @Req() req) {
    const currentUserId = req.user.sub;
    return this.clientService.removeMatch(currentUserId, userId);
  }
}

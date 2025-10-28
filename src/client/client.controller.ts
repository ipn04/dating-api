import {
  Controller,
  Param,
  Post,
  UseGuards,
  Req,
  HttpCode,
  Get,
  HttpStatus,
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
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return this.clientService.getUserMatches(currentUserId);
  }
}

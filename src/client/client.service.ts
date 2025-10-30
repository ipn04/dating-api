import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class ClientService {
  constructor(private prisma: PrismaService) {}

  async likeUser(clientId: string, userId: string) {
    await this.prisma.like.upsert({
      where: {
        clientId_userId: {
          clientId,
          userId,
        },
      },
      update: {
        liked: true,
      },
      create: {
        clientId,
        userId,
        liked: true,
      },
    });

    const reciprocal = await this.prisma.like.findUnique({
      where: {
        clientId_userId: {
          clientId: userId,
          userId: clientId,
        },
      },
    });

    if (reciprocal?.liked) {
      const [firstId, secondId] = [clientId, userId].sort();
      await this.prisma.match.upsert({
        where: {
          userAId_userBId: {
            userAId: firstId,
            userBId: secondId,
          },
        },
        update: {},
        create: {
          userAId: firstId,
          userBId: secondId,
        },
      });
    }

    return { success: true };
  }

  async dislikeUser(clientId: string, userId: string) {
    await this.prisma.like.upsert({
      where: {
        clientId_userId: {
          clientId,
          userId,
        },
      },
      update: {
        liked: false,
      },
      create: {
        clientId,
        userId,
        liked: false,
      },
    });

    return { success: true };
  }

  async getUserMatches(userId: string) {
    const matches = await this.prisma.match.findMany({
      where: {
        OR: [{ userAId: userId }, { userBId: userId }],
      },
      include: {
        userA: true,
        userB: true,
      },
    });

    const result = matches.map((match) => {
      const otherUser = match.userAId === userId ? match.userB : match.userA;
      return {
        id: otherUser.id,
        name: otherUser.name,
        age: otherUser.age,
        bio: otherUser.bio,
        profile: otherUser.profile,
        matchId: match.id,
        createdAt: match.createdAt,
      };
    });

    return result;
  }

  async sendMessage(senderId: string, receiverId: string, content: string) {
    const match = await this.prisma.match.findFirst({
      where: {
        OR: [
          { userAId: senderId, userBId: receiverId },
          { userAId: receiverId, userBId: senderId },
        ],
      },
    });

    if (!match) {
      throw new BadRequestException(
        'You can only message users you have matched with',
      );
    }

    return this.prisma.message.create({
      data: {
        matchId: match.id,
        senderId,
        receiverId,
        content,
      },
    });
  }

  async getMessages(userId: string, matchId: string) {
    const match = await this.prisma.match.findUnique({
      where: { id: matchId },
    });

    if (!match || (match.userAId !== userId && match.userBId !== userId)) {
      throw new BadRequestException('You are not part of this match');
    }

    await this.prisma.message.updateMany({
      where: {
        matchId,
        receiverId: userId,
        isDelivered: true,
      },
      data: {
        isDelivered: true,
      },
    });

    return this.prisma.message.findMany({
      where: { matchId },
      orderBy: { createdAt: 'asc' },
    });
  }

  async removeMatch(userId: string, otherUserId: string) {
    const [firstId, secondId] = [userId, otherUserId].sort();

    const match = await this.prisma.match.findUnique({
      where: {
        userAId_userBId: {
          userAId: firstId,
          userBId: secondId,
        },
      },
    });

    if (!match) {
      throw new BadRequestException('No match exists between these users');
    }

    await this.prisma.match.delete({
      where: {
        id: match.id,
      },
    });

    return { success: true };
  }
}

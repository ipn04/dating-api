import { Injectable } from '@nestjs/common';
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
      };
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    return result;
  }
}

import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthEmailLoginDto, AuthSignupDto } from './dto';
import { S3Service } from 'src/services/upload-aws-bucket/aws-s3.services';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private s3Service: S3Service,
  ) {}

  async login(loginDto: AuthEmailLoginDto) {
    const { email, password } = loginDto;
    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user) throw new UnauthorizedException('Invalid email or password');

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) throw new UnauthorizedException('Invalid email or password');

    const payload = { sub: user.id, email: user.email };
    const token = this.jwtService.sign(payload);
    return {
      access_token: token,
    };
  }

  async signup(signupDto: AuthSignupDto, file: Express.Multer.File) {
    try {
      if (!file) {
        throw new BadRequestException('Profile file is required');
      }

      const allowedTypes = ['png', 'jpg', 'jpeg', 'webp'];
      const fileType = file.originalname.split('.').pop()?.toLowerCase();
      if (!fileType || !allowedTypes.includes(fileType)) {
        throw new BadRequestException(
          'Invalid file type. Only PNG, JPG, JPEG, and WEBP are allowed',
        );
      }

      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(signupDto.email)) {
        throw new BadRequestException('Invalid email format');
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email: signupDto.email },
      });
      if (existingUser) {
        throw new BadRequestException('Email already exists');
      }

      const profileUrl = await this.s3Service.uploadProfileImage(
        file.buffer,
        fileType,
      );

      const hashedPassword = await bcrypt.hash(signupDto.password, 10);

      const user = await this.prisma.user.create({
        data: {
          ...signupDto,
          password: hashedPassword,
          profile: profileUrl,
        },
      });

      const token = this.jwtService.sign({ sub: user.id, email: user.email });
      return { access_token: token };
    } catch (error) {
      console.error('Signup error:', error);
      throw error;
    }
  }

  async me(user: any) {
    const foundUser = await this.prisma.user.findUnique({
      where: { id: user.sub },
      select: {
        id: true,
        name: true,
        age: true,
        bio: true,
        email: true,
        profile: true,
      },
    });

    if (!foundUser) {
      throw new UnauthorizedException('User not found');
    }
    return foundUser;
  }

  async getAllUsers(currentUserId: string) {
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          not: currentUserId,
          notIn: (
            await this.prisma.like.findMany({
              where: { clientId: currentUserId },
              select: { userId: true },
            })
          ).map(
            (like) =>
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return
              like.userId,
          ),
        },
      },
      select: {
        id: true,
        name: true,
        age: true,
        bio: true,
        email: true,
        profile: true,
      },
    });

    return users;
  }
}

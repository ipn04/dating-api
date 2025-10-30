import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { AuthEmailLoginDto, AuthSignupDto } from './dto';
import { S3Service } from 'src/services/upload-aws-bucket/aws-s3.services';
import { UpdateUserDto } from './dto/update-user.dto';

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

      const password = signupDto.password;

      if (password.length < 8) {
        throw new BadRequestException(
          'Password must be at least 8 characters long',
        );
      }

      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
        throw new BadRequestException('Password must be alphanumeric');
      }

      if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        throw new BadRequestException(
          'Password must contain at least one special character',
        );
      }

      const profileUrl = await this.s3Service.uploadProfileImage(
        file.buffer,
        fileType,
      );

      const hashedPassword = await bcrypt.hash(password, 10);

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

  async getAllUsers(currentUserId: string, minAge?: number, maxAge?: number) {
    const users = await this.prisma.user.findMany({
      where: {
        id: {
          not: currentUserId,
          notIn: (
            await this.prisma.like.findMany({
              where: { clientId: currentUserId },
              select: { userId: true },
            })
          ).map((like) => like.userId),
        },
        age: {
          gte: minAge ?? 18,
          lte: maxAge ?? 80,
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

  async updateUser(
    userId: string,
    updateUserDto: UpdateUserDto,
    file?: Express.Multer.File,
  ) {
    const { name, age, bio } = updateUserDto;

    if (!name || name.trim() === '') {
      throw new BadRequestException('Name cannot be empty');
    }

    if (age === undefined || age === null) {
      throw new BadRequestException('Age is required');
    }

    if (!bio || bio.trim() === '') {
      throw new BadRequestException('Bio cannot be empty');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    if (!file && !user.profile) {
      throw new BadRequestException('Profile image is required');
    }
    let profileUrl: string | undefined;

    if (file) {
      const allowedTypes = ['png', 'jpg', 'jpeg', 'webp'];
      const fileType = file.originalname.split('.').pop()?.toLowerCase();
      if (!fileType || !allowedTypes.includes(fileType)) {
        throw new BadRequestException(
          'Invalid file type. Only PNG, JPG, JPEG, and WEBP are allowed',
        );
      }

      profileUrl = await this.s3Service.uploadProfileImage(
        file.buffer,
        fileType,
      );
    }

    const updatedUser = await this.prisma.user.update({
      where: { id: userId },
      data: {
        ...updateUserDto,
        ...(profileUrl && { profile: profileUrl }),
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

    return updatedUser;
  }
}

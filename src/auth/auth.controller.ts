import {
  Controller,
  UseGuards,
  HttpStatus,
  UseInterceptors,
  ClassSerializerInterceptor,
  HttpCode,
  Body,
  Put,
  Request,
  UploadedFile,
  Req,
  Query,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthService } from './auth.service';
import { Post, Get } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { AuthEmailLoginDto, AuthSignupDto } from './dto';
import * as multer from 'multer';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('auth')
@UseInterceptors(ClassSerializerInterceptor)
export class AuthController {
  constructor(public authService: AuthService) {}

  @UseGuards(ThrottlerGuard)
  @Throttle({ default: { limit: 5, ttl: 9 } })
  @Post('login')
  @HttpCode(HttpStatus.OK)
  public async login(@Body() loginDto: AuthEmailLoginDto) {
    return this.authService.login(loginDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @HttpCode(HttpStatus.OK)
  public async me(@Request() request) {
    return this.authService.me(request.user);
  }

  @UseGuards(JwtAuthGuard)
  @Get('allUser')
  @HttpCode(HttpStatus.OK)
  @UseGuards(JwtAuthGuard)
  public async getAllUser(
    @Request() req,
    @Query('minAge') minAge?: string,
    @Query('maxAge') maxAge?: string,
  ) {
    const currentUserId = req.user.sub;

    return this.authService.getAllUsers(
      currentUserId,
      minAge ? Number(minAge) : undefined,
      maxAge ? Number(maxAge) : undefined,
    );
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  // eslint-disable-next-line @typescript-eslint/require-await
  public async logout() {
    return { message: 'Successfully logged out' };
  }

  @UseGuards(ThrottlerGuard)
  @Post('signup')
  @UseInterceptors(
    FileInterceptor('profile', { storage: multer.memoryStorage() }),
  )
  @HttpCode(HttpStatus.CREATED)
  public async signup(
    // @Body() signupDto: AuthSignupDto,
    @Body() body: any,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const signupDto: AuthSignupDto = {
      name: body.name,
      age: Number(body.age),
      bio: body.bio,
      email: body.email,
      password: body.password,
    };
    return this.authService.signup(signupDto, file);
  }

  @UseGuards(JwtAuthGuard)
  @Put('update')
  @UseInterceptors(FileInterceptor('profile'))
  public async updateUser(
    @Req() req,
    @Body() body: any,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    const userId = req.user.sub;
    const updateUserDto: UpdateUserDto = {
      name: body.name,
      age: Number(body.age),
      bio: body.bio,
    };

    return this.authService.updateUser(userId, updateUserDto, file);
  }
}

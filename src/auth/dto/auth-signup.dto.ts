import { IsEmail, IsNotEmpty, IsString, IsInt } from 'class-validator';

export class AuthSignupDto {
  @IsNotEmpty()
  @IsString()
  name: string;

  @IsInt()
  age: number;

  @IsNotEmpty()
  @IsString()
  bio: string;

  @IsEmail()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;
}

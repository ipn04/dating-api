import { IsOptional, IsString, IsInt } from 'class-validator';

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  name: string;

  @IsOptional()
  @IsInt()
  age: number;

  @IsOptional()
  @IsString()
  bio: string;
}

import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class RefreshTokenDto {
  @IsNotEmpty()
  @IsString()
  @MaxLength(256)
  refreshToken!: string;
}

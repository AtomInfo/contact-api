import { IsEmail, IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email!: string;

  // Upper bound keeps bcrypt work bounded; bcrypt ignores bytes past 72 anyway.
  @IsNotEmpty()
  @IsString()
  @MaxLength(128)
  password!: string;
}

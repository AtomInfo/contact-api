import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { AdminAuthGuard } from './admin-auth.guard';
import { AUTH_CONFIG, loadAuthConfig } from './auth.config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      useFactory: () => {
        const config = loadAuthConfig();
        return {
          secret: config.jwtSecret,
          signOptions: {
            algorithm: 'HS256',
            expiresIn: config.accessTokenTtlSeconds,
          },
          verifyOptions: { algorithms: ['HS256'] },
        };
      },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    AdminAuthGuard,
    { provide: AUTH_CONFIG, useFactory: () => loadAuthConfig() },
  ],
  exports: [AuthService, AdminAuthGuard],
})
export class AuthModule {}

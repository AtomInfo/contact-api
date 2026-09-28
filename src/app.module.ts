import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { ContactsController } from './contacts/contacts.controller';
import { ContactsService } from './contacts/contacts.service';
import { HealthController } from './health/health.controller';

@Module({
  imports: [AuthModule],
  controllers: [AppController, HealthController, ContactsController],
  providers: [AppService, ContactsService],
})
export class AppModule {}

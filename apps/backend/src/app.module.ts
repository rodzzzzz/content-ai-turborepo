import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from '@mguay/nestjs-better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { betterAuth } from 'better-auth';
import { PrismaService } from './prisma/prisma.service';
import { PrismaModule } from './prisma/prisma.module';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    ConfigModule.forRoot(),
    PrismaModule,
    AuthModule.forRootAsync({
      useFactory: (prisma: PrismaService) => ({
        auth: betterAuth({
          database: prismaAdapter(prisma, {
            provider: 'postgresql',
          }),
          emailAndPassword: {
            enabled: true,
          },
          trustedOrigins: ['http://localhost:3001'],
        }),
      }),
      inject: [PrismaService],
    }),
    UsersModule,
  ],
})
export class AppModule {}

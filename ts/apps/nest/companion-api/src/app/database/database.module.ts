import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { ConfigModule } from '@nestjs/config';
import { CacheConfigService } from '../common/cache.config.service';
import { DatabaseHealthIndicator } from './database.health';
import { DatabaseService } from './database.service';

@Module({
  imports: [
    ConfigModule,
    CacheModule.registerAsync({ useClass: CacheConfigService }),
  ],
  providers: [DatabaseService, DatabaseHealthIndicator],
  exports: [DatabaseService, DatabaseHealthIndicator],
})
export class DatabaseModule {}

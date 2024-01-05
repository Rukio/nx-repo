import { Module } from '@nestjs/common';
import { WinstonModule } from 'nest-winston';
import { loggerOptions } from './logger';

@Module({
  imports: [WinstonModule.forRoot(loggerOptions)],
  exports: [WinstonModule],
})
export class LoggerModule {}

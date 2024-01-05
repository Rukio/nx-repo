import { HttpModule } from '@nestjs/axios';
import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import CreditCardController from './credit-card.controller';
import CreditCardService from './credit-card.service';
import LoggerModule from '../logger/logger.module';

@Module({
  imports: [LoggerModule, HttpModule, ConfigModule],
  controllers: [CreditCardController],
  providers: [CreditCardService],
  exports: [CreditCardService, HttpModule],
})
export default class CreditCardModule {}

import { Module } from '@nestjs/common';
import { PassportModule } from '@nestjs/passport';
import { ConfigModule } from '@nestjs/config';
import { OssStrategy } from './oss.strategy';
import { AOBStrategy } from './aob.strategy';

@Module({
  imports: [ConfigModule, PassportModule.register({})],
  providers: [OssStrategy, AOBStrategy],
  exports: [PassportModule],
})
export default class JwtModule {}

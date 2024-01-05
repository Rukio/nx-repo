import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { OssStrategyJwtPayloadDto } from './dto/oss.strategy.dto';

@Injectable()
export class OssStrategy extends PassportStrategy(Strategy, 'oss') {
  constructor(private configService: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get(
          'WEB_REQUEST_AUTH0_ISSUER_BASE_URL'
        )}.well-known/jwks.json`,
      }),

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.get('WEB_REQUEST_AUTH0_AUDIENCE'),
      issuer: configService.get('WEB_REQUEST_AUTH0_ISSUER_BASE_URL'),
      algorithms: ['RS256'],
    });
  }

  validate(payload: OssStrategyJwtPayloadDto): OssStrategyJwtPayloadDto {
    return payload;
  }
}

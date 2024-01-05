import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { passportJwtSecret } from 'jwks-rsa';
import { ConfigService } from '@nestjs/config';
import { AOBStrategyJwtPayloadDto } from './dto/aob.strategy.dto';

@Injectable()
export class AOBStrategy extends PassportStrategy(Strategy, 'aob') {
  constructor(private configService: ConfigService) {
    super({
      secretOrKeyProvider: passportJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `${configService.get(
          'ONBOARDING_AUTH0_ISSUER_BASE_URL'
        )}.well-known/jwks.json`,
      }),

      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      audience: configService.get('ONBOARDING_AUTH0_AUDIENCE'),
      issuer: configService.get('ONBOARDING_AUTH0_ISSUER_BASE_URL'),
      algorithms: ['RS256'],
    });
  }

  validate(payload: AOBStrategyJwtPayloadDto): AOBStrategyJwtPayloadDto {
    return payload;
  }
}

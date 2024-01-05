import { OssStrategy } from '../oss.strategy';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { OssStrategyPayloadMock } from './oss.strategy.mock';

describe(`${OssStrategy.name}`, () => {
  let ossStrategy: OssStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, PassportModule],
      providers: [OssStrategy],
    }).compile();

    ossStrategy = module.get<OssStrategy>(OssStrategy);
  });

  describe(`${OssStrategy.prototype.validate.name}`, () => {
    it('should return the payload for auth', () => {
      expect(ossStrategy.validate(OssStrategyPayloadMock)).toBe(
        OssStrategyPayloadMock
      );
    });
  });
});

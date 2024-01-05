import { AOBStrategy } from '../aob.strategy';
import { Test, TestingModule } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { PassportModule } from '@nestjs/passport';
import { aobStrategyPayloadMock } from './aob.strategy.mock';

describe(`${AOBStrategy.name}`, () => {
  let aobStrategy: AOBStrategy;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ConfigModule, PassportModule],
      providers: [AOBStrategy],
    }).compile();

    aobStrategy = module.get<AOBStrategy>(AOBStrategy);
  });

  describe(`${AOBStrategy.prototype.validate.name}`, () => {
    it('should return the payload for auth', () => {
      expect(aobStrategy.validate(aobStrategyPayloadMock)).toBe(
        aobStrategyPayloadMock
      );
    });
  });
});

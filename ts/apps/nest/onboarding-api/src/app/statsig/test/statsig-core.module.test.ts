import { Test } from '@nestjs/testing';
import { StatsigOptionsFactory, StatsigModuleOptions } from '../interfaces';
import StatsigCoreModule from '../statsig-core.module';
import { STATSIG_TOKEN } from '../common';
import StatsigModule from '../statsig.module';

describe(`${StatsigCoreModule.name}`, () => {
  const config: StatsigModuleOptions = {
    secretApiKey: 'secret-12345678',
    options: {},
  };

  class TestService implements StatsigOptionsFactory {
    createStatsigOptions(): StatsigModuleOptions {
      return config;
    }
  }

  describe(`${StatsigCoreModule.forRoot.name}`, () => {
    it('should provide the sentry client', async () => {
      const module = await Test.createTestingModule({
        imports: [StatsigModule.forRoot(config)],
      }).compile();

      const sentry = module.get<StatsigModuleOptions>(STATSIG_TOKEN);
      expect(sentry).toBeDefined();
    });
  });

  describe(`${StatsigCoreModule.forRootAsync.name}`, () => {
    describe('when `useFactory` op is used', () => {
      it('should provide sentry client', async () => {
        const module = await Test.createTestingModule({
          imports: [
            StatsigModule.forRootAsync({
              useFactory: () => config,
            }),
          ],
        }).compile();

        const sentry = module.get<StatsigModuleOptions>(STATSIG_TOKEN);

        expect(sentry).toBeDefined();
      });
    });

    describe('when `useClass` option is used', () => {
      it('should provide sentry client', async () => {
        const module = await Test.createTestingModule({
          imports: [
            StatsigModule.forRootAsync({
              useClass: TestService,
            }),
          ],
        }).compile();

        const sentry = module.get<StatsigModuleOptions>(STATSIG_TOKEN);

        expect(sentry).toBeDefined();
      });
    });
  });
});

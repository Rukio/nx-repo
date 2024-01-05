import { INestApplication } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import sessionConfiguration, {
  SessionConfiguration,
} from '../session.configuration';

describe(`SessionConfiguration`, () => {
  let app: INestApplication;
  let sessionConfig: SessionConfiguration;

  async function initializeApplication() {
    const moduleRef = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          load: [sessionConfiguration],
          ignoreEnvFile: true,
        }),
      ],
    }).compile();

    sessionConfig = moduleRef.get<SessionConfiguration>(
      sessionConfiguration.KEY
    );

    app = moduleRef.createNestApplication();
    await app.init();
  }

  afterAll(async () => {
    await app.close();
  });

  describe(`COMPANION_SESSION_COOKIE_SECRET`, () => {
    test(`Is set correctly`, async () => {
      const secret = 'keyboard cat';

      process.env.COMPANION_SESSION_COOKIE_SECRET = secret;

      await initializeApplication();

      expect(sessionConfig.sessionCookieSecret).toStrictEqual(secret);
    });

    test(`Throws if not set`, async () => {
      delete process.env.COMPANION_SESSION_COOKIE_SECRET;

      const result = initializeApplication();

      await expect(result).rejects.toBeInstanceOf(Error);
    });
  });

  describe(`SESSION_MAX_AGE_MS`, () => {
    beforeEach(() => {
      process.env.COMPANION_SESSION_COOKIE_SECRET = 'keyboard cat';
    });

    test(`Is set correctly`, async () => {
      const maxAge = 100000;

      process.env.SESSION_MAX_AGE_MS = maxAge.toString();

      await initializeApplication();

      expect(sessionConfig.sessionMaxAgeMs).toStrictEqual(maxAge);
    });

    test(`Defaults if not set`, async () => {
      const expectedDefault = 4 * 60 * 60 * 1000;

      delete process.env.SESSION_MAX_AGE_MS;

      await initializeApplication();

      expect(sessionConfig.sessionMaxAgeMs).toStrictEqual(expectedDefault);
    });
  });
});

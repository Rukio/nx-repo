import { ConfigType, registerAs } from '@nestjs/config';
import { MissingEnvironmentVariableException } from '../common/exceptions/missing-environment-variable.exception';

interface SessionConfigurationKeys {
  /** The maximum length of a user session. */
  sessionMaxAgeMs: number;

  /** The secret string used to sign cookies. */
  sessionCookieSecret: string;
}

export type SessionConfiguration = ConfigType<typeof sessionConfiguration>;

const sessionConfiguration = registerAs<SessionConfigurationKeys>(
  'session',
  () => {
    const sessionCookieSecret = process.env.COMPANION_SESSION_COOKIE_SECRET;

    if (!sessionCookieSecret) {
      throw new MissingEnvironmentVariableException(
        'COMPANION_SESSION_COOKIE_SECRET'
      );
    }

    const defaultCookieMaxAgeMs = 4 * 60 * 60 * 1000; // 4 hours, default
    const sessionMaxAgeMsString = process.env.SESSION_MAX_AGE_MS;
    const sessionMaxAgeMs = sessionMaxAgeMsString
      ? Number.parseInt(sessionMaxAgeMsString, 10)
      : defaultCookieMaxAgeMs;

    return {
      sessionCookieSecret,
      sessionMaxAgeMs,
    };
  }
);

export default sessionConfiguration;

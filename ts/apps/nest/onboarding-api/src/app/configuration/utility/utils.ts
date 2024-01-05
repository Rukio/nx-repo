import { ConfigService } from '@nestjs/config';
import MissingEnvironmentVariableException from '../../common/exceptions/missing-environment-variable.exception';

/**
 * Retrieves a required environment variable.
 *
 * @param key - Environment variable name
 * @param config - Configuration module for Nest based on the dotenv (to load process environment variables) package.
 *
 * @return {value} - Received environment variable value
 *
 * @throws {MissingEnvironmentVariableException} - If the environment variable is not found, an exception is thrown.
 */
export default function getRequiredEnvironmentVariable(
  key: string,
  config: ConfigService
) {
  const value = config.get<string>(key);

  if (!value) {
    throw new MissingEnvironmentVariableException(key);
  }

  return value;
}

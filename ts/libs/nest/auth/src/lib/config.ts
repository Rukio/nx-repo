import { ConfigService } from '@nestjs/config';

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
export function getRequiredEnvironmentVariable(
  key: string,
  config: ConfigService
) {
  const value = config.get<string>(key);

  if (!value) {
    throw new MissingEnvironmentVariableException(key);
  }

  return value;
}

export class MissingEnvironmentVariableException extends Error {
  constructor(variableName: string) {
    super(`Missing required environment variable: ${variableName}`);
  }
}

export class MissingConfigurationSettingException extends Error {
  constructor(variableKey: string) {
    super(`Missing required environment variable key for ${variableKey}`);
  }
}

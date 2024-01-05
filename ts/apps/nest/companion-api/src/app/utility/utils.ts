import { ConfigService } from '@nestjs/config';
import { Prisma } from '@prisma/client';
import { MissingEnvironmentVariableException } from '../common/exceptions/missing-environment-variable.exception';

export const isJsonObject = (
  subject?: unknown | null
): subject is Prisma.JsonObject => {
  return (
    subject != null &&
    subject != undefined &&
    typeof subject === 'object' &&
    !Array.isArray(subject)
  );
};

export const isJsonArray = (
  subject?: unknown | null
): subject is Prisma.JsonArray => {
  return subject != null && subject != undefined && Array.isArray(subject);
};

/**
 * Retrieves a required environment variable.
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

export const timeBetween = (
  dateTimeStringA: string,
  dateTimeStringB: string
) => {
  const dateTimeA = Date.parse(dateTimeStringA);
  const dateTimeB = Date.parse(dateTimeStringB);

  return Math.abs(dateTimeA - dateTimeB) / 1000;
};

export class MissingEnvironmentVariableException extends Error {
  constructor(variableName: string) {
    super(`Missing required environment variable: ${variableName}`);
  }
}

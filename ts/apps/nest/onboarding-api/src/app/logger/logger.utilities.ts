import { INestApplication, Logger } from '@nestjs/common';

/** Toggles Nest logging on/off. */
export const toggleLogging = (app: INestApplication, enabled: boolean) =>
  app.useLogger(enabled ? Logger : false);

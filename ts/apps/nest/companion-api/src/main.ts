import 'dd-trace/init';
import 'multer';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import cookieParser from 'cookie-parser';
import expressSession from 'express-session';
import * as passport from 'passport';
import { json, urlencoded } from 'express';
import { AppModule } from './app/app.module';
import sessionConfiguration, {
  SessionConfiguration,
} from './app/configuration/session.configuration';
import { setupApiDocumentation } from './app/swagger';
import RedisStore from 'connect-redis';
import { ValidationPipe } from '@nestjs/common';
import { Redis } from 'ioredis';
import { IOREDIS_CLIENT_TOKEN } from './app/redis';
/**
 * Configures and bootstraps NestJS application. Sets up global configuration.
 */
async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const config = app.get<ConfigService>(ConfigService);
  const nodeEnv = config.get<string>('NODE_ENV');

  if (nodeEnv === 'development') {
    setupApiDocumentation(app);
  }

  app.enableCors({
    credentials: true,
    origin: config.get<string>('COMPANION_URL'),
  });

  // enable cookies
  app.use(cookieParser());

  // build session store
  const sessionConfig = app.get<SessionConfiguration>(sessionConfiguration.KEY);
  //Based on this thread: https://github.com/tj/connect-redis/issues/336#issuecomment-979090737
  //connect-redis dependency is not working with latest version of node-redis client
  //We are using legacyMode: true in our client in order to be compatible but we understand
  //that this error will be fix eventually.
  const redisClient = app.get<Redis>(IOREDIS_CLIENT_TOKEN);
  const sessionStore = new RedisStore({ client: redisClient });

  // enable express sessions
  const cookieMaxAgeMs = sessionConfig.sessionMaxAgeMs;
  const cookieName = 'consumer.sid';
  const proxyCookie = nodeEnv === 'production';
  const useSecureCookies = nodeEnv === 'production';
  const sameSiteCookie = nodeEnv === 'production' ? 'none' : false;
  const cookieSecret = sessionConfig.sessionCookieSecret;

  app.useGlobalPipes(
    new ValidationPipe({ transform: true, forbidUnknownValues: true })
  );

  app.use(
    expressSession({
      store: sessionStore,
      name: cookieName,
      secret: cookieSecret,
      saveUninitialized: false,
      resave: false,
      rolling: true,
      proxy: proxyCookie,
      cookie: {
        secure: useSecureCookies,
        httpOnly: true,
        sameSite: sameSiteCookie,
        maxAge: cookieMaxAgeMs,
      },
    })
  );

  // initialize passport
  app.use(passport.initialize());
  app.use(passport.session());

  app.use(json({ limit: '50mb' }));
  app.use(urlencoded({ limit: '50mb', extended: true }));

  const applicationPort = nodeEnv === 'production' ? 3000 : 3030;

  await app.listen(applicationPort);
}

bootstrap();

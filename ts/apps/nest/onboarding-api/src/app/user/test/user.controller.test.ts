import { Test, TestingModule } from '@nestjs/testing';
import { HttpModule } from '@nestjs/axios';
import { ConfigModule } from '@nestjs/config';
import { CacheModule } from '@nestjs/cache-manager';
import {
  CareRequestAPIResponse,
  User,
} from '@*company-data-covered*/consumer-web-types';
import UserController from '../user.controller';
import UserService from '../user.service';
import { CacheConfigService } from '../../common/cache.config.service';
import { MOCK_USER_RESULT } from './mocks/user.mock';
import UserQueryDto from '../dto/user-query.dto';
import LoggerModule from '../../logger/logger.module';

describe('UserController tests', () => {
  let controller: UserController;
  let userService: UserService;

  beforeEach(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [UserController],
      providers: [UserService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    controller = app.get<UserController>(UserController);
    userService = app.get<UserService>(UserService);
  });

  it('get current user', async () => {
    const userQuery: UserQueryDto = {
      email: 'test@test@*company-data-covered*.com',
    };
    const response: CareRequestAPIResponse<User> = {
      data: MOCK_USER_RESULT,
      success: true,
    };
    jest.spyOn(userService, 'fetch').mockResolvedValue(MOCK_USER_RESULT);

    expect(await controller.fetch(userQuery)).toStrictEqual(response);
    expect(userService.fetch).toBeCalled();
  });
});

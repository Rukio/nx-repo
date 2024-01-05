import { INestApplication } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { HttpModule, HttpService } from '@nestjs/axios';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { of } from 'rxjs';
import AssignTeamService from '../assign-team.service';
import LoggerModule from '../../logger/logger.module';
import { CacheConfigService } from '../../common/cache.config.service';
import { wrapInAxiosResponse } from '../../../testUtils/utils';
import {
  MOCK_ASSIGN_TEAM_CREATE_ETA_RESPONSE,
  MOCK_ASSIGN_TEAM_PARAMS,
  MOCK_ETA_PARAMS,
  MOCK_STATION_ASSIGN_TEAM_CREATE_ETA_RESPONSE,
} from './mocks/assign-team.mock';

describe(`${AssignTeamService.name}`, () => {
  let app: INestApplication;
  let assignTeamService: AssignTeamService;
  let httpService: HttpService;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      providers: [AssignTeamService],
      imports: [
        HttpModule,
        ConfigModule,
        LoggerModule,
        CacheModule.registerAsync({ useClass: CacheConfigService }),
      ],
    }).compile();

    httpService = module.get<HttpService>(HttpService);
    assignTeamService = module.get<AssignTeamService>(AssignTeamService);

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe(`${AssignTeamService.prototype.update.name}`, () => {
    it('should return success', async () => {
      jest
        .spyOn(httpService, 'patch')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse({ success: true }))
        );

      expect(
        await assignTeamService.update(612985, MOCK_ASSIGN_TEAM_PARAMS)
      ).toHaveProperty('success', true);
    });
  });

  describe(`${AssignTeamService.prototype.createEta.name}`, () => {
    it('should return success for Eta range', async () => {
      jest
        .spyOn(httpService, 'post')
        .mockImplementationOnce(() =>
          of(wrapInAxiosResponse(MOCK_STATION_ASSIGN_TEAM_CREATE_ETA_RESPONSE))
        );
      expect(
        await assignTeamService.createEta(644228, MOCK_ETA_PARAMS)
      ).toEqual(MOCK_ASSIGN_TEAM_CREATE_ETA_RESPONSE);
    });
  });

  describe(`${AssignTeamService.prototype.removeAssignment.name}`, () => {
    it('should remove assignments of care request', async () => {
      jest
        .spyOn(httpService, 'delete')
        .mockImplementationOnce(() => of(wrapInAxiosResponse(undefined)));
      expect(await assignTeamService.removeAssignment('id')).toBeFalsy();
    });
  });
});

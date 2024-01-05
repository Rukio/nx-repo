import { Test, TestingModule } from '@nestjs/testing';
import { mockDeep, mockReset } from 'jest-mock-extended';
import {
  AssignableShiftTeam,
  CareRequestAPIResponse,
  ShiftTeam,
} from '@*company-data-covered*/consumer-web-types';
import { HttpException } from '@nestjs/common';
import ShiftTeamsController from '../shift-teams.controller';
import ShiftTeamsService from '../shift-teams.service';
import ShiftTeamsModule from '../shift-teams.module';
import LoggerModule from '../../logger/logger.module';
import {
  ASSIGNABLE_SHIFT_TEAM_PARAMS,
  MOCK_ASSIGNABLE_SHIFT_TEAMS,
  MOCK_SHIFT_TEAM,
  SHIFT_TEAM_PARAMS,
} from './mocks/shift-teams.mock';

describe('Shift-teams controller', () => {
  let controller: ShiftTeamsController;
  const mockShiftTeamsService = mockDeep<ShiftTeamsService>();

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [ShiftTeamsModule, LoggerModule],
    })
      .overrideProvider(ShiftTeamsService)
      .useValue(mockShiftTeamsService)
      .compile();

    controller = module.get<ShiftTeamsController>(ShiftTeamsController);
  });

  beforeEach(async () => {
    mockReset(mockShiftTeamsService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should return list of shift teams', async () => {
    const mockResult: ShiftTeam[] = [MOCK_SHIFT_TEAM];
    const response: CareRequestAPIResponse<ShiftTeam[]> = {
      data: mockResult,
      success: true,
    };
    mockShiftTeamsService.search.mockResolvedValue(mockResult);

    expect(await controller.search(SHIFT_TEAM_PARAMS)).toStrictEqual(response);
    expect(mockShiftTeamsService.search).toBeCalled();
  });

  it('search list of shift teams catch Error', async () => {
    mockShiftTeamsService.search.mockImplementationOnce(() => {
      throw new Error();
    });
    await expect(() => controller.search(SHIFT_TEAM_PARAMS)).rejects.toThrow(
      HttpException
    );
  });

  it('should return list of assignable shift teams', async () => {
    const mockResult: AssignableShiftTeam[] = MOCK_ASSIGNABLE_SHIFT_TEAMS;
    const response: CareRequestAPIResponse<AssignableShiftTeam[]> = {
      data: mockResult,
      success: true,
    };
    mockShiftTeamsService.fetch.mockResolvedValue(mockResult);

    expect(await controller.fetch(ASSIGNABLE_SHIFT_TEAM_PARAMS)).toStrictEqual(
      response
    );
    expect(mockShiftTeamsService.fetch).toBeCalled();
  });

  it('fetch list of assignable shift teams catch Error', async () => {
    mockShiftTeamsService.fetch.mockImplementationOnce(() => {
      throw new Error();
    });
    await expect(() =>
      controller.fetch(ASSIGNABLE_SHIFT_TEAM_PARAMS)
    ).rejects.toThrow(HttpException);
  });
});

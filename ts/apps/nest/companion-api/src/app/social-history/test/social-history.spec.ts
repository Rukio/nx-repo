import { HttpStatus, INestApplication } from '@nestjs/common';
import { setupServer, SetupServer } from 'msw/node';
import { rest } from 'msw';
import request from 'supertest';
import { Test } from '@nestjs/testing';
import { DatabaseService } from '../../database/database.service';
import { mockDatabaseService } from '../../database/mocks/database.service.mock';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { mockSocialHistoryRepository } from '../mocks/social-history-repository.mock';
import { CommonModule } from '../../common/common.module';
import { SocialHistoryModule } from '../social-history.module';
import { CompanionAuthGuard } from '../../companion/companion-auth.guard';
import { mockCompanionAuthGuard } from '../../companion/mocks/companion-auth.guard.mock';
import { SocialHistoryController } from '../social-history.controller';
import { SocialHistoryRepository } from '../social-history.repository';
import { buildMockCompanionLink } from '../../companion/mocks/companion-link.mock';
import { buildMockCareRequest } from '../../care-request/mocks/care-request.repository.mock';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { buildMockQuestionAnswer } from '../mocks/question-answer.mock';
import { mockStatsigService } from '../../statsig/mocks/statsig.service.mock';
import {
  buildMockPrimaryCareProviderTask,
  buildMockPrimaryCareProviderTaskMetadata,
} from '../../tasks/mocks/companion-task.mock';
import { QuestionAnswerDto, QuestionTag } from '../dto/question-answer.dto';
import * as faker from 'faker';
import { StatsigService } from '@*company-data-covered*/nest-statsig';
import { VALID_YES_ANSWER } from '../common';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';
import { getQueueToken } from '@nestjs/bull';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { SegmentService } from '@*company-data-covered*/nest-segment';
import { mockSegmentService } from '../../companion/mocks/segment.service.mock';

describe(`${SocialHistoryModule.name} API Tests`, () => {
  let app: INestApplication;
  let server: SetupServer;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [SocialHistoryModule, CommonModule],
    })
      .overrideProvider(DatabaseService)
      .useValue(mockDatabaseService)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .overrideProvider(SocialHistoryRepository)
      .useValue(mockSocialHistoryRepository)
      .overrideGuard(CompanionAuthGuard)
      .useValue(mockCompanionAuthGuard)
      .overrideProvider(SegmentService)
      .useValue(mockSegmentService)
      .overrideProvider(StatsigService)
      .useValue(mockStatsigService)
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .compile();

    app = moduleRef.createNestApplication();
    await app.init();

    // Enable API mocking before tests.
    server = setupServer();
    server.listen({ onUnhandledRequest: 'bypass' });
  });

  afterAll(async () => {
    await app.close();

    // Disable API mocking after the tests are done.
    server.close();
  });

  const mockCompanionLink = buildMockCompanionLink();
  const mockCareRequest: CareRequestDto = buildMockCareRequest();
  const socialHistoryPath = `/companion/${mockCompanionLink.id}/social-history`;
  const mockQuestionKey = 'LOCAL.227';
  const mockQuestionAnswer = buildMockQuestionAnswer(
    QuestionTag.HAS_PCP,
    VALID_YES_ANSWER
  );
  const mockPcpTask = buildMockPrimaryCareProviderTask();

  describe(`SocialHistoryController ${SocialHistoryController.prototype.updatePatientSocialHistory.name}`, () => {
    describe('Link exists', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(
          mockCompanionLink
        );
        mockDashboardService.getCareRequestById.mockResolvedValue(
          mockCareRequest
        );
        mockSocialHistoryRepository.getQuestionKey.mockResolvedValue(
          mockQuestionKey
        );
        mockDatabaseService.companionTask.findMany.mockResolvedValue([
          mockPcpTask,
        ]);

        server.use(
          rest.get(socialHistoryPath, (req, res, ctx) => {
            return res.once(ctx.status(HttpStatus.NO_CONTENT));
          })
        );
      });

      describe('Submitted response starts task', () => {
        test(`Returns ${HttpStatus.NO_CONTENT}`, () => {
          return request(app.getHttpServer())
            .patch(socialHistoryPath)
            .send(mockQuestionAnswer)
            .expect(HttpStatus.NO_CONTENT);
        });
      });

      describe('Submitted response completes task', () => {
        const mockPcpTask = buildMockPrimaryCareProviderTask({
          metadata: buildMockPrimaryCareProviderTaskMetadata({
            clinicalProviderId: faker.datatype.number().toString(),
            responses: {
              [QuestionTag.HAS_PCP]: true,
              [QuestionTag.HAS_SEEN_PCP_RECENTLY]: undefined,
            },
          }),
        });
        const mockQuestionAnswer = buildMockQuestionAnswer(
          QuestionTag.HAS_SEEN_PCP_RECENTLY,
          VALID_YES_ANSWER
        );

        beforeEach(() => {
          mockDatabaseService.companionTask.findMany.mockResolvedValue([
            mockPcpTask,
          ]);
        });

        test(`Returns ${HttpStatus.NO_CONTENT}`, () => {
          return request(app.getHttpServer())
            .patch(socialHistoryPath)
            .send(mockQuestionAnswer)
            .expect(HttpStatus.NO_CONTENT);
        });
      });

      describe(`SocialHistoryRepository ${DashboardService.prototype.updatePatientSocialHistory.name} throws an error`, () => {
        beforeEach(() => {
          mockDatabaseService.companionLink.findUnique.mockResolvedValue(
            mockCompanionLink
          );
          mockDashboardService.getCareRequestById.mockResolvedValue(
            mockCareRequest
          );
          mockSocialHistoryRepository.updatePatientSocialHistory.mockRejectedValue(
            new Error()
          );
        });

        test(`Returns ${HttpStatus.INTERNAL_SERVER_ERROR}`, () => {
          return request(app.getHttpServer())
            .patch(socialHistoryPath)
            .send(mockQuestionAnswer)
            .expect(HttpStatus.INTERNAL_SERVER_ERROR);
        });
      });

      describe('Question key returned is not a string', () => {
        beforeEach(() => {
          mockSocialHistoryRepository.getQuestionKey.mockResolvedValue(null);
        });

        test(`Returns ${HttpStatus.INTERNAL_SERVER_ERROR}`, () => {
          return request(app.getHttpServer())
            .patch(socialHistoryPath)
            .send(mockQuestionAnswer)
            .expect(HttpStatus.INTERNAL_SERVER_ERROR);
        });
      });
    });

    describe('Link does not exist', () => {
      beforeEach(() => {
        mockDatabaseService.companionLink.findUnique.mockResolvedValue(null);
      });

      test(`Returns ${HttpStatus.NOT_FOUND}`, () => {
        return request(app.getHttpServer())
          .patch(socialHistoryPath)
          .send(mockQuestionAnswer)
          .expect(HttpStatus.NOT_FOUND);
      });
    });
  });

  describe(`${QuestionAnswerDto.name}`, () => {
    describe('validations', () => {
      test('it passes with valid properties', async () => {
        const body = {
          questionTag: 'HAS_PCP',
          answer: 'Y',
        };
        const dto = plainToInstance(QuestionAnswerDto, body);
        const errors = await validate(dto);

        expect(errors.length).toBe(0);
      });

      test('it fails with invalid properties', async () => {
        const body = {
          questionTag: 'Invalid Value',
          answer: 'Y',
        };
        const dto = plainToInstance(QuestionAnswerDto, body);
        const errors = await validate(dto);

        expect(errors.length).not.toBe(0);
        expect(JSON.stringify(errors)).toContain(
          'questionTag must be one of the following values'
        );
      });
    });
  });
});

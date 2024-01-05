import { INestApplication } from '@nestjs/common';
import { SocialHistoryRepository } from '../social-history.repository';
import { Test } from '@nestjs/testing';
import { DashboardService } from '../../dashboard/dashboard.service';
import { mockDashboardService } from '../../dashboard/mocks/dashboard.service.mock';
import { CommonModule } from '../../common/common.module';
import { SocialHistoryModule } from '../social-history.module';
import { buildMockCareRequest } from '../../care-request/mocks/care-request.repository.mock';
import { CareRequestDto } from '../../care-request/dto/care-request.dto';
import { buildMockQuestionAnswer } from '../mocks/question-answer.mock';
import { SocialHistoryController } from '../social-history.controller';
import { QuestionTag } from '../dto/question-answer.dto';
import { VALID_YES_ANSWER } from '../common/constants';
import { getQueueToken } from '@nestjs/bull';
import { RUNNING_LATE_SMS_QUEUE } from '../../jobs/common/jobs.constants';
import { mockRunningLateSmsQueue } from '../../jobs/mocks/queues.mock';

describe(`${SocialHistoryRepository.name}`, () => {
  let app: INestApplication;
  let repository: SocialHistoryRepository;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [SocialHistoryModule, CommonModule],
    })
      .overrideProvider(getQueueToken(RUNNING_LATE_SMS_QUEUE))
      .useValue(mockRunningLateSmsQueue)
      .overrideProvider(DashboardService)
      .useValue(mockDashboardService)
      .compile();

    repository = moduleRef.get<SocialHistoryRepository>(
      SocialHistoryRepository
    );

    app = moduleRef.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  const mockCareRequest: CareRequestDto = buildMockCareRequest();
  const mockQuestionAnswer = buildMockQuestionAnswer(
    QuestionTag.HAS_PCP,
    VALID_YES_ANSWER
  );
  const questionKey = 'LOCAL.227';

  describe(`${SocialHistoryController.prototype.updatePatientSocialHistory.name}`, () => {
    beforeEach(() => {
      mockDashboardService.getCareRequestById.mockResolvedValue(
        mockCareRequest
      );
    });

    test(`Calls ${DashboardService.prototype.updatePatientSocialHistory.name}`, async () => {
      await repository.updatePatientSocialHistory(
        mockCareRequest.id,
        questionKey,
        mockQuestionAnswer.answer
      );
      expect(
        mockDashboardService.updatePatientSocialHistory
      ).toHaveBeenCalledTimes(1);
    });
  });
});

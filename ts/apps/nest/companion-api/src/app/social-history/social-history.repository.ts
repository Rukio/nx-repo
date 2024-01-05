import { DUMMY_USER_ID, StatsigService } from '@*company-data-covered*/nest-statsig';
import { Injectable } from '@nestjs/common';
import { StatsigUser } from 'statsig-node';
import { CareRequestRepository } from '../care-request/care-request.repository';
import { DashboardService } from '../dashboard/dashboard.service';
import { QuestionTag } from './dto/question-answer.dto';

@Injectable()
export class SocialHistoryRepository {
  constructor(
    private dashboard: DashboardService,
    private careRequestRepository: CareRequestRepository,
    private statsig: StatsigService
  ) {}

  async updatePatientSocialHistory(
    careRequestId: number,
    questionKey: string,
    answer: string
  ) {
    const careRequest = await this.careRequestRepository.getByIdWithError(
      careRequestId
    );

    return this.dashboard.updatePatientSocialHistory(
      careRequest.patientId,
      questionKey,
      answer
    );
  }

  async getPatientSocialHistory(careRequestId: number) {
    const careRequest = await this.careRequestRepository.getByIdWithError(
      careRequestId
    );

    return this.dashboard.getPatientSocialHistory(careRequest.patientId);
  }

  async getQuestionKey(questionAlias: QuestionTag) {
    const statsigUser: StatsigUser = { userID: DUMMY_USER_ID };
    const statsigDynamicConfigKey = await this.questionConfigKeyByAlias(
      questionAlias
    );
    const questionKeyConfig = await this.statsig.getConfig(
      statsigUser,
      statsigDynamicConfigKey
    );

    return questionKeyConfig.getValue('value', null);
  }

  private async questionConfigKeyByAlias(questionAlias: QuestionTag) {
    return this.questionTagStatsigConfigMap[questionAlias];
  }

  private readonly questionTagStatsigConfigMap: Record<QuestionTag, string> = {
    [QuestionTag.HAS_PCP]: 'pcp_question_key',
    [QuestionTag.HAS_SEEN_PCP_RECENTLY]:
      'pcp_seen_within_6_months_question_key',
  };
}

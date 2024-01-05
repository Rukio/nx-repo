import * as faker from 'faker';
import { SOCIAL_HISTORY_TEMPLATE_ID } from '../../social-history/common';
import { SocialHistory, SocialHistoryQuestion } from '../types/social-history';

export const buildMockDashboardSocialHistory = (
  questions?: SocialHistoryQuestion[]
): SocialHistory => {
  return {
    questions:
      questions ?? new Array(5).fill(0).map(() => buildSocialHistoryQuestion()),
  };
};

export const buildSocialHistoryQuestion = (
  userDefinedValues: Partial<SocialHistoryQuestion> = {}
): SocialHistoryQuestion => {
  return {
    answer: faker.lorem.word(),
    key: faker.lorem.word(),
    question: faker.lorem.sentence(),
    templateid: SOCIAL_HISTORY_TEMPLATE_ID,
    ordering: faker.datatype.number().toString(),
    lastupdated: '08/01/2022',
    lastupdatedby: `API-${faker.datatype.number()}`,
    questionid: faker.datatype.number().toString(),
    ...userDefinedValues,
  };
};

import { ConsentQuestionsOrder } from '../constants';

export const CONSENT_QUESTION_TEST_IDS = {
  getContainer: (questionOrder: ConsentQuestionsOrder) =>
    `consent-question-${questionOrder}-container`,
  getTitle: (questionOrder: ConsentQuestionsOrder) =>
    `consent-question-${questionOrder}-title`,
  getAnswer: (questionOrder: ConsentQuestionsOrder, value: string) =>
    `consent-question-${questionOrder}-answer-${value}`,
};

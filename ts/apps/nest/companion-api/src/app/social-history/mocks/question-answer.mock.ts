import { QuestionTag } from '../dto/question-answer.dto';

export const buildMockQuestionAnswer = (
  questionTag: QuestionTag,
  answer: string
) => {
  return {
    questionTag: questionTag,
    answer: answer,
  };
};

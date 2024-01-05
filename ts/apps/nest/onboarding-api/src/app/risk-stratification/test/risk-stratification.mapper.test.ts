import mapper from '../risk-stratification.mapper';
import {
  RS_TIME_SENSITIVE_ANSWER_EVENT_BODY,
  RS_TIME_SENSITIVE_ANSWER_EVENT_DATA,
  TIME_SENSITIVE_ANSWER_EVENT_BODY,
  TIME_SENSITIVE_ANSWER_EVENT_DATA,
  RS_TIME_SENSITIVE_SCREENING_RESULT_BODY,
  TIME_SENSITIVE_SCREENING_RESULT_BODY,
  RS_TIME_SENSITIVE_QUESTION,
  TIME_SENSITIVE_QUESTION,
  RS_TIME_SENSITIVE_SCREENING_RESULT_RESPONSE,
  TIME_SENSITIVE_SCREENING_RESULT_RESPONSE,
} from './mocks/risk-stratification.service.mock';

describe('Risk Stratification mapper', () => {
  it('transform RS Time Sensitive Event into AOB Time Sensitive Event', () => {
    const transformedResult =
      mapper.mapRSTimeSensitiveAnswerEventToTimeSensitiveAnswerEvent(
        RS_TIME_SENSITIVE_ANSWER_EVENT_DATA
      );
    expect(transformedResult).toEqual(TIME_SENSITIVE_ANSWER_EVENT_DATA);
  });

  it('transform AOB Time Sensitive Event body into RS Time Sensitive Event body', () => {
    const transformedResult =
      mapper.mapTimeSensitiveAnswerEventBodyToRSTimeSensitiveAnswerEventBody(
        TIME_SENSITIVE_ANSWER_EVENT_BODY
      );
    expect(transformedResult).toEqual(RS_TIME_SENSITIVE_ANSWER_EVENT_BODY);
  });

  it('transform AOB time sensitive screening result body into RS time sensitive screening result body', () => {
    const transformedResult =
      mapper.mapTimeSensitiveScreeningResultBodyToRSTimeSensitiveScreeningResultBody(
        TIME_SENSITIVE_SCREENING_RESULT_BODY
      );
    expect(transformedResult).toEqual(RS_TIME_SENSITIVE_SCREENING_RESULT_BODY);
  });

  it('transform RS Time Sensitive questions into AOB Time Sensitive Event', () => {
    const transformedResult = RS_TIME_SENSITIVE_QUESTION.map(
      mapper.mapRSTimeSensitiveQuestionToTimeSensitiveQuestion
    );
    expect(transformedResult).toEqual(TIME_SENSITIVE_QUESTION);
  });

  it('transform RS time sensitive screening result respomse into AOB time sensitive screening result response', () => {
    const transformedResult = RS_TIME_SENSITIVE_SCREENING_RESULT_RESPONSE.map(
      mapper.mapRSTimeSensitiveScreeningResultBodyToTimeSensitiveScreeningResult
    );
    expect(transformedResult).toEqual(TIME_SENSITIVE_SCREENING_RESULT_RESPONSE);
  });
});

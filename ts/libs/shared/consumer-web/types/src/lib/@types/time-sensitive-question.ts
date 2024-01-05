export interface RSTimeSensitiveSurveyVersion {
  id: string;
  created_at: string;
}

export interface TimeSensitiveSurveyVersion {
  id: string;
  createdAt: string;
}

export interface RSTimeSensitiveQuestionSigns {
  signs?: (string | string[])[];
}

export type TimeSensitiveQuestionSigns = RSTimeSensitiveQuestionSigns;

export interface RSTimeSensitiveQuestion {
  id: string;
  survey_version_id: string;
  question: string;
  signs: RSTimeSensitiveQuestionSigns;
  display_order: number;
}

export interface TimeSensitiveQuestion {
  id: string;
  surveyVersionId: string;
  question: string;
  signs: TimeSensitiveQuestionSigns;
  displayOrder: number;
}

export interface RSTimeSensitiveScreeningResultResponse {
  question: RSTimeSensitiveQuestion;
  answer: boolean;
}

export interface TimeSensitiveScreeningResultResponse {
  question: TimeSensitiveQuestion;
  answer: boolean;
}

export interface RSTimeSensitiveAnswerEventBody {
  survey_version_id: string;
  answer: boolean;
  care_request_id: number;
}

export interface TimeSensitiveAnswerEventBody {
  surveyVersionId: string;
  answer: boolean;
  careRequestId: number;
}

export interface RSTimeSensitiveAnswerEvent {
  escalate: boolean;
}

export interface TimeSensitiveAnswerEvent {
  escalate: boolean;
}

export interface RSTimeSensitiveScreeningResultBody {
  care_request_id: number;
  escalated: boolean;
  survey_version_id: string;
  escalated_question_id?: string;
}

export interface TimeSensitiveScreeningResultBody {
  careRequestId: number;
  escalated: boolean;
  surveyVersionId: string;
  escalatedQuestionId?: string;
  secondaryScreeningId?: number;
}

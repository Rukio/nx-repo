export interface SocialHistoryUpdateRequest {
  questions: {
    question_key: string;
    answer: string;
  }[];
}

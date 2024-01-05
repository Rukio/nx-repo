export interface SocialHistory {
  questions: SocialHistoryQuestion[];
}

export interface SocialHistoryQuestion {
  answer: string;
  templateid: string;
  key: string;
  question: string;
  ordering: string;
  lastupdated: string;
  lastupdatedby: string;
  questionid: string;
}

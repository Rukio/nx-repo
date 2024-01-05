export interface EdRefusalQuestionnaireResponse {
  id?: number;
  question?: string;
  answer?: string | boolean; // for some questions station returns 'yes' instead of true
}

export interface EdRefusalQuestionnaire {
  id?: number;
  careRequestId?: number;
  userId?: number;
  secondaryScreeningId?: number;
  type?: string;
  acceptable?: boolean;
  responses?: EdRefusalQuestionnaireResponse[];
}

export interface StationEdRefusalQuestionnaire {
  id?: number;
  created_at?: string;
  updated_at?: string;
  care_request_id?: number;
  secondary_screening_id?: number;
  user_id?: number;
  type?: string;
  acceptable?: boolean;
  responses?: EdRefusalQuestionnaireResponse[];
}

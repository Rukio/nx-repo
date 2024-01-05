import {
  DefaultConsentQuestionAnswer,
  MedicalDecisionMakerQuestionAnswer,
} from './ConsentForm';

export type DefaultConsentQuestionAnswerVariant =
  | DefaultConsentQuestionAnswer
  | '';

export type MedicalDecisionMakerQuestionAnswerVariant =
  | MedicalDecisionMakerQuestionAnswer
  | '';

export type ConsentFormFieldValues = {
  firstConsentQuestion: DefaultConsentQuestionAnswerVariant;
  secondConsentQuestion?: DefaultConsentQuestionAnswerVariant;
  thirdConsentQuestion?: MedicalDecisionMakerQuestionAnswerVariant;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
};

export const mockConsentQuestionFormFieldValues: ConsentFormFieldValues = {
  firstConsentQuestion: 'Yes' as DefaultConsentQuestionAnswer,
  secondConsentQuestion: 'Yes' as DefaultConsentQuestionAnswer,
  thirdConsentQuestion: 'Me' as MedicalDecisionMakerQuestionAnswer,
  firstName: 'firstName',
  lastName: 'lastName',
  phoneNumber: 'phoneNumber',
};

export enum ConsentQuestionsOrder {
  First = 0,
  Second = 1,
  Third = 2,
}

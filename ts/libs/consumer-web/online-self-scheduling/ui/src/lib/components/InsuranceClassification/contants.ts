import { QuestionYesNoAnswer, InsuranceType } from './InsuranceClassification';

export interface InsuranceClassificationFormValues {
  insuranceType: InsuranceType;
  isPublicInsuranceThroughCompany?: QuestionYesNoAnswer | '';
  stateAbbr?: string;
  insurancePayerId?: string;
  insurancePayerName?: string;
}

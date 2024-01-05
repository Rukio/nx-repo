export interface StationInsuranceEligibility {
  id: string | number;
  company_name: string;
  ehr_id: string | number;
  ehr_name: string;
  eligibility_message: string;
  eligible: string;
  insurance_classification: string;
  insurance_classification_id: string | number;
  insured_same_as_patient: boolean;
  member_id: string | number;
  package_id: string | number;
  patient_id: string | number;
}

export interface InsuranceEligibility {
  id: string | number;
  companyName: string;
  ehrId: string | number;
  ehrName: string;
  eligibilityMessage: string;
  eligible: string;
  insuranceClassification: string;
  insuranceClassificationId: string | number;
  insuredSameAsPatient: boolean;
  memberId: string | number;
  packageId: string | number;
  patientId: string | number;
}

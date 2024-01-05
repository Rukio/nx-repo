export type EpisodeDetails = {
  id: number;
  patient_summary: string;
  service_line: SummaryCell;
  care_phase: SummaryCell;
  most_relevant_note: MostRelevantNoteCell;
  patient: PatientCell;
  incomplete_tasks: IncompleteCell;
};

export type PatientCell = {
  id: number;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  sex: string;
  address_street: string;
  address_city: string;
  address_state: string;
  address_zipcode: string;
  phone_number: string;
};

export type SummaryCell = {
  name: string;
};

export type MostRelevantNoteCell = {
  details: string;
};

export type IncompleteCell = {
  daily_and_onboarding: number;
  nurse_navigator: number;
  t1: number;
  t2: number;
};

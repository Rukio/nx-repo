interface TimeSensitiveConcern {
  value: string;
  isBranch?: boolean;
}

interface Question {
  patientQuestion: string;
  thirdPersonQuestion: string;
  id: string;
  version: number;
  isDeletable: boolean;
  createdBy: string;
  lastUpdated: string; // ISO string
  timeSensitiveConcerns: TimeSensitiveConcern[];
}

export {
  Question as QuestionBankQuestion,
  TimeSensitiveConcern as QuestionBankTimeSensitiveConcern,
};

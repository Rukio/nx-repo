export interface InformedQuestion {
  question: string;
  answer: string;
}

export interface InformedRequestor {
  id?: number;
  careRequestId: number;
  contactPhone: string;
  contactFirstName: string;
  contactLastName: string;
  response: {
    questions: InformedQuestion[];
  };
}
export interface StationInformedRequestor {
  care_request_id: number;
  contact_phone: string;
  contact_first_name: string;
  contact_last_name: string;
  response: {
    questions: InformedQuestion[];
  };
}

export interface StationInformedRequestorResponse {
  id: number;
  care_request_id: number;
  response: StationInformedRequestor;
}

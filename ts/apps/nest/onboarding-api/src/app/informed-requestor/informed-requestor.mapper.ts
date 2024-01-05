import {
  InformedRequestor,
  StationInformedRequestor,
  StationInformedRequestorResponse,
} from '@*company-data-covered*/consumer-web-types';

const StationInformedRequestorResponseToInformerRequestor = (
  input: StationInformedRequestorResponse
): InformedRequestor => {
  const output: InformedRequestor = {
    id: input.id,
    careRequestId: input.care_request_id,
    contactFirstName: input.response?.contact_first_name,
    contactLastName: input.response?.contact_last_name,
    contactPhone: input.response?.contact_phone,
    response: input.response?.response,
  };

  return output;
};

const InformedRequestorToStationInformerRequestor = (
  input: InformedRequestor
): { informer_questions: StationInformedRequestor } => {
  const output: StationInformedRequestor = {
    care_request_id: input.careRequestId,
    contact_first_name: input.contactFirstName,
    contact_last_name: input.contactLastName,
    contact_phone: input.contactPhone,
    response: input.response,
  };

  return { informer_questions: output };
};

export default {
  StationInformedRequestorResponseToInformerRequestor,
  InformedRequestorToStationInformerRequestor,
};

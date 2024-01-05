export type ManageConsentState = {
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
};

export type CachePatientPOAPayload = {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  isPatientDecisionMaker: boolean;
};

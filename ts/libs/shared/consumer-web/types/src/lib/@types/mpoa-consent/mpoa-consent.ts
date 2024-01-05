export interface MpoaConsent {
  id: number;
  consented: boolean;
  powerOfAttorneyId: number;
  timeOfConsentChange: Date;
  careRequestId: number;
  userId: number;
}

export interface CreateMpoaConsent {
  consented: boolean;
  powerOfAttorneyId: number;
  timeOfConsentChange: Date;
}
export interface UpdateMpoaConsent {
  consented: boolean;
  powerOfAttorneyId?: number;
  timeOfConsentChange?: Date;
}

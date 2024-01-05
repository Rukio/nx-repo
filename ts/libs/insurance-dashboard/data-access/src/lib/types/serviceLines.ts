export type DomainServiceLine = {
  id: string;
  name: string;
  existingPatientAppointmentType?: ServiceLineAppointmentType;
  newPatientAppointmentType?: ServiceLineAppointmentType;
  outOfNetworkInsurance: boolean;
  requireCheckout: boolean;
  requireConsentSignature: boolean;
  requireMedicalNecessity: boolean;
  createdAt: string;
  updatedAt: string;
  followup2Day: boolean;
  followup1430Day: boolean;
  is911: boolean;
  shiftTypeId: string;
  parentId?: string;
  upgradeableWithScreening: boolean;
  default: boolean;
  shiftTeamServiceId?: string;
};

export type ServiceLineAppointmentType = {
  id: string;
  name: string;
};

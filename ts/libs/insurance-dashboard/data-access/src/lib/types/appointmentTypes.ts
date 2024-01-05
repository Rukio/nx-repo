export type DomainNetworkAppointmentType = {
  id: string;
  networkId: string;
  serviceLineId: string;
  modalityType: string;
  newPatientAppointmentType?: string;
  existingPatientAppointmentType?: string;
};

export type DomainAppointmentType = {
  id: string;
  name: string;
};

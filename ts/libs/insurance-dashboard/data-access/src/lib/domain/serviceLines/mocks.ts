import { DomainServiceLine } from '../../types';

export const mockedServiceLinesList: DomainServiceLine[] = Array.from(
  Array(10)
).map((_, index) => {
  const isOdd = Boolean(index % 2);
  const now = new Date().toString();

  return {
    id: `${index + 1}`,
    name: `service line ${index}`,
    existingPatientAppointmentType: {
      id: `${index + 1}`,
      name: `Established Patient ${index}`,
    },
    newPatientAppointmentType: {
      id: `${index + 1}`,
      name: `New Patient ${index}`,
    },
    outOfNetworkInsurance: isOdd,
    requireCheckout: isOdd,
    requireConsentSignature: isOdd,
    requireMedicalNecessity: isOdd,
    followup2Day: isOdd,
    followup1430Day: isOdd,
    is911: isOdd,
    upgradeableWithScreening: isOdd,
    shiftTypeId: `${index}`,
    shiftTeamServiceId: `${index}`,
    parentId: `${index + 2}`,
    default: !index,
    createdAt: now,
    updatedAt: now,
  };
});

export const mockedServiceLine: DomainServiceLine = mockedServiceLinesList[0];

import { ServiceLine } from '../../types';

export const mockedServiceLinesList: ServiceLine[] = Array.from(Array(10)).map(
  (_, index) => {
    const isOdd = Boolean(index % 2);
    const now = new Date().toString();

    return {
      id: index + 1,
      name: `service line ${index}`,
      existing_patient_appointment_type: null,
      new_patient_appointment_type: null,
      out_of_network_insurance: isOdd,
      require_checkout: isOdd,
      require_consent_signature: isOdd,
      require_medical_necessity: isOdd,
      followup_2_day: isOdd,
      followup_14_30_day: isOdd,
      is_911: isOdd,
      upgradeable_with_screening: isOdd,
      shift_type_id: index,
      shift_team_service_id: index,
      parent_id: null,
      default: !index,
      created_at: now,
      updated_at: now,
    };
  }
);

export const mockedServiceLine: ServiceLine = mockedServiceLinesList[0];

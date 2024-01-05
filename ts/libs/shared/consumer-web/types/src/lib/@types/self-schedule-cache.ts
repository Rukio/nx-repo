import { PatientPreferredEta } from './care-request';
import { Patient, PowerOfAttorney } from './patient';
import { Requester } from './requester';

export interface OSSUserCache {
  requester?: Partial<Omit<Requester, 'id'>>;
  powerOfAttorney?: Omit<PowerOfAttorney, 'id'>;
  preferredEta?: PatientPreferredEta;
  patientInfo?: Pick<Patient, 'middleName' | 'suffix'>;
  symptoms?: string;
  addressId?: number;
  patientId?: number;
  careRequestId?: number;
  marketId?: string | number;
  channelItemId?: string | number;
}

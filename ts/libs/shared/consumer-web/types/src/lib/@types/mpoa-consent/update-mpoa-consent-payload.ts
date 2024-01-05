import { CreateMpoaConsentInfo } from './create-mpoa-consent-info';

export interface UpdateMpoaConsentPayload extends CreateMpoaConsentInfo {
  careRequestId?: string | number;
  mpoaConsentId?: string | number;
}

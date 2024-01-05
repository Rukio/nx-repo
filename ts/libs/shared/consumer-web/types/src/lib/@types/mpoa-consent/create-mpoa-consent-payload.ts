import { CreateMpoaConsentInfo } from './create-mpoa-consent-info';

export interface CreateMpoaConsentPayload extends CreateMpoaConsentInfo {
  careRequestId?: number;
}

import { DeepPartial } from '../../utility/types/deep-partial';
import {
  ConsentType,
  SignedConsentDto,
  SignedConsentRequest,
} from '../dto/consent.dto';
import { buildMockSignature } from './signature.mock';

export function buildMockConsent(
  init: DeepPartial<SignedConsentDto> = {}
): SignedConsentDto {
  const { signature: signatureInit, ...rest } = init;

  return {
    type: ConsentType.MEDICATION_HISTORY_AUTHORITY,
    signature: buildMockSignature(signatureInit),
    ...rest,
  };
}

export function buildMockSignedConsentRequest(
  consentInit: DeepPartial<SignedConsentDto> = {}
): Omit<SignedConsentRequest, 'image'> {
  const { type: consentType, signature } = buildMockConsent(consentInit);
  const {
    type: signatureType,
    signedAt,
    signerName,
    signerRelationToPatient,
  } = signature;

  return {
    consentType,
    signatureType,
    signedAt,
    signerName,
    signerRelationToPatient,
  };
}

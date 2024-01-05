import { instanceToPlain } from 'class-transformer';
import { Capture } from '../../consents/domain/capture';
import { buildMockConsentCapture } from '../../consents/mocks/capture.mock';
import { CaravanConsentCapture } from '../types/caravan.capture';
import * as faker from 'faker';

export function buildMockCaravanConsentCapture(
  init: Partial<Capture> = {}
): CaravanConsentCapture {
  return instanceToPlain(
    buildMockConsentCapture(init)
  ) as CaravanConsentCapture;
}

export function buildMockCreateCaptureCaravanRequest() {
  return {
    definition_id: faker.datatype.number(),
    episode_id: faker.datatype.number().toString(),
    patient_id: faker.datatype.number().toString(),
    service_line: faker.datatype.number().toString(),
    signer: faker.datatype.number().toString(),
    visit_id: faker.datatype.number().toString(),
    signature_image: 'base64SignatureImage',
    document_image: null,
    verbal: false,
  };
}

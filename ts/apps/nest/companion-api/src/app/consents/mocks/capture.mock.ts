import { plainToInstance } from 'class-transformer';
import * as faker from 'faker';
import { Capture, CreateCaptureDto } from '../domain/capture';

export function buildMockConsentCapture(init: Partial<Capture> = {}): Capture {
  const plain: Capture = {
    id: faker.datatype.number(),
    definitionId: faker.datatype.number(),
    patientId: faker.datatype.number().toString(),
    visitId: faker.datatype.number().toString(),
    episodeId: faker.datatype.number().toString(),
    serviceLine: faker.datatype.number().toString(),
    signer: faker.datatype.number().toString(),
    verbal: true,
    witness1: faker.name.findName(),
    witness2: faker.name.findName(),
    reasonForVerbal: faker.animal.bear(),
    documentImage: null,
    signatureImage: null,
    revokedAt: faker.datatype.datetime().toISOString(),
    ...init,
  };

  return plainToInstance(Capture, plain);
}

export function buildMockCreateCaptureRequestWithoutFile(): Omit<
  CreateCaptureDto,
  'signatureImage'
> {
  return {
    definitionId: faker.datatype.number().toString(),
    signer: faker.datatype.number().toString(),
  };
}

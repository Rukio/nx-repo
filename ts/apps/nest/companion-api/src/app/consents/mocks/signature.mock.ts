import * as faker from 'faker';
import { DeepPartial } from '../../utility/types/deep-partial';
import {
  Signature,
  SignatureType,
  SignerRelationToPatient,
} from '../dto/signature.dto';

export function buildMockSignature(
  init: DeepPartial<Signature> = {}
): Signature {
  return {
    type: SignatureType.TYPED,
    signerName: faker.name.findName(),
    signedAt: faker.datatype.datetime().toISOString(),
    signerRelationToPatient: SignerRelationToPatient.PATIENT,
    ...init,
  };
}

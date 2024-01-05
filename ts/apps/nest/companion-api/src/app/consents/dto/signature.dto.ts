import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsString } from 'class-validator';

export enum SignatureType {
  TYPED = 'TYPED',
}

export enum SignerRelationToPatient {
  PATIENT = 'PATIENT',
  OTHER = 'OTHER',
}

export class Signature {
  @ApiProperty({
    description: 'The signature type.',
    enum: SignatureType,
    example: SignatureType.TYPED,
  })
  @IsEnum(SignatureType)
  type: SignatureType;

  @ApiProperty({
    description: 'The name of the signer.',
    example: 'Ross Geller',
  })
  @IsString()
  signerName: string;

  @ApiProperty({
    description: 'The relation of the signer to the patient.',
    enum: SignerRelationToPatient,
    example: SignerRelationToPatient.PATIENT,
  })
  @IsEnum(SignerRelationToPatient)
  signerRelationToPatient: SignerRelationToPatient;

  @ApiProperty({
    description:
      'ISO8601 formatted timestamp string representing the time at which the signature was given.',
    example: '2021-07-08T20:39:08.305Z',
  })
  @IsString()
  signedAt: string;
}

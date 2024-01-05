import { ApiProperty, IntersectionType, OmitType } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsObject, ValidateNested } from 'class-validator';
import { Signature, SignatureType } from './signature.dto';

export enum ConsentType {
  MEDICATION_HISTORY_AUTHORITY = 'MEDICATION_HISTORY_AUTHORITY',
}

export class SignedConsentDto {
  @ApiProperty({
    description: 'The consent type.',
    enum: ConsentType,
    example: ConsentType.MEDICATION_HISTORY_AUTHORITY,
  })
  @IsEnum(ConsentType)
  type: ConsentType;

  @ApiProperty({
    description: 'The consent signature.',
  })
  @IsObject()
  @ValidateNested()
  @Type(() => Signature)
  signature: Signature;

  static fromSignedConsentRequest(
    request: SignedConsentRequest
  ): SignedConsentDto {
    return {
      type: request.consentType,
      signature: {
        type: request.signatureType,
        signerName: request.signerName,
        signedAt: request.signedAt,
        signerRelationToPatient: request.signerRelationToPatient,
      },
    };
  }
}

export class SignedConsentRequest extends IntersectionType(
  OmitType(SignedConsentDto, ['type', 'signature']),
  OmitType(Signature, ['type'])
) {
  @ApiProperty({
    description: 'The consent type.',
    enum: ConsentType,
    example: ConsentType.MEDICATION_HISTORY_AUTHORITY,
  })
  @IsEnum(ConsentType)
  consentType: ConsentType;

  @ApiProperty({
    description: 'The signature type.',
    enum: SignatureType,
    example: SignatureType.TYPED,
  })
  @IsEnum(SignatureType)
  signatureType: SignatureType;
}

import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { IsDefined, IsNumberString, IsString } from 'class-validator';

// TODO: validate with API
export class Capture {
  @Expose()
  id: number;

  @Expose({ name: 'definition_id', toPlainOnly: true })
  definitionId: number;

  @Expose({ name: 'patient_id', toPlainOnly: true })
  patientId: string;

  @Expose({ name: 'visit_id', toPlainOnly: true })
  visitId: string;

  @Expose({ name: 'episode_id', toPlainOnly: true })
  episodeId: string;

  @Expose({ name: 'service_line', toPlainOnly: true })
  serviceLine: string;

  @Expose()
  signer: string;

  @Expose()
  verbal: boolean;

  @Expose({ name: 'witness_1', toPlainOnly: true })
  witness1?: string;

  @Expose({ name: 'witness_2', toPlainOnly: true })
  witness2?: string;

  @Expose({ name: 'reason_for_verbal', toPlainOnly: true })
  reasonForVerbal?: string;

  @Expose({ name: 'document_image', toPlainOnly: true })
  documentImage?: unknown | null;

  @Expose({ name: 'signature_image', toPlainOnly: true })
  signatureImage: unknown | null;

  @Expose({ name: 'revoked_at', toPlainOnly: true })
  revokedAt?: string | null;
}

export class CreateCaptureDto {
  @ApiProperty({
    description:
      'The ID of the definition for which the capture is being created.',
    example: '1',
  })
  @IsDefined()
  @IsNumberString()
  definitionId: string;

  @ApiProperty({
    description:
      'The ID of the signer type, determined by the consent options.',
    example: '1',
  })
  @IsDefined()
  @IsString()
  signer: string;

  @ApiPropertyOptional({
    type: 'file',
    format: 'binary',
    description: `The image file of signature.`,
  })
  @IsDefined()
  @IsString()
  signatureImage: string;
}

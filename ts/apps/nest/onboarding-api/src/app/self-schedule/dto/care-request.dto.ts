import { OssCareRequest } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty, ApiPropertyOptional, OmitType } from '@nestjs/swagger';
import MpoaConsentDto from '../../mpoa-consent/dto/mpoa-consent.dto';
import RiskAssessmentDto from '../../risk-assessment/dto/risk-assessment.dto';
import CareRequestDto from '../../care-request/dto/care-request.dto';
import { IsOptional } from 'class-validator';

class OssCareRequestDto extends OmitType(CareRequestDto, [
  'requestType',
] as const) {}

export default class CreateOssCareRequestBodyDto implements OssCareRequest {
  @ApiProperty({
    description: 'Care request body',
  })
  careRequest: OssCareRequestDto;

  @ApiPropertyOptional({
    description: 'Risk assessment body',
  })
  @IsOptional()
  riskAssessment?: RiskAssessmentDto;

  @ApiProperty({
    description: 'Mpoa Consent body',
  })
  mpoaConsent: MpoaConsentDto;
}

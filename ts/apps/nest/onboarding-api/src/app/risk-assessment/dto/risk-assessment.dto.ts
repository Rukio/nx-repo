import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { RiskAssessment } from '@*company-data-covered*/consumer-web-types';
import ResponsesDto from './responses.dto';

export default class RiskAssessmentDto implements RiskAssessment {
  @ApiPropertyOptional({
    description: 'The unique identifier of the Risk Assessment.',
    example: 'unique_id',
  })
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: 'The Protocol name of the Risk Assessment.',
    example: 'General Complaint',
  })
  @IsString()
  protocolName: string;

  @ApiProperty({
    description: 'The Score of the Risk Assessment.',
    example: 1.0,
  })
  @IsNumber()
  score: number;

  @ApiProperty({
    description: 'The responses of the Risk Assessment.',
    example: {
      questions: [
        {
          weightYes: 5.5,
          weightNo: 0,
          required: false,
          protocolId: 111,
          order: 0,
          name: 'Due to the recent Coronavirus world-wide concerns we are screening patients for potential exposure. Have you tested positive for COVID-19?',
          id: 123232,
          hasNotes: false,
          allowNa: false,
          answer: 'No',
        },
      ],
    },
  })
  responses: ResponsesDto;

  @ApiPropertyOptional({
    description: 'The user id of the CA onboarding the care request.',
    example: 'unique_id',
  })
  @IsNumber()
  userId?: number;

  @ApiPropertyOptional({
    description: 'The id of the care request',
    example: 'unique_id',
  })
  @IsNumber()
  careRequestId?: number;

  @ApiProperty({
    description: 'The override reason of the Risk Assessment.',
    example: 'General Complaint',
  })
  overrideReason: string;

  @ApiPropertyOptional({
    description: 'The override time of the Risk Assessment.',
    example: 'General Complaint',
  })
  overriddenAt?: Date | string;

  @ApiPropertyOptional({
    description: 'The created time of the Risk Assessment.',
    example: '2021-07-08T20:39:08.305Z',
  })
  createdAt?: string;

  @ApiPropertyOptional({
    description: 'The updated time of the Risk Assessment.',
    example: '2021-07-08T20:39:08.305Z',
  })
  updatedAt?: string;

  @ApiProperty({
    description: 'The Protocol id of the Risk Assessment.',
    example: 'unique_id',
  })
  @IsNumber()
  protocolId: number;

  @ApiPropertyOptional({
    description: 'The Protocol score of the Risk Assessment.',
    example: 1.0,
  })
  @IsNumber()
  protocolScore?: number;

  @ApiProperty({
    description: 'The dob of the patient',
    example: '1901-01-10',
  })
  dob: string;

  @ApiProperty({
    description: 'The gender of the patient',
    example: 'Male',
  })
  gender: string;

  @ApiProperty({
    description: 'Selected symptom as a chief complaint',
    example: {
      symptom: 'Vision problem',
      selectedSymptoms: 'Vision problem|Headache',
    },
  })
  complaint: {
    symptom: string;
    selectedSymptoms: string;
  };

  @ApiProperty({
    description: 'The worst case score of the Risk Assessment.',
    example: 'General Complaint',
  })
  @IsNumber()
  worstCaseScore: number;

  @ApiPropertyOptional({
    description: 'The Protocol tags of the Risk Assessment.',
  })
  protocolTags?: string[];

  @ApiPropertyOptional({
    description: 'The type of the Risk Assessment.',
  })
  type?: string;
}

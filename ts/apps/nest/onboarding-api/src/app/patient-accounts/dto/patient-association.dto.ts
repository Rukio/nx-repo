import {
  ConsentingRelationship,
  ConsentingRelationshipCategory,
  PatientAssociation,
} from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsDefined } from 'class-validator';

export default class PatientAssociationDto implements PatientAssociation {
  @ApiProperty({
    description: 'Unverified patient ID',
    example: 123,
  })
  @IsNumber()
  unverifiedPatientId: number;

  @ApiProperty({
    description: 'Relationship that the account holder has to the patient.',
    example: { category: ConsentingRelationshipCategory.CATEGORY_SELF },
  })
  @IsDefined()
  consentingRelationship: ConsentingRelationship;
}

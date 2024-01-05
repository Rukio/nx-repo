import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

enum PharmacyType {
  RETAIL = 'RETAIL',
  MAILORDER = 'MAILORDER',
}
export class ClinicalProvider {
  @ApiPropertyOptional({
    description: `The name of the clinical provider. Even if it is defined, it cannot be assumed whether or not the clinical provider is an entity or a person. The string is provider in UPPERCASE format.`,
    example: 'KING SOOPERS',
  })
  name: string;

  @ApiPropertyOptional({
    description: `The first name of the clinical provider. Even if it is defined, it cannot be assumed whether or not the clinical provider is an entity or a person. The string is provider in UPPERCASE format.`,
    example: 'JOE',
  })
  firstname: string;

  @ApiPropertyOptional({
    description: `The last name of the clinical provider. Even if it is defined, it cannot be assumed whether or not the clinical provider is an entity or a person. The string is provider in UPPERCASE format.`,
    example: 'SCHMOE',
  })
  lastname: string;

  @ApiProperty({
    description: `The distance from the given location criteria. If the provider is located within the provided zipcode, the distance is 0.`,
    example: '5.7',
  })
  distance_mi: string;

  @ApiProperty({
    description: `The Athena clinical provider ID.`,
    example: '1',
  })
  clinicalproviderid: string;

  @ApiProperty({
    description: `The street address of the clinical provider. The string is provider in UPPERCASE format.`,
    example: '8675 S FAKE BLVD UNIT 309',
  })
  address: string;

  @ApiProperty({
    description: `The city of the clinical provider's address. The string is provider in UPPERCASE format.`,
    example: 'LITTLETON',
  })
  city: string;

  @ApiProperty({
    description: `The abbreviated state of the clinical provider's address. The string is provider in UPPERCASE format.`,
    example: 'CO',
  })
  state: string;

  @ApiProperty({
    description: `The zipcode of the clinical provider's address.`,
    example: '80123',
  })
  zip: string;

  @ApiProperty({
    description: `The fax number of the clinical provider in National format.`,
    example: '(303) 555-5555',
  })
  fax: string;

  @ApiProperty({
    description: `The phone number of the clinical provider in National format.`,
    example: '(303) 555-5555',
  })
  phone: string;

  @ApiProperty({
    description: `The NP ID that is assigned to clinical providers.`,
    example: '1',
  })
  clinicalprovidernpi: string;

  @ApiPropertyOptional({
    description: `The NCPDP ID of the pharmacy. If defined, it can be assumed that the clinical provider result is a pharmacy.`,
    example: '1',
  })
  ncpdpid?: string;

  @ApiPropertyOptional({
    description: `The type of pharmacy if applicable.`,
    enum: PharmacyType,
    example: PharmacyType.RETAIL,
  })
  pharmacytype?: PharmacyType;
}

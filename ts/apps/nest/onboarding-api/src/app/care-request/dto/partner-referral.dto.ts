import { ApiProperty } from '@nestjs/swagger';
import { PartnerReferral } from '@*company-data-covered*/consumer-web-types';

export default class PartnerReferralDto implements PartnerReferral {
  @ApiProperty({
    description: 'id of partner referral',
    example: 2240,
  })
  id: number;

  @ApiProperty({
    description: 'First name of partner referral contact',
    example: 'James',
  })
  firstName?: string;

  @ApiProperty({
    description: 'First name of partner referral contact',
    example: 'Star',
  })
  lastName?: string;

  @ApiProperty({
    description: 'Phone number of the partner referral',
    example: '+13035001513',
  })
  phone?: string;

  @ApiProperty({
    description: 'relationship of the partner to the patient',
    example: 'patient',
  })
  relationship?: string;
}

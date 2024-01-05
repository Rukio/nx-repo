import { UpdateMpoaConsent } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDateString, IsNumber } from 'class-validator';

export default class UpdateMpoaConsentDto implements UpdateMpoaConsent {
  @ApiProperty({
    description: 'Consent status',
    example: true,
  })
  @IsBoolean()
  consented: boolean;

  @ApiProperty({
    description: 'Power of attorney id',
    example: 123141,
    required: false,
  })
  @IsNumber()
  powerOfAttorneyId: number;

  @ApiProperty({
    description: 'Time of consent change',
    example: '2021-12-21T14:36:23.368Z',
    required: false,
  })
  @IsDateString()
  timeOfConsentChange: Date;
}

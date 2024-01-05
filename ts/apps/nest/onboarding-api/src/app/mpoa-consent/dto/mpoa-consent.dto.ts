import { MpoaConsent } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsDate, IsNumber } from 'class-validator';

export default class MpoaConsentDto implements MpoaConsent {
  @ApiProperty({
    description: 'MPOA consent id',
    example: 123141,
  })
  @IsNumber()
  id: number;

  @ApiProperty({
    description: 'User id',
    example: 123141,
  })
  @IsNumber()
  userId: number;

  @ApiProperty({
    description: 'Consent status',
    example: true,
  })
  @IsBoolean()
  consented: boolean;

  @ApiProperty({
    description: 'Power of attorney id',
    example: 123141,
  })
  @IsNumber()
  powerOfAttorneyId: number;

  @ApiProperty({
    description: 'Time of consent change',
    example: '2021-12-21T14:36:23.368Z',
  })
  @IsDate()
  timeOfConsentChange: Date;

  @ApiProperty({
    description: 'Care request id',
    example: 421,
  })
  @IsNumber()
  careRequestId: number;
}

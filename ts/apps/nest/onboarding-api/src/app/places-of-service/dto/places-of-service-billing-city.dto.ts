import { ApiProperty } from '@nestjs/swagger';

export default class PlacesOfServiceBillingCityDto {
  @ApiProperty({
    description: 'Billing City ID',
    example: 19,
  })
  billingCityId: number | string;
}

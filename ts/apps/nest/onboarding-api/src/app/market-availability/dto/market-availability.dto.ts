import { MarketAvailabilityBody } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
export default class MarketAvailabilityBodyDto
  implements MarketAvailabilityBody
{
  @ApiProperty({
    description: 'The market id of the care request',
    example: 159,
  })
  market_id: number;

  @ApiProperty({
    description: 'The service date of the care request',
    example: '07-22-2022',
  })
  service_date: string;

  @ApiProperty({
    description: 'The requested service line of the care request',
    example: 'acute_care',
  })
  requested_service_line: string;
}

import { CheckMarketAvailabilityBody } from '@*company-data-covered*/consumer-web-types';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class BaseCheckMarketAvailabilityBodyDto
  implements CheckMarketAvailabilityBody
{
  @ApiPropertyOptional({
    description: 'The zipcode of the patient',
    example: '80205',
  })
  zipcode?: string;

  @ApiPropertyOptional({
    description: 'The market id of the care request',
    example: 159,
  })
  marketId?: number;

  @ApiPropertyOptional({
    description: 'The market id of the care request',
    example: '07-22-2022',
  })
  date?: string;

  @ApiPropertyOptional({
    description: "Latitude of the patient's address",
    example: -101.4544,
  })
  latitude?: number;

  @ApiPropertyOptional({
    description: "Longitude of the patient's address",
    example: 121.34,
  })
  longitude?: number;

  @ApiPropertyOptional({
    description: 'The start time of the care request in milliseconds',
    example: 1658498400,
  })
  startTimeSec?: number;

  @ApiPropertyOptional({
    description: 'The end time of the care request',
    example: 1658512800,
  })
  endTimeSec?: number;

  @ApiPropertyOptional({
    description: 'The care request id',
    example: 1,
  })
  careRequestId?: number;
}

export default class CheckMarketAvailabilityBodyDto extends BaseCheckMarketAvailabilityBodyDto {
  @ApiPropertyOptional({
    description: 'The potential service line id',
    example: 1,
  })
  serviceLineId?: number;
}

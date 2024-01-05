import { Market, MarketSchedule } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';

export default class MarketDto implements Market {
  @ApiProperty({
    description: 'id of existing market',
    example: 159,
  })
  id: number;

  @ApiProperty({
    description: 'allow modifying ETA',
    example: true,
  })
  allowEtaRangeModification: boolean;

  @ApiProperty({
    description: 'auto assign type',
    example: 'legacy-auto',
  })
  autoAssignTypeOrDefault: string;

  @ApiProperty({
    description: 'if marketis auto assignable?',
    example: true,
  })
  autoAssignable: boolean;

  @ApiProperty({
    description: 'auto assign type',
    example: 'Denver',
  })
  name: string;

  @ApiProperty({
    description: 'is next day allowed',
    example: false,
  })
  nextDayEtaEnabled: boolean;

  @ApiProperty({
    description: 'market is just for 911',
    example: false,
  })
  only911: boolean;

  @ApiProperty({
    description: 'insurance searchable based on market',
    example: false,
  })
  primaryInsuranceSearchEnabled: boolean;

  @ApiProperty({
    description: 'the self pay rate of the market',
    example: 300,
  })
  selfPayRate: number;

  @ApiProperty({
    description: 'short name of market',
    example: 'DEN',
  })
  shortName: string;

  @ApiProperty({
    description: 'state of market',
    example: 'CO',
  })
  state: string;

  @ApiProperty({
    description: 'timezone name of the market',
    example: 'America/Denver',
  })
  tzName: string;

  @ApiProperty({
    description: 'timezone short name of the market',
    example: 'MDT',
  })
  tzShortName: string;

  @ApiProperty({
    description: 'eligible for telepresentation',
    example: 'true',
  })
  telepresentationEligible?: boolean;

  @ApiProperty({
    description:
      'Genesys ID for default outgoing screening queue, used to make calls',
    example: '5536bf22-1y53-45da-656c-b2c10405a7cc',
  })
  genesysId?: string;

  @ApiProperty({
    description: 'schedules of the market',
    isArray: true,
    example: {
      id: 1097,
      openAt: '2000-01-01T07:00:00.000Z',
      closeAt: '2000-01-01T23:00:00.000Z',
      openDuration: 57600,
      days: [
        'Monday',
        'Tuesday',
        'Wednesday',
        'Thursday',
        'Friday',
        'Saturday',
        'Sunday',
      ],
      createdAt: '2021-11-02T19:00:32.403Z',
      updatedAt: '2021-11-02T19:00:32.530Z',
      schedulableType: 'Market',
      schedulableId: 23453,
    },
  })
  schedules?: MarketSchedule[];
}

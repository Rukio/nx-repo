import { ShiftTeamSearchParam } from '@*company-data-covered*/consumer-web-types';
import { ApiPropertyOptional } from '@nestjs/swagger';

export default class ShiftTeamSearchDto implements ShiftTeamSearchParam {
  @ApiPropertyOptional({
    description: 'Shift Team IDs',
    example: ['1', '15', '20'],
  })
  ids?: string[];

  @ApiPropertyOptional({
    description: 'Market ID',
    example: '159',
  })
  marketId?: string;

  @ApiPropertyOptional({
    description: 'Care Request ID',
    example: '137974',
  })
  careRequestId?: string;

  @ApiPropertyOptional({
    description: 'List of Market ID',
    example: ['159', '201'],
  })
  marketIds?: string[];

  @ApiPropertyOptional({
    description: 'Search from this date',
    example: '2022-07-18T14:40:24.832Z',
  })
  start?: string;

  @ApiPropertyOptional({
    description: 'Search to this date',
    example: '2022-07-30T14:40:24.832Z',
  })
  end?: string;
}

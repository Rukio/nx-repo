import { EtaRange } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export default class EtaRangeQueryDTO implements EtaRange {
  @ApiPropertyOptional({
    description: 'Care Request ID',
    example: 612985,
  })
  careRequestId?: number;

  @ApiProperty({
    description: 'Care Request Status ID',
    example: 4004526,
  })
  careRequestStatusId: number;

  @ApiProperty({
    description: 'Estimated Start time',
    example: '2022-04-01T08:00:00.585Z',
  })
  startsAt: string;

  @ApiProperty({
    description: 'Estimated End time',
    example: '2022-04-01T14:00:00.585Z',
  })
  endsAt: string;
}

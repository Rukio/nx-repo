import { ApiProperty } from '@nestjs/swagger';
import { EtaRange } from '@*company-data-covered*/consumer-web-types';

export default class EtaRangeDto implements EtaRange {
  @ApiProperty({
    description: 'id of the care request',
    example: '34224',
  })
  careRequestId: number;

  @ApiProperty({
    description: 'id of care request status',
    example: '342343',
  })
  careRequestStatusId: number;

  @ApiProperty({
    description: 'timestamp of the range start',
    example: '2022-03-11T13:01:13.783Z',
  })
  startsAt: string;

  @ApiProperty({
    description: 'timestamp of the range end',
    example: '2022-03-11T13:01:13.783Z',
  })
  endsAt: string;

  @ApiProperty({
    description: 'eta range id',
    example: 435,
  })
  id: number;

  @ApiProperty({
    description: 'when was eta range created',
    example: '2022-03-11T13:01:13.783Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'when was eta range updated',
    example: '2022-03-11T13:01:13.783Z',
  })
  updatedAt: string;

  @ApiProperty({
    description: 'eta range user id',
    example: null,
  })
  userId?: number;
}

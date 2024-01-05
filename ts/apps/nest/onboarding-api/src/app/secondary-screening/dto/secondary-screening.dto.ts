import { ApiProperty } from '@nestjs/swagger';
import { SecondaryScreening } from '@*company-data-covered*/consumer-web-types';

export default class SecondaryScreeningDto
  implements Omit<SecondaryScreening, 'id' | 'careRequestId'>
{
  @ApiProperty({
    description: 'Approval status',
    example: 'approved',
  })
  approvalStatus: string;

  @ApiProperty({
    description: 'Note',
    example: 'Some comment',
  })
  note: string;

  @ApiProperty({
    description: 'Id of the screener/provider',
    example: 77015,
  })
  providerId: number;

  @ApiProperty({
    description: 'Indicates if patient must be seen today',
    example: true,
  })
  mustBeSeenToday?: boolean;

  @ApiProperty({
    description: 'Telepresentation Eligible',
    example: true,
  })
  telepresentationEligible?: boolean;
}

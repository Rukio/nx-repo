import { Protocol } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';

export default class SymptomsItemsDto implements Protocol {
  @ApiProperty({
    description: 'ID of the protocol',
    example: 45,
  })
  id: number;

  @ApiProperty({
    description: 'The name of the protocol',
    example: 'hypotension (low blood pressure)',
  })
  name: string;

  @ApiProperty({
    description: 'Weight of the protocol',
    default: 0,
  })
  weight: number;
}

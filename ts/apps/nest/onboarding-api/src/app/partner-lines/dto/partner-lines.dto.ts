import { PartnerLine } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export default class PartnerLinesDto implements PartnerLine {
  @ApiProperty({
    description: 'Channel item name',
    example: {
      name: 'TEST TEST TEST',
    },
  })
  channelItem: { name: string };

  @ApiProperty({
    description: 'Channel item ID',
    example: 6235,
  })
  @IsNumber()
  channelItemId: number;

  @ApiProperty({
    description: 'Partner line createdAt date',
    example: '2021-02-05T17:30:52.236Z',
  })
  createdAt: Date | string;

  @ApiProperty({
    description: 'Partner line updatedAt date',
    example: '2021-02-05T17:30:52.236Z',
  })
  updatedAt: Date | string;

  @ApiProperty({
    description: 'Partner line phone number',
    example: '(720)689-9684',
  })
  digits: string;

  @ApiProperty({
    description: 'Partner line ID',
    example: 1,
  })
  @IsNumber()
  id: number;
}

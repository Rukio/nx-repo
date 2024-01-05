import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';
import { ChannelItem } from '@*company-data-covered*/consumer-web-types';

export default class OssChannelItemDto
  implements Pick<ChannelItem, 'id' | 'name'>
{
  @ApiPropertyOptional({
    description: 'the channel item id',
    example: 3453,
  })
  @IsNumber()
  id: number;

  @ApiPropertyOptional({
    description: 'name of channel item',
    example: 'Test test',
  })
  @IsString()
  name: string;
}

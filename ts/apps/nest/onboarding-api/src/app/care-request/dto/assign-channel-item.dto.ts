import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export default class AssignChannelItem {
  @ApiProperty({
    description: 'id of an channel item that is being assigned',
    example: '123',
  })
  @IsNumber()
  channelItemId: number;
}

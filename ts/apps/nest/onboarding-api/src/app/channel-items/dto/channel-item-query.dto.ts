import { ApiProperty } from '@nestjs/swagger';
import { IsOptional } from 'class-validator';
import { ChannelItemSearchParam } from '@*company-data-covered*/consumer-web-types';

export default class ChannelItemsQueryDto implements ChannelItemSearchParam {
  @ApiProperty({
    name: 'marketId',
    description: 'id of the market',
    example: 159,
  })
  @IsOptional()
  marketId: number;

  @ApiProperty({
    name: 'channelName',
    description: 'channel name',
    example: 'TEST TEST TEST',
  })
  @IsOptional()
  channelName: string;

  @ApiProperty({
    name: 'patientId',
    description: 'patient id',
    example: 378541,
  })
  @IsOptional()
  patientId: number;

  @ApiProperty({
    name: 'lat',
    description: 'lat',
  })
  @IsOptional()
  lat: string;

  @ApiProperty({
    name: 'lng',
    description: 'lng',
  })
  @IsOptional()
  lng: string;

  @ApiProperty({
    name: 'phone',
    description: 'phone',
    example: '(720)689-9684',
  })
  @IsOptional()
  phone: string;

  @ApiProperty({
    name: 'id',
    description: 'id of the channel item row',
    example: 6235,
  })
  @IsOptional()
  id: number;
}

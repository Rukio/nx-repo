import { ShiftTeamType } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export default class ShiftTeamTypeDto implements ShiftTeamType {
  @ApiProperty({
    description: "Shift Team's type id",
    example: 1,
  })
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: "Name of the Shift Team's type",
    example: 'acute_care',
  })
  @IsString()
  name?: string;

  @ApiProperty({
    description: "Label of the Shift Team's type",
    example: 'Acute Care',
  })
  @IsString()
  label?: string;

  @ApiProperty({
    description: 'Date of the type create',
    example: '2020-09-15T04:50:04.145Z',
  })
  @IsString()
  createdAt?: string;

  @ApiProperty({
    description: 'Date of the type update',
    example: '2020-09-15T04:50:04.145Z',
  })
  @IsString()
  updatedAt?: string;
}

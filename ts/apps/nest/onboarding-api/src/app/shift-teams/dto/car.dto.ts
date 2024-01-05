import { Car } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNumber, IsString } from 'class-validator';

export default class CarDto implements Car {
  @ApiProperty({
    description: 'Car id',
    example: 30,
  })
  @IsNumber()
  id?: number;

  @ApiProperty({
    description: 'Car create date',
    example: null,
  })
  @IsString()
  createdAt?: string;

  @ApiProperty({
    description: 'Car update date',
    example: null,
  })
  @IsString()
  updatedAt?: string;

  @ApiProperty({
    description: 'Car name',
    example: 'DENC09',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Market id',
    example: 159,
  })
  @IsNumber()
  marketId: number;

  @ApiProperty({
    description: 'Car latitude',
    example: null,
  })
  @IsString()
  latitude?: string;

  @ApiProperty({
    description: 'Car longitude',
    example: null,
  })
  @IsString()
  longitude?: string;

  @ApiProperty({
    description: 'Car last location ID',
    example: 155022171,
  })
  @IsNumber()
  lastLocationId?: number;

  @ApiProperty({
    description: 'Car base last location ID',
    example: 58951865,
  })
  @IsNumber()
  baseLocationId?: number;

  @ApiProperty({
    description: 'Car auto assign',
    example: true,
  })
  @IsBoolean()
  autoAssignable?: boolean;

  @ApiProperty({
    description: 'Car priority of secondary screening',
    example: false,
  })
  @IsBoolean()
  secondaryScreeningPriority: boolean;

  @ApiProperty({
    description: 'Car virtual visit',
    example: false,
  })
  @IsBoolean()
  virtualVisit?: boolean;

  @ApiProperty({
    description: 'Is car 911 vehicle',
    example: false,
  })
  @IsBoolean()
  nineOneOneVehicle?: boolean;

  @ApiProperty({
    description: 'Car phone number',
    example: null,
  })
  @IsString()
  phone?: string;
}

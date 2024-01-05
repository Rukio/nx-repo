import { ShiftTeam } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';
import {
  IsArray,
  IsNumber,
  IsObject,
  IsString,
  IsOptional,
} from 'class-validator';
import CarDto from './car.dto';
import ShiftTeamMemberDto from './shift-team-member.dto';
import ShiftTeamTypeDto from './shift-team-type.dto';

export default class ShiftTeamDto implements ShiftTeam {
  @ApiProperty({
    description: 'ShiftTeam ID',
    example: 136361,
  })
  @IsNumber()
  @IsOptional()
  id?: number;

  @ApiProperty({
    description: 'Car ID',
    example: 30,
  })
  @IsNumber()
  carId: number;

  @ApiProperty({
    description: 'Market ID',
    example: 159,
  })
  @IsNumber()
  marketId: number;

  @ApiProperty({
    description: 'Shift type ID',
    example: 1,
  })
  @IsNumber()
  shiftTypeId?: number;

  @ApiProperty({
    description: 'Shift Team create date',
    example: null,
  })
  @IsString()
  createdAt?: string;

  @ApiProperty({
    description: 'Shift Team update date',
    example: null,
  })
  @IsString()
  updatedAt?: string;

  @ApiProperty({
    description: 'Shift Team car',
    example: {
      id: 30,
      name: 'DENC09',
      marketId: 159,
      secondaryScreeningPriority: false,
      latitude: null,
      longitude: null,
      lastLocationId: 155022171,
      baseLocationId: 58951865,
      autoAssignable: true,
      virtualVisit: false,
      nineOneOneVehicle: false,
    },
  })
  @IsObject()
  car?: CarDto;

  @ApiProperty({
    description: 'Shift Team members',
    example: [
      {
        id: 11595,
        firstName: 'Jennifer',
        lastName: 'Allison',
        providerImageTinyUrl:
          'https://qa*company-data-covered*images.s3.amazonaws.com/uploads/provider_profile/provider_image/260/tiny_Jenn_Allison_DEN_NP_5x5.jpg',
        providerProfilePosition: 'advanced practice provider',
        providerProfileLicenses: [
          {
            id: 77,
            state: 'CO',
            expiration: '2022-09-01',
            licenseNumber: '10089',
          },
        ],
        providerProfileCredentials: 'NP',
      },
      {
        id: 16055,
        firstName: 'Stefen',
        lastName: 'Ammon',
        providerImageTinyUrl:
          'https://qa*company-data-covered*images.s3.amazonaws.com/uploads/provider_profile/provider_image/345/tiny_Stefen_Ammon.jpg',
        providerProfilePosition: 'virtual doctor',
        providerProfileLicenses: [
          {
            id: 235,
            state: 'CO',
            expiration: '2023-04-01',
            licenseNumber: '45573',
          },
        ],
        providerProfileCredentials: 'MD',
      },
    ],
  })
  @IsArray()
  members?: ShiftTeamMemberDto[];

  @ApiProperty({
    description: 'Shift Team presentation modality',
    example: null,
  })
  @IsString()
  presentationModality?: string;

  @ApiProperty({
    description: 'Shift Team rendering provider type',
    example: 'app',
  })
  @IsString()
  @IsOptional()
  renderingProviderType?: string;

  @ApiProperty({
    description: 'Shift Team route poly',
    example: null,
  })
  @IsString()
  routePoly?: string;

  @ApiProperty({
    description: 'Shift Team en route poly',
    example: null,
  })
  @IsString()
  enRoutePoly?: string;

  @ApiProperty({
    description: 'Shift Team shift start date',
    example: null,
  })
  @IsString()
  shiftStartDate?: string;

  @ApiProperty({
    description: 'Shift Team shift type',
    example: {
      id: 1,
      name: 'acute_care',
      label: 'Acute Care',
      createdAt: '2020-09-15T04:50:04.145Z',
      updatedAt: '2020-09-15T04:50:04.145Z',
    },
  })
  @IsObject()
  shiftType?: ShiftTeamTypeDto;

  @ApiProperty({
    description: 'Shift Team skill IDs',
    example: [1, 4, 7],
  })
  @IsArray()
  @IsOptional()
  skillIds?: number[];

  @ApiProperty({
    description: 'Shift Team start time',
    example: '2022-07-19T15:00:00.000Z',
  })
  @IsString()
  startTime: string;

  @ApiProperty({
    description: 'Shift Team end time',
    example: '2022-07-20T03:00:00.000Z',
  })
  @IsString()
  endTime: string;

  @ApiProperty({
    description: 'Shift Team status',
    example: null,
  })
  @IsString()
  status?: string;

  @ApiProperty({
    description: 'Shift Team timezone short name',
    example: null,
  })
  @IsString()
  tzShortName?: string;
}

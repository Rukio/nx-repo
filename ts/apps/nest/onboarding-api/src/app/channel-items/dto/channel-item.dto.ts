import { ApiProperty } from '@nestjs/swagger';
import { IsString } from 'class-validator';
import { ChannelItem } from '@*company-data-covered*/consumer-web-types';

export default class ChannelItemDto implements ChannelItem {
  @ApiProperty({
    description: 'The market id of the care request',
    example: 159,
  })
  @IsString()
  marketId: number;

  @ApiProperty({
    description: 'the channel name',
    example: 'Castle Country',
  })
  @IsString()
  channelName: string;

  @ApiProperty({
    description: 'the patient id',
    example: '3433433',
  })
  @IsString()
  patientId: string;

  @ApiProperty({
    description: 'the phone no of the partner',
    example: '1.0',
  })
  @IsString()
  phone: string;

  @ApiProperty({
    description: 'the latitude of the zipcode',
    example: '51.0',
  })
  @IsString()
  lat: string;

  @ApiProperty({
    description: 'the longtitude of the zipcode',
    example: '-56.0',
  })
  @IsString()
  lng: string;

  @ApiProperty({
    description: 'the old address',
    example: '3827 North Lafette Denver',
  })
  @IsString()
  address2Old: string;

  @ApiProperty({
    description: 'the old address',
    example: '3827 North Lafette Denver',
  })
  @IsString()
  addressOld: string;

  @ApiProperty({
    description: 'the agreement',
  })
  @IsString()
  agreement: string;

  @ApiProperty({
    description: 'the blended bill',
  })
  @IsString()
  blendedBill: boolean;

  @ApiProperty({
    description: 'the blended bill description',
  })
  @IsString()
  blendedDescription: string;

  @ApiProperty({
    description: 'the case policy numbers',
  })
  @IsString()
  casePolicyNumber: string;

  @ApiProperty({
    description: 'the channel id',
    example: 23,
  })
  @IsString()
  channelId: number;

  @ApiProperty({
    description: 'the old city',
  })
  @IsString()
  cityOld: string;

  @ApiProperty({
    description: 'the contact person',
  })
  @IsString()
  contactPerson: string;

  @ApiProperty({
    description: 'the created at time',
  })
  @IsString()
  createdAt: string;

  @ApiProperty({
    description: 'the deactivate at time',
  })
  @IsString()
  deactivatedAt: string;

  @ApiProperty({
    description: 'email',
  })
  @IsString()
  email: string;

  @ApiProperty({
    description: 'the emr provider id',
  })
  @IsString()
  emrProviderId: string;

  @ApiProperty({
    description: 'the er diversion',
  })
  @IsString()
  erDiversion: string;

  @ApiProperty({
    description: 'the hospitalization diversion',
  })
  @IsString()
  hospitalizationDiversion: string;

  @ApiProperty({
    description: 'the id',
  })
  @IsString()
  id: number;

  @ApiProperty({
    description: 'the market name',
  })
  @IsString()
  marketName: string;

  @ApiProperty({
    description: 'name',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'the nine one one diversion',
  })
  @IsString()
  nineOneOneDiversion: string;

  @ApiProperty({
    description: 'the observation diversion',
  })
  @IsString()
  observationDiversion: string;

  @ApiProperty({
    description: 'the preferred Partner',
  })
  @IsString()
  preferredPartner: string;

  @ApiProperty({
    description: 'the preferred partner description',
  })
  @IsString()
  preferredPartnerDescription: string;

  @ApiProperty({
    description: 'the pre populate based on address',
  })
  prepopulateBasedOnAddress: boolean;

  @ApiProperty({
    description: 'the pre populate based on eligibility on file',
  })
  @IsString()
  prepopulateBasedOnEligibilityFile: string;

  @ApiProperty({
    description:
      'the field specifying that screening can be bypassed for this channel',
  })
  bypassScreeningProtocol: boolean;

  @ApiProperty()
  @IsString()
  selectedWithLastCrId: string;

  @ApiProperty()
  @IsString()
  selectedWithOriginPhone: string;

  @ApiProperty()
  @IsString()
  sendClinicalNote: string;

  @ApiProperty()
  @IsString()
  sendNoteAutomatically: string;

  @ApiProperty()
  @IsString()
  snfCredentials: boolean;

  @ApiProperty()
  @IsString()
  sourceName: string;

  @ApiProperty()
  @IsString()
  stateOld: string;

  @ApiProperty()
  @IsString()
  typeName: string;

  @ApiProperty()
  @IsString()
  updatedAt: string;

  @ApiProperty()
  @IsString()
  zipcodeOld: string;
}

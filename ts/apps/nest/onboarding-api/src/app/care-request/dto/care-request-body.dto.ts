import { ApiProperty } from '@nestjs/swagger';
import {
  CareRequest,
  CareRequestType,
  RequestedServiceLine,
} from '@*company-data-covered*/consumer-web-types';
import AddressDto from './address.dto';
import RequesterDto from './requester.dto';
import PartnerReferralDto from './partner-referral.dto';

export default class CareRequestBodyDto implements Partial<CareRequest> {
  @ApiProperty({
    description: 'Id of the requester/caller',
    example: NaN,
  })
  requesterId: number;

  @ApiProperty({
    description: 'request type of care',
    example: CareRequestType.phone,
  })
  requestType?: CareRequestType;

  @ApiProperty({
    description: 'Id of the market',
    example: 159,
  })
  marketId: number;

  @ApiProperty({
    description: 'service line id of the care request',
    example: 7,
  })
  serviceLineId: number;

  @ApiProperty({
    description: 'channel item id of the care request',
    example: 9974,
  })
  channelItemId: number;

  @ApiProperty({
    description: 'the field specifying that screening can be bypassed',
    example: false,
  })
  bypassScreeningProtocol?: boolean;

  @ApiProperty({
    description: 'the field specifying the origin phone of the channel',
  })
  channelItemSelectedWithOriginPhone?: string;

  @ApiProperty({
    description: 'billing city id of the care request',
    example: 5,
  })
  billingCityId?: number;

  @ApiProperty({
    description: 'chief complaint of care',
    example: { symptoms: 'cough' },
    type: 'object',
  })
  complaint: { symptoms: string };

  @ApiProperty({
    description: 'Requester information',
  })
  requester: RequesterDto;

  @ApiProperty({
    description: 'Address information',
  })
  address: AddressDto;

  @ApiProperty({
    description: "Patient's id",
    example: 44564,
  })
  patientId?: number;

  @ApiProperty({
    description: 'Service line requested',
    example: RequestedServiceLine.acuteCare,
  })
  requestedServiceLine?: RequestedServiceLine;

  @ApiProperty({
    description: 'Partner Referral of CR',
  })
  partnerReferral?: PartnerReferralDto;
}

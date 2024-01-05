import { InsurancePlan } from '@*company-data-covered*/consumer-web-types';
import { ApiProperty } from '@nestjs/swagger';

export default class InsurancePlanBodyDto implements InsurancePlan {
  @ApiProperty({
    description: 'the insurance id',
    example: 323234,
  })
  id: number;

  @ApiProperty({
    description: 'the insurance package name',
    example: 'Testing',
  })
  name: string;

  @ApiProperty({
    description: 'the insurance package id',
    example: '1234567',
  })
  packageId: string;

  @ApiProperty({
    description: 'the insurance package note type',
    example: 'something',
  })
  note: string;

  @ApiProperty({
    description: 'the insurance package active status',
    example: true,
  })
  active: boolean;

  @ApiProperty({
    description: 'the insurance package primary insurance',
    example: true,
  })
  primary: boolean;

  @ApiProperty({
    description: 'the insurance package secondary insurance',
    example: false,
  })
  secondary: boolean;

  @ApiProperty({
    description: 'the insurance package tertiary insurance',
    example: false,
  })
  tertiary: boolean;

  @ApiProperty({
    description: 'the insurance package state id',
    example: 12332,
  })
  stateId: number;

  @ApiProperty({
    description: 'the insurance package created at time',
    example: '2017-07-20T12:21:42.635Z',
  })
  createdAt: string;

  @ApiProperty({
    description: 'the insurance package updated at time',
    example: '2017-07-20T12:21:42.635Z',
  })
  updatedAt: string;

  @ApiProperty({
    example: 'insurance_plan',
  })
  planType: string;

  @ApiProperty({
    example: 2344,
  })
  insuranceClassificationId: number;

  @ApiProperty({
    example: true,
  })
  bypassScrubbing: boolean;

  @ApiProperty({
    example: true,
  })
  alwaysScrubbing: boolean;

  @ApiProperty({
    example: null,
  })
  erDiversion: string | number;

  @ApiProperty({
    example: null,
  })
  nineOneOneDiversion: string | number;

  @ApiProperty({
    example: null,
  })
  observationDiversion: string | number;

  @ApiProperty({
    example: null,
  })
  hospitalizationDiversion: string | number;

  @ApiProperty({
    example: false,
  })
  contracted: boolean;

  @ApiProperty({
    example: null,
  })
  payerGroupId: string | number;

  @ApiProperty({
    example: 'Testing',
  })
  insuranceClassificationName: string;

  @ApiProperty({
    example: [
      {
        id: 2321,
        insurancePlanId: 333,
        billingCityId: 225,
        enabled: true,
        note: '',
        advancedCareEligibility: true,
        createdAt: '2020-08-03T05:07:45.421Z',
        updatedAt: '2021-06-15T16:42:13.870Z',
      },
    ],
    isArray: true,
  })
  billingCityInsurancePlans: [
    {
      id: number;
      insurancePlanId: number;
      billingCityId: number;
      enabled: boolean;
      note: string;
      advancedCareEligibility: boolean;
      createdAt: string;
      updatedAt: string;
    }
  ];

  @ApiProperty({
    example: [
      {
        id: 3339,
        serviceLineId: 221,
        insurancePlanId: 230,
        scheduleNow: true,
        scheduleFuture: true,
        captureCcOnScene: true,
        note: 'Test note',
        createdAt: '2019-03-28T05:33:56.381Z',
        updatedAt: '2020-11-20T05:23:34.373Z',
        allChannelItems: true,
        enabled: true,
        onboardingCcPolicy: 'OPTIONAL',
      },
    ],
    isArray: true,
  })
  insurancePlanServiceLines: [
    {
      id: number;
      serviceLineId: number;
      insurancePlanId: number;
      scheduleNow: boolean;
      scheduleFuture: boolean;
      captureCcOnScene: boolean;
      note: string;
      createdAt: string;
      updatedAt: string;
      allChannelItems: boolean;
      enabled: boolean;
      onboardingCcPolicy: string;
    }
  ];

  @ApiProperty({
    example: {
      id: 723,
      name: 'Test Supplement',
      createdAt: '2018-04-18T15:19:22.776Z',
      updatedAt: '2018-04-18T15:19:22.776Z',
    },
  })
  insuranceClassification: {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
  };
}

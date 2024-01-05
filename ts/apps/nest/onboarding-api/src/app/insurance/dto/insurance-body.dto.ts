import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  Insurance,
  InsuranceParams,
  PrimaryInsuranceHolder,
} from '@*company-data-covered*/consumer-web-types';

export default class InsuranceBodyDto implements Insurance {
  @ApiProperty({
    description: 'The unique identifier of the Insurance',
    example: 408265,
  })
  @ApiPropertyOptional()
  id: number;

  @ApiProperty({
    description: 'The unique identifier of the ehr',
    example: 1227047,
  })
  ehrId: number;

  @ApiProperty({
    description: 'The unique identifier of the patient id',
    example: 407474,
  })
  patientId: number;

  @ApiProperty({
    description: 'Insurance member id',
    example: 5654987,
  })
  memberId: number;

  @ApiProperty({
    description: 'The unique identifier of the package id',
    example: 982,
  })
  packageId: number;

  @ApiProperty({
    description: 'First name of the insured',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Gender of the insured',
    example: 'male',
  })
  gender: string;

  @ApiProperty({
    description: 'Last name of the insured',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Middle name of the insured',
    example: '',
  })
  middleInitial: string;

  @ApiProperty({
    description: 'Primary insurance holder toggle',
    example: 'patient',
  })
  primaryInsuranceHolderToggle: string;

  @ApiProperty({
    description: 'Primary insurance holder attributes data',
    example: {
      firstName: 'Doe',
      middleInitial: '',
      lastName: 'John',
      gender: 'male',
      patientRelationshipToInsured: 'self',
    },
  })
  primaryInsuranceHolderAttributes: PrimaryInsuranceHolder;

  @ApiProperty({
    description: 'Patient relationship to insured',
    example: 'self',
  })
  patientRelationshipToInsured: string;

  @ApiProperty({
    description: 'Insured same as patient',
    example: true,
  })
  insuredSameAsPatient: boolean;

  @ApiProperty({
    description: 'Patient relation to subscriber',
    example: 'patient',
  })
  patientRelationToSubscriber: string;

  @ApiProperty({
    description: 'The company name of Insurance',
    example: 'United+Healthcare+Commercial',
  })
  companyName: string;

  @ApiProperty({
    description: 'Policy holder type',
    example: '',
  })
  @ApiPropertyOptional()
  policyHolderType: string;

  @ApiProperty({
    description: 'Priority of the insurance',
    example: '1',
  })
  priority: string;

  @ApiProperty({
    description: 'City of the insured',
    example: '',
  })
  @ApiPropertyOptional()
  city: string;

  @ApiProperty({
    description: 'State of the insured',
    example: '',
  })
  @ApiPropertyOptional()
  state: string;

  @ApiProperty({
    description: 'Zipcode of the insured',
    example: '',
  })
  @ApiPropertyOptional()
  zipcode: string;

  @ApiProperty({
    description: 'Start date of the insurance',
    example: '',
  })
  @ApiPropertyOptional()
  startDate: Date | string;

  @ApiProperty({
    description: 'End date of the insurance',
    example: '',
  })
  @ApiPropertyOptional()
  endDate: Date | string;

  @ApiProperty({
    description: 'Front Base64 image of the insurance card',
    example: null,
  })
  @ApiPropertyOptional()
  cardFront: {
    url: string;
  };

  @ApiProperty({
    description: 'Front image URL of the insurance card',
    example: '',
  })
  @ApiPropertyOptional()
  cardFrontUrl: string;

  @ApiProperty({
    description: 'Should remove front image of the insurance card',
    example: null,
  })
  @ApiPropertyOptional()
  removeCardFront: boolean;

  @ApiProperty({
    description: 'Back Base64 image of the insurance card',
    example: null,
  })
  @ApiPropertyOptional()
  cardBack: {
    url: string;
  };

  @ApiProperty({
    description: 'Back image URL of the insurance card',
    example: '',
  })
  @ApiPropertyOptional()
  cardBackUrl: string;

  @ApiProperty({
    description: 'Should remove back image of the insurance card',
    example: null,
  })
  @ApiPropertyOptional()
  removeCardBack: boolean;

  @ApiProperty({
    description: 'Group of the insurance',
    example: '',
  })
  @ApiPropertyOptional()
  groupNumber: string;

  @ApiProperty({
    description: '1 line of street address',
    example: '',
  })
  @ApiPropertyOptional()
  streetAddress1: string;

  @ApiProperty({
    description: '2 line of street address',
    example: '',
  })
  @ApiPropertyOptional()
  streetAddress2: string;

  @ApiProperty({
    description: 'Copay office visit',
    example: '',
  })
  @ApiPropertyOptional()
  copayOfficeVisit: string;

  @ApiProperty({
    description: 'Copay specialist',
    example: '',
  })
  @ApiPropertyOptional()
  copaySpecialist: string;

  @ApiProperty({
    description: 'Copay urgent care',
    example: null,
  })
  @ApiPropertyOptional()
  copayUrgentCare: string;

  @ApiProperty({
    description: 'Insurance plan type',
    example: '',
  })
  @ApiPropertyOptional()
  planType: string;

  @ApiProperty({
    description: 'Insurance web address',
    example: '',
  })
  @ApiPropertyOptional()
  webAddress: string;

  @ApiProperty({
    description: 'Insurance phone number',
    example: '',
  })
  @ApiPropertyOptional()
  listPhone: string;

  @ApiProperty({
    description: 'First name of the insured',
    example: 'John',
  })
  @ApiPropertyOptional()
  subscriberFirstName: string;

  @ApiProperty({
    description: 'Middle name of the insured',
    example: '',
  })
  @ApiPropertyOptional()
  subscriberMiddleInitial: string;

  @ApiProperty({
    description: 'Last name of the insured',
    example: 'Doe',
  })
  @ApiPropertyOptional()
  subscriberLastName: string;

  @ApiProperty({
    description: 'Date of birth of the insured',
    example: '01/03/1997',
  })
  @ApiPropertyOptional()
  subscriberDob: string;

  @ApiProperty({
    description: 'Gender of the insured',
    example: 'M',
  })
  @ApiPropertyOptional()
  subscriberGender: string;

  @ApiProperty({
    description: 'Phone number of the insured',
    example: '',
  })
  @ApiPropertyOptional()
  subscriberPhone: string;

  @ApiProperty({
    description: 'Street address of the insured',
    example: 'Denver',
  })
  @ApiPropertyOptional()
  subscriberStreetAddress: string;

  @ApiProperty({
    description: 'City of the insured',
    example: 'CO',
  })
  @ApiPropertyOptional()
  subscriberCity: string;

  @ApiProperty({
    description: 'State of the insured',
    example: 'CO',
  })
  @ApiPropertyOptional()
  subscriberState: string;

  @ApiProperty({
    description: 'Zipcode of the insured',
    example: '80205',
  })
  @ApiPropertyOptional()
  subscriberZipcode: string;

  @ApiProperty({
    description: 'Employer',
    example: '',
  })
  @ApiPropertyOptional()
  employer: string;

  @ApiProperty({
    description: 'Skip processing',
    example: true,
  })
  @ApiPropertyOptional()
  skipProcessing: boolean;

  @ApiProperty({
    description: 'Primary insurance holder data',
    example: {
      id: 560585,
      firstName: 'Doe',
      middleInitial: '',
      lastName: 'John',
      gender: 'male',
      patientRelationshipToInsured: 'self',
      insuranceId: '408265',
      createdAt: '2022-02-07T13:43:40.727Z',
      updatedAt: '2022-02-07T13:43:40.727Z',
    },
  })
  @ApiPropertyOptional()
  primaryInsuranceHolder: PrimaryInsuranceHolder;

  @ApiProperty({
    description: 'Insurance classification id',
    example: 2,
  })
  @ApiPropertyOptional()
  insuranceClassificationId: string | number;

  @ApiProperty({
    description: 'Insurance classification',
    example: 'commercial',
  })
  @ApiPropertyOptional()
  insuranceClassification?: string;

  @ApiProperty({
    description: 'Created at',
    example: '2022-02-07T13:43:35.932Z',
  })
  @ApiPropertyOptional()
  createdAt: string | Date;

  @ApiProperty({
    description: 'Updated at',
    example: '2022-02-07T13:52:21.332Z',
  })
  @ApiPropertyOptional()
  updatedAt: string | Date;

  @ApiProperty({
    description: 'Pulled at',
    example: '2022-02-07T13:43:46.808Z',
  })
  @ApiPropertyOptional()
  pulledAt: string | Date;

  @ApiProperty({
    description: 'Pushed at',
    example: '2022-02-07T13:52:23.501Z',
  })
  @ApiPropertyOptional()
  pushedAt: string | Date;

  @ApiProperty({
    description: 'Eligible',
    example: '',
  })
  @ApiPropertyOptional()
  eligible: string;

  @ApiProperty({
    description: 'Ehr name',
    example: 'athena',
  })
  @ApiPropertyOptional()
  ehrName: string;

  @ApiProperty({
    description: 'Eligibility message',
    example: '',
  })
  @ApiPropertyOptional()
  eligibilityMessage: string;

  @ApiProperty({
    description: 'Image requires verification',
    example: false,
  })
  @ApiPropertyOptional()
  imageRequiresVerification: boolean;

  @ApiProperty({
    description: 'Latitude position of the insured',
    example: '',
  })
  @ApiPropertyOptional()
  latitude?: string | number;

  @ApiProperty({
    description: 'Longitude position of the insured',
    example: '',
  })
  @ApiPropertyOptional()
  longitude?: string | number;
}

export class InsuranceParamsDto implements InsuranceParams {
  @ApiProperty({
    description: 'The company name of Insurance',
    example: 'United+Healthcare+Commercial',
  })
  companyName: string;

  @ApiProperty({
    description: 'First name of the insured',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Gender of the insured',
    example: 'male',
  })
  gender: string;

  @ApiProperty({
    description: 'Last name of the insured',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Middle name of the insured',
    example: '',
  })
  middleInitial: string;

  @ApiProperty({
    description: 'Policy holder type',
    example: 5654987,
  })
  memberId: string | number;

  @ApiProperty({
    description: 'Policy holder type',
    example: 982,
  })
  packageId: string | number;

  @ApiProperty({
    description: 'Primary insurance holder toggle',
    example: 'patient',
  })
  primaryInsuranceHolderToggle: string;

  @ApiProperty({
    description: 'Patient relationship to insured',
    example: 'self',
  })
  patientRelationshipToInsured: string;

  @ApiProperty({
    description: 'Primary insurance holder data',
    example: {
      id: 560585,
      firstName: 'Doe',
      middleInitial: '',
      lastName: 'John',
      gender: 'male',
      patientRelationshipToInsured: 'self',
      insuranceId: '408265',
      createdAt: '2022-02-07T13:43:40.727Z',
      updatedAt: '2022-02-07T13:43:40.727Z',
    },
  })
  primaryInsuranceHolder: PrimaryInsuranceHolder;

  @ApiProperty({
    description: 'Primary insurance holder attributes data',
    example: {
      firstName: 'Doe',
      middleInitial: '',
      lastName: 'John',
      gender: 'male',
      patientRelationshipToInsured: 'self',
    },
  })
  primaryInsuranceHolderAttributes: PrimaryInsuranceHolder;

  @ApiProperty({
    description: 'Insured same as patient',
    example: true,
  })
  insuredSameAsPatient: boolean;

  @ApiProperty({
    description: 'Patient relation to subscriber',
    example: 'patient',
  })
  patientRelationToSubscriber: string;

  @ApiProperty({
    description: 'Priority of the insurance',
    example: '2',
  })
  priority: string;

  @ApiProperty({
    description: 'Back Base64 image of the insurance card',
    example: null,
  })
  @ApiPropertyOptional()
  cardBack: string;

  @ApiProperty({
    description: 'Front Base64 image of the insurance card',
    example: null,
  })
  @ApiPropertyOptional()
  cardFront: string;

  @ApiProperty({
    description: 'Should remove back image of the insurance card',
    example: null,
  })
  @ApiPropertyOptional()
  removeCardBack: boolean;

  @ApiProperty({
    description: 'Should remove front image of the insurance card',
    example: null,
  })
  @ApiPropertyOptional()
  removeCardFront: boolean;

  @ApiProperty({
    description: 'Skip processing',
    example: true,
  })
  @ApiPropertyOptional()
  skipProcessing: boolean;

  @ApiProperty({
    description: 'Copay urgent care',
    example: null,
  })
  @ApiPropertyOptional()
  copayUrgentCare: string;

  @ApiProperty({
    description: 'Policy holder type',
    example: null,
  })
  @ApiPropertyOptional()
  policyHolderType: string;
}

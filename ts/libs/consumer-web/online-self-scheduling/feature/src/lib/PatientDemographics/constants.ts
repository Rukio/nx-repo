import {
  AssignedSexAtBirth,
  Gender,
  GenderIdentity,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';
import { PatientDemographicsFormProps } from '@*company-data-covered*/consumer-web/online-self-scheduling/ui';

export const LEGAL_SEX_OPTIONS: PatientDemographicsFormProps['legalSexOptions'] =
  [
    { label: 'Male', value: Gender.Male },
    {
      label: 'Female',
      value: Gender.Female,
    },
    {
      label: 'Choose not to disclose',
      value: Gender.Other,
    },
  ];

export const ASSIGNED_SEX_AT_BIRTH_OPTIONS: PatientDemographicsFormProps['assignedSexAtBirthOptions'] =
  [
    { label: 'Male', value: AssignedSexAtBirth.Male },
    {
      label: 'Female',
      value: AssignedSexAtBirth.Female,
    },
    {
      label: 'Choose not to disclose',
      value: AssignedSexAtBirth.ChooseNotToDisclose,
    },
    {
      label: 'Unknown',
      value: AssignedSexAtBirth.Unknown,
    },
  ];

export const GENDER_IDENTITY_OPTIONS: PatientDemographicsFormProps['genderIdentityOptions'] =
  [
    {
      label: 'Identifies as Male',
      value: GenderIdentity.Male,
    },
    {
      label: 'Identifies as Female',
      value: GenderIdentity.Female,
    },
    {
      label: 'Transgender Male/Female-to-Male (FTM)',
      value: GenderIdentity.FemaleToMale,
    },
    {
      label: 'Transgender Female/Male-to-Female (MTF)',
      value: GenderIdentity.MaleToFemale,
    },
    {
      label: 'Gender non-conforming (neither exclusively male nor female)',
      value: GenderIdentity.NonBinary,
    },
    {
      label: 'Additional gender category / other, please specify',
      value: GenderIdentity.Other,
    },
    {
      label: 'Choose not to disclose',
      value: GenderIdentity.Unknown,
    },
  ];

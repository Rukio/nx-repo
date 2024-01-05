import {
  AssignableShiftTeam,
  ShiftTeam,
  ShiftTeamSearchParam,
  StationAssignableShiftTeams,
  StationShiftTeam,
  StationShiftTeamSearchParam,
} from '@*company-data-covered*/consumer-web-types';
import ShiftTeamSearchDto from '../../dto/shift-team-search.dto';

export const MOCK_STATION_SHIFT_TEAM: StationShiftTeam = {
  id: 136361,
  car_id: 30,
  market_id: 159,
  start_time: '2022-07-19T15:00:00.000Z',
  end_time: '2022-07-20T03:00:00.000Z',
  route_poly: null,
  en_route_poly: null,
  car: {
    id: 30,
    name: 'DENC09',
    market_id: 159,
    secondary_screening_priority: false,
    latitude: null,
    longitude: null,
    last_location_id: 155022171,
    base_location_id: 58951865,
    auto_assignable: true,
    virtual_visit: false,
    nine_one_one_vehicle: false,
    status: 'waiting',
  },
  rendering_provider_type: 'app',
  skill_ids: [
    1, 4, 7, 13, 52, 139, 141, 142, 144, 147, 148, 149, 151, 152, 153, 155, 156,
    157, 159, 160, 161, 163, 164, 165, 167, 168, 169, 171, 172, 177, 179, 180,
    181, 183, 184, 212, 214, 215,
  ],
  shift_type_id: 1,
  presentation_modality: null,
  shift_type: {
    id: 1,
    name: 'acute_care',
    label: 'Acute Care',
    created_at: '2020-09-15T04:50:04.145Z',
    updated_at: '2020-09-15T04:50:04.145Z',
  },
  members: [
    {
      id: 11595,
      first_name: 'Jennifer',
      last_name: 'Allison',
      provider_image_tiny_url:
        'https://qa*company-data-covered*images.s3.amazonaws.com/uploads/provider_profile/provider_image/260/tiny_Jenn_Allison_DEN_NP_5x5.jpg',
      provider_profile_position: 'advanced practice provider',
      provider_profile_licenses: [
        {
          id: 77,
          state: 'CO',
          expiration: '2022-09-01',
          license_number: '10089',
        },
        {
          id: 3044,
          state: 'FL',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3048,
          state: 'KS',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3045,
          state: 'ID',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3046,
          state: 'GA',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3047,
          state: 'IN',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3049,
          state: 'KY',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3050,
          state: 'NC',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3051,
          state: 'NJ',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3052,
          state: 'OK',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3198,
          state: 'MT',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3053,
          state: 'TN',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3054,
          state: 'TX',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3055,
          state: 'VA',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3042,
          state: 'AZ',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3043,
          state: 'CO',
          expiration: '2023-09-01',
          license_number: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3103,
          state: 'WY',
          expiration: '2037-04-01',
          license_number: 'test1234WY',
        },
      ],
      provider_profile_credentials: 'NP',
    },
    {
      id: 16055,
      first_name: 'Stefen',
      last_name: 'Ammon',
      provider_image_tiny_url:
        'https://qa*company-data-covered*images.s3.amazonaws.com/uploads/provider_profile/provider_image/345/tiny_Stefen_Ammon.jpg',
      provider_profile_position: 'virtual doctor',
      provider_profile_licenses: [
        {
          id: 235,
          state: 'CO',
          expiration: '2023-04-01',
          license_number: '45573',
        },
        {
          id: 292,
          state: 'AZ',
          expiration: '2020-11-01',
          license_number: '58357',
        },
        {
          id: 291,
          state: 'NV',
          expiration: '2023-06-01',
          license_number: '18674',
        },
        {
          id: 562,
          state: 'ID',
          expiration: '2022-06-01',
          license_number: 'MC-0362',
        },
        {
          id: 3026,
          state: 'WA',
          expiration: '2022-11-01',
          license_number: '1730210773',
        },
      ],
      provider_profile_credentials: 'MD',
    },
  ],
};

export const MOCK_SHIFT_TEAM: ShiftTeam = {
  id: 136361,
  carId: 30,
  marketId: 159,
  startTime: '2022-07-19T15:00:00.000Z',
  endTime: '2022-07-20T03:00:00.000Z',
  routePoly: null,
  enRoutePoly: null,
  car: {
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
    status: 'waiting',
  },
  renderingProviderType: 'app',
  skillIds: [
    1, 4, 7, 13, 52, 139, 141, 142, 144, 147, 148, 149, 151, 152, 153, 155, 156,
    157, 159, 160, 161, 163, 164, 165, 167, 168, 169, 171, 172, 177, 179, 180,
    181, 183, 184, 212, 214, 215,
  ],
  shiftTypeId: 1,
  presentationModality: null,
  shiftType: {
    id: 1,
    name: 'acute_care',
    label: 'Acute Care',
    createdAt: '2020-09-15T04:50:04.145Z',
    updatedAt: '2020-09-15T04:50:04.145Z',
  },
  members: [
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
        {
          id: 3044,
          state: 'FL',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3048,
          state: 'KS',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3045,
          state: 'ID',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3046,
          state: 'GA',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3047,
          state: 'IN',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3049,
          state: 'KY',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3050,
          state: 'NC',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3051,
          state: 'NJ',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3052,
          state: 'OK',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3198,
          state: 'MT',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3053,
          state: 'TN',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3054,
          state: 'TX',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3055,
          state: 'VA',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3042,
          state: 'AZ',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3043,
          state: 'CO',
          expiration: '2023-09-01',
          licenseNumber: '**RN.0191433 (multi-state CO)',
        },
        {
          id: 3103,
          state: 'WY',
          expiration: '2037-04-01',
          licenseNumber: 'test1234WY',
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
        {
          id: 292,
          state: 'AZ',
          expiration: '2020-11-01',
          licenseNumber: '58357',
        },
        {
          id: 291,
          state: 'NV',
          expiration: '2023-06-01',
          licenseNumber: '18674',
        },
        {
          id: 562,
          state: 'ID',
          expiration: '2022-06-01',
          licenseNumber: 'MC-0362',
        },
        {
          id: 3026,
          state: 'WA',
          expiration: '2022-11-01',
          licenseNumber: '1730210773',
        },
      ],
      providerProfileCredentials: 'MD',
    },
  ],
  status: 'waiting',
};

const shiftTeamAttributes: string[] = [
  'skill_id:52',
  'license:CO',
  'license:pediatric',
  'license:WY',
  'insurance:Anthem Blue Cross Blue Shield/Denver',
  'insurance:Anthem Blue Cross Blue Shield/Colorado Springs',
  'insurance:Bright Health Plan/Denver',
  'insurance:Bright Health Plan/Colorado Springs',
  'insurance:Cigna/Denver',
  'insurance:Cigna/Colorado Springs',
  'insurance:Denver Health Medical Plan/Denver',
  'insurance:Denver Health Medical Plan/Colorado Springs',
  'insurance:InnovAge/Denver',
  'insurance:InnovAge/Colorado Springs',
  'insurance:Medicaid/Denver',
  'insurance:Medicaid/Colorado Springs',
  'insurance:Medicare/Denver',
  'insurance:Medicare/Colorado Springs',
  'insurance:Medicare RR/Denver',
  'insurance:Medicare RR/Colorado Springs',
  'insurance:Rocky Mountain Health Plan/Denver',
  'insurance:Rocky Mountain Health Plan/Colorado Springs',
  'insurance:Aetna/Denver',
  'insurance:Aetna/Colorado Springs',
  'insurance:United Healthcare/Denver',
  'insurance:United Healthcare/Colorado Springs',
  'insurance:Friday Health Plans/Denver',
  'insurance:Friday Health Plans/Colorado Springs',
  'insurance:Humana/Denver',
  'insurance:Humana/Colorado Springs',
  'insurance:Kaiser Permanente/Denver',
  'insurance:Kaiser Permanente/Colorado Springs',
  'insurance:TruCare Pace/Denver',
  'insurance:TruCare Pace/Colorado Springs',
  'shift_team:142765',
  'presentation_modality:in_person',
  'assignment_type:auto-assignable',
  'service_name:Acute',
];

export const MOCK_STATION_ASSIGNABLE_SHIFT_TEAMS: StationAssignableShiftTeams =
  {
    shift_teams: [
      {
        shift_team: {
          id: 142765,
          available_time_window: {
            start_date_time: '2022-08-25T06:00:00.000Z',
            end_date_time: '2022-08-25T18:00:00.000Z',
          },
          car_name: 'DEN01',
          attributes: shiftTeamAttributes.map((name) => ({ name })),
        },
        status: 'STATUS_NOT_ASSIGNABLE',
        time_window_status: 'TIME_WINDOW_STATUS_UNSPECIFIED',
        missing_required_attributes: [
          {
            name: 'license:CanSeePatientsInOH',
          },
        ],
        missing_preferred_attributes: [],
        included_forbidden_attributes: [],
        included_unwanted_attributes: [],
      },
    ],
  };

export const MOCK_ASSIGNABLE_SHIFT_TEAMS: AssignableShiftTeam[] = [
  {
    id: 142765,
    startTime: '2022-08-25T06:00:00.000Z',
    endTime: '2022-08-25T18:00:00.000Z',
    status: 'STATUS_NOT_ASSIGNABLE',
    presentationModality: 'in_person',
    license: ['CO', 'pediatric', 'WY'],
    insurance: [
      'Anthem Blue Cross Blue Shield/Denver',
      'Anthem Blue Cross Blue Shield/Colorado Springs',
      'Bright Health Plan/Denver',
      'Bright Health Plan/Colorado Springs',
      'Cigna/Denver',
      'Cigna/Colorado Springs',
      'Denver Health Medical Plan/Denver',
      'Denver Health Medical Plan/Colorado Springs',
      'InnovAge/Denver',
      'InnovAge/Colorado Springs',
      'Medicaid/Denver',
      'Medicaid/Colorado Springs',
      'Medicare/Denver',
      'Medicare/Colorado Springs',
      'Medicare RR/Denver',
      'Medicare RR/Colorado Springs',
      'Rocky Mountain Health Plan/Denver',
      'Rocky Mountain Health Plan/Colorado Springs',
      'Aetna/Denver',
      'Aetna/Colorado Springs',
      'United Healthcare/Denver',
      'United Healthcare/Colorado Springs',
      'Friday Health Plans/Denver',
      'Friday Health Plans/Colorado Springs',
      'Humana/Denver',
      'Humana/Colorado Springs',
      'Kaiser Permanente/Denver',
      'Kaiser Permanente/Colorado Springs',
      'TruCare Pace/Denver',
      'TruCare Pace/Colorado Springs',
    ],
    assignmentType: 'auto-assignable',
    carName: 'DEN01',
    shiftType: 'Acute',
    skillId: [52],
    timeWindowStatus: 'TIME_WINDOW_STATUS_UNSPECIFIED',
    missingRequiredAttributes: [
      {
        name: 'license:CanSeePatientsInOH',
      },
    ],
    missingPreferredAttributes: [],
    includedUnwantedAttributes: [],
    includedForbiddenAttributes: [],
  },
];

// Params for controller tests

export const SHIFT_TEAM_PARAMS: ShiftTeamSearchDto = {
  marketId: '159',
  start: '2022-07-18T14:40:24.832Z',
  end: '2022-07-30T14:40:24.832Z',
};

export const ASSIGNABLE_SHIFT_TEAM_PARAMS: ShiftTeamSearchDto = {
  careRequestId: '1358731',
  start: '2022-07-18T14:40:24.832Z',
  end: '2022-07-30T14:40:24.832Z',
};

// Params for service tests

export const SHIFT_TEAM_PARAMS_WITH_CARE_REQUEST: ShiftTeamSearchDto = {
  careRequestId: '1358731',
  start: '2022-07-18T14:40:24.832Z',
  end: '2022-07-30T14:40:24.832Z',
};

// Params for mapper tests

export const STATION_SHIFT_TEAM_PARAMS: StationShiftTeamSearchParam = {
  market_id: '159',
  start: '2022-07-18T14:40:24.832Z',
  end: '2022-07-30T14:40:24.832Z',
};

export const SHIFT_TEAM_PARAMS_WITH_MARKET_IDS: ShiftTeamSearchDto = {
  marketIds: ['159', '160'],
  start: '2022-07-18T14:40:24.832Z',
  end: '2022-07-30T14:40:24.832Z',
};

export const STATION_SHIFT_TEAM_PARAMS_WITH_MARKET_IDS: StationShiftTeamSearchParam =
  {
    market_ids: '159,160',
  };

export const SHIFT_TEAM_PARAMS_WITH_STRING_MARKET_IDS: ShiftTeamSearchParam = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore *We can expect string instead of array*
  marketIds: '159',
  start: '2022-07-18T14:40:24.832Z',
  end: '2022-07-30T14:40:24.832Z',
};

export const STATION_SHIFT_TEAM_PARAMS_WITH_STRING_MARKET_IDS: StationShiftTeamSearchParam =
  {
    market_ids: '159',
  };

export const SHIFT_TEAM_PARAMS_WITHOUT_IDS: ShiftTeamSearchParam = {
  start: '2022-07-18T14:40:24.832Z',
  end: '2022-07-30T14:40:24.832Z',
};

export const SHIFT_TEAM_PARAMS_WITH_IDS: ShiftTeamSearchParam = {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore *We can expect string instead of array*
  ids: '159',
  start: '2022-07-18T14:40:24.832Z',
  end: '2022-07-30T14:40:24.832Z',
};

export const SHIFT_TEAM_PARAMS_WITH_ARRAY_OF_IDS: ShiftTeamSearchParam = {
  ids: ['159', '160'],
  start: '2022-07-18T14:40:24.832Z',
  end: '2022-07-30T14:40:24.832Z',
};

export const STATION_SHIFT_TEAM_PARAMS_WITH_IDS: StationShiftTeamSearchParam = {
  ids: '159',
};

export const STATION_SHIFT_TEAM_PARAMS_WITH_ARRAY_OF_IDS: StationShiftTeamSearchParam =
  {
    ids: '159,160',
  };

export const SHIFT_TEAM_ASSIGNABLE_FETCH_PARAMS: ShiftTeamSearchParam = {
  careRequestId: '142765',
  start: '2022-07-18T14:40:24.832Z',
  end: '2022-07-30T14:40:24.832Z',
};

export const STATION_SHIFT_TEAM_ASSIGNABLE_FETCH_PARAMS: StationShiftTeamSearchParam =
  {
    care_request_id: '142765',
    start: '2022-07-18T14:40:24.832Z',
    end: '2022-07-30T14:40:24.832Z',
  };

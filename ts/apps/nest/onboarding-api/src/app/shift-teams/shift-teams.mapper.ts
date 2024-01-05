import {
  ShiftTeam,
  StationShiftTeam,
  ShiftTeamSearchParam,
  StationShiftTeamSearchParam,
  AssignableShiftTeamAttributes,
  StationAssignableShiftTeams,
  AssignableShiftTeam,
} from '@*company-data-covered*/consumer-web-types';

const ShiftTeamSearchParamToStationGetAssignableShiftTeam = (
  input: ShiftTeamSearchParam
): StationShiftTeamSearchParam => {
  const output: StationShiftTeamSearchParam = {
    care_request_id: input.careRequestId,
    start: input.start,
    end: input.end,
  };

  return output;
};

const SearchShiftTeamToStationSearchShiftTeam = (
  input: ShiftTeamSearchParam
): StationShiftTeamSearchParam => {
  const output: StationShiftTeamSearchParam = {};
  if (input.marketId) {
    output.market_id = input.marketId;
    output.start = input.start;
    output.end = input.end;
  } else if (input.marketIds) {
    output.market_ids = Array.isArray(input.marketIds)
      ? input.marketIds.join(',')
      : input.marketIds;
  } else if (input.ids) {
    output.ids = Array.isArray(input.ids) ? input.ids.join(',') : input.ids;
  }

  return output;
};

const getAttributeValue = (
  name: string,
  attributes?: AssignableShiftTeamAttributes[]
): string =>
  attributes?.find((attr) => attr.name.includes(name))?.name.split(':')[1];

function getAttributeValues(
  name: string,
  isNumber: true,
  attributes?: AssignableShiftTeamAttributes[]
): number[];
function getAttributeValues(
  name: string,
  isNumber: false,
  attributes?: AssignableShiftTeamAttributes[]
): string[];
function getAttributeValues(
  name: string,
  isNumber: boolean,
  attributes?: AssignableShiftTeamAttributes[]
): (string | number)[] {
  return attributes
    ?.filter((attr) => attr.name.includes(name))
    .map((attr) =>
      isNumber ? parseInt(attr.name.split(':')[1], 10) : attr.name.split(':')[1]
    );
}

const StationShiftTeamsToShiftTeams = (input: StationShiftTeam): ShiftTeam => {
  const output: ShiftTeam = {
    id: input.id,
    carId: input.car_id,
    marketId: input.market_id,
    startTime: input.start_time,
    endTime: input.end_time,
    routePoly: input.route_poly,
    enRoutePoly: input.en_route_poly,
    car: input.car && {
      id: input.car.id,
      name: input.car.name,
      phone: input.car.phone,
      marketId: input.car.market_id,
      secondaryScreeningPriority: input.car.secondary_screening_priority,
      latitude: input.car.latitude,
      longitude: input.car.longitude,
      lastLocationId: input.car.last_location_id,
      baseLocationId: input.car.base_location_id,
      autoAssignable: input.car.auto_assignable,
      virtualVisit: input.car.virtual_visit,
      nineOneOneVehicle: input.car.nine_one_one_vehicle,
      status: input.car.status,
    },
    renderingProviderType: input.rendering_provider_type,
    skillIds: input.skill_ids,
    shiftTypeId: input.shift_type_id,
    presentationModality: input.presentation_modality,
    shiftType: input.shift_type && {
      id: input.shift_type.id,
      name: input.shift_type.name,
      label: input.shift_type.label,
      createdAt: input.shift_type.created_at,
      updatedAt: input.shift_type.updated_at,
    },
    members:
      input.members &&
      input.members.map((member) => ({
        id: member.id,
        firstName: member.first_name,
        lastName: member.last_name,
        mobileNumber: member.mobile_number,
        providerImageTinyUrl: member.provider_image_tiny_url,
        providerProfilePosition: member.provider_profile_position,
        providerProfileLicenses:
          member.provider_profile_licenses &&
          member.provider_profile_licenses.map((profileLicense) => ({
            id: profileLicense.id,
            state: profileLicense.state,
            expiration: profileLicense.expiration,
            licenseNumber: profileLicense.license_number,
          })),
        providerProfileCredentials: member.provider_profile_credentials,
        secondaryScreeningStates: member.secondary_screening_states,
      })),
    tzShortName: input.tz_short_name,
    shiftStartDate: input.shift_start_date,
    status: input.status || input.car?.status,
  };

  return output;
};

const StationAssignableShiftTeamsToShiftTeams = (
  input: StationAssignableShiftTeams
): AssignableShiftTeam[] => {
  if (!input.shift_teams.length) {
    return [];
  }

  return input.shift_teams.map((st) => {
    const output: AssignableShiftTeam = {
      id: st.shift_team.id,
      startTime: st.shift_team.available_time_window.start_date_time.toString(),
      endTime: st.shift_team.available_time_window.end_date_time.toString(),
      status: st.status,
      presentationModality: getAttributeValue(
        'presentation_modality',
        st.shift_team.attributes
      ),
      license: getAttributeValues('license', false, st.shift_team.attributes),
      insurance: getAttributeValues(
        'insurance',
        false,
        st.shift_team.attributes
      ),
      assignmentType: getAttributeValue(
        'assignment_type',
        st.shift_team.attributes
      ),
      carName: st.shift_team.car_name,
      shiftType: getAttributeValue('service_name', st.shift_team.attributes),
      skillId: getAttributeValues('skill_id', true, st.shift_team.attributes),
      timeWindowStatus: st.time_window_status,
      missingRequiredAttributes: st.missing_required_attributes,
      missingPreferredAttributes: st.missing_preferred_attributes,
      includedForbiddenAttributes: st.included_forbidden_attributes,
      includedUnwantedAttributes: st.included_unwanted_attributes,
    };

    return output;
  });
};

export default {
  StationShiftTeamsToShiftTeams,
  StationAssignableShiftTeamsToShiftTeams,
  SearchShiftTeamToStationSearchShiftTeam,
  ShiftTeamSearchParamToStationGetAssignableShiftTeam,
};

import SHIFT_TYPES from './shiftTypes';
import { formatWithTimeZone, increment, subtract } from '../utils/dateTime';
import { MARKETS } from './markets';
import { sendPOSTRequest } from './request';
import { app, doctor } from './users';
import { SHIFT_TYPE } from '../../types/api/shiftType';
import { Markets } from '../../types/api/markets';
import { Shifts } from '../../types/api/shifts';
import { Users } from '../../types/api/users';

const convertShiftTypeToLabel = (shiftType: SHIFT_TYPE) => {
  switch (shiftType) {
    case SHIFT_TYPES.acute_care:
      return 'Acute Care';
    case SHIFT_TYPES.telepresentation_virtual_app:
      return 'Telepresentation: Virtual APP';
    case SHIFT_TYPES.telepresentation_solo_dhmt:
      return 'Telepresentation: Solo DHMT';
    case SHIFT_TYPES.asymptomatic_covid_testing:
      return 'Asymptomatic Covid Testing';
    case SHIFT_TYPES.covid_vaccination:
      return 'COVID Vaccination';
    default:
      return '';
  }
};

const SHIFT_BODY = {
  breaks_attributes: [
    {
      market_break_config_id: 1,
    },
  ],
  rendering_provider_type: 'app',
};

// TODO: Make this more dynamic, hard-coding to unblock
const NEW_SHIFT_BODY = {
  shift_team_service_ids: [1, 2],
};

function validateIfShiftExist({
  shiftType: currentShiftType,
  isTomorrow: currentIsTomorrow,
  market,
  currentInstance,
}: Shifts.CreateShift) {
  const { vehicleId: currentVehicleId, shiftMemberList: currentShiftMembers } =
    Cypress.env('currentShiftsInfo')[currentInstance];

  const { id: marketId } = market;

  let existingShiftId;
  for (const key of Object.keys(Cypress.env('currentShiftsInfo'))) {
    const {
      shiftMemberList,
      vehicleId,
      shiftType,
      id,
      startTime,
      endTime,
      isTomorrow,
      services,
      presentation_modality,
    } = Cypress.env('currentShiftsInfo')[key];

    if (
      JSON.stringify(shiftMemberList) === JSON.stringify(currentShiftMembers) &&
      vehicleId === currentVehicleId &&
      shiftType === convertShiftTypeToLabel(currentShiftType) &&
      isTomorrow === currentIsTomorrow
    ) {
      const currentShiftsInfo = Cypress.env('currentShiftsInfo');
      const currentShiftInfo = currentShiftsInfo[currentInstance];

      const updatedShiftInfo = {
        ...Cypress._.cloneDeep(currentShiftInfo),
        shiftType: convertShiftTypeToLabel(currentShiftType),
        id,
        startTime,
        endTime,
        marketId,
        isTomorrow,
        services,
        modality: presentation_modality,
      };

      currentShiftsInfo[currentInstance] = updatedShiftInfo;
      Cypress.env('currentShiftsInfo', currentShiftsInfo);
      existingShiftId = id;
      break;
    }
  }

  return existingShiftId;
}

const DEFAULT_START = '06:00AM';
const DEFAULT_END = '08:00PM';

function convertTime12to24(time12h: string) {
  const [time, meridian] = time12h.split(/(PM|AM)/gm);
  // eslint-disable-next-line prefer-const
  let [hours, minutes] = time.split(':');
  if (meridian === 'PM') {
    hours = (Number.parseInt(hours) + 12).toString();
  }
  if (hours === '12') {
    hours = '00';
  }

  return `${hours}:${minutes}`;
}

function parseHoursOfOperation(marketsRespBody: string) {
  const doc = document.createElement('html');
  doc.innerHTML = marketsRespBody;

  return doc
    .querySelector('div[data-testid="scheduled-days-list"]')
    ?.getElementsByClassName('small-5 columns schedule-display')[1]
    ?.innerHTML.replaceAll(' ', '')
    .trim();
}

function createShiftDateTimes(
  marketsResp: Cypress.Response<string>
): Array<Date> {
  const hoursOfOperation = parseHoursOfOperation(marketsResp.body);
  const [startHOO, endHOO] = hoursOfOperation?.split('-') || [];

  const startHours = convertTime12to24(startHOO || DEFAULT_START).split(':');
  const endHours = convertTime12to24(endHOO || DEFAULT_END).split(':');

  const startDateTime = new Date().setHours(
    Number(startHours[0]),
    Number(startHours[1]),
    0,
    0
  );
  const endDateTime = new Date().setHours(
    Number(endHours[0]),
    Number(endHours[1]),
    0,
    0
  );

  let finalStartDate = new Date(startDateTime);

  const currentDateTime = new Date();
  if (currentDateTime > finalStartDate) {
    finalStartDate = currentDateTime;
  }

  return [finalStartDate, new Date(endDateTime)];
}

function createShift({
  shiftType: currentShiftType,
  isVirtual,
  endShiftIn2Hours,
  endShiftIn4Hours,
  isTomorrow,
  market,
  currentInstance,
}: Shifts.CreateShift) {
  const {
    vehicleId: currentVehicleId,
    shiftMemberList: currentShiftMemberList,
  } = Cypress.env('currentShiftsInfo')[currentInstance];

  const { id: marketId, timeZoneCity } = market;
  const days = isTomorrow ? 1 : 0;

  const currentShiftId = validateIfShiftExist({
    shiftType: currentShiftType,
    isVirtual,
    isTomorrow,
    market,
    currentInstance,
  });
  if (currentShiftId) {
    return currentShiftId;
  }

  cy.getMarketAdminPage(marketId?.toString()).then(
    (marketsResp: Cypress.Response<string>) => {
      const [startDateTime, endDateTime] = createShiftDateTimes(marketsResp);

      const startTime = formatWithTimeZone({
        dateTime: increment({
          dateTime: startDateTime,
          duration: { days, minutes: 1 },
        }),
        timeZone: timeZoneCity,
      });

      let endTime;

      if (endShiftIn2Hours) {
        endTime = formatWithTimeZone({
          dateTime: increment({
            dateTime: startDateTime,
            duration: { days, hours: 2 },
          }),
          timeZone: timeZoneCity,
        });
      } else if (endShiftIn4Hours) {
        endTime = formatWithTimeZone({
          dateTime: increment({
            dateTime: startDateTime,
            duration: { days, hours: 4 },
          }),
          timeZone: timeZoneCity,
        });
      } else {
        endTime = formatWithTimeZone({
          dateTime: increment({
            dateTime: subtract({
              dateTime: endDateTime,
              duration: { hours: 2 },
            }),
            duration: { days },
          }),
          timeZone: timeZoneCity,
        });
      }

      const virtualShift =
        currentShiftType === SHIFT_TYPES.telepresentation_virtual_app ||
        isVirtual;

      let currentAppId;
      let currentDoctorId;
      (currentShiftMemberList as Array<Users.Provider>).forEach(
        (shiftMember) => {
          if (shiftMember.role.includes(doctor.position)) {
            currentDoctorId = shiftMember.id;
          }
          if (shiftMember.role.includes(app.position)) {
            currentAppId = shiftMember.id;
          }
        }
      );

      const currentMemberIds = (
        currentShiftMemberList as Array<Users.Provider>
      ).map((sm) => sm.id);

      const shiftBody = {
        shift_team: {
          ...Cypress._.cloneDeep(SHIFT_BODY),
          ...Cypress._.cloneDeep(NEW_SHIFT_BODY),
          ...{
            member_ids: currentMemberIds,
            on_call_doctor_id: currentDoctorId || null,
            rendering_provider_id: currentAppId || null,
            presentation_modality: !virtualShift ? 'in_person' : 'virtual',
            car_id: !virtualShift ? currentVehicleId : null,
            shift_type_name: currentShiftType,
            market_id: marketId,
            start_time: startTime,
            end_time: endTime,
          },
        },
      };

      return sendPOSTRequest({
        url: '/api/shift_teams.json',
        body: shiftBody,
      }).then((resp) => {
        const {
          start_time,
          end_time,
          id,
          market_id,
          presentation_modality,
          services,
        } = resp.body;

        const currentShiftsInfo = Cypress.env('currentShiftsInfo');
        const currentShiftInfo = currentShiftsInfo[currentInstance];

        const updatedShiftInfo = {
          ...Cypress._.cloneDeep(currentShiftInfo),
          shiftType: convertShiftTypeToLabel(currentShiftType),
          id,
          startTime: start_time,
          endTime: end_time,
          marketId: market_id,
          isTomorrow,
          services,
          modality: presentation_modality,
        };

        currentShiftsInfo[currentInstance] = updatedShiftInfo;
        Cypress.env('currentShiftsInfo', currentShiftsInfo);

        return id;
      });
    }
  );
}

function endAllShifts({ id }: Markets.MarketId) {
  return sendPOSTRequest({
    url: `/api/markets/${id}/training_data_generations/destroy_all_shift_teams`,
  });
}

function createAllShifts({ shifts, market }: Shifts.CreateShifts) {
  let currentInstance = Cypress.env('currentShiftInstance') || 0;
  let currentShiftId;

  shifts.forEach(
    ({
      shiftType,
      endShiftIn2Hours,
      endShiftIn4Hours,
      isVirtual,
      isTomorrow,
    }) => {
      currentShiftId = createShift({
        shiftType,
        endShiftIn2Hours,
        endShiftIn4Hours,
        isVirtual,
        isTomorrow,
        market,
        currentInstance,
      });
      currentInstance += 1;
    }
  );
  Cypress.env('currentShiftInstance', currentInstance);

  return currentShiftId;
}

const DEFAULT_SHIFT = [
  {
    shiftType: SHIFT_TYPES.acute_care,
    endShiftIn2Hours: false,
    endShiftIn4Hours: false,
    isVirtual: false,
    isTomorrow: false,
    isSelfShift: false,
  },
];
function createShiftsIfNotExist({
  shifts,
  market = MARKETS.denver,
  endShiftsFirst = true,
  loginUser,
}: Shifts.CreateShifts) {
  const shiftsToUse = shifts || DEFAULT_SHIFT;

  cy.createShiftDataIfNotExist({
    market,
    shifts: shiftsToUse,
    loginUser,
  }).then(() => {
    if (endShiftsFirst) {
      return cy.endAllShifts({ id: market.id }).then(() => {
        return createAllShifts({ shifts, market, loginUser });
      });
    }

    return createAllShifts({ shifts, market, loginUser });
  });
}

export { createShiftsIfNotExist, endAllShifts };

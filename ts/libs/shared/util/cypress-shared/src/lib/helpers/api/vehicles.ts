import { Markets } from '../../types/api/markets';
import { Shifts } from '../../types/api/shifts';
import { Vehicles } from '../../types/api/vehicles';
import { sendGETRequest, sendPOSTRequest } from './request';

const BASE_VEHICLE_BODY = {
  auto_assignable: 1,
  nine_one_one_vehicle: 0,
  notification_subscription_attributes: {
    phone: '(303) 500-1518',
  },
  secondary_screening_priority: 0,
  virtual_visit: 0,
};
const LAT_LONG_MODIFIER = 1.1;

const createVehicleName = ({ shortName, instance }: Shifts.NameGeneration) =>
  `${shortName.toUpperCase()}Automation0${instance}`;

function createVehicle({ name, market }: Vehicles.CreateVehicle) {
  const {
    id,
    careRequestAddress: { latitude, longitude },
  } = market;
  const latitudeFloat = parseFloat(latitude);
  const longitudeFloat = parseFloat(longitude);

  const vehicleBody = {
    car: {
      ...Cypress._.cloneDeep(BASE_VEHICLE_BODY),
      name,
    },
    market_location: [latitudeFloat, longitudeFloat],
    geo_location: {
      latitude: latitudeFloat,
      longitude: longitudeFloat,
      base: true,
    },
    commit: 'UPDATE CAR',
  };

  return sendPOSTRequest({
    url: `/admin/markets/${id}/cars`,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: vehicleBody,
  }).then((createVehicleRsp) => {
    return createVehicleRsp.body;
  });
}

function getAllVehicles({ id }: Markets.MarketId) {
  return sendGETRequest({
    url: `/api/markets/${id}/cars`,
  });
}

function createVehiclesIfNotExist({
  count = 0,
  market,
}: Vehicles.CreateVehicle) {
  const { id: marketId, shortName } = market;

  const currentShiftsInfo = Cypress.env('currentShiftsInfo') || {};
  let currentInstance = Cypress.env('currentVehicleInstance') || 0;

  getAllVehicles({ id: marketId }).then((getVehicleResp) => {
    for (let i = 0; i < count; i += 1) {
      const vehicleName = createVehicleName({
        shortName,
        instance: i + 1,
      });

      const existingVehicle = getVehicleResp.body.find(
        (v: Vehicles.Vehicle) => v && v.name === vehicleName
      );
      const currentShiftInfo = currentShiftsInfo
        ? currentShiftsInfo[currentInstance]
        : {};

      if (!existingVehicle) {
        createVehicle({
          market,
          name: vehicleName,
        }).then(({ id }) => {
          const updatedShiftInfo = {
            ...Cypress._.cloneDeep(currentShiftInfo),
            vehicleName,
            vehicleId: id,
            nearbyMarketIds: [],
          };

          currentShiftsInfo[currentInstance] = updatedShiftInfo;
          Cypress.env('currentShiftsInfo', currentShiftsInfo);
          currentInstance += 1;
        });
      } else {
        const updatedShiftInfo = {
          ...Cypress._.cloneDeep(currentShiftInfo),
          vehicleName,
          vehicleId: existingVehicle.id,
          nearbyMarketIds: existingVehicle.nearby_market_ids,
        };

        currentShiftsInfo[currentInstance] = updatedShiftInfo;
        Cypress.env('currentShiftsInfo', currentShiftsInfo);
        currentInstance += 1;
      }
    }

    Cypress.env('currentVehicleInstance', currentInstance);
  });
}

function updateVehicleGeoLocation({
  id,
  currentLat,
  currentLong,
}: Vehicles.UpdateGeoLocation) {
  return sendPOSTRequest({
    url: '/api/geo_locations',
    body: {
      car_id: id,
      geo_location: {
        latitude: parseFloat(currentLat) + LAT_LONG_MODIFIER,
        longitude: parseFloat(currentLong) + LAT_LONG_MODIFIER,
      },
    },
  });
}

export { createVehiclesIfNotExist, updateVehicleGeoLocation };

import {
  archiveCareRequest,
  archiveOpenCareRequests,
  assignCareRequest,
  updateCareRequestStatus,
} from '../helpers/api/careRequests';
import { MARKETS, getMarketAdminPage } from '../helpers/api/markets';
import { createShiftsIfNotExist, endAllShifts } from '../helpers/api/shift';
import {
  createTestUsersIfNotExist,
  getCurrentUser,
} from '../helpers/api/users';
import {
  createVehiclesIfNotExist,
  updateVehicleGeoLocation,
} from '../helpers/api/vehicles';
import '../types/api';
import { Assignment } from '../types/api/assignment';

/** VEHICLES */
/** API command that creates a suite of test vehicles if they currently don't exist in the given environment
 * @param {Vehicles.CreateVehicle} params - function params
 * @param {Markets.Market} params.market market to assign a care request to - refers to the MARKETS data object in market.js
 * @param {Markets.Id} params.market.id id of the market
 * @param {Markets.ShortName} params.market.shortName shortname of the market
 * @param {String} params.market.timeZoneCity timezone city referring to how to offset a UTC time
 * @param {Number} params.count amount of vehicles to create for each test
 */
Cypress.Commands.add('createVehiclesIfNotExist', ({ market, count } = {}) => {
  Cypress.log({
    name: 'createVehiclesIfNotExist',
  });

  createVehiclesIfNotExist({ market, count });
});

/** API command that updates a vehicle's geo location, used particularly for the LV1 BE service and Rover testing
 * @param {Vehicles.UpdateGeoLocation} params - function params
 * @param {Id} params.id id of the vehicle to update
 * @param {String} params.currentLat current latitude of the vehicle
 * @param {String} params.currentLong current longitude of the vehicle
 */
Cypress.Commands.add(
  'updateVehicleGeoLocation',
  ({ id, currentLat, currentLong } = {}) => {
    Cypress.log({
      name: 'updateUser',
    });

    updateVehicleGeoLocation({ id, currentLat, currentLong });
  }
);

/** USERS */
/** API command that returns the current logged-in user data */
Cypress.Commands.add('getCurrentUser', () => {
  Cypress.log({
    name: 'getCurrentUser',
  });

  return getCurrentUser();
});

/** API command that creates a suite of test users if they currently don't exist in the given environment
 * @param {Users.CreateTestUsers} params - function params
 * @param {Markets.Market} params.market market to assign a care request to - refers to the MARKETS data object in market.js
 * @param {Id} params.market.id id of the market
 * @param {String} params.market.shortName shortname of the market
 * @param {String} params.market.timeZoneCity timezone city referring to how to offset a UTC time
 * @param {Array<Shifts.Shift>} params.shifts - specific shifts to create
 * @param {Boolean} params.shifts[].isVirtual - whether or not to create the shift with only a virtual app
 * @param {Boolean} params.shifts[].isSelfShift - whether or not to add the currently logged-in user as an app on the shift
 * @param {Users.LoginUser} params.loginUser logged-in test user to assign to a shift
 */
Cypress.Commands.add(
  'createTestUsersIfNotExist',
  ({ market, shifts, loginUser }) => {
    Cypress.log({
      name: 'createUsersIfNotExist',
    });

    createTestUsersIfNotExist({ market, shifts, loginUser });
  }
);

/** SHIFTS */
/** API command that creates a suite of test vehicles and users if they currently don't exist in the given environment
 * @param {Shifts.CreateShifts} params - function params
 * @param {Markets.Market} params.market market to assign a care request to - refers to the MARKETS data object in market.js
 * @param {Id} params.market.id id of the market
 * @param {String} params.market.shortName shortname of the market
 * @param {String} params.market.timeZoneCity timezone city referring to how to offset a UTC time
 * @param {Array<Shifts.Shift>} params.shifts - specific shifts to create
 * @param {String} params.shifts[].shiftType - shift type to create
 * @param {Boolean} params.shifts[].isVirtual - whether or not to create the shift with only a virtual app
 * @param {Boolean} params.shifts[].isTomorrow - whether or not to create the shift for tomorrow vs today
 * @param {Boolean} params.shifts[].isSelfShift - whether or not to add the currently logged-in user as an app on the shift
 * @param {String} params.loginUser logged-in test user to assign to a shift, refers to the loginUser.json fixture
 */
Cypress.Commands.add(
  'createShiftDataIfNotExist',
  ({ market, shifts = [], loginUser } = {}) => {
    Cypress.log({
      name: 'createShiftDataIfNotExist',
    });

    cy.createVehiclesIfNotExist({ market, count: shifts.length });
    cy.createTestUsersIfNotExist({ market, shifts, loginUser });
  }
);

/** API command that creates a shift if it currenty doesn't exist in the given environment
 * @param {Shifts.CreateShifts} params - function params
 * @param {Shifts.ShiftInfo[]} params.shifts - specific shifts to create
 * @param {String} params.shifts[].shiftType - shift type to create
 * @param {Boolean} params.shifts[].isTomorrow - whether or not to create the shift for tomorrow vs today
 * @param {Boolean} params.shifts[].isSelfShift - whether or not to add the currently logged-in user as an app on the shift
 * @param {Markets.Market} params.market - market to assign a care request to - refers to the MARKETS data object in market.js
 * @param {Number} params.market.id - id of the market
 * @param {String} params.market.shortName - shortname of the market
 * @param {String} params.market.timeZoneCity - timezone city referring to how to offset a UTC time
 * @param {Boolean} params.endShifts - whether or not to end all shifts for the market before creating a new one
 * @param {String} loginUser logged-in test user to assign to a shift, refers to the loginUser.json fixture
 */
Cypress.Commands.add(
  'createShiftsIfNotExist',
  ({ shifts, market, endShiftsFirst, loginUser } = {}) => {
    Cypress.log({
      name: 'createShiftIfNotExist',
    });

    createShiftsIfNotExist({ shifts, market, endShiftsFirst, loginUser });
  }
);

/** API command that ends all shifts for a given market
 * @param {Number} marketId id of the market all shifts will be ended for
 */
Cypress.Commands.add('endAllShifts', ({ id } = {}) => {
  Cypress.log({
    name: 'endAllShifts',
  });

  endAllShifts({ id });
});

/** CARE REQUESTS */
/** API command that creates a shift, assigns it, and updates the care request status to en route
 * @param {CareRequests.AssignmentInfo} params - function params
 * @param {Object} params.assignmentInfo - specific care request, shift, and market to use for assignmetn
 * @param {Array<Shifts.Shift>} params.assignmentInfo.shifts - shift data to create and use for assignment
 * @param {Markets.Market} params.assignmentInfo.market market to assign a care request to
 * @param {Boolean} params.assignmentInfo.endShiftsFirst - whether or not to end all previous shifts before creating new ones
 * @param {Boolean} params.assignmentInfo.assignVirtual - whether or not to assign the care request to a virtual shift
 * @param {Id} params.crId id of the care request to assign and set en route
 * @param {String} params.loginUser logged-in test user to assign to a shift, refers to the loginUser.json fixture
 */
Cypress.Commands.add(
  'setupCareRequestAssignment',
  ({ assignmentInfo }: Assignment.AssignmentInfo) => {
    Cypress.log({
      name: 'setupCareRequestAssignment',
    });

    const {
      shifts,
      market = MARKETS.denver,
      loginUser = 'admin',
      endShiftsFirst,
      crId,
      assignVirtual = false,
    } = assignmentInfo;

    cy.createShiftsIfNotExist({
      shifts,
      market,
      endShiftsFirst,
      loginUser,
    }).then((shiftId) => {
      const assignTomorrow = shifts[shifts.length - 1]?.isTomorrow || false;
      cy.assignCareRequest({
        id: crId,
        shiftId,
        assignTomorrow,
        assignVirtual,
      });
    });
  }
);

/** API command that recursively archives open care requests. Used primarily to clean up queues for specific queue tests
 * @param {CareRequests.Statuses & CareRequests.MarketIDs} params - function params
 * @param {Array<CARE_REQUEST_STATUSES>} params.statuses list of statuses to include in the cleanup, uses the CARE_REQUEST_STATUSES data object
 * @param {Array<CareRequests.MarketIDs>} params.marketId id of the market(s) whose care requests will be cleaned up
 */
Cypress.Commands.add(
  'archiveOpenCareRequests',
  ({ statuses, marketIds } = {}) => {
    Cypress.log({
      name: 'archiveOpenCareRequests',
    });

    archiveOpenCareRequests({ statuses, marketIds });
  }
);

/** API command that archives a care requests. Used primarily to clean up a care request after a test finishes
 * @param {Id} id - care request id to use
 */
Cypress.Commands.add('archiveCareRequest', ({ id }) => {
  Cypress.log({
    name: 'archiveCareRequest',
  });

  archiveCareRequest({ id });
});

/** API command that assigns a care request to a specific shift
 *  @param {CareRequests.AssignCareRequest} params - function params
 *  @param {Number} params.id care request id to use
 *  @param {Number} params.shiftId shift id to use
 *  @param {Boolean} params.assignTomorrow whether or not to assign the care request today vs tomorrow
 *  @param {Boolean} params.assignVirtual - whether or not to assign the care request to a virtual shift or not
 */
Cypress.Commands.add(
  'assignCareRequest',
  ({ id, shiftId, assignTomorrow, assignVirtual } = {}) => {
    Cypress.log({
      name: 'assignCareRequest',
    });

    assignCareRequest({
      id,
      shiftId,
      assignTomorrow,
      assignVirtual,
    });
  }
);

/** API command that updates a care request to the en route status
 *  @param {CareRequests.CareRequestId & CareRequests.Status} params - function params
 *  @param {Id} params.id care request id to use
 *  @param {CARE_REQUEST_STATUSES} params.status care request status to use ex: on_route, on_scene
 *  @param {ShiftTeamId} params.shiftTeamId shift team id to use

 */
Cypress.Commands.add(
  'updateCareRequestStatus',
  ({ id, status, shiftTeamId } = {}) => {
    Cypress.log({
      name: 'updateCareRequestStatus',
    });

    updateCareRequestStatus({ id, status, shiftTeamId });
  }
);

/** MARKETS */
/** API command that fetches the raw html admin page of the given market
 *  @param {string} id id of the market admin page to fetch
 */
Cypress.Commands.add('getMarketAdminPage', (id) => {
  Cypress.log({
    name: 'getMarketAdminPage',
  });

  getMarketAdminPage(id);
});

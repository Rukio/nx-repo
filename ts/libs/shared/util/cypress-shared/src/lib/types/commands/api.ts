import { Assignment } from '../api/assignment';
import {
  CareRequests,
  UpdateCareRequestStatusParams,
} from '../api/careRequests';
import { Markets } from '../api/markets';
import { Shifts } from '../api/shifts';
import { Users } from '../api/users';
import { Vehicles } from '../api/vehicles';

/* eslint-disable @typescript-eslint/no-unused-vars */
declare global {
  namespace Cypress {
    interface Chainable<Subject> {
      /**
       * Custom command that creates a suite of test vehicles if they currently don't exist in the given environment
       * @example cy.createVehiclesIfNotExist({ market: SUPPORTED_TEST_MARKETS.denver, count: 2 })
       */
      createVehiclesIfNotExist(
        params: Vehicles.CreateVehicle
      ): Cypress.Chainable<void>;

      /**
       * Custom command that updates a vehicle's geo location, used particularly for the LV1 BE service and Rover testing
       * @example cy.updateVehicleGeoLocation( { id: myVehicleId, currentLat: TEST_MARKET.careRequestAddress.latitude, currentLong: TEST_MARKET.careRequestAddress.longitude })
       */
      updateVehicleGeoLocation(
        params: Vehicles.UpdateGeoLocation
      ): Cypress.Chainable<void>;

      /**
       * Custom command that returns the current logged-in user data
       * @example cy.getCurrentUser().then((user) => {})
       */
      getCurrentUser(): Cypress.Chainable<Users.User>;

      /**
       * Custom command that creates a suite of test users if they currently don't exist in the given environment
       * @example cy.createTestUsersIfNotExist({ market: SUPPORTED_TEST_MARKETS.denver, shifts: [{ isVirtual: true }, { isSelfShift: true}], loginUser: 'admin'})
       */
      createTestUsersIfNotExist(
        params: Users.CreateTestUsers
      ): Cypress.Chainable<void>;

      /**
       * Custom command that creates a suite of test vehicles and users if they currently don't exist in the given environment
       * @example cy.createShiftDataIfNotExist({ market: SUPPORTED_TEST_MARKETS.denver, shifts: [{ isVirtual: true }, { isSelfShift: true}], loginUser: 'admin'})
       */
      createShiftDataIfNotExist(
        params: Shifts.CreateShifts
      ): Cypress.Chainable<void>;

      /**
       * Custom command that creates a shift if it currenty doesn't exist in the given environment
       * @example cy.createShiftsIfNotExist({ shifts: [{ shiftType: SHIFT_TYPES.acute_care, isVirtual: true }], market: SUPPORTED_TEST_MARKETS.denver, endShiftsFirst: true, loginUser: 'admin' })
       */
      createShiftsIfNotExist(
        params: Shifts.CreateShifts
      ): Cypress.Chainable<string | number>;

      /**
       * Custom command that ends all shifts for a given market
       * @example cy.endAllShifts({ id: TEST_MARKET.id })
       */
      endAllShifts(params: Markets.MarketId): Cypress.Chainable<void>;

      /**
       * Custom command that creates a shift, assigns it, and updates the care request status to en route
       * @example cy.setupCareRequestAssignment({ assignmentInfo: { market: TEST_MARKET.columbus, shifts: [{ shifType: SHIFT_TYPES.acute_care }], crId: myCareRequestId, loginUser: 'admin' }})
       */
      setupCareRequestAssignment(
        params: Assignment.AssignmentInfo
      ): Cypress.Chainable<void>;

      /**
       * Custom command that recursively archives open care requests. Used primarily to clean up queues for specific queue tests
       * @example cy.archiveOpenCareRequests({ statuses: ['on_scene', 'accepted'], marketIds: `${SUPPORTED_TEST_MARKETS.portland.id},${SUPPORTED_TEST_MARKETS.denver.id}` })
       */
      archiveOpenCareRequests(
        params: CareRequests.Statuses & CareRequests.MarketIDs
      ): Cypress.Chainable<void>;

      /**
       * Custom command that archives a care requests. Used primarily to clean up a care request after a test finishes
       * @example cy.archiveCareRequest({id: myCareRequestId })
       */
      archiveCareRequest(
        params: CareRequests.CareRequestId
      ): Cypress.Chainable<void>;

      /**
       * Custom command that assigns a care request to a specific shift
       * @example cy.assignCareRequest({ id: myCareRequestId, shiftId: myShiftId, assignTomorrow: false, assignVirtual: true })
       */
      assignCareRequest(
        params: Assignment.AssignCareRequest
      ): Cypress.Chainable<void>;

      /**
       * Custom command that updates a care request to the en route status
       * @example cy.updateCareRequestStatus({ id: myCareRequestId, status: 'on_route' })
       */
      updateCareRequestStatus(
        params: UpdateCareRequestStatusParams
      ): Cypress.Chainable<void>;

      /**
       * Custom command that fetches the HTML page of the given market
       * @example cy.getMarketAdminPage(myMarketId)
       */
      getMarketAdminPage(
        id: string
      ): Cypress.Chainable<Cypress.Response<string>>;
    }
  }
}

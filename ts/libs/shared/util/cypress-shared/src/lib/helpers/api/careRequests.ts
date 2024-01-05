import { Assignment } from '../../types/api/assignment';
import {
  CareRequests,
  CARE_REQUEST_STATUS,
  UpdateCareRequestStatusParams,
} from '../../types/api/careRequests';
import { DATE_TIME_FORMATS, format, increment } from '../utils/dateTime';
import { sendGETRequest, sendPATCHRequest, sendPOSTRequest } from './request';

const ASSIGNED_REASON_BODY = {
  reason_text: 'Car Trouble',
  reason_text_other: '',
};

// TODO(AUTO-212): Replace hard-coded market_ids list with an env var or dynamically generated list
const MARKET_ID_LIST =
  '159,160,161,162,163,164,165,166,167,168,169,170,171,172,173,174,175,176,177,178,179,180,181,182,183,184,185,186,187,188';
const CARE_REQUEST_STATUSES: Record<CARE_REQUEST_STATUS, CARE_REQUEST_STATUS> =
  {
    requested: 'requested',
    accepted: 'accepted',
    committed: 'committed',
    on_route: 'on_route',
    virtual_app_assigned: 'virtual_app_assigned',
    on_scene: 'on_scene',
  };

function getRequestedCareRequests({
  page,
  marketIds = MARKET_ID_LIST,
}: CareRequests.GetCareRequests): Cypress.Chainable<
  Cypress.Response<Array<CareRequests.CareRequestId>>
> {
  return sendGETRequest({
    url: 'api/care_requests/requested',
    form: true,
    qs: {
      page: page.toString(),
      market_ids: marketIds,
      selected_filters: 'need_onboarding,need_screening,assignable',
    },
  });
}

function getAllRequestedCareRequests({
  lastPage,
  requestList = [],
  currentPage = 1,
  marketIds,
}: CareRequests.GetAllCareRequests): Cypress.Chainable<
  Array<CareRequests.CareRequestId>
> {
  if (lastPage) {
    return cy.wrap(requestList);
  }

  return getRequestedCareRequests({ page: currentPage, marketIds }).then(
    ({
      body,
      headers,
    }: Cypress.Response<Array<CareRequests.CareRequestId>>) => {
      return getAllRequestedCareRequests({
        lastPage: JSON.parse(headers['x-pagination'].toString())?.last_page,
        requestList: requestList.concat(body),
        currentPage: currentPage + 1,
        marketIds,
      });
    }
  );
}

function getAssignedCareRequests({
  page,
  marketIds = MARKET_ID_LIST,
}: CareRequests.GetCareRequests): Cypress.Chainable<
  Cypress.Response<Array<CareRequests.CareRequestId>>
> {
  return sendGETRequest({
    url: 'api/care_requests/accepted',
    form: true,
    qs: {
      page: page.toString(),
      market_ids: marketIds,
      selected_filters: 'accepted_all,ac_candidates,submitted_for_review',
    },
  });
}

function getAllAssignedCareRequests({
  lastPage,
  requestList = [],
  currentPage = 1,
  marketIds,
}: CareRequests.GetAllCareRequests): Cypress.Chainable<
  Array<CareRequests.CareRequestId>
> {
  if (lastPage) {
    return cy.wrap(requestList);
  }

  return getAssignedCareRequests({ page: currentPage, marketIds }).then(
    ({
      body,
      headers,
    }: Cypress.Response<Array<CareRequests.CareRequestId>>) => {
      return getAllAssignedCareRequests({
        lastPage: JSON.parse(headers['x-pagination'].toString())?.last_page,
        requestList: requestList.concat(body),
        currentPage: currentPage + 1,
        marketIds,
      });
    }
  );
}

function archiveCareRequest({ id }: CareRequests.CareRequestId) {
  if (id) {
    sendPATCHRequest({
      url: `/api/care_requests/${id}/update_status`,
      form: true,
      body: {
        request_status: 'archived',
        comment: 'Other: Automation Test',
      },
    });
  }
}

function archiveOpenCareRequests({
  statuses,
  marketIds,
}: CareRequests.Statuses & CareRequests.MarketIDs) {
  statuses.forEach((status) => {
    switch (status) {
      case CARE_REQUEST_STATUSES.requested:
        getAllRequestedCareRequests({ marketIds }).then(
          (requestedCareRequests: Array<CareRequests.CareRequestId>) => {
            requestedCareRequests.forEach(({ id }) => {
              archiveCareRequest({ id });
            });
          }
        );
        break;
      case CARE_REQUEST_STATUSES.accepted:
        getAllAssignedCareRequests({ marketIds }).then(
          (assignedCareRequests: Array<CareRequests.CareRequestId>) => {
            assignedCareRequests.forEach(({ id }) => {
              archiveCareRequest({ id });
            });
          }
        );
        break;
      default:
        cy.log(
          'Unsupported status for archiving, contact EngProd for updates if needed'
        );
    }
  });
}

function createCareRequestETARange({
  id,
  days = 0,
}: CareRequests.CareRequestId & CareRequests.Days) {
  const startTime = format({
    dateTime: increment({
      dateTime: new Date(),
      duration: { days },
    }),
  });
  const endTime = format({
    dateTime: increment({
      dateTime: new Date(),
      duration: { days, hours: 4 },
    }),
  });

  return sendPOSTRequest({
    url: `api/care_requests/${id}/eta_ranges.json`,
    body: {
      eta_range: {
        starts_at: startTime,
        ends_at: endTime,
      },
    },
  });
}

function assignVirtualCareTeam({ id }: CareRequests.CareRequestId) {
  return sendPATCHRequest({
    url: `api/care_requests/${id}/assign_virtual_app`,
  });
}

function assignCareTeam({
  id,
  shiftId,
  assignTomorrow,
}: Assignment.AssignCareRequest) {
  const assignmentDate = assignTomorrow
    ? format({
        dateTime: increment({
          dateTime: new Date(),
          duration: { days: 1 },
        }),
        dateTimeFormat: DATE_TIME_FORMATS.YEAR_MONTH_DAY,
      })
    : format({
        dateTime: new Date(),
        dateTimeFormat: DATE_TIME_FORMATS.YEAR_MONTH_DAY,
      });
  const careRequest = {
    ...Cypress._.cloneDeep(ASSIGNED_REASON_BODY),
    assignment_date: assignmentDate,
    shift_team_id: shiftId,
    care_request: {
      id,
    },
  };

  return sendPATCHRequest({
    url: `api/care_requests/${id}/assign_team.json`,
    form: true,
    body: careRequest,
  });
}

function assignCareRequest({
  id,
  shiftId,
  assignTomorrow,
  assignVirtual,
}: Assignment.AssignCareRequest) {
  const days = assignTomorrow ? 1 : 0;

  return createCareRequestETARange({ id, days }).then(() => {
    assignCareTeam({ id, shiftId, assignTomorrow }).then(() => {
      if (assignVirtual) {
        assignVirtualCareTeam({ id });
      }
    });
  });
}

function updateCareRequestStatus({
  id,
  status,
  shiftTeamId,
}: UpdateCareRequestStatusParams) {
  return sendPATCHRequest({
    url: `api/care_requests/${id}/update_status`,
    form: true,
    body: { request_status: status, meta_data: { shift_team_id: shiftTeamId } },
  });
}

export {
  archiveOpenCareRequests,
  archiveCareRequest,
  assignCareRequest,
  updateCareRequestStatus,
  CARE_REQUEST_STATUSES,
};

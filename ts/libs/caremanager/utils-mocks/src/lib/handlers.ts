import { rest } from 'msw';
import mockAddresses from './data/addresses.json';
import mockDelete from './data/common/delete.json';
import mockConfig from './data/config.json';
import mockEpisode from './data/episode/episode.json';
import mockEpisodesPage1 from './data/episodes/episodesPage1.json';
import mockEpisodesPage2 from './data/episodes/episodesPage2.json';
import mockEpisodesPage3 from './data/episodes/episodesPage3.json';
import mockNoEpisodes from './data/episodes/noEpisodes.json';
import mockSearchQueryEpisode from './data/episodes/searchQueryEpisode.json';
import mockExternalCareProvider from './data/externalCareProviders/externalCareProvider.json';
import mockInsurance from './data/insurances/insurance.json';
import mockMedicalDecisionMaker from './data/medicalDecisionMakers/medicalDecisionMaker.json';
import mockNote from './data/note/note.json';
import mockPinnedNote from './data/note/pinnedNote.json';
import createdPatient from './data/patients/createdPatient.json';
import mockPatients from './data/patients/patients.json';
import mockPharmacy from './data/pharmacies/pharmacy.json';
import mockProviderTypes from './data/providerTypes/providerTypes.json';
import mockServiceRequests from './data/serviceRequests/serviceRequests.json';
import mockServiceRequestStatus from './data/serviceRequests/status.json';
import newTaskResponse from './data/task/newTaskResponse.json';
import mockTask from './data/task/task.json';
import mockTaskTemplateDetails from './data/taskTemplates/taskTemplateDetails.json';
import mockTaskTemplateList1 from './data/taskTemplates/taskTemplateList1.json';
import mockTaskTemplateList2 from './data/taskTemplates/taskTemplateList2.json';
import mockTaskTemplateListEmpty from './data/taskTemplates/taskTemplateListEmpty.json';
import mockTaskTemplateListFiltered from './data/taskTemplates/taskTemplateListFiltered.json';
import mockUsers from './data/users/users.json';
import mockCanScheduleVisit from './data/visits/canScheduleVisit.json';
import mockDuplicateEpisodeLatestVisit from './data/visits/duplicateEpisodeLatestVisit.json';
import mockEpisodeVisits from './data/visits/episodeVisits.json';
import mockVisit from './data/visits/visit.json';
import mockVisitAvailability from './data/visits/visitAvailability.json';
import mockVisitSummary from './data/visits/visitSummary.json';
import mockVisitTypes from './data/visits/visitTypes.json';
import mockVirtualAppVisits from './data/virtualVisits/virtualAppVisits.json';

export const handlers = [
  rest.get('/v1/config', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockConfig))
  ),

  rest.get('/v1/patients', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockPatients))
  ),

  rest.post('/v1/patients', (_, res, ctx) =>
    res(ctx.status(201), ctx.json({ patient: createdPatient }))
  ),

  rest.patch('/v1/patients/:id', async (req, res, ctx) => {
    const reqBody = await req.json();

    return res(
      ctx.status(200),
      ctx.json({ patient: { ...createdPatient, ...reqBody } })
    );
  }),

  rest.post('/v1/episodes', (_, res, ctx) =>
    res(ctx.status(201), ctx.json(mockEpisode))
  ),

  rest.get('/v1/episodes', (req, res, ctx) => {
    let mockToReturn: Record<string, unknown>;
    let status = 200;
    const search = req.url.searchParams.get('patient_name');
    const isSearchQuery = !!search;

    if (isSearchQuery) {
      if (search === 'none') {
        mockToReturn = mockNoEpisodes;
      } else if (search === 'denied') {
        status = 403;
        mockToReturn = mockNoEpisodes;
      } else {
        mockToReturn = mockSearchQueryEpisode;
      }
    } else {
      const page = req.url.searchParams.get('page');

      switch (page) {
        case '1':
          mockToReturn = mockEpisodesPage1;
          break;
        case '2':
          mockToReturn = mockEpisodesPage2;
          break;
        case '3':
          mockToReturn = mockEpisodesPage3;
          break;
        default:
          mockToReturn = mockNoEpisodes;
      }
    }

    return res(ctx.status(status), ctx.json(mockToReturn));
  }),

  rest.get('/v1/episodes/:id', (_, res, ctx) =>
    res(ctx.status(201), ctx.json(mockEpisode))
  ),

  rest.patch('/v1/episodes/:id', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockEpisode))
  ),

  rest.post('/v1/episodes/:id/notes', async (req, res, ctx) => {
    const reqBody = await req.json();

    return res(
      ctx.status(201),
      ctx.json({
        note: {
          ...mockNote.note,
          ...reqBody.note,
          episode_id: req.params['id'],
        },
      })
    );
  }),

  rest.post('/v1/episodes/:id/tasks', (_, res, ctx) =>
    res(ctx.status(201), ctx.json(newTaskResponse))
  ),

  rest.get('/v1/episodes/:id/visits', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockEpisodeVisits))
  ),

  rest.post('/v1/episodes/:id/duplicate-latest-visit', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockDuplicateEpisodeLatestVisit))
  ),

  rest.patch('/v1/notes/:id', (_, res, ctx) =>
    res(ctx.status(201), ctx.json(mockNote))
  ),

  rest.post('/v1/notes/:id/pin', (_, res, ctx) =>
    res(ctx.status(201), ctx.json(mockPinnedNote))
  ),

  rest.post('/v1/notes/:id/unpin', (_, res, ctx) =>
    res(ctx.status(201), ctx.json(mockNote))
  ),

  rest.delete('/v1/notes/:id', (_, res, ctx) => res(ctx.status(201))),

  rest.patch('/v1/tasks/:id', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockTask))
  ),

  rest.get('/v1/task_templates', (req, res, ctx) => {
    const params = req.url.searchParams;
    const page = params.get('page');

    if (params.get('name') === 'none') {
      return res(ctx.status(200), ctx.json(mockTaskTemplateListEmpty));
    }

    if (params.has('care_phase_id') || params.has('service_line_id')) {
      return res(ctx.status(200), ctx.json(mockTaskTemplateListFiltered));
    }

    if (page === '1' || page === null) {
      return res(ctx.status(200), ctx.json(mockTaskTemplateList1));
    }

    return res(ctx.status(200), ctx.json(mockTaskTemplateList2));
  }),

  rest.delete('/v1/task_templates/:id', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockDelete))
  ),
  rest.post('/v1/task_templates', (_, res, ctx) =>
    res(ctx.status(201), ctx.json(mockTaskTemplateDetails))
  ),

  rest.get('/v1/task_templates/:id', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockTaskTemplateDetails))
  ),

  rest.patch('/v1/task_templates/:id', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockTaskTemplateDetails))
  ),

  rest.delete('/v1/tasks/:id', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockDelete))
  ),

  rest.get('/v1/users/by-id', (req, res, ctx) => {
    const ids = req.url.searchParams.getAll('user_ids');

    const filteredUsers = mockUsers.users.filter((u) => ids.includes(u.id));

    return res(ctx.status(200), ctx.json({ users: filteredUsers }));
  }),

  rest.post('/v1/users/search', async (req, res, ctx) => {
    const reqBody = await req.json();

    return res(
      ctx.status(200),
      ctx.json({
        users: mockUsers.users.filter(
          (u) =>
            u.first_name.includes(reqBody.search_term) ||
            u.last_name.includes(reqBody.search_term) ||
            u.email.includes(reqBody.search_term) ||
            u.middle_name?.includes(reqBody.search_term)
        ),
      })
    );
  }),

  rest.get('/v1/visits/virtual-app-queue', (req, res, ctx) => {
    const hasShiftTeamId = !!req.url.searchParams.get('shift_team_id');
    const hasMarketIds = !!req.url.searchParams.get('market_ids');

    if (hasShiftTeamId && hasMarketIds) {
      return res(ctx.status(200), ctx.json(mockVirtualAppVisits));
    }

    return res(ctx.status(200));
  }),

  rest.get('/v1/visits/:id', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockVisit))
  ),

  rest.patch('/v1/visits/:id', (_, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        visit: mockVisit.visit,
      })
    )
  ),

  rest.post('/v1/visits/:id/summary', async (req, res, ctx) => {
    const reqBody = await req.json();

    return res(
      ctx.status(200),
      ctx.json({
        summary: {
          ...mockVisitSummary.summary,
          visit_id: req.params['id'],
          body: reqBody.body,
        },
      })
    );
  }),

  rest.patch('/v1/visits/:id/summary', async (req, res, ctx) => {
    const reqBody = await req.json();

    return res(
      ctx.status(200),
      ctx.json({
        summary: {
          ...mockVisitSummary.summary,
          visit_id: req.params['id'],
          body: reqBody.body,
        },
      })
    );
  }),

  rest.get('/v1/visit_types', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockVisitTypes))
  ),

  rest.get('/v1/patients/:patientId', (_, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        patient: mockPatients.patients[0],
        insurances: [mockInsurance],
        medical_decision_makers: [mockMedicalDecisionMaker],
        pharmacies: [mockPharmacy],
        external_care_providers: [mockExternalCareProvider],
      })
    )
  ),

  rest.get('/v1/addresses/by-id', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockAddresses))
  ),

  rest.patch('/v1/visits/:id/status', (_, res, ctx) => {
    const updatedVisit = {
      visit: { ...mockVisit.visit, status: 'on_route' },
    };

    return res(ctx.status(200), ctx.json(updatedVisit));
  }),

  rest.get('/v1/provider-types', (_, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        provider_types: [{ id: '789', name: 'Other' }, ...mockProviderTypes],
      })
    )
  ),

  rest.patch('/v1/insurances/:id', async (req, res, ctx) => {
    const reqBody = await req.json();

    return res(
      ctx.status(200),
      ctx.json({
        insurance: {
          ...mockInsurance,
          ...reqBody,
        },
        patient_insurances: [
          {
            ...mockInsurance,
            ...reqBody,
          },
        ],
      })
    );
  }),

  rest.post('/v1/insurances', async (req, res, ctx) => {
    const reqBody = await req.json();

    return res(
      ctx.status(200),
      ctx.json({
        insurance: {
          ...mockInsurance,
          ...reqBody,
        },
        patient_insurances: [
          mockInsurance,
          {
            ...mockInsurance,
            ...reqBody,
          },
        ],
      })
    );
  }),

  rest.post('/v1/pharmacies', async (req, res, ctx) => {
    const reqBody = await req.json();

    return res(
      ctx.status(201),
      ctx.json({
        pharmacy: {
          ...mockPharmacy,
          ...reqBody,
        },
        patient_pharmacies: [
          mockPharmacy,
          {
            ...mockPharmacy,
            ...reqBody,
          },
        ],
      })
    );
  }),

  rest.patch('/v1/pharmacies/:id', async (req, res, ctx) => {
    const reqBody = await req.json();

    return res(
      ctx.status(200),
      ctx.json({
        pharmacy: {
          ...mockPharmacy,
          ...reqBody,
        },
        patient_pharmacies: [
          {
            ...mockPharmacy,
            ...reqBody,
          },
        ],
      })
    );
  }),

  rest.post('/v1/medical-decision-makers', (_, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        medical_decision_maker: mockMedicalDecisionMaker,
        patient_medical_decision_makers: [mockMedicalDecisionMaker],
      })
    )
  ),

  rest.patch('/v1/medical-decision-makers/:id', async (req, res, ctx) => {
    const reqBody = await req.json();

    return res(
      ctx.status(200),
      ctx.json({
        medical_decision_maker: {
          ...mockMedicalDecisionMaker,
          ...reqBody,
        },
        patient_medical_decision_makers: [
          {
            ...mockMedicalDecisionMaker,
            ...reqBody,
          },
        ],
      })
    );
  }),

  rest.delete('/v1/insurances/:id', (_, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        patient_insurances: [],
      })
    )
  ),

  rest.patch('/v1/external-care-providers/:id', async (req, res, ctx) => {
    const reqBody = await req.json();

    return res(
      ctx.status(200),
      ctx.json({
        external_care_provider: {
          ...mockExternalCareProvider,
          ...reqBody,
        },
        patient_external_care_providers: [
          {
            ...mockExternalCareProvider,
            ...reqBody,
          },
        ],
      })
    );
  }),

  rest.post('/v1/external-care-providers', async (req, res, ctx) => {
    const reqBody = await req.json();

    return res(
      ctx.status(200),
      ctx.json({
        external_care_provider: {
          ...mockExternalCareProvider,
          ...reqBody,
        },
        patient_external_care_providers: [
          mockExternalCareProvider,
          {
            ...mockExternalCareProvider,
            ...reqBody,
          },
        ],
      })
    );
  }),

  rest.delete('/v1/external-care-providers/:id', (_, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        patient_external_care_providers: [],
      })
    )
  ),

  rest.post('/v1/visits/call', async (req, res, ctx) => {
    const reqJson = await req.json();

    return res(
      ctx.status(201),
      ctx.json({
        visit: { ...mockVisit.visit, type_id: reqJson.visit_type_id },
        summary: {
          ...mockVisitSummary.summary,
          body: reqJson.summary,
        },
      })
    );
  }),

  rest.patch('/v1/visits/call/:id', (_, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({
        visit: { ...mockVisit.visit, type_id: 'Transition Call' },
        summary: {
          ...mockVisitSummary.summary,
          body: 'new summary for this call visit',
        },
      })
    )
  ),

  rest.post('/v1/can-schedule-visit', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockCanScheduleVisit))
  ),

  rest.post('/v1/visit-availability', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockVisitAvailability))
  ),

  rest.post('/v1/schedule-visit', (_, res, ctx) =>
    res(ctx.status(200), ctx.json({}))
  ),

  rest.patch('/v1/cancel-visit', (_, res, ctx) =>
    res(ctx.status(200), ctx.json({}))
  ),

  rest.get('/v1/service-request-status', (_, res, ctx) =>
    res(ctx.status(200), ctx.json(mockServiceRequestStatus))
  ),

  rest.get('/v1/service-requests', (req, res, ctx) => {
    let response = mockServiceRequests;

    const statusIds = req.url.searchParams.getAll('status_ids');
    if (statusIds.length) {
      response = {
        ...response,
        service_requests: response.service_requests.filter((sr) =>
          statusIds.includes(sr.service_request.status_id)
        ),
      };
    }

    const marketIds = req.url.searchParams.getAll('market_ids');
    if (marketIds.length) {
      response = {
        ...response,
        service_requests: response.service_requests.filter((sr) =>
          marketIds.includes(sr.service_request.market_id)
        ),
      };
    }

    const searchTerm = req.url.searchParams.get('search_term');
    if (searchTerm?.trim()) {
      response = {
        ...response,
        service_requests: response.service_requests.filter(
          (sr) =>
            `${sr.station_patient.first_name} ${sr.station_patient.last_name}`
              .toLowerCase()
              .includes(searchTerm.toLowerCase()) ||
            sr.station_care_request.chief_complaint
              .toLocaleLowerCase()
              .includes(searchTerm.toLowerCase())
        ),
      };
    }

    return res(
      ctx.status(200),
      ctx.json({
        ...response,
        meta: {
          ...response.meta,
          total_results: response.service_requests.length,
        },
      })
    );
  }),

  rest.patch('/v1/service-requests/:id', async (req, res, ctx) => {
    const serviceRequest = mockServiceRequests.service_requests.find(
      (v) => v.service_request.id === req.params['id']
    )?.service_request;

    const body = await req.json();
    const updatedServiceRequest = {
      ...serviceRequest,
      status_id: body.status_id ?? serviceRequest?.status_id,
      is_insurance_verified:
        body.is_insurance_verified ?? serviceRequest?.is_insurance_verified,
      cms_number: body.cms_number ?? serviceRequest?.cms_number,
      assigned_user_id:
        body.assigned_user_id ?? serviceRequest?.assigned_user_id,
    };

    if (body.cms_number) {
      updatedServiceRequest.is_insurance_verified = true;
    }

    return res(
      ctx.status(200),
      ctx.json({
        service_request: updatedServiceRequest,
      })
    );
  }),

  rest.get('v1/service-requests/:id', (req, res, ctx) => {
    const serviceRequestResponse = mockServiceRequests.service_requests.find(
      (v) => v.service_request.id === req.params['id']
    );

    return res(ctx.status(200), ctx.json(serviceRequestResponse));
  }),

  rest.patch('/v1/service-requests/:id/unassign-owner', (req, res, ctx) => {
    const serviceRequest = mockServiceRequests.service_requests.find(
      (v) => v.service_request.id === req.params['id']
    )?.service_request;

    return res(
      ctx.status(200),
      ctx.json({
        service_request: {
          ...serviceRequest,
          assigned_user_id: undefined,
          updated_at: new Date().toISOString(),
          updated_by_user_id: '1',
        },
      })
    );
  }),

  rest.post('/v1/service-requests/:id/reject', async (req, res, ctx) => {
    const serviceRequest = mockServiceRequests.service_requests.find(
      (v) => v.service_request.id === req.params['id']
    )?.service_request;
    const reqBody = await req.json();

    return res(
      ctx.status(200),
      ctx.json({
        service_request: {
          ...serviceRequest,
          reject_reason: reqBody.reject_reason,
        },
      })
    );
  }),

  rest.get('v1/service-requests/:id', (req, res, ctx) => {
    const serviceRequest = mockServiceRequests.service_requests.find(
      (v) => v.service_request.id === req.params['id']
    )?.service_request;

    return res(
      ctx.status(200),
      ctx.json({
        service_request: {
          ...serviceRequest,
        },
      })
    );
  }),

  rest.get('/v1/service-requests/:id/notes', (_, res, ctx) =>
    res(
      ctx.status(200),
      ctx.json({ notes: [mockNote.note, { ...mockNote.note, id: '2' }] })
    )
  ),
];

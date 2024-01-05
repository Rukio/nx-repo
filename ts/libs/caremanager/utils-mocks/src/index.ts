import addresses from './lib/data/addresses.json';
import stationCareRequest from './lib/data/careRequests/stationCareRequest.json';
import config from './lib/data/config.json';
import episode from './lib/data/episode/episode.json';
import episodesPage1 from './lib/data/episodes/episodesPage1.json';
import externalCareProvider from './lib/data/externalCareProviders/externalCareProvider.json';
import insurance from './lib/data/insurances/insurance.json';
import medicalDecisionMaker from './lib/data/medicalDecisionMakers/medicalDecisionMaker.json';
import note from './lib/data/note/note.json';
import createdPatient from './lib/data/patients/createdPatient.json';
import patients from './lib/data/patients/patients.json';
import stationPatient from './lib/data/patients/stationPatient.json';
import pharmacy from './lib/data/pharmacies/pharmacy.json';
import serviceRequest from './lib/data/serviceRequests/serviceRequest.json';
import serviceRequests from './lib/data/serviceRequests/serviceRequests.json';
import serviceRequestStatus from './lib/data/serviceRequests/status.json';
import taskTemplateList1 from './lib/data/taskTemplates/taskTemplateList1.json';
import users from './lib/data/users/users.json';
import canScheduleVisit from './lib/data/visits/canScheduleVisit.json';
import duplicateEpisodeLatestVisit from './lib/data/visits/duplicateEpisodeLatestVisit.json';
import episodeVisits from './lib/data/visits/episodeVisits.json';
import visit from './lib/data/visits/visit.json';
import visitAvailability from './lib/data/visits/visitAvailability.json';
import visitSummary from './lib/data/visits/visitSummary.json';
import visitTypes from './lib/data/visits/visitTypes.json';
import virtualAppVisits from './lib/data/virtualVisits/virtualAppVisits.json';

export const JSONMocks = {
  addresses,
  canScheduleVisit,
  config,
  createdPatient,
  duplicateEpisodeLatestVisit,
  episode,
  episodesPage1,
  episodeVisits,
  externalCareProvider,
  insurance,
  medicalDecisionMaker,
  note,
  patients,
  pharmacy,
  serviceRequest,
  serviceRequests,
  serviceRequestStatus,
  stationCareRequest,
  stationPatient,
  taskTemplateList1,
  users,
  visit,
  visitAvailability,
  visitSummary,
  visitTypes,
  virtualAppVisits,
};

export * from './lib/browser';
export * from './lib/gates';
export * from './lib/handlers';

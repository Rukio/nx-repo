import { sendGETRequest, sendPOSTRequest } from './request';

const EPISODE_BODY = {
  care_phase_id: 2,
  market_id: 198,
  patient_id: 1,
  patient_summary: 'Life is a Simulation.',
  service_line_id: 1,
  apply_template_ids: [],
};

function getEpisode(episodeId: string) {
  return sendGETRequest({
    url: `${Cypress.env('API_URL')}/v1/episodes/${episodeId}`,
    headers: { authorization: `Bearer ${Cypress.env('token')}` },
  }).then((getEpisodeResp) => {
    return getEpisodeResp.body;
  });
}

function createEpisode() {
  cy.log(Cypress.env('API_URL'));

  return sendPOSTRequest({
    url: `${Cypress.env('API_URL')}/v1/episodes`,
    headers: { authorization: `Bearer ${Cypress.env('token')}` },
    body: EPISODE_BODY,
  }).then((createEpisodeResp) => {
    Cypress.env('currentEpisodeId', createEpisodeResp.body.episode.id);

    return createEpisodeResp.body;
  });
}

export { getEpisode, createEpisode };

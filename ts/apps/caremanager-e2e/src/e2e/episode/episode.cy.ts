import { el } from '@*company-data-covered*/cypress-shared';
import {
  SNACKBAR_MESSAGES,
  getShortDateDescription,
} from '@*company-data-covered*/caremanager/utils';
import {
  getListItem,
  interceptGETConfigData,
  interceptPATCHEpisodeDetails,
  isSnackbarVisible,
  navigateCareManagerTo,
} from '@*company-data-covered*/caremanager/utils-e2e';

type FilterOption = {
  id: number;
  name: string;
};

const EDIT_EPISODE_MODAL_DIALOG = 'edit-episode-modal-dialog';
const EDIT_EPISODE_MODAL_ADMITTED_AT_INPUT =
  'edit-episode-modal-admitted-at-date';
const EDIT_EPISODE_MODAL_IS_WAIVER_TOGGLE =
  'edit-episode-modal-is-waiver-toggle';
const EDIT_EPISODE_MODAL_MARKET_INPUT = 'edit-episode-modal-market-select';
const EDIT_EPISODE_MODAL_CARE_PHASE_INPUT =
  'edit-episode-modal-care-phase-select';
const EDIT_EPISODE_MODAL_SAVE_BUTTON = 'edit-episode-modal-save-button';
const EPISODE_SUMMARY_EDIT_BUTTON = 'episode-summary-edit-button';
const EPISODE_SUMMARY_TEXT_AREA = 'episode-summary-text-area';
const EDIT_SUMMARY_SAVE_BUTTON = 'edit-summary-save-button';
const EPISODE_SUMMARY_BODY = 'episode-summary-body';

const getEditEpisodeDetailsButton = (id: string) =>
  `edit-episode-details-episode-button-${id}`;

const getPatientCareLineLabel = (id: string) => `patient-care-line-label-${id}`;

const getPatientCareDays = (id: string) => `care-days-label-${id}`;

const isWaiverToggle = () => {
  el(EDIT_EPISODE_MODAL_IS_WAIVER_TOGGLE).children().isUnchecked();
  el(EDIT_EPISODE_MODAL_IS_WAIVER_TOGGLE).click();
  el(EDIT_EPISODE_MODAL_IS_WAIVER_TOGGLE).children().isChecked();
};

const getDateString = (date: Date) => {
  const month =
    date.getMonth() + 1 < 10 ? `0${date.getMonth() + 1}` : date.getMonth() + 1;

  return `${month}/${date.getDate()}/${date.getFullYear()}`;
};

const selectMarketFilter = (market: FilterOption) => {
  const { name } = market;
  el(getListItem('marketid', name)).click();
  el(EDIT_EPISODE_MODAL_MARKET_INPUT).hasText(name);
};

const selectCarePhaseFilter = (carePhase: FilterOption) => {
  const { name } = carePhase;
  el(getListItem('carephaseid', name)).click();
  el(EDIT_EPISODE_MODAL_CARE_PHASE_INPUT).hasText(name);
};

describe('Episode details', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    navigateCareManagerTo({ location: 'EPISODE_DETAILS', mockResp: false });
  });

  describe('Edit Episode Details', () => {
    beforeEach(() => {
      interceptGETConfigData();
    });

    it('should update the episode details', () => {
      cy.fixture('apiResp/episodeDetailsUpdate').then(({ episode }) => {
        const {
          id,
          service_line,
          care_phase,
          market,
          discharged_at,
          admitted_at,
        } = episode;
        const admittedAt = new Date(admitted_at);
        const admittedAtString = getDateString(admittedAt);
        el(getEditEpisodeDetailsButton(id)).click({ force: true });
        el(EDIT_EPISODE_MODAL_DIALOG).isVisible();

        el(EDIT_EPISODE_MODAL_ADMITTED_AT_INPUT)
          .find('input.MuiInputBase-input')
          .clear({ force: true })
          .type(admittedAtString, { force: true });
        isWaiverToggle();
        el(EDIT_EPISODE_MODAL_MARKET_INPUT).click();
        selectMarketFilter(market);
        el(EDIT_EPISODE_MODAL_CARE_PHASE_INPUT).click();
        selectCarePhaseFilter(care_phase);
        interceptPATCHEpisodeDetails();
        el(EDIT_EPISODE_MODAL_SAVE_BUTTON).click();

        const updatedPatientCareLineLabel = `${service_line.name}, ${care_phase.name}`;
        el(getPatientCareLineLabel(id)).hasText(updatedPatientCareLineLabel);
        el(getPatientCareDays(id)).hasText(
          `${getShortDateDescription(admittedAt)} - ${getShortDateDescription(
            new Date(discharged_at)
          )}`
        );
      });
    });
  });

  describe('Edit Episode Summary', () => {
    beforeEach(() => {
      el(EPISODE_SUMMARY_EDIT_BUTTON).click();
    });

    it('should update the episode summary', () => {
      cy.fixture('apiResp/episodeDetailsUpdate').then(({ episode }) => {
        const { patient_summary } = episode;
        el(EPISODE_SUMMARY_TEXT_AREA)
          .find('textarea')
          .eq(1)
          .clear({ force: true });
        el(EPISODE_SUMMARY_TEXT_AREA).type(patient_summary);
        interceptPATCHEpisodeDetails();
        el(EDIT_SUMMARY_SAVE_BUTTON).click();
        el(EPISODE_SUMMARY_BODY).hasText(patient_summary);
        isSnackbarVisible(SNACKBAR_MESSAGES.EDITED_EPISODE);
      });
    });
  });
});

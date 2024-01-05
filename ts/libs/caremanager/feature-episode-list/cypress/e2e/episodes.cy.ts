import { el } from '@*company-data-covered*/cypress-shared';
import {
  calculateAge,
  formattedDOB,
  sexStringToChar,
} from '@*company-data-covered*/caremanager/utils';
import {
  ACTIVE_CARE_PHASES,
  CARE_PHASE_ACTIVE_SUBHEADING,
  CARE_PHASE_DROPDOWN_LIST,
  CARE_PHASE_FILTER,
  CARE_PHASE_INACTIVE_SUBHEADING,
  CLEAR_ALL_BUTTON,
  CLEAR_FILTER_BUTTON,
  DONE_FILTER_BUTTON,
  EpisodeDetails,
  FILTERS_SECTION,
  INACTIVE_CARE_PHASES,
  INCOMPLETE_TASK_FILTER,
  MARKET_DROPDOWN_LIST,
  MARKET_FILTER,
  MARKET_LABEL_TEXT,
  MARKET_SEARCH_INPUT,
  SERVICE_LINE_DROPDOWN_LIST,
  SERVICE_LINE_FILTER,
  navigateCareManagerTo,
  patientDetailsCell,
  selectFilterOptions,
  validateHeader,
} from '@*company-data-covered*/caremanager/utils-e2e';

/* Selectors */
const EPISODES_SEARCH_INPUT = 'search-input';
const EPISODE_DETAILS_HEADER = 'episode-details-table-header';
const FILTERS_BY_TEXT = 'filter-by-text';
const INCOMPLETE_TASKS_TABLE_HEADER = 'incomplete-tasks-table-header';
const LATEST_NOTE_TABLE_HEADER = 'notes-table-header';
const LEFT_KEYBOARD_ARROW = 'KeyboardArrowLeftIcon';
const PATIENT_TABLE_HEADER = 'patient-table-header';
const RIGHT_KEYBOARD_ARROW = 'KeyboardArrowRightIcon';
const SUMMARY_TABLE_HEADER = 'summary-table-header';
const TABLE_PAGINATION_COUNT = 'table-pagination-count';

const dailyAndOnboardingCell = (id: number) =>
  `dailyAndOnboarding-task-cell-${id}`;
const episodeDetailsCell = (id: number) => `episode-details-cell-${id}`;
const mostRelevantNoteDetailsCell = (id: number) => `note-cell-${id}`;
const nurseNavigatorCell = (id: number) => `nurseNavigator-task-cell-${id}`;
const summaryDetailsCell = (id: number) => `summary-cell-${id}`;
const t1Cell = (id: number) => `t1-task-cell-${id}`;
const t2Cell = (id: number) => `t2-task-cell-${id}`;

/* Helpers */

const validateTableRow = (episodeRow: EpisodeDetails) => {
  const {
    id: episodeId,
    patient_summary: patientSummary,
    service_line: { name: serviceLine },
    care_phase: { name: carePhase },
    incomplete_tasks: { daily_and_onboarding, nurse_navigator, t1, t2 },
    patient,
    most_relevant_note,
  } = episodeRow;
  const {
    id,
    first_name,
    last_name,
    date_of_birth,
    sex,
    address_street,
    address_city,
    address_state,
    address_zipcode,
    phone_number,
  } = patient;
  const detailNotes = most_relevant_note ? most_relevant_note?.details : '';

  el(patientDetailsCell(id))
    .hasText(first_name)
    .hasText(last_name)
    .hasText(formattedDOB(date_of_birth))
    .hasText(`${calculateAge(date_of_birth)}yo ${sexStringToChar(sex)}`)
    .hasText(
      `${address_street} ${address_city}, ${address_state} ${address_zipcode}`
    )
    .hasText(phone_number);
  el(episodeDetailsCell(episodeId)).hasText(serviceLine).hasText(carePhase);
  el(summaryDetailsCell(episodeId)).hasText(patientSummary);
  el(dailyAndOnboardingCell(episodeId)).hasText(
    `Daily & Onboarding: ${daily_and_onboarding}`
  );
  el(nurseNavigatorCell(episodeId)).hasText(
    `Nurse Navigator: ${nurse_navigator}`
  );
  el(t1Cell(episodeId)).hasText(`T1: ${t1}`);
  el(t2Cell(episodeId)).hasText(`T2: ${t2}`);

  if (detailNotes) {
    el(mostRelevantNoteDetailsCell(episodeId)).hasText(detailNotes);
  }
};

const validateEpisodeTableHeaders = () => {
  el(PATIENT_TABLE_HEADER).hasText('Patient');
  el(EPISODE_DETAILS_HEADER).hasText('Episode Details');
  el(SUMMARY_TABLE_HEADER).hasText('Summary');
  el(LATEST_NOTE_TABLE_HEADER).hasText('Notes');
  el(INCOMPLETE_TASKS_TABLE_HEADER).hasText('Incomplete Tasks');
};

const validateEpisodeTableFooter = () => {
  return cy.fixture('apiResp/episodes').then(({ meta }) => {
    const { current_page, page_size, total_results } = meta;
    el(TABLE_PAGINATION_COUNT).hasText(
      `${current_page}-${page_size} of ${total_results}`
    );
    el(LEFT_KEYBOARD_ARROW).parent().isDisabled();
    el(RIGHT_KEYBOARD_ARROW).parent().isEnabled();
  });
};

const validateFilterSection = () => {
  el(FILTERS_BY_TEXT).hasText('Filter by');
  el(MARKET_FILTER).hasText('Markets');
  el(SERVICE_LINE_FILTER).hasText('Service Lines');
  el(CARE_PHASE_FILTER).hasText('Care Phases');
  el(INCOMPLETE_TASK_FILTER).hasText('Has Incomplete Task');
};

const carePhaseStatus = [
  'High Acuity',
  'Transition - High',
  'Transition - Low',
  'Closed',
  'Pending',
  'Discharged',
  'Active',
];

describe('Episode List', () => {
  before(() => {
    cy.login();
  });

  beforeEach(() => {
    navigateCareManagerTo({ location: 'CARE_MANAGER_MAIN' });
    el(FILTERS_SECTION).isVisible();
  });

  describe('Initial State', () => {
    it('should display the correct episodes information', () => {
      validateHeader();
      el(EPISODES_SEARCH_INPUT).hasPlaceholder('Search by patient name');

      validateEpisodeTableHeaders();
      validateFilterSection();

      return cy
        .fixture('apiResp/episodes')
        .then(({ episodes }) => {
          episodes.forEach((episode: EpisodeDetails) => {
            validateTableRow(episode);
          });
        })
        .then(() => validateEpisodeTableFooter());
    });

    carePhaseStatus.forEach((status) => {
      it(`should show the correct ${status} status dot`, () => {
        return cy.fixture('apiResp/episodes').then(({ episodes }) => {
          const episodeCurrent = episodes.find(
            (episode: EpisodeDetails) => episode.care_phase.name === status
          );

          const { id } = episodeCurrent;
          el(`episode-details-cell-${id}`).hasText(status);
          el(`status-dot-${id}`).isVisible();
        });
      });
    });
  });

  describe('Url params', () => {
    it('should start with selected filter values', () => {
      cy.visit(
        '/episodes/?marketId=177&serviceLineId=1&carePhaseId=2&patientName=Jane&pageSize=5&page=1'
      );

      el(EPISODES_SEARCH_INPUT).should('have.value', 'Jane');
      el(MARKET_FILTER).hasText('ATL');
      el(SERVICE_LINE_FILTER).hasText('Advanced');
      el(CARE_PHASE_FILTER).hasText('High Acuity');
      el(CLEAR_ALL_BUTTON).click();
    });
  });

  describe('Filters', () => {
    describe('Market Filter', () => {
      it('should clear and select all markets filter', () => {
        el(MARKET_FILTER).hasText('Markets');
        el(MARKET_FILTER).click();
        selectFilterOptions(MARKET_DROPDOWN_LIST, {
          selectList: ['Denver', 'Las Vegas'],
        });
        el(MARKET_FILTER).hasText('DEN, LAS');

        el(MARKET_LABEL_TEXT).hasText('Market');
        el(CLEAR_FILTER_BUTTON).click();
        el(MARKET_FILTER).hasText('Market');
      });

      it('should add markets filter', () => {
        el(MARKET_FILTER).hasText('Markets');
        el(MARKET_FILTER).click();
        selectFilterOptions(MARKET_DROPDOWN_LIST, {
          selectAll: true,
        });
        el(DONE_FILTER_BUTTON).should('exist').click();
        el(MARKET_FILTER).hasText('All 52 Markets');
      });

      it('should correctly display chip text depending on values', () => {
        el(MARKET_FILTER).hasText('Markets');
        el(MARKET_FILTER).click();
        selectFilterOptions(MARKET_DROPDOWN_LIST, {
          selectList: ['Denver'],
        });
        el(MARKET_FILTER).hasText('DEN');
        selectFilterOptions(MARKET_DROPDOWN_LIST, {
          selectList: ['Denver', 'Houston'],
        });
        el(MARKET_FILTER).hasText('DEN, HOU');
        selectFilterOptions(MARKET_DROPDOWN_LIST, {
          selectList: ['Denver', 'Houston', 'Las Vegas'],
        });
        el(MARKET_FILTER).hasText('DEN, HOU, LAS');
        selectFilterOptions(MARKET_DROPDOWN_LIST, {
          selectList: ['Denver', 'Houston', 'Las Vegas', 'Miami'],
        });
        el(MARKET_FILTER).hasText('4 Selected');
        selectFilterOptions(MARKET_DROPDOWN_LIST, {
          selectAll: true,
        });
        el(MARKET_FILTER).hasText('All 52 Markets');
      });

      describe('Search', () => {
        it('display correct results after searching', () => {
          el(MARKET_FILTER).hasText('Markets');
          el(MARKET_FILTER).click();

          el(MARKET_SEARCH_INPUT).type('De');
          selectFilterOptions(MARKET_DROPDOWN_LIST, {
            selectList: ['Denver'],
          });
          selectFilterOptions(MARKET_DROPDOWN_LIST, {
            selectAll: true,
          });
          el(DONE_FILTER_BUTTON).should('exist').click();

          el(MARKET_FILTER).hasText('DEN, FTL, RIV');
        });
      });
    });

    describe('Service Line Filter', () => {
      it('should clear service lines filter', () => {
        el(SERVICE_LINE_FILTER).hasText('Service Lines').click();
        selectFilterOptions(SERVICE_LINE_DROPDOWN_LIST, {
          selectAll: true,
        });
        el(DONE_FILTER_BUTTON).click();
        el(SERVICE_LINE_FILTER).hasText('All 4 Service Lines').click();
        el(CLEAR_FILTER_BUTTON).click();

        el(SERVICE_LINE_FILTER).hasText('Service Lines');
      });

      it('should add service lines filter', () => {
        el(SERVICE_LINE_FILTER).click();
        selectFilterOptions(SERVICE_LINE_DROPDOWN_LIST, {
          selectAll: true,
        });

        el(DONE_FILTER_BUTTON).click();
        el(SERVICE_LINE_FILTER).hasText('All 4 Service Lines');
      });

      it('should display correct text for two service lines selected', () => {
        el(SERVICE_LINE_FILTER).hasText('Service Lines').click();
        selectFilterOptions(SERVICE_LINE_DROPDOWN_LIST, {
          selectList: ['Advanced Care', 'Bridge Care'],
        });

        el(DONE_FILTER_BUTTON).click();
        el(SERVICE_LINE_FILTER).hasText('Advanced, Bridge');
      });
    });

    describe('Care Phase Filter', () => {
      it('should clear care phase filters', () => {
        el(CARE_PHASE_FILTER).hasText('Care Phases').click();
        el(CLEAR_FILTER_BUTTON).click();
        el(CARE_PHASE_ACTIVE_SUBHEADING).hasText('ACTIVE');
        el(CARE_PHASE_INACTIVE_SUBHEADING).hasText('INACTIVE');
        el(CARE_PHASE_FILTER).hasText('Care Phase');
      });

      it('should add active care phase filters', () => {
        el(CARE_PHASE_FILTER).click();
        selectFilterOptions(CARE_PHASE_DROPDOWN_LIST, {
          selectList: ACTIVE_CARE_PHASES,
        });

        el(DONE_FILTER_BUTTON).click();
        el(CARE_PHASE_FILTER).hasText('Active');
      });

      it('should add inactive care phase filters', () => {
        el(CARE_PHASE_FILTER).click();
        selectFilterOptions(CARE_PHASE_DROPDOWN_LIST, {
          selectList: INACTIVE_CARE_PHASES,
        });
        el(DONE_FILTER_BUTTON).click();
        el(CARE_PHASE_FILTER).hasText('Discharged, Pending');
      });

      it('should remove care phase filters', () => {
        el(CARE_PHASE_FILTER).click();
        selectFilterOptions(CARE_PHASE_FILTER);
        el(DONE_FILTER_BUTTON).click();
        el(CARE_PHASE_FILTER).hasText('Care Phase');
      });

      it('should add care phase filters', () => {
        el(CARE_PHASE_FILTER).click();
        selectFilterOptions(CARE_PHASE_FILTER, { selectAll: true });
        el(DONE_FILTER_BUTTON).click();
        el(CARE_PHASE_FILTER).hasText('All 6 Care Phases');
      });
    });

    describe('Incomplete Task Filter', () => {
      it('should select/remove incomplete task filter', () => {
        el(INCOMPLETE_TASK_FILTER).click();
      });
    });

    describe('Clear All Link', () => {
      it('should clear all filter options', () => {
        el(MARKET_FILTER).click();
        selectFilterOptions(MARKET_DROPDOWN_LIST, {
          selectAll: true,
        });
        el(DONE_FILTER_BUTTON).click();

        el(SERVICE_LINE_FILTER).click();
        selectFilterOptions(SERVICE_LINE_DROPDOWN_LIST, {
          selectAll: true,
        });
        el(DONE_FILTER_BUTTON).click();

        el(CARE_PHASE_FILTER).click();
        selectFilterOptions(CARE_PHASE_DROPDOWN_LIST, {
          selectAll: true,
        });
        el(DONE_FILTER_BUTTON).click();

        el(CLEAR_ALL_BUTTON).click();
        el(MARKET_FILTER).hasText('Market');
        el(SERVICE_LINE_FILTER).hasText('Service Line');
        el(CARE_PHASE_FILTER).hasText('Care Phase');
      });

      it('should be visible when each filter is selected', () => {
        el(MARKET_FILTER).click();
        selectFilterOptions(MARKET_DROPDOWN_LIST, {
          selectAll: true,
        });
        el(DONE_FILTER_BUTTON).click();
        el(CLEAR_ALL_BUTTON).should('exist').click().should('not.exist');

        el(SERVICE_LINE_FILTER).click();
        selectFilterOptions(SERVICE_LINE_DROPDOWN_LIST, {
          selectAll: true,
        });
        el(DONE_FILTER_BUTTON).click();
        el(CLEAR_ALL_BUTTON).should('exist').click().should('not.exist');

        el(CARE_PHASE_FILTER).click();
        selectFilterOptions(CARE_PHASE_DROPDOWN_LIST, {
          selectAll: true,
        });
        el(DONE_FILTER_BUTTON).click();
        el(CLEAR_ALL_BUTTON).should('exist').click().should('not.exist');

        el(MARKET_FILTER).hasText('Market');
        el(SERVICE_LINE_FILTER).hasText('Service Line');
        el(CARE_PHASE_FILTER).hasText('Care Phase');
      });
    });
  });
});

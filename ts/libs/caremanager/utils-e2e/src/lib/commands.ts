// eslint-disable-next-line @nx/enforce-module-boundaries
import {
  NoteKind,
  TaskTypeEnum,
} from '@*company-data-covered*/caremanager/data-access-types';
import { dashboardLogin, login, onboardingLogin } from './APIHelpers/login';
import { getCareManagerServiceM2MToken } from './APIHelpers/m2mToken';
import {
  createNote,
  deleteEpisodeNotes,
  deleteNote,
  hasPathname,
} from './APIHelpers/notes';
import { createTask, deleteEpisodeTasks, deleteTask } from './APIHelpers/tasks';
import { createEpisode, getEpisode } from './APIHelpers/episodes';
import {
  createTaskTemplate,
  deleteTaskTemplate,
} from './APIHelpers/taskTemplates';
import { createVisitFromStationCR } from './APIHelpers/visits';
import { createAPIPatient, createPatient } from './APIHelpers/patients';
import createCaller from './APIHelpers/caller';
import createMPOAConsent from './APIHelpers/mpoaConsent';
import createRiskAssessment from './APIHelpers/riskAssessment';
import {
  createInsuranceIfNotExist,
  deleteInsuranceIfExist,
} from './APIHelpers/insurance';
import { createCareRequest } from './APIHelpers/careRequest';

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Cypress {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    interface Chainable<Subject> {
      /** Custom command that bypasses auth0 login
       * @example cy.dashboardLogin();
       */
      dashboardLogin(): Chainable;

      /* API COMMANDS */
      /** Custom command that bypasses auth0 login
       * @example cy.onboardingLogin();
       */
      onboardingLogin(): Chainable;

      /** Custom command that bypasses auth0 login
       * @example cy.login();
       */
      login(): Chainable;

      /**
       * Custom command that contains all the custom api commands used to create a care request
       * @example beforeEach(() => { cy.setupCareRequest().then(() => { // Use CareRequest Id for Dashboard Experience }) })
       */
      setupCareRequest(): Chainable<number>;

      /**
       * Custom command that creates a caller
       * @example cy.createCaller().then(() => { // Use Caller Resp in CareRequest })
       */
      createCaller(): Chainable;

      /**
       * Custom command that creates a care request in the given test environment
       * @example cy.createCareRequest(careRequest).then(() => { // Use CareRequest Resp })
       */
      createCareRequest(careRequest: Record<string, unknown>): Chainable;

      /**
       * Custom command that creates an insurance if it doesn't currently exist for the given patient
       * @example cy.createInsuranceIfNotExist(patientId, careRequestId)
       */
      createInsuranceIfNotExist(
        patientId: number,
        careRequestId: number
      ): Chainable;

      /**
       * Custom command that creates an mpoa consent on a care request
       * @example cy.createMPOAConsent(careRequestId).then(() => { // Use CareRequest Resp })
       */
      createMPOAConsent(careRequestId: number): Chainable;

      /**
       * Custom command that creates a risk assessment on a care request
       * @example cy.createRiskAssessment(careRequestId).then(() => { // Use CareRequest Resp })
       */
      createRiskAssessment(careRequestId: number): Chainable;

      /**
       * Custom command that deletes an insurance if it exist for the given patient
       * @example cy.deleteInsuranceIfExist(patientId, careRequestId)
       */
      deleteInsuranceIfExist(
        patientId: number,
        careRequestId: number
      ): Chainable;

      /**
       * Custom command that creates a test patient.
       * @example cy.createAPIPatient().then(() => { // Use Patient Resp in CareRequest })
       */
      createAPIPatient(): Chainable;

      /** Custom command to retrieve Care Manager Service m2m token
       * @example cy.login();
       */
      getCareManagerServiceM2MToken(): Chainable;

      /** Custom command that saves the local storage
       * @example cy.saveLocalStorage();
       */
      saveLocalStorage(): Chainable;

      /** Custom command that restores the local storage
       * @example cy.restoreLocalStorage();
       */
      restoreLocalStorage(): Chainable;

      /**
       * Custom command that creates a note for an individual episode
       * @example cy.createNote('daily_updates').then((noteId) => )
       */
      createNote(noteType: NoteKind): Cypress.Chainable<string>;

      /**
       * Custom command that deletes a note for an individual episode
       * @example cy.deleteNote(noteId).then((noteId) => )
       */
      deleteNote(noteId: string): Chainable;

      /**
       * Custom command that creates a task for an individual episode
       * @example cy.createTask('daily_and_onboarding').then((taskId) => )
       */
      createTask(taskType: TaskTypeEnum, episodeId?: string): Chainable<string>;

      /**
       * Custom command that deletes a task for an individual episode
       * @example cy.deleteTask(taskId).then((taskId) => )
       */
      deleteTask(taskId: string, taskType: string): Chainable;

      /**
       * Custom command that deletes multiple tasks for an individual episode
       * @example cy.deleteEpisodeTasks(episodeId).then((episodeId) => )
       */
      deleteEpisodeTasks(episodeId: string): Chainable;

      /**
       * Custom command that deletes multiple notes for an individual episode
       * @example cy.deleteEpisodeNotes(episodeId).then((episodeId) => )
       */
      deleteEpisodeNotes(episodeId: string): Chainable;

      /**
       * Custom command that gets an individual episode
       * @example cy.getEpisode(episodeIdId).then((episodeId) => )
       */
      getEpisode(episodeId: string): Chainable;

      /**
       * Custom command that creates a new episode
       * @example cy.createEpisode() => )
       */
      createEpisode(): Chainable;

      /**
       * Custom command that compares a string with current pathname
       * @example cy.hasPathname(pathname)
       */
      hasPathname(pathname: string): Chainable;

      /**
       * Custom command that creates a new task template
       * @example cy.createTaskTemplate()
       */
      createTaskTemplate(
        body?: Partial<TaskTemplateBody>,
        customIdEnvVarName?: string
      ): Chainable;

      /**
       * Custom command that deletes a task template
       * @example cy.deleteTaskTemplate(taskTemplateId)
       */
      deleteTaskTemplate(taskTemplateId: number): Chainable;

      /**
       * Custom command that creates a new patient
       * @example cy.createPatient()
       */
      createPatient(): Chainable;

      /**
       * Custom command for creating a visit simulating originating from a Station care request
       */
      createVisitFromStationCR(
        careRequestId: number,
        sourceCareRequestId: number,
        status?: string
      ): Chainable;

      /**
       * Simulate click outside of element
       * @example cy.clickOutside()
       */
      clickOutside(): Chainable;
    }

    type TaskTemplateTaskNew = {
      body: string;
      task_type_id: number;
    };

    type TaskTemplateBody = {
      name: string;
      summary: string;
      service_line_id: number;
      care_phase_id: number;
      tasks: TaskTemplateTaskNew[];
    };
  }
}

const LOCAL_STORAGE_MEMORY: Record<string, string> = {};
const DASHBOARD_API_URL = Cypress.env('DASHBOARD_API_URL');
const ONBOARDING_URL = Cypress.env('AUTH0_ONBOARDING_URL');

/*  API command that logs in to the onboarding application for critical path e2e before any tests are run */
Cypress.Commands.add('onboardingLogin', (user = 'admin') => {
  Cypress.log({
    name: 'onboardingLogin',
  });

  cy.fixture('loginUsers').then((loginUsers) => {
    const { username, password } = loginUsers[user];
    onboardingLogin(username, password);
    Cypress.config('baseUrl', ONBOARDING_URL);
  });
});

/*  API command that logs in to the dashboard application for critical path e2e before any tests are run */
Cypress.Commands.add('dashboardLogin', (user = 'admin') => {
  Cypress.log({
    name: 'dashboardLogin',
  });

  cy.fixture('loginUsers').then((loginUsers) => {
    const { username, password } = loginUsers[user];
    dashboardLogin(username, password);
    Cypress.config('baseUrl', DASHBOARD_API_URL);
    cy.saveLocalStorage();
  });
});

/*  API command that logs in to the care manager application */
Cypress.Commands.add('login', (user = 'admin') => {
  Cypress.log({
    name: 'loginViaAuth0',
  });

  cy.fixture('loginUsers').then((loginUsers) => {
    const { username, password } = loginUsers[user];
    login(username, password);
    cy.saveLocalStorage();
  });
});

/* API command that creates a care request for test setup */
Cypress.Commands.add('setupCareRequest', () => {
  Cypress.log({
    name: 'setupCareRequest',
  });

  Cypress.config('baseUrl', DASHBOARD_API_URL);

  cy.fixture(`apiBody/createCareRequest`).then((fixture) => {
    const requestFixture = fixture;

    cy.createCaller()
      .then((callerResp) => {
        requestFixture['care_request[caller_id]'] = callerResp.id;
        cy.createAPIPatient();
      })
      .then((patientResp) => {
        const patientId = patientResp.id;

        requestFixture['care_request[patient_id]'] = patientId;
        cy.createCareRequest(requestFixture).then((careRequestResp) => {
          const careRequestId = careRequestResp.body.id;

          Cypress.env('currentCareRequestId', careRequestId);
          cy.createInsuranceIfNotExist(patientId, careRequestId)
            .then(() => cy.createMPOAConsent(careRequestId))
            .then(() => cy.createRiskAssessment(careRequestId))
            .then(() => careRequestId);
        });
      });
  });
});

/* API command that creates a caller, used by the setupCareRequest command */
Cypress.Commands.add('createCaller', () => {
  Cypress.log({
    name: 'createCaller',
  });

  createCaller();
});

/** API command that creates a care request, used by the setupCareRequest command
 * @param {Object} careRequest specific care request to create
 */
Cypress.Commands.add('createCareRequest', (careRequest) => {
  Cypress.log({
    name: 'createCareRequest',
  });

  return createCareRequest(careRequest);
});

/** API command that creates an insurance if it doesn't currently exist for the given patient, used by the setupCareRequest command.
 * @param {Number} patientId referring to the patient to use
 * @param {Number} careRequestId referring to the care request to use
 */
Cypress.Commands.add(
  'createInsuranceIfNotExist',
  (patientId, careRequestId) => {
    Cypress.log({
      name: 'createInsuranceIfNotExist',
    });

    createInsuranceIfNotExist(patientId, careRequestId);
  }
);

/** API command that creates an mpoa consent on a care request, used by the setupCareRequest command
 * @param {Number} careRequestId referring to the care request to use
 */
Cypress.Commands.add('createMPOAConsent', (careRequestId) => {
  Cypress.log({
    name: 'createMPOAConsent',
  });

  createMPOAConsent(careRequestId);
});

/** API command that creates a risk assessment on a care request, used by the setupCareRequest command
 * @param {Number} careRequestId referring to the care request to use
 */
Cypress.Commands.add('createRiskAssessment', (careRequestId) => {
  Cypress.log({
    name: 'createRiskAssessment',
  });

  createRiskAssessment(careRequestId);
});

/** API command that deletes the patient insurance if it exists
 * @param {Number} patientId referring to the patient to use
 * @param {Number} careRequestId referring to the care request to use
 */
Cypress.Commands.add('deleteInsuranceIfExist', (patientId, careRequestId) => {
  Cypress.log({
    name: 'deleteInsuranceIfExist',
  });

  deleteInsuranceIfExist(patientId, careRequestId);
});

/*  API command that creates a patient via API for critical path e2e test*/
Cypress.Commands.add('createAPIPatient', () => {
  Cypress.log({
    name: 'createAPIPatient',
  });
  createAPIPatient();
});

/*  API command that retrieves and stores a Care Manager Service M2M token */
Cypress.Commands.add('getCareManagerServiceM2MToken', () => {
  Cypress.log({
    name: 'getCareManagerServiceM2MToken',
  });

  getCareManagerServiceM2MToken();
});

/*  API command that saves the local storage, used specifically after login */
Cypress.Commands.add('saveLocalStorage', () => {
  Cypress.log({
    name: 'saveLocalStorage',
  });

  Object.keys(localStorage).forEach((key) => {
    LOCAL_STORAGE_MEMORY[key] = localStorage[key];
  });
});

/*  API command that restores the local storage, used specifically to persist login */
Cypress.Commands.add('restoreLocalStorage', () => {
  Cypress.log({
    name: 'restoreLocalStorage',
  });

  Object.keys(LOCAL_STORAGE_MEMORY).forEach((key) => {
    localStorage.setItem(key, LOCAL_STORAGE_MEMORY[key]);
  });
});

/** API command that creates a note on an episode
 * @param {NoteKind} noteType type of note to be created
 */
Cypress.Commands.add('createNote', (noteType: NoteKind) => {
  Cypress.log({
    name: 'createNote',
  });

  createNote(noteType);
});

/** API command that deletes a note on an episode
 */
Cypress.Commands.add('deleteNote', (noteId: string) => {
  Cypress.log({
    name: 'deleteNote',
  });

  deleteNote(noteId);
});

/** API command that creates a task on an episode
 * @param {TaskTypeEnum} taskType type of task to be created
 * @param {string} episodeId id of the episode the task is created for
 */
Cypress.Commands.add('createTask', (taskType, episodeId) => {
  Cypress.log({
    name: 'createTask',
  });

  createTask(taskType, episodeId);
});

/** API command that deletes a task on an episode
 * @param {number} taskId id of task to be deleted
 * @param {string} taskType type of task to be deleted
 */
Cypress.Commands.add('deleteTask', (taskId: string, taskType: string) => {
  Cypress.log({
    name: 'deleteTask',
  });

  Cypress.env(`${taskType}Id`, '');
  deleteTask(taskId);
});

/** API command that deletes multiple tasks on an episode
 * @param {string} episodeId id of episode whose episodes are cleaned up
 */
Cypress.Commands.add('deleteEpisodeTasks', (episodeId: string) => {
  Cypress.log({
    name: 'deleteEpisodeTasks',
  });

  deleteEpisodeTasks(episodeId);
});

/** API command that deletes multiple tasks on an episode
 * @param {string} episodeId id of episode whose episodes are cleaned up
 */
Cypress.Commands.add('deleteEpisodeNotes', (episodeId: string) => {
  Cypress.log({
    name: 'deleteEpisodeNotes',
  });

  deleteEpisodeNotes(episodeId);
});

/** API command that gets an episode
 */
Cypress.Commands.add('getEpisode', (episodeId: string) => {
  Cypress.log({
    name: 'getEpisode',
  });

  getEpisode(episodeId);
});

/** API command that creates an episode
 */
Cypress.Commands.add('createEpisode', () => {
  Cypress.log({
    name: 'createEpisode',
  });

  createEpisode();
});

Cypress.Commands.add('hasPathname', (pathname: string) => {
  Cypress.log({
    name: 'hasPathname',
  });

  hasPathname(pathname);
});

/** API command that creates a task template
 */
Cypress.Commands.add(
  'createTaskTemplate',
  (body?: Partial<Cypress.TaskTemplateBody>, customIdEnvVarName?: string) => {
    Cypress.log({
      name: 'createTaskTemplate',
    });

    createTaskTemplate(body, customIdEnvVarName);
  }
);

/** API command that deletes a task template
 * @param {string} taskTemplateId id of task template to be deleted
 */
Cypress.Commands.add('deleteTaskTemplate', (taskTemplateId: number) => {
  Cypress.log({
    name: 'deleteTaskTemplate',
  });

  deleteTaskTemplate(taskTemplateId);
});

/** API command that creates an patient
 */
Cypress.Commands.add('createPatient', () => {
  Cypress.log({
    name: 'createPatient',
  });

  createPatient();
});

/**
 * API command that creates a visit simulating originating from a Station care request
 */
Cypress.Commands.add(
  'createVisitFromStationCR',
  (careRequestId: number, sourceCareRequestId: number, status?: string) => {
    Cypress.log({
      name: 'createVisitFromStationCR',
    });

    createVisitFromStationCR(careRequestId, sourceCareRequestId, status);
  }
);

/**
 * Clicks corner to simulate a click "anywhere" outside.
 */
Cypress.Commands.add('clickOutside', () => {
  cy.get('body').click(0, 0);
});

/**
 * Overwrite existing cy.visit command and restore the local cache before visiting the url
 * @param  {String} url the url to visit
 */
Cypress.Commands.overwrite('visit', (originalFn, url) => {
  cy.restoreLocalStorage().then(() => {
    originalFn(url);
  });
});

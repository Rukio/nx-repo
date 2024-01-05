import { Intercept } from '@*company-data-covered*/cypress-shared';
import { getConfigResponseMock } from '../fixtures/getConfigResponseMock';

const {
  setBasePath,
  intercept,
  getGETRequestObject,
  getPOSTRequestObject,
  getResponseObject,
  getPATCHRequestObject,
  getDELETERequestObject,
} = Intercept;

setBasePath('/');

/*GET*/
export const interceptGETVisitsList = ({
  mockResp = true,
  statusCode = 200,
} = {}) =>
  intercept({
    reqData: getGETRequestObject({ pathname: '**/visits' }),
    ...(mockResp && {
      respData: getResponseObject({ statusCode }),
    }),
  }).as('interceptGETVisitsList');

export const interceptGETTaskTemplates = ({
  mockResp = true,
  statusCode = 200,
  fixture = 'taskTemplates',
} = {}) =>
  intercept({
    reqData: getGETRequestObject({ pathname: 'v1/task_templates' }),
    ...(mockResp && {
      respData: getResponseObject({ fixture, statusCode }),
    }),
  }).as('interceptGETTaskTemplates');

export const interceptGETDeletedTaskTemplates = ({
  mockResp = true,
  arrayIndex = 0,
  fixture = 'taskTemplates',
} = {}) => {
  cy.fixture(`apiResp/${fixture}`).then((response) => {
    response.task_templates.splice(arrayIndex, 1);
    intercept({
      reqData: getGETRequestObject({ pathname: 'v1/task_templates' }),
      ...(mockResp && {
        respData: getResponseObject({
          body: response,
        }),
      }),
    }).as('interceptGETDeletedTaskTemplates');
  });
};

export const interceptGETPatientSearchDetails = ({
  statusCode = 200,
  withoutPatients = false,
} = {}) => {
  cy.fixture('apiResp/patientSearch').then((patientDetailsResponse) => {
    const body = {
      ...patientDetailsResponse,
      patients: withoutPatients ? [] : patientDetailsResponse.patients,
    };
    intercept({
      reqData: getGETRequestObject({
        pathname: 'v1/patients',
      }),
      respData: getResponseObject({
        body,
        statusCode,
      }),
    }).as('interceptGETPatientSearchDetails');
  });
};

export const interceptGETPatientDetails = () =>
  intercept({
    reqData: getGETRequestObject({ pathname: 'v1/patients/**' }),
    respData: getResponseObject({ fixture: 'patientDetails' }),
  }).as('interceptGETPatientDetails');

export const interceptGETEpisodes = ({
  mockResp = true,
  statusCode = 200,
  fixture = 'episodes',
} = {}) =>
  intercept({
    reqData: getGETRequestObject({ pathname: 'v1/episodes**' }),
    ...(mockResp && {
      respData: getResponseObject({ fixture, statusCode }),
    }),
  }).as('interceptGETEpisodes');

export const interceptGETConfigData = ({ mockResp = true } = {}) =>
  intercept({
    reqData: getGETRequestObject({ pathname: 'v1/config' }),
    ...(mockResp && {
      respData: getResponseObject({
        body: getConfigResponseMock,
      }),
    }),
  }).as('interceptGETConfigData');

export const interceptGETPatientData = ({ mockResp = true } = {}) =>
  intercept({
    reqData: getGETRequestObject({ pathname: 'v1/patients/**' }),
    ...(mockResp && {
      respData: getResponseObject({ fixture: 'patientSearch' }),
    }),
  }).as('interceptGETPatientData');

export const interceptGETEpisodeDetails = ({
  mockResp = true,
  episodeDetails = {},
} = {}) =>
  cy.fixture('apiResp/episodeDetails').then((episodeDetailsResponse) => {
    const bodyResponse = {
      episode: {
        ...episodeDetailsResponse.episode,
        ...episodeDetails,
      },
    };
    intercept({
      reqData: getGETRequestObject({ pathname: 'v1/episodes/**' }),
      ...(mockResp && {
        respData: getResponseObject({ body: bodyResponse }),
      }),
    }).as('interceptGETEpisodeDetails');
  });

export const interceptGETTemplateDetails = ({
  mockResp = true,
  templateDetails = {},
} = {}) =>
  cy.fixture('apiResp/taskTemplateDetails').then((templateDetailsResponse) => {
    const bodyResponse = {
      ...templateDetailsResponse,
      ...templateDetails,
    };
    intercept({
      reqData: getGETRequestObject({
        pathname: 'v1/task_templates/**',
      }),
      ...(mockResp && {
        respData: getResponseObject({ body: bodyResponse }),
      }),
    }).as('interceptGETTemplateDetails');
  });

export const interceptGETUpdatedEpisodeDetails = ({ mockResp = true } = {}) =>
  intercept({
    reqData: getGETRequestObject({ pathname: 'v1/episodes/**' }),
    ...(mockResp && {
      respData: getResponseObject({ fixture: 'episodeDetailsUpdate' }),
    }),
  }).as('interceptGETUpdatedEpisodeDetails');

export const interceptGETUpdatedNote = ({
  mockResp = true,
  noteKind = 'general',
  kindText = 'General Notes',
} = {}) => {
  cy.fixture('apiResp/episodeDetailsNote').then((episodeDetailsResponse) => {
    const noteToEdit = episodeDetailsResponse.episode.notes[5];
    const newNoteDetails = `${noteToEdit.details}${kindText} Note`;
    noteToEdit.note_kind = noteKind;
    noteToEdit.details = newNoteDetails;
    intercept({
      reqData: getGETRequestObject({ pathname: 'v1/episodes/**' }),
      ...(mockResp && {
        respData: getResponseObject({ body: episodeDetailsResponse }),
      }),
    }).as('interceptGETUpdatedNote');
  });
};

export const interceptGETEpisodeWithPinnedNotes = ({
  mockResp = true,
  pinValue = true,
  noteIndex = 0,
} = {}) =>
  cy
    .fixture('apiResp/episodeDetailsNotesUpdate')
    .then((episodeDetailsResponse) => {
      const body = episodeDetailsResponse;
      body.episode.notes[noteIndex].pinned = pinValue;
      intercept({
        reqData: getGETRequestObject({ pathname: 'v1/episodes/**' }),
        ...(mockResp && {
          respData: getResponseObject({
            body,
          }),
        }),
      });
    })
    .as('interceptGETEpisodeWithPinnedNotes');

export const interceptGETUpdatedNotes = ({
  mockResp = true,
  noteKind = 'general',
  kindText = 'General Notes',
  arrayIndex = 0,
} = {}) =>
  cy
    .fixture('apiResp/episodeDetailsNotesUpdate')
    .then((episodeDetailsResponse) => {
      const noteToEdit = episodeDetailsResponse.episode.notes[arrayIndex];
      const newNoteDetails = `This is the new updated ${kindText} Note`;
      noteToEdit.note_kind = noteKind;
      noteToEdit.details = newNoteDetails;
      noteToEdit.updated_at = new Date();
      intercept({
        reqData: getGETRequestObject({ pathname: 'v1/episodes/**' }),
        ...(mockResp && {
          respData: getResponseObject({
            body: episodeDetailsResponse,
          }),
        }),
      });
    })
    .as('interceptGETUpdatedNotes');

export const interceptGETDeletedDailyUpdate = ({ mockResp = true } = {}) =>
  intercept({
    reqData: getGETRequestObject({ pathname: 'v1/episodes/**' }),
    ...(mockResp && {
      respData: getResponseObject({
        fixture: 'episodeDetailsNotesDelete',
      }),
    }),
  }).as('interceptGETDeletedDailyUpdate');

export const interceptGETDeletedNotes = ({
  mockResp = true,
  arrayIndex = 0,
} = {}) => {
  cy.fixture('apiResp/episodeDetailsNotesUpdate').then((response) => {
    response.episode.notes.splice(arrayIndex, 1);
    intercept({
      reqData: getGETRequestObject({ pathname: 'v1/episodes/**' }),
      ...(mockResp && {
        respData: getResponseObject({
          body: response,
        }),
      }),
    }).as('interceptGETDeletedNotes');
  });
};

export const interceptGETEpisodeTask = ({ mockResp = true } = {}) =>
  intercept({
    reqData: getGETRequestObject({ pathname: 'v1/episodes/**' }),
    ...(mockResp && {
      respData: getResponseObject({ fixture: 'episodeDetailsTask' }),
    }),
  }).as('interceptGETEpisodeTask');

export const interceptGETEpisodeTaskUpdate = ({
  mockResp = true,
  taskIndex = 0,
  taskText = 'Updated Task',
} = {}) => {
  cy.fixture('apiResp/episodeDetails').then((response) => {
    response.episode.tasks[taskIndex].task = taskText;
    intercept({
      reqData: getGETRequestObject({ pathname: 'v1/episodes/**' }),
      ...(mockResp && {
        respData: getResponseObject({
          body: response,
        }),
      }),
    }).as('interceptGETEpisodeTaskUpdate');
  });
};

export const interceptGETEpisodeBulkTask = ({ mockResp = true } = {}) =>
  intercept({
    reqData: getGETRequestObject({ pathname: 'v1/episodes/**' }),
    ...(mockResp && {
      respData: getResponseObject({ fixture: 'episodeDetailsBulkTask' }),
    }),
  }).as('interceptGETEpisodeBulkTask');

/* PATCH */

export const interceptPATCHVisitStatus = ({
  mockResp = true,
  statusCode = 200,
} = {}) =>
  intercept({
    reqData: getPATCHRequestObject({ pathname: 'v1/visits/**' }),
    ...(mockResp && {
      respData: getResponseObject({ statusCode }),
    }),
  }).as('interceptPATCHVisitStatus');

export const interceptPATCHEpisodeDetails = ({ statusCode = 200 } = {}) =>
  intercept({
    reqData: getPATCHRequestObject({
      pathname: 'v1/episodes/**',
    }),
    respData: getResponseObject({
      fixture: 'episodeDetailsUpdate',
      statusCode,
    }),
  }).as('interceptPATCHEpisodeDetails');

export const interceptPATCHPatientDetails = ({
  statusCode = 200,
  fixtureSuffix = '',
} = {}) =>
  intercept({
    reqData: getPATCHRequestObject({
      pathname: 'v1/patients/**',
    }),
    respData: getResponseObject({
      fixture: `patientDetailsPatch${fixtureSuffix}`,
      statusCode,
    }),
  }).as('interceptPATCHPatientDetails');

export const interceptPATCHNote = ({
  mockResp = true,
  statusCode = 200,
  noteKind = 'general',
  noteId = 3,
} = {}) => {
  cy.fixture('apiResp/episodeNotesPatch').then((notePatchResponse) => {
    const formattedResponse = {
      note: {
        ...notePatchResponse.note,
        note_kind: noteKind,
        id: noteId,
      },
    };
    intercept({
      reqData: getPATCHRequestObject({ pathname: 'v1/notes/**' }),
      ...(mockResp && {
        respData: getResponseObject({
          body: formattedResponse,
          statusCode,
        }),
      }),
    }).as('interceptPATCHNote');
  });
};

export const interceptPatchEpisodeTask = ({
  mockResp = true,
  statusCode = 200,
} = {}) =>
  intercept({
    reqData: getPATCHRequestObject({ pathname: 'v1/tasks/**' }),
    ...(mockResp && {
      respData: getResponseObject({
        fixture: 'episodeTaskUpdate',
        statusCode,
      }),
    }),
  }).as('interceptPatchEpisodeTask');

/* POST */

export const interceptPOSTVisitSummary = ({
  mockResp = true,
  statusCode = 200,
} = {}) =>
  intercept({
    reqData: getPOSTRequestObject({ pathname: '**/summary' }),
    ...(mockResp && {
      respData: getResponseObject({ statusCode }),
    }),
  }).as('interceptPOSTVisitSummary');

export const interceptPOSTNote = ({
  mockResp = true,
  noteKind = 'general',
  statusCode = 201,
}) => {
  cy.fixture('apiResp/episodeNotesPost').then((noteResponse) => {
    const formattedResponse = {
      note: { ...noteResponse.note, note_kind: noteKind },
    };
    intercept({
      reqData: getPOSTRequestObject({
        pathname: 'v1/episodes/**/notes',
      }),
      ...(mockResp && {
        respData: getResponseObject({
          body: formattedResponse,
          statusCode,
        }),
      }),
    }).as('interceptPOSTNote');
  });
};

export const interceptPATCHPinNote = ({
  mockResp = true,
  statusCode = 201,
} = {}) => {
  cy.fixture('apiResp/episodeNotesPost').then((noteResponse) => {
    const body = noteResponse;
    body.note.pin = true;
    intercept({
      reqData: getPATCHRequestObject({
        pathname: 'v1/notes/**/pin',
      }),
      ...(mockResp && {
        respData: getResponseObject({
          body,
          statusCode,
        }),
      }),
    }).as('interceptPATCHPinNote');
  });
};

export const interceptPATCHUnpinNote = ({
  mockResp = true,
  statusCode = 201,
} = {}) => {
  cy.fixture('apiResp/episodeNotesPost').then((noteResponse) => {
    intercept({
      reqData: getPATCHRequestObject({
        pathname: 'v1/notes/**/unpin',
      }),
      ...(mockResp && {
        respData: getResponseObject({
          body: { note: { ...noteResponse.note, pin: false } },
          statusCode,
        }),
      }),
    }).as('interceptPATCHUnpinNote');
  });
};

export const interceptPOSTEpisodeTask = ({
  mockResp = true,
  statusCode = 201,
} = {}) =>
  intercept({
    reqData: getPOSTRequestObject({ pathname: 'v1/episodes/**/tasks' }),
    ...(mockResp && {
      respData: getResponseObject({
        fixture: 'episodeTasksCreation',
        statusCode,
      }),
    }),
  }).as('interceptPOSTEpisodeTask');

export const interceptPOSTPatientDetails = ({
  mockResp = true,
  statusCode = 201,
} = {}) =>
  intercept({
    reqData: getPOSTRequestObject({ pathname: 'v1/patients' }),
    ...(mockResp && {
      respData: getResponseObject({
        fixture: 'patientDetails',
        statusCode,
      }),
    }),
  }).as('interceptPOSTPatientDetails');

export const interceptPOSTTemplate = ({
  mockResp = true,
  statusCode = 201,
} = {}) =>
  intercept({
    reqData: getPOSTRequestObject({ pathname: 'v1/task_templates' }),
    ...(mockResp && {
      respData: getResponseObject({
        fixture: 'taskTemplateDetails',
        statusCode,
      }),
    }),
  }).as('interceptPOSTTemplate');

export const interceptPOSTEpisodeCreate = ({
  mockResp = true,
  statusCode = 201,
} = {}) =>
  intercept({
    reqData: getPOSTRequestObject({ pathname: 'v1/episodes' }),
    ...(mockResp && {
      respData: getResponseObject({
        fixture: 'episodeCreate',
        statusCode,
      }),
    }),
  }).as('interceptPOSTEpisodeCreate');

/* DELETE */
export const interceptDELETETaskTemplate = ({
  mockResp = true,
  statusCode = 200,
  fixture = 'taskTemplatesDeleted',
} = {}) =>
  intercept({
    reqData: getDELETERequestObject({
      pathname: 'v1/task_templates/**',
    }),
    ...(mockResp && {
      respData: getResponseObject({
        fixture,
        statusCode,
      }),
    }),
  }).as('interceptDELETETaskTemplate');

export const interceptDELETEDailyUpdate = ({
  mockResp = true,
  statusCode = 200,
  fixture = 'episodeNotesDelete',
} = {}) =>
  intercept({
    reqData: getDELETERequestObject({ pathname: 'v1/notes/**' }),
    ...(mockResp && {
      respData: getResponseObject({
        fixture,
        statusCode,
      }),
    }),
  }).as('interceptDELETEDailyUpdate');

export const interceptDELETENote = ({
  mockResp = true,
  statusCode = 200,
  noteKind = 'general',
} = {}) => {
  cy.fixture('apiResp/episodeNotesDelete').then((episodeDetailsResponse) => {
    const formatedResponse = {
      ...episodeDetailsResponse,
      note_kind: noteKind,
    };
    intercept({
      reqData: getDELETERequestObject({ pathname: 'v1/notes/**' }),
      ...(mockResp && {
        respData: getResponseObject({
          body: formatedResponse,
          statusCode,
        }),
      }),
    }).as('interceptDELETENote');
  });
};

export const interceptDELETETask = ({
  mockResp = true,
  statusCode = 200,
  fixture = 'delete',
} = {}) =>
  intercept({
    reqData: getDELETERequestObject({ pathname: 'v1/tasks/**' }),
    ...(mockResp && {
      respData: getResponseObject({
        fixture,
        statusCode,
      }),
    }),
  }).as('interceptDELETETask');

export const interceptGETUsers = ({ mockResp = true } = {}) =>
  cy.fixture('apiResp/users').then((usersResponse) => {
    intercept({
      reqData: getGETRequestObject({ pathname: 'v1/users/by-id' }),
      ...(mockResp && {
        respData: getResponseObject({ body: usersResponse }),
      }),
    }).as('interceptGETUsers');
  });

export const interceptGETProviderTypes = ({ mockResp = true } = {}) =>
  cy.fixture('apiResp/providerTypes').then((providerTypesResponse) => {
    intercept({
      reqData: getGETRequestObject({ pathname: 'v1/provider-types' }),
      ...(mockResp && {
        respData: getResponseObject({ body: providerTypesResponse }),
      }),
    }).as('interceptGETProviderTypes');
  });

export const interceptPATCHInsurance = ({
  statusCode = 200,
  fixture = '',
} = {}) =>
  intercept({
    reqData: getPATCHRequestObject({
      pathname: 'v1/insurances/**',
    }),
    respData: getResponseObject({
      fixture,
      statusCode,
    }),
  }).as('interceptPATCHInsurance');

export const interceptPOSTInsurance = ({
  mockResp = true,
  statusCode = 200,
  fixture = '',
} = {}) =>
  intercept({
    reqData: getPOSTRequestObject({
      pathname: 'v1/insurances',
    }),
    ...(mockResp && {
      respData: getResponseObject({
        fixture,
        statusCode,
      }),
    }),
  }).as('interceptPOSTInsurance');

export const interceptDELETEInsurance = ({
  statusCode = 200,
  fixture = '',
} = {}) =>
  intercept({
    reqData: getDELETERequestObject({
      pathname: 'v1/insurances/**',
    }),
    respData: getResponseObject({
      fixture,
      statusCode,
    }),
  }).as('interceptDELETEInsurance');

export const interceptPATCHMedicalDecisionMaker = ({
  statusCode = 200,
  fixture = '',
} = {}) =>
  intercept({
    reqData: getPATCHRequestObject({
      pathname: 'v1/medical-decision-makers/**',
    }),
    respData: getResponseObject({
      fixture,
      statusCode,
    }),
  }).as('interceptPATCHMedicalDecisionMaker');

export const interceptPATCHPharmacy = ({
  statusCode = 200,
  fixture = '',
} = {}) =>
  intercept({
    reqData: getPATCHRequestObject({
      pathname: 'v1/pharmacies/**',
    }),
    respData: getResponseObject({
      fixture,
      statusCode,
    }),
  }).as('interceptPATCHPharmacy');

export const interceptPATCHExternalCareProviders = ({
  statusCode = 200,
  fixture = '',
} = {}) =>
  intercept({
    reqData: getPATCHRequestObject({
      pathname: 'v1/external-care-providers/**',
    }),
    respData: getResponseObject({
      fixture,
      statusCode,
    }),
  }).as('interceptPATCHExternalCareProviders');

export const interceptPOSTExternalCareProviders = ({
  mockResp = true,
  statusCode = 200,
  fixture = '',
} = {}) =>
  intercept({
    reqData: getPOSTRequestObject({
      pathname: 'v1/external-care-providers',
    }),
    ...(mockResp && {
      respData: getResponseObject({
        fixture,
        statusCode,
      }),
    }),
  }).as('interceptPOSTExternalCareProviders');

export const interceptDELETEExternalCareProviders = ({
  statusCode = 200,
  fixture = '',
} = {}) =>
  intercept({
    reqData: getDELETERequestObject({
      pathname: 'v1/external-care-providers/**',
    }),
    respData: getResponseObject({
      fixture,
      statusCode,
    }),
  }).as('interceptDELETEExternalCareProviders');

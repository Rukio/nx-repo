import { Intercept } from '@*company-data-covered*/cypress-shared';

const { setBasePath, intercept, getPOSTRequestObject } = Intercept;

setBasePath('/v1/');

export const interceptPOSTTemplate = () =>
  intercept({
    reqData: getPOSTRequestObject({ pathname: 'task_templates' }),
  }).as('interceptPOSTTemplate');

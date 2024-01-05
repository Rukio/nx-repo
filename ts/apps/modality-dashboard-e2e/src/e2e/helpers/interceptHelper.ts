import { Intercept } from '@*company-data-covered*/cypress-shared';

const { setBasePath, intercept, getGETRequestObject } = Intercept;

setBasePath('/v1/');

export const interceptGETModalities = () => {
  intercept({
    reqData: getGETRequestObject({
      pathname: `/modalities`,
    }),
  }).as('interceptGETModalities');
};

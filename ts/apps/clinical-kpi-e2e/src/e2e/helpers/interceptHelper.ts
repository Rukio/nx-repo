import { Intercept } from '@*company-data-covered*/cypress-shared';

const { setBasePath, intercept, getGETRequestObject } = Intercept;

setBasePath('/v1/');

export const interceptGetProviderIndividualMetrics = (providerId) => {
  intercept({
    reqData: getGETRequestObject({
      pathname: `metrics/providers/${providerId}`,
    }),
  }).as('interceptGetProviderIndividualMetrics');
};

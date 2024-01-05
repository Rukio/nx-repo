import { rest, RestHandler } from 'msw';
import {
  environment,
  NETWORKS_API_PATH,
  NETWORK_API_SEARCH_FRAGMENT,
  mockedInsuranceNetwork,
  DomainInsuranceNetwork,
  mockedInsuranceNetworksList,
  mockedFilteredByStateInsuranceNetworksList,
  mockedFilteredByClassificationInsuranceNetworksList,
  mockedInsuranceNetworkCreditCardRules,
  mockedNetworkServiceLines,
  buildNetworkCreditCardRulesPath,
  buildNetworkServiceLinesPath,
  buildNetworkModalityConfigsPath,
  buildNetworkPath,
  mockedNetworkModalityConfigs,
  buildNetworkStatesPath,
  mockedStateAbbrs,
  SearchInsuranceNetworkPayload,
  buildNetworkAppointmentTypesPath,
  mockedInsuranceNetworkAppointmentTypes,
} from '@*company-data-covered*/insurance/data-access';

export const insuranceNetworksHandlers: RestHandler[] = [
  rest.post(
    `${environment.serviceURL}${NETWORKS_API_PATH}/${NETWORK_API_SEARCH_FRAGMENT}`,
    async (req, res, ctx) => {
      let networks: DomainInsuranceNetwork[] = mockedInsuranceNetworksList;
      const searchInsuranceNetworkPayload: SearchInsuranceNetworkPayload =
        await req.json();

      if (searchInsuranceNetworkPayload.stateAbbrs) {
        networks = mockedFilteredByStateInsuranceNetworksList;
      } else if (searchInsuranceNetworkPayload.insuranceClassifications) {
        networks = mockedFilteredByClassificationInsuranceNetworksList;
      }

      return res(ctx.status(200), ctx.json({ networks }));
    }
  ),
  rest.get(
    `${environment.serviceURL}${buildNetworkPath(':networkId')}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ network: mockedInsuranceNetwork })
      );
    }
  ),
  rest.patch(
    `${environment.serviceURL}${buildNetworkPath(':networkId')}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ network: mockedInsuranceNetwork })
      );
    }
  ),
  rest.post(
    `${environment.serviceURL}${NETWORKS_API_PATH}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ network: mockedInsuranceNetwork })
      );
    }
  ),
  rest.delete(
    `${environment.serviceURL}${NETWORKS_API_PATH}/:networkId`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json({}));
    }
  ),
  rest.get(
    `${environment.serviceURL}${buildNetworkCreditCardRulesPath(':networkId')}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ creditCardRules: mockedInsuranceNetworkCreditCardRules })
      );
    }
  ),
  rest.patch(
    `${environment.serviceURL}${buildNetworkCreditCardRulesPath(':networkId')}`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json({}));
    }
  ),
  rest.get(
    `${environment.serviceURL}${buildNetworkServiceLinesPath(':networkId')}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ serviceLines: mockedNetworkServiceLines })
      );
    }
  ),
  rest.get(
    `${environment.serviceURL}${buildNetworkModalityConfigsPath(':networkId')}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.delay(100),
        ctx.json({ configs: mockedNetworkModalityConfigs })
      );
    }
  ),
  rest.patch(
    `${environment.serviceURL}${buildNetworkModalityConfigsPath(':networkId')}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ configs: mockedNetworkModalityConfigs })
      );
    }
  ),
  rest.patch(
    `${environment.serviceURL}${buildNetworkStatesPath(':networkId')}`,
    (_req, res, ctx) => {
      return res.once(
        ctx.status(200),
        ctx.json({ state_abbrs: mockedStateAbbrs })
      );
    }
  ),
  rest.get(
    `${environment.serviceURL}${buildNetworkAppointmentTypesPath(
      ':networkId'
    )}`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({ appointmentTypes: mockedInsuranceNetworkAppointmentTypes })
      );
    }
  ),
  rest.patch(
    `${environment.serviceURL}${buildNetworkAppointmentTypesPath(
      ':networkId'
    )}`,
    (_req, res, ctx) => {
      return res(ctx.status(200), ctx.json({}));
    }
  ),
];

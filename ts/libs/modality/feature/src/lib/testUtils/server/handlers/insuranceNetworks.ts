import { rest, RestHandler } from 'msw';
import {
  mockedInsuranceNetwork,
  mockedMarket,
  environment,
} from '@*company-data-covered*/station/data-access';

export const insuranceNetworksHandler: RestHandler[] = [
  rest.get(
    `${environment.stationURL}/api/insurance_networks/search`,
    (_req, res, ctx) => {
      return res(
        ctx.status(200),
        ctx.json({
          networks: Array(15)
            .fill(mockedInsuranceNetwork)
            .map((insuranceNetwork, index) => ({
              ...insuranceNetwork,
              id: insuranceNetwork.id + index,
              name: `${insuranceNetwork.name} - ${index}`,
              state_abbrs: [mockedMarket.state],
            })),
        })
      );
    }
  ),
];

import { rest, RestHandler } from 'msw';
import {
  buildCachePath,
  buildCheckMarketFeasibilityPath,
  environment,
  mockSelfScheduleData,
  buildNotificationsPath,
  buildNotificationJobPath,
  mockCreateNotificationJobResponse,
  mockCheckMarketFeasibilityData,
  buildInsuranceNetworksPath,
  mockedInsuranceNetworksList,
  buildPlacesOfServicePath,
  mockPlacesOfService,
  buildInsuranceClassificationsPath,
  mockedInsuranceClassifications,
  buildCareRequestPath,
  mockCareRequest,
  buildCareRequestStatusPath,
  buildEtaRangesPath,
  mockEtaRange,
  mockCreateCareRequestResponse,
  buildGetRiskStratificationProtocolPath,
  mockRiskStratificationProtocol,
  buildChannelItemPath,
  mockChannelItem,
} from '@*company-data-covered*/consumer-web/online-self-scheduling/data-access';

export const buildCacheApiPath = () =>
  `${environment.serviceURL}${buildCachePath()}`;

export const buildCreateNotificationJobApiPath = () =>
  `${environment.serviceURL}${buildNotificationsPath()}`;

export const buildDeleteNotificationJobApiPath = () =>
  `${environment.serviceURL}${buildNotificationJobPath(':jobId')}`;

export const buildInsuranceNetworksApiPath = () =>
  `${environment.serviceURL}${buildInsuranceNetworksPath()}`;

export const buildPlacesOfServiceApiPath = () =>
  `${environment.serviceURL}${buildPlacesOfServicePath(':billingCityId')}`;

export const buildCheckMarketFeasibilityApiPath = () =>
  `${environment.serviceURL}${buildCheckMarketFeasibilityPath()}`;

export const buildInsuranceClassificationsApiPath = () =>
  `${environment.serviceURL}${buildInsuranceClassificationsPath()}`;

export const buildCareRequestApiPath = () =>
  `${environment.serviceURL}${buildCareRequestPath()}`;

export const buildCareRequestStatusApiPath = () =>
  `${environment.serviceURL}${buildCareRequestStatusPath()}`;

export const buildEtaRangesApiPath = () =>
  `${environment.serviceURL}${buildEtaRangesPath()}`;

export const buildGetRiskStratificationProtocolApiPath = () =>
  `${environment.serviceURL}${buildGetRiskStratificationProtocolPath(':id')}`;

export const buildChannelItemApiPath = () =>
  `${environment.serviceURL}${buildChannelItemPath(':channelItemId')}`;

export const selfScheduleHandlers: RestHandler[] = [
  rest.get(`${buildPlacesOfServiceApiPath()}`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockPlacesOfService }));
  }),
  rest.get(`${buildCacheApiPath()}`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockSelfScheduleData }));
  }),
  rest.get(`${buildInsuranceClassificationsApiPath()}`, (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: mockedInsuranceClassifications })
    );
  }),
  rest.post(`${buildCacheApiPath()}`, (_req, res, ctx) => {
    return res(ctx.status(201));
  }),
  rest.post(`${buildCreateNotificationJobApiPath()}`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json(mockCreateNotificationJobResponse));
  }),
  rest.delete(`${buildDeleteNotificationJobApiPath()}`, (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }));
  }),
  rest.post(buildInsuranceNetworksApiPath(), (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: mockedInsuranceNetworksList })
    );
  }),
  rest.post(buildCheckMarketFeasibilityApiPath(), (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: mockCheckMarketFeasibilityData })
    );
  }),
  rest.get(buildCareRequestApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockCareRequest }));
  }),
  rest.patch(buildCareRequestStatusApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ success: true }));
  }),
  rest.post(buildEtaRangesApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockEtaRange }));
  }),
  rest.put(buildCareRequestApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockCareRequest }));
  }),
  rest.post(buildCareRequestApiPath(), (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: mockCreateCareRequestResponse })
    );
  }),
  rest.get(buildGetRiskStratificationProtocolApiPath(), (_req, res, ctx) => {
    return res(
      ctx.status(200),
      ctx.json({ data: mockRiskStratificationProtocol })
    );
  }),
  rest.get(buildChannelItemApiPath(), (_req, res, ctx) => {
    return res(ctx.status(200), ctx.json({ data: mockChannelItem }));
  }),
];

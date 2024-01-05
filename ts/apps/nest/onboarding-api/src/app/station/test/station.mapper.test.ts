import mapper from '../station.mapper';
import {
  CREATE_CARE_REQUEST_RESPONSE,
  RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
  RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK,
  STATION_CARE_REQUEST_RESPONSE,
  STATION_RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK,
} from './mocks/station.service.mock';
import {
  CARE_REQUEST_MOCK,
  CARE_REQUEST_RESPONSE_MOCK,
  STATION_CARE_REQUEST_MOCK,
  STATION_CARE_REQUEST_RESPONSE_MOCK,
  STATION_RISK_STRATIFICATION_PROTOCOL_SEARCH_PARAM,
  STATION_TIME_WINDOWS_AVAILABILITIES_MOCK,
  TIME_WINDOWS_AVAILABILITIES_MOCK,
} from './mocks/station.mapper.mock';
import {
  ACCEPT_IF_FEASIBLE_CARE_REQUEST_MOCK,
  STATION_ACCEPT_IF_FEASIBLE_CARE_REQUEST_MOCK,
  STATION_UPDATE_CARE_REQUEST_MOCK,
  UPDATE_CARE_REQUEST_MOCK,
} from '../../self-schedule/test/mocks/self-schedule.mock';
import {
  OssCareRequest,
  OssStationCareRequest,
} from '@*company-data-covered*/consumer-web-types';
import {
  MOCK_CHANNEL_ITEM,
  MOCK_STATION_CHANNEL_ITEM,
} from '../../channel-items/test/mocks/channel-items.mock';

describe('OssCareRequestToOssStationCareRequest mapper', () => {
  it('should transform oss care request into oss station care request', () => {
    const transformedResult = mapper.OssCareRequestToOssStationCareRequest(
      CREATE_CARE_REQUEST_RESPONSE
    );
    expect(transformedResult).toEqual({
      ...STATION_CARE_REQUEST_RESPONSE,
      care_request: {
        ...STATION_CARE_REQUEST_RESPONSE.care_request,
        caller: undefined,
      },
    });
  });

  it('should transform oss care request into oss station care request without risk assessment', () => {
    const careRequestResponse: OssCareRequest = {
      ...CREATE_CARE_REQUEST_RESPONSE,
      riskAssessment: undefined,
    };

    const stationCareRequestResponse: OssStationCareRequest = {
      ...STATION_CARE_REQUEST_RESPONSE,
      risk_assessment: undefined,
      care_request: {
        ...STATION_CARE_REQUEST_RESPONSE.care_request,
        caller: undefined,
      },
    };

    const transformedResult =
      mapper.OssCareRequestToOssStationCareRequest(careRequestResponse);
    expect(transformedResult).toEqual(stationCareRequestResponse);
  });
});

describe('OssStationCareRequestToOssCareRequest mapper', () => {
  it('should transform oss station care request into oss care request', () => {
    const transformedResult = mapper.OssStationCareRequestToOssCareRequest(
      STATION_CARE_REQUEST_RESPONSE
    );

    expect(transformedResult).toEqual(CREATE_CARE_REQUEST_RESPONSE);
  });

  it('should transform oss station care request into oss care request  without risk assessment', () => {
    const careRequestResponse: OssCareRequest = {
      ...CREATE_CARE_REQUEST_RESPONSE,
      riskAssessment: undefined,
    };

    const stationCareRequestResponse: OssStationCareRequest = {
      ...STATION_CARE_REQUEST_RESPONSE,
      risk_assessment: undefined,
    };

    const transformedResult = mapper.OssStationCareRequestToOssCareRequest(
      stationCareRequestResponse
    );

    expect(transformedResult).toEqual(careRequestResponse);
  });
});

describe('transform risk stratification protocol search param', () => {
  it('transform risk stratification protocol search param to station risk stratification protocol search param', async () => {
    const transformedResult = mapper.SearchRSPToStationRSP({
      ...RISK_STRATIFICATION_PROTOCOL_SEARCH_QUERY_MOCK,
      keywords: 'face hurts',
      serviceLineId: 1,
      marketId: 159,
      highRisk: true,
    });
    expect(transformedResult).toEqual(
      STATION_RISK_STRATIFICATION_PROTOCOL_SEARCH_PARAM
    );
  });
});

describe('transform risk stratification protocol search param', () => {
  it('transform risk stratification protocol search param to station risk stratification protocol search param', async () => {
    const transformedResult = mapper.StationRSPToProtocolWithQuestions(
      STATION_RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK
    );

    expect(transformedResult).toEqual(
      RISK_STRATIFICATION_PROTOCOL_SEARCH_RESULT_MOCK
    );
  });
});

describe('transform update care request payload', () => {
  it('transform update care request payload to station update care request payload', async () => {
    const transformedResult =
      mapper.UpdateCareRequestPayloadToStationUpdateCareRequestPayload(
        UPDATE_CARE_REQUEST_MOCK
      );

    expect(transformedResult).toEqual(STATION_UPDATE_CARE_REQUEST_MOCK);
  });

  it('transform update care request payload to station update care request payload without shiftTimeId', async () => {
    const transformedResult =
      mapper.UpdateCareRequestPayloadToStationUpdateCareRequestPayload({
        ...UPDATE_CARE_REQUEST_MOCK,
        shiftTeamId: undefined,
      });

    expect(transformedResult).toEqual(STATION_UPDATE_CARE_REQUEST_MOCK);
  });

  it('transform station care request to care request', async () => {
    const transformedResult = mapper.StationCareRequestToCareRequest(
      STATION_CARE_REQUEST_RESPONSE_MOCK
    );

    expect(transformedResult).toEqual(CARE_REQUEST_RESPONSE_MOCK);
  });

  it('transform station care request to care request if input is null', async () => {
    expect(() => mapper.StationCareRequestToCareRequest(null)).toThrowError(
      'StationCareRequestToCareRequest: input is not specified'
    );
  });

  it('transform care request to station care request', async () => {
    const transformedResult =
      mapper.CareRequestToStationCareRequest(CARE_REQUEST_MOCK);

    expect(transformedResult).toEqual(STATION_CARE_REQUEST_MOCK);
  });
});

describe('transform accept if feasible care request payload', () => {
  it('transform accept if feasible care request payload to station accept if feasible care request payload', async () => {
    const transformedResult =
      mapper.AcceptCareRequestIfFeasiblePayloadToStationAcceptCareRequestIfFeasiblePayload(
        ACCEPT_IF_FEASIBLE_CARE_REQUEST_MOCK
      );
    expect(transformedResult).toEqual(
      STATION_ACCEPT_IF_FEASIBLE_CARE_REQUEST_MOCK
    );
  });

  it('transform accept if feasible care request payload to station accept if feasible care request payload without shiftTimeId', async () => {
    const transformedResult =
      mapper.AcceptCareRequestIfFeasiblePayloadToStationAcceptCareRequestIfFeasiblePayload(
        {
          ...ACCEPT_IF_FEASIBLE_CARE_REQUEST_MOCK,
          shiftTeamId: undefined,
        }
      );

    expect(transformedResult).toEqual(
      STATION_ACCEPT_IF_FEASIBLE_CARE_REQUEST_MOCK
    );
  });
});

describe('transform care request time windows availabilities', () => {
  it('transform care request time windows availabilities with available/unavailable time windows', async () => {
    const transformedResult =
      mapper.StationTimeWindowsAvailabilitiesToTimeWindowsAvailabilities(
        STATION_TIME_WINDOWS_AVAILABILITIES_MOCK
      );
    expect(transformedResult).toEqual(TIME_WINDOWS_AVAILABILITIES_MOCK);
  });
});

describe('transform channel item', () => {
  it('transform station channel item to channel item', async () => {
    const transformedResult = mapper.StationChannelItemToChannelItem(
      MOCK_STATION_CHANNEL_ITEM
    );
    expect(transformedResult).toEqual(MOCK_CHANNEL_ITEM);
  });
});

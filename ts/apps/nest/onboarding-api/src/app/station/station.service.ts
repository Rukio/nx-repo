import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { Logger } from 'winston';
import { lastValueFrom } from 'rxjs';
import { InjectLogger } from '../decorators/logger.decorator';
import { AuthService } from '@*company-data-covered*/nest/auth';
import {
  BillingCityPlaceOfService,
  CheckMarketAvailability,
  CheckMarketAvailabilityBody,
  State,
  EtaRange,
  StationBillingCityPlaceOfService,
  StationCheckMarketAvailabilityBody,
  OssCareRequest,
  OssStationCareRequest,
  StationEtaRange,
  StationRiskStratificationProtocolSearchParam,
  ProtocolWithQuestions,
  RiskStratificationProtocolSearchParam,
  StationAcceptCareRequestIfFeasiblePayload,
  StationCareRequestStatusPayload,
  OssCareRequestStatusPayload,
  OssCareRequestAcceptIfFeasible,
  InsuranceClassification,
  CareRequest,
  StationCareRequest,
  TimeWindowsAvailability,
  ChannelItem,
} from '@*company-data-covered*/consumer-web-types';
import mapper from './station.mapper';
import EtaRangeQueryDTO from '../self-schedule/dto/create-eta-range.dto';

@Injectable()
export default class StationService {
  constructor(
    @InjectLogger() private logger: Logger,
    private configService: ConfigService,
    private httpService: HttpService,
    private authService: AuthService
  ) {}

  /** Retrieves the base path for the Station service from the config service. */
  get basePath() {
    return `${this.configService.get('STATION_URL')}`;
  }

  /** Retrieves an object with all the headers required to communicate with Station APIs. Formatted for Axios request configuration. */
  private async getCommonHeaders(
    authToken?: string
  ): Promise<Record<string, string>> {
    if (authToken) {
      return {
        Authorization: authToken,
        'Content-Type': 'application/json',
        Accept: 'application/vnd.*company-data-covered*.com; version=1',
      };
    }

    return {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.*company-data-covered*.com; version=1',
    };
  }

  private async getAuthToken(): Promise<string> {
    const { authorizationValue } = await this.authService.getToken();

    return authorizationValue;
  }

  async cancelNotification(jobId: string): Promise<{ success: boolean }> {
    const url = `${this.basePath}/api/onboarding/notification/${jobId}`;

    const token = await this.getAuthToken();

    await lastValueFrom(
      this.httpService.delete(url, {
        headers: await this.getCommonHeaders(token),
      })
    );

    return { success: true };
  }

  async createNotification(
    careRequestId: string
  ): Promise<{ success: boolean; jobId: string }> {
    const url = `${this.basePath}/api/onboarding/notification`;

    const token = await this.getAuthToken();

    const response = await lastValueFrom(
      this.httpService.post(
        url,
        { care_request_id: careRequestId },
        {
          headers: await this.getCommonHeaders(token),
        }
      )
    );

    return { success: true, jobId: response.data.job_id };
  }

  async checkMarketFeasibility(
    payload: CheckMarketAvailabilityBody
  ): Promise<CheckMarketAvailability | null> {
    const stationPayload: StationCheckMarketAvailabilityBody =
      mapper.CheckMarketFeasibilityBodyToStationCheckMarketFeasibilityBody(
        payload
      );

    const url = `${this.basePath}/api/markets/check_availability`;

    const token = await this.getAuthToken();

    const response = await lastValueFrom(
      this.httpService.post(url, stationPayload, {
        headers: await this.getCommonHeaders(token),
      })
    );

    return response.data;
  }

  async fetchPlacesOfService(
    billingCityId: string
  ): Promise<BillingCityPlaceOfService[]> {
    const url = `${this.basePath}/api/billing_cities/${billingCityId}/places_of_service`;
    const token = await this.getAuthToken();
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(token),
      })
    );

    const result: BillingCityPlaceOfService[] = response.data
      ? response.data.map((placeOfService: StationBillingCityPlaceOfService) =>
          mapper.StationBillingCityPlaceOfServiceToBillingCityPlaceOfService(
            placeOfService
          )
        )
      : [];

    return result;
  }

  async fetchStates(): Promise<State[]> {
    const url = `${this.basePath}/admin/states.json`;
    const token = await this.getAuthToken();
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(token),
      })
    );
    const data: State[] = response.data.active.map(mapper.StationStateToState);

    return data;
  }

  async createOssCareRequest(payload: OssCareRequest): Promise<OssCareRequest> {
    const stationPayload: OssStationCareRequest =
      mapper.OssCareRequestToOssStationCareRequest(payload);
    const url = `${this.basePath}/api/self_schedule/care_requests`;

    const token = await this.getAuthToken();

    const response = await lastValueFrom(
      this.httpService.post(url, stationPayload, {
        headers: await this.getCommonHeaders(token),
      })
    );

    return mapper.OssStationCareRequestToOssCareRequest(response.data);
  }

  async createEta(payload: EtaRangeQueryDTO): Promise<EtaRange> {
    const stationParam: StationEtaRange =
      mapper.EtaRangeToStationEtaRange(payload);

    const url = `${this.basePath}/api/care_requests/${payload.careRequestId}/eta_ranges.json`;

    const token = await this.getAuthToken();
    const response = await lastValueFrom(
      this.httpService.post(
        url,
        {
          eta_range: stationParam,
        },
        {
          headers: await this.getCommonHeaders(token),
        }
      )
    );

    return mapper.StationEtaRangeToEtaRange(response.data);
  }

  async fetchRiskStratificationProtocol(
    params: RiskStratificationProtocolSearchParam,
    protocolId: number | string
  ): Promise<ProtocolWithQuestions> {
    const stationQuery: StationRiskStratificationProtocolSearchParam =
      mapper.SearchRSPToStationRSP(params);
    const url = `${this.basePath}/api/risk_stratification_protocols/${protocolId}`;
    const token = await this.getAuthToken();
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(token),
        params: stationQuery,
      })
    );

    if (!response.data.id) {
      throw new Error(
        `Failed to get risk stratification protocol with id: ${protocolId}`
      );
    }

    const data: ProtocolWithQuestions =
      mapper.StationRSPToProtocolWithQuestions(response.data);

    return data;
  }

  async updateCareRequestStatus(
    payload: OssCareRequestStatusPayload,
    useToken = true
  ): Promise<boolean> {
    const stationPayload: StationCareRequestStatusPayload =
      mapper.UpdateCareRequestPayloadToStationUpdateCareRequestPayload(payload);

    const url = `${this.basePath}/api/care_requests/${payload.careRequestId}/update_status`;

    const token = await this.getAuthToken();

    const response = await lastValueFrom(
      this.httpService.patch(url, stationPayload, {
        headers: await this.getCommonHeaders(useToken ? token : null),
      })
    );

    return !!response;
  }

  async accepCareRequesttIfFeasible(
    payload: OssCareRequestAcceptIfFeasible
  ): Promise<boolean> {
    const stationPayload: StationAcceptCareRequestIfFeasiblePayload =
      mapper.AcceptCareRequestIfFeasiblePayloadToStationAcceptCareRequestIfFeasiblePayload(
        payload
      );
    const url = `${this.basePath}/api/care_requests/${payload.careRequestId}/accept_if_feasible`;

    const response = await lastValueFrom(
      this.httpService.patch(url, stationPayload, {
        headers: await this.getCommonHeaders(null),
      })
    );

    return !!response;
  }

  async getTimeWindowsAvailability(
    careRequestId: string
  ): Promise<TimeWindowsAvailability[]> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/time_windows_availability`;

    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    if (!response.data?.time_windows_availability) {
      return [];
    }

    const data: TimeWindowsAvailability[] =
      mapper.StationTimeWindowsAvailabilitiesToTimeWindowsAvailabilities(
        response.data.time_windows_availability
      );

    return data;
  }

  async getClassifications(): Promise<InsuranceClassification[]> {
    const url = `${this.basePath}/api/insurance_classifications`;

    const token = await this.getAuthToken();

    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(token),
      })
    );
    if (!response.data) {
      return [];
    }

    return response.data;
  }

  async getCareRequest(
    careRequestId: string,
    useToken = true
  ): Promise<CareRequest> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}`;

    const token = await this.getAuthToken();

    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(useToken ? token : null),
      })
    );

    const data: CareRequest = mapper.StationCareRequestToCareRequest(
      response.data
    );

    return data;
  }

  async updateCareRequest(
    id: string,
    payload: Omit<CareRequest, 'id'>,
    useToken = true
  ): Promise<CareRequest> {
    const stationPayload: StationCareRequest =
      mapper.CareRequestToStationCareRequest(payload);

    const url = `${this.basePath}/api/care_requests/${id}`;

    const token = await this.getAuthToken();

    const response = await lastValueFrom(
      this.httpService.put(
        url,
        { care_request: stationPayload },
        {
          headers: await this.getCommonHeaders(useToken ? token : null),
        }
      )
    );

    const data: CareRequest = mapper.StationCareRequestToCareRequest(
      response.data
    );

    return data;
  }

  async fetchChannelItem(id: string, useToken = true): Promise<ChannelItem> {
    const url = `${this.basePath}/api/channel_items/${id}`;

    const token = await this.getAuthToken();

    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(useToken ? token : null),
      })
    );

    const data: ChannelItem = mapper.StationChannelItemToChannelItem(
      response.data
    );

    return data;
  }
}

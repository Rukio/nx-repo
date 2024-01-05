import { Injectable } from '@nestjs/common';
import {
  CareRequest,
  StationCareRequest,
  PartnerReferral,
  CareRequestStatus,
  CareRequestAcceptIfFeasible,
  TimeWindowsAvailability,
} from '@*company-data-covered*/consumer-web-types';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { Logger } from 'winston';
import { InjectLogger } from '../decorators/logger.decorator';
import mapper from './care-request.mapper';
import stationMapper from '../station/station.mapper';
import StationService from '../station/station.service';

@Injectable()
export default class CareRequestService {
  constructor(
    @InjectLogger() private logger: Logger,
    private configService: ConfigService,
    private httpService: HttpService,
    private stationService: StationService
  ) {}

  /** Retrieves the base path for the Station service from the config service. */
  get basePath() {
    return `${this.configService.get('STATION_URL')}`;
  }

  /** Retrieves an object with all of the headers required to communicate with Station APIs. Formatted for Axios request configuration. */
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

  async create(payload: Omit<CareRequest, 'id'>): Promise<CareRequest> {
    const stationPayload: StationCareRequest =
      stationMapper.CareRequestToStationCareRequest(payload);

    const url = `${this.basePath}/api/care_requests`;

    const response = await lastValueFrom(
      this.httpService.post(
        url,
        { care_request: stationPayload },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );

    const data: CareRequest = stationMapper.StationCareRequestToCareRequest(
      response.data
    );

    return data;
  }

  fetch(id: string): Promise<CareRequest> {
    return this.stationService.getCareRequest(id, false);
  }

  async update(
    id: string,
    payload: Omit<CareRequest, 'id'>
  ): Promise<CareRequest> {
    const authHeader = <string>(
      this.httpService.axiosRef.defaults.headers.common.authorization
    );

    if (payload.partnerReferral?.id) {
      await this.patchPartnerReferral(
        payload.partnerReferral?.id,
        payload.partnerReferral,
        authHeader
      );
    }

    return this.stationService.updateCareRequest(id, payload, false);
  }

  async patch(id: string, payload: Partial<CareRequest>): Promise<CareRequest> {
    const stationPayload: Partial<StationCareRequest> =
      mapper.CareRequestToStationCareRequestPatch(payload);

    const url = `${this.basePath}/api/care_requests/${id}`;
    const authHeader = <string>(
      this.httpService.axiosRef.defaults.headers.common.authorization
    );

    if (payload.partnerReferral?.id) {
      await this.patchPartnerReferral(
        payload.partnerReferral?.id,
        payload.partnerReferral,
        authHeader
      );
    }

    const response = await lastValueFrom(
      this.httpService.patch(
        url,
        { care_request: stationPayload },
        {
          headers: await this.getCommonHeaders(authHeader),
        }
      )
    );

    const data: CareRequest = stationMapper.StationCareRequestToCareRequest(
      response.data
    );

    return data;
  }

  async updateStatus(id: string, payload: CareRequestStatus): Promise<boolean> {
    return this.stationService.updateCareRequestStatus(
      {
        ...payload,
        careRequestId: id,
      },
      false
    );
  }

  async acceptIfFeasible(
    id: string,
    payload: CareRequestAcceptIfFeasible
  ): Promise<boolean> {
    return this.stationService.accepCareRequesttIfFeasible({
      ...payload,
      careRequestId: id,
    });
  }

  getTimeWindowsAvailability(id: string): Promise<TimeWindowsAvailability[]> {
    return this.stationService.getTimeWindowsAvailability(id);
  }

  async assignChannelItem(
    id: string,
    channelItemId: number
  ): Promise<CareRequest> {
    const stationPayload = {
      care_request: {
        id,
        channel_item_id: channelItemId,
      },
    };

    const url = `${this.basePath}/api/care_requests/${id}/update_channel_item`;

    const response = await lastValueFrom(
      this.httpService.patch(url, stationPayload, {
        headers: await this.getCommonHeaders(),
      })
    );

    return stationMapper.StationCareRequestToCareRequest(response.data);
  }

  async patchPartnerReferral(
    partnerReferralId: number | string,
    partnerData: PartnerReferral,
    authHeader?: string
  ): Promise<PartnerReferral> {
    try {
      const url = `${this.basePath}/api/partner_referrals/${partnerReferralId}`;
      const response = await lastValueFrom(
        this.httpService.patch(
          url,
          {
            contact_relationship_to_patient: partnerData.relationship,
            contact_phone: partnerData.phone,
            contact_name: `${partnerData.firstName} ${partnerData.lastName}`,
          },
          {
            headers: await this.getCommonHeaders(authHeader),
          }
        )
      );

      const data: PartnerReferral =
        mapper.StationPartnerReferraltoPartnerReferral(response.data);

      return data;
    } catch (err) {
      this.logger.error(`Partner Referral update error: ${err?.message}`, [
        partnerData.id,
      ]);

      return null;
    }
  }
}

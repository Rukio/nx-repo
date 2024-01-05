import { Injectable } from '@nestjs/common';
import StationService from '../station/station.service';
import {
  BillingCityPlaceOfService,
  CheckMarketAvailability,
  CheckMarketAvailabilityBody,
  OssCareRequest,
  EtaRange,
  ProtocolWithQuestions,
  RiskStratificationProtocolSearchParam,
  InsurancePayer,
  OSSUserCache,
  OssCareRequestStatusPayload,
  InsuranceNetwork,
  InsuranceClassification,
  CareRequest,
  ChannelItem,
} from '@*company-data-covered*/consumer-web-types';
import EtaRangeQueryDTO from './dto/create-eta-range.dto';
import { InjectRedis } from '@*company-data-covered*/nest/redis';
import Redis from 'ioredis';
import GetInsurancePayerDto from './dto/insurance-payer.dto';
import InsuranceNetworksService from '../insurance-networks/insurance-networks.service';
import SearchInsuranceNetworksDto from '../insurance-networks/dto/insurance-networks-body.dto';

// set the cache TTL to 8 hours. Value presented in seconds - 60 secs * 60 mins * 8 hours
export const USER_CACHE_EXP = 60 * 60 * 8;

@Injectable()
export default class SelfScheduleService {
  constructor(
    private stationService: StationService,
    @InjectRedis() private readonly redis: Redis,
    private insuranceNetworksService: InsuranceNetworksService
  ) {}

  cancelNotification(jobId: string): Promise<{ success: boolean }> {
    return this.stationService.cancelNotification(jobId);
  }

  createNotification(
    careRequestId: string
  ): Promise<{ success: boolean; jobId: string }> {
    return this.stationService.createNotification(careRequestId);
  }

  checkMarketFeasibility(
    payload: CheckMarketAvailabilityBody
  ): Promise<CheckMarketAvailability | null> {
    return this.stationService.checkMarketFeasibility(payload);
  }

  fetchPlacesOfService(
    billingCityId: string
  ): Promise<BillingCityPlaceOfService[]> {
    return this.stationService.fetchPlacesOfService(billingCityId);
  }

  createCareRequest(payload: OssCareRequest): Promise<OssCareRequest> {
    return this.stationService.createOssCareRequest(payload);
  }

  createEta(payload: EtaRangeQueryDTO): Promise<EtaRange> {
    return this.stationService.createEta(payload);
  }

  fetchRiskStratificationProtocol(
    params: RiskStratificationProtocolSearchParam,
    protocolId: number | string
  ): Promise<ProtocolWithQuestions> {
    return this.stationService.fetchRiskStratificationProtocol(
      params,
      protocolId
    );
  }

  getInsurancePayers(payload: GetInsurancePayerDto): Promise<InsurancePayer[]> {
    return this.insuranceNetworksService.listInsurancePayers(payload);
  }

  async fetchCache(userId: string): Promise<OSSUserCache | null> {
    const stringifiedCache = await this.redis.get(userId);
    if (stringifiedCache) {
      return JSON.parse(stringifiedCache);
    }

    return null;
  }

  async setCache(userId: string, cacheData: OSSUserCache): Promise<void> {
    const response = await this.redis.set(
      userId,
      JSON.stringify(cacheData),
      'EX',
      USER_CACHE_EXP
    );

    if (response !== 'OK') {
      throw new Error(`Redis returned unexpected response: ${response}`);
    }
  }

  updateCareRequestStatus(
    payload: OssCareRequestStatusPayload
  ): Promise<boolean> {
    return this.stationService.updateCareRequestStatus(payload);
  }

  searchInsuranceNetworks(
    payload: SearchInsuranceNetworksDto
  ): Promise<InsuranceNetwork[]> {
    return this.insuranceNetworksService.search(payload);
  }

  getClassifications(): Promise<InsuranceClassification[]> {
    return this.stationService.getClassifications();
  }

  getCareRequest(careRequestId: string): Promise<CareRequest> {
    return this.stationService.getCareRequest(careRequestId);
  }

  updateCareRequest(
    id: string,
    payload: Omit<CareRequest, 'id'>
  ): Promise<CareRequest> {
    return this.stationService.updateCareRequest(id, payload);
  }

  fetchChannelItem(id: string): Promise<ChannelItem> {
    return this.stationService.fetchChannelItem(id);
  }
}

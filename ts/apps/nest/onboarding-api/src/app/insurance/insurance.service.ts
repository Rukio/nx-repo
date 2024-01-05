import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  Insurance,
  InsuranceParams,
  StationInsurance,
  StationInsuranceParams,
  InsuranceEligibility,
  SelfUploadInsurance,
  InsuranceClassification,
} from '@*company-data-covered*/consumer-web-types';
import {
  HttpStatus,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { lastValueFrom } from 'rxjs';
import { Logger } from 'winston';
import { InjectLogger } from '../decorators/logger.decorator';
import mapper from './insurance.mapper';
import InsuranceQueryDto from './dto/insurance-query.dto';
import StationService from '../station/station.service';

@Injectable()
export default class InsuranceService {
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

  private async getInsuranceEligibility(
    query: InsuranceQueryDto,
    insuranceId: string,
    authHeader?: string
  ): Promise<InsuranceEligibility> {
    const { patientId, careRequestId, marketId } = query;
    const syncUserInsurances: InsuranceEligibility[] =
      await this.checkEligibility(
        patientId,
        careRequestId,
        marketId,
        authHeader
      );

    return syncUserInsurances.find(
      (ie: InsuranceEligibility) => ie.id.toString() === insuranceId
    );
  }

  async fetch(query: InsuranceQueryDto): Promise<Insurance[]> {
    const { patientId, careRequestId, marketId } = query;
    const url = `${this.basePath}/api/patients/${patientId}/insurances`;
    const authHeader = <string>(
      this.httpService.axiosRef.defaults.headers.common.authorization
    );
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );
    const data: Insurance[] = response.data.map(
      mapper.StationInsuranceToInsurance
    );
    try {
      const syncUserInsurances: InsuranceEligibility[] =
        careRequestId && marketId
          ? await this.checkEligibility(
              patientId,
              careRequestId,
              marketId,
              authHeader
            )
          : [];
      if (syncUserInsurances.length) {
        return data.map((insurance: Insurance) => {
          const insuranceItem = insurance;
          const insuranceEligibility: InsuranceEligibility =
            syncUserInsurances.find(
              (ie: InsuranceEligibility) => ie.id === insurance.id
            );
          if (insuranceEligibility) {
            insuranceItem.eligible = insuranceEligibility.eligible;
            insuranceItem.eligibilityMessage =
              insuranceEligibility.eligibilityMessage;
          }

          return insuranceItem;
        });
      }
    } catch (err) {
      this.logger.error(
        `Insurance fetch - eligibility error: ${err?.message}`,
        [query]
      );
    }

    return data;
  }

  async create(
    query: InsuranceQueryDto,
    payload: InsuranceParams
  ): Promise<Insurance> {
    const { patientId } = query;
    const stationPayload: StationInsuranceParams =
      mapper.InsuranceParamsToStationInsuranceParams(payload);
    const url = `${this.basePath}/api/patients/${patientId}/insurances`;
    const authHeader = <string>(
      this.httpService.axiosRef.defaults.headers.common.authorization
    );
    const response = await lastValueFrom(
      this.httpService.post(url, stationPayload, {
        headers: await this.getCommonHeaders(),
      })
    );
    const data: Insurance = mapper.StationInsuranceToInsurance(response.data);

    if (data?.id) {
      try {
        const insuranceEligibility: InsuranceEligibility =
          await this.getInsuranceEligibility(
            query,
            data.id.toString(),
            authHeader
          );
        if (insuranceEligibility) {
          data.eligible = insuranceEligibility.eligible;
          data.eligibilityMessage = insuranceEligibility.eligibilityMessage;
        }
      } catch (err) {
        this.logger.error(
          `Insurance create - eligibility error: ${err?.message}`,
          [data.id, query]
        );
      }
    }

    return data;
  }

  async update(
    query: InsuranceQueryDto,
    insuranceId: string,
    payload: Insurance
  ): Promise<Insurance> {
    const { patientId } = query;
    const stationPayload: StationInsurance =
      mapper.InsuranceToStationInsurance(payload);
    const url = `${this.basePath}/api/patients/${patientId}/insurances/${insuranceId}`;
    const authHeader = <string>(
      this.httpService.axiosRef.defaults.headers.common.authorization
    );

    const insurancePayload = { insurance: stationPayload };
    const response = await lastValueFrom(
      this.httpService.put(url, insurancePayload, {
        headers: await this.getCommonHeaders(),
      })
    );

    const data: Insurance = mapper.StationInsuranceToInsurance(response.data);

    if (data) {
      try {
        const insuranceEligibility: InsuranceEligibility =
          await this.getInsuranceEligibility(
            query,
            data.id.toString(),
            authHeader
          );
        if (insuranceEligibility) {
          data.eligible = insuranceEligibility.eligible;
          data.eligibilityMessage = insuranceEligibility.eligibilityMessage;
        }
      } catch (err) {
        this.logger.error(
          `Insurance update - eligibility error: ${err?.message}`,
          [data.id, query]
        );
      }
    }

    return data;
  }

  async remove(
    patientId: number | string,
    insuranceId: string
  ): Promise<{ success: boolean } | null> {
    try {
      const url = `${this.basePath}/api/patients/${patientId}/insurances/${insuranceId}`;
      await lastValueFrom(
        this.httpService.delete(url, {
          headers: await this.getCommonHeaders(),
        })
      );

      return { success: true };
    } catch (error) {
      if (error.isAxiosError && error.response) {
        if (error.response.status === HttpStatus.NOT_FOUND) {
          return null;
        }
        if (error.response.status === HttpStatus.UNAUTHORIZED) {
          throw new UnauthorizedException();
        }
      }

      throw new NotFoundException(`Insurance doesn't exist`);
    }
  }

  async checkEligibility(
    patientId: number | string,
    careRequestId: number | string,
    marketId: number | string,
    authHeader?: string
  ): Promise<InsuranceEligibility[]> {
    const url = `${this.basePath}/api/patients/${patientId}/care_requests/${careRequestId}/insurances/sync`;
    const response = await lastValueFrom(
      this.httpService.patch(
        url,
        { market_id: marketId },
        {
          headers: await this.getCommonHeaders(authHeader),
        }
      )
    );

    const data: InsuranceEligibility[] = response.data.map(
      mapper.StationInsuranceEligibilityToInsuranceEligibility
    );

    return data;
  }

  async getSelfUploadInsurance(
    careRequestId: number | string
  ): Promise<SelfUploadInsurance | null> {
    const url = `${this.basePath}/api/onboarding/self_upload_insurances/${careRequestId}`;

    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );
    if (!response.data) {
      return null;
    }

    const data: SelfUploadInsurance =
      mapper.StationSelfUploadInsuranceToSelfUploadInsurance(response.data);

    return data;
  }

  async getClassifications(): Promise<InsuranceClassification[]> {
    return this.stationService.getClassifications();
  }
}

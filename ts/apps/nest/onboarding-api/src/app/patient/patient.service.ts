import {
  BadRequestException,
  Inject,
  Injectable,
  OnModuleInit,
  ServiceUnavailableException,
} from '@nestjs/common';
import { Metadata } from '@grpc/grpc-js';
import {
  EhrPatient,
  Insurance,
  InsuranceNetwork,
  InsuranceParams,
  OssInsurance,
  Patient,
  StationPatient,
  StationPatientSearchParam,
  UnverifiedPatient,
  WebRequestPatient,
} from '@*company-data-covered*/consumer-web-types';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { lastValueFrom } from 'rxjs';
import { ClientGrpc } from '@nestjs/microservices';
import {
  CreateInsuranceRequest,
  CreateInsuranceResponse,
  CreatePatientRequest,
  CreatePatientResponse,
  GetPatientRequest,
  GetPatientResponse,
  HealthCheckRequest,
  ListInsurancesRequest,
  ListInsurancesResponse,
  PATIENTS_PACKAGE_NAME,
  PATIENTS_SERVICE_NAME,
  PatientsServiceClient,
  SearchPatientsRequest,
  SearchPatientsResponse,
  SearchPatientsResult,
  UpdatePatientRequest,
  UpdatePatientResponse,
  CreateUnverifiedPatientRequest,
  CreateUnverifiedPatientResponse,
  UpdateUnverifiedPatientRequest,
  UpdateUnverifiedPatientResponse,
  UpdateInsuranceRequest,
  UpdateInsuranceResponse,
  GetInsuranceRequest,
  GetInsuranceResponse,
  TriggerPatientInsuranceEligibilityCheckRequest,
  FindOrCreatePatientForUnverifiedPatientResponse,
  DeleteInsuranceRequest,
} from '@*company-data-covered*/protos/nest/patients/service';
import mapper from './patient.mapper';
import grpcMapper from './patient.grpc.mapper';
import PatientSearchParamDto from './dto/patient-search-params.dto';
import CreateEhrPatientDto from './dto/create-ehr-patient.dto';
import { AuthService } from '@*company-data-covered*/nest/auth';
import { pagedArray } from '../common/utils';
import PatientAccountsInsuranceQueryDto from '../patient-accounts/dto/patient-insurance-query.dto';
import { Logger } from 'winston';
import { InjectLogger } from '../decorators/logger.decorator';
import CreateEhrRecordDto from '../patient-accounts/dto/create-ehr-record.dto';
import UnverifiedPatientDto from '../patient-accounts/dto/unverified-patient.dto';
import InsuranceNetworksService from '../insurance-networks/insurance-networks.service';

@Injectable()
export default class PatientService implements OnModuleInit {
  private patientsGrpcService: PatientsServiceClient;

  onModuleInit() {
    this.patientsGrpcService = this.client.getService<PatientsServiceClient>(
      PATIENTS_SERVICE_NAME
    );
  }

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private authService: AuthService,
    private insuranceNetworksService: InsuranceNetworksService,
    @Inject(PATIENTS_PACKAGE_NAME)
    private client: ClientGrpc,
    @InjectLogger() private logger: Logger
  ) {}

  get basePath() {
    return `${this.configService.get('STATION_URL')}`;
  }

  private async getCommonHeaders(): Promise<Record<string, string>> {
    return {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.*company-data-covered*.com; version=1',
    };
  }

  private async getMetadata(): Promise<Metadata> {
    const metadata = new Metadata();

    const { authorizationValue } = await this.authService.getToken();
    metadata.add('authorization', authorizationValue);

    return metadata;
  }

  async gRPCHealthCheck(): Promise<string> {
    const grpcPayload: HealthCheckRequest = {};

    const metadata = await this.getMetadata();

    try {
      await lastValueFrom(
        this.patientsGrpcService.healthCheck(grpcPayload, metadata)
      );

      return 'Success!';
    } catch (err) {
      throw new ServiceUnavailableException(
        `Failed to check gRPC connection: ${err?.message}`
      );
    }
  }

  async searchStationPatients(
    payload: PatientSearchParamDto
  ): Promise<Patient[]> {
    const stationPayload: StationPatientSearchParam =
      mapper.SearchPatientToStationSearchPatient(payload);
    const url = `${this.basePath}/api/patients/search`;
    // todo filter using limit and offset
    const response = await lastValueFrom(
      this.httpService.post(url, stationPayload, {
        headers: await this.getCommonHeaders(),
      })
    );
    const data: Patient[] = response.data.map((p) =>
      mapper.StationPatientToPatient(p)
    );

    return data;
  }

  async createGrpcPatient(payload: Patient): Promise<Patient> {
    const grpcPayload: CreatePatientRequest = {
      patient: grpcMapper.PatientToGrpcPatient(payload),
    };

    const metadata = await this.getMetadata();
    const response: CreatePatientResponse = await lastValueFrom(
      this.patientsGrpcService.createPatient(grpcPayload, metadata)
    );

    const data: Patient = grpcMapper.GrpcPatientToPatient(
      response.patient,
      response.consistency_token
    );

    return data;
  }

  async createStationPatient(payload: Patient): Promise<Patient> {
    const stationPayload: StationPatient =
      mapper.PatientToStationPatient(payload);
    const url = `${this.basePath}/api/patients`;
    const response = await lastValueFrom(
      this.httpService.post(url, stationPayload, {
        headers: await this.getCommonHeaders(),
      })
    );

    const data: Patient = mapper.StationPatientToPatient(response.data);

    return data;
  }

  async getStationPatient(patientId: number): Promise<Patient> {
    const url = `${this.basePath}/api/patients/${patientId}`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    const data: Patient = mapper.StationPatientToPatient(response.data);

    return data;
  }

  async getGrpcPatient(patientId: number): Promise<Patient> {
    const grpcPayload: GetPatientRequest = {
      patient_id: patientId.toString(),
    };
    const metadata = await this.getMetadata();

    const response: GetPatientResponse = await lastValueFrom(
      this.patientsGrpcService.getPatient(grpcPayload, metadata)
    );

    const data: Patient = grpcMapper.GrpcPatientToPatient(
      response.patient,
      response.consistency_token
    );

    return data;
  }

  async searchGrpcPatients(payload: PatientSearchParamDto): Promise<Patient[]> {
    const { limit = 20, offset = 0 } = payload;

    const grpcPayload: SearchPatientsRequest =
      grpcMapper.SearchPatientToGrpcSearchPatient(payload);
    const metadata = await this.getMetadata();

    const response: SearchPatientsResponse = await lastValueFrom(
      this.patientsGrpcService.searchPatients(grpcPayload, metadata)
    );

    const pagedPatientsResult: SearchPatientsResult[] = pagedArray(
      grpcMapper.sortSearchResults(response.results),
      limit,
      offset
    );

    const data: Patient[] = pagedPatientsResult.map(
      (grpcPatientResult: SearchPatientsResult) =>
        grpcMapper.GrpcPatientToPatient(
          grpcPatientResult.patient,
          grpcPatientResult.consistency_token
        )
    );

    return data;
  }

  async updateGrpcPatient(
    patientId: number,
    payload: Patient
  ): Promise<Patient> {
    const { consistencyToken } = payload;
    if (!consistencyToken) {
      throw new BadRequestException('Field consistencyToken is required.');
    }

    const grpcPayload: UpdatePatientRequest = {
      patient: grpcMapper.PatientToGrpcPatient(payload, patientId),
      consistency_token: Buffer.from(consistencyToken),
    };
    const metadata = await this.getMetadata();

    const response: UpdatePatientResponse = await lastValueFrom(
      this.patientsGrpcService.updatePatient(grpcPayload, metadata)
    );

    const data: Patient = grpcMapper.GrpcPatientToPatient(
      response.patient,
      response.consistency_token
    );

    return data;
  }

  async updateGrpcUnverifiedPatient(
    patientId: number,
    payload: UnverifiedPatient
  ): Promise<UnverifiedPatient> {
    const { consistencyToken } = payload;
    if (!consistencyToken) {
      throw new BadRequestException('Field consistencyToken is required.');
    }
    const grpcPayload: UpdateUnverifiedPatientRequest = {
      patient: grpcMapper.UnverifiedPatientToGrpcUnverifiedPatient(
        payload,
        patientId
      ),
      consistency_token: Buffer.from(consistencyToken),
    };

    const metadata = await this.getMetadata();

    const response: UpdateUnverifiedPatientResponse = await lastValueFrom(
      this.patientsGrpcService.updateUnverifiedPatient(grpcPayload, metadata)
    );

    return grpcMapper.GrpcUnverifiedPatientToUnverifiedPatient(
      response.patient,
      response.consistency_token
    );
  }

  async updateStationPatient(
    patientId: number,
    payload: Patient
  ): Promise<Patient> {
    const stationPayload: StationPatient =
      mapper.PatientToStationPatient(payload);
    const url = `${this.basePath}/api/patients/${patientId}`;
    const response = await lastValueFrom(
      this.httpService.patch(
        url,
        {
          patient: stationPayload,
        },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );

    const data: Patient = mapper.StationPatientToPatient(response.data);

    return data;
  }

  async getEHRPatient(patientId: number): Promise<EhrPatient[]> {
    const url = `${this.basePath}/api/patients/${patientId}/ehr_show`;
    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    return response.data.map((ehrPatient) =>
      mapper.StationEhrPatientToEhrPatient(ehrPatient)
    );
  }

  async createEHR(
    patientId: number,
    payload: CreateEhrPatientDto
  ): Promise<Patient> {
    const url = `${this.basePath}/api/patients/${patientId}/ehr_create`;
    const response = await lastValueFrom(
      this.httpService.post(
        url,
        { billing_city_id: payload.billingCityId },
        {
          headers: await this.getCommonHeaders(),
        }
      )
    );

    const data: Patient = mapper.StationPatientToPatient(response.data);

    return data;
  }

  async fetchWebRequestPatient(id: number): Promise<WebRequestPatient> {
    const url = `${this.basePath}/api/care_requests/${id}/web_request_patient`;

    const response = await lastValueFrom(
      this.httpService.get(url, {
        headers: await this.getCommonHeaders(),
      })
    );

    if (!response.data) {
      return null;
    }

    const data: WebRequestPatient =
      mapper.StationWebRequestPatientToWebRequestPatient(response.data);

    return data;
  }

  async createUnverifiedPatient(
    payload: UnverifiedPatientDto
  ): Promise<UnverifiedPatient> {
    const grpcPayload: CreateUnverifiedPatientRequest =
      grpcMapper.CreateUnverifiedPatientToCreateGrpcUnverifiedPatient(payload);

    const metadata = await this.getMetadata();
    const response: CreateUnverifiedPatientResponse = await lastValueFrom(
      this.patientsGrpcService.createUnverifiedPatient(grpcPayload, metadata)
    );

    const data: UnverifiedPatient =
      grpcMapper.GrpcUnverifiedPatientToUnverifiedPatient(
        response.patient,
        response.consistency_token
      );

    return data;
  }

  async createInsurance(
    query: PatientAccountsInsuranceQueryDto,
    payload: InsuranceParams
  ): Promise<Insurance> {
    const { patientId } = query;
    const grpcPayload: CreateInsuranceRequest = {
      insurance_record:
        grpcMapper.PatientInsuranceParamsToGrpcPatientInsuranceRecord({
          input: payload,
          patientId: patientId,
        }),
    };

    const metadata = await this.getMetadata();
    const response: CreateInsuranceResponse = await lastValueFrom(
      this.patientsGrpcService.createInsurance(grpcPayload, metadata)
    );

    return grpcMapper.GrpcPatientInsuranceRecordToPatientInsurance(
      response.insurance_record
    );
  }

  async updateInsurance(
    query: PatientAccountsInsuranceQueryDto,
    insuranceId: string,
    payload: InsuranceParams
  ): Promise<Insurance> {
    const { patientId } = query;
    const grpcPayload: UpdateInsuranceRequest = {
      insurance_record:
        grpcMapper.PatientInsuranceParamsToGrpcPatientInsuranceRecord({
          input: payload,
          patientId: patientId,
          insuranceId: insuranceId,
        }),
    };

    const metadata = await this.getMetadata();
    const response: UpdateInsuranceResponse = await lastValueFrom(
      this.patientsGrpcService.updateInsurance(grpcPayload, metadata)
    );

    const data: Insurance =
      grpcMapper.GrpcPatientInsuranceRecordToPatientInsurance(
        response.insurance_record
      );

    return data;
  }

  async checkEligibility(
    query: PatientAccountsInsuranceQueryDto,
    insuranceId: string
  ): Promise<Insurance> {
    const { patientId } = query;

    const triggerEligibilityCheckGrpcPayload: TriggerPatientInsuranceEligibilityCheckRequest =
      {
        patient_id: patientId,
        insurance_id: insuranceId,
      };
    const metadata = await this.getMetadata();
    try {
      await lastValueFrom(
        this.patientsGrpcService.triggerPatientInsuranceEligibilityCheck(
          triggerEligibilityCheckGrpcPayload,
          metadata
        )
      );
    } catch (error) {
      this.logger.error(
        `Failed to trigger patient insurance eligibility check for patient ID: ${patientId}, insurance ID: ${insuranceId}. Error: ${error?.message}`
      );
    }

    const grpcPayload: GetInsuranceRequest = {
      patient_id: patientId,
      insurance_id: insuranceId,
      sync_ehr: true,
    };

    const response: GetInsuranceResponse = await lastValueFrom(
      this.patientsGrpcService.getInsurance(grpcPayload, metadata)
    );

    return grpcMapper.GrpcPatientInsuranceRecordToPatientInsurance(
      response.insurance_record
    );
  }

  async createEhrRecord(payload: CreateEhrRecordDto): Promise<Patient> {
    const metadata = await this.getMetadata();
    const response: FindOrCreatePatientForUnverifiedPatientResponse =
      await lastValueFrom(
        this.patientsGrpcService.findOrCreatePatientForUnverifiedPatient(
          {
            id: payload.unverifiedPatientId,
            billing_city_id: payload.billingCityId,
          },
          metadata
        )
      );

    const data: Patient = grpcMapper.GrpcPatientToPatient(
      response.patient,
      response.consistency_token
    );

    return data;
  }

  async listInsurances(patientId: string): Promise<OssInsurance[]> {
    const grpcPayload: ListInsurancesRequest = {
      patient_id: patientId,
    };

    const metadata = await this.getMetadata();

    const response: ListInsurancesResponse = await lastValueFrom(
      this.patientsGrpcService.listInsurances(grpcPayload, metadata)
    );

    const listInsurances: Insurance[] = response?.results?.map(
      ({ insurance_record }) =>
        grpcMapper.GrpcPatientInsuranceRecordToPatientInsurance(
          insurance_record
        )
    );

    const insurancePlanIds = listInsurances
      ?.map(({ insurancePlanId }) => insurancePlanId)
      ?.filter(Boolean);

    try {
      if (insurancePlanIds?.length > 0) {
        const insuranceNetworks: InsuranceNetwork[] =
          await this.insuranceNetworksService.search({
            insurancePlanIds,
          });

        return listInsurances.map((insurance: Insurance) => ({
          ...insurance,
          insuranceNetwork: insuranceNetworks.find(
            ({ insurancePlanId }: InsuranceNetwork) =>
              insurance.insurancePlanId.toString() ===
              insurancePlanId?.toString()
          ),
        }));
      }
    } catch (err) {
      this.logger.error(
        `Failed to fetch insurance plans with IDs ${insurancePlanIds.toString()}. Error: ${
          err?.message
        }`
      );
    }

    return listInsurances ?? [];
  }

  async deleteInsurance(
    query: PatientAccountsInsuranceQueryDto,
    insuranceId: string
  ): Promise<{ success: boolean }> {
    const { patientId } = query;
    const grpcPayload: DeleteInsuranceRequest = {
      patient_id: patientId,
      insurance_id: insuranceId,
    };

    const metadata = await this.getMetadata();

    try {
      await lastValueFrom(
        this.patientsGrpcService.deleteInsurance(grpcPayload, metadata)
      );

      return { success: true };
    } catch (error) {
      throw new Error(`${error?.details}`);
    }
  }
}

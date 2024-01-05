import {
  BadRequestException,
  Inject,
  Injectable,
  OnModuleInit,
} from '@nestjs/common';
import { ClientGrpc } from '@nestjs/microservices';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import {
  AddUnverifiedAccountPatientLinkRequest,
  AddUnverifiedAccountPatientLinkResponse,
  FindOrCreateAccountByTokenResponse,
  ListAccountPatientLinksRequest,
  ListAccountPatientLinksResponse,
  ListAccountPatientLinksResult,
  ListAddressesResponse,
  PATIENT_ACCOUNTS_SERVICE_NAME,
  PatientAccountsServiceClient,
  PATIENTS_ACCOUNTS_PACKAGE_NAME,
  UpdateAccountRequest,
  UpdateAccountResponse,
} from '@*company-data-covered*/protos/nest/patients/accounts/service';
import { Metadata } from '@grpc/grpc-js';
import { lastValueFrom } from 'rxjs';
import mapper from './patient-accounts.mapper';
import PatientAccountsInsuranceQueryDto from '../patient-accounts/dto/patient-insurance-query.dto';
import {
  Account,
  Patient,
  PatientAssociation,
  AccountPatient,
  Insurance,
  InsuranceParams,
  UnverifiedPatient,
  OssInsurance,
  OssAddress,
  OssAccountAddress,
} from '@*company-data-covered*/consumer-web-types';
import PatientService from '../patient/patient.service';
import CreateEhrRecordDto from './dto/create-ehr-record.dto';
import UnverifiedPatientDto from './dto/unverified-patient.dto';

@Injectable()
export default class PatientAccountsService implements OnModuleInit {
  private patientAccountsGrpcService: PatientAccountsServiceClient;

  onModuleInit() {
    this.patientAccountsGrpcService =
      this.client.getService<PatientAccountsServiceClient>(
        PATIENT_ACCOUNTS_SERVICE_NAME
      );
  }

  private get authHeader(): string {
    return <string>(
      this.httpService.axiosRef.defaults.headers.common.authorization
    );
  }

  constructor(
    private configService: ConfigService,
    private httpService: HttpService,
    private patientService: PatientService,
    @Inject(PATIENTS_ACCOUNTS_PACKAGE_NAME)
    private client: ClientGrpc
  ) {}

  private getMetadata(): Metadata {
    const metadata = new Metadata();

    metadata.add('authorization', this.authHeader);

    return metadata;
  }

  async get(): Promise<Account> {
    const response: FindOrCreateAccountByTokenResponse = await lastValueFrom(
      this.patientAccountsGrpcService.findOrCreateAccountByToken(
        {},
        this.getMetadata()
      )
    );

    return mapper.GrpcAccountToAccount(
      response.account,
      response.consistency_token
    );
  }

  async update(payload: Account, accountId?: number): Promise<Account> {
    if ((!accountId && !payload.id) || !payload.consistencyToken) {
      throw new BadRequestException(
        'account id & consistency token are required.'
      );
    }
    const grpcPayload: UpdateAccountRequest =
      mapper.UpdateAccountRequestPayload(payload, accountId);

    const response: UpdateAccountResponse = await lastValueFrom(
      this.patientAccountsGrpcService.updateAccount(
        grpcPayload,
        this.getMetadata()
      )
    );

    const data: Account = mapper.GrpcAccountToAccount(
      response.account,
      response.consistency_token
    );

    return data;
  }

  async createAddress(
    payload: OssAddress,
    accountId: number
  ): Promise<OssAccountAddress> {
    const res = await lastValueFrom(
      this.patientAccountsGrpcService.createAddress(
        mapper.createAddressPayload(payload, accountId),
        this.getMetadata()
      )
    );

    return mapper.GrpcAccountAddressToAccountAddress(
      res,
      res.consistency_token
    );
  }

  async listAddresses(accountId: number): Promise<OssAddress[]> {
    const response: ListAddressesResponse = await lastValueFrom(
      this.patientAccountsGrpcService.listAddresses(
        { account_id: accountId },
        this.getMetadata()
      )
    );

    return (
      response.results?.map((result) =>
        mapper.GrpcAddressToAddress(result.address, result.consistency_token)
      ) ?? []
    );
  }

  async updateAddress(
    payload: OssAddress,
    addressId?: number
  ): Promise<OssAccountAddress> {
    if ((!addressId && !payload.id) || !payload.consistencyToken) {
      throw new BadRequestException(
        'address id & consistency token are required.'
      );
    }

    const res = await lastValueFrom(
      this.patientAccountsGrpcService.updateAddress(
        mapper.updateAddressPayload(payload, addressId),
        this.getMetadata()
      )
    );

    return mapper.GrpcAccountAddressToAccountAddress(
      res,
      res.consistency_token
    );
  }

  isPatientPayload = (
    payload: Patient | UnverifiedPatient
  ): payload is Patient => 'ehrPatientId' in payload;

  async updatePatient(
    patientId: number,
    payload: Patient | UnverifiedPatient
  ): Promise<Patient | UnverifiedPatient> {
    // TODO: [ON-1093] - Separate updatePatient method
    return this.isPatientPayload(payload)
      ? this.patientService.updateGrpcPatient(patientId, payload)
      : this.patientService.updateGrpcUnverifiedPatient(patientId, payload);
  }

  createUnverifiedPatient(
    payload: UnverifiedPatientDto
  ): Promise<UnverifiedPatient> {
    return this.patientService.createUnverifiedPatient(payload);
  }

  getPatient(patientId: number): Promise<Patient> {
    return this.patientService.getGrpcPatient(patientId);
  }

  async listPatients(accountId: number): Promise<AccountPatient[]> {
    const grpcPayload: ListAccountPatientLinksRequest = {
      account_id: accountId,
    };

    const response: ListAccountPatientLinksResponse = await lastValueFrom(
      this.patientAccountsGrpcService.listAccountPatientLinks(
        grpcPayload,
        this.getMetadata()
      )
    );

    return (
      response.result?.map(
        (listAccountPatient: ListAccountPatientLinksResult) =>
          mapper.GrpcAccountPatientToAccountPatient(
            listAccountPatient.account_patient_link,
            listAccountPatient.consistency_token
          )
      ) ?? []
    );
  }

  async addUnverifiedAccountPatientLink(
    accountId: number,
    payload: PatientAssociation
  ): Promise<AccountPatient> {
    const grpcPayload: AddUnverifiedAccountPatientLinkRequest =
      mapper.addUnverifiedAccountPatientLinkPayload(payload, accountId);

    const response: AddUnverifiedAccountPatientLinkResponse =
      await lastValueFrom(
        this.patientAccountsGrpcService.addUnverifiedAccountPatientLink(
          grpcPayload,
          this.getMetadata()
        )
      );

    return mapper.GrpcAccountPatientToAccountPatient(
      response.account_patient_link,
      response.consistency_token
    );
  }

  createInsurance(
    query: PatientAccountsInsuranceQueryDto,
    payload: InsuranceParams
  ): Promise<Insurance> {
    return this.patientService.createInsurance(query, payload);
  }

  updateInsurance(
    query: PatientAccountsInsuranceQueryDto,
    insuranceId: string,
    payload: InsuranceParams
  ): Promise<Insurance> {
    return this.patientService.updateInsurance(query, insuranceId, payload);
  }

  checkEligibility(
    query: PatientAccountsInsuranceQueryDto,
    insuranceId: string
  ): Promise<Insurance> {
    return this.patientService.checkEligibility(query, insuranceId);
  }

  createEhrRecord(payload: CreateEhrRecordDto): Promise<Patient> {
    return this.patientService.createEhrRecord(payload);
  }

  listInsurances(patientId: string): Promise<OssInsurance[]> {
    return this.patientService.listInsurances(patientId);
  }

  deleteInsurance(
    query: PatientAccountsInsuranceQueryDto,
    insuranceId: string
  ): Promise<{ success: boolean }> {
    return this.patientService.deleteInsurance(query, insuranceId);
  }
}

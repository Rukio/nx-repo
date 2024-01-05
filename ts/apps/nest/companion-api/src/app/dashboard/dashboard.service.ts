import { HttpService } from '@nestjs/axios';
import { HttpStatus, Inject, Injectable } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { ConfigService } from '@nestjs/config';
import { isAxiosError } from '@nestjs/terminus/dist/utils';
import { AxiosRequestConfig } from 'axios';
import { Cache } from 'cache-manager';
import { plainToClass } from 'class-transformer';
import { firstValueFrom } from 'rxjs';
import { CareRequestDto } from '../care-request/dto/care-request.dto';
import { HealthDependency } from '../health-check/interfaces/health-dependency.interface';
import {
  DashboardCareRequest,
  PlainDashboardCareRequest,
} from './types/dashboard-care-request';
import {
  DashboardCareRequestNote,
  DashboardCareRequestNoteUpsert,
  DashboardCareRequestNoteUpsertRequest,
  DashboardCareRequestNoteListResponse,
} from './types/dashboard-care-request-note';
import { DriversLicenseUploadRequest } from './types/drivers-license-upload-request';
import { DashboardDriversLicense } from './types/drivers-license-upload-response';
import { InsuranceUploadRequest } from './types/insurance-upload-request';
import { DashboardInsurance } from './types/dashboard-insurance';
import { InsuranceCardType } from '../insurances/interfaces/insurance_card_type.interface';
import { InsuranceDeleteRequest } from './types/insurance-delete-request';
import { ClinicalProviderSearchParams } from '../clinical-providers/interfaces/clinical-provider';
import { ClinicalProviderSearchRequest } from './types/clinical-provider-request';
import { DashboardClinicalProvider } from './types/dashboard-clinical-provider';
import { Pharmacy } from '../pharmacies/interfaces/pharmacy.interface';
import { SetDefaultPharmacyRequest } from './types/pharmacy-set-default-request';
import { DashboardPharmacy } from './types/dashboard-default-pharmacy';
import { DashboardPrimaryCareProvider } from './types/dashboard-primary-care-provider';
import { PrimaryCareProvider } from '../pcp/interfaces/pcp.interface';
import { DashboardMedicationHistoryConsent } from './types/dashboard-medication-history-consent';
import { SignedConsentDto } from '../consents/dto/consent.dto';
import { DashboardMedicationHistoryConsentStatus } from './types/dashboard-medication-history-consent-status';
import { SocialHistoryUpdateRequest } from './types/social-history-update-request';
import { SocialHistory } from './types/social-history';
import { AuthService } from '@*company-data-covered*/nest/auth';
import { CareTeamEta } from './types/care-team-eta';

export const ATHENA_PREVIEW_MEDICATION_CONSENT_ERROR =
  'Medication history consent not required for this practice';

/** Handles calls to the external Dashboard API endpoints and transforms the Dashboard DTOs to Companion DTOs. */
@Injectable()
export class DashboardService implements HealthDependency {
  private _basePath: string | undefined;
  readonly healthCheckKey = 'Dashboard:Healthy';

  constructor(
    private httpService: HttpService,
    private configService: ConfigService,
    private auth: AuthService,
    @Inject(CACHE_MANAGER) private cache: Cache
  ) {}

  async markAsHealthy(): Promise<void> {
    await this.cache.set<boolean>(this.healthCheckKey, true, { ttl: 0 });
  }

  async markAsUnhealthy(): Promise<void> {
    await this.cache.set<boolean>(this.healthCheckKey, false, { ttl: 0 });
  }

  async isHealthy(): Promise<boolean | undefined> {
    return this.cache.get<boolean>(this.healthCheckKey);
  }

  /** Retrieves the base path for the dashboard service from the config service. */
  get basePath() {
    if (!this._basePath) {
      this._basePath = `${this.configService.get('STATION_URL')}`;
    }

    return this._basePath;
  }

  get isProdDashboard() {
    return /admin.*company-data-covered*.com/i.test(this.basePath);
  }

  /** Retrieves an object with all of the headers required to communicate with Dashboard APIs. Formatted for Axios request configuration. */
  private async getCommonHeaders(): Promise<Record<string, string>> {
    const token = await this.auth.getToken();

    return {
      'Content-Type': 'application/json',
      Accept: 'application/vnd.*company-data-covered*.com; version=1',
      Authorization: token.authorizationValue,
    };
  }

  /**
   * Retrieves a care request using the given ID.
   *
   * Returns null if a care request with the specified ID does not exist.
   */
  async getCareRequestById(
    careRequestId: number
  ): Promise<CareRequestDto | null> {
    try {
      const url = `${this.basePath}/api/care_requests/${careRequestId}`;
      const response = await firstValueFrom(
        this.httpService.get<PlainDashboardCareRequest>(url, {
          headers: await this.getCommonHeaders(),
        })
      );

      const careRequest = response.data;

      return plainToClass(DashboardCareRequest, careRequest).toCareRequestDto();
    } catch (error) {
      if (error && isAxiosError(error) && error.response) {
        if (error.response.status === HttpStatus.NOT_FOUND) {
          return null;
        }
      }

      throw error;
    }
  }

  /**
   * Gets the driver's license entry for a patient.
   */
  async getDriversLicenseByPatientId(
    patientId: number
  ): Promise<DashboardDriversLicense | null> {
    try {
      const url = `${this.basePath}/api/patients/${patientId}/driver_licenses`;

      const config: AxiosRequestConfig = {
        headers: await this.getCommonHeaders(),
      };

      const response = await firstValueFrom(
        this.httpService.get<DashboardDriversLicense>(url, config)
      );

      return response.data;
    } catch (error) {
      if (error && isAxiosError(error) && error.response) {
        if (error.response.status === HttpStatus.NOT_FOUND) {
          return null;
        }
      }

      throw error;
    }
  }

  /**
   * Creates a driver's license entry for a patient.
   */
  async uploadPatientDriversLicense(
    patientId: number,
    file: Express.Multer.File
  ): Promise<unknown | null> {
    try {
      const data: DriversLicenseUploadRequest = {
        driver_license: {
          license: `data:${file.mimetype};base64,${file.buffer.toString(
            'base64'
          )}`,
          image_requires_verification: true,
        },
      };

      const config: AxiosRequestConfig = {
        headers: await this.getCommonHeaders(),
      };

      const existingDriversLicense = await this.getDriversLicenseByPatientId(
        patientId
      );

      if (existingDriversLicense) {
        const url = `${this.basePath}/api/patients/${patientId}/driver_licenses/${existingDriversLicense.id}`;

        await firstValueFrom(
          this.httpService.patch<DashboardDriversLicense>(url, data, config)
        );
      } else {
        const url = `${this.basePath}/api/patients/${patientId}/driver_licenses`;

        await firstValueFrom(
          this.httpService.post<DashboardDriversLicense>(url, data, config)
        );
      }
    } catch (error) {
      if (error && isAxiosError(error) && error.response) {
        if (error.response.status === HttpStatus.NOT_FOUND) {
          return null;
        }
      }

      throw error;
    }
  }

  /**
   * Deletes the driver's license entry for a patient.
   */
  async deleteDriversLicenseById(
    patientId: number,
    driversLicenseId: number
  ): Promise<void> {
    const url = `${this.basePath}/api/patients/${patientId}/driver_licenses/${driversLicenseId}`;

    const config: AxiosRequestConfig = {
      headers: await this.getCommonHeaders(),
    };

    await firstValueFrom(this.httpService.delete<void>(url, config));
  }

  /**
   * Fetches patient insurances.
   */
  async getPatientInsurances(patientId: number): Promise<DashboardInsurance[]> {
    const url = `${this.basePath}/api/patients/${patientId}/insurances`;
    const config: AxiosRequestConfig = {
      headers: await this.getCommonHeaders(),
    };
    const resp = await firstValueFrom(
      this.httpService.get<DashboardInsurance[]>(url, config)
    );

    return resp.data;
  }

  /**
   * Creates an insurance entry for a patient.
   */
  async uploadInsurance(
    patientId: number,
    careRequestId: number,
    insuranceId: number,
    cardFront?: Express.Multer.File,
    cardBack?: Express.Multer.File
  ): Promise<void> {
    const url = `${this.basePath}/api/patients/${patientId}/care_requests/${careRequestId}/insurances/${insuranceId}`;

    const data: InsuranceUploadRequest = {
      insurance: {
        card_front: cardFront
          ? `data:${cardFront.mimetype};base64,${cardFront.buffer.toString(
              'base64'
            )}`
          : undefined,
        card_back: cardBack
          ? `data:${cardBack.mimetype};base64,${cardBack.buffer.toString(
              'base64'
            )}`
          : undefined,
        image_requires_verification: true,
      },
    };

    const config: AxiosRequestConfig = {
      headers: await this.getCommonHeaders(),
    };

    await firstValueFrom(
      this.httpService.patch<DashboardInsurance>(url, data, config)
    );
  }

  /**
   * Deletes an insurance entry for a patient.
   */
  async deleteInsuranceImageByType(
    patientId: number,
    careRequestId: number,
    insuranceId: number,
    cardType: InsuranceCardType
  ) {
    const url = `${this.basePath}/api/patients/${patientId}/care_requests/${careRequestId}/insurances/${insuranceId}`;
    const data: InsuranceDeleteRequest = {
      insurance: {
        remove_card_front: true,
        remove_card_back: true,
      },
    };

    if (cardType === InsuranceCardType.RemoveCardFront) {
      data.insurance.remove_card_back = false;
    }

    if (cardType === InsuranceCardType.RemoveCardBack) {
      data.insurance.remove_card_front = false;
    }

    const config: AxiosRequestConfig = {
      headers: await this.getCommonHeaders(),
    };

    await firstValueFrom(
      this.httpService.patch<DashboardInsurance>(url, data, config)
    );
  }

  /**
   * Gets a list of clinical providers.
   */
  async searchClinicalProviders(
    provider: ClinicalProviderSearchParams
  ): Promise<DashboardClinicalProvider[] | []> {
    try {
      const url = `${this.basePath}/api/clinical_providers/search`;
      const data: ClinicalProviderSearchRequest = {
        clinical_provider: {
          first_name: provider.firstName,
          last_name: provider.lastName,
          name: provider.entityName,
          phone: provider.phone,
          zip: provider.zip,
          distance_mi: provider.distanceMiles,
          limit: provider.limit,
          offset: provider.offset,
        },
      };

      const config: AxiosRequestConfig = {
        headers: await this.getCommonHeaders(),
      };

      const response = await firstValueFrom(
        this.httpService.post<DashboardClinicalProvider[]>(url, data, config)
      );

      return response.data;
    } catch (error) {
      if (error && isAxiosError(error) && error.response) {
        if (error.response.status === HttpStatus.NOT_FOUND) {
          return [];
        }
      }

      throw error;
    }
  }

  /*
   * Creates a default pharmacy for a patient
   */
  async setDefaultPharmacy(patientId: number, pharmacy: Pharmacy) {
    const url = `${this.basePath}/api/patients/${patientId}/default_pharmacy`;
    const data: SetDefaultPharmacyRequest = {
      default_pharmacy: { default_pharmacy_id: pharmacy.id },
    };

    const config: AxiosRequestConfig = {
      headers: await this.getCommonHeaders(),
    };

    await firstValueFrom(this.httpService.patch(url, data, config));
  }

  /**
   * Get the default pharmacy information by patient ID
   */
  async getDefaultPharmacyByPatientId(
    patientId: number
  ): Promise<DashboardPharmacy | null> {
    try {
      const url = `${this.basePath}/api/patients/${patientId}/default_pharmacy`;

      const config: AxiosRequestConfig = {
        headers: await this.getCommonHeaders(),
      };

      const response = await firstValueFrom(
        this.httpService.get<DashboardPharmacy>(url, config)
      );

      return response.data;
    } catch (error) {
      if (error && isAxiosError(error) && error.response) {
        if (error.response.status === HttpStatus.NOT_FOUND) {
          return null;
        }
      }

      throw error;
    }
  }

  /**
   * Creates/Updates the PCP information by clinical provider id
   */
  async setPrimaryCareProvider(
    careRequestId: number,
    patientId: number,
    pcp: PrimaryCareProvider
  ) {
    const url = `${this.basePath}/api/patients/${patientId}/care_requests/${careRequestId}/care_team/save_primary_care_provider/${pcp.id}`;

    const config: AxiosRequestConfig = {
      headers: await this.getCommonHeaders(),
    };

    await firstValueFrom(this.httpService.patch(url, null, config));
  }

  /**
   * Get the patient's primary care provider EHR ID
   */
  async getPrimaryCareProviderEhrIdByPatientId(
    patientId: number
  ): Promise<string | null> {
    try {
      const url = `${this.basePath}/api/patients/${patientId}/primary_care_provider`;

      const config: AxiosRequestConfig = {
        headers: await this.getCommonHeaders(),
      };

      const response = await firstValueFrom(
        this.httpService.get<DashboardPrimaryCareProvider>(url, config)
      );

      const pcpData = response.data;

      return pcpData.primaryCareProvider?.clinicalProviderId ?? null;
    } catch (error) {
      if (error && isAxiosError(error) && error.response) {
        if (error.response.status === HttpStatus.NOT_FOUND) {
          return null;
        }
      }

      throw error;
    }
  }

  /**
   * Apply medication history consent for the patient.
   */
  async applyPatientMedicationHistoryConsent(
    patientId: number,
    consent: SignedConsentDto
  ): Promise<void> {
    try {
      const url = `${this.basePath}/api/patients/${patientId}/consent_to_medication_history`;

      const config: AxiosRequestConfig = {
        headers: await this.getCommonHeaders(),
      };

      const data: DashboardMedicationHistoryConsent = {
        medical_history_consent: {
          signed_at: consent.signature.signedAt,
          signed_by: consent.signature.signerName,
          consent_given_by: consent.signature.signerRelationToPatient,
          consent_given: true,
        },
      };

      await firstValueFrom(this.httpService.put<void>(url, data, config));
    } catch (error) {
      if (error && isAxiosError(error) && error.response) {
        if (error.response.status === HttpStatus.INTERNAL_SERVER_ERROR) {
          const athenaPreviewErrorTester = new RegExp(
            ATHENA_PREVIEW_MEDICATION_CONSENT_ERROR,
            'i'
          );
          const { error: message } = error.response.data as { error?: string };

          if (
            message &&
            !this.isProdDashboard &&
            athenaPreviewErrorTester.test(message)
          ) {
            return;
          }
        }
      }

      throw error;
    }
  }

  /**
   * Get medication history consent status for the patient.
   */
  async getPatientMedicationHistoryConsentStatus(
    patientId: number
  ): Promise<boolean | null> {
    try {
      const url = `${this.basePath}/api/patients/${patientId}/consent_to_medication_history`;

      const config: AxiosRequestConfig = {
        headers: await this.getCommonHeaders(),
      };

      const response = await firstValueFrom(
        this.httpService.get<DashboardMedicationHistoryConsentStatus>(
          url,
          config
        )
      );

      return response.data.medication_history_consent;
    } catch (error) {
      if (error && isAxiosError(error) && error.response) {
        if (error.response.status === HttpStatus.NOT_FOUND) {
          return null;
        }
      }

      throw error;
    }
  }

  /**
   * Set answer to social history question for the patient.
   */
  async updatePatientSocialHistory(
    patientId: number,
    questionKey: string,
    answer: string
  ) {
    const url = `${this.basePath}/api/patients/${patientId}/social_history/update`;
    const data: SocialHistoryUpdateRequest = {
      questions: [
        {
          question_key: questionKey,
          answer: answer,
        },
      ],
    };
    const config: AxiosRequestConfig = {
      headers: await this.getCommonHeaders(),
    };

    await firstValueFrom(this.httpService.patch(url, data, config));
  }

  /**
   * Get answer to social history questions for the patient.
   */
  async getPatientSocialHistory(patientId: number): Promise<SocialHistory> {
    const url = `${this.basePath}/api/patients/${patientId}/social_history`;
    const config: AxiosRequestConfig = {
      headers: await this.getCommonHeaders(),
    };

    const response = await firstValueFrom(
      this.httpService.get<SocialHistory>(url, config)
    );

    return response.data;
  }

  /**
   * Apply signed consent forms for the patient in Athena.
   */
  async applySignedConsents(careRequestId: number) {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/apply_signed_consents`;
    const data = {
      consent_to_treat: true,
      hipaa: true,
    };
    const config: AxiosRequestConfig = {
      headers: await this.getCommonHeaders(),
    };

    await firstValueFrom(this.httpService.post(url, data, config));
  }

  /**
   * Creates a note in the care request timeline note
   */
  async createNoteForCareRequest(
    careRequestId: number,
    note: DashboardCareRequestNoteUpsert
  ) {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/notes`;
    const data: DashboardCareRequestNoteUpsertRequest = {
      note,
    };
    const config: AxiosRequestConfig = {
      headers: await this.getCommonHeaders(),
    };

    await firstValueFrom(
      this.httpService.post<DashboardCareRequestNote>(url, data, config)
    );
  }

  /**
   * Gets the Station Notes for a care request
   */
  async getNotesForCareRequest(careRequestId: number) {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/notes`;
    const config: AxiosRequestConfig = {
      headers: await this.getCommonHeaders(),
    };
    const response = await firstValueFrom(
      this.httpService.get<DashboardCareRequestNoteListResponse>(url, config)
    );

    return response.data;
  }

  /**
   * Updates a note in the care request timeline
   */
  async updateNoteForCareRequest(
    careRequestId: number,
    noteID: number,
    note: DashboardCareRequestNoteUpsert
  ) {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/notes/${noteID}`;
    const data: DashboardCareRequestNoteUpsertRequest = {
      note,
    };
    const config: AxiosRequestConfig = {
      headers: await this.getCommonHeaders(),
    };

    await firstValueFrom(
      this.httpService.patch<DashboardCareRequestNote>(url, data, config)
    );
  }

  /**
   * Fetches the ETA of the care team for a care request.
   */
  async getCareTeamEta(careRequestId: number): Promise<CareTeamEta> {
    const url = `${this.basePath}/api/care_requests/${careRequestId}/eta`;
    const config: AxiosRequestConfig = {
      headers: await this.getCommonHeaders(),
    };
    const resp = await firstValueFrom(
      this.httpService.get<CareTeamEta>(url, config)
    );

    return resp.data;
  }
}

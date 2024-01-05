/* tslint:disable */
/* eslint-disable */
/**
 * caremanager/service.proto
 * No description provided (generated by Openapi Generator https://github.com/openapitools/openapi-generator)
 *
 * The version of the OpenAPI document: version not set
 * 
 *
 * NOTE: This class is auto generated by OpenAPI Generator (https://openapi-generator.tech).
 * https://openapi-generator.tech
 * Do not edit the class manually.
 */

import { exists, mapValues } from '../runtime';
import type { ExternalCareProvider } from './ExternalCareProvider';
import {
    ExternalCareProviderFromJSON,
    ExternalCareProviderFromJSONTyped,
    ExternalCareProviderToJSON,
} from './ExternalCareProvider';
import type { Insurance } from './Insurance';
import {
    InsuranceFromJSON,
    InsuranceFromJSONTyped,
    InsuranceToJSON,
} from './Insurance';
import type { MedicalDecisionMaker } from './MedicalDecisionMaker';
import {
    MedicalDecisionMakerFromJSON,
    MedicalDecisionMakerFromJSONTyped,
    MedicalDecisionMakerToJSON,
} from './MedicalDecisionMaker';
import type { Patient } from './Patient';
import {
    PatientFromJSON,
    PatientFromJSONTyped,
    PatientToJSON,
} from './Patient';
import type { Pharmacy } from './Pharmacy';
import {
    PharmacyFromJSON,
    PharmacyFromJSONTyped,
    PharmacyToJSON,
} from './Pharmacy';

/**
 * 
 * @export
 * @interface GetPatientResponse
 */
export interface GetPatientResponse {
    /**
     * 
     * @type {Patient}
     * @memberof GetPatientResponse
     */
    patient?: Patient;
    /**
     * medical_decision_makers represent a list of MedicalDecisionMakers that
     * are associated with the retrieved Patient.
     * @type {Array<MedicalDecisionMaker>}
     * @memberof GetPatientResponse
     */
    medicalDecisionMakers?: Array<MedicalDecisionMaker>;
    /**
     * insurances represent a list of Insurances that are associated with the
     * retrieved Patient.
     * @type {Array<Insurance>}
     * @memberof GetPatientResponse
     */
    insurances?: Array<Insurance>;
    /**
     * pharmacies represent a list of Pharmacy instances that are associated
     * with the retrieved Patient.
     * @type {Array<Pharmacy>}
     * @memberof GetPatientResponse
     */
    pharmacies?: Array<Pharmacy>;
    /**
     * external_care_providers represent a list of ExternalCareProviders that
     * are associated with the retrieved Patient.
     * @type {Array<ExternalCareProvider>}
     * @memberof GetPatientResponse
     */
    externalCareProviders?: Array<ExternalCareProvider>;
}

/**
 * Check if a given object implements the GetPatientResponse interface.
 */
export function instanceOfGetPatientResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function GetPatientResponseFromJSON(json: any): GetPatientResponse {
    return GetPatientResponseFromJSONTyped(json, false);
}

export function GetPatientResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetPatientResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'patient': !exists(json, 'patient') ? undefined : PatientFromJSON(json['patient']),
        'medicalDecisionMakers': !exists(json, 'medical_decision_makers') ? undefined : ((json['medical_decision_makers'] as Array<any>).map(MedicalDecisionMakerFromJSON)),
        'insurances': !exists(json, 'insurances') ? undefined : ((json['insurances'] as Array<any>).map(InsuranceFromJSON)),
        'pharmacies': !exists(json, 'pharmacies') ? undefined : ((json['pharmacies'] as Array<any>).map(PharmacyFromJSON)),
        'externalCareProviders': !exists(json, 'external_care_providers') ? undefined : ((json['external_care_providers'] as Array<any>).map(ExternalCareProviderFromJSON)),
    };
}

export function GetPatientResponseToJSON(value?: GetPatientResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'patient': PatientToJSON(value.patient),
        'medical_decision_makers': value.medicalDecisionMakers === undefined ? undefined : ((value.medicalDecisionMakers as Array<any>).map(MedicalDecisionMakerToJSON)),
        'insurances': value.insurances === undefined ? undefined : ((value.insurances as Array<any>).map(InsuranceToJSON)),
        'pharmacies': value.pharmacies === undefined ? undefined : ((value.pharmacies as Array<any>).map(PharmacyToJSON)),
        'external_care_providers': value.externalCareProviders === undefined ? undefined : ((value.externalCareProviders as Array<any>).map(ExternalCareProviderToJSON)),
    };
}


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
import type { Insurance } from './Insurance';
import {
    InsuranceFromJSON,
    InsuranceFromJSONTyped,
    InsuranceToJSON,
} from './Insurance';

/**
 * 
 * @export
 * @interface CreateInsuranceResponse
 */
export interface CreateInsuranceResponse {
    /**
     * 
     * @type {Insurance}
     * @memberof CreateInsuranceResponse
     */
    insurance?: Insurance;
    /**
     * patient_insurances is the list of Insurances associated to the Patient
     * whose Insurance was just created. It is sorted by priority.
     * @type {Array<Insurance>}
     * @memberof CreateInsuranceResponse
     */
    patientInsurances?: Array<Insurance>;
}

/**
 * Check if a given object implements the CreateInsuranceResponse interface.
 */
export function instanceOfCreateInsuranceResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function CreateInsuranceResponseFromJSON(json: any): CreateInsuranceResponse {
    return CreateInsuranceResponseFromJSONTyped(json, false);
}

export function CreateInsuranceResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreateInsuranceResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'insurance': !exists(json, 'insurance') ? undefined : InsuranceFromJSON(json['insurance']),
        'patientInsurances': !exists(json, 'patient_insurances') ? undefined : ((json['patient_insurances'] as Array<any>).map(InsuranceFromJSON)),
    };
}

export function CreateInsuranceResponseToJSON(value?: CreateInsuranceResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'insurance': InsuranceToJSON(value.insurance),
        'patient_insurances': value.patientInsurances === undefined ? undefined : ((value.patientInsurances as Array<any>).map(InsuranceToJSON)),
    };
}


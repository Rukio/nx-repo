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
 * @interface DeleteInsuranceResponse
 */
export interface DeleteInsuranceResponse {
    /**
     * patient_insurances is the list of Insurances associated to the Patient
     * whose Insurance was just deleted. It is sorted by priority.
     * @type {Array<Insurance>}
     * @memberof DeleteInsuranceResponse
     */
    patientInsurances?: Array<Insurance>;
}

/**
 * Check if a given object implements the DeleteInsuranceResponse interface.
 */
export function instanceOfDeleteInsuranceResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function DeleteInsuranceResponseFromJSON(json: any): DeleteInsuranceResponse {
    return DeleteInsuranceResponseFromJSONTyped(json, false);
}

export function DeleteInsuranceResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): DeleteInsuranceResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'patientInsurances': !exists(json, 'patient_insurances') ? undefined : ((json['patient_insurances'] as Array<any>).map(InsuranceFromJSON)),
    };
}

export function DeleteInsuranceResponseToJSON(value?: DeleteInsuranceResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'patient_insurances': value.patientInsurances === undefined ? undefined : ((value.patientInsurances as Array<any>).map(InsuranceToJSON)),
    };
}


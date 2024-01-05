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
import type { Patient } from './Patient';
import {
    PatientFromJSON,
    PatientFromJSONTyped,
    PatientToJSON,
} from './Patient';

/**
 * 
 * @export
 * @interface UpdatePatientResponse
 */
export interface UpdatePatientResponse {
    /**
     * 
     * @type {Patient}
     * @memberof UpdatePatientResponse
     */
    patient?: Patient;
}

/**
 * Check if a given object implements the UpdatePatientResponse interface.
 */
export function instanceOfUpdatePatientResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function UpdatePatientResponseFromJSON(json: any): UpdatePatientResponse {
    return UpdatePatientResponseFromJSONTyped(json, false);
}

export function UpdatePatientResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): UpdatePatientResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'patient': !exists(json, 'patient') ? undefined : PatientFromJSON(json['patient']),
    };
}

export function UpdatePatientResponseToJSON(value?: UpdatePatientResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'patient': PatientToJSON(value.patient),
    };
}

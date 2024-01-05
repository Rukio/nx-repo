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
import type { PageInfo } from './PageInfo';
import {
    PageInfoFromJSON,
    PageInfoFromJSONTyped,
    PageInfoToJSON,
} from './PageInfo';
import type { Patient } from './Patient';
import {
    PatientFromJSON,
    PatientFromJSONTyped,
    PatientToJSON,
} from './Patient';

/**
 * 
 * @export
 * @interface GetActivePatientsResponse
 */
export interface GetActivePatientsResponse {
    /**
     * patients represents the collection of Active Patients corresponding to the
     * page and filters requested.
     * @type {Array<Patient>}
     * @memberof GetActivePatientsResponse
     */
    patients: Array<Patient>;
    /**
     * 
     * @type {PageInfo}
     * @memberof GetActivePatientsResponse
     */
    meta?: PageInfo;
}

/**
 * Check if a given object implements the GetActivePatientsResponse interface.
 */
export function instanceOfGetActivePatientsResponse(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "patients" in value;

    return isInstance;
}

export function GetActivePatientsResponseFromJSON(json: any): GetActivePatientsResponse {
    return GetActivePatientsResponseFromJSONTyped(json, false);
}

export function GetActivePatientsResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetActivePatientsResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'patients': ((json['patients'] as Array<any>).map(PatientFromJSON)),
        'meta': !exists(json, 'meta') ? undefined : PageInfoFromJSON(json['meta']),
    };
}

export function GetActivePatientsResponseToJSON(value?: GetActivePatientsResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'patients': ((value.patients as Array<any>).map(PatientToJSON)),
        'meta': PageInfoToJSON(value.meta),
    };
}

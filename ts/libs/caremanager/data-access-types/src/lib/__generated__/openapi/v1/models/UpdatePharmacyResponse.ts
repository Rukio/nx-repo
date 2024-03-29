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
import type { Pharmacy } from './Pharmacy';
import {
    PharmacyFromJSON,
    PharmacyFromJSONTyped,
    PharmacyToJSON,
} from './Pharmacy';

/**
 * 
 * @export
 * @interface UpdatePharmacyResponse
 */
export interface UpdatePharmacyResponse {
    /**
     * 
     * @type {Pharmacy}
     * @memberof UpdatePharmacyResponse
     */
    pharmacy?: Pharmacy;
    /**
     * patient_pharmacies is the list of all Pharmacies associated with the
     * Patient whose Pharmacy was updated.
     * @type {Array<Pharmacy>}
     * @memberof UpdatePharmacyResponse
     */
    patientPharmacies?: Array<Pharmacy>;
}

/**
 * Check if a given object implements the UpdatePharmacyResponse interface.
 */
export function instanceOfUpdatePharmacyResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function UpdatePharmacyResponseFromJSON(json: any): UpdatePharmacyResponse {
    return UpdatePharmacyResponseFromJSONTyped(json, false);
}

export function UpdatePharmacyResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): UpdatePharmacyResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'pharmacy': !exists(json, 'pharmacy') ? undefined : PharmacyFromJSON(json['pharmacy']),
        'patientPharmacies': !exists(json, 'patient_pharmacies') ? undefined : ((json['patient_pharmacies'] as Array<any>).map(PharmacyFromJSON)),
    };
}

export function UpdatePharmacyResponseToJSON(value?: UpdatePharmacyResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'pharmacy': PharmacyToJSON(value.pharmacy),
        'patient_pharmacies': value.patientPharmacies === undefined ? undefined : ((value.patientPharmacies as Array<any>).map(PharmacyToJSON)),
    };
}


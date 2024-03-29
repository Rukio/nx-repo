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
/**
 * 
 * @export
 * @interface DuplicateCareRequestInServiceRequestResponse
 */
export interface DuplicateCareRequestInServiceRequestResponse {
    /**
     * care_request_id represents the ID of the duplicated Care Request.
     * @type {string}
     * @memberof DuplicateCareRequestInServiceRequestResponse
     */
    careRequestId: string;
}

/**
 * Check if a given object implements the DuplicateCareRequestInServiceRequestResponse interface.
 */
export function instanceOfDuplicateCareRequestInServiceRequestResponse(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "careRequestId" in value;

    return isInstance;
}

export function DuplicateCareRequestInServiceRequestResponseFromJSON(json: any): DuplicateCareRequestInServiceRequestResponse {
    return DuplicateCareRequestInServiceRequestResponseFromJSONTyped(json, false);
}

export function DuplicateCareRequestInServiceRequestResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): DuplicateCareRequestInServiceRequestResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'careRequestId': json['care_request_id'],
    };
}

export function DuplicateCareRequestInServiceRequestResponseToJSON(value?: DuplicateCareRequestInServiceRequestResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'care_request_id': value.careRequestId,
    };
}


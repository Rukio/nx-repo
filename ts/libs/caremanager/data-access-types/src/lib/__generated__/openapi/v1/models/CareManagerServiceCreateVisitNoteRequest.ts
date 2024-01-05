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
 * @interface CareManagerServiceCreateVisitNoteRequest
 */
export interface CareManagerServiceCreateVisitNoteRequest {
    /**
     * details is the string that represents the body of the Note.
     * @type {string}
     * @memberof CareManagerServiceCreateVisitNoteRequest
     */
    details: string;
}

/**
 * Check if a given object implements the CareManagerServiceCreateVisitNoteRequest interface.
 */
export function instanceOfCareManagerServiceCreateVisitNoteRequest(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "details" in value;

    return isInstance;
}

export function CareManagerServiceCreateVisitNoteRequestFromJSON(json: any): CareManagerServiceCreateVisitNoteRequest {
    return CareManagerServiceCreateVisitNoteRequestFromJSONTyped(json, false);
}

export function CareManagerServiceCreateVisitNoteRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): CareManagerServiceCreateVisitNoteRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'details': json['details'],
    };
}

export function CareManagerServiceCreateVisitNoteRequestToJSON(value?: CareManagerServiceCreateVisitNoteRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'details': value.details,
    };
}


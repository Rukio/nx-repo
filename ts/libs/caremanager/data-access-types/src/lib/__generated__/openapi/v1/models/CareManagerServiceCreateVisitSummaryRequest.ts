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
 * @interface CareManagerServiceCreateVisitSummaryRequest
 */
export interface CareManagerServiceCreateVisitSummaryRequest {
    /**
     * Required. body represents the VisitSummary content.
     * @type {string}
     * @memberof CareManagerServiceCreateVisitSummaryRequest
     */
    body: string;
}

/**
 * Check if a given object implements the CareManagerServiceCreateVisitSummaryRequest interface.
 */
export function instanceOfCareManagerServiceCreateVisitSummaryRequest(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "body" in value;

    return isInstance;
}

export function CareManagerServiceCreateVisitSummaryRequestFromJSON(json: any): CareManagerServiceCreateVisitSummaryRequest {
    return CareManagerServiceCreateVisitSummaryRequestFromJSONTyped(json, false);
}

export function CareManagerServiceCreateVisitSummaryRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): CareManagerServiceCreateVisitSummaryRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'body': json['body'],
    };
}

export function CareManagerServiceCreateVisitSummaryRequestToJSON(value?: CareManagerServiceCreateVisitSummaryRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'body': value.body,
    };
}


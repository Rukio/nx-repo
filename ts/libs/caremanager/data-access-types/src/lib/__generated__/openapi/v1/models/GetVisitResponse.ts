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
import type { Visit } from './Visit';
import {
    VisitFromJSON,
    VisitFromJSONTyped,
    VisitToJSON,
} from './Visit';
import type { VisitSummary } from './VisitSummary';
import {
    VisitSummaryFromJSON,
    VisitSummaryFromJSONTyped,
    VisitSummaryToJSON,
} from './VisitSummary';

/**
 * 
 * @export
 * @interface GetVisitResponse
 */
export interface GetVisitResponse {
    /**
     * 
     * @type {Visit}
     * @memberof GetVisitResponse
     */
    visit?: Visit;
    /**
     * 
     * @type {VisitSummary}
     * @memberof GetVisitResponse
     */
    summary?: VisitSummary;
}

/**
 * Check if a given object implements the GetVisitResponse interface.
 */
export function instanceOfGetVisitResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function GetVisitResponseFromJSON(json: any): GetVisitResponse {
    return GetVisitResponseFromJSONTyped(json, false);
}

export function GetVisitResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetVisitResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'visit': !exists(json, 'visit') ? undefined : VisitFromJSON(json['visit']),
        'summary': !exists(json, 'summary') ? undefined : VisitSummaryFromJSON(json['summary']),
    };
}

export function GetVisitResponseToJSON(value?: GetVisitResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'visit': VisitToJSON(value.visit),
        'summary': VisitSummaryToJSON(value.summary),
    };
}


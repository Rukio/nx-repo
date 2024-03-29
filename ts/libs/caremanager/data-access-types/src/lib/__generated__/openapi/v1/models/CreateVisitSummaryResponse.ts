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
import type { VisitSummary } from './VisitSummary';
import {
    VisitSummaryFromJSON,
    VisitSummaryFromJSONTyped,
    VisitSummaryToJSON,
} from './VisitSummary';

/**
 * 
 * @export
 * @interface CreateVisitSummaryResponse
 */
export interface CreateVisitSummaryResponse {
    /**
     * 
     * @type {VisitSummary}
     * @memberof CreateVisitSummaryResponse
     */
    summary?: VisitSummary;
}

/**
 * Check if a given object implements the CreateVisitSummaryResponse interface.
 */
export function instanceOfCreateVisitSummaryResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function CreateVisitSummaryResponseFromJSON(json: any): CreateVisitSummaryResponse {
    return CreateVisitSummaryResponseFromJSONTyped(json, false);
}

export function CreateVisitSummaryResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreateVisitSummaryResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'summary': !exists(json, 'summary') ? undefined : VisitSummaryFromJSON(json['summary']),
    };
}

export function CreateVisitSummaryResponseToJSON(value?: CreateVisitSummaryResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'summary': VisitSummaryToJSON(value.summary),
    };
}


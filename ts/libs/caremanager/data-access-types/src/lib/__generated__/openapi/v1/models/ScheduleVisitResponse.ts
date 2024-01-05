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

/**
 * 
 * @export
 * @interface ScheduleVisitResponse
 */
export interface ScheduleVisitResponse {
    /**
     * 
     * @type {Visit}
     * @memberof ScheduleVisitResponse
     */
    visit?: Visit;
}

/**
 * Check if a given object implements the ScheduleVisitResponse interface.
 */
export function instanceOfScheduleVisitResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function ScheduleVisitResponseFromJSON(json: any): ScheduleVisitResponse {
    return ScheduleVisitResponseFromJSONTyped(json, false);
}

export function ScheduleVisitResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): ScheduleVisitResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'visit': !exists(json, 'visit') ? undefined : VisitFromJSON(json['visit']),
    };
}

export function ScheduleVisitResponseToJSON(value?: ScheduleVisitResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'visit': VisitToJSON(value.visit),
    };
}


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
 * @interface UpdateVisitFromStationCRResponse
 */
export interface UpdateVisitFromStationCRResponse {
    /**
     * 
     * @type {Visit}
     * @memberof UpdateVisitFromStationCRResponse
     */
    visit?: Visit;
}

/**
 * Check if a given object implements the UpdateVisitFromStationCRResponse interface.
 */
export function instanceOfUpdateVisitFromStationCRResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function UpdateVisitFromStationCRResponseFromJSON(json: any): UpdateVisitFromStationCRResponse {
    return UpdateVisitFromStationCRResponseFromJSONTyped(json, false);
}

export function UpdateVisitFromStationCRResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): UpdateVisitFromStationCRResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'visit': !exists(json, 'visit') ? undefined : VisitFromJSON(json['visit']),
    };
}

export function UpdateVisitFromStationCRResponseToJSON(value?: UpdateVisitFromStationCRResponse | null): any {
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


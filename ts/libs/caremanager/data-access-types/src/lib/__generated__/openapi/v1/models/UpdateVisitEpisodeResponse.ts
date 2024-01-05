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
 * @interface UpdateVisitEpisodeResponse
 */
export interface UpdateVisitEpisodeResponse {
    /**
     * 
     * @type {Visit}
     * @memberof UpdateVisitEpisodeResponse
     */
    visit?: Visit;
}

/**
 * Check if a given object implements the UpdateVisitEpisodeResponse interface.
 */
export function instanceOfUpdateVisitEpisodeResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function UpdateVisitEpisodeResponseFromJSON(json: any): UpdateVisitEpisodeResponse {
    return UpdateVisitEpisodeResponseFromJSONTyped(json, false);
}

export function UpdateVisitEpisodeResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): UpdateVisitEpisodeResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'visit': !exists(json, 'visit') ? undefined : VisitFromJSON(json['visit']),
    };
}

export function UpdateVisitEpisodeResponseToJSON(value?: UpdateVisitEpisodeResponse | null): any {
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


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
import type { Episode } from './Episode';
import {
    EpisodeFromJSON,
    EpisodeFromJSONTyped,
    EpisodeToJSON,
} from './Episode';

/**
 * 
 * @export
 * @interface GetEpisodeResponse
 */
export interface GetEpisodeResponse {
    /**
     * 
     * @type {Episode}
     * @memberof GetEpisodeResponse
     */
    episode?: Episode;
}

/**
 * Check if a given object implements the GetEpisodeResponse interface.
 */
export function instanceOfGetEpisodeResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function GetEpisodeResponseFromJSON(json: any): GetEpisodeResponse {
    return GetEpisodeResponseFromJSONTyped(json, false);
}

export function GetEpisodeResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): GetEpisodeResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'episode': !exists(json, 'episode') ? undefined : EpisodeFromJSON(json['episode']),
    };
}

export function GetEpisodeResponseToJSON(value?: GetEpisodeResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'episode': EpisodeToJSON(value.episode),
    };
}


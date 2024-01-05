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
import type { PageInfo } from './PageInfo';
import {
    PageInfoFromJSON,
    PageInfoFromJSONTyped,
    PageInfoToJSON,
} from './PageInfo';
import type { User } from './User';
import {
    UserFromJSON,
    UserFromJSONTyped,
    UserToJSON,
} from './User';

/**
 * 
 * @export
 * @interface SearchUsersResponse
 */
export interface SearchUsersResponse {
    /**
     * users represents a list of users that match the given input.
     * @type {Array<User>}
     * @memberof SearchUsersResponse
     */
    users?: Array<User>;
    /**
     * 
     * @type {PageInfo}
     * @memberof SearchUsersResponse
     */
    meta?: PageInfo;
}

/**
 * Check if a given object implements the SearchUsersResponse interface.
 */
export function instanceOfSearchUsersResponse(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function SearchUsersResponseFromJSON(json: any): SearchUsersResponse {
    return SearchUsersResponseFromJSONTyped(json, false);
}

export function SearchUsersResponseFromJSONTyped(json: any, ignoreDiscriminator: boolean): SearchUsersResponse {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'users': !exists(json, 'users') ? undefined : ((json['users'] as Array<any>).map(UserFromJSON)),
        'meta': !exists(json, 'meta') ? undefined : PageInfoFromJSON(json['meta']),
    };
}

export function SearchUsersResponseToJSON(value?: SearchUsersResponse | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'users': value.users === undefined ? undefined : ((value.users as Array<any>).map(UserToJSON)),
        'meta': PageInfoToJSON(value.meta),
    };
}


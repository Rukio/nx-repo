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
 * @interface Any
 */
export interface Any {
    [key: string]: object | any;
    /**
     * 
     * @type {string}
     * @memberof Any
     */
    type?: string;
}

/**
 * Check if a given object implements the Any interface.
 */
export function instanceOfAny(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function AnyFromJSON(json: any): Any {
    return AnyFromJSONTyped(json, false);
}

export function AnyFromJSONTyped(json: any, ignoreDiscriminator: boolean): Any {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
            ...json,
        'type': !exists(json, '@type') ? undefined : json['@type'],
    };
}

export function AnyToJSON(value?: Any | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
            ...value,
        '@type': value.type,
    };
}


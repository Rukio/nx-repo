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
 * @interface CreateInsuranceFromStationCR
 */
export interface CreateInsuranceFromStationCR {
    /**
     * name refers to the name of the insurance
     * @type {string}
     * @memberof CreateInsuranceFromStationCR
     */
    name: string;
    /**
     * member_id represents id that the patient has with their insurance
     * @type {string}
     * @memberof CreateInsuranceFromStationCR
     */
    memberId?: string;
    /**
     * priority represents which priority the insurance will follow 1 being the
     * primary
     * @type {number}
     * @memberof CreateInsuranceFromStationCR
     */
    priority?: number;
}

/**
 * Check if a given object implements the CreateInsuranceFromStationCR interface.
 */
export function instanceOfCreateInsuranceFromStationCR(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "name" in value;

    return isInstance;
}

export function CreateInsuranceFromStationCRFromJSON(json: any): CreateInsuranceFromStationCR {
    return CreateInsuranceFromStationCRFromJSONTyped(json, false);
}

export function CreateInsuranceFromStationCRFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreateInsuranceFromStationCR {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': json['name'],
        'memberId': !exists(json, 'member_id') ? undefined : json['member_id'],
        'priority': !exists(json, 'priority') ? undefined : json['priority'],
    };
}

export function CreateInsuranceFromStationCRToJSON(value?: CreateInsuranceFromStationCR | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'member_id': value.memberId,
        'priority': value.priority,
    };
}


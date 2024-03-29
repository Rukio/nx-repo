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
 * @interface CreateMedicalDecisionMakerFromStationCR
 */
export interface CreateMedicalDecisionMakerFromStationCR {
    /**
     * Required. first_name represents the first name of the Medical Decision
     * Maker.
     * @type {string}
     * @memberof CreateMedicalDecisionMakerFromStationCR
     */
    firstName: string;
    /**
     * last_name represents the last name of the Medical Decision Maker.
     * @type {string}
     * @memberof CreateMedicalDecisionMakerFromStationCR
     */
    lastName?: string;
    /**
     * phone_number represents the phone number of the Medical Decision Maker.
     * @type {string}
     * @memberof CreateMedicalDecisionMakerFromStationCR
     */
    phoneNumber?: string;
    /**
     * address represents the full address Medical Decision Maker.
     * @type {string}
     * @memberof CreateMedicalDecisionMakerFromStationCR
     */
    address?: string;
    /**
     * relationship represents the relationship of the Medical Decision Maker to
     * the patient.
     * @type {string}
     * @memberof CreateMedicalDecisionMakerFromStationCR
     */
    relationship?: string;
}

/**
 * Check if a given object implements the CreateMedicalDecisionMakerFromStationCR interface.
 */
export function instanceOfCreateMedicalDecisionMakerFromStationCR(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "firstName" in value;

    return isInstance;
}

export function CreateMedicalDecisionMakerFromStationCRFromJSON(json: any): CreateMedicalDecisionMakerFromStationCR {
    return CreateMedicalDecisionMakerFromStationCRFromJSONTyped(json, false);
}

export function CreateMedicalDecisionMakerFromStationCRFromJSONTyped(json: any, ignoreDiscriminator: boolean): CreateMedicalDecisionMakerFromStationCR {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'firstName': json['first_name'],
        'lastName': !exists(json, 'last_name') ? undefined : json['last_name'],
        'phoneNumber': !exists(json, 'phone_number') ? undefined : json['phone_number'],
        'address': !exists(json, 'address') ? undefined : json['address'],
        'relationship': !exists(json, 'relationship') ? undefined : json['relationship'],
    };
}

export function CreateMedicalDecisionMakerFromStationCRToJSON(value?: CreateMedicalDecisionMakerFromStationCR | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'first_name': value.firstName,
        'last_name': value.lastName,
        'phone_number': value.phoneNumber,
        'address': value.address,
        'relationship': value.relationship,
    };
}


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
 * @interface CaremanagerAddress
 */
export interface CaremanagerAddress {
    /**
     * id represents the unique identifier of the Address.
     * @type {string}
     * @memberof CaremanagerAddress
     */
    id: string;
    /**
     * created_at represents the timestamp at which the Address was created.
     * @type {string}
     * @memberof CaremanagerAddress
     */
    createdAt: string;
    /**
     * updated_at represents the timestamp at which the Address was last updated.
     * @type {string}
     * @memberof CaremanagerAddress
     */
    updatedAt: string;
    /**
     * street_address_1 represents the main part of the street address like number
     * and street name.
     * @type {string}
     * @memberof CaremanagerAddress
     */
    streetAddress1?: string;
    /**
     * street_address_2 represents extra details for the street address.
     * @type {string}
     * @memberof CaremanagerAddress
     */
    streetAddress2?: string;
    /**
     * city represents the city the Address is in.
     * @type {string}
     * @memberof CaremanagerAddress
     */
    city?: string;
    /**
     * state represents the state the Address is in.
     * @type {string}
     * @memberof CaremanagerAddress
     */
    state?: string;
    /**
     * zipcode represents the zipcode of the Address.
     * @type {string}
     * @memberof CaremanagerAddress
     */
    zipcode?: string;
    /**
     * latitude represents the latitude of the Address.
     * @type {number}
     * @memberof CaremanagerAddress
     */
    latitude?: number;
    /**
     * longitude represents the longitude of the Address.
     * @type {number}
     * @memberof CaremanagerAddress
     */
    longitude?: number;
    /**
     * additional_details represents any additional details for the Address.
     * @type {string}
     * @memberof CaremanagerAddress
     */
    additionalDetails?: string;
}

/**
 * Check if a given object implements the CaremanagerAddress interface.
 */
export function instanceOfCaremanagerAddress(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "id" in value;
    isInstance = isInstance && "createdAt" in value;
    isInstance = isInstance && "updatedAt" in value;

    return isInstance;
}

export function CaremanagerAddressFromJSON(json: any): CaremanagerAddress {
    return CaremanagerAddressFromJSONTyped(json, false);
}

export function CaremanagerAddressFromJSONTyped(json: any, ignoreDiscriminator: boolean): CaremanagerAddress {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': json['id'],
        'createdAt': json['created_at'],
        'updatedAt': json['updated_at'],
        'streetAddress1': !exists(json, 'street_address_1') ? undefined : json['street_address_1'],
        'streetAddress2': !exists(json, 'street_address_2') ? undefined : json['street_address_2'],
        'city': !exists(json, 'city') ? undefined : json['city'],
        'state': !exists(json, 'state') ? undefined : json['state'],
        'zipcode': !exists(json, 'zipcode') ? undefined : json['zipcode'],
        'latitude': !exists(json, 'latitude') ? undefined : json['latitude'],
        'longitude': !exists(json, 'longitude') ? undefined : json['longitude'],
        'additionalDetails': !exists(json, 'additional_details') ? undefined : json['additional_details'],
    };
}

export function CaremanagerAddressToJSON(value?: CaremanagerAddress | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
        'created_at': value.createdAt,
        'updated_at': value.updatedAt,
        'street_address_1': value.streetAddress1,
        'street_address_2': value.streetAddress2,
        'city': value.city,
        'state': value.state,
        'zipcode': value.zipcode,
        'latitude': value.latitude,
        'longitude': value.longitude,
        'additional_details': value.additionalDetails,
    };
}


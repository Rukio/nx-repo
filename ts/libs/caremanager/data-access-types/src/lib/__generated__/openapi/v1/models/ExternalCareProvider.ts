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
 * @interface ExternalCareProvider
 */
export interface ExternalCareProvider {
    /**
     * id represents the unique identifier of the ExternalCareProvider.
     * @type {string}
     * @memberof ExternalCareProvider
     */
    id: string;
    /**
     * name represents the name of the ExternalCareProvider.
     * @type {string}
     * @memberof ExternalCareProvider
     */
    name: string;
    /**
     * phone_number represents the phone number of the ExternalCareProvider.
     * @type {string}
     * @memberof ExternalCareProvider
     */
    phoneNumber?: string;
    /**
     * fax_number represents the fax number of the ExternalCareProvider.
     * @type {string}
     * @memberof ExternalCareProvider
     */
    faxNumber?: string;
    /**
     * address represents the full string representation of the
     * ExternalCareProvider address.
     * @type {string}
     * @memberof ExternalCareProvider
     */
    address?: string;
    /**
     * provider_type_id represents the ID of the ProviderType that this
     * ExternalCareProvider is assigned to.
     * @type {string}
     * @memberof ExternalCareProvider
     */
    providerTypeId: string;
    /**
     * patient_id represents the id for the patient this ExternalCareProvider is
     * associated with.
     * @type {string}
     * @memberof ExternalCareProvider
     */
    patientId: string;
}

/**
 * Check if a given object implements the ExternalCareProvider interface.
 */
export function instanceOfExternalCareProvider(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "id" in value;
    isInstance = isInstance && "name" in value;
    isInstance = isInstance && "providerTypeId" in value;
    isInstance = isInstance && "patientId" in value;

    return isInstance;
}

export function ExternalCareProviderFromJSON(json: any): ExternalCareProvider {
    return ExternalCareProviderFromJSONTyped(json, false);
}

export function ExternalCareProviderFromJSONTyped(json: any, ignoreDiscriminator: boolean): ExternalCareProvider {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': json['id'],
        'name': json['name'],
        'phoneNumber': !exists(json, 'phone_number') ? undefined : json['phone_number'],
        'faxNumber': !exists(json, 'fax_number') ? undefined : json['fax_number'],
        'address': !exists(json, 'address') ? undefined : json['address'],
        'providerTypeId': json['provider_type_id'],
        'patientId': json['patient_id'],
    };
}

export function ExternalCareProviderToJSON(value?: ExternalCareProvider | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'id': value.id,
        'name': value.name,
        'phone_number': value.phoneNumber,
        'fax_number': value.faxNumber,
        'address': value.address,
        'provider_type_id': value.providerTypeId,
        'patient_id': value.patientId,
    };
}


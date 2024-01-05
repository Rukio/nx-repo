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
 * @interface CareManagerServiceUpdateEpisodeRequest
 */
export interface CareManagerServiceUpdateEpisodeRequest {
    /**
     * patient_summary represents the patient's summary of the Episode.
     * @type {string}
     * @memberof CareManagerServiceUpdateEpisodeRequest
     */
    patientSummary?: string;
    /**
     * service_lint_id represents the ServiceLine ID the Episode belongs to.
     * @type {string}
     * @memberof CareManagerServiceUpdateEpisodeRequest
     */
    serviceLineId?: string;
    /**
     * care_phase_id represents the CarePhase ID the Episode belongs to.
     * @type {string}
     * @memberof CareManagerServiceUpdateEpisodeRequest
     */
    carePhaseId?: string;
    /**
     * market_id represents the Market ID the Episode belongs to.
     * @type {string}
     * @memberof CareManagerServiceUpdateEpisodeRequest
     */
    marketId?: string;
    /**
     * admitted_at represents the the date and time when Episode was admitted.
     * @type {string}
     * @memberof CareManagerServiceUpdateEpisodeRequest
     */
    admittedAt?: string;
    /**
     * apply_template_ids represents an array of TaskTemplate IDs to be applied
     * to the Episode.
     * @type {Array<string>}
     * @memberof CareManagerServiceUpdateEpisodeRequest
     */
    applyTemplateIds?: Array<string>;
    /**
     * is_waiver represents if the Episode is marked as Waiver.
     * @type {boolean}
     * @memberof CareManagerServiceUpdateEpisodeRequest
     */
    isWaiver?: boolean;
}

/**
 * Check if a given object implements the CareManagerServiceUpdateEpisodeRequest interface.
 */
export function instanceOfCareManagerServiceUpdateEpisodeRequest(value: object): boolean {
    let isInstance = true;

    return isInstance;
}

export function CareManagerServiceUpdateEpisodeRequestFromJSON(json: any): CareManagerServiceUpdateEpisodeRequest {
    return CareManagerServiceUpdateEpisodeRequestFromJSONTyped(json, false);
}

export function CareManagerServiceUpdateEpisodeRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): CareManagerServiceUpdateEpisodeRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'patientSummary': !exists(json, 'patient_summary') ? undefined : json['patient_summary'],
        'serviceLineId': !exists(json, 'service_line_id') ? undefined : json['service_line_id'],
        'carePhaseId': !exists(json, 'care_phase_id') ? undefined : json['care_phase_id'],
        'marketId': !exists(json, 'market_id') ? undefined : json['market_id'],
        'admittedAt': !exists(json, 'admitted_at') ? undefined : json['admitted_at'],
        'applyTemplateIds': !exists(json, 'apply_template_ids') ? undefined : json['apply_template_ids'],
        'isWaiver': !exists(json, 'is_waiver') ? undefined : json['is_waiver'],
    };
}

export function CareManagerServiceUpdateEpisodeRequestToJSON(value?: CareManagerServiceUpdateEpisodeRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'patient_summary': value.patientSummary,
        'service_line_id': value.serviceLineId,
        'care_phase_id': value.carePhaseId,
        'market_id': value.marketId,
        'admitted_at': value.admittedAt,
        'apply_template_ids': value.applyTemplateIds,
        'is_waiver': value.isWaiver,
    };
}

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
import type { UpdateTaskTemplateTask } from './UpdateTaskTemplateTask';
import {
    UpdateTaskTemplateTaskFromJSON,
    UpdateTaskTemplateTaskFromJSONTyped,
    UpdateTaskTemplateTaskToJSON,
} from './UpdateTaskTemplateTask';

/**
 * 
 * @export
 * @interface CareManagerServiceUpdateTaskTemplateRequest
 */
export interface CareManagerServiceUpdateTaskTemplateRequest {
    /**
     * name of the task template
     * @type {string}
     * @memberof CareManagerServiceUpdateTaskTemplateRequest
     */
    name?: string;
    /**
     * summary is a text that describes the intended usage of the task template
     * @type {string}
     * @memberof CareManagerServiceUpdateTaskTemplateRequest
     */
    summary?: string;
    /**
     * service_line_id represents the ServiceLine ID the Template belongs to.
     * @type {string}
     * @memberof CareManagerServiceUpdateTaskTemplateRequest
     */
    serviceLineId?: string;
    /**
     * care_phase_id represents the CarePhase ID the Template belongs to.
     * @type {string}
     * @memberof CareManagerServiceUpdateTaskTemplateRequest
     */
    carePhaseId?: string;
    /**
     * tasks represents a collection of new Tasks to be created.
     * @type {Array<UpdateTaskTemplateTask>}
     * @memberof CareManagerServiceUpdateTaskTemplateRequest
     */
    tasks: Array<UpdateTaskTemplateTask>;
    /**
     * body is the description of the task in the template
     * @type {string}
     * @memberof CareManagerServiceUpdateTaskTemplateRequest
     */
    body?: string;
}

/**
 * Check if a given object implements the CareManagerServiceUpdateTaskTemplateRequest interface.
 */
export function instanceOfCareManagerServiceUpdateTaskTemplateRequest(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "tasks" in value;

    return isInstance;
}

export function CareManagerServiceUpdateTaskTemplateRequestFromJSON(json: any): CareManagerServiceUpdateTaskTemplateRequest {
    return CareManagerServiceUpdateTaskTemplateRequestFromJSONTyped(json, false);
}

export function CareManagerServiceUpdateTaskTemplateRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): CareManagerServiceUpdateTaskTemplateRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'name': !exists(json, 'name') ? undefined : json['name'],
        'summary': !exists(json, 'summary') ? undefined : json['summary'],
        'serviceLineId': !exists(json, 'service_line_id') ? undefined : json['service_line_id'],
        'carePhaseId': !exists(json, 'care_phase_id') ? undefined : json['care_phase_id'],
        'tasks': ((json['tasks'] as Array<any>).map(UpdateTaskTemplateTaskFromJSON)),
        'body': !exists(json, 'body') ? undefined : json['body'],
    };
}

export function CareManagerServiceUpdateTaskTemplateRequestToJSON(value?: CareManagerServiceUpdateTaskTemplateRequest | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'name': value.name,
        'summary': value.summary,
        'service_line_id': value.serviceLineId,
        'care_phase_id': value.carePhaseId,
        'tasks': ((value.tasks as Array<any>).map(UpdateTaskTemplateTaskToJSON)),
        'body': value.body,
    };
}

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
 * @interface VisitSummary
 */
export interface VisitSummary {
    /**
     * body represents the written summary of the Visit.
     * @type {string}
     * @memberof VisitSummary
     */
    body: string;
    /**
     * created_at represents the date and time when the VisitSummary was created.
     * @type {string}
     * @memberof VisitSummary
     */
    createdAt: string;
    /**
     * updated_at represents the date and time when the VisitSummary was last
     * updated.
     * @type {string}
     * @memberof VisitSummary
     */
    updatedAt: string;
    /**
     * created_by_user_id represents the ID of the User that created the Visit.
     * @type {string}
     * @memberof VisitSummary
     */
    createdByUserId?: string;
    /**
     * updated_by_user_id represents the ID of the User that last updated the
     * Visit.
     * @type {string}
     * @memberof VisitSummary
     */
    updatedByUserId?: string;
    /**
     * visit_id represents the unique identifier of the Visit this VisitSummary
     * belongs to.
     * @type {string}
     * @memberof VisitSummary
     */
    visitId: string;
}

/**
 * Check if a given object implements the VisitSummary interface.
 */
export function instanceOfVisitSummary(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "body" in value;
    isInstance = isInstance && "createdAt" in value;
    isInstance = isInstance && "updatedAt" in value;
    isInstance = isInstance && "visitId" in value;

    return isInstance;
}

export function VisitSummaryFromJSON(json: any): VisitSummary {
    return VisitSummaryFromJSONTyped(json, false);
}

export function VisitSummaryFromJSONTyped(json: any, ignoreDiscriminator: boolean): VisitSummary {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'body': json['body'],
        'createdAt': json['created_at'],
        'updatedAt': json['updated_at'],
        'createdByUserId': !exists(json, 'created_by_user_id') ? undefined : json['created_by_user_id'],
        'updatedByUserId': !exists(json, 'updated_by_user_id') ? undefined : json['updated_by_user_id'],
        'visitId': json['visit_id'],
    };
}

export function VisitSummaryToJSON(value?: VisitSummary | null): any {
    if (value === undefined) {
        return undefined;
    }
    if (value === null) {
        return null;
    }
    return {
        
        'body': value.body,
        'created_at': value.createdAt,
        'updated_at': value.updatedAt,
        'created_by_user_id': value.createdByUserId,
        'updated_by_user_id': value.updatedByUserId,
        'visit_id': value.visitId,
    };
}


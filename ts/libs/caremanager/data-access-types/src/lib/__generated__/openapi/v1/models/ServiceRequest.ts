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
 * @interface ServiceRequest
 */
export interface ServiceRequest {
    /**
     * id represents the unique identifier of the ServiceRequest.
     * @type {string}
     * @memberof ServiceRequest
     */
    id: string;
    /**
     * created_at represents the date and time when the ServiceRequest was
     * created.
     * @type {string}
     * @memberof ServiceRequest
     */
    createdAt: string;
    /**
     * updated_at represents the date and time when the ServiceRequest was last
     * updated.
     * @type {string}
     * @memberof ServiceRequest
     */
    updatedAt: string;
    /**
     * market_id represents the id of the Market the ServiceRequest is assigned
     * to.
     * @type {string}
     * @memberof ServiceRequest
     */
    marketId: string;
    /**
     * status_id represents the id of the ServiceRequestStatus that the
     * ServiceRequest has.
     * @type {string}
     * @memberof ServiceRequest
     */
    statusId: string;
    /**
     * is_insurance_verified is a flag for knowing if a ServiceRequest insurance
     * is verified.
     * @type {boolean}
     * @memberof ServiceRequest
     */
    isInsuranceVerified: boolean;
    /**
     * assigned_user_id is the id of the User that the ServiceRequest is assigned
     * to.
     * @type {string}
     * @memberof ServiceRequest
     */
    assignedUserId?: string;
    /**
     * updated_by_user_id represents the ID of the User that last updated the
     * ServiceRequest.
     * @type {string}
     * @memberof ServiceRequest
     */
    updatedByUserId?: string;
    /**
     * reject_reason represents why the Service Request changed to Rejected status
     * @type {string}
     * @memberof ServiceRequest
     */
    rejectReason?: string;
    /**
     * rejected_at represents the date and time when the ServiceRequest was
     * rejected.
     * @type {string}
     * @memberof ServiceRequest
     */
    rejectedAt?: string;
    /**
     * care_request_id the care request id of the service request.
     * @type {string}
     * @memberof ServiceRequest
     */
    careRequestId?: string;
    /**
     * category_id is the id of the category this service request belongs to.
     * @type {string}
     * @memberof ServiceRequest
     */
    categoryId?: string;
    /**
     * cms_number represents the CMS affiliation number of the ServiceRequest.
     * @type {string}
     * @memberof ServiceRequest
     */
    cmsNumber?: string;
}

/**
 * Check if a given object implements the ServiceRequest interface.
 */
export function instanceOfServiceRequest(value: object): boolean {
    let isInstance = true;
    isInstance = isInstance && "id" in value;
    isInstance = isInstance && "createdAt" in value;
    isInstance = isInstance && "updatedAt" in value;
    isInstance = isInstance && "marketId" in value;
    isInstance = isInstance && "statusId" in value;
    isInstance = isInstance && "isInsuranceVerified" in value;

    return isInstance;
}

export function ServiceRequestFromJSON(json: any): ServiceRequest {
    return ServiceRequestFromJSONTyped(json, false);
}

export function ServiceRequestFromJSONTyped(json: any, ignoreDiscriminator: boolean): ServiceRequest {
    if ((json === undefined) || (json === null)) {
        return json;
    }
    return {
        
        'id': json['id'],
        'createdAt': json['created_at'],
        'updatedAt': json['updated_at'],
        'marketId': json['market_id'],
        'statusId': json['status_id'],
        'isInsuranceVerified': json['is_insurance_verified'],
        'assignedUserId': !exists(json, 'assigned_user_id') ? undefined : json['assigned_user_id'],
        'updatedByUserId': !exists(json, 'updated_by_user_id') ? undefined : json['updated_by_user_id'],
        'rejectReason': !exists(json, 'reject_reason') ? undefined : json['reject_reason'],
        'rejectedAt': !exists(json, 'rejected_at') ? undefined : json['rejected_at'],
        'careRequestId': !exists(json, 'care_request_id') ? undefined : json['care_request_id'],
        'categoryId': !exists(json, 'category_id') ? undefined : json['category_id'],
        'cmsNumber': !exists(json, 'cms_number') ? undefined : json['cms_number'],
    };
}

export function ServiceRequestToJSON(value?: ServiceRequest | null): any {
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
        'market_id': value.marketId,
        'status_id': value.statusId,
        'is_insurance_verified': value.isInsuranceVerified,
        'assigned_user_id': value.assignedUserId,
        'updated_by_user_id': value.updatedByUserId,
        'reject_reason': value.rejectReason,
        'rejected_at': value.rejectedAt,
        'care_request_id': value.careRequestId,
        'category_id': value.categoryId,
        'cms_number': value.cmsNumber,
    };
}


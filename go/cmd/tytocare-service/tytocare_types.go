package main

import (
	"errors"
)

var (
	errVisitNoResponse                = errors.New("TytoCare visit response cannot be nil")
	errVisitNoRequest                 = errors.New("TytoCare visit request cannot be nil")
	errVisitNoVisitID                 = errors.New("TytoCare visit requires visit id")
	errVisitNoDhmtID                  = errors.New("TytoCare visit requires DHMT id")
	errVisitNoPatientID               = errors.New("TytoCare visit requires patient id")
	errVisitNoVirtualAppID            = errors.New("TytoCare visit requires virtual app id")
	errVisitNoVirtualAppRemoteAddress = errors.New("TytoCare visit requires virtual app remote address")
	errVisitNoTytoIdentifier          = errors.New("TytoCare visit response requires tyto identifier")
	errVisitNoClinicianURL            = errors.New("TytoCare visit response requires clinician url")
	errDeepLinkNoResponse             = errors.New("TytoCare generate deep link response cannot be nil")
	errDeepLinkNoRequest              = errors.New("TytoCare generate deep link request cannot be nil")
	errDeepLinkNoPatientID            = errors.New("TytoCare generate deep link request requires patient id")
	errDeepLinkNoDhmtID               = errors.New("TytoCare generate deep link request requires dhmt id")
	errDeepLinkNoVisitID              = errors.New("TytoCare generate deep link request requires visit id")
	errDeepLinkNoIosDeepLink          = errors.New("TytoCare generate deep link response requires TytoCare iOS deep link")
)

type TytoCareCreatePatientRequest struct {
	Identifier  *string `json:"identifier,omitempty"`
	FirstName   *string `json:"firstName,omitempty"`
	LastName    *string `json:"lastName,omitempty"`
	DateOfBirth *string `json:"dateOfBirth,omitempty"`
	Sex         *string `json:"sex,omitempty"`
}

type TytoCareCreateVisitRequest struct {
	UseTytoApp                   *bool   `json:"useTytoApp,omitempty"`
	Identifier                   *string `json:"identifier,omitempty"`
	AssistingClinicianIdentifier *string `json:"assistingClinicianIdentifier,omitempty"`
	PatientIdentifier            *string `json:"patientIdentifier,omitempty"`
	ClinicalIdentifier           *string `json:"clinicianIdentifier,omitempty"`
	ClinicianRemoteAddress       *string `json:"clinicianRemoteAddress,omitempty"`
}

type TytoCareCreateVisitResponse struct {
	TytoIdentifier *string `json:"tytoIdentifier,omitempty"`
}

type TytoCareActivateVisitRequest struct {
	Identifier             *string `json:"identifier,omitempty"`
	Status                 *string `json:"status,omitempty"`
	UseTytoApp             *bool   `json:"useTytoApp,omitempty"`
	ClinicalIdentifier     *string `json:"clinicianIdentifier,omitempty"`
	ClinicianRemoteAddress *string `json:"clinicianRemoteAddress,omitempty"`
}

type TytoCareAssignClinicianToVisitRequest struct {
	Identifier          *string `json:"identifier,omitempty"`
	ClinicianIdentifier *string `json:"clinicianIdentifier,omitempty"`
}

type TytoCareActivateVisitResponse struct {
	TytoIdentifier *string `json:"tytoIdentifier,omitempty"`
	ClinicianURL   *string `json:"clinicianUrl,omitempty"`
}

type TytoCareGenerateDeepLinkRequest struct {
	PatientIdentifier            *string `json:"patientIdentifier,omitempty"`
	AssistingClinicianIdentifier *string `json:"assistingClinicianIdentifier,omitempty"`
	VisitIdentifier              *string `json:"visitIdentifier,omitempty"`
}

type TytoCareGenerateDeepLinkResponse struct {
	AndroidDeepLink *string `json:"androidDeepLink,omitempty"`
	IOSDeepLink     *string `json:"iosDeepLink,omitempty"`
}

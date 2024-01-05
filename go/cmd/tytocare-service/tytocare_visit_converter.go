package main

import (
	tytocarepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/tytocare"
)

var (
	useTytoApp   = true
	activeStatus = "ACTIVE"
)

func ProtoToTytoCareCreateVisit(visitProto *tytocarepb.CreateVisitRequest) (*TytoCareCreateVisitRequest, error) {
	if visitProto == nil {
		return nil, errVisitNoRequest
	}

	if visitProto.VisitId == "" {
		return nil, errVisitNoVisitID
	}

	if visitProto.PatientId == "" {
		return nil, errVisitNoPatientID
	}

	if visitProto.DhmtId == "" {
		return nil, errVisitNoDhmtID
	}

	return &TytoCareCreateVisitRequest{
		UseTytoApp:                   &useTytoApp,
		Identifier:                   &visitProto.VisitId,
		AssistingClinicianIdentifier: &visitProto.DhmtId,
		PatientIdentifier:            &visitProto.PatientId,
		ClinicalIdentifier:           &visitProto.VirtualAppId,
		ClinicianRemoteAddress:       &visitProto.VirtualAppRemoteAddress,
	}, nil
}

func TytoCareCreateVisitToProto(visit *TytoCareCreateVisitResponse, visitID string) (*tytocarepb.CreateVisitResponse, error) {
	if visit == nil {
		return nil, errVisitNoResponse
	}

	if StringIsNilOrEmpty(visit.TytoIdentifier) {
		return nil, errVisitNoTytoIdentifier
	}

	if visitID == "" {
		return nil, errVisitNoVisitID
	}

	return &tytocarepb.CreateVisitResponse{
		TytoCareId: *visit.TytoIdentifier,
		VisitId:    visitID,
	}, nil
}

func ProtoToTytoCareActivateVisit(visitProto *tytocarepb.ActivateVisitRequest) (*TytoCareActivateVisitRequest, error) {
	if visitProto == nil {
		return nil, errVisitNoRequest
	}

	if visitProto.VirtualAppId == "" {
		return nil, errVisitNoVirtualAppID
	}

	if visitProto.VirtualAppRemoteAddress == "" {
		return nil, errVisitNoVirtualAppRemoteAddress
	}

	return &TytoCareActivateVisitRequest{
		UseTytoApp:             &useTytoApp,
		Status:                 &activeStatus,
		Identifier:             &visitProto.VisitId,
		ClinicalIdentifier:     &visitProto.VirtualAppId,
		ClinicianRemoteAddress: &visitProto.VirtualAppRemoteAddress,
	}, nil
}

func TytoCareActivateVisitToProto(visit *TytoCareActivateVisitResponse) (*tytocarepb.ActivateVisitResponse, error) {
	if visit == nil {
		return nil, errVisitNoResponse
	}

	if visit.TytoIdentifier == nil {
		return nil, errVisitNoTytoIdentifier
	}

	if visit.ClinicianURL == nil {
		return nil, errVisitNoClinicianURL
	}

	return &tytocarepb.ActivateVisitResponse{
		TytoCareId:   *visit.TytoIdentifier,
		ClinicianUrl: *visit.ClinicianURL,
	}, nil
}

func ProtoToTytoCareAssignClinicianToVisit(visitProto *tytocarepb.AssignClinicianToVisitRequest) (*TytoCareAssignClinicianToVisitRequest, error) {
	if visitProto == nil {
		return nil, errVisitNoRequest
	}

	if visitProto.VirtualAppId == "" {
		return nil, errVisitNoVirtualAppID
	}

	return &TytoCareAssignClinicianToVisitRequest{
		Identifier:          &visitProto.VisitId,
		ClinicianIdentifier: &visitProto.VirtualAppId,
	}, nil
}

func ProtoToTytoCareGenerateDeepLinkReq(generateDeepLinkProto *tytocarepb.GenerateDeepLinkRequest) (*TytoCareGenerateDeepLinkRequest, error) {
	if generateDeepLinkProto == nil {
		return nil, errDeepLinkNoRequest
	}

	if generateDeepLinkProto.PatientId == "" {
		return nil, errDeepLinkNoPatientID
	}
	if generateDeepLinkProto.DhmtId == "" {
		return nil, errDeepLinkNoDhmtID
	}
	if generateDeepLinkProto.VisitId == "" {
		return nil, errDeepLinkNoVisitID
	}

	return &TytoCareGenerateDeepLinkRequest{
		PatientIdentifier:            &generateDeepLinkProto.PatientId,
		AssistingClinicianIdentifier: &generateDeepLinkProto.DhmtId,
		VisitIdentifier:              &generateDeepLinkProto.VisitId,
	}, nil
}

func TytoCareGenerateDeepLinkToProtoResp(generateDeepLink *TytoCareGenerateDeepLinkResponse) (*tytocarepb.GenerateDeepLinkResponse, error) {
	if generateDeepLink == nil {
		return nil, errDeepLinkNoResponse
	}

	if generateDeepLink.IOSDeepLink == nil {
		return nil, errDeepLinkNoIosDeepLink
	}

	return &tytocarepb.GenerateDeepLinkResponse{
		DeepLink: *generateDeepLink.IOSDeepLink,
	}, nil
}

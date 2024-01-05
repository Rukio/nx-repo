package main

import (
	"context"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type AthenaServiceClientMock struct {
	athena.AthenaServiceClient
	GetPatientHandler                              func(ctx context.Context, in *athena.GetPatientRequest, opts ...grpc.CallOption) (*athena.GetPatientResponse, error)
	CreatePatientHandler                           func(ctx context.Context, in *athena.CreatePatientRequest, opts ...grpc.CallOption) (*athena.CreatePatientResponse, error)
	UpdatePatientHandler                           func(ctx context.Context, in *athena.UpdatePatientRequest, opts ...grpc.CallOption) (*athena.UpdatePatientResponse, error)
	EnhancedBestMatchHandler                       func(ctx context.Context, in *athena.EnhancedBestMatchRequest, opts ...grpc.CallOption) (*athena.EnhancedBestMatchResponse, error)
	UpdateDefaultPharmacyHandler                   func(ctx context.Context, in *athena.UpdateDefaultPharmacyRequest, opts ...grpc.CallOption) (*athena.UpdateDefaultPharmacyResponse, error)
	GetPreferredPharmaciesHandler                  func(ctx context.Context, in *athena.GetPreferredPharmaciesRequest, opts ...grpc.CallOption) (*athena.GetPreferredPharmaciesResponse, error)
	UpdatePreferredPharmacyHandler                 func(ctx context.Context, in *athena.UpdatePreferredPharmacyRequest, opts ...grpc.CallOption) (*athena.UpdatePreferredPharmacyResponse, error)
	DeletePreferredPharmacyHandler                 func(ctx context.Context, in *athena.DeletePreferredPharmacyRequest, opts ...grpc.CallOption) (*athena.DeletePreferredPharmacyResponse, error)
	GetDefaultPharmacyHandler                      func(ctx context.Context, in *athena.GetDefaultPharmacyRequest, opts ...grpc.CallOption) (*athena.GetDefaultPharmacyResponse, error)
	GetCareTeamHandler                             func(ctx context.Context, in *athena.GetCareTeamRequest, opts ...grpc.CallOption) (*athena.GetCareTeamResponse, error)
	UpdateCareTeamHandler                          func(ctx context.Context, in *athena.UpdateCareTeamRequest, opts ...grpc.CallOption) (*athena.UpdateCareTeamResponse, error)
	DeleteCareTeamHandler                          func(ctx context.Context, in *athena.DeleteCareTeamRequest, opts ...grpc.CallOption) (*athena.DeleteCareTeamResponse, error)
	GetPatientInsuranceHandler                     func(ctx context.Context, in *athena.GetPatientInsuranceRequest, opts ...grpc.CallOption) (*athena.GetPatientInsuranceResponse, error)
	CreatePatientInsuranceHandler                  func(ctx context.Context, in *athena.CreatePatientInsuranceRequest, opts ...grpc.CallOption) (*athena.CreatePatientInsuranceResponse, error)
	UpdatePatientInsuranceHandler                  func(ctx context.Context, in *athena.UpdatePatientInsuranceRequest, opts ...grpc.CallOption) (*athena.UpdatePatientInsuranceResponse, error)
	DeletePatientSpecificInsuranceHandler          func(ctx context.Context, in *athena.DeletePatientSpecificInsuranceRequest, opts ...grpc.CallOption) (*athena.DeletePatientSpecificInsuranceResponse, error)
	SearchClinicalProvidersHandler                 func(ctx context.Context, in *athena.SearchClinicalProvidersRequest, opts ...grpc.CallOption) (*athena.SearchClinicalProvidersResponse, error)
	ListRecipientClassesHandler                    func(ctx context.Context, in *athena.ListRecipientClassesRequest, opts ...grpc.CallOption) (*athena.ListRecipientClassesResponse, error)
	SearchPatientsHandler                          func(ctx context.Context, in *athena.SearchPatientsRequest, opts ...grpc.CallOption) (*athena.SearchPatientsResponse, error)
	GetPatientInsuranceBenefitDetailsHandler       func(ctx context.Context, in *athena.GetPatientInsuranceBenefitDetailsRequest, opts ...grpc.CallOption) (*athena.GetPatientInsuranceBenefitDetailsResponse, error)
	TriggerPatientInsuranceEligibilityCheckHandler func(ctx context.Context, in *athena.TriggerPatientInsuranceEligibilityCheckRequest, opts ...grpc.CallOption) (*athena.TriggerPatientInsuranceEligibilityCheckResponse, error)
}

func (mock *AthenaServiceClientMock) GetPatient(ctx context.Context, in *athena.GetPatientRequest, opts ...grpc.CallOption) (*athena.GetPatientResponse, error) {
	if mock.GetPatientHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetPatient not defined")
	}
	return mock.GetPatientHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) CreatePatient(ctx context.Context, in *athena.CreatePatientRequest, opts ...grpc.CallOption) (*athena.CreatePatientResponse, error) {
	if mock.CreatePatientHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock CreatePatient not defined")
	}
	return mock.CreatePatientHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) UpdatePatient(ctx context.Context, in *athena.UpdatePatientRequest, opts ...grpc.CallOption) (*athena.UpdatePatientResponse, error) {
	if mock.UpdatePatientHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock UpdatePatient not defined")
	}
	return mock.UpdatePatientHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) EnhancedBestMatch(ctx context.Context, in *athena.EnhancedBestMatchRequest, opts ...grpc.CallOption) (*athena.EnhancedBestMatchResponse, error) {
	if mock.EnhancedBestMatchHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock EnhancedBestMatch not defined")
	}
	return mock.EnhancedBestMatchHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) UpdateDefaultPharmacy(ctx context.Context, in *athena.UpdateDefaultPharmacyRequest, opts ...grpc.CallOption) (*athena.UpdateDefaultPharmacyResponse, error) {
	if mock.UpdateDefaultPharmacyHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock UpdateDefaultPharmacy not defined")
	}
	return mock.UpdateDefaultPharmacyHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) GetPreferredPharmacies(ctx context.Context, in *athena.GetPreferredPharmaciesRequest, opts ...grpc.CallOption) (*athena.GetPreferredPharmaciesResponse, error) {
	if mock.GetPreferredPharmaciesHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetPreferredPharmacies not defined")
	}
	return mock.GetPreferredPharmaciesHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) UpdatePreferredPharmacy(ctx context.Context, in *athena.UpdatePreferredPharmacyRequest, opts ...grpc.CallOption) (*athena.UpdatePreferredPharmacyResponse, error) {
	if mock.UpdatePreferredPharmacyHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock UpdatePreferredPharmacy not defined")
	}
	return mock.UpdatePreferredPharmacyHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) DeletePreferredPharmacy(ctx context.Context, in *athena.DeletePreferredPharmacyRequest, opts ...grpc.CallOption) (*athena.DeletePreferredPharmacyResponse, error) {
	if mock.DeletePreferredPharmacyHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock DeletePreferredPharmacy not defined")
	}
	return mock.DeletePreferredPharmacyHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) GetDefaultPharmacy(ctx context.Context, in *athena.GetDefaultPharmacyRequest, opts ...grpc.CallOption) (*athena.GetDefaultPharmacyResponse, error) {
	if mock.GetDefaultPharmacyHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetDefaultPharmacy not defined")
	}
	return mock.GetDefaultPharmacyHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) GetCareTeam(ctx context.Context, in *athena.GetCareTeamRequest, opts ...grpc.CallOption) (*athena.GetCareTeamResponse, error) {
	if mock.GetCareTeamHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetCareTeam not defined")
	}
	return mock.GetCareTeamHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) UpdateCareTeam(ctx context.Context, in *athena.UpdateCareTeamRequest, opts ...grpc.CallOption) (*athena.UpdateCareTeamResponse, error) {
	if mock.UpdateCareTeamHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock UpdateCareTeam not defined")
	}
	return mock.UpdateCareTeamHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) DeleteCareTeam(ctx context.Context, in *athena.DeleteCareTeamRequest, opts ...grpc.CallOption) (*athena.DeleteCareTeamResponse, error) {
	if mock.DeleteCareTeamHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock DeleteCareTeam not defined")
	}
	return mock.DeleteCareTeamHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) GetPatientInsurance(ctx context.Context, in *athena.GetPatientInsuranceRequest, opts ...grpc.CallOption) (*athena.GetPatientInsuranceResponse, error) {
	if mock.GetPatientInsuranceHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetPatientInsurance not defined")
	}
	return mock.GetPatientInsuranceHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) CreatePatientInsurance(ctx context.Context, in *athena.CreatePatientInsuranceRequest, opts ...grpc.CallOption) (*athena.CreatePatientInsuranceResponse, error) {
	if mock.CreatePatientInsuranceHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock CreatePatientInsurance not defined")
	}
	return mock.CreatePatientInsuranceHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) UpdatePatientInsurance(ctx context.Context, in *athena.UpdatePatientInsuranceRequest, opts ...grpc.CallOption) (*athena.UpdatePatientInsuranceResponse, error) {
	if mock.UpdatePatientInsuranceHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock UpdatePatientInsurance not defined")
	}
	return mock.UpdatePatientInsuranceHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) DeletePatientSpecificInsurance(ctx context.Context, in *athena.DeletePatientSpecificInsuranceRequest, opts ...grpc.CallOption) (*athena.DeletePatientSpecificInsuranceResponse, error) {
	if mock.DeletePatientSpecificInsuranceHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock DeletePatientSpecificInsurance not defined")
	}
	return mock.DeletePatientSpecificInsuranceHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) SearchClinicalProviders(ctx context.Context, in *athena.SearchClinicalProvidersRequest, opts ...grpc.CallOption) (*athena.SearchClinicalProvidersResponse, error) {
	if mock.SearchClinicalProvidersHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock SearchClinicalProviders not defined")
	}
	return mock.SearchClinicalProvidersHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) ListRecipientClasses(ctx context.Context, in *athena.ListRecipientClassesRequest, opts ...grpc.CallOption) (*athena.ListRecipientClassesResponse, error) {
	if mock.ListRecipientClassesHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock ListRecipientClasses not defined")
	}
	return mock.ListRecipientClassesHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) SearchPatients(ctx context.Context, in *athena.SearchPatientsRequest, opts ...grpc.CallOption) (*athena.SearchPatientsResponse, error) {
	if mock.SearchPatientsHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock SearchPatients not defined")
	}
	return mock.SearchPatientsHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) GetPatientInsuranceBenefitDetails(ctx context.Context, in *athena.GetPatientInsuranceBenefitDetailsRequest, opts ...grpc.CallOption) (*athena.GetPatientInsuranceBenefitDetailsResponse, error) {
	if mock.GetPatientInsuranceBenefitDetailsHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetPatientInsuranceBenefitDetails not defined")
	}
	return mock.GetPatientInsuranceBenefitDetailsHandler(ctx, in, opts...)
}

func (mock *AthenaServiceClientMock) TriggerPatientInsuranceEligibilityCheck(ctx context.Context, in *athena.TriggerPatientInsuranceEligibilityCheckRequest, opts ...grpc.CallOption) (*athena.TriggerPatientInsuranceEligibilityCheckResponse, error) {
	if mock.TriggerPatientInsuranceEligibilityCheckHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock TriggerPatientInsuranceEligibilityCheck not defined")
	}
	return mock.TriggerPatientInsuranceEligibilityCheckHandler(ctx, in, opts...)
}

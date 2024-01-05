package main

import (
	"context"

	stationpatientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/station_patients"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type StationPatientsClientMock struct {
	ListPatientsHandler                   func(ctx context.Context, in *stationpatientspb.ListPatientsRequest, opts ...grpc.CallOption) (*stationpatientspb.ListPatientsResponse, error)
	GetPatientHandler                     func(ctx context.Context, in *stationpatientspb.GetPatientRequest, opts ...grpc.CallOption) (*stationpatientspb.GetPatientResponse, error)
	FindOrCreatePatientsHandler           func(ctx context.Context, in *stationpatientspb.FindOrCreatePatientRequest, opts ...grpc.CallOption) (*stationpatientspb.FindOrCreatePatientResponse, error)
	UpdatePatientsHandler                 func(ctx context.Context, in *stationpatientspb.UpdatePatientRequest, opts ...grpc.CallOption) (*stationpatientspb.UpdatePatientResponse, error)
	GetDepartmentIDByBillingCityIDHandler func(ctx context.Context, in *stationpatientspb.GetDepartmentIDByBillingCityIDRequest, opts ...grpc.CallOption) (*stationpatientspb.GetDepartmentIDByBillingCityIDResponse, error)
	ListPatientsByIDHandler               func(ctx context.Context, in *stationpatientspb.ListPatientsByIDRequest, opts ...grpc.CallOption) (*stationpatientspb.ListPatientsByIDResponse, error)
	SearchPatientsByNameHandler           func(ctx context.Context, in *stationpatientspb.SearchPatientsByNameRequest, opts ...grpc.CallOption) (*stationpatientspb.SearchPatientsByNameResponse, error)
	ListCareRequestIdsHandler             func(ctx context.Context, in *stationpatientspb.ListCareRequestIdsRequest, opts ...grpc.CallOption) (*stationpatientspb.ListCareRequestIdsResponse, error)
}

func (mock *StationPatientsClientMock) ListPatients(ctx context.Context, in *stationpatientspb.ListPatientsRequest, opts ...grpc.CallOption) (*stationpatientspb.ListPatientsResponse, error) {
	if mock.ListPatientsHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock ListPatients not defined")
	}
	return mock.ListPatientsHandler(ctx, in, opts...)
}

func (mock *StationPatientsClientMock) GetPatient(ctx context.Context, in *stationpatientspb.GetPatientRequest, opts ...grpc.CallOption) (*stationpatientspb.GetPatientResponse, error) {
	if mock.GetPatientHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetPatient not defined")
	}
	return mock.GetPatientHandler(ctx, in, opts...)
}

func (mock *StationPatientsClientMock) FindOrCreatePatient(ctx context.Context, in *stationpatientspb.FindOrCreatePatientRequest, opts ...grpc.CallOption) (*stationpatientspb.FindOrCreatePatientResponse, error) {
	if mock.FindOrCreatePatientsHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock FindOrCreatePatient not defined")
	}
	return mock.FindOrCreatePatientsHandler(ctx, in, opts...)
}

func (mock *StationPatientsClientMock) UpdatePatient(ctx context.Context, in *stationpatientspb.UpdatePatientRequest, opts ...grpc.CallOption) (*stationpatientspb.UpdatePatientResponse, error) {
	if mock.UpdatePatientsHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock UpdatePatient not defined")
	}
	return mock.UpdatePatientsHandler(ctx, in, opts...)
}

func (mock *StationPatientsClientMock) GetDepartmentIDByBillingCityID(ctx context.Context, in *stationpatientspb.GetDepartmentIDByBillingCityIDRequest, opts ...grpc.CallOption) (*stationpatientspb.GetDepartmentIDByBillingCityIDResponse, error) {
	if mock.GetDepartmentIDByBillingCityIDHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetDepartmentIDByBillingCityIDHandler not defined")
	}
	return mock.GetDepartmentIDByBillingCityIDHandler(ctx, in, opts...)
}

func (mock *StationPatientsClientMock) ListPatientsByID(ctx context.Context, in *stationpatientspb.ListPatientsByIDRequest, opts ...grpc.CallOption) (*stationpatientspb.ListPatientsByIDResponse, error) {
	if mock.ListPatientsByIDHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock ListPatientsByIDHandler not defined")
	}
	return mock.ListPatientsByIDHandler(ctx, in, opts...)
}

func (mock *StationPatientsClientMock) SearchPatientsByName(ctx context.Context, in *stationpatientspb.SearchPatientsByNameRequest, opts ...grpc.CallOption) (*stationpatientspb.SearchPatientsByNameResponse, error) {
	if mock.SearchPatientsByNameHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock SearchPatientsByNameHandler not defined")
	}
	return mock.SearchPatientsByNameHandler(ctx, in, opts...)
}

func (mock *StationPatientsClientMock) ListCareRequestIds(ctx context.Context, in *stationpatientspb.ListCareRequestIdsRequest, opts ...grpc.CallOption) (*stationpatientspb.ListCareRequestIdsResponse, error) {
	if mock.ListCareRequestIdsHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock ListCareRequestIdsHandler not defined")
	}
	return mock.ListCareRequestIdsHandler(ctx, in, opts...)
}

package main

import (
	"context"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"google.golang.org/grpc"
)

type PatientServiceClientMock struct {
	patients.PatientsServiceClient
	GetPatientHandler              func(ctx context.Context, in *patients.GetPatientRequest, opts ...grpc.CallOption) (*patients.GetPatientResponse, error)
	ListUnverifiedPatientsHandler  func(ctx context.Context, in *patients.ListUnverifiedPatientsRequest, opts ...grpc.CallOption) (*patients.ListUnverifiedPatientsResponse, error)
	ListPatientsByIDHandler        func(ctx context.Context, in *patients.ListPatientsByIDRequest, opts ...grpc.CallOption) (*patients.ListPatientsByIDResponse, error)
	GetUnverifiedPatientHandler    func(ctx context.Context, in *patients.GetUnverifiedPatientRequest, opts ...grpc.CallOption) (*patients.GetUnverifiedPatientResponse, error)
	CreateUnverifiedPatientHandler func(ctx context.Context, r *patients.CreateUnverifiedPatientRequest, opts ...grpc.CallOption) (*patients.CreateUnverifiedPatientResponse, error)
}

func (mock *PatientServiceClientMock) GetPatient(ctx context.Context, in *patients.GetPatientRequest, opts ...grpc.CallOption) (*patients.GetPatientResponse, error) {
	if mock.GetPatientHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetPatient not defined")
	}
	return mock.GetPatientHandler(ctx, in, opts...)
}

func (mock *PatientServiceClientMock) ListUnverifiedPatients(ctx context.Context, in *patients.ListUnverifiedPatientsRequest, opts ...grpc.CallOption) (*patients.ListUnverifiedPatientsResponse, error) {
	if mock.ListUnverifiedPatientsHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock ListUnverifiedPatients not defined")
	}
	return mock.ListUnverifiedPatientsHandler(ctx, in, opts...)
}

func (mock *PatientServiceClientMock) ListPatientsByID(ctx context.Context, in *patients.ListPatientsByIDRequest, opts ...grpc.CallOption) (*patients.ListPatientsByIDResponse, error) {
	if mock.ListPatientsByIDHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock ListPatientsByID not defined")
	}
	return mock.ListPatientsByIDHandler(ctx, in, opts...)
}

func (mock *PatientServiceClientMock) GetUnverifiedPatient(ctx context.Context, in *patients.GetUnverifiedPatientRequest, opts ...grpc.CallOption) (*patients.GetUnverifiedPatientResponse, error) {
	if mock.GetUnverifiedPatientHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetUnverifiedPatient not defined")
	}
	return mock.GetUnverifiedPatientHandler(ctx, in, opts...)
}

func (mock *PatientServiceClientMock) CreateUnverifiedPatient(ctx context.Context, in *patients.CreateUnverifiedPatientRequest, opts ...grpc.CallOption) (*patients.CreateUnverifiedPatientResponse, error) {
	if mock.CreateUnverifiedPatientHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock CreateUnverifiedPatient not defined")
	}
	return mock.CreateUnverifiedPatientHandler(ctx, in, opts...)
}

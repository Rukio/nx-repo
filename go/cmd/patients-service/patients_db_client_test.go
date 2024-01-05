package main

import (
	"context"

	patientssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patients"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type DBServiceMock struct {
	AddUnverifiedPatientHandler        func(ctx context.Context, params patientssql.AddUnverifiedPatientParams) (*patientssql.UnverifiedPatient, error)
	ListUnverifiedPatientsByIdsHandler func(ctx context.Context, ids []int64) ([]*patientssql.UnverifiedPatient, error)
	GetUnverifiedPatientByIDHandler    func(ctx context.Context, id int64) (*patientssql.UnverifiedPatient, error)
	UpdateUnverifiedPatientByIDHandler func(ctx context.Context, params patientssql.UpdateUnverifiedPatientParams) (*patientssql.UnverifiedPatient, error)
}

func (mock *DBServiceMock) ListUnverifiedPatientsByIds(ctx context.Context, ids []int64) ([]*patientssql.UnverifiedPatient, error) {
	if mock.ListUnverifiedPatientsByIdsHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock ListUnverifiedPatientsByIds not defined")
	}
	return mock.ListUnverifiedPatientsByIdsHandler(ctx, ids)
}

func (mock *DBServiceMock) AddUnverifiedPatient(ctx context.Context, params patientssql.AddUnverifiedPatientParams) (*patientssql.UnverifiedPatient, error) {
	if mock.AddUnverifiedPatientHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock AddUnverifiedPatient not defined")
	}
	return mock.AddUnverifiedPatientHandler(ctx, params)
}

func (mock *DBServiceMock) GetUnverifiedPatientByID(ctx context.Context, id int64) (*patientssql.UnverifiedPatient, error) {
	if mock.GetUnverifiedPatientByIDHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetUnverifiedPatientByID not defined")
	}
	return mock.GetUnverifiedPatientByIDHandler(ctx, id)
}

func (mock *DBServiceMock) UpdateUnverifiedPatientByID(ctx context.Context, params patientssql.UpdateUnverifiedPatientParams) (*patientssql.UnverifiedPatient, error) {
	if mock.UpdateUnverifiedPatientByIDHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock UpdateUnverifiedPatientByID not defined")
	}
	return mock.UpdateUnverifiedPatientByIDHandler(ctx, params)
}

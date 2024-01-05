package main

import (
	"context"
	"errors"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	patientssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patients"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/jackc/pgx/v4"
)

var (
	errBlankGivenName  = errors.New("given name cannot be blank")
	errBlankFamilyName = errors.New("family name cannot be blank")
	errInvalidID       = errors.New("invalid ID")
	errPatientNotFound = errors.New("patient not found")
)

type PatientsDB struct {
	db      basedb.DBTX
	queries *patientssql.Queries
}

func NewPatientsDB(db basedb.DBTX) *PatientsDB {
	ddTraceDB := monitoring.NewDDTraceDB(db, monitoring.DataDogPatientsServiceName)
	return &PatientsDB{
		db:      db,
		queries: patientssql.New(ddTraceDB),
	}
}

func (pdb *PatientsDB) IsHealthy(ctx context.Context) bool {
	return pdb.db.Ping(ctx) == nil
}

func (pdb *PatientsDB) AddUnverifiedPatient(ctx context.Context, params patientssql.AddUnverifiedPatientParams) (*patientssql.UnverifiedPatient, error) {
	if params.GivenName == "" {
		return nil, errBlankGivenName
	}
	if params.FamilyName == "" {
		return nil, errBlankFamilyName
	}
	return pdb.queries.AddUnverifiedPatient(ctx, params)
}

func (pdb *PatientsDB) ListUnverifiedPatientsByIds(ctx context.Context, ids []int64) ([]*patientssql.UnverifiedPatient, error) {
	if len(ids) == 0 {
		return []*patientssql.UnverifiedPatient{}, nil
	}

	return pdb.queries.ListUnverifiedPatientsByIds(ctx, ids)
}

func (pdb *PatientsDB) GetUnverifiedPatientByID(ctx context.Context, id int64) (*patientssql.UnverifiedPatient, error) {
	if id <= 0 {
		return nil, errInvalidID
	}

	patients, err := pdb.queries.GetUnverifiedPatient(ctx, id)
	if errors.Is(err, pgx.ErrNoRows) {
		return nil, errPatientNotFound
	}

	return patients, nil
}

func (pdb *PatientsDB) UpdateUnverifiedPatientByID(ctx context.Context, params patientssql.UpdateUnverifiedPatientParams) (*patientssql.UnverifiedPatient, error) {
	if params.ID <= 0 {
		return nil, errInvalidID
	}

	patient, err := pdb.queries.UpdateUnverifiedPatient(ctx, params)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, errPatientNotFound
		}
		return nil, err
	}

	return patient, nil
}

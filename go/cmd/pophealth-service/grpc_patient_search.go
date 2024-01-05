package main

import (
	"context"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
)

const defaultLimitResultsTo = 20

type patientSearchService interface {
	SearchPatients(context.Context, PopHealthIndexKey, PatientSearchParams, int) ([]Patient, error)
}

type PatientSearchServer struct {
	pophealthpb.UnimplementedSearchPatientServiceServer

	PatientSearchService patientSearchService
	logger               *zap.SugaredLogger
}

func (s *PatientSearchServer) SearchPatient(ctx context.Context, req *pophealthpb.SearchPatientRequest) (*pophealthpb.SearchPatientResponse, error) {
	limitResultsTo := defaultLimitResultsTo
	if req.GetMaxNumResults() > 0 {
		limitResultsTo = int(req.GetMaxNumResults())
	}
	var dob string
	if req.GetDateOfBirth() != nil {
		dob = *protoconv.ProtoDateToString(req.GetDateOfBirth(), ElasticSearchDateLayout)
	}
	searchParams := PatientSearchParams{
		PatientName:      req.Name,
		PatientFirstName: req.FirstName,
		PatientLastName:  req.LastName,
		DOB:              dob,
		SSN:              req.GetSsn(),
		ChannelItemIDs:   req.ChannelItemIds,
		MarketIDs:        req.MarketIds,
	}
	log := s.logger.With("searchParams", searchParams,
		"source", "grpc_patient_search",
		"backfill", req.IsBackfill,
	)

	indexKey := PatientIndexKey
	if req.IsBackfill {
		indexKey = BackfillPatientIndexKey
	}
	patients, err := s.PatientSearchService.SearchPatients(ctx, indexKey, searchParams, limitResultsTo)
	if err != nil {
		return nil, LogAndReturnErr(log, codes.Internal, "error searching patient", err)
	}

	protoPatients := make([]*pophealthpb.Patient, len(patients))
	for i, patient := range patients {
		var patientDob *common.Date
		patientDobTime, err := time.Parse(ElasticSearchDateLayout, patient.DOB)
		if err != nil {
			log.Errorw("error parsing patient dob as time",
				"patientDob", patient.DOB,
				zap.Error(err),
			)
		} else {
			patientDob = &common.Date{
				Year:  int32(patientDobTime.Year()),
				Month: int32(patientDobTime.Month()),
				Day:   int32(patientDobTime.Day()),
			}
		}
		protoPatients[i] = &pophealthpb.Patient{
			Id:              patient.PatientHash,
			FirstName:       patient.FirstName,
			LastName:        patient.LastName,
			Dob:             patientDob,
			ChannelItemId:   int64(patient.ChannelItemID),
			MarketId:        int64(patient.MarketID),
			Gender:          patient.Gender,
			Ssn:             patient.SSN,
			StreetAddress_1: patient.StreetAddress1,
			StreetAddress_2: patient.StreetAddress2,
			City:            patient.City,
			State:           patient.State,
			Zipcode:         patient.Zipcode,
			MemberId:        patient.MemberID,
			Email:           patient.Email,
		}
	}
	return &pophealthpb.SearchPatientResponse{
		Patient: protoPatients,
	}, nil
}

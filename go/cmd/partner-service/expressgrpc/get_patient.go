package expressgrpc

import (
	"context"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func (s *Server) GetPatient(ctx context.Context, req *partnerpb.GetPatientRequest) (*partnerpb.GetPatientResponse, error) {
	defer s.PatientMap.Delete(req.PatientId)

	if patient, exists := s.PatientMap.Load(req.PatientId); exists {
		patient, ok := patient.(*common.Patient)
		if ok {
			return &partnerpb.GetPatientResponse{
				Patient: patient,
			}, nil
		}
	}

	res, err := s.PatientsClient.GetPatient(ctx, &patientspb.GetPatientRequest{
		PatientId: &req.PatientId,
	})
	if err != nil {
		s.Logger.Errorw("GetPatient error", zap.Error(err))
		return nil, status.Errorf(codes.NotFound, "Patient with ID %v was not found", req.PatientId)
	}

	return &partnerpb.GetPatientResponse{
		Patient: res.Patient,
	}, nil
}

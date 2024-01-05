package expressgrpc

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

func TestGetPatient(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	foundPatient := &common.Patient{
		Id: proto.String("10"),
	}

	tests := []struct {
		name            string
		patientsService mockPatientsService
		req             *partnerpb.GetPatientRequest
		mapPatient      any

		want    *partnerpb.GetPatientResponse
		wantErr bool
	}{
		{
			name:       "success, patient in map",
			mapPatient: foundPatient,
			req: &partnerpb.GetPatientRequest{
				PatientId: "10",
			},

			want: &partnerpb.GetPatientResponse{
				Patient: foundPatient,
			},
			wantErr: false,
		},
		{
			name:       "success, patient in map is incorrect type",
			mapPatient: "error",
			patientsService: mockPatientsService{
				getPatientResp: &patientspb.GetPatientResponse{
					Patient: foundPatient,
				},
			},
			req: &partnerpb.GetPatientRequest{
				PatientId: "10",
			},

			want: &partnerpb.GetPatientResponse{
				Patient: foundPatient,
			},
			wantErr: false,
		},
		{
			name: "get patient error",
			patientsService: mockPatientsService{
				getPatientRespErr: errors.New("service error"),
			},
			req: &partnerpb.GetPatientRequest{},

			wantErr: true,
		},
		{
			name: "success",
			patientsService: mockPatientsService{
				getPatientResp: &patientspb.GetPatientResponse{
					Patient: foundPatient,
				},
			},
			req: &partnerpb.GetPatientRequest{
				PatientId: "10",
			},

			want: &partnerpb.GetPatientResponse{
				Patient: foundPatient,
			},
			wantErr: false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server, _ := NewServer(&ServerParams{
				PatientsClient: &test.patientsService,
				Logger:         logger,
			})

			if test.mapPatient != nil {
				server.PatientMap.Store(test.req.PatientId, test.mapPatient)
			}

			res, err := server.GetPatient(ctx, test.req)

			testutils.MustMatch(t, res, test.want)
			testutils.MustMatch(t, err != nil, test.wantErr)

			_, mapValueExists := server.PatientMap.Load(test.req.PatientId)
			testutils.MustMatch(t, mapValueExists, false)
		})
	}
}

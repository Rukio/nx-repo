package main

import (
	"context"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
)

type mockPatientSearchService struct {
	searchPatientsResp []Patient
	searchPatientsErr  error
}

func (s *mockPatientSearchService) SearchPatients(context.Context, PopHealthIndexKey, PatientSearchParams, int) ([]Patient, error) {
	return s.searchPatientsResp, s.searchPatientsErr
}

func TestPatientSearchServerSearchPatient(t *testing.T) {
	ctx := context.Background()
	numResults := int32(10)
	patients := []Patient{
		{
			PatientHash:   "abc123",
			FirstName:     "Diego",
			LastName:      "Lopez",
			DOB:           "1978-10-11",
			ChannelItemID: 1,
			MarketID:      2,
		},
		{
			PatientHash:   "def123",
			FirstName:     "Luis",
			LastName:      "Lopez",
			DOB:           "1981-08-21",
			ChannelItemID: 2,
			MarketID:      3,
		},
	}
	patientWrongDateFormat := []Patient{
		{
			PatientHash:   "abc123",
			FirstName:     "Diego",
			LastName:      "Lopez",
			DOB:           "11-10-1989",
			ChannelItemID: 1,
			MarketID:      2,
		},
	}
	ssn := "999999999"
	tests := []struct {
		name                 string
		patientSearchService *mockPatientSearchService
		req                  *pophealthpb.SearchPatientRequest

		expectedResp *pophealthpb.SearchPatientResponse
		hasError     bool
	}{
		{
			name: "happy path searching patients with num results",
			patientSearchService: &mockPatientSearchService{
				searchPatientsResp: patients,
			},
			req: &pophealthpb.SearchPatientRequest{
				Name:          "Lopez",
				MaxNumResults: &numResults,
			},
			expectedResp: &pophealthpb.SearchPatientResponse{
				Patient: []*pophealthpb.Patient{
					{
						Id:        patients[0].PatientHash,
						FirstName: patients[0].FirstName,
						LastName:  patients[0].LastName,
						Dob: &common.Date{
							Year:  1978,
							Month: 10,
							Day:   11,
						},
						ChannelItemId: int64(patients[0].ChannelItemID),
						MarketId:      int64(patients[0].MarketID),
					},
					{
						Id:        patients[1].PatientHash,
						FirstName: patients[1].FirstName,
						LastName:  patients[1].LastName,
						Dob: &common.Date{
							Year:  1981,
							Month: 8,
							Day:   21,
						},
						ChannelItemId: int64(patients[1].ChannelItemID),
						MarketId:      int64(patients[1].MarketID),
					},
				},
			},
		},
		{
			name: "happy path searching patients without num results",
			patientSearchService: &mockPatientSearchService{
				searchPatientsResp: patients,
			},
			req: &pophealthpb.SearchPatientRequest{
				Name: "Lopez",
			},
			expectedResp: &pophealthpb.SearchPatientResponse{
				Patient: []*pophealthpb.Patient{
					{
						Id:        patients[0].PatientHash,
						FirstName: patients[0].FirstName,
						LastName:  patients[0].LastName,
						Dob: &common.Date{
							Year:  1978,
							Month: 10,
							Day:   11,
						},
						ChannelItemId: int64(patients[0].ChannelItemID),
						MarketId:      int64(patients[0].MarketID),
					},
					{
						Id:        patients[1].PatientHash,
						FirstName: patients[1].FirstName,
						LastName:  patients[1].LastName,
						Dob: &common.Date{
							Year:  1981,
							Month: 8,
							Day:   21,
						},
						ChannelItemId: int64(patients[1].ChannelItemID),
						MarketId:      int64(patients[1].MarketID),
					},
				},
			},
		},
		{
			name: "happy path searching patients with dob",
			patientSearchService: &mockPatientSearchService{
				searchPatientsResp: []Patient{patients[1]},
			},
			req: &pophealthpb.SearchPatientRequest{
				FirstName: "Luis",
				LastName:  "Lopez",
				DateOfBirth: &common.Date{
					Year:  1981,
					Month: 8,
					Day:   21,
				},
			},
			expectedResp: &pophealthpb.SearchPatientResponse{
				Patient: []*pophealthpb.Patient{
					{
						Id:        patients[1].PatientHash,
						FirstName: patients[1].FirstName,
						LastName:  patients[1].LastName,
						Dob: &common.Date{
							Year:  1981,
							Month: 8,
							Day:   21,
						},
						ChannelItemId: int64(patients[1].ChannelItemID),
						MarketId:      int64(patients[1].MarketID),
					},
				},
			},
		},
		{
			name: "happy path searching patients with dob and ssn",
			patientSearchService: &mockPatientSearchService{
				searchPatientsResp: []Patient{patients[1]},
			},
			req: &pophealthpb.SearchPatientRequest{
				FirstName: "Luis",
				LastName:  "Lopez",
				DateOfBirth: &common.Date{
					Year:  1981,
					Month: 8,
					Day:   21,
				},
				Ssn:           &ssn,
				MaxNumResults: &numResults,
			},
			expectedResp: &pophealthpb.SearchPatientResponse{
				Patient: []*pophealthpb.Patient{
					{
						Id:        patients[1].PatientHash,
						FirstName: patients[1].FirstName,
						LastName:  patients[1].LastName,
						Dob: &common.Date{
							Year:  1981,
							Month: 8,
							Day:   21,
						},
						ChannelItemId: int64(patients[1].ChannelItemID),
						MarketId:      int64(patients[1].MarketID),
					},
				},
			},
		},
		{
			name: "happy path searching patients using name and backfill index",
			patientSearchService: &mockPatientSearchService{
				searchPatientsResp: patients,
			},
			req: &pophealthpb.SearchPatientRequest{
				Name:       "Lopez",
				IsBackfill: true,
			},
			expectedResp: &pophealthpb.SearchPatientResponse{
				Patient: []*pophealthpb.Patient{
					{
						Id:        patients[0].PatientHash,
						FirstName: patients[0].FirstName,
						LastName:  patients[0].LastName,
						Dob: &common.Date{
							Year:  1978,
							Month: 10,
							Day:   11,
						},
						ChannelItemId: int64(patients[0].ChannelItemID),
						MarketId:      int64(patients[0].MarketID),
					},
					{
						Id:        patients[1].PatientHash,
						FirstName: patients[1].FirstName,
						LastName:  patients[1].LastName,
						Dob: &common.Date{
							Year:  1981,
							Month: 8,
							Day:   21,
						},
						ChannelItemId: int64(patients[1].ChannelItemID),
						MarketId:      int64(patients[1].MarketID),
					},
				},
			},
		},
		{
			name: "error searching patients in elastic search",
			patientSearchService: &mockPatientSearchService{
				searchPatientsErr: errInternalTest,
			},
			req: &pophealthpb.SearchPatientRequest{
				Name: "Lopez",
			},
			hasError: true,
		},
		{
			name: "when patient have incorrect date format",
			patientSearchService: &mockPatientSearchService{
				searchPatientsResp: patientWrongDateFormat,
			},
			req: &pophealthpb.SearchPatientRequest{
				Name: "Lopez",
			},
			expectedResp: &pophealthpb.SearchPatientResponse{
				Patient: []*pophealthpb.Patient{
					{
						Id:            patientWrongDateFormat[0].PatientHash,
						FirstName:     patientWrongDateFormat[0].FirstName,
						LastName:      patientWrongDateFormat[0].LastName,
						Dob:           nil,
						ChannelItemId: int64(patientWrongDateFormat[0].ChannelItemID),
						MarketId:      int64(patientWrongDateFormat[0].MarketID),
					},
				},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server := &PatientSearchServer{
				PatientSearchService: test.patientSearchService,
				logger:               zap.NewNop().Sugar(),
			}
			resp, err := server.SearchPatient(ctx, test.req)
			if (err != nil) != test.hasError {
				t.Errorf("err is %t, but expected err to be %t", err != nil, test.hasError)
			}

			if !test.hasError {
				testutils.MustMatchProto(t, test.expectedResp, resp)
			}
		})
	}
}

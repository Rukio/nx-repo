package main

import (
	"context"
	"testing"

	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

func TestCopy(t *testing.T) {
	patientID := "1"
	tcs := []struct {
		Desc                         string
		LabResultDocument            *athenapb.LabResultDocument
		AthenaDiscussionNoteResponse *athenapb.UpdatePatientDiscussionNotesResponse
		AthenaPatientGoalsResponse   *athenapb.GetPatientGoalsResponse
		AthenaPatientOrderResponse   *athenapb.GetPatientOrderResponse
		AthenaDiscussionNoteError    error
		AthenaPatientGoalsError      error
		AthenaPatientOrderError      error
		WantError                    bool
	}{
		{
			Desc: "success - base case",
			LabResultDocument: &athenapb.LabResultDocument{
				DepartmentId:   proto.String("2"),
				DocumentRoute:  proto.String("Fax"),
				DocumentSource: proto.String("INTERFACE"),
				DocumentTypeId: proto.String("3"),
				EncounterDate: &commonpb.Date{
					Year:  2018,
					Month: 8,
					Day:   30,
				},
				EncounterId:    proto.String("4"),
				FacilityId:     proto.String("5"),
				IsConfidential: proto.Bool(false),
				Id:             proto.String("6"),
				Loinc:          proto.String("7"),
				ObservationDateTime: &commonpb.DateTime{
					Year:    2018,
					Month:   8,
					Day:     30,
					Hours:   11,
					Minutes: 33,
					Seconds: 55,
				},
				Observations: []*athenapb.Analyte{
					{
						ObservationIdentifier: proto.String("55080400"),
						ResultStatus:          proto.String("final"),
						Name:                  proto.String("TSH"),
						Value:                 proto.String("tnp"),
						Units:                 proto.String("%"),
						Description:           proto.String("Description"),
						Loinc:                 proto.String("31234"),
						Note:                  proto.String("note"),
						Id:                    proto.String("1234"),
					},
				},
				ProviderId: proto.String("8"),
				OrderId:    proto.String("9"),
			},
			AthenaDiscussionNoteResponse: &athenapb.UpdatePatientDiscussionNotesResponse{},
			AthenaPatientGoalsResponse:   &athenapb.GetPatientGoalsResponse{DiscussionNotes: ""},
		},
		{
			Desc: "failure - failed to append analytes to discussion notes",
			LabResultDocument: &athenapb.LabResultDocument{
				DepartmentId:   proto.String("2"),
				DocumentRoute:  proto.String("Fax"),
				DocumentSource: proto.String("INTERFACE"),
				DocumentTypeId: proto.String("3"),
				EncounterDate: &commonpb.Date{
					Year:  2018,
					Month: 8,
					Day:   30,
				},
				EncounterId:    proto.String("4"),
				FacilityId:     proto.String("5"),
				IsConfidential: proto.Bool(false),
				Id:             proto.String("6"),
				Loinc:          proto.String("7"),
				ObservationDateTime: &commonpb.DateTime{
					Year:    2018,
					Month:   8,
					Day:     30,
					Hours:   11,
					Minutes: 33,
					Seconds: 55,
				},
				Observations: []*athenapb.Analyte{
					{
						ObservationIdentifier: proto.String("55080400"),
						ResultStatus:          proto.String("final"),
						Name:                  proto.String("TSH"),
						Value:                 proto.String("tnp"),
						Units:                 proto.String("%"),
						Description:           proto.String("Description"),
						Loinc:                 proto.String("31234"),
						Note:                  proto.String("note"),
						Id:                    proto.String("1234"),
					},
				},
				ProviderId: proto.String("8"),
				OrderId:    proto.String("9"),
			},
			AthenaPatientGoalsResponse:   &athenapb.GetPatientGoalsResponse{DiscussionNotes: "id=lab-result-id-6"},
			AthenaDiscussionNoteResponse: nil,
			AthenaDiscussionNoteError:    status.Error(codes.NotFound, "Athena error appending analytes to discussion notes"),

			WantError: true,
		},
		{
			Desc:              "failure - empty analytes",
			LabResultDocument: &athenapb.LabResultDocument{},

			WantError: true,
		},
		{
			Desc: "success - update when lab results already copied",
			LabResultDocument: &athenapb.LabResultDocument{
				DepartmentId:   proto.String("2"),
				DocumentRoute:  proto.String("Fax"),
				DocumentSource: proto.String("INTERFACE"),
				DocumentTypeId: proto.String("3"),
				EncounterDate: &commonpb.Date{
					Year:  2018,
					Month: 8,
					Day:   30,
				},
				EncounterId:    proto.String("4"),
				FacilityId:     proto.String("5"),
				IsConfidential: proto.Bool(false),
				Id:             proto.String("6"),
				Loinc:          proto.String("7"),
				ObservationDateTime: &commonpb.DateTime{
					Year:    2018,
					Month:   8,
					Day:     30,
					Hours:   11,
					Minutes: 33,
					Seconds: 55,
				},
				Observations: []*athenapb.Analyte{
					{
						ObservationIdentifier: proto.String("55080400"),
						ResultStatus:          proto.String("final"),
						Name:                  proto.String("TEST"),
						Value:                 proto.String("tnp"),
						Units:                 proto.String("%"),
						Description:           proto.String("Description"),
						Loinc:                 proto.String("31234"),
						Note:                  proto.String("note"),
						Id:                    proto.String("1234"),
					},
				},
				ProviderId: proto.String("8"),
				OrderId:    proto.String("9"),
			},
			AthenaPatientGoalsResponse: &athenapb.GetPatientGoalsResponse{DiscussionNotes: `<h3 id="lab-result-id-6">Lab Results<ul></ul>`},

			WantError: false,
		},
		{
			Desc: "failure - couldn't get patient goals",
			LabResultDocument: &athenapb.LabResultDocument{
				DepartmentId:   proto.String("2"),
				DocumentRoute:  proto.String("Fax"),
				DocumentSource: proto.String("INTERFACE"),
				DocumentTypeId: proto.String("3"),
				EncounterDate: &commonpb.Date{
					Year:  2018,
					Month: 8,
					Day:   30,
				},
				EncounterId:    proto.String("4"),
				FacilityId:     proto.String("5"),
				IsConfidential: proto.Bool(false),
				Id:             proto.String("6"),
				Loinc:          proto.String("7"),
				ObservationDateTime: &commonpb.DateTime{
					Year:    2018,
					Month:   8,
					Day:     30,
					Hours:   11,
					Minutes: 33,
					Seconds: 55,
				},
				Observations: []*athenapb.Analyte{
					{
						ObservationIdentifier: proto.String("55080400"),
						ResultStatus:          proto.String("final"),
						Name:                  proto.String("TSH"),
						Value:                 proto.String("tnp"),
						Units:                 proto.String("%"),
						Description:           proto.String("Description"),
						Loinc:                 proto.String("31234"),
						Note:                  proto.String("note"),
						Id:                    proto.String("1234"),
					},
				},
				ProviderId: proto.String("8"),
				OrderId:    proto.String("9"),
			},
			AthenaPatientGoalsResponse: nil,
			AthenaPatientGoalsError:    status.Error(codes.NotFound, "Athena error getting to patient goals"),
			WantError:                  true,
		},
		{
			Desc: "success - nil encounter ID on doc fetches encounter ID from order",
			LabResultDocument: &athenapb.LabResultDocument{
				DepartmentId:   proto.String("2"),
				DocumentRoute:  proto.String("Fax"),
				DocumentSource: proto.String("INTERFACE"),
				DocumentTypeId: proto.String("3"),
				EncounterDate: &commonpb.Date{
					Year:  2018,
					Month: 8,
					Day:   30,
				},
				EncounterId:    nil,
				FacilityId:     proto.String("5"),
				IsConfidential: proto.Bool(false),
				Id:             proto.String("6"),
				Loinc:          proto.String("7"),
				ObservationDateTime: &commonpb.DateTime{
					Year:    2018,
					Month:   8,
					Day:     30,
					Hours:   11,
					Minutes: 33,
					Seconds: 55,
				},
				Observations: []*athenapb.Analyte{
					{
						ObservationIdentifier: proto.String("55080400"),
						ResultStatus:          proto.String("final"),
						Name:                  proto.String("TSH"),
						Value:                 proto.String("tnp"),
						Units:                 proto.String("%"),
						Description:           proto.String("Description"),
						Loinc:                 proto.String("31234"),
						Note:                  proto.String("note"),
						Id:                    proto.String("1234"),
					},
				},
				ProviderId: proto.String("8"),
				OrderId:    proto.String("9"),
			},
			AthenaPatientOrderResponse:   &athenapb.GetPatientOrderResponse{Order: &athenapb.PatientOrder{OrderId: proto.String("9"), EncounterId: proto.String("4")}},
			AthenaDiscussionNoteResponse: &athenapb.UpdatePatientDiscussionNotesResponse{},
			AthenaPatientGoalsResponse:   &athenapb.GetPatientGoalsResponse{DiscussionNotes: ""},
		},
		{
			Desc: "failure - couldn't get patient order",
			LabResultDocument: &athenapb.LabResultDocument{
				DepartmentId:   proto.String("2"),
				DocumentRoute:  proto.String("Fax"),
				DocumentSource: proto.String("INTERFACE"),
				DocumentTypeId: proto.String("3"),
				EncounterDate: &commonpb.Date{
					Year:  2018,
					Month: 8,
					Day:   30,
				},
				EncounterId:    nil,
				FacilityId:     proto.String("5"),
				IsConfidential: proto.Bool(false),
				Id:             proto.String("6"),
				Loinc:          proto.String("7"),
				ObservationDateTime: &commonpb.DateTime{
					Year:    2018,
					Month:   8,
					Day:     30,
					Hours:   11,
					Minutes: 33,
					Seconds: 55,
				},
				Observations: []*athenapb.Analyte{
					{
						ObservationIdentifier: proto.String("55080400"),
						ResultStatus:          proto.String("final"),
						Name:                  proto.String("TSH"),
						Value:                 proto.String("tnp"),
						Units:                 proto.String("%"),
						Description:           proto.String("Description"),
						Loinc:                 proto.String("31234"),
						Note:                  proto.String("note"),
						Id:                    proto.String("1234"),
					},
				},
				ProviderId: proto.String("8"),
				OrderId:    proto.String("9"),
			},
			AthenaPatientOrderResponse: nil,
			AthenaPatientOrderError:    status.Error(codes.NotFound, "Athena error getting to patient order"),
			WantError:                  true,
		},
		{
			Desc: "success - nil encounter ID on doc fetches encounter ID from order",
			LabResultDocument: &athenapb.LabResultDocument{
				DepartmentId:   proto.String("2"),
				DocumentRoute:  proto.String("Fax"),
				DocumentSource: proto.String("INTERFACE"),
				DocumentTypeId: proto.String("3"),
				EncounterDate: &commonpb.Date{
					Year:  2018,
					Month: 8,
					Day:   30,
				},
				EncounterId:    nil,
				FacilityId:     proto.String("5"),
				IsConfidential: proto.Bool(false),
				Id:             proto.String("6"),
				Loinc:          proto.String("7"),
				ObservationDateTime: &commonpb.DateTime{
					Year:    2018,
					Month:   8,
					Day:     30,
					Hours:   11,
					Minutes: 33,
					Seconds: 55,
				},
				Observations: []*athenapb.Analyte{
					{
						ObservationIdentifier: proto.String("55080400"),
						ResultStatus:          proto.String("final"),
						Name:                  proto.String("TSH"),
						Value:                 proto.String("tnp"),
						Units:                 proto.String("%"),
						Description:           proto.String("Description"),
						Loinc:                 proto.String("31234"),
						Note:                  proto.String("note"),
						Id:                    proto.String("1234"),
					},
				},
				ProviderId: proto.String("8"),
				OrderId:    proto.String("9"),
			},
			AthenaPatientOrderResponse:   &athenapb.GetPatientOrderResponse{Order: &athenapb.PatientOrder{OrderId: proto.String("9"), EncounterId: proto.String("4")}},
			AthenaDiscussionNoteResponse: &athenapb.UpdatePatientDiscussionNotesResponse{},
			AthenaPatientGoalsResponse:   &athenapb.GetPatientGoalsResponse{DiscussionNotes: ""},
		},
		{
			Desc: "failure - couldn't get patient order",
			LabResultDocument: &athenapb.LabResultDocument{
				DepartmentId:   proto.String("2"),
				DocumentRoute:  proto.String("Fax"),
				DocumentSource: proto.String("INTERFACE"),
				DocumentTypeId: proto.String("3"),
				EncounterDate: &commonpb.Date{
					Year:  2018,
					Month: 8,
					Day:   30,
				},
				EncounterId:    nil,
				FacilityId:     proto.String("5"),
				IsConfidential: proto.Bool(false),
				Id:             proto.String("6"),
				Loinc:          proto.String("7"),
				ObservationDateTime: &commonpb.DateTime{
					Year:    2018,
					Month:   8,
					Day:     30,
					Hours:   11,
					Minutes: 33,
					Seconds: 55,
				},
				Observations: []*athenapb.Analyte{
					{
						ObservationIdentifier: proto.String("55080400"),
						ResultStatus:          proto.String("final"),
						Name:                  proto.String("TSH"),
						Value:                 proto.String("tnp"),
						Units:                 proto.String("%"),
						Description:           proto.String("Description"),
						Loinc:                 proto.String("31234"),
						Note:                  proto.String("note"),
						Id:                    proto.String("1234"),
					},
				},
				ProviderId: proto.String("8"),
				OrderId:    proto.String("9"),
			},
			AthenaPatientOrderResponse: nil,
			AthenaPatientOrderError:    status.Error(codes.NotFound, "Athena error getting to patient order"),
			WantError:                  true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			c := &AnalyteCopier{
				AthenaClient: &AthenaClientMock{
					UpdatePatientDiscussionNotesHandler: func(ctx context.Context, in *athenapb.UpdatePatientDiscussionNotesRequest, opts ...grpc.CallOption) (*athenapb.UpdatePatientDiscussionNotesResponse, error) {
						return tc.AthenaDiscussionNoteResponse, tc.AthenaDiscussionNoteError
					},
					GetPatientGoalsHandler: func(ctx context.Context, in *athenapb.GetPatientGoalsRequest, opts ...grpc.CallOption) (*athenapb.GetPatientGoalsResponse, error) {
						return tc.AthenaPatientGoalsResponse, tc.AthenaPatientGoalsError
					},
					GetPatientOrderHandler: func(ctx context.Context, in *athenapb.GetPatientOrderRequest, opts ...grpc.CallOption) (*athenapb.GetPatientOrderResponse, error) {
						return tc.AthenaPatientOrderResponse, tc.AthenaPatientOrderError
					},
				},
			}
			ctx := context.Background()
			err := c.Copy(ctx, patientID, tc.LabResultDocument)
			testutils.MustMatch(t, tc.WantError, err != nil)
		})
	}
}

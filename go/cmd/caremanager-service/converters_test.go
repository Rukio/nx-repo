package main

import (
	"database/sql"
	"fmt"
	"strconv"
	"testing"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	caremanagerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/caremanager"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	insuranceplanpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance_plan"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	userpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/user"
	caremanagerdb "github.com/*company-data-covered*/services/go/pkg/generated/sql/caremanager"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/structpb"
)

func TestStructValueFromProtoOptionalString(t *testing.T) {
	testCases := []struct {
		name  string
		input *string

		want *structpb.Value
	}{
		{
			name:  "converts a non-nil proto string to a structpb string value",
			input: proto.String("test string"),

			want: structpb.NewStringValue("test string"),
		},
		{
			name:  "converts a nil proto string to a structpb null value",
			input: nil,

			want: structpb.NewNullValue(),
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := StructValueFromProtoOptionalString(testCase.input)

			testutils.MustMatch(t, testCase.want, output, "Structpb values don't match")
		})
	}
}

func TestCreateEpisodeSQLParamsFromEpisodeProtoRequest(t *testing.T) {
	testPatientID := time.Now().UnixNano()
	testCarePhaseID := time.Now().UnixNano()
	testServiceLineID := time.Now().UnixNano()
	testMarketID := time.Now().UnixNano()
	timestampString := time.Now().Format(timestampLayout)
	patientAdmittedAtTime, _ := time.Parse(timestampLayout, timestampString)

	testCases := []struct {
		name  string
		input *caremanagerpb.CreateEpisodeRequest

		want       *caremanagerdb.CreateEpisodeParams
		wantErrMsg string
	}{
		{
			name: "works",
			input: &caremanagerpb.CreateEpisodeRequest{
				PatientSummary: "Summary",
				PatientId:      testPatientID,
				CarePhaseId:    testCarePhaseID,
				ServiceLineId:  testServiceLineID,
				MarketId:       testMarketID,
			},

			want: &caremanagerdb.CreateEpisodeParams{
				PatientSummary: "Summary",
				PatientID:      testPatientID,
				AdmittedAt:     patientAdmittedAtTime,
				CarePhaseID:    testCarePhaseID,
				ServiceLineID:  testServiceLineID,
				MarketID:       testMarketID,
			},
		},
		{
			name: "works with all optional fields set",
			input: &caremanagerpb.CreateEpisodeRequest{
				PatientSummary:     "Summary",
				PatientId:          testPatientID,
				CareDay:            proto.Int64(0),
				Source:             proto.String("Source"),
				PrimaryDiagnosis:   proto.String("Primary Diagnosis"),
				Payer:              proto.String("Payer"),
				DoctorsPrimaryCare: proto.String("DoctorsPrimaryCare"),
				CarePhaseId:        testCarePhaseID,
				ServiceLineId:      testServiceLineID,
				MarketId:           testMarketID,
			},

			want: &caremanagerdb.CreateEpisodeParams{
				PatientSummary:     "Summary",
				PatientID:          testPatientID,
				AdmittedAt:         patientAdmittedAtTime,
				CareDay:            sql.NullInt64{Int64: 0, Valid: true},
				Source:             sql.NullString{String: "Source", Valid: true},
				PrimaryDiagnosis:   sql.NullString{String: "Primary Diagnosis", Valid: true},
				Payer:              sql.NullString{String: "Payer", Valid: true},
				DoctorsPrimaryCare: sql.NullString{String: "DoctorsPrimaryCare", Valid: true},
				CarePhaseID:        testCarePhaseID,
				ServiceLineID:      testServiceLineID,
				MarketID:           testMarketID,
			},
		},
		{
			name: "fails because request has missing Patient Summary",
			input: &caremanagerpb.CreateEpisodeRequest{
				PatientId:     testPatientID,
				CarePhaseId:   testCarePhaseID,
				ServiceLineId: testServiceLineID,
				MarketId:      testMarketID,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = episode.patient_summary cannot be empty",
		},
		{
			name: "fails because request has missing PatientID",
			input: &caremanagerpb.CreateEpisodeRequest{
				PatientSummary: "Summary",
				CarePhaseId:    testCarePhaseID,
				ServiceLineId:  testServiceLineID,
				MarketId:       testMarketID,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = episode.patient_id cannot be empty",
		},
		{
			name: "fails because request has missing CarePhaseID",
			input: &caremanagerpb.CreateEpisodeRequest{
				PatientSummary: "Summary",
				PatientId:      testPatientID,
				ServiceLineId:  testServiceLineID,
				MarketId:       testMarketID,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = episode.care_phase_id cannot be empty",
		},
		{
			name: "fails because request has missing ServiceLineID",
			input: &caremanagerpb.CreateEpisodeRequest{
				PatientSummary: "Summary",
				PatientId:      testPatientID,
				CarePhaseId:    testCarePhaseID,
				MarketId:       testMarketID,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = episode.service_line_id cannot be empty",
		},
		{
			name: "fails because request has missing MarketID",
			input: &caremanagerpb.CreateEpisodeRequest{
				PatientSummary: "Summary",
				PatientId:      testPatientID,
				CarePhaseId:    testCarePhaseID,
				ServiceLineId:  testServiceLineID,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = episode.market_id cannot be empty",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := CreateEpisodeSQLParamsFromCreateEpisodeProtoRequest(testCase.input)
			if err != nil {
				if testCase.wantErrMsg != "" {
					testutils.MustMatch(t, testCase.wantErrMsg, err.Error(), "CreateEpisodeSQLParamsFromEpisodeProtoRequest failed")
				} else {
					t.Fatal("CreateEpisodeSQLParamsFromEpisodeProtoRequest returned an unexpected error: ", err.Error())
				}
			} else {
				testutils.MustMatchFn(".AdmittedAt")(t, testCase.want, output, "CreateEpisodeSQLParamsFromEpisodeProtoRequest conversion failed")
			}
		})
	}
}

func TestCreateEpisodeSQLParamsFromCreateEpisodeProtoRequest(t *testing.T) {
	testPatientID := time.Now().UnixNano()
	testPayer := "payer"
	testSource := "source"
	originalCareRequestID := int64(1234)
	defaultCarePhaseID := int64(1)
	testServiceLineID := time.Now().UnixNano()
	testMarketID := time.Now().UnixNano()
	testProviderUserIds := []int64{1234, 12345}
	availabilityStart := time.Now().Format(timestampLayout)
	createdByUserID := time.Now().UnixNano()

	type input struct {
		Req       *caremanagerpb.CreateVisitFromStationCRRequest
		PatientID int64
	}

	testCases := []struct {
		name  string
		input input

		want    *caremanagerdb.CreateEpisodeParams
		wantErr error
	}{
		{
			name: "works",
			input: input{
				Req: &caremanagerpb.CreateVisitFromStationCRRequest{
					Patient: &caremanagerpb.CreatePatientFromStationCRRequest{
						FirstName:                 "first_name",
						LastName:                  "last_name",
						DateOfBirth:               "01/01/01",
						Sex:                       "Male",
						PhoneNumber:               "1231231231",
						AthenaMedicalRecordNumber: "1234123412",
					},
					CareRequestId:            time.Now().UnixNano(),
					ServiceLineId:            testServiceLineID,
					MarketId:                 testMarketID,
					Payer:                    proto.String(testPayer),
					Source:                   proto.String(testSource),
					OriginalCareRequestId:    originalCareRequestID,
					CreatedByUserId:          &createdByUserID,
					Status:                   "test status",
					StatusUpdatedAt:          availabilityStart,
					AddressId:                time.Now().UnixNano(),
					PatientAvailabilityStart: availabilityStart,
					PatientAvailabilityEnd:   availabilityStart,
					CarName:                  "LAS01",
					ProviderUserIds:          testProviderUserIds,
				},
				PatientID: testPatientID,
			},

			want: &caremanagerdb.CreateEpisodeParams{
				PatientID:             testPatientID,
				CarePhaseID:           defaultCarePhaseID,
				ServiceLineID:         testServiceLineID,
				MarketID:              testMarketID,
				Payer:                 sql.NullString{String: testPayer, Valid: true},
				Source:                sql.NullString{String: testSource, Valid: true},
				PatientSummary:        defaultSummary,
				OriginalCareRequestID: sqltypes.ToNullInt64(&originalCareRequestID),
			},
		},
		{
			name: "works with all optional fields set",
			input: input{
				Req: &caremanagerpb.CreateVisitFromStationCRRequest{
					CareRequestId:            time.Now().UnixNano(),
					ServiceLineId:            testServiceLineID,
					MarketId:                 testMarketID,
					Status:                   "",
					StatusUpdatedAt:          availabilityStart,
					AddressId:                0,
					PatientAvailabilityStart: availabilityStart,
					PatientAvailabilityEnd:   availabilityStart,
					CarName:                  "",
				},
				PatientID: testPatientID,
			},

			want: &caremanagerdb.CreateEpisodeParams{
				PatientID:             testPatientID,
				CarePhaseID:           defaultCarePhaseID,
				ServiceLineID:         testServiceLineID,
				MarketID:              testMarketID,
				PatientSummary:        defaultSummary,
				OriginalCareRequestID: sqltypes.ToNullInt64(nil),
			},
		},
		{
			name: "fails because request has missing Patient id",
			input: input{
				Req: &caremanagerpb.CreateVisitFromStationCRRequest{
					CareRequestId:            time.Now().UnixNano(),
					ServiceLineId:            testServiceLineID,
					MarketId:                 testMarketID,
					Status:                   "",
					StatusUpdatedAt:          "",
					AddressId:                0,
					PatientAvailabilityStart: "",
					PatientAvailabilityEnd:   "",
					CarName:                  "",
				},
				PatientID: 0,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "episode.patient_id cannot be empty"),
		},
		{
			name: "fails because request has missing ServiceLine",
			input: input{
				Req: &caremanagerpb.CreateVisitFromStationCRRequest{
					CareRequestId:            time.Now().UnixNano(),
					ServiceLineId:            0,
					MarketId:                 testMarketID,
					Status:                   "",
					StatusUpdatedAt:          "",
					AddressId:                0,
					PatientAvailabilityStart: "",
					PatientAvailabilityEnd:   "",
					CarName:                  "",
				},
				PatientID: testPatientID,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "episode.service_line_id cannot be empty"),
		},
		{
			name: "fails because request has missing MarketId",
			input: input{
				Req: &caremanagerpb.CreateVisitFromStationCRRequest{
					CareRequestId:            time.Now().UnixNano(),
					ServiceLineId:            testServiceLineID,
					MarketId:                 0,
					Status:                   "",
					StatusUpdatedAt:          "",
					AddressId:                0,
					PatientAvailabilityStart: "",
					PatientAvailabilityEnd:   "",
					CarName:                  "",
				},
				PatientID: testPatientID,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "episode.market_id cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := CreateEpisodeSQLParamsFromCreateVisitFromStationCRProtoRequest(testCase.input.Req, testCase.input.PatientID)
			testutils.MustMatch(t, testCase.wantErr, err, "unexpected problem, expected error and response error don't match")
			testutils.MustMatchFn(".AdmittedAt")(t, testCase.want, output, "CreateEpisodeSQLParamsFromCreateVisitFromStationCRProtoRequest conversion failed")
		})
	}
}

func TestCreateVisitSQLParamsFromCreateVisitFromStationCRProtoRequest(t *testing.T) {
	unixNano := time.Now().UnixNano()
	testEpisodeID := unixNano
	testCareRequestID := unixNano + 1
	testCreatedBy := unixNano + 2
	testServiceLineID := unixNano + 3
	testMarketID := unixNano + 4
	testAddressID := unixNano + 4
	testPayer := "payer"
	testStatus := "status"
	testSource := "source"
	testCar := "LAS03"
	testCarID := unixNano + 5
	sourceCareRequest := int64(1234)
	testProviderUserIDs := []int64{1234, 12345}
	now := time.Now()
	testAvailabilityStart := now.Add(10).Format(timestampLayout)
	testAvailabilityEnd := now.Add(20).Format(timestampLayout)
	parsedStart, _ := time.Parse(timestampLayout, testAvailabilityStart)
	parsedEnd, _ := time.Parse(timestampLayout, testAvailabilityEnd)

	type input struct {
		Req       *caremanagerpb.CreateVisitFromStationCRRequest
		EpisodeID int64
	}

	testCases := []struct {
		name  string
		input input

		want    *caremanagerdb.CreateVisitParams
		wantErr error
	}{
		{
			name: "works",
			input: input{
				Req: &caremanagerpb.CreateVisitFromStationCRRequest{
					Patient: &caremanagerpb.CreatePatientFromStationCRRequest{
						FirstName:                 "first_name",
						LastName:                  "last_name",
						DateOfBirth:               "01/01/01",
						Sex:                       "Male",
						PhoneNumber:               "1231231231",
						AthenaMedicalRecordNumber: "1234123412",
					},
					CareRequestId:            testCareRequestID,
					ServiceLineId:            testServiceLineID,
					MarketId:                 testMarketID,
					Payer:                    proto.String(testPayer),
					Source:                   proto.String(testSource),
					SourceCareRequestId:      &sourceCareRequest,
					CreatedByUserId:          &testCreatedBy,
					Status:                   testStatus,
					StatusUpdatedAt:          "01/01/01",
					AddressId:                testAddressID,
					PatientAvailabilityStart: testAvailabilityStart,
					PatientAvailabilityEnd:   testAvailabilityEnd,
					CarName:                  testCar,
					CarId:                    &testCarID,
					ProviderUserIds:          testProviderUserIDs,
				},
				EpisodeID: testEpisodeID,
			},

			want: &caremanagerdb.CreateVisitParams{
				CareRequestID: sql.NullInt64{
					Int64: testCareRequestID,
					Valid: true,
				},
				EpisodeID: testEpisodeID,
				VisitTypeID: sql.NullInt64{
					Int64: 0,
					Valid: false,
				},
				CreatedByUserID: sql.NullInt64{
					Int64: testCreatedBy,
					Valid: true,
				},
				Status: sql.NullString{
					String: testStatus,
					Valid:  true,
				},
				StatusUpdatedAt: sql.NullTime{
					Time:  time.Time{},
					Valid: false,
				},
				AddressID: sql.NullInt64{
					Int64: testAddressID,
					Valid: true,
				},
				PatientAvailabilityStart: sql.NullTime{
					Time:  parsedStart,
					Valid: true,
				},
				PatientAvailabilityEnd: sql.NullTime{
					Time:  parsedEnd,
					Valid: true,
				},
				CarName: sql.NullString{
					String: testCar,
					Valid:  true,
				},
				CarID: sql.NullInt64{
					Int64: testCarID,
					Valid: true,
				},
				ProviderUserIds: testProviderUserIDs,
			},
		},
		{
			name: "works with all optional fields set",
			input: input{
				Req: &caremanagerpb.CreateVisitFromStationCRRequest{
					CareRequestId:            testCareRequestID,
					ServiceLineId:            testServiceLineID,
					MarketId:                 testMarketID,
					CreatedByUserId:          &testCreatedBy,
					Status:                   testStatus,
					StatusUpdatedAt:          "01/01/01",
					AddressId:                testAddressID,
					PatientAvailabilityStart: testAvailabilityStart,
					PatientAvailabilityEnd:   testAvailabilityEnd,
					CarName:                  testCar,
					CarId:                    &testCarID,
				},
				EpisodeID: testEpisodeID,
			},

			want: &caremanagerdb.CreateVisitParams{
				CareRequestID: sql.NullInt64{
					Int64: testCareRequestID,
					Valid: true,
				},
				EpisodeID: testEpisodeID,
				VisitTypeID: sql.NullInt64{
					Int64: 0,
					Valid: false,
				},
				CreatedByUserID: sql.NullInt64{
					Int64: testCreatedBy,
					Valid: true,
				},
				Status: sql.NullString{
					String: testStatus,
					Valid:  true,
				},
				StatusUpdatedAt: sql.NullTime{
					Time:  time.Time{},
					Valid: false,
				},
				AddressID: sql.NullInt64{
					Int64: testAddressID,
					Valid: true,
				},
				PatientAvailabilityStart: sql.NullTime{
					Time:  parsedStart,
					Valid: true,
				},
				PatientAvailabilityEnd: sql.NullTime{
					Time:  parsedEnd,
					Valid: true,
				},
				CarName: sql.NullString{
					String: testCar,
					Valid:  true,
				},
				CarID: sql.NullInt64{
					Int64: testCarID,
					Valid: true,
				},
				ProviderUserIds: nil,
			},
		},
		{
			name: "fails because request has missing car name",
			input: input{
				Req: &caremanagerpb.CreateVisitFromStationCRRequest{
					CareRequestId:            testCareRequestID,
					ServiceLineId:            testServiceLineID,
					MarketId:                 testMarketID,
					CreatedByUserId:          &testCreatedBy,
					Status:                   testStatus,
					StatusUpdatedAt:          "01/01/01",
					AddressId:                testAddressID,
					PatientAvailabilityStart: testAvailabilityStart,
					PatientAvailabilityEnd:   testAvailabilityEnd,
					CarName:                  "",
					CarId:                    &testCarID,
				},
				EpisodeID: 0,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "visit.car_name cannot be empty"),
		},

		{
			name: "fails because request has missing availability start",
			input: input{
				Req: &caremanagerpb.CreateVisitFromStationCRRequest{
					CareRequestId:            testCareRequestID,
					ServiceLineId:            testServiceLineID,
					MarketId:                 testMarketID,
					CreatedByUserId:          &testCreatedBy,
					Status:                   testStatus,
					StatusUpdatedAt:          "01/01/01",
					AddressId:                testAddressID,
					PatientAvailabilityStart: "",
					PatientAvailabilityEnd:   testAvailabilityEnd,
					CarName:                  testCar,
					CarId:                    &testCarID,
				},
				EpisodeID: testEpisodeID,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "visit.patient_availability_start cannot be empty"),
		},
		{
			name: "fails because request has missing availability end",
			input: input{
				Req: &caremanagerpb.CreateVisitFromStationCRRequest{
					CareRequestId:            testCareRequestID,
					ServiceLineId:            testServiceLineID,
					MarketId:                 testMarketID,
					CreatedByUserId:          &testCreatedBy,
					Status:                   testStatus,
					StatusUpdatedAt:          "01/01/01",
					AddressId:                testAddressID,
					PatientAvailabilityStart: testAvailabilityStart,
					PatientAvailabilityEnd:   "",
					CarName:                  testCar,
					CarId:                    &testCarID,
				},
				EpisodeID: testEpisodeID,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "visit.patient_availability_end cannot be empty"),
		},
		{
			name: "fails because request has missing status",
			input: input{
				Req: &caremanagerpb.CreateVisitFromStationCRRequest{
					CareRequestId:            testCareRequestID,
					ServiceLineId:            testServiceLineID,
					MarketId:                 testMarketID,
					CreatedByUserId:          &testCreatedBy,
					Status:                   "",
					StatusUpdatedAt:          "01/01/01",
					AddressId:                testAddressID,
					PatientAvailabilityStart: testAvailabilityStart,
					PatientAvailabilityEnd:   testAvailabilityEnd,
					CarName:                  testCar,
					CarId:                    &testCarID,
				},
				EpisodeID: testEpisodeID,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "visit.status cannot be empty"),
		},
		{
			name: "fails because request has missing status_updated_at",
			input: input{
				Req: &caremanagerpb.CreateVisitFromStationCRRequest{
					CareRequestId:            testCareRequestID,
					ServiceLineId:            testServiceLineID,
					MarketId:                 testMarketID,
					CreatedByUserId:          &testCreatedBy,
					Status:                   testStatus,
					StatusUpdatedAt:          "",
					AddressId:                testAddressID,
					PatientAvailabilityStart: testAvailabilityStart,
					PatientAvailabilityEnd:   testAvailabilityEnd,
					CarName:                  testCar,
					CarId:                    &testCarID,
				},
				EpisodeID: testEpisodeID,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "visit.status_updated_at cannot be empty"),
		},
		{
			name: "fails because request has missing address_id",
			input: input{
				Req: &caremanagerpb.CreateVisitFromStationCRRequest{
					CareRequestId:            testCareRequestID,
					ServiceLineId:            testServiceLineID,
					MarketId:                 testMarketID,
					CreatedByUserId:          &testCreatedBy,
					Status:                   testStatus,
					StatusUpdatedAt:          "01/01/01",
					AddressId:                0,
					PatientAvailabilityStart: testAvailabilityStart,
					PatientAvailabilityEnd:   testAvailabilityEnd,
					CarName:                  testCar,
					CarId:                    &testCarID,
				},
				EpisodeID: testEpisodeID,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "visit.address_id cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := CreateVisitSQLParamsFromCreateVisitFromStationCRProtoRequest(testCase.input.Req, testCase.input.EpisodeID)
			testutils.MustMatch(t, testCase.wantErr, err)
			testutils.MustMatchFn(".AdmittedAt")(t, testCase.want, output)
		})
	}
}

func TestGetEpisodesSQLParamsFromGetEpisodesProtoRequest(t *testing.T) {
	type args struct {
		request   *caremanagerpb.GetEpisodesRequest
		marketIDs []int64
	}

	testCases := []struct {
		name  string
		input args

		want *caremanagerdb.GetEpisodesParams
	}{
		{
			name: "works",
			input: args{
				request: &caremanagerpb.GetEpisodesRequest{
					IncompleteTask: proto.Bool(true),
					MarketId:       []int64{1, 2, 3},
					PatientName:    proto.String("John Doe"),
					Page:           proto.Int64(2),
					PageSize:       proto.Int64(10),
					ServiceLineId:  []int64{4, 5, 6},
					CarePhaseId:    []int64{7, 8, 9},
				},
				marketIDs: []int64{1, 3},
			},

			want: &caremanagerdb.GetEpisodesParams{
				IncompleteTasks: true,
				MarketIds:       []int64{1, 3},
				PatientName: sql.NullString{
					String: "John Doe",
					Valid:  true,
				},
				PageOffset:     10,
				PageSize:       10,
				ServiceLineIds: []int64{4, 5, 6},
				CarePhaseIds:   []int64{7, 8, 9},
			},
		},
		{
			name: "works without nullable fields",
			input: args{
				request:   &caremanagerpb.GetEpisodesRequest{},
				marketIDs: nil,
			},

			want: &caremanagerdb.GetEpisodesParams{
				IncompleteTasks: false,
				PatientName: sql.NullString{
					Valid: false,
				},
				PageOffset: 0,
				PageSize:   defaultPageSize,
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := GetEpisodesSQLParamsFromGetEpisodesProtoRequest(testCase.input.request, testCase.input.marketIDs)
			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestGetPageInfo(t *testing.T) {
	testCases := []struct {
		name         string
		totalRecords int64
		pageSize     int64
		pageOffset   int64

		want       *caremanagerpb.PageInfo
		wantErrMsg string
	}{
		{
			name:         "works with default values and no records",
			totalRecords: 0,
			pageSize:     defaultPageSize,
			pageOffset:   defaultOffset,

			want: &caremanagerpb.PageInfo{
				PageSize:     defaultPageSize,
				TotalResults: 0,
				TotalPages:   1,
				CurrentPage:  1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name:         "works with default values and two pages of records",
			totalRecords: 6,
			pageSize:     defaultPageSize,
			pageOffset:   defaultOffset,

			want: &caremanagerpb.PageInfo{
				PageSize:     defaultPageSize,
				TotalResults: 6,
				TotalPages:   2,
				CurrentPage:  1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(false),
				NextPage:     proto.Int64(2),
			},
		},
		{
			name:         "works with different PageSize",
			totalRecords: 6,
			pageSize:     10,
			pageOffset:   defaultOffset,

			want: &caremanagerpb.PageInfo{
				PageSize:     10,
				TotalResults: 6,
				TotalPages:   1,
				CurrentPage:  1,
				FirstPage:    proto.Bool(true),
				LastPage:     proto.Bool(true),
			},
		},
		{
			name:         "works with different PageOffset",
			totalRecords: 20,
			pageSize:     defaultPageSize,
			pageOffset:   10,

			want: &caremanagerpb.PageInfo{
				PageSize:     defaultPageSize,
				TotalResults: 20,
				TotalPages:   4,
				CurrentPage:  3,
				FirstPage:    proto.Bool(false),
				LastPage:     proto.Bool(false),
				PreviousPage: proto.Int64(2),
				NextPage:     proto.Int64(4),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := GetPageInfo(testCase.totalRecords, testCase.pageSize, testCase.pageOffset)
			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestUpdateEpisodeSQLParamsFromUpdateEpisodeProtoRequest(t *testing.T) {
	var mockEpisodeID int64 = 1
	timestampString := time.Now().Format(timestampLayout)
	patientAdmittedAtTime, _ := time.Parse(timestampLayout, timestampString)

	testCases := []struct {
		name       string
		input      *caremanagerpb.UpdateEpisodeRequest
		discharged bool

		want      *caremanagerdb.UpdateEpisodeParams
		wantError error
	}{
		{
			name: "works",
			input: &caremanagerpb.UpdateEpisodeRequest{
				EpisodeId:      mockEpisodeID,
				PatientSummary: proto.String("Summary"),
				AdmittedAt:     proto.String(timestampString),
				IsWaiver:       proto.Bool(true),
			},

			want: &caremanagerdb.UpdateEpisodeParams{
				ID:             mockEpisodeID,
				PatientSummary: sqltypes.ToNullString(proto.String("Summary")),
				AdmittedAt:     sqltypes.ToValidNullTime(patientAdmittedAtTime),
				DischargedAt:   sql.NullTime{},
				IsWaiver:       sqltypes.ToNullBool(proto.Bool(true)),
			},
		},
		{
			name: "works discharged care phase",
			input: &caremanagerpb.UpdateEpisodeRequest{
				EpisodeId:      mockEpisodeID,
				PatientSummary: proto.String("Summary"),
				AdmittedAt:     proto.String(timestampString),
				IsWaiver:       proto.Bool(false),
			},
			discharged: true,

			want: &caremanagerdb.UpdateEpisodeParams{
				ID:             mockEpisodeID,
				PatientSummary: sqltypes.ToNullString(proto.String("Summary")),
				AdmittedAt:     sqltypes.ToValidNullTime(patientAdmittedAtTime),
				DischargedAt:   sqltypes.ToValidNullTime(patientAdmittedAtTime),
				IsWaiver:       sqltypes.ToNullBool(proto.Bool(false)),
			},
		},
		{
			name:  "fails because request has missing Episode ID",
			input: &caremanagerpb.UpdateEpisodeRequest{},

			wantError: status.Error(codes.InvalidArgument, "episode.id cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := UpdateEpisodeSQLParamsFromUpdateEpisodeProtoRequest(testCase.input, testCase.discharged)
			testutils.MustMatch(t, testCase.wantError, err)
			testutils.MustMatchFn(".AdmittedAt", ".DischargedAt")(t, testCase.want, output)
		})
	}
}

func TestGetTaskTemplatesSQLParamsFromGetTaskTemplateRequest(t *testing.T) {
	testCases := []struct {
		name  string
		input *caremanagerpb.GetTaskTemplatesRequest

		want *caremanagerdb.GetTaskTemplatesParams
	}{
		{
			name:  "works with default values",
			input: &caremanagerpb.GetTaskTemplatesRequest{},

			want: &caremanagerdb.GetTaskTemplatesParams{
				PageSize:      5,
				PageOffset:    0,
				SortBy:        sql.NullString{Valid: true, String: "name"},
				SortDirection: sql.NullString{Valid: true, String: "asc"},
			},
		},
		{
			name: "works with different page size",
			input: &caremanagerpb.GetTaskTemplatesRequest{
				PageSize: proto.Int64(10),
			},

			want: &caremanagerdb.GetTaskTemplatesParams{
				PageSize:      10,
				PageOffset:    0,
				SortBy:        sql.NullString{Valid: true, String: "name"},
				SortDirection: sql.NullString{Valid: true, String: "asc"},
			},
		},
		{
			name: "works with different initial page",
			input: &caremanagerpb.GetTaskTemplatesRequest{
				Page: proto.Int64(2),
			},

			want: &caremanagerdb.GetTaskTemplatesParams{
				PageSize:      5,
				PageOffset:    5,
				SortBy:        sql.NullString{Valid: true, String: "name"},
				SortDirection: sql.NullString{Valid: true, String: "asc"},
			},
		},
		{
			name: "works with a given template name",
			input: &caremanagerpb.GetTaskTemplatesRequest{
				Name: proto.String("Template"),
			},

			want: &caremanagerdb.GetTaskTemplatesParams{
				PageSize:      5,
				PageOffset:    0,
				TemplateName:  sql.NullString{Valid: true, String: "Template"},
				SortBy:        sql.NullString{Valid: true, String: "name"},
				SortDirection: sql.NullString{Valid: true, String: "asc"},
			},
		},
		{
			name: "works with a given sorted by column",
			input: &caremanagerpb.GetTaskTemplatesRequest{
				SortBy: proto.String("service_line_id"),
			},

			want: &caremanagerdb.GetTaskTemplatesParams{
				PageSize:      5,
				PageOffset:    0,
				SortBy:        sql.NullString{Valid: true, String: "service_line_id"},
				SortDirection: sql.NullString{Valid: true, String: "asc"},
			},
		},
		{
			name: "works with a given sort direction",
			input: &caremanagerpb.GetTaskTemplatesRequest{
				SortDirection: proto.String("desc"),
			},

			want: &caremanagerdb.GetTaskTemplatesParams{
				PageSize:      5,
				PageOffset:    0,
				SortBy:        sql.NullString{Valid: true, String: "name"},
				SortDirection: sql.NullString{Valid: true, String: "desc"},
			},
		},
		{
			name: "works with care_phase_id and service_line_id filters",
			input: &caremanagerpb.GetTaskTemplatesRequest{
				CarePhaseId:   []int64{1, 2, 3},
				ServiceLineId: []int64{4, 5, 6},
			},

			want: &caremanagerdb.GetTaskTemplatesParams{
				CarePhaseID:   []int64{1, 2, 3},
				ServiceLineID: []int64{4, 5, 6},
				PageSize:      5,
				PageOffset:    0,
				SortBy:        sql.NullString{Valid: true, String: "name"},
				SortDirection: sql.NullString{Valid: true, String: "asc"},
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := GetTaskTemplatesSQLParamsFromGetTaskTemplateRequest(testCase.input)

			testutils.MustMatch(t, testCase.want, output, "ServiceLineProtoFromServiceLineSQL conversion failed")
		})
	}
}

func TestGetPatientsSQLParamsFromGetPatientsProtoRequest(t *testing.T) {
	testCases := []struct {
		name  string
		input *caremanagerpb.GetPatientsRequest

		want *caremanagerdb.GetPatientsParams
	}{
		{
			name:  "works with default values",
			input: &caremanagerpb.GetPatientsRequest{},

			want: &caremanagerdb.GetPatientsParams{
				PageSize:     5,
				PageOffset:   0,
				CompleteName: sql.NullString{Valid: true, String: ""},
			},
		},
		{
			name: "works with different page size",
			input: &caremanagerpb.GetPatientsRequest{
				PageSize: proto.Int64(10),
			},

			want: &caremanagerdb.GetPatientsParams{
				PageSize:     10,
				PageOffset:   0,
				CompleteName: sql.NullString{Valid: true, String: ""},
			},
		},
		{
			name: "works with different initial page",
			input: &caremanagerpb.GetPatientsRequest{
				Page: proto.Int64(2),
			},

			want: &caremanagerdb.GetPatientsParams{
				PageSize:     5,
				PageOffset:   5,
				CompleteName: sql.NullString{Valid: true, String: ""},
			},
		},
		{
			name: "works with a given name",
			input: &caremanagerpb.GetPatientsRequest{
				Name: *proto.String("John"),
			},

			want: &caremanagerdb.GetPatientsParams{
				PageSize:     5,
				PageOffset:   0,
				CompleteName: sql.NullString{Valid: true, String: "John"},
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := GetPatientsSQLParamsFromGetPatientsProtoRequest(testCase.input)

			testutils.MustMatch(t, testCase.want, output, "ServiceLineProtoFromServiceLineSQL conversion failed")
		})
	}
}

func TestCreatePatientSQLParamsFromPatientProtoRequest(t *testing.T) {
	patientDateOfBirth := "1998-05-28T16:46:31.000Z"
	patientDateOfBirthTime, _ := time.Parse(time.RFC3339, "1998-05-28T16:46:31.000Z")

	testCases := []struct {
		name  string
		input *caremanagerpb.CreatePatientRequest

		want       *caremanagerdb.CreatePatientParams
		wantErrMsg string
	}{
		{
			name: "works",
			input: &caremanagerpb.CreatePatientRequest{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "male",
				DateOfBirth: patientDateOfBirth,
			},

			want: &caremanagerdb.CreatePatientParams{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "male",
				DateOfBirth: patientDateOfBirthTime,
			},
		},
		{
			name: "works with all optional fields set",
			input: &caremanagerpb.CreatePatientRequest{
				FirstName:                     "John",
				LastName:                      "Doe",
				Sex:                           "male",
				DateOfBirth:                   patientDateOfBirth,
				MiddleName:                    proto.String("James"),
				PhoneNumber:                   proto.String("+523323844908"),
				AthenaMedicalRecordNumber:     proto.String("1234567"),
				MedicalPowerOfAttorneyDetails: proto.String("some details"),
				Payer:                         proto.String("some payer"),
				PreferredPharmacyDetails:      proto.String("some pharmacy details"),
				DoctorDetails:                 proto.String("some doctor details"),
				Referrer:                      proto.String("some referrer"),
				AddressStreet:                 proto.String("some street"),
				AddressStreet_2:               proto.String("some street 2"),
				AddressCity:                   proto.String("some city"),
				AddressState:                  proto.String("some state"),
				AddressZipcode:                proto.String("some zipcode"),
				AddressNotes:                  proto.String("some notes"),
			},

			want: &caremanagerdb.CreatePatientParams{
				FirstName:                     "John",
				LastName:                      "Doe",
				Sex:                           "male",
				DateOfBirth:                   patientDateOfBirthTime,
				MiddleName:                    sql.NullString{String: "James", Valid: true},
				PhoneNumber:                   "+523323844908",
				AthenaMedicalRecordNumber:     sql.NullString{String: "1234567", Valid: true},
				MedicalPowerOfAttorneyDetails: sql.NullString{String: "some details", Valid: true},
				Payer:                         sql.NullString{String: "some payer", Valid: true},
				PreferredPharmacyDetails:      sql.NullString{String: "some pharmacy details", Valid: true},
				DoctorDetails:                 sql.NullString{String: "some doctor details", Valid: true},
				Referrer:                      sql.NullString{String: "some referrer", Valid: true},
				AddressStreet:                 "some street",
				AddressStreet2:                sql.NullString{String: "some street 2", Valid: true},
				AddressCity:                   "some city",
				AddressState:                  "some state",
				AddressZipcode:                "some zipcode",
				AddressNotes:                  sql.NullString{String: "some notes", Valid: true},
			},
		},
		{
			name: "works with a phone number with punctuation marks and spaces",
			input: &caremanagerpb.CreatePatientRequest{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "male",
				DateOfBirth: patientDateOfBirth,
				PhoneNumber: proto.String("+1 (303) 50 0-151-8"),
			},

			want: &caremanagerdb.CreatePatientParams{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "male",
				DateOfBirth: patientDateOfBirthTime,
				PhoneNumber: "+13035001518",
			},
		},
		{
			name: "fails because firstName is empty",
			input: &caremanagerpb.CreatePatientRequest{
				FirstName:   "",
				LastName:    "Doe",
				Sex:         "male",
				DateOfBirth: patientDateOfBirth,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = patient.first_name cannot be empty",
		},
		{
			name: "fails because lastName is empty",
			input: &caremanagerpb.CreatePatientRequest{
				FirstName:   "John",
				LastName:    "",
				Sex:         "male",
				DateOfBirth: patientDateOfBirth,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = patient.last_name cannot be empty",
		},
		{
			name: "fails because sex is empty",
			input: &caremanagerpb.CreatePatientRequest{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "",
				DateOfBirth: patientDateOfBirth,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = patient.sex cannot be empty",
		},
		{
			name: "fails because dateOfBirth is empty",
			input: &caremanagerpb.CreatePatientRequest{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "male",
				DateOfBirth: "",
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = patient.date_of_birth cannot be empty",
		},
		{
			name: "fails because dateOfBirth is malformed",
			input: &caremanagerpb.CreatePatientRequest{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "male",
				DateOfBirth: "malformed-2001-01-02",
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = patient.date_of_birth is malformed",
		},
		{
			name: "fails because phoneNumber is not valid",
			input: &caremanagerpb.CreatePatientRequest{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "male",
				DateOfBirth: patientDateOfBirth,
				PhoneNumber: proto.String("12345"),
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = patient.phone_number is not valid",
		},
		{
			name: "fails because phoneNumber is not a number",
			input: &caremanagerpb.CreatePatientRequest{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "male",
				DateOfBirth: patientDateOfBirth,
				PhoneNumber: proto.String("ABCDE"),
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = patient.phone_number the phone number supplied is not a number",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := CreatePatientSQLParamsFromCreatePatientProtoRequest(testCase.input)
			if err != nil {
				if testCase.wantErrMsg != "" {
					testutils.MustMatch(t, testCase.wantErrMsg, err.Error(), "PatientSQLParamsFromPatientProtoRequest failed")
				} else {
					t.Fatal("PatientSQLParamsFromPatientProtoRequest returned an unexpected error: ", err.Error())
				}
			} else {
				testutils.MustMatch(t, testCase.want, output, "PatientSQLParamsFromPatientProtoRequest conversion failed")
			}
		})
	}
}

func TestCreatePatientSQLParamsFromCreateVisitFromStationCRProtoRequest(t *testing.T) {
	patientDateOfBirth := "1998-05-28T16:46:31.000Z"
	patientDateOfBirthTime, _ := time.Parse(time.RFC3339, "1998-05-28T16:46:31.000Z")
	testMemberID := "1234ca0123"
	address1 := "address1"
	addressCity := "las vegas"
	addressZip := "12345"
	addressState := "Nevada"
	priority := int32(1)

	testCases := []struct {
		name  string
		input *caremanagerpb.CreateVisitFromStationCRRequest

		want    *caremanagerdb.CreatePatientParams
		wantErr error
	}{
		{
			name: "works",
			input: &caremanagerpb.CreateVisitFromStationCRRequest{
				Patient: &caremanagerpb.CreatePatientFromStationCRRequest{
					FirstName:      "John",
					LastName:       "Doe",
					DateOfBirth:    patientDateOfBirth,
					Sex:            "male",
					PhoneNumber:    "7027313030",
					AddressStreet:  &address1,
					AddressCity:    &addressCity,
					AddressState:   &addressState,
					AddressZipcode: &addressZip,
				},
			},

			want: &caremanagerdb.CreatePatientParams{
				FirstName:                 "John",
				LastName:                  "Doe",
				Sex:                       "male",
				DateOfBirth:               patientDateOfBirthTime,
				PhoneNumber:               "+17027313030",
				AthenaMedicalRecordNumber: sql.NullString{String: "", Valid: true},
				AddressCity:               addressCity,
				AddressStreet:             address1,
				AddressZipcode:            addressZip,
				AddressState:              addressState,
			},
		},
		{
			name: "works with all optional fields set",
			input: &caremanagerpb.CreateVisitFromStationCRRequest{
				Patient: &caremanagerpb.CreatePatientFromStationCRRequest{
					FirstName:                 "John",
					LastName:                  "Doe",
					Sex:                       "male",
					DateOfBirth:               patientDateOfBirth,
					MiddleName:                proto.String("James"),
					PhoneNumber:               "7027313030",
					AthenaMedicalRecordNumber: "1234567",
					Insurances: []*caremanagerpb.CreatePatientFromStationCRRequest_CreateInsuranceFromStationCR{
						{
							Name:     "Humana",
							MemberId: &testMemberID,
							Priority: &priority,
						},
					},
					MedicalDecisionMaker: &caremanagerpb.CreatePatientFromStationCRRequest_CreateMedicalDecisionMakerFromStationCR{
						FirstName:    "first_name",
						LastName:     proto.String("last_name"),
						PhoneNumber:  proto.String("12341234"),
						Address:      proto.String("some address"),
						Relationship: proto.String("sister"),
					},
					AddressStreet:   proto.String("some street"),
					AddressStreet_2: proto.String("some street 2"),
					AddressCity:     proto.String("some city"),
					AddressState:    proto.String("some state"),
					AddressZipcode:  proto.String("some zipcode"),
				},
			},

			want: &caremanagerdb.CreatePatientParams{
				FirstName:                 "John",
				LastName:                  "Doe",
				Sex:                       "male",
				DateOfBirth:               patientDateOfBirthTime,
				MiddleName:                sql.NullString{String: "James", Valid: true},
				PhoneNumber:               "+17027313030",
				AthenaMedicalRecordNumber: sql.NullString{String: "1234567", Valid: true},
				AddressStreet:             "some street",
				AddressStreet2:            sql.NullString{String: "some street 2", Valid: true},
				AddressCity:               "some city",
				AddressState:              "some state",
				AddressZipcode:            "some zipcode",
			},
		},
		{
			name: "fails because firstName is empty",
			input: &caremanagerpb.CreateVisitFromStationCRRequest{
				Patient: &caremanagerpb.CreatePatientFromStationCRRequest{
					FirstName:   "",
					LastName:    "Doe",
					Sex:         "male",
					DateOfBirth: patientDateOfBirth,
				},
			},

			wantErr: status.Errorf(codes.InvalidArgument, "patient.first_name cannot be empty"),
		},
		{
			name: "fails because lastName is empty",
			input: &caremanagerpb.CreateVisitFromStationCRRequest{
				Patient: &caremanagerpb.CreatePatientFromStationCRRequest{
					FirstName:   "John",
					LastName:    "",
					Sex:         "male",
					DateOfBirth: patientDateOfBirth,
				},
			},

			wantErr: status.Errorf(codes.InvalidArgument, "patient.last_name cannot be empty"),
		},
		{
			name: "fails because sex is empty",
			input: &caremanagerpb.CreateVisitFromStationCRRequest{
				Patient: &caremanagerpb.CreatePatientFromStationCRRequest{
					FirstName:   "John",
					LastName:    "Doe",
					Sex:         "",
					DateOfBirth: patientDateOfBirth,
				},
			},

			wantErr: status.Errorf(codes.InvalidArgument, "patient.sex cannot be empty"),
		},
		{
			name: "fails because dateOfBirth is empty",
			input: &caremanagerpb.CreateVisitFromStationCRRequest{
				Patient: &caremanagerpb.CreatePatientFromStationCRRequest{
					FirstName:   "John",
					LastName:    "Doe",
					Sex:         "male",
					DateOfBirth: "",
				},
			},

			wantErr: status.Errorf(codes.InvalidArgument, "patient.date_of_birth cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := CreatePatientSQLParamsFromCreateVisitFromStationCRProtoRequest(testCase.input)
			testutils.MustMatch(t, testCase.wantErr, err, "unexpected problem, expected error and response error don't match")
			testutils.MustMatch(t, testCase.want, output, "CreatePatientSQLParamsFromCreateVisitFromStationCRProtoRequest conversion failed")
		})
	}
}

func TestCreateMedicalDecisionMakerSQLParamsFromCreateVisitFromStationCRProtoRequest(t *testing.T) {
	testPatientID := time.Now().UnixNano()

	type input struct {
		Req       *caremanagerpb.CreatePatientFromStationCRRequest_CreateMedicalDecisionMakerFromStationCR
		PatientID int64
	}

	testCases := []struct {
		name  string
		input input

		want    *caremanagerdb.CreateMedicalDecisionMakerParams
		wantErr error
	}{
		{
			name: "works",
			input: input{
				Req: &caremanagerpb.CreatePatientFromStationCRRequest_CreateMedicalDecisionMakerFromStationCR{
					FirstName: "John Doe",
				},
				PatientID: testPatientID,
			},

			want: &caremanagerdb.CreateMedicalDecisionMakerParams{
				FirstName: "John Doe",
				LastName:  "",
				Address: sql.NullString{
					String: "",
					Valid:  false,
				},
				PatientID: testPatientID,
			},
		},
		{
			name: "works with all optional fields set",
			input: input{
				Req: &caremanagerpb.CreatePatientFromStationCRRequest_CreateMedicalDecisionMakerFromStationCR{
					FirstName:    "John",
					LastName:     proto.String("Doe"),
					PhoneNumber:  proto.String("7027313030"),
					Address:      proto.String("test address"),
					Relationship: proto.String("sister"),
				},
				PatientID: testPatientID,
			},

			want: &caremanagerdb.CreateMedicalDecisionMakerParams{
				FirstName: "John",
				LastName:  "Doe",
				PhoneNumber: sql.NullString{
					String: "+17027313030",
					Valid:  true,
				},
				Address: sql.NullString{
					String: "test address",
					Valid:  true,
				},
				Relationship: sql.NullString{
					String: "sister",
					Valid:  true,
				},
				PatientID: testPatientID,
			},
		},
		{
			name: "fails if first_name is not set",
			input: input{
				Req: &caremanagerpb.CreatePatientFromStationCRRequest_CreateMedicalDecisionMakerFromStationCR{
					LastName:     proto.String("Doe"),
					PhoneNumber:  proto.String("7027313030"),
					Address:      proto.String("test address"),
					Relationship: proto.String("sister"),
				},
				PatientID: testPatientID,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "medical_decision_maker.first_name cannot be empty"),
		},
		{
			name: "fails if for a phone number with invalid characters",
			input: input{
				Req: &caremanagerpb.CreatePatientFromStationCRRequest_CreateMedicalDecisionMakerFromStationCR{
					FirstName:    "John",
					LastName:     proto.String("Doe"),
					PhoneNumber:  proto.String("7invalid33"),
					Address:      proto.String("test address"),
					Relationship: proto.String("sister"),
				},
				PatientID: testPatientID,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "medical_decision_maker.phone_number the phone number supplied is not a number"),
		},
		{
			name: "fails if for a non valid phone number",
			input: input{
				Req: &caremanagerpb.CreatePatientFromStationCRRequest_CreateMedicalDecisionMakerFromStationCR{
					FirstName:    "John",
					LastName:     proto.String("Doe"),
					PhoneNumber:  proto.String("0000000000"),
					Address:      proto.String("test address"),
					Relationship: proto.String("sister"),
				},
				PatientID: testPatientID,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "medical_decision_maker.phone_number is not valid"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := CreateMedicalDecisionMakerSQLParamsFromCreateVisitFromStationCRProtoRequest(testCase.input.Req, testCase.input.PatientID)
			testutils.MustMatch(t, testCase.wantErr, err, "unexpected problem, expected error and response error don't match")
			testutils.MustMatch(t, testCase.want, output, "CreateMedicalDecisionMakerSQLParamsFromCreateVisitFromStationCRProtoRequest conversion failed")
		})
	}
}

func TestCreateInsurancesSQLParamsFromCreateVisitFromStationCRProtoRequest(t *testing.T) {
	testPatientID := time.Now().UnixNano()

	type input struct {
		Req       []*caremanagerpb.CreatePatientFromStationCRRequest_CreateInsuranceFromStationCR
		PatientID int64
	}

	testCases := []struct {
		name  string
		input input

		want    *caremanagerdb.CreateInsurancesParams
		wantErr error
	}{
		{
			name: "works",
			input: input{
				Req: []*caremanagerpb.CreatePatientFromStationCRRequest_CreateInsuranceFromStationCR{
					{
						Name:     "Humana",
						MemberId: proto.String("1234ac-1234-a"),
						Priority: proto.Int32(1),
					},
				},
				PatientID: testPatientID,
			},

			want: &caremanagerdb.CreateInsurancesParams{
				Name:      []string{"Humana"},
				PatientID: []int64{testPatientID},
				MemberID:  []string{"1234ac-1234-a"},
				Priority:  []int32{1},
			},
		},
		{
			name: "works with 3 insurances",
			input: input{
				Req: []*caremanagerpb.CreatePatientFromStationCRRequest_CreateInsuranceFromStationCR{
					{
						Name:     "Humana",
						MemberId: proto.String("1234ac-1234-a"),
						Priority: proto.Int32(1),
					},
					{
						Name:     "Humana 2",
						MemberId: proto.String("2"),
						Priority: proto.Int32(2),
					},
					{
						Name:     "Humana 3",
						MemberId: proto.String("3"),
						Priority: proto.Int32(3),
					},
				},
				PatientID: testPatientID,
			},

			want: &caremanagerdb.CreateInsurancesParams{
				Name:      []string{"Humana", "Humana 2", "Humana 3"},
				PatientID: []int64{testPatientID, testPatientID, testPatientID},
				MemberID:  []string{"1234ac-1234-a", "2", "3"},
				Priority:  []int32{int32(1), int32(2), int32(3)},
			},
		},
		{
			name: "works with one insurance and optional data",
			input: input{
				Req: []*caremanagerpb.CreatePatientFromStationCRRequest_CreateInsuranceFromStationCR{
					{
						Name:     "Humana",
						Priority: proto.Int32(1),
					},
				},
				PatientID: testPatientID,
			},

			want: &caremanagerdb.CreateInsurancesParams{
				Name:      []string{"Humana"},
				PatientID: []int64{testPatientID},
				MemberID:  []string{""},
				Priority:  []int32{1},
			},
		},
		{
			name: "works with three insurance and optional data",
			input: input{
				Req: []*caremanagerpb.CreatePatientFromStationCRRequest_CreateInsuranceFromStationCR{
					{
						Name:     "Humana",
						Priority: proto.Int32(1),
					},
					{
						Name:     "Humana 2",
						Priority: proto.Int32(2),
					},
					{
						Name:     "Humana 3",
						Priority: proto.Int32(3),
					},
				},
				PatientID: testPatientID,
			},

			want: &caremanagerdb.CreateInsurancesParams{
				Name:      []string{"Humana", "Humana 2", "Humana 3"},
				PatientID: []int64{testPatientID, testPatientID, testPatientID},
				MemberID:  []string{"", "", ""},
				Priority:  []int32{1, 2, 3},
			},
		},
		{
			name: "fails if priority is not one of 1, 2, or 3",
			input: input{
				Req: []*caremanagerpb.CreatePatientFromStationCRRequest_CreateInsuranceFromStationCR{
					{
						Name:     "Humana",
						Priority: proto.Int32(4),
					},
					{
						Name:     "Humana 2",
						Priority: proto.Int32(2),
					},
					{
						Name:     "Humana 3",
						Priority: proto.Int32(3),
					},
				},
				PatientID: testPatientID,
			},

			wantErr: status.Errorf(codes.InvalidArgument, "insurances.priority 4 is invalid"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := CreateInsuranceSQLParamsFromCreateVisitFromStationCRProtoRequest(testCase.input.Req, testCase.input.PatientID)
			testutils.MustMatch(t, testCase.wantErr, err, "unexpected problem, expected error and response error don't match")
			testutils.MustMatch(t, testCase.want, output, "CreateInsuranceSQLParamsFromCreateVisitFromStationCRProtoRequest conversion failed")
		})
	}
}

func TestPatientProtoFromPatientSQL(t *testing.T) {
	patientDateOfBirth := "1998-05-28"
	patientDateOfBirthTime, _ := time.Parse(dateLayout, "1998-05-28")
	patientCreatedAt := time.Now()
	patientUpdatedAt := time.Now()

	testCases := []struct {
		name   string
		input  *caremanagerdb.Patient
		params PatientProtoFromPatientSQLParams

		want *caremanagerpb.Patient
	}{
		{
			name: "works",
			input: &caremanagerdb.Patient{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "male",
				DateOfBirth: patientDateOfBirthTime,
				CreatedAt:   patientCreatedAt,
				UpdatedAt:   patientUpdatedAt,
			},

			want: &caremanagerpb.Patient{
				FirstName:      "John",
				LastName:       "Doe",
				PhoneNumber:    proto.String(""),
				Sex:            "male",
				DateOfBirth:    patientDateOfBirth,
				AddressStreet:  proto.String(""),
				AddressCity:    proto.String(""),
				AddressState:   proto.String(""),
				AddressZipcode: proto.String(""),
				CreatedAt:      proto.String(patientCreatedAt.Format(timestampLayout)),
				UpdatedAt:      proto.String(patientUpdatedAt.Format(timestampLayout)),
			},
		},
		{
			name: "works with all optional fields set",
			input: &caremanagerdb.Patient{
				FirstName:                     "John",
				LastName:                      "Doe",
				Sex:                           "male",
				DateOfBirth:                   patientDateOfBirthTime,
				MiddleName:                    sql.NullString{String: "James", Valid: true},
				PhoneNumber:                   "+523323844908",
				AthenaMedicalRecordNumber:     sql.NullString{String: "1234567", Valid: true},
				MedicalPowerOfAttorneyDetails: sql.NullString{String: "this should be ignored now", Valid: true},
				Payer:                         sql.NullString{String: "this should be ignored now", Valid: true},
				PreferredPharmacyDetails:      sql.NullString{String: "this should be ignored now", Valid: true},
				DoctorDetails:                 sql.NullString{String: "this should be ignored now", Valid: true},
				Referrer:                      sql.NullString{String: "this should be ignored now", Valid: true},
				AddressStreet:                 "some street",
				AddressStreet2:                sql.NullString{String: "some street 2", Valid: true},
				AddressCity:                   "some city",
				AddressState:                  "some state",
				AddressZipcode:                "some zipcode",
				AddressNotes:                  sql.NullString{String: "some notes", Valid: true},
				CreatedAt:                     patientCreatedAt,
				UpdatedAt:                     patientUpdatedAt,
			},
			params: PatientProtoFromPatientSQLParams{
				medicalDecisionMaker: &caremanagerdb.MedicalDecisionMaker{
					FirstName: "some details",
				},
				insurance: &caremanagerdb.Insurance{
					Name: "some payer",
				},
				pharmacy: &caremanagerdb.Pharmacy{
					Name: "some pharmacy details",
				},
				externalDoctor: &caremanagerdb.ExternalCareProvider{
					Name: "some doctor details",
				},
				externalReferrer: &caremanagerdb.ExternalCareProvider{
					Name: "some referrer",
				},
			},

			want: &caremanagerpb.Patient{
				FirstName:                     "John",
				LastName:                      "Doe",
				Sex:                           "male",
				DateOfBirth:                   patientDateOfBirth,
				MiddleName:                    proto.String("James"),
				PhoneNumber:                   proto.String("+523323844908"),
				AthenaMedicalRecordNumber:     proto.String("1234567"),
				MedicalPowerOfAttorneyDetails: proto.String("some details"),
				Payer:                         proto.String("some payer"),
				PreferredPharmacyDetails:      proto.String("some pharmacy details"),
				DoctorDetails:                 proto.String("some doctor details"),
				Referrer:                      proto.String("some referrer"),
				AddressStreet:                 proto.String("some street"),
				AddressStreet_2:               proto.String("some street 2"),
				AddressCity:                   proto.String("some city"),
				AddressState:                  proto.String("some state"),
				AddressZipcode:                proto.String("some zipcode"),
				AddressNotes:                  proto.String("some notes"),
				CreatedAt:                     proto.String(patientCreatedAt.Format(timestampLayout)),
				UpdatedAt:                     proto.String(patientUpdatedAt.Format(timestampLayout)),
				AthenaId:                      proto.String("1234567"),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := PatientProtoFromPatientSQL(testCase.input, testCase.params)

			testutils.MustMatch(t, testCase.want, output, "PatientProtoFromPatientSQL conversion failed")
		})
	}
}

func TestTaskTemplateProtoFromTaskTemplateSQL(t *testing.T) {
	summary := "Summary"
	currentTime := time.Now()

	type args struct {
		taskTemplate    *caremanagerdb.TaskTemplate
		carePhase       *caremanagerdb.CarePhase
		tasks           []*caremanagerdb.TaskTemplateTask
		taskTypeByIDMap map[int64]*caremanagerdb.TaskType
		user            *caremanagerpb.User
	}

	testCases := []struct {
		name string
		args args

		want       *caremanagerpb.TaskTemplate
		wantErrMsg string
	}{
		{
			name: "works",
			args: args{
				taskTemplate: &caremanagerdb.TaskTemplate{
					ID:              123,
					Name:            "Test Task",
					Summary:         sql.NullString{String: summary, Valid: true},
					CreatedByUserID: 111,
					CreatedAt:       currentTime,
					UpdatedAt:       currentTime,
					DeletedAt:       sql.NullTime{},
					CarePhaseID:     sql.NullInt64{Int64: 10, Valid: true},
					ServiceLineID:   1000,
				},
				carePhase: &caremanagerdb.CarePhase{
					ID:       1,
					Name:     "Discharged",
					IsActive: true,
				},
				tasks: []*caremanagerdb.TaskTemplateTask{
					{
						ID:         1,
						Body:       "Body",
						TypeID:     2,
						TemplateID: 123,
					},
				},
				taskTypeByIDMap: map[int64]*caremanagerdb.TaskType{
					2: {
						ID:   1,
						Slug: "Slug",
					},
				},
				user: &caremanagerpb.User{
					Id:        1,
					FirstName: "Jonas",
					LastName:  "Salk",
					Email:     "jonas@salk.org",
					JobTitle:  nil,
				},
			},

			want: &caremanagerpb.TaskTemplate{
				Id:         123,
				Name:       "Test Task",
				Summary:    &summary,
				TasksCount: 1,
				CreatedAt:  *proto.String(currentTime.Format(timestampLayout)),
				UpdatedAt:  *proto.String(currentTime.Format(timestampLayout)),
				CarePhase: CarePhaseProtoFromCarePhaseSQL(&caremanagerdb.CarePhase{
					ID:       1,
					Name:     "Discharged",
					IsActive: true,
				}),
				ServiceLineId: 1000,
				Tasks: func() []*caremanagerpb.TaskTemplateTask {
					var tasksProto []*caremanagerpb.TaskTemplateTask
					taskProto, _ := TemplateTaskProtoFromTemplateTaskSQL(&caremanagerdb.TaskTemplateTask{
						ID:         1,
						Body:       "Body",
						TypeID:     2,
						TemplateID: 123,
					}, map[int64]*caremanagerdb.TaskType{
						2: {
							ID:   1,
							Slug: "Slug",
						},
					})

					tasksProto = append(tasksProto, taskProto)
					return tasksProto
				}(),
			},
			wantErrMsg: "",
		},
		{
			name: "returns an error when the task is not found in TaskType map",
			args: args{
				taskTemplate: &caremanagerdb.TaskTemplate{
					ID:              123,
					Name:            "Test Task",
					Summary:         sql.NullString{String: summary, Valid: true},
					CreatedByUserID: 111,
					CreatedAt:       currentTime,
					UpdatedAt:       currentTime,
					DeletedAt:       sql.NullTime{},
					CarePhaseID:     sql.NullInt64{Int64: 10, Valid: true},
					ServiceLineID:   1000,
				},
				carePhase: &caremanagerdb.CarePhase{
					ID:       1,
					Name:     "Discharged",
					IsActive: true,
				},
				tasks: []*caremanagerdb.TaskTemplateTask{
					{
						ID:         1,
						Body:       "Body",
						TypeID:     2,
						TemplateID: 123,
					},
				},
				user: &caremanagerpb.User{
					Id:        1,
					FirstName: "Jonas",
					LastName:  "Salk",
					Email:     "jonas@salk.org",
					JobTitle:  nil,
				},
			},

			wantErrMsg: "rpc error: code = Internal desc = Cannot convert task sql to task proto: task_template_task.id: 1",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := TaskTemplateProtoFromTaskTemplateSQL(
				testCase.args.taskTemplate,
				testCase.args.carePhase,
				testCase.args.tasks,
				testCase.args.taskTypeByIDMap,
			)

			if err != nil && testCase.wantErrMsg == "" {
				t.Fatalf("Unexpected error: %s", err.Error())
			}

			if testCase.wantErrMsg != "" {
				testutils.MustMatch(t, testCase.wantErrMsg, err.Error(), "errors don't match")
			} else {
				testutils.MustMatch(t, testCase.want, output, "TaskTemplateProtoFromTaskTemplateSQL failed. Received output doesn't match expected output")
			}
		})
	}
}

func TestEpisodeProtoFromEpisodeSQL(t *testing.T) {
	admittedAt := "2022-01-01T01:01:01Z"
	dischargedAt := "2022-01-01T01:01:01Z"
	admittedAtTime, _ := time.Parse(timestampLayout, admittedAt)
	dischargedAtTime, _ := time.Parse(timestampLayout, dischargedAt)
	episodeCreatedAt := time.Now()
	episodeUpdatedAt := time.Now()
	medicalDecisionMaker := &caremanagerdb.MedicalDecisionMaker{
		FirstName: "Doctor",
	}
	insurance := &caremanagerdb.Insurance{
		Name: "Insurance",
	}
	pharmacy := &caremanagerdb.Pharmacy{
		Name: "Pharmacy",
	}
	externalDoctor := &caremanagerdb.ExternalCareProvider{
		Name: "External Doctor",
	}
	externalReferrer := &caremanagerdb.ExternalCareProvider{
		Name: "External Referrer",
	}

	testCases := []struct {
		name  string
		input *caremanagerdb.Episode

		want *caremanagerpb.Episode
	}{
		{
			name: "works",
			input: &caremanagerdb.Episode{
				ID:             1,
				AdmittedAt:     admittedAtTime,
				DischargedAt:   sql.NullTime{Time: dischargedAtTime, Valid: true},
				PatientSummary: "Summary",
				CreatedAt:      episodeCreatedAt,
				UpdatedAt:      episodeUpdatedAt,
				IsWaiver:       true,
			},

			want: &caremanagerpb.Episode{
				Id:             1,
				AdmittedAt:     admittedAt,
				PatientSummary: "Summary",
				DischargedAt:   &dischargedAt,
				CreatedAt:      proto.String(episodeCreatedAt.Format(timestampLayout)),
				UpdatedAt:      proto.String(episodeUpdatedAt.Format(timestampLayout)),
				CarePhase:      &caremanagerpb.CarePhase{PhaseType: legacyCarePhaseTypeInactive},
				Patient: PatientProtoFromPatientSQL(&caremanagerdb.Patient{}, PatientProtoFromPatientSQLParams{
					medicalDecisionMaker: medicalDecisionMaker,
					insurance:            insurance,
					pharmacy:             pharmacy,
					externalDoctor:       externalDoctor,
					externalReferrer:     externalReferrer,
				}),
				Market:   &caremanagerpb.Market{},
				IsWaiver: true,
			},
		},
		{
			name: "works with all optional fields set",
			input: &caremanagerdb.Episode{
				ID:                 1,
				PatientSummary:     "Summary",
				AdmittedAt:         admittedAtTime,
				CareDay:            sql.NullInt64{Int64: 0, Valid: true},
				Source:             sql.NullString{String: "Source", Valid: true},
				PrimaryDiagnosis:   sql.NullString{String: "Primary Diagnosis", Valid: true},
				Payer:              sql.NullString{String: "Payer", Valid: true},
				DoctorsPrimaryCare: sql.NullString{String: "DoctorsPrimaryCare", Valid: true},
				DischargedAt:       sql.NullTime{Time: dischargedAtTime, Valid: true},
				ServiceLineID:      1,
				CreatedAt:          episodeCreatedAt,
				UpdatedAt:          episodeUpdatedAt,
				IsWaiver:           false,
			},

			want: &caremanagerpb.Episode{
				Id:                 1,
				PatientSummary:     "Summary",
				AdmittedAt:         admittedAt,
				CareDay:            proto.Int64(0),
				Source:             proto.String("Source"),
				PrimaryDiagnosis:   proto.String("Primary Diagnosis"),
				Payer:              proto.String("Payer"),
				DoctorsPrimaryCare: proto.String("DoctorsPrimaryCare"),
				ServiceLineId:      1,
				DischargedAt:       &dischargedAt,
				CreatedAt:          proto.String(episodeCreatedAt.Format(timestampLayout)),
				UpdatedAt:          proto.String(episodeUpdatedAt.Format(timestampLayout)),
				CarePhase:          &caremanagerpb.CarePhase{PhaseType: legacyCarePhaseTypeInactive},
				Patient: PatientProtoFromPatientSQL(&caremanagerdb.Patient{}, PatientProtoFromPatientSQLParams{
					medicalDecisionMaker: medicalDecisionMaker,
					insurance:            insurance,
					pharmacy:             pharmacy,
					externalDoctor:       externalDoctor,
					externalReferrer:     externalReferrer,
				}),
				Market:   &caremanagerpb.Market{},
				IsWaiver: false,
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := EpisodeProtoFromEpisodeSQL(testCase.input, EpisodeProtoFromEpisodeSQLParams{
				patient:       &caremanagerdb.Patient{},
				carePhases:    []*caremanagerdb.CarePhase{{}},
				market:        &caremanagerpb.Market{},
				tasks:         []*caremanagerdb.Task{},
				taskTypes:     []*caremanagerdb.TaskType{},
				notes:         []*caremanagerdb.Note{},
				taskTemplates: []*caremanagerdb.GetTaskTemplatesByIDRow{},
				medicalDecisionMakers: []*caremanagerdb.MedicalDecisionMaker{
					medicalDecisionMaker,
				},
				insurances: []*caremanagerdb.Insurance{
					insurance,
				},
				pharmacies: []*caremanagerdb.Pharmacy{
					pharmacy,
				},
				externalDoctor:   externalDoctor,
				externalReferrer: externalReferrer,
			})

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestCreateTaskTemplateParamsFromCreateTaskTemplateProtoRequest(t *testing.T) {
	mockName := "MyTaskTemplate"
	mockSummary := "MySummary"
	var mockServiceLineID int64 = 1
	var mockCarePhaseID int64 = 2
	var mockUserID int64 = 777

	testCases := []struct {
		name   string
		input  *caremanagerpb.CreateTaskTemplateRequest
		userID int64

		want       *caremanagerdb.CreateTaskTemplateParams
		wantErrMsg string
	}{
		{
			name: "works",
			input: &caremanagerpb.CreateTaskTemplateRequest{
				Name:          mockName,
				Summary:       mockSummary,
				ServiceLineId: mockServiceLineID,
				CarePhaseId:   &mockCarePhaseID,
			},
			userID: mockUserID,

			want: &caremanagerdb.CreateTaskTemplateParams{
				Name: mockName,
				Summary: sql.NullString{
					Valid:  true,
					String: mockSummary,
				},
				ServiceLineID: mockServiceLineID,
				CarePhaseID: sql.NullInt64{
					Valid: true,
					Int64: mockCarePhaseID,
				},
				CreatedByUserID: mockUserID,
			},
		},
		{
			name: "fails: missing ServiceLineID",
			input: &caremanagerpb.CreateTaskTemplateRequest{
				Name:    mockName,
				Summary: mockSummary,
			},
			userID: mockUserID,

			wantErrMsg: "rpc error: code = InvalidArgument desc = task_template.service_line_id cannot be empty",
		},
		{
			name: "fails: missing UserID",
			input: &caremanagerpb.CreateTaskTemplateRequest{
				Name:          mockName,
				Summary:       mockSummary,
				ServiceLineId: mockServiceLineID,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = user_id cannot be empty",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := CreateTaskTemplateParamsFromCreateTaskTemplateProtoRequest(testCase.input, testCase.userID)

			if testCase.wantErrMsg == "" {
				if err != nil {
					t.Fatalf("Unexpected error: %s", err.Error())
				} else {
					testutils.MustMatch(t, testCase.want, output, "Unexpected conversion result")
				}
			}
			if testCase.wantErrMsg != "" {
				if err != nil {
					testutils.MustMatch(t, testCase.wantErrMsg, err.Error(), "Unexpected error message")
				} else {
					t.Fatal("No error thrown, expected: ", testCase.wantErrMsg)
				}
			}
		})
	}
}

func TestCreateTemplateTaskParamsFromCreateTemplateTaskProto(t *testing.T) {
	mockBody := "MyTaskBody"
	mockTaskTypeID := 1
	mockTemplateID := 2

	testCases := []struct {
		name       string
		input      *caremanagerpb.CreateTemplateTask
		templateID int64

		want *caremanagerdb.CreateTemplateTaskParams
	}{
		{
			name: "works",
			input: &caremanagerpb.CreateTemplateTask{
				Body:       mockBody,
				TaskTypeId: int64(mockTaskTypeID),
			},
			templateID: int64(mockTemplateID),

			want: &caremanagerdb.CreateTemplateTaskParams{
				Body:       mockBody,
				TemplateID: int64(mockTemplateID),
				TypeID:     int64(mockTaskTypeID),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := CreateTemplateTaskParamsFromCreateTemplateTaskProto(testCase.input, testCase.templateID)

			testutils.MustMatch(t, testCase.want, output, "conversion failed")
		})
	}
}

func TestCreateTemplateTasksParamsFromCreateTemplateTasksProto(t *testing.T) {
	mockBody1 := "Do stuff"
	mockBody2 := "Do other stuff"
	var mockTaskTypeID int64 = 1
	var mockTemplateID int64 = 2
	mockTaskTypesMap := map[int64]*caremanagerdb.TaskType{
		mockTaskTypeID: {ID: mockTaskTypeID, Slug: "mockType"},
	}

	testCases := []struct {
		name       string
		input      []*caremanagerpb.CreateTemplateTask
		templateID int64

		want       *caremanagerdb.CreateTemplateTasksParams
		wantErrMsg string
	}{
		{
			name: "works",
			input: []*caremanagerpb.CreateTemplateTask{
				{
					Body:       mockBody1,
					TaskTypeId: mockTaskTypeID,
				},
				{
					Body:       mockBody2,
					TaskTypeId: mockTaskTypeID,
				},
			},
			templateID: mockTemplateID,

			want: &caremanagerdb.CreateTemplateTasksParams{
				Bodies:      []string{mockBody1, mockBody2},
				TemplateIds: []int64{mockTemplateID, mockTemplateID},
				TypeIds:     []int64{mockTaskTypeID, mockTaskTypeID},
			},
		},
		{
			name:  "fails: missing template_id",
			input: []*caremanagerpb.CreateTemplateTask{},

			wantErrMsg: "rpc error: code = InvalidArgument desc = template_id cannot be empty",
		},
		{
			name:       "fails: missing body",
			input:      []*caremanagerpb.CreateTemplateTask{{TaskTypeId: mockTaskTypeID}},
			templateID: mockTemplateID,

			wantErrMsg: "rpc error: code = InvalidArgument desc = task_template_task.body cannot be empty",
		},
		{
			name: "fails: invalid task_type",
			input: []*caremanagerpb.CreateTemplateTask{
				{
					Body:       mockBody1,
					TaskTypeId: mockTaskTypeID + 1,
				},
			},
			templateID: mockTemplateID,

			wantErrMsg: fmt.Sprintf("task type not found: %d", mockTaskTypeID+1),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := CreateTemplateTasksParamsFromCreateTemplateTasksProto(testCase.input, testCase.templateID, mockTaskTypesMap)
			if testCase.wantErrMsg == "" {
				if err != nil {
					t.Fatalf("conversion failed: %s", err.Error())
				} else {
					testutils.MustMatch(t, testCase.want, output, "unexpected output")
				}
			}
			if testCase.wantErrMsg != "" {
				if err != nil {
					testutils.MustMatch(t, testCase.wantErrMsg, err.Error(), "unexpected error message")
				} else {
					t.Fatalf("no error thrown, expected: %s", testCase.wantErrMsg)
				}
			}
		})
	}
}

func TestUpdatePatientSQLParamsFromPatientProtoRequest(t *testing.T) {
	patientDateOfBirth := "1998-05-20T16:46:31.000Z"
	patientDateOfBirthTime, _ := time.Parse(time.RFC3339, "1998-05-20T16:46:31.000Z")

	testCases := []struct {
		name  string
		input *caremanagerpb.UpdatePatientRequest

		want       *caremanagerdb.UpdatePatientParams
		wantErrMsg string
	}{
		{
			name: "works",
			input: &caremanagerpb.UpdatePatientRequest{
				PatientId:   1,
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "male",
				DateOfBirth: patientDateOfBirth,
			},

			want: &caremanagerdb.UpdatePatientParams{
				ID:          1,
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "male",
				DateOfBirth: patientDateOfBirthTime,
			},
		},
		{
			name: "fails due to missing PatientID",
			input: &caremanagerpb.UpdatePatientRequest{
				FirstName:   "John",
				LastName:    "Doe",
				Sex:         "male",
				DateOfBirth: patientDateOfBirth,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = update_patient_request.id cannot be empty",
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := UpdatePatientSQLParamsFromUpdatePatientProtoRequest(testCase.input)

			if testCase.wantErrMsg == "" && err != nil {
				t.Fatalf("No error thrown, expected: %s", testCase.wantErrMsg)
			} else {
				testutils.MustMatch(t, testCase.want, output, "UpdatePatientProtoFromPatientSQL conversion failed")
			}
		})
	}
}

func TestNoteProtoFromNoteSQL(t *testing.T) {
	now := time.Now()

	testCases := []struct {
		name  string
		input *caremanagerdb.Note

		want *caremanagerpb.Note
	}{
		{
			name: "works",
			input: &caremanagerdb.Note{
				ID:                  1,
				Body:                "Bring a towel",
				Kind:                1,
				EpisodeID:           sqltypes.ToValidNullInt64(2),
				Pinned:              false,
				CreatedByUserID:     sql.NullInt64{Valid: true, Int64: 1},
				LastUpdatedByUserID: sql.NullInt64{Valid: true, Int64: 2},
				CreatedAt:           now,
				UpdatedAt:           now,
			},

			want: &caremanagerpb.Note{
				Id:              1,
				Details:         "Bring a towel",
				NoteKind:        "daily_update",
				NoteableId:      2,
				EpisodeId:       2,
				Pinned:          proto.Bool(false),
				CreatedByUserId: proto.Int64(1),
				UpdatedByUserId: proto.Int64(2),
				CreatedAt:       proto.String(now.Format(timestampLayout)),
				UpdatedAt:       proto.String(now.Format(timestampLayout)),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := NoteProtoFromNoteSQL(testCase.input)
			testutils.MustMatch(t, testCase.want, output, "NoteProtoFromNoteSQL conversion failed")
		})
	}
}

func TestVisitNoteProtoFromStationNote(t *testing.T) {
	now := time.Now()
	nowString := proto.String(now.Format(timestampLayout))

	testCases := []struct {
		name  string
		input *StationNote

		want *caremanagerpb.Note
	}{
		{
			name: "works with full content",
			input: &StationNote{
				ID:              1,
				Details:         "some note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
				Pinned:          true,
			},

			want: &caremanagerpb.Note{
				Id:              1,
				Details:         "some note",
				NoteKind:        "regular",
				CreatedByUserId: proto.Int64(1),
				CreatedAt:       nowString,
				UpdatedAt:       nowString,
				Pinned:          proto.Bool(true),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := VisitNoteProtoFromStationNote(testCase.input)
			testutils.MustMatch(t, testCase.want, output, "NoteProtoFromStationNote conversion failed")
		})
	}
}

func TestCarePhaseProtoFromCarePhaseSQL(t *testing.T) {
	testCases := []struct {
		name  string
		input *caremanagerdb.CarePhase

		want *caremanagerpb.CarePhase
	}{
		{
			name: "works",
			input: &caremanagerdb.CarePhase{
				ID:       1,
				Name:     "Discharged",
				IsActive: true,
			},

			want: &caremanagerpb.CarePhase{
				Id:        1,
				Name:      "Discharged",
				PhaseType: "active",
			},
		},
		{
			name: "works for inactive phases",
			input: &caremanagerdb.CarePhase{
				ID:       1,
				Name:     "Discharged",
				IsActive: false,
			},

			want: &caremanagerpb.CarePhase{
				Id:        1,
				Name:      "Discharged",
				PhaseType: "inactive",
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := CarePhaseProtoFromCarePhaseSQL(testCase.input)

			testutils.MustMatch(t, testCase.want, output, "CarePhaseProtoFromCarePhaseSQL conversion failed")
		})
	}
}

func TestServiceLineProtoFromServiceLineSQL(t *testing.T) {
	testCases := []struct {
		name  string
		input *caremanagerdb.ServiceLine

		want *caremanagerpb.ServiceLine
	}{
		{
			name: "works",
			input: &caremanagerdb.ServiceLine{
				ID:        1,
				Name:      "Advanced Care",
				ShortName: sql.NullString{String: "Adv"},
			},

			want: &caremanagerpb.ServiceLine{
				Id:        1,
				Name:      "Advanced Care",
				ShortName: "Adv",
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := ServiceLineProtoFromServiceLineSQL(testCase.input)

			testutils.MustMatch(t, testCase.want, output, "ServiceLineProtoFromServiceLineSQL conversion failed")
		})
	}
}

func TestTaskTypeProtoFromTaskTypeSQL(t *testing.T) {
	testCases := []struct {
		name  string
		input *caremanagerdb.TaskType

		want *caremanagerpb.TaskType
	}{
		{
			name: "works",
			input: &caremanagerdb.TaskType{
				Slug: "nurse",
			},

			want: &caremanagerpb.TaskType{
				Slug: "nurse",
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := TaskTypeProtoFromTaskTypeSQL(testCase.input)

			testutils.MustMatch(t, testCase.want, output, "TaskTypeProtoFromTaskTypeSQL conversion failed")
		})
	}
}

func TestTaskTemplateProtoFromGetTaskTemplateSQLRow(t *testing.T) {
	testTaskTemplateID := time.Now().UnixNano()
	taskTemplateCreatedAt := time.Now()
	taskTemplateUpdatedAt := time.Now()

	serviceLine := caremanagerdb.ServiceLine{}
	carePhase := caremanagerdb.CarePhase{}

	testCases := []struct {
		name        string
		templateRow *caremanagerdb.GetTaskTemplatesRow
		serviceLine *caremanagerdb.ServiceLine
		carePhase   *caremanagerdb.CarePhase

		want *caremanagerpb.TaskTemplate
	}{
		{
			name: "works",
			templateRow: &caremanagerdb.GetTaskTemplatesRow{
				ID:            testTaskTemplateID,
				Name:          "Test Template",
				Summary:       sql.NullString{Valid: true, String: "Summary"},
				ServiceLineID: 1,
				CreatedAt:     taskTemplateCreatedAt,
				UpdatedAt:     taskTemplateUpdatedAt,
				TasksCount:    3,
			},
			serviceLine: &serviceLine,
			carePhase:   &carePhase,

			want: &caremanagerpb.TaskTemplate{
				Id:            testTaskTemplateID,
				Name:          "Test Template",
				Summary:       proto.String("Summary"),
				ServiceLineId: 1,
				CreatedAt:     taskTemplateCreatedAt.Format(timestampLayout),
				UpdatedAt:     taskTemplateUpdatedAt.Format(timestampLayout),
				CarePhase:     CarePhaseProtoFromCarePhaseSQL(&carePhase),
				TasksCount:    3,
			},
		},
		{
			name: "works with no tasks and nil care phase and user",
			templateRow: &caremanagerdb.GetTaskTemplatesRow{
				ID:            testTaskTemplateID,
				Name:          "Test Template",
				Summary:       sql.NullString{Valid: true, String: "Summary"},
				ServiceLineID: 1,
				CreatedAt:     taskTemplateCreatedAt,
				UpdatedAt:     taskTemplateUpdatedAt,
			},
			serviceLine: &serviceLine,

			want: &caremanagerpb.TaskTemplate{
				Id:            testTaskTemplateID,
				Name:          "Test Template",
				Summary:       proto.String("Summary"),
				ServiceLineId: 1,
				CreatedAt:     taskTemplateCreatedAt.Format(timestampLayout),
				UpdatedAt:     taskTemplateUpdatedAt.Format(timestampLayout),
				CarePhase:     nil,
				TasksCount:    0,
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := TaskTemplateProtoFromGetTaskTemplateSQLRow(
				testCase.templateRow,
				testCase.carePhase,
			)

			testutils.MustMatch(t, testCase.want, output, "TaskTemplateProtoFromGetTaskTemplateSQLRow conversion failed")
		})
	}
}

func TestTaskTemplateProtoFromGetTaskTemplatesFromEpisodeSQLRow(t *testing.T) {
	testTaskTemplateID := time.Now().UnixNano()
	taskTemplateCreatedAt := time.Now()
	taskTemplateUpdatedAt := time.Now()

	carePhase := caremanagerdb.CarePhase{}

	testCases := []struct {
		name        string
		templateRow *caremanagerdb.GetTaskTemplatesByIDRow
		carePhase   *caremanagerdb.CarePhase

		want *caremanagerpb.TaskTemplate
	}{
		{
			name: "works",
			templateRow: &caremanagerdb.GetTaskTemplatesByIDRow{
				ID:         testTaskTemplateID,
				Name:       "Test Template",
				Summary:    sql.NullString{Valid: true, String: "Summary"},
				CreatedAt:  taskTemplateCreatedAt,
				UpdatedAt:  taskTemplateUpdatedAt,
				TasksCount: 3,
			},
			carePhase: &carePhase,

			want: &caremanagerpb.TaskTemplate{
				Id:         testTaskTemplateID,
				Name:       "Test Template",
				Summary:    proto.String("Summary"),
				CreatedAt:  taskTemplateCreatedAt.Format(timestampLayout),
				UpdatedAt:  taskTemplateUpdatedAt.Format(timestampLayout),
				CarePhase:  CarePhaseProtoFromCarePhaseSQL(&carePhase),
				TasksCount: 3,
			},
		},
		{
			name: "works with no tasks and nil care phase and user",
			templateRow: &caremanagerdb.GetTaskTemplatesByIDRow{
				ID:        testTaskTemplateID,
				Name:      "Test Template",
				Summary:   sql.NullString{Valid: true, String: "Summary"},
				CreatedAt: taskTemplateCreatedAt,
				UpdatedAt: taskTemplateUpdatedAt,
			},

			want: &caremanagerpb.TaskTemplate{
				Id:            testTaskTemplateID,
				Name:          "Test Template",
				Summary:       proto.String("Summary"),
				CreatedAt:     taskTemplateCreatedAt.Format(timestampLayout),
				UpdatedAt:     taskTemplateUpdatedAt.Format(timestampLayout),
				CarePhase:     nil,
				TasksCount:    0,
				LastUpdatedBy: nil,
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := TaskTemplateProtoFromGetTaskTemplatesFromEpisodeSQLRow(
				testCase.templateRow,
				testCase.carePhase,
			)

			testutils.MustMatch(t, testCase.want, output, "TaskTemplateProtoFromGetTaskTemplatesFromEpisodeSQLRow conversion failed")
		})
	}
}

func TestUpdateTaskSQLParamsFromUpdateTaskProtoRequest(t *testing.T) {
	testCases := []struct {
		name              string
		input             *caremanagerpb.UpdateTaskRequest
		taskType          *caremanagerdb.TaskType
		completedByUserID *int64

		want       *caremanagerdb.UpdateTaskParams
		wantErrMsg string
	}{
		{
			name: "works",
			input: &caremanagerpb.UpdateTaskRequest{
				TaskId:   1,
				TaskType: "nurse",
				Task:     "Test Task",
				Status:   legacyTaskStatusPending,
			},
			taskType: &caremanagerdb.TaskType{
				Slug: "nurse",
				ID:   4,
			},
			completedByUserID: proto.Int64(1),

			want: &caremanagerdb.UpdateTaskParams{
				ID:                1,
				Description:       "Test Task",
				IsCompleted:       false,
				TaskTypeID:        4,
				CompletedByUserID: sql.NullInt64{Int64: 1, Valid: true},
			},
		},
		{
			name: "fails: no task description",
			input: &caremanagerpb.UpdateTaskRequest{
				TaskId:   1,
				TaskType: "nurse",
				Task:     "",
				Status:   legacyTaskStatusPending,
			},
			taskType: &caremanagerdb.TaskType{
				Slug: "nurse",
				ID:   4,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = task description cannot be empty",
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := UpdateTaskSQLParamsFromUpdateTaskProtoRequest(testCase.input, testCase.taskType, testCase.completedByUserID)
			if err != nil {
				if testCase.wantErrMsg != "" {
					testutils.MustMatch(t, testCase.wantErrMsg, err.Error(), "UpdateTaskSQLParamsFromUpdateTaskProtoRequest failed")
				} else {
					t.Fatal("UpdateTaskSQLParamsFromUpdateTaskProtoRequest returned an unexpected error: ", err.Error())
				}
			} else {
				testutils.MustMatch(t, testCase.want, output, "UpdateTaskSQLParamsFromUpdateTaskProtoRequest conversion failed")
			}
		})
	}
}

func TestValidateTaskProtoRequest(t *testing.T) {
	testCases := []struct {
		name        string
		description string

		want       error
		wantErrMsg string
	}{
		{
			name:        "works",
			description: "Test Task",

			want: nil,
		},
		{
			name:        "works",
			description: "",

			wantErrMsg: "rpc error: code = InvalidArgument desc = task description cannot be empty",
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			err := validateTaskProtoRequest(testCase.description)

			if err != nil {
				if testCase.wantErrMsg != "" {
					testutils.MustMatch(t, testCase.wantErrMsg, err.Error(), "validateTaskProtoRequest failed")
				} else {
					t.Fatal("validateTaskProtoRequest returned an unexpected error: ", err.Error())
				}
			} else {
				testutils.MustMatch(t, testCase.want, err, "validateTaskProtoRequest conversion failed")
			}
		})
	}
}

func TestGetActivePatientSQLParamsFromGetPatientsProtoRequest(t *testing.T) {
	page := int64(5)
	pageSize := int64(10)

	errPage := int64(0)
	errPageSize := int64(0)

	testCases := []struct {
		name  string
		input *caremanagerpb.GetActivePatientsRequest

		want       *caremanagerdb.GetActivePatientsParams
		wantErrMsg string
	}{
		{
			name: "works",
			input: &caremanagerpb.GetActivePatientsRequest{
				Page:      &page,
				PageSize:  &pageSize,
				AthenaIds: []string{"1", "2", "3"},
			},

			want: &caremanagerdb.GetActivePatientsParams{
				PageOffset: 40,
				PageSize:   pageSize,
				AthenaIds:  []string{"1", "2", "3"},
			},
		},
		{
			name: "it should throw error when page is zero",
			input: &caremanagerpb.GetActivePatientsRequest{
				Page:      &errPage,
				PageSize:  &pageSize,
				AthenaIds: []string{"1", "2", "3"},
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = page should be greater than zero",
		},
		{
			name: "it should throw error when page size is zero",
			input: &caremanagerpb.GetActivePatientsRequest{
				Page:      &page,
				PageSize:  &errPageSize,
				AthenaIds: []string{"1", "2", "3"},
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = page size should be greater than zero",
		},
		{
			name: "when page in request is not included, it should return default page offset in response",
			input: &caremanagerpb.GetActivePatientsRequest{
				Page:      nil,
				PageSize:  &pageSize,
				AthenaIds: []string{"1", "2", "3"},
			},

			want: &caremanagerdb.GetActivePatientsParams{
				PageOffset: defaultOffset,
				PageSize:   pageSize,
				AthenaIds:  []string{"1", "2", "3"},
			},
		},
		{
			name: "when page size in request is not included, it should return default page size in response",
			input: &caremanagerpb.GetActivePatientsRequest{
				Page:      &page,
				PageSize:  nil,
				AthenaIds: []string{"1", "2", "3"},
			},

			want: &caremanagerdb.GetActivePatientsParams{
				PageOffset: 20,
				PageSize:   defaultPageSize,
				AthenaIds:  []string{"1", "2", "3"},
			},
		},
		{
			name: "when both page size and page in the request are nil, it should return return default values in the response",
			input: &caremanagerpb.GetActivePatientsRequest{
				Page:      nil,
				PageSize:  nil,
				AthenaIds: []string{"1", "2", "3"},
			},

			want: &caremanagerdb.GetActivePatientsParams{
				PageOffset: defaultOffset,
				PageSize:   defaultPageSize,
				AthenaIds:  []string{"1", "2", "3"},
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			params, err := GetActivePatientSQLParamsFromGetPatientsProtoRequest(testCase.input)

			if err != nil {
				testutils.MustMatch(t, testCase.wantErrMsg, err.Error(), "ActivePatientSQLParamsFromGetPatientsProtoRequest returned error didn't match expected error message.")
				return
			}
			testutils.MustMatch(t, testCase.want, params, "ActivePatientSQLParamsFromGetPatientsProtoRequest conversion failed")
		})
	}
}

func TestPatientProtoFromGetActivePatientSQLRow(t *testing.T) {
	patientDateOfBirth := "1990-01-01"
	patientDateOfBirthTime, _ := time.Parse(dateLayout, "1990-01-01")
	patientCreatedAt := time.Now()
	patientUpdatedAt := time.Now()
	athenaID := "1"

	testCases := []struct {
		name  string
		input *caremanagerdb.GetActivePatientsRow

		want *caremanagerpb.Patient
	}{
		{
			name: "works",
			input: &caremanagerdb.GetActivePatientsRow{
				FirstName:                 "Donald",
				LastName:                  "Knuth",
				Sex:                       "male",
				DateOfBirth:               patientDateOfBirthTime,
				CreatedAt:                 patientCreatedAt,
				UpdatedAt:                 patientUpdatedAt,
				AthenaMedicalRecordNumber: sql.NullString{String: athenaID, Valid: true},
			},

			want: &caremanagerpb.Patient{
				FirstName:                 "Donald",
				LastName:                  "Knuth",
				Sex:                       "male",
				PhoneNumber:               proto.String(""),
				DateOfBirth:               patientDateOfBirth,
				CreatedAt:                 proto.String(patientCreatedAt.Format(timestampLayout)),
				UpdatedAt:                 proto.String(patientUpdatedAt.Format(timestampLayout)),
				AthenaMedicalRecordNumber: &athenaID,
				AddressStreet:             proto.String(""),
				AddressCity:               proto.String(""),
				AddressState:              proto.String(""),
				AddressZipcode:            proto.String(""),
				AthenaId:                  &athenaID,
			},
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := PatientProtoFromGetActivePatientSQLRow(testCase.input, PatientProtoFromGetActivePatientSQLRowParams{})

			testutils.MustMatch(t, testCase.want, output, "PatientProtoFromGetActivePatientSQLRow conversion failed")
		})
	}
}

func TestVisitProtoFromVisitRow(t *testing.T) {
	availabilityStart := time.Now()
	availabilityEnd := time.Now().Add(100 * time.Minute)
	availabilityStartFormatted := availabilityStart.Format(timestampLayout)
	availabilityEndFormatted := availabilityEnd.Format(timestampLayout)
	addressID := int64(1)
	carName := "car_name"
	userID := int64(1)
	visitStatus := "complete"
	visitCreatedAt := time.Now()
	visitUpdatedAt := time.Now()
	visitType := &caremanagerdb.VisitType{
		ID:   int64(3),
		Name: "visit_type",
	}
	careRequestID := time.Now().UnixNano()

	testCases := []struct {
		name  string
		input *caremanagerdb.Visit

		want *caremanagerpb.Visit
	}{
		{
			name: "works",
			input: &caremanagerdb.Visit{
				ID:                       1,
				EpisodeID:                1,
				CreatedAt:                visitCreatedAt,
				UpdatedAt:                visitUpdatedAt,
				Status:                   sql.NullString{String: visitStatus, Valid: true},
				CarName:                  sql.NullString{String: carName, Valid: true},
				ProviderUserIds:          []int64{1, 2, 3},
				CreatedByUserID:          sql.NullInt64{Int64: 1, Valid: true},
				UpdatedByUserID:          sql.NullInt64{Int64: 1, Valid: true},
				AddressID:                sql.NullInt64{Int64: 1, Valid: true},
				PatientAvailabilityStart: sql.NullTime{Time: availabilityStart, Valid: true},
				PatientAvailabilityEnd:   sql.NullTime{Time: availabilityEnd, Valid: true},
				CareRequestID:            sql.NullInt64{Int64: careRequestID, Valid: true},
				VisitTypeID:              sql.NullInt64{Int64: 3, Valid: true},
				CarID:                    sql.NullInt64{Int64: 1, Valid: true},
				VirtualAppID:             sql.NullInt64{Int64: 1, Valid: true},
			},

			want: &caremanagerpb.Visit{
				Id:                       1,
				EpisodeId:                1,
				CarName:                  &carName,
				ProviderUserIds:          []int64{1, 2, 3},
				CreatedByUserId:          &userID,
				UpdatedByUserId:          &userID,
				AddressId:                &addressID,
				PatientAvailabilityStart: &availabilityStartFormatted,
				PatientAvailabilityEnd:   &availabilityEndFormatted,
				CreatedAt:                visitCreatedAt.Format(timestampLayout),
				UpdatedAt:                visitUpdatedAt.Format(timestampLayout),
				Status:                   &visitStatus,
				StatusGroup:              caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
				TypeId:                   &visitType.ID,
				CareRequestId:            &careRequestID,
				CarId:                    proto.Int64(1),
				VirtualAppId:             proto.Int64(1),
			},
		},
	}
	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := VisitProtoFromVisitSQL(testCase.input)

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}
func TestVisitListElementFromEpisodeVisitsSQLRow(t *testing.T) {
	now := time.Now()
	careRequestID := time.Now().UnixNano()
	etaTimestamp := now.Unix() + 1000
	formattedETA := time.Unix(etaTimestamp, 0).UTC().Format(timestampLayout)

	tocTimestamp := now.Unix() + 10000

	startDate := "2023-01-02T00:04:05.999Z"
	endDate := "2023-01-02T15:04:05.999Z"

	statusAccepted := "accepted"
	statusRequested := "requested"
	statusArchived := "archived"

	statusUpdatedAt := "2023-01-01T23:00:05.999Z"

	tcs := []struct {
		name           string
		input          *caremanagerdb.GetEpisodeVisitsRow
		inputSchedules map[int64]*CareRequestSchedule

		want *caremanagerpb.VisitListElement
	}{
		{
			name: "works",
			input: &caremanagerdb.GetEpisodeVisitsRow{
				ID:              1,
				EpisodeID:       1,
				Status:          sqltypes.ToNullString(proto.String("committed")),
				Type:            sqltypes.ToNullString(proto.String("acute")),
				TypeID:          sqltypes.ToNullInt64(proto.Int64(3)),
				Summary:         sqltypes.ToNullString(proto.String("some summary")),
				CarName:         sqltypes.ToNullString(proto.String("some car")),
				CreatedByUserID: sqltypes.ToNullInt64(proto.Int64(5)),
				ProviderUserIds: []int64{1, 2, 3},
				CreatedAt:       now,
				UpdatedAt:       now,
				CareRequestID: sql.NullInt64{
					Valid: true,
					Int64: careRequestID,
				},
				PatientAvailabilityStart: sqltypes.StringToNullTime(&startDate),
				PatientAvailabilityEnd:   sqltypes.StringToNullTime(&endDate),
				StatusUpdatedAt:          sqltypes.StringToNullTime(&statusUpdatedAt),
			},

			want: &caremanagerpb.VisitListElement{
				Id:              1,
				EpisodeId:       1,
				StatusGroup:     caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_ACTIVE,
				Status:          proto.String("committed"),
				Type:            proto.String("acute"),
				TypeId:          proto.Int64(3),
				CreatedByUserId: proto.Int64(5),
				Summary:         proto.String("some summary"),
				CarName:         proto.String("some car"),
				ProviderUserIds: []int64{1, 2, 3},
				CreatedAt:       now.Format(timestampLayout),
				UpdatedAt:       now.Format(timestampLayout),
				CareRequestId:   proto.Int64(careRequestID),
				StatusUpdatedAt: &statusUpdatedAt,
			},
		},
		{
			name: "works with nullable fields",
			input: &caremanagerdb.GetEpisodeVisitsRow{
				ID:        1,
				EpisodeID: 1,
				CreatedAt: now,
				UpdatedAt: now,
			},

			want: &caremanagerpb.VisitListElement{
				Id:          1,
				EpisodeId:   1,
				StatusGroup: caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
				CreatedAt:   now.Format(timestampLayout),
				UpdatedAt:   now.Format(timestampLayout),
			},
		},
		{
			name: "is_scheduling_in_progress is true if visit is station-origined, not archived but patient_availability_start is missing",
			input: &caremanagerdb.GetEpisodeVisitsRow{
				ID:                     1,
				EpisodeID:              1,
				CreatedAt:              now,
				UpdatedAt:              now,
				CareRequestID:          sqltypes.ToNullInt64(&careRequestID),
				PatientAvailabilityEnd: sqltypes.StringToNullTime(&startDate),
				Status:                 sqltypes.ToNullString(&statusAccepted),
			},

			want: &caremanagerpb.VisitListElement{
				Id:                    1,
				EpisodeId:             1,
				StatusGroup:           caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_UPCOMING,
				CreatedAt:             now.Format(timestampLayout),
				UpdatedAt:             now.Format(timestampLayout),
				IsSchedulingInProcess: true,
				CareRequestId:         &careRequestID,
				Status:                &statusAccepted,
			},
		},
		{
			name: "is_scheduling_in_progress is true if visit is station-origined, not archived but patient_availability_end is missing",
			input: &caremanagerdb.GetEpisodeVisitsRow{
				ID:                       1,
				EpisodeID:                1,
				CreatedAt:                now,
				UpdatedAt:                now,
				CareRequestID:            sqltypes.ToNullInt64(&careRequestID),
				PatientAvailabilityStart: sqltypes.StringToNullTime(&startDate),
				Status:                   sqltypes.ToNullString(&statusAccepted),
			},

			want: &caremanagerpb.VisitListElement{
				Id:                    1,
				EpisodeId:             1,
				CreatedAt:             now.Format(timestampLayout),
				UpdatedAt:             now.Format(timestampLayout),
				IsSchedulingInProcess: true,
				CareRequestId:         &careRequestID,
				Status:                &statusAccepted,
				StatusGroup:           caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_UPCOMING,
			},
		},
		{
			name: "is_scheduling_in_progress is true if visit is station-origined, not archived but both patient_availability are missing",
			input: &caremanagerdb.GetEpisodeVisitsRow{
				ID:            1,
				EpisodeID:     1,
				CreatedAt:     now,
				UpdatedAt:     now,
				CareRequestID: sqltypes.ToNullInt64(&careRequestID),
				Status:        sqltypes.ToNullString(&statusRequested),
			},

			want: &caremanagerpb.VisitListElement{
				Id:                    1,
				EpisodeId:             1,
				StatusGroup:           caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_UPCOMING,
				CreatedAt:             now.Format(timestampLayout),
				UpdatedAt:             now.Format(timestampLayout),
				IsSchedulingInProcess: true,
				CareRequestId:         &careRequestID,
				Status:                &statusRequested,
			},
		},
		{
			name: "is_scheduling_in_progress is false if visit is not station-origined",
			input: &caremanagerdb.GetEpisodeVisitsRow{
				ID:        1,
				EpisodeID: 1,
				CreatedAt: now,
				UpdatedAt: now,
			},

			want: &caremanagerpb.VisitListElement{
				Id:                    1,
				EpisodeId:             1,
				StatusGroup:           caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
				CreatedAt:             now.Format(timestampLayout),
				UpdatedAt:             now.Format(timestampLayout),
				IsSchedulingInProcess: false,
			},
		},
		{
			name: "is_scheduling_in_progress is false if visit is station-origined, but status is archived",
			input: &caremanagerdb.GetEpisodeVisitsRow{
				ID:            1,
				EpisodeID:     1,
				CreatedAt:     now,
				UpdatedAt:     now,
				CareRequestID: sqltypes.ToNullInt64(&careRequestID),
				Status:        sqltypes.ToNullString(&statusArchived),
			},

			want: &caremanagerpb.VisitListElement{
				Id:                    1,
				EpisodeId:             1,
				StatusGroup:           caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
				CreatedAt:             now.Format(timestampLayout),
				UpdatedAt:             now.Format(timestampLayout),
				IsSchedulingInProcess: false,
				Status:                &statusArchived,
				CareRequestId:         &careRequestID,
			},
		},
		{
			name: "returns ETA when it is included in map",
			input: &caremanagerdb.GetEpisodeVisitsRow{
				ID:            1,
				EpisodeID:     1,
				CreatedAt:     now,
				UpdatedAt:     now,
				CareRequestID: sqltypes.ToNullInt64(&careRequestID),
				Status:        sqltypes.ToNullString(&statusArchived),
			},
			inputSchedules: map[int64]*CareRequestSchedule{
				careRequestID: {
					CareRequestID:               careRequestID,
					EstimatedTimeOfCompletition: &tocTimestamp,
					EstimatedTimeOfArrival:      &etaTimestamp,
					Date: &commonpb.Date{
						Year:  1912,
						Month: 06,
						Day:   23,
					},
					Status:      logisticspb.ShiftTeamVisit_STATUS_UNCOMMITTED.Enum(),
					ShiftTeamID: 2,
				},
			},

			want: &caremanagerpb.VisitListElement{
				Id:                    1,
				EpisodeId:             1,
				StatusGroup:           caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
				CreatedAt:             now.Format(timestampLayout),
				UpdatedAt:             now.Format(timestampLayout),
				IsSchedulingInProcess: false,
				Status:                &statusArchived,
				CareRequestId:         &careRequestID,
				Eta:                   &formattedETA,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			output := VisitListElementFromEpisodeVisitsSQLRow(tc.input, tc.inputSchedules)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestVisitSummaryProtoFromVisitSummaryRow(t *testing.T) {
	visitID := time.Now().UnixNano()
	summaryCreatedAt := time.Now()
	summaryUpdatedAt := time.Now()
	userID := int64(1)

	testCases := []struct {
		name  string
		input *caremanagerdb.VisitSummary

		want *caremanagerpb.VisitSummary
	}{
		{
			name: "works",
			input: &caremanagerdb.VisitSummary{
				VisitID:         visitID,
				Body:            "summary body",
				CreatedAt:       summaryCreatedAt,
				UpdatedAt:       summaryUpdatedAt,
				CreatedByUserID: sql.NullInt64{Int64: 1, Valid: true},
				UpdatedByUserID: sql.NullInt64{Int64: 1, Valid: true},
			},

			want: &caremanagerpb.VisitSummary{
				VisitId:         visitID,
				Body:            "summary body",
				CreatedAt:       summaryCreatedAt.Format(timestampLayout),
				UpdatedAt:       summaryUpdatedAt.Format(timestampLayout),
				CreatedByUserId: &userID,
				UpdatedByUserId: &userID,
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := VisitSummaryProtoFromVisitSummaryRow(testCase.input)

			testutils.MustMatch(t, testCase.want, output, "expected output doesn't match actual output")
		})
	}
}

func TestVisitStatusGroupFromVisitStatusSQLString(t *testing.T) {
	tcs := []struct {
		name  string
		input sql.NullString

		want caremanagerpb.VisitStatusGroup
	}{
		{
			name:  "returns PAST group for nil status",
			input: sql.NullString{Valid: false},

			want: caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
		},
		{
			name: "returns PAST group for unknown status",
			input: sql.NullString{
				Valid:  true,
				String: "something strange coming from Station",
			},

			want: caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
		},
		{
			name: "returns PAST group",
			input: sql.NullString{
				Valid:  true,
				String: "archived",
			},

			want: caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_PAST,
		},
		{
			name: "returns ACTIVE group",
			input: sql.NullString{
				Valid:  true,
				String: "on_route",
			},

			want: caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_ACTIVE,
		},
		{
			name: "returns UPCOMING group",
			input: sql.NullString{
				Valid:  true,
				String: "scheduled",
			},

			want: caremanagerpb.VisitStatusGroup_VISIT_STATUS_GROUP_UPCOMING,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			output := VisitStatusGroupFromVisitStatusSQLString(tc.input)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestCreateVisitSQLParamsFromCreateCallVisitRequest(t *testing.T) {
	visitTypeID := int64(100)
	userID := int64(15)
	testCases := []struct {
		name        string
		input       *caremanagerpb.CreateCallVisitRequest
		inputUserID int64

		want caremanagerdb.CreateVisitParams
	}{
		{
			name: "works",
			input: &caremanagerpb.CreateCallVisitRequest{
				EpisodeId:   1,
				VisitTypeId: 100,
				Summary:     "summary to convert",
			},
			inputUserID: userID,

			want: caremanagerdb.CreateVisitParams{
				EpisodeID:       1,
				VisitTypeID:     sqltypes.ToNullInt64(&visitTypeID),
				CreatedByUserID: sqltypes.ToNullInt64(&userID),
			},
		},
	}

	for _, testCase := range testCases {
		output := CreateVisitSQLParamsFromCreateCallVisitRequest(testCase.input, testCase.inputUserID)
		testutils.MustMatch(t, testCase.want, output, "expected output doesn't match actual output")
	}
}

func TestProviderTypeProtoFromProviderTypeSQL(t *testing.T) {
	tcs := []struct {
		name  string
		input *caremanagerdb.ProviderType

		want *caremanagerpb.ProviderType
	}{
		{
			name: "should work",
			input: &caremanagerdb.ProviderType{
				ID:   1,
				Name: sql.NullString{String: "Other", Valid: true},
			},

			want: &caremanagerpb.ProviderType{
				Id:   1,
				Name: "Other",
			},
		},
		{
			name: "should work for null name",
			input: &caremanagerdb.ProviderType{
				ID: 1,
			},

			want: &caremanagerpb.ProviderType{
				Id:   1,
				Name: "",
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			output := ProviderTypeProtoFromProviderTypeSQL(tc.input)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestCreateVisitSummarySQLParamsFromCreateVisitRequest(t *testing.T) {
	visitTypeID := int64(100)
	userID := int64(15)

	testCases := []struct {
		name         string
		input        *caremanagerpb.CreateCallVisitRequest
		inputVisitID int64
		inputUserID  int64

		want caremanagerdb.CreateVisitSummaryParams
	}{
		{
			name: "works",
			input: &caremanagerpb.CreateCallVisitRequest{
				Summary: "summary that works",
			},
			inputVisitID: visitTypeID,
			inputUserID:  userID,

			want: caremanagerdb.CreateVisitSummaryParams{
				VisitID:         visitTypeID,
				Body:            "summary that works",
				CreatedByUserID: sqltypes.ToNullInt64(&userID),
			},
		},
	}

	for _, testCase := range testCases {
		output := CreateVisitSummarySQLParamsFromCreateVisitRequest(testCase.input, testCase.inputVisitID, testCase.inputUserID)
		testutils.MustMatch(t, testCase.want, output, "expected output doesn't match actual output")
	}
}

func TestCreateVisitSummarySQLParamsFromCreateVisitSummaryProtoRequest(t *testing.T) {
	visitID := int64(1)
	visitSummaryBody := "test summary body"
	visitSummaryCreatedBy := time.Now().UnixNano()

	type input struct {
		req             *caremanagerpb.CreateVisitSummaryRequest
		createdByUserID int64
	}
	tcs := []struct {
		name  string
		input input

		want *caremanagerdb.CreateVisitSummaryParams
	}{
		{
			name: "works",
			input: input{
				req: &caremanagerpb.CreateVisitSummaryRequest{
					VisitId: visitID,
					Body:    visitSummaryBody,
				},
				createdByUserID: visitSummaryCreatedBy,
			},

			want: &caremanagerdb.CreateVisitSummaryParams{
				VisitID: visitID,
				Body:    visitSummaryBody,
				CreatedByUserID: sql.NullInt64{
					Valid: true,
					Int64: visitSummaryCreatedBy,
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			output := CreateVisitSummarySQLParamsFromCreateVisitSummaryProtoRequest(
				tc.input.req,
				tc.input.createdByUserID,
			)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestUpdateVisitSummarySQLParamsFromUpdateVisitSummaryProtoRequest(t *testing.T) {
	newVisitSummaryBody := "new body"
	updatedByUserID := time.Now().UnixNano()
	visitID := int64(1)

	type input struct {
		req             *caremanagerpb.UpdateVisitSummaryRequest
		updatedByUserID int64
	}
	tcs := []struct {
		name  string
		input input

		want       *caremanagerdb.UpdateVisitSummaryParams
		wantErrMsg string
	}{
		{
			name: "works",
			input: input{
				req: &caremanagerpb.UpdateVisitSummaryRequest{
					Body:    newVisitSummaryBody,
					VisitId: visitID,
				},
				updatedByUserID: updatedByUserID,
			},

			want: &caremanagerdb.UpdateVisitSummaryParams{
				Body: sqltypes.ToNullString(&newVisitSummaryBody),
				UpdatedByUserID: sql.NullInt64{
					Valid: true,
					Int64: updatedByUserID,
				},
				VisitID: visitID,
			},
		},
		{
			name: "fails because the Body is an empty string",
			input: input{
				req: &caremanagerpb.UpdateVisitSummaryRequest{
					Body:    "",
					VisitId: visitID,
				},
				updatedByUserID: updatedByUserID,
			},

			wantErrMsg: "rpc error: code = InvalidArgument desc = new visit summary body cannot be empty",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			output, err := UpdateVisitSummarySQLParamsFromUpdateVisitSummaryProtoRequest(tc.input.req, tc.input.updatedByUserID)

			if err != nil {
				testutils.MustMatch(t, tc.wantErrMsg, err.Error())
			}

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestUpdateVisitStatusAndProvidersSQLParamsFromUpdateVisitStatusProtoRequest(t *testing.T) {
	mockUserID := time.Now().UnixNano()
	var uninitializedSlice []int64

	type args struct {
		req              *caremanagerpb.UpdateVisitStatusRequest
		providerUdserIDs []int64
	}

	testCases := []struct {
		name string
		args args

		want    *caremanagerdb.UpdateVisitStatusAndProvidersParams
		wantErr error
	}{
		{
			name: "should convert to sql params",
			args: args{
				req: &caremanagerpb.UpdateVisitStatusRequest{
					VisitId: 1,
					Status:  caremanagerpb.UpdateVisitStatusRequest_UPDATE_VISIT_STATUS_OPTION_ON_SCENE,
				},
				providerUdserIDs: []int64{1, 2},
			},

			want: &caremanagerdb.UpdateVisitStatusAndProvidersParams{
				ID:              1,
				Status:          sql.NullString{String: "on_scene", Valid: true},
				ProviderUserIds: []int64{1, 2},
				UpdatedByUserID: sqltypes.ToNullInt64(&mockUserID),
			},
		},
		{
			name: "should return nil provider user ids for uninitialized slice",
			args: args{
				req: &caremanagerpb.UpdateVisitStatusRequest{
					VisitId: 1,
					Status:  caremanagerpb.UpdateVisitStatusRequest_UPDATE_VISIT_STATUS_OPTION_ON_SCENE,
				},
				providerUdserIDs: uninitializedSlice,
			},

			want: &caremanagerdb.UpdateVisitStatusAndProvidersParams{
				ID:              1,
				Status:          sql.NullString{String: "on_scene", Valid: true},
				ProviderUserIds: nil,
				UpdatedByUserID: sqltypes.ToNullInt64(&mockUserID),
			},
		},
		{
			name: "should fail when the visit is not set",
			args: args{
				req: &caremanagerpb.UpdateVisitStatusRequest{
					Status: caremanagerpb.UpdateVisitStatusRequest_UPDATE_VISIT_STATUS_OPTION_ON_SCENE,
				},
			},

			wantErr: status.Error(codes.InvalidArgument, "visit id cannot be empty"),
		},
		{
			name: "should fail when the visit is not set",
			args: args{
				req: &caremanagerpb.UpdateVisitStatusRequest{
					VisitId: 1,
				},
			},

			wantErr: status.Error(codes.InvalidArgument, "visit status cannot be empty or unspecified"),
		},
		{
			name: "should fail when the requested status does not exist",
			args: args{
				req: &caremanagerpb.UpdateVisitStatusRequest{
					VisitId: 1,
					Status:  99,
				},
			},

			wantErr: status.Error(codes.InvalidArgument, "visit status 99 does not exist"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			output, err := UpdateVisitStatusAndProvidersSQLParamsFromUpdateVisitStatusProtoRequest(tc.args.req, tc.args.providerUdserIDs, &mockUserID)
			testutils.MustMatch(t, tc.wantErr, err, "expected error does not match")
			testutils.MustMatch(t, tc.want, output, "expected output does not match")
		})
	}
}

func TestVisitTypeFromVisitTypeSQLRow(t *testing.T) {
	testCases := []struct {
		name  string
		input *caremanagerdb.VisitType

		want *caremanagerpb.VisitType
	}{
		{
			name: "should convert from db to pb VisitType",
			input: &caremanagerdb.VisitType{
				ID:         5,
				Name:       "Extended Care",
				IsCallType: true,
			},

			want: &caremanagerpb.VisitType{
				Id:         5,
				Name:       "Extended Care",
				IsCallType: true,
			},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			output := VisitTypeFromVisitTypeSQLRow(tc.input)
			testutils.MustMatch(t, tc.want, output, "expected output does not match")
		})
	}
}

func TestGetVisitByCareRequestIDSQLParamsFromCreateVisitFromStationCRProtoRequest(t *testing.T) {
	careRequestID := time.Now().UnixNano()

	testCases := []struct {
		name  string
		input *caremanagerpb.CreateVisitFromStationCRRequest

		want    int64
		wantErr error
	}{
		{
			name: "works",
			input: &caremanagerpb.CreateVisitFromStationCRRequest{
				CareRequestId: careRequestID,
			},

			want: careRequestID,
		},
		{
			name: "should fail when the id is zero",
			input: &caremanagerpb.CreateVisitFromStationCRRequest{
				CareRequestId: 0,
			},

			wantErr: status.Error(codes.InvalidArgument, "visit.care_request_id cannot be 0"),
		},
	}

	for _, tc := range testCases {
		t.Run(tc.name, func(t *testing.T) {
			output, err := GetVisitByCareRequestIDSQLParamsFromCreateVisitFromStationCRProtoRequest(tc.input)
			testutils.MustMatch(t, tc.wantErr, err, "expected error does not match")
			testutils.MustMatch(t, tc.want, output, "expected output does not match")
		})
	}
}

func TestExternalCareProviderProtoFromExternalCareProviderSQL(t *testing.T) {
	tcs := []struct {
		name  string
		input *caremanagerdb.ExternalCareProvider

		want *caremanagerpb.ExternalCareProvider
	}{
		{
			name: "should work",
			input: &caremanagerdb.ExternalCareProvider{
				ID:             1,
				Name:           "Pedro",
				PhoneNumber:    sql.NullString{String: "123", Valid: true},
				FaxNumber:      sql.NullString{String: "456", Valid: true},
				Address:        sql.NullString{String: "Av. Siempreviva 742", Valid: true},
				ProviderTypeID: 2,
				PatientID:      3,
			},

			want: &caremanagerpb.ExternalCareProvider{
				Id:             1,
				Name:           "Pedro",
				PhoneNumber:    proto.String("123"),
				FaxNumber:      proto.String("456"),
				Address:        proto.String("Av. Siempreviva 742"),
				ProviderTypeId: 2,
				PatientId:      3,
			},
		},
		{
			name: "should work with null fields",
			input: &caremanagerdb.ExternalCareProvider{
				ID:             1,
				Name:           "Pedro",
				ProviderTypeID: 2,
				PatientID:      3,
			},

			want: &caremanagerpb.ExternalCareProvider{
				Id:             1,
				Name:           "Pedro",
				ProviderTypeId: 2,
				PatientId:      3,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			output := ExternalCareProviderProtoFromExternalCareProviderSQL(tc.input)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestInsuranceProtoFromInsuranceSQL(t *testing.T) {
	tcs := []struct {
		name  string
		input *caremanagerdb.Insurance

		want *caremanagerpb.Insurance
	}{
		{
			name: "should work",
			input: &caremanagerdb.Insurance{
				ID:        1,
				Name:      "Pedro",
				MemberID:  sql.NullString{String: "123A", Valid: true},
				PatientID: 3,
			},

			want: &caremanagerpb.Insurance{
				Id:        1,
				Name:      "Pedro",
				MemberId:  proto.String("123A"),
				PatientId: 3,
			},
		},
		{
			name: "should work with null fields",
			input: &caremanagerdb.Insurance{
				ID:        1,
				Name:      "Pedro",
				PatientID: 3,
			},

			want: &caremanagerpb.Insurance{
				Id:        1,
				Name:      "Pedro",
				PatientId: 3,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			output := InsuranceProtoFromInsuranceSQL(tc.input)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestMedicalDecisionMakerProtoFromMedicalDecisionMakerSQL(t *testing.T) {
	tcs := []struct {
		name  string
		input *caremanagerdb.MedicalDecisionMaker

		want *caremanagerpb.MedicalDecisionMaker
	}{
		{
			name: "should work",
			input: &caremanagerdb.MedicalDecisionMaker{
				ID:        1,
				FirstName: "Jane",
				LastName:  "Doe",
				PhoneNumber: sql.NullString{
					String: "123",
					Valid:  true,
				},
				Address: sql.NullString{String: "Av. Siempreviva 742", Valid: true},
				Relationship: sql.NullString{
					String: "Parent",
					Valid:  true,
				},
				PatientID: 3,
			},

			want: &caremanagerpb.MedicalDecisionMaker{
				Id:           1,
				FirstName:    "Jane",
				LastName:     "Doe",
				PhoneNumber:  proto.String("123"),
				Address:      proto.String("Av. Siempreviva 742"),
				Relationship: proto.String("Parent"),
				PatientId:    3,
			},
		},
		{
			name: "should work with null fields",
			input: &caremanagerdb.MedicalDecisionMaker{
				ID:        1,
				FirstName: "Jane",
				LastName:  "Doe",
				PhoneNumber: sql.NullString{
					String: "123",
					Valid:  true,
				},
				Relationship: sql.NullString{
					String: "Parent",
					Valid:  true,
				},
				PatientID: 3,
			},

			want: &caremanagerpb.MedicalDecisionMaker{
				Id:           1,
				FirstName:    "Jane",
				LastName:     "Doe",
				PhoneNumber:  proto.String("123"),
				Relationship: proto.String("Parent"),
				PatientId:    3,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			output := MedicalDecisionMakerProtoFromMedicalDecisionMakerSQL(tc.input)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestPharmacyProtoFromPharmacySQL(t *testing.T) {
	tcs := []struct {
		name  string
		input *caremanagerdb.Pharmacy

		want *caremanagerpb.Pharmacy
	}{
		{
			name: "should work",
			input: &caremanagerdb.Pharmacy{
				ID:          1,
				Name:        "Farmacias Guadalajara",
				PhoneNumber: sql.NullString{String: "123", Valid: true},
				FaxNumber:   sql.NullString{String: "456", Valid: true},
				Address:     sql.NullString{String: "Av. Siempreviva 742", Valid: true},
				PatientID:   3,
			},

			want: &caremanagerpb.Pharmacy{
				Id:          1,
				Name:        "Farmacias Guadalajara",
				PhoneNumber: proto.String("123"),
				FaxNumber:   proto.String("456"),
				Address:     proto.String("Av. Siempreviva 742"),
				PatientId:   3,
			},
		},
		{
			name: "should work with null fields",
			input: &caremanagerdb.Pharmacy{
				ID:        1,
				Name:      "Farmacias Guadalajara",
				PatientID: 3,
			},

			want: &caremanagerpb.Pharmacy{
				Id:        1,
				Name:      "Farmacias Guadalajara",
				PatientId: 3,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			output := PharmacyProtoFromPharmacySQL(tc.input)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestUpdateVisitSQLParamsFromUpdateVisitRequest(t *testing.T) {
	visitTypeID := time.Now().UnixNano()
	userID := time.Now().UnixNano()
	visitID := time.Now().UnixNano()

	testCases := []struct {
		name  string
		input *caremanagerpb.UpdateVisitRequest

		want caremanagerdb.UpdateVisitParams
	}{
		{
			name: "works",
			input: &caremanagerpb.UpdateVisitRequest{
				VisitId:     visitID,
				VisitTypeId: &visitTypeID,
			},

			want: caremanagerdb.UpdateVisitParams{
				ID:              visitID,
				VisitTypeID:     sqltypes.ToValidNullInt64(visitTypeID),
				UpdatedByUserID: sqltypes.ToNullInt64(&userID),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := UpdateVisitSQLParamsFromUpdateVisitRequest(testCase.input, userID)

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestUpdateVisitByCareRequestIDParamsFromUpdateVisitFromStationCRRequest(t *testing.T) {
	now := time.Now()
	nowString := now.Format(timestampLayout)
	tomorrowString := now.Add(24 * time.Hour).Format(timestampLayout)

	tcs := []struct {
		name  string
		input *caremanagerpb.UpdateVisitFromStationCRRequest

		want       *caremanagerdb.UpdateVisitByCareRequestIDParams
		wantErrMsg string
	}{
		{
			name: "should work",
			input: &caremanagerpb.UpdateVisitFromStationCRRequest{
				CareRequestId:            1,
				UpdatedByUserId:          proto.Int64(2),
				Status:                   proto.String("something"),
				StatusUpdatedAt:          proto.String(nowString),
				PatientAvailabilityStart: proto.String(nowString),
				PatientAvailabilityEnd:   proto.String(tomorrowString),
				CarName:                  proto.String("Mustang"),
				ProviderUserIds:          []int64{3, 4, 5},
				AddressId:                proto.Int64(6),
				CarId:                    proto.Int64(7),
				VirtualAppId:             proto.Int64(8),
			},

			want: &caremanagerdb.UpdateVisitByCareRequestIDParams{
				CareRequestID:            1,
				UpdatedByUserID:          sqltypes.ToValidNullInt64(2),
				Status:                   sqltypes.ToValidNullString("something"),
				StatusUpdatedAt:          sqltypes.StringToValidNullTime(nowString),
				PatientAvailabilityStart: sqltypes.StringToValidNullTime(nowString),
				PatientAvailabilityEnd:   sqltypes.StringToValidNullTime(tomorrowString),
				CarName:                  sqltypes.ToValidNullString("Mustang"),
				ProviderUserIds:          []int64{3, 4, 5},
				AddressID:                sqltypes.ToValidNullInt64(6),
				CarID:                    sqltypes.ToValidNullInt64(7),
				VirtualAppID:             sqltypes.ToValidNullInt64(8),
			},
		},
		{
			name: "should work without optional params",
			input: &caremanagerpb.UpdateVisitFromStationCRRequest{
				CareRequestId: 1,
			},

			want: &caremanagerdb.UpdateVisitByCareRequestIDParams{
				CareRequestID: 1,
			},
		},
		{
			name: "should transform empty strings to nil values",
			input: &caremanagerpb.UpdateVisitFromStationCRRequest{
				CareRequestId:            1,
				CarName:                  proto.String(""),
				PatientAvailabilityEnd:   proto.String(""),
				PatientAvailabilityStart: proto.String(""),
			},

			want: &caremanagerdb.UpdateVisitByCareRequestIDParams{
				CareRequestID:            1,
				CarName:                  sql.NullString{Valid: false},
				PatientAvailabilityEnd:   sql.NullTime{Valid: false},
				PatientAvailabilityStart: sql.NullTime{Valid: false},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			params, err := UpdateVisitByCareRequestIDParamsFromUpdateVisitFromStationCRRequest(tc.input)

			if err != nil {
				testutils.MustMatch(t, tc.wantErrMsg, err.Error())
			}

			testutils.MustMatch(t, tc.want, params)
		})
	}
}

func TestGetInsuranceWithHighestPriority(t *testing.T) {
	tcs := []struct {
		name  string
		input []*caremanagerdb.Insurance

		want *caremanagerdb.Insurance
	}{
		{
			name: "works with one Insurance",
			input: []*caremanagerdb.Insurance{
				{
					Name:     "Humana higher priority",
					Priority: int32(1),
				},
			},

			want: &caremanagerdb.Insurance{
				Name:     "Humana higher priority",
				Priority: int32(1),
			},
		},
		{
			name:  "returns nil when Insurances are an empty array",
			input: []*caremanagerdb.Insurance{},

			want: nil,
		},
		{
			name: "returns the Insurance with the highest priority",
			input: []*caremanagerdb.Insurance{
				{
					Name:     "Humana medium priority",
					Priority: int32(2),
				},
				{
					Name:     "Humana higher priority",
					Priority: int32(1),
				},
				{
					Name:     "Humana lower priority",
					Priority: int32(3),
				},
			},

			want: &caremanagerdb.Insurance{
				Name:     "Humana higher priority",
				Priority: int32(1),
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			output := GetInsuranceWithHighestPriority(tc.input)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestCreateInsuranceSQLParamsFromCreateInsuranceRequestProto(t *testing.T) {
	memberID := "member_id"
	testCases := []struct {
		name          string
		request       *caremanagerpb.CreateInsuranceRequest
		inputPriority int32

		expectedOutput caremanagerdb.CreateInsuranceParams
	}{
		{
			name: "works",
			request: &caremanagerpb.CreateInsuranceRequest{
				PatientId: 1,
				Name:      "insurance",
				MemberId:  &memberID,
			},
			inputPriority: 1,
			expectedOutput: caremanagerdb.CreateInsuranceParams{
				PatientID: 1,
				Name:      "insurance",
				MemberID:  sqltypes.ToNullString(&memberID),
				Priority:  1,
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := CreateInsuranceSQLParamsFromCreateInsuranceRequestProto(testCase.request, testCase.inputPriority)

			testutils.MustMatch(t, testCase.expectedOutput, output)
		})
	}
}

func TestUpdateInsuranceSQLParamsFromUpdateInsuranceRequest(t *testing.T) {
	insuranceName := "insurance"
	memberID := "member_id_" + fmt.Sprint(time.Now().Unix())
	insuranceID := time.Now().Unix()

	emptyName := ""
	testCases := []struct {
		name    string
		request *caremanagerpb.UpdateInsuranceRequest

		expectedOutput *caremanagerdb.UpdateInsuranceParams
		expectedError  error
	}{
		{
			name: "works",
			request: &caremanagerpb.UpdateInsuranceRequest{
				Name:        &insuranceName,
				MemberId:    &memberID,
				InsuranceId: insuranceID,
			},
			expectedOutput: &caremanagerdb.UpdateInsuranceParams{
				Name:     sqltypes.ToNullString(&insuranceName),
				MemberID: sqltypes.ToNullString(&memberID),
				ID:       insuranceID,
			},
		},
		{
			name: "it should return error when name is empty",
			request: &caremanagerpb.UpdateInsuranceRequest{
				Name:        &emptyName,
				MemberId:    &memberID,
				InsuranceId: insuranceID,
			},
			expectedError: status.Errorf(codes.InvalidArgument, "name cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := UpdateInsuranceSQLParamsFromUpdateInsuranceRequest(testCase.request)

			testutils.MustMatch(t, testCase.expectedError, err)
			testutils.MustMatch(t, testCase.expectedOutput, output)
		})
	}
}

func TestCreatePharmacySQLParamsFromCreatePharmacyRequestProto(t *testing.T) {
	patientID := time.Now().UnixNano()
	phoneNumber := "1234567890"
	faxNumber := "0987654321"
	address := "baker street 221b"

	testCases := []struct {
		name    string
		request *caremanagerpb.CreatePharmacyRequest

		want      *caremanagerdb.CreatePharmacyParams
		wantError error
	}{
		{
			name: "works",
			request: &caremanagerpb.CreatePharmacyRequest{
				PatientId:   patientID,
				Name:        "pharmacy",
				PhoneNumber: proto.String(phoneNumber),
				FaxNumber:   proto.String(faxNumber),
				Address:     proto.String(address),
			},

			want: &caremanagerdb.CreatePharmacyParams{
				Name:        "pharmacy",
				PhoneNumber: sqltypes.ToNullString(&phoneNumber),
				FaxNumber:   sqltypes.ToNullString(&faxNumber),
				Address:     sqltypes.ToNullString(&address),
				PatientID:   patientID,
			},
		}, {
			name: "works with nullable data",
			request: &caremanagerpb.CreatePharmacyRequest{
				PatientId: patientID,
				Name:      "pharmacy",
			},

			want: &caremanagerdb.CreatePharmacyParams{
				Name:      "pharmacy",
				PatientID: patientID,
			},
		}, {
			name: "fails with an empty name",
			request: &caremanagerpb.CreatePharmacyRequest{
				PatientId: patientID,
			},

			wantError: status.Error(codes.InvalidArgument, "name cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := CreatePharmacySQLParamsFromCreatePharmacyRequestProto(testCase.request)

			testutils.MustMatch(t, testCase.want, output)
			testutils.MustMatch(t, testCase.wantError, err, "unexpected problem, expected error and response error don't match")
		})
	}
}

func TestUpdatePharmacySQLParamsFromUpdatePharmacyRequestProto(t *testing.T) {
	phoneNumber := "1234567890"
	faxNumber := "0987654321"
	address := "Fuentes 45 Casa Ludee"
	testCases := []struct {
		name          string
		request       *caremanagerpb.UpdatePharmacyRequest
		inputPriority int32

		want      *caremanagerdb.UpdatePharmacyParams
		wantError error
	}{
		{
			name: "works",
			request: &caremanagerpb.UpdatePharmacyRequest{
				Name:        proto.String("pharmacy"),
				PhoneNumber: proto.String(phoneNumber),
				FaxNumber:   proto.String(faxNumber),
				Address:     proto.String(address),
			},

			want: &caremanagerdb.UpdatePharmacyParams{
				Name:        sqltypes.ToNullString(proto.String("pharmacy")),
				PhoneNumber: sqltypes.ToNullString(&phoneNumber),
				FaxNumber:   sqltypes.ToNullString(&faxNumber),
				Address:     sqltypes.ToNullString(&address),
			},
		},
		{
			name: "works with nullable data",
			request: &caremanagerpb.UpdatePharmacyRequest{
				Name: proto.String("pharmacy"),
			},

			want: &caremanagerdb.UpdatePharmacyParams{
				Name: sqltypes.ToNullString(proto.String("pharmacy")),
			},
		},
		{
			name: "fails with an empty name",
			request: &caremanagerpb.UpdatePharmacyRequest{
				Name: proto.String(""),
			},

			wantError: status.Error(codes.InvalidArgument, "name cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := UpdatePharmacySQLParamsFromUpdatePharmacyRequestProto(testCase.request)

			testutils.MustMatch(t, testCase.want, output)
			testutils.MustMatch(t, testCase.wantError, err, "unexpected problem, expected error and response error don't match")
		})
	}
}

func TestCreateMedicalDecisionMakerSQLParamsFromRequest(t *testing.T) {
	address := "address"
	phoneNumber := "999-999-999"
	relationship := "other relationship"
	testCases := []struct {
		name    string
		request *caremanagerpb.CreateMedicalDecisionMakerRequest

		want      *caremanagerdb.CreateMedicalDecisionMakerParams
		wantError error
	}{
		{
			name: "works",
			request: &caremanagerpb.CreateMedicalDecisionMakerRequest{
				PatientId:    1,
				FirstName:    "John",
				LastName:     "Cena",
				PhoneNumber:  &phoneNumber,
				Address:      &address,
				Relationship: &relationship,
			},

			want: &caremanagerdb.CreateMedicalDecisionMakerParams{
				FirstName:    "John",
				LastName:     "Cena",
				PhoneNumber:  sqltypes.ToNullString(&phoneNumber),
				Address:      sqltypes.ToNullString(&address),
				Relationship: sqltypes.ToNullString(&relationship),
				PatientID:    1,
			},
		},
		{
			name: "it should return error if the first name is not included",
			request: &caremanagerpb.CreateMedicalDecisionMakerRequest{
				PatientId:    1,
				FirstName:    "",
				LastName:     "Cena",
				PhoneNumber:  &phoneNumber,
				Address:      &address,
				Relationship: &relationship,
			},
			wantError: status.Error(codes.InvalidArgument, "first_name cannot be empty"),
		},
		{
			name: "it should return error if the last name is not included",
			request: &caremanagerpb.CreateMedicalDecisionMakerRequest{
				PatientId:    1,
				FirstName:    "John",
				LastName:     "",
				PhoneNumber:  &phoneNumber,
				Address:      &address,
				Relationship: &relationship,
			},

			wantError: status.Error(codes.InvalidArgument, "last_name cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := CreateMedicalDecisionMakerSQLParamsFromCreateMedicalDecisionMakerRequestProto(testCase.request)

			testutils.MustMatch(t, testCase.wantError, err)
			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestUpdateMedicalDecisionMakerSQLParamsFromRequest(t *testing.T) {
	address := "avenida siempre viva"
	phoneNumber := "123-123-321"
	relationship := "open relationship"
	firstName := "Bridget"
	lastName := "Wick"
	emptyName := ""
	emptyLastName := ""
	testCases := []struct {
		name    string
		request *caremanagerpb.UpdateMedicalDecisionMakerRequest

		want      *caremanagerdb.UpdateMedicalDecisionMakerParams
		wantError error
	}{
		{
			name: "works",
			request: &caremanagerpb.UpdateMedicalDecisionMakerRequest{
				FirstName:    &firstName,
				LastName:     &lastName,
				PhoneNumber:  &phoneNumber,
				Address:      &address,
				Relationship: &relationship,
			},

			want: &caremanagerdb.UpdateMedicalDecisionMakerParams{
				FirstName:    sqltypes.ToNullString(&firstName),
				LastName:     sqltypes.ToNullString(&lastName),
				PhoneNumber:  sqltypes.ToNullString(&phoneNumber),
				Address:      sqltypes.ToNullString(&address),
				Relationship: sqltypes.ToNullString(&relationship),
			},
		},
		{
			name: "it should return error if the first name is not included",
			request: &caremanagerpb.UpdateMedicalDecisionMakerRequest{
				FirstName: &emptyName,
			},

			wantError: status.Error(codes.InvalidArgument, "first_name cannot be empty"),
		},
		{
			name: "it should return error if the last name is not included",
			request: &caremanagerpb.UpdateMedicalDecisionMakerRequest{
				FirstName: &firstName,
				LastName:  &emptyLastName,
			},

			wantError: status.Error(codes.InvalidArgument, "last_name cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := UpdateMedicalDecisionMakerSQLParamsFromUpdateMedicalDecisionMakerRequestProto(testCase.request)

			testutils.MustMatch(t, testCase.wantError, err)
			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestCreateExternalCareProviderSQLParamsFromCreateExternalCareProviderRequestProto(t *testing.T) {
	patientID := time.Now().UnixNano()
	phoneNumber := "1234567890"
	faxNumber := "0987654321"
	address := "Some address"

	testCases := []struct {
		name    string
		request *caremanagerpb.CreateExternalCareProviderRequest

		want      *caremanagerdb.CreateExternalCareProviderParams
		wantError error
	}{
		{
			name: "works",
			request: &caremanagerpb.CreateExternalCareProviderRequest{
				PatientId:      patientID,
				Name:           "external doctor",
				PhoneNumber:    proto.String(phoneNumber),
				FaxNumber:      proto.String(faxNumber),
				Address:        proto.String(address),
				ProviderTypeId: 1,
			},

			want: &caremanagerdb.CreateExternalCareProviderParams{
				Name:           "external doctor",
				PhoneNumber:    sqltypes.ToNullString(&phoneNumber),
				FaxNumber:      sqltypes.ToNullString(&faxNumber),
				Address:        sqltypes.ToNullString(&address),
				PatientID:      patientID,
				ProviderTypeID: 1,
			},
		},
		{
			name: "works with nullable data",
			request: &caremanagerpb.CreateExternalCareProviderRequest{
				PatientId:      patientID,
				Name:           "external doctor",
				ProviderTypeId: 1,
			},

			want: &caremanagerdb.CreateExternalCareProviderParams{
				Name:           "external doctor",
				PatientID:      patientID,
				ProviderTypeID: 1,
			},
		},
		{
			name: "fails with an empty name",
			request: &caremanagerpb.CreateExternalCareProviderRequest{
				PatientId: patientID,
			},

			wantError: status.Error(codes.InvalidArgument, nameCannotBeEmpty),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := CreateExternalCareProviderSQLParamsFromCreateExternalCareProviderRequestProto(testCase.request)

			testutils.MustMatch(t, testCase.wantError, err)
			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestUpdateExternalCareProviderSQLParamsFromUpdateExternalCareProviderRequestProto(t *testing.T) {
	phoneNumber := "1234567890"
	faxNumber := "0987654321"
	address := "Baker Street 221B"

	testCases := []struct {
		name    string
		request *caremanagerpb.UpdateExternalCareProviderRequest

		want      *caremanagerdb.UpdateExternalCareProviderParams
		wantError error
	}{
		{
			name: "works",
			request: &caremanagerpb.UpdateExternalCareProviderRequest{
				Name:           proto.String("external doctor"),
				PhoneNumber:    proto.String(phoneNumber),
				FaxNumber:      proto.String(faxNumber),
				Address:        proto.String(address),
				ProviderTypeId: proto.Int64(int64(1)),
			},

			want: &caremanagerdb.UpdateExternalCareProviderParams{
				Name:           sqltypes.ToNullString(proto.String("external doctor")),
				PhoneNumber:    sqltypes.ToNullString(&phoneNumber),
				FaxNumber:      sqltypes.ToNullString(&faxNumber),
				Address:        sqltypes.ToNullString(&address),
				ProviderTypeID: sqltypes.ToNullInt64(proto.Int64(int64(1))),
			},
		},
		{
			name: "works with nullable data",
			request: &caremanagerpb.UpdateExternalCareProviderRequest{
				Name:           proto.String("external doctor"),
				ProviderTypeId: proto.Int64(int64(1)),
			},

			want: &caremanagerdb.UpdateExternalCareProviderParams{
				Name:           sqltypes.ToNullString(proto.String("external doctor")),
				ProviderTypeID: sqltypes.ToNullInt64(proto.Int64(int64(1))),
			},
		},
		{
			name: "fails with an empty name",
			request: &caremanagerpb.UpdateExternalCareProviderRequest{
				Name: proto.String(""),
			},

			wantError: status.Error(codes.InvalidArgument, nameCannotBeEmpty),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := UpdateExternalCareProviderSQLParamsFromUpdateExternalCareProviderRequestProto(testCase.request)

			testutils.MustMatch(t, testCase.wantError, err)
			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestUpdateVisitSQLParamsFromUpdateCallVisitRequest(t *testing.T) {
	userID := time.Now().Unix()
	visitID := time.Now().Unix()
	visitTypeID := time.Now().Unix()

	testCases := []struct {
		name        string
		req         *caremanagerpb.UpdateCallVisitRequest
		inputUserID *int64

		want      caremanagerdb.UpdateVisitParams
		wantError error
	}{
		{
			name: "works",
			req: &caremanagerpb.UpdateCallVisitRequest{
				VisitId:     visitID,
				VisitTypeId: &visitTypeID,
			},
			inputUserID: &userID,

			want: caremanagerdb.UpdateVisitParams{
				ID:              visitID,
				VisitTypeID:     sqltypes.ToNullInt64(&visitTypeID),
				UpdatedByUserID: sqltypes.ToNullInt64(&userID),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := UpdateVisitSQLParamsFromUpdateCallVisitRequest(testCase.req, testCase.inputUserID)

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestUpdateVisitSummarySQLParamsFromUpdateCallVisitRequest(t *testing.T) {
	userID := time.Now().Unix()
	visitID := time.Now().Unix()
	summary := "summary_" + fmt.Sprint(time.Now().Unix())
	testCases := []struct {
		name        string
		req         *caremanagerpb.UpdateCallVisitRequest
		inputUserID *int64

		want      *caremanagerdb.UpdateVisitSummaryParams
		wantError error
	}{
		{
			name:        "works",
			inputUserID: &userID,
			req: &caremanagerpb.UpdateCallVisitRequest{
				VisitId: visitID,
				Summary: &summary,
			},

			want: &caremanagerdb.UpdateVisitSummaryParams{
				VisitID:         visitID,
				UpdatedByUserID: sqltypes.ToNullInt64(&userID),
				Body:            sqltypes.ToNullString(&summary),
			},
			wantError: nil,
		},
		{
			name: "it should return error if the summary is included but it is an empty string",
			req: &caremanagerpb.UpdateCallVisitRequest{

				Summary: proto.String(""),
			},

			wantError: status.Error(codes.InvalidArgument, "summary cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := UpdateVisitSummarySQLParamsFromUpdateCallVisitRequest(testCase.req, testCase.inputUserID)

			testutils.MustMatch(t, testCase.wantError, err)
			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestEmptyStringPointerToNil(t *testing.T) {
	testCases := []struct {
		name  string
		input *string

		want *string
	}{
		{
			name:  "works",
			input: proto.String("valid string"),

			want: proto.String("valid string"),
		},
		{
			name:  "returns nil for empty string",
			input: proto.String(""),

			want: nil,
		},
		{
			name:  "returns nil for nil",
			input: nil,

			want: nil,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := emptyStringPointerToNil(testCase.input)

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestTimeWindowFromTimeInterval(t *testing.T) {
	location, err := time.LoadLocation("America/New_York")
	if err != nil {
		t.Fatal(err)
	}

	testCases := []struct {
		name      string
		startTime time.Time
		endTime   time.Time

		want *commonpb.TimeWindow
	}{
		{
			name:      "works",
			startTime: time.Date(2023, 1, 1, 12, 0, 0, 0, location),
			endTime:   time.Date(2024, 1, 1, 12, 0, 0, 0, location),

			want: &commonpb.TimeWindow{
				StartDatetime: &commonpb.DateTime{
					Year:    2023,
					Month:   1,
					Day:     1,
					Hours:   12,
					Minutes: 0,
					Seconds: 0,
					Nanos:   0,
					TimeOffset: &commonpb.DateTime_TimeZone{
						TimeZone: &commonpb.TimeZone{
							Id: "America/New_York",
						},
					},
				},
				EndDatetime: &commonpb.DateTime{
					Year:    2024,
					Month:   1,
					Day:     1,
					Hours:   12,
					Minutes: 0,
					Seconds: 0,
					Nanos:   0,
					TimeOffset: &commonpb.DateTime_TimeZone{
						TimeZone: &commonpb.TimeZone{
							Id: "America/New_York",
						},
					},
				},
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := TimeWindowFromTimeInterval(testCase.startTime, testCase.endTime)

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestGetUsersSearchUsersRequestFromCareManagerSearchUsersRequest(t *testing.T) {
	testCases := []struct {
		name string
		req  *caremanagerpb.SearchUsersRequest

		want *userpb.SearchUsersRequest
	}{
		{
			name: "should set the default values if the input is empty",
			req:  &caremanagerpb.SearchUsersRequest{},

			want: &userpb.SearchUsersRequest{
				Page:     proto.Int64(defaultPage),
				PageSize: proto.Int64(defaultPageSize),
			},
		},
		{
			name: "should use the page value and set default page size",
			req: &caremanagerpb.SearchUsersRequest{
				Page: proto.Int64(10),
			},

			want: &userpb.SearchUsersRequest{
				Page:     proto.Int64(10),
				PageSize: proto.Int64(defaultPageSize),
			},
		},
		{
			name: "should set the default page and use the page size",
			req: &caremanagerpb.SearchUsersRequest{
				PageSize: proto.Int64(100),
			},

			want: &userpb.SearchUsersRequest{
				Page:     proto.Int64(defaultPage),
				PageSize: proto.Int64(100),
			},
		},
		{
			name: "should use the page and page size values",
			req: &caremanagerpb.SearchUsersRequest{
				Page:     proto.Int64(2),
				PageSize: proto.Int64(100),
			},

			want: &userpb.SearchUsersRequest{
				Page:     proto.Int64(2),
				PageSize: proto.Int64(100),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			response := GetUsersSearchUsersRequestFromCareManagerSearchUsersRequest(testCase.req)

			testutils.MustMatch(t, response.Page, testCase.want.Page)
			testutils.MustMatch(t, response.PageSize, testCase.want.PageSize)
		})
	}
}

func TestCreateNoteSQLParamsFromCreateServiceRequestNoteProtoRequest(t *testing.T) {
	userID := time.Now().Unix()
	note := fmt.Sprintf("note_%d", time.Now().Unix())

	testCases := []struct {
		name                string
		req                 *caremanagerpb.CreateServiceRequestNoteRequest
		authenticatedUserID *int64

		want      *caremanagerdb.CreateNoteParams
		wantError error
	}{
		{
			name:                "works and sets default type",
			authenticatedUserID: &userID,
			req: &caremanagerpb.CreateServiceRequestNoteRequest{
				ServiceRequestId: 1,
				Details:          note,
			},

			want: &caremanagerdb.CreateNoteParams{
				Body:            note,
				Kind:            0,
				CreatedByUserID: sqltypes.ToNullInt64(&userID),
			},
			wantError: nil,
		},
		{
			name: "it should return error if the note is included but it is an empty string",
			req: &caremanagerpb.CreateServiceRequestNoteRequest{
				Details: "",
			},

			wantError: status.Error(codes.InvalidArgument, "note.details cannot be empty"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output, err := CreateNoteSQLParamsFromCreateServiceRequestNoteProtoRequest(testCase.req, testCase.authenticatedUserID)

			testutils.MustMatch(t, testCase.wantError, err)
			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestServiceRequestStatusProtoFromServiceRequestStatusSQL(t *testing.T) {
	tcs := []struct {
		name  string
		input *caremanagerdb.ServiceRequestStatus

		want *caremanagerpb.ServiceRequestStatus
	}{
		{
			name: "should work",
			input: &caremanagerdb.ServiceRequestStatus{
				ID:       1,
				Name:     "Requested",
				Slug:     "requested",
				IsActive: true,
			},

			want: &caremanagerpb.ServiceRequestStatus{
				Id:       1,
				Name:     "Requested",
				Slug:     "requested",
				IsActive: true,
			},
		},
		{
			name: "should work for non-active status",
			input: &caremanagerdb.ServiceRequestStatus{
				ID:       2,
				Name:     "Rejected",
				Slug:     "rejected",
				IsActive: false,
			},

			want: &caremanagerpb.ServiceRequestStatus{
				Id:       2,
				Name:     "Rejected",
				Slug:     "rejected",
				IsActive: false,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			output := ServiceRequestStatusProtoFromServiceRequestStatusSQL(tc.input)

			testutils.MustMatch(t, tc.want, output)
		})
	}
}

func TestUpdateServiceRequestSQLParamsFromUpdateServiceRequestProto(t *testing.T) {
	userID := time.Now().Unix()
	serviceRequestID := time.Now().Unix()
	statusID := time.Now().Unix()

	testCases := []struct {
		name   string
		userID *int64
		req    *caremanagerpb.UpdateServiceRequestRequest

		want caremanagerdb.UpdateServiceRequestParams
	}{
		{
			name:   "works",
			userID: &userID,
			req: &caremanagerpb.UpdateServiceRequestRequest{
				ServiceRequestId:    serviceRequestID,
				StatusId:            &statusID,
				IsInsuranceVerified: proto.Bool(true),
				CmsNumber:           proto.String("cms_number"),
				AssignedUserId:      &userID,
			},

			want: caremanagerdb.UpdateServiceRequestParams{
				ID:                  serviceRequestID,
				StatusID:            sqltypes.ToNullInt64(&userID),
				IsInsuranceVerified: sqltypes.ToNullBool(proto.Bool(true)),
				CmsNumber:           sqltypes.ToValidNullString("cms_number"),
				AssignedToUserID:    sqltypes.ToNullInt64(&userID),
				LastUpdatedByUserID: sqltypes.ToNullInt64(&userID),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := UpdateServiceRequestSQLParamsFromUpdateServiceRequestProto(testCase.req, *testCase.userID)

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestRejectServiceRequestSQLParamsFromRejectServiceRequestProto(t *testing.T) {
	userID := time.Now().Unix()
	serviceRequestID := time.Now().Unix()
	rejectReason := "Insurance Invalid"

	testCases := []struct {
		name         string
		req          *caremanagerpb.RejectServiceRequestRequest
		userID       *int64
		rejectReason *string

		want caremanagerdb.UpdateServiceRequestParams
	}{
		{
			name:   "works",
			userID: &userID,
			req: &caremanagerpb.RejectServiceRequestRequest{
				ServiceRequestId: serviceRequestID,
				RejectReason:     rejectReason,
			},

			want: caremanagerdb.UpdateServiceRequestParams{
				StatusID:            sqltypes.ToNullInt64(&userID),
				LastUpdatedByUserID: sqltypes.ToNullInt64(&userID),
				ID:                  serviceRequestID,
				RejectReason:        sqltypes.ToNullString(&rejectReason),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := RejectServiceRequestSQLParamsFromRejectServiceRequestProto(testCase.req, *testCase.userID, userID)

			testutils.MustMatchFn(".RejectedAt")(t, &testCase.want, &output)
		})
	}
}

func TestServiceRequestProtoFromServiceRequestSQL(t *testing.T) {
	userID := time.Now().Unix()
	serviceRequestID := time.Now().Unix()
	statusID := time.Now().Unix()
	createdAt := time.Now()
	updatedAt := time.Now()
	rejectReason := "Insurance Invalid"

	testCases := []struct {
		name string
		req  *caremanagerdb.ServiceRequest

		want *caremanagerpb.ServiceRequest
	}{
		{
			name: "works",
			req: &caremanagerdb.ServiceRequest{
				ID:                  serviceRequestID,
				CreatedAt:           createdAt,
				UpdatedAt:           updatedAt,
				LastUpdatedByUserID: sqltypes.ToNullInt64(&userID),
				StatusID:            statusID,
				CmsNumber:           sqltypes.ToValidNullString("123"),
				RejectReason:        sqltypes.ToNullString(&rejectReason),
			},

			want: &caremanagerpb.ServiceRequest{
				Id:              serviceRequestID,
				CreatedAt:       createdAt.Format(timestampLayout),
				UpdatedAt:       updatedAt.Format(timestampLayout),
				StatusId:        statusID,
				CmsNumber:       proto.String("123"),
				UpdatedByUserId: &userID,
				RejectReason:    proto.String(rejectReason),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := ServiceRequestProtoFromServiceRequestSQL(testCase.req)

			testutils.MustMatch(t, testCase.want, &output)
		})
	}
}

func TestGetVisitRequestFromServiceRequestSQL(t *testing.T) {
	testCases := []struct {
		name string
		req  *caremanagerdb.ServiceRequest

		want *episodepb.GetVisitRequest
	}{
		{
			name: "set CareRequest ID and optional fields as true",
			req: &caremanagerdb.ServiceRequest{
				CareRequestID: 1,
			},

			want: &episodepb.GetVisitRequest{
				CareRequestId:              1,
				IncludePatient:             proto.Bool(true),
				IncludeShiftTeam:           proto.Bool(true),
				IncludeSecondaryScreening:  proto.Bool(true),
				IncludeCaller:              proto.Bool(true),
				IncludeInsurance:           proto.Bool(true),
				IncludeVisitsInLast_90Days: proto.Bool(true),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := GetVisitRequestFromServiceRequestSQL(testCase.req)

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestStationCareRequestFromStationVisitResponse(t *testing.T) {
	mockID := time.Now().Unix()
	mockChiefComplaint := "More Ouch"
	mockCarName := "CAR01"
	mockSecondaryScreeningStatus := "Approved"

	testCases := []struct {
		name string
		req  *episodepb.GetVisitResponse

		want *caremanagerpb.StationCareRequest
	}{
		{
			name: "should convert visitResponse into Station CR",
			req: &episodepb.GetVisitResponse{
				CareRequest: &commonpb.CareRequestInfo{
					Id:             mockID,
					ChiefComplaint: &mockChiefComplaint,

					ShiftTeam: &commonpb.ShiftTeam{
						MemberIds: []int64{1, 2, 3},
						BaseLocation: &commonpb.BaseLocation{
							Name: mockCarName,
						},
					},
					SecondaryScreening: &commonpb.SecondaryScreening{
						ProviderId:     mockID,
						ApprovalStatus: mockSecondaryScreeningStatus,
						Note:           "test note",
					},
					Caller: &commonpb.Caller{
						FirstName:             "James",
						OrganizationName:      "Duck Inc",
						OriginPhone:           "1234",
						RelationshipToPatient: "patient",
					},
				},
			},

			want: &caremanagerpb.StationCareRequest{
				Id:                           mockID,
				ChiefComplaint:               mockChiefComplaint,
				ProviderUserIds:              []int64{1, 2, 3},
				CarName:                      &mockCarName,
				SecondaryScreeningProviderId: proto.Int64(mockID),
				SecondaryScreeningNote:       proto.String("test note"),
				RequesterName:                proto.String("James"),
				RequesterOrganizationName:    proto.String("Duck Inc"),
				RequesterPhoneNumber:         proto.String("1234"),
				RequesterType:                proto.String("patient"),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := StationCareRequestFromStationVisitResponse(testCase.req)

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestStationPatientFromStationVisitResponse(t *testing.T) {
	mockID := time.Now().Unix()

	testCases := []struct {
		name string
		req  *episodepb.GetVisitResponse

		want *caremanagerpb.StationPatient
	}{
		{
			name: "should convert visitResponse into Station Patient",
			req: &episodepb.GetVisitResponse{
				CareRequest: &commonpb.CareRequestInfo{
					Id: mockID,

					Patient: &commonpb.Patient{
						Id: proto.String(
							strconv.FormatInt(mockID, 10),
						),
						Name: &commonpb.Name{
							GivenName:  proto.String("James"),
							FamilyName: proto.String("Cameron"),
						},
						PrimaryIdentifier: &commonpb.PatientRecordIdentifier{
							RecordId: strconv.FormatInt(mockID, 10),
						},
						DateOfBirth: &commonpb.Date{
							Year:  2023,
							Month: 1,
							Day:   1,
						},
						Sex: commonpb.Sex_SEX_MALE.Enum(),
					},
					Insurance: &commonpb.Insurance{
						Id:          mockID,
						NetworkName: "test net",
						MemberId:    mockID,
						InsurancePlan: &insuranceplanpb.InsurancePlan{
							Name: "test insurance plan",
						},
					},
					VisitsInLast_90Days: proto.Int64(2),
				},
			},

			want: &caremanagerpb.StationPatient{
				Id:          mockID,
				FirstName:   proto.String("James"),
				LastName:    proto.String("Cameron"),
				EhrId:       strconv.FormatInt(mockID, 10),
				DateOfBirth: "2023-01-01",
				Sex: proto.String(
					commonpb.Sex_SEX_MALE.String(),
				),
				InsurancePlanId:      proto.Int64(mockID),
				InsuranceNetworkName: proto.String("test net"),
				InsuranceMemberId: proto.String(
					strconv.FormatInt(mockID, 10),
				),
				InsurancePlanName:   proto.String("test insurance plan"),
				VisitsInPast_90Days: 2,
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := StationPatientFromStationVisitResponse(testCase.req)

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestSearchVisitRequestFromSearchCareRequestsParams(t *testing.T) {
	mockCareRequestIDs := []int64{1, 2, 3}
	mockSearchTerm := "Searching for something"

	testCases := []struct {
		name string
		req  SearchCareRequestsParams

		want *episodepb.SearchVisitsRequest
	}{
		{
			name: "should convert searchVisitsParams into SearchVisitsRequest",
			req: SearchCareRequestsParams{
				CareRequestIDs: mockCareRequestIDs,
				SearchTerm:     &mockSearchTerm,
			},

			want: &episodepb.SearchVisitsRequest{
				CareRequestIds: mockCareRequestIDs,
				SearchTerm:     mockSearchTerm,
			},
		},
		{
			name: "should set an empty string if there is no search term",
			req: SearchCareRequestsParams{
				CareRequestIDs: mockCareRequestIDs,
			},

			want: &episodepb.SearchVisitsRequest{
				CareRequestIds: mockCareRequestIDs,
				SearchTerm:     "",
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := SearchVisitRequestFromSearchCareRequestsParams(testCase.req)

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestStationCareRequestListElementFromCareRequest(t *testing.T) {
	mockID := time.Now().Unix()
	mockChiefComplaint := "chief complaint"

	testCases := []struct {
		name        string
		careRequest *commonpb.CareRequestInfo

		want *caremanagerpb.StationCareRequestListElement
	}{
		{
			name: "should set ID and ChiefComplaint",
			careRequest: &commonpb.CareRequestInfo{
				Id:             mockID,
				ChiefComplaint: &mockChiefComplaint,
			},

			want: &caremanagerpb.StationCareRequestListElement{
				Id:             mockID,
				ChiefComplaint: mockChiefComplaint,
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := StationCareRequestListElementFromCareRequest(testCase.careRequest)

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestStationPatientListElementFromCareRequest(t *testing.T) {
	mockID := time.Now().Unix()
	mockPatientFirstName := "Peter"
	mockPatientLastName := "Parker"
	mockInsurancePlanName := "insurance plan name"

	testCases := []struct {
		name        string
		careRequest *commonpb.CareRequestInfo

		want *caremanagerpb.StationPatientListElement
	}{
		{
			name: "should set Patient attributes",
			careRequest: &commonpb.CareRequestInfo{
				Patient: &commonpb.Patient{
					Id: proto.String(strconv.FormatInt(mockID, 10)),
					Name: &commonpb.Name{
						GivenName:  proto.String(mockPatientFirstName),
						FamilyName: proto.String(mockPatientLastName),
					},
					PrimaryIdentifier: &commonpb.PatientRecordIdentifier{
						RecordId: strconv.FormatInt(mockID, 10),
					},
					DateOfBirth: &commonpb.Date{
						Year:  2020,
						Month: 1,
						Day:   1,
					},
				},
				Insurance: &commonpb.Insurance{
					InsurancePlan: &insuranceplanpb.InsurancePlan{
						Name: mockInsurancePlanName,
					},
				},
			},

			want: &caremanagerpb.StationPatientListElement{
				Id:            mockID,
				FirstName:     &mockPatientFirstName,
				LastName:      &mockPatientLastName,
				EhrId:         strconv.FormatInt(mockID, 10),
				InsuranceName: mockInsurancePlanName,
				DateOfBirth:   time.Date(2020, 1, 1, 0, 0, 0, 0, time.UTC).Format(dateLayout),
			},
		},
		{
			name:        "should work with empty patient",
			careRequest: &commonpb.CareRequestInfo{},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := StationPatientListElementFromCareRequest(testCase.careRequest)

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

func TestUserProtoFromStationUserProto(t *testing.T) {
	mockID := time.Now().Unix()

	testCases := []struct {
		name string
		req  *userpb.User

		want *caremanagerpb.User
	}{
		{
			name: "should convert Station User into User",
			req: &userpb.User{
				Id:          mockID,
				FirstName:   "James",
				LastName:    "Cameron",
				PhoneNumber: proto.String("1234"),
				Email:       "james@cameron.com",
				JobTitle:    proto.String("CRN"),
				AvatarUrl:   proto.String("http://avatar.com"),
			},

			want: &caremanagerpb.User{
				Id:          mockID,
				FirstName:   "James",
				LastName:    "Cameron",
				PhoneNumber: proto.String("1234"),
				Email:       "james@cameron.com",
				JobTitle:    proto.String("CRN"),
				AvatarUrl:   proto.String("http://avatar.com"),
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			output := UserProtoFromStationUserProto(testCase.req)

			testutils.MustMatch(t, testCase.want, output)
		})
	}
}

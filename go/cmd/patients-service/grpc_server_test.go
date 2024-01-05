package main

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"strings"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance_eligibility"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	stationpatientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/station_patients"
	patientssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/patients"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/patient"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/types/known/timestamppb"
)

const (
	acceptHeader          = "application/vnd.*company-data-covered*.com; version=1"
	responseStatusMessage = "response status: %s \n got %s want %s"
	responseMessage       = "\n got: %s\nwant: %s"
	bufSize               = 1024 * 1024
)

var (
	insuranceID      = proto.String("1")
	patientID        = proto.String("2")
	memberID         = proto.String("3")
	departmentID     = proto.String("6")
	recipientClassID = proto.String("7")

	priority = proto.String("1")

	insuranceStationID = proto.Int64(1)
	patientStationID   = proto.Int64(2)
	mpoaID             = proto.Int64(3)

	hasPcp                            = proto.Bool(true)
	hasNoPcp                          = proto.Bool(false)
	clinicalProviderID                = proto.String("123456")
	matchWithoutConsistencyToken      = testutils.MustMatchFn("consistency_token")
	matchProtoWithoutConsistencyToken = testutils.MustMatchProtoFn("consistency_token")
)

func getConsistencyToken(patientProto *common.Patient) []byte {
	consistencyToken, _ := generateProtoConsistencyToken(patientProto)
	return consistencyToken
}

type GRPCServerConfig struct {
	AthenaClient          *AthenaServiceClientMock
	DBService             *DBServiceMock
	StationPatientsClient *StationPatientsClientMock
	StationURL            *string
	StatsigProvider       *providers.StatsigProvider
	DataDogRecorder       *monitoring.DataDogRecorder
}

func setupPatientsGRPCServer(config GRPCServerConfig) (*GRPCServer, context.Context) {
	if config.StationURL == nil {
		config.StationURL = proto.String("")
	}

	return &GRPCServer{
		AthenaClient:          config.AthenaClient,
		DBService:             config.DBService,
		StationPatientsClient: config.StationPatientsClient,
		StationClient: &station.Client{
			AuthToken:  mockAuthValuer{},
			StationURL: *config.StationURL,
		},
		StatsigProvider: config.StatsigProvider,
		DataDogRecorder: config.DataDogRecorder,
		Logger:          baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
	}, context.Background()
}

type mockAuthValuer struct{}

func (v mockAuthValuer) AuthorizationValue() string {
	return ""
}

func getExamplePatient() *common.Patient {
	return &common.Patient{
		Id: proto.String("1234"),
		PrimaryIdentifier: &common.PatientRecordIdentifier{
			Source:   common.PatientRecordIdentifier_PATIENT_RECORD_SOURCE_ATHENA,
			RecordId: "789",
		},
		Name: &common.Name{
			GivenName:  proto.String("John"),
			FamilyName: proto.String("Heidenreich"),
		},
		ContactInfo: &common.ContactInfo{
			MobileNumber: &common.PhoneNumber{
				PhoneNumberType: common.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(555) 666-6888"),
			},
			Address: &common.Address{
				AddressLineOne: proto.String("3827 Lafayette Street"),
				City:           proto.String("Denver"),
				State:          proto.String("CO"),
				ZipCode:        proto.String("80305"),
			},
		},
		DateOfBirth: &common.Date{
			Year:  1949,
			Month: 5,
			Day:   20,
		},
		Sex: common.Sex_SEX_MALE.Enum(),
		Guarantor: &common.Guarantor{
			Name: &common.Name{
				GivenName:  proto.String("Erin"),
				FamilyName: proto.String("Denholm"),
			},
			DateOfBirth: &common.Date{
				Year:  2019,
				Month: 2,
				Day:   1,
			},
			ContactInfo: &common.ContactInfo{
				HomeNumber: &common.PhoneNumber{
					PhoneNumberType: common.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
					CountryCode:     proto.Int32(1),
					PhoneNumber:     proto.String("(555) 067-6888"),
				},
				Address: &common.Address{
					AddressLineOne: proto.String("3828 Lafayette Street"),
					City:           proto.String("DENVER"),
					State:          proto.String("CO"),
					ZipCode:        proto.String("80202-5107"),
				},
			},
			PatientRelation: &common.PatientRelation{
				Relation: common.RelationToPatient_RELATION_TO_PATIENT_SELF,
			},
		},
		PatientSafetyFlag: &common.PatientSafetyFlag{
			FlaggerUserId: "111",
			Type:          common.PatientSafetyFlag_FLAG_TYPE_TEMPORARY,
			Reason:        proto.String("Narcotic Dependence"),
		},
		ChannelItemId: proto.Int64(123),
		PartnerId:     proto.String("456"),
		SourceType:    proto.String("phone"),
		MedicalPowerOfAttorney: &common.MedicalPowerOfAttorney{
			Name: &common.Name{
				PreferredName: proto.String("Ruth Seiger"),
			},
			ContactInfo: &common.ContactInfo{
				HomeNumber: &common.PhoneNumber{
					PhoneNumberType: common.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
					CountryCode:     proto.Int32(1),
					PhoneNumber:     proto.String("(303) 555-1234"),
				},
			},
			PatientRelation: &common.PatientRelation{
				Relation:          common.RelationToPatient_RELATION_TO_PATIENT_FAMILY,
				OtherRelationText: proto.String("family"),
			},
			Id: mpoaID,
		},
		VoicemailConsent: proto.Bool(true),
		BillingCity: &common.BillingCity{
			Id: "5",
		},
	}
}

func getCreatePatientRequestPatient() *common.Patient {
	return &common.Patient{
		Name: &common.Name{
			GivenName:  proto.String("Dan"),
			FamilyName: proto.String("Cooper"),
		},
		ContactInfo: &common.ContactInfo{
			MobileNumber: &common.PhoneNumber{
				PhoneNumberType: 2,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(555) 555-5555"),
			},
			Email: proto.String("dan.cooper@example.com"),
		},
		DateOfBirth: &common.Date{
			Year:  2023,
			Month: 1,
			Day:   1,
		},
		BillingCity:      &common.BillingCity{Id: "5"},
		Sex:              common.Sex_SEX_MALE.Enum(),
		VoicemailConsent: proto.Bool(true),
		ChannelItemId:    proto.Int64(1),
		SourceType:       proto.String("2"),
		PartnerId:        proto.String("3"),
	}
}

func getExampleStationPatientProto() *stationpatientspb.Patient {
	return &stationpatientspb.Patient{
		Id:            1234,
		ChannelItemId: proto.Int64(123),
		SourceType:    proto.String("phone"),
		PartnerId:     proto.String("456"),
		PatientSafetyFlag: &stationpatientspb.PatientSafetyFlag{
			Id:         proto.Int64(333),
			PatientId:  proto.Int64(1234),
			FlagType:   proto.String("temporary"),
			FlagReason: proto.String("Narcotic Dependence"),
			FlaggerId:  proto.Int64(111),
		},
		VoicemailConsent: proto.Bool(true),
		BillingCity: &stationpatientspb.BillingCity{
			Id:                proto.Int64(5),
			DefaultDepartment: proto.String("2"),
			UsualProvider:     proto.String("235"),
		},
		PowerOfAttorney: &stationpatientspb.PowerOfAttorney{
			Id:           mpoaID,
			PatientId:    proto.Int64(1234),
			Name:         proto.String("Ruth Seiger"),
			Phone:        proto.String("303-555-1234"),
			Relationship: proto.String("family"),
		},
		EhrId: proto.String("789"),
	}
}

func getExampleAthenaPatientProto() *athenapb.Patient {
	return &athenapb.Patient{
		PatientId: proto.String("789"),
		Name: &common.Name{
			GivenName:  proto.String("John"),
			FamilyName: proto.String("Heidenreich"),
		},
		DateOfBirth: &common.Date{
			Year:  1949,
			Month: 5,
			Day:   20,
		},
		Sex: proto.String("M"),
		ContactInfo: &athenapb.ContactInfo{
			MobileNumber: &common.PhoneNumber{
				PhoneNumberType: common.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(555) 666-6888"),
			},
			Address: &common.Address{
				AddressLineOne: proto.String("3827 Lafayette Street"),
				City:           proto.String("Denver"),
				State:          proto.String("CO"),
				ZipCode:        proto.String("80305"),
			},
		},
		EmergencyContact: &athenapb.EmergencyContact{
			ContactName:         proto.String("BOYD"),
			ContactRelationship: proto.String("SPOUSE"),
			ContactMobilephone:  proto.String("5550676888"),
		},
		Guarantor: &athenapb.Guarantor{
			Name: &common.Name{
				GivenName:  proto.String("Erin"),
				FamilyName: proto.String("Denholm"),
			},
			DateOfBirth: &common.Date{
				Year:  2019,
				Month: 2,
				Day:   1,
			},
			ContactInfo: &athenapb.ContactInfo{
				HomeNumber: &common.PhoneNumber{
					PhoneNumberType: common.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
					CountryCode:     proto.Int32(1),
					PhoneNumber:     proto.String("(555) 067-6888"),
				},
				Address: &common.Address{
					AddressLineOne: proto.String("3828 Lafayette Street"),
					City:           proto.String("DENVER"),
					State:          proto.String("CO"),
					ZipCode:        proto.String("80202-5107"),
				},
			},
			SameAddressAsPatient:  proto.Bool(false),
			RelationshipToPatient: proto.String("1"),
		},
		PrimaryProviderId: proto.String("1"),
		PortalAccessGiven: proto.Bool(false),
	}
}

func getExampleUnverifiedPatientSQL() *patientssql.UnverifiedPatient {
	return &patientssql.UnverifiedPatient{
		ID:                    1,
		AthenaID:              sqltypes.ToValidNullInt64(1),
		DateOfBirth:           time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC),
		GivenName:             "John",
		FamilyName:            "Doe",
		PhoneNumber:           sql.NullString{String: "+1-555-555-5555", Valid: true},
		LegalSex:              patientssql.SexM,
		BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDMale),
		GenderIdentity:        ToNullGenderIdentity("m"),
		GenderIdentityDetails: sqltypes.ToValidNullString("test"),
		CreatedAt:             time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC),
		UpdatedAt:             time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC),
		PatientID:             sqltypes.ToValidNullInt64(1234),
	}
}

func getExampleUnverifiedPatientWithoutPatientIDSQL() *patientssql.UnverifiedPatient {
	return &patientssql.UnverifiedPatient{
		ID:                    2,
		AthenaID:              sqltypes.ToValidNullInt64(1),
		DateOfBirth:           time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC),
		GivenName:             "John",
		FamilyName:            "Doe",
		PhoneNumber:           sql.NullString{String: "+1-555-555-5555", Valid: true},
		LegalSex:              patientssql.SexM,
		BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDMale),
		GenderIdentity:        ToNullGenderIdentity("m"),
		GenderIdentityDetails: sqltypes.ToValidNullString("test"),
		CreatedAt:             time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC),
		UpdatedAt:             time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC),
		PatientID:             sqltypes.ToNullInt64(nil),
	}
}

func TestGetPatient(t *testing.T) {
	exampleConsistencyToken := getConsistencyToken(&common.Patient{
		Id: proto.String("1"),
		Name: &common.Name{
			GivenName:  proto.String("John"),
			FamilyName: proto.String("Doe"),
		},
	})

	mockStatsigProvider := providers.StartMockStatsigProvider(t)

	tcs := []struct {
		Desc                               string
		GetPatientRequest                  *patientspb.GetPatientRequest
		AthenaResponse                     *athenapb.GetPatientResponse
		AthenaError                        error
		StationPatientsResponse            *stationpatientspb.GetPatientResponse
		StationPatientsError               error
		StationResponse                    patient.StationPatient
		StationHTTPStatus                  int
		CallStationFlagEnabled             bool
		StationCallsPatientsServiceEnabled bool

		WantResponse *patientspb.GetPatientResponse
		WantGRPCCode codes.Code
	}{
		{
			Desc:              "base case",
			GetPatientRequest: &patientspb.GetPatientRequest{PatientId: proto.String("1234")},
			AthenaResponse: &athenapb.GetPatientResponse{
				Patient: getExampleAthenaPatientProto(),
			},
			StationPatientsResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			WantResponse: &patientspb.GetPatientResponse{
				Patient:          getExamplePatient(),
				ConsistencyToken: getConsistencyToken(getExamplePatient()),
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc:              "Station patient does not exist",
			GetPatientRequest: &patientspb.GetPatientRequest{PatientId: proto.String("1234")},
			AthenaResponse: &athenapb.GetPatientResponse{
				Patient: getExampleAthenaPatientProto(),
			},
			StationPatientsError: status.Error(codes.NotFound, "failed to retrieve patient from StationPatientsService"),
			WantGRPCCode:         codes.NotFound,
		},
		{
			Desc:              "Athena patient does not exist",
			GetPatientRequest: &patientspb.GetPatientRequest{PatientId: proto.String("1234")},
			StationPatientsResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			AthenaError:  status.Error(codes.NotFound, "failed to retrieve patient from AthenaService"),
			WantGRPCCode: codes.Internal,
		},
		{
			Desc:                   "Calls Station API with enabled flag",
			GetPatientRequest:      &patientspb.GetPatientRequest{PatientId: proto.String("1")},
			CallStationFlagEnabled: true,
			StationResponse: patient.StationPatient{
				ID: proto.Int64(1),
				StationName: &patient.StationName{
					FirstName: proto.String("John"),
					LastName:  proto.String("Doe"),
				},
			},
			StationHTTPStatus: http.StatusOK,
			WantResponse: &patientspb.GetPatientResponse{
				Patient: &common.Patient{
					Id: proto.String("1"),
					Name: &common.Name{
						GivenName:  proto.String("John"),
						FamilyName: proto.String("Doe"),
					},
				},
				ConsistencyToken: exampleConsistencyToken,
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc:                   "Calls Station API with enabled flag and got an error",
			GetPatientRequest:      &patientspb.GetPatientRequest{PatientId: proto.String("1")},
			CallStationFlagEnabled: true,
			StationHTTPStatus:      http.StatusInternalServerError,
			WantGRPCCode:           codes.Internal,
		},
		{
			Desc:                   "Calls Station API with enabled flag and fails at patient conversion",
			GetPatientRequest:      &patientspb.GetPatientRequest{PatientId: proto.String("1")},
			CallStationFlagEnabled: true,
			StationResponse:        patient.StationPatient{},
			StationHTTPStatus:      http.StatusOK,
			WantGRPCCode:           codes.Internal,
		},
		{
			Desc:                               "Calls Station API with enabled flag and fails at feature flags check",
			GetPatientRequest:                  &patientspb.GetPatientRequest{PatientId: proto.String("1")},
			CallStationFlagEnabled:             true,
			StationCallsPatientsServiceEnabled: true,
			WantGRPCCode:                       codes.FailedPrecondition,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var stationServerURL *string
			if tc.CallStationFlagEnabled || tc.StationCallsPatientsServiceEnabled {
				mockStatsigProvider.OverrideGate(patientsServiceCallsToStationFlag, tc.CallStationFlagEnabled)
				mockStatsigProvider.OverrideGate(stationCallsToPatientsServiceFlag, tc.StationCallsPatientsServiceEnabled)

				stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
					if req.Header.Get("Accept") != acceptHeader {
						t.Fatal("header Accept must be application/vnd.*company-data-covered*.com; version=1")
					}

					var (
						res []byte
						err error
					)

					rw.WriteHeader(tc.StationHTTPStatus)
					res, err = json.Marshal(tc.StationResponse)

					if err != nil {
						t.Fatalf("Failed to marshal json: %s", err)
					}
					rw.Write(res)
				}))

				stationServerURL = &stationServer.URL
				defer stationServer.Close()
			}

			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				GetPatientHandler: func(ctx context.Context, in *athenapb.GetPatientRequest, opts ...grpc.CallOption) (*athenapb.GetPatientResponse, error) {
					return tc.AthenaResponse, tc.AthenaError
				},
			}, StationPatientsClient: &StationPatientsClientMock{GetPatientHandler: func(ctx context.Context, in *stationpatientspb.GetPatientRequest, opts ...grpc.CallOption) (*stationpatientspb.GetPatientResponse, error) {
				return tc.StationPatientsResponse, tc.StationPatientsError
			}}, StationURL: stationServerURL, StatsigProvider: mockStatsigProvider})

			resp, err := s.GetPatient(ctx, tc.GetPatientRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			testutils.MustMatchProto(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

func TestUpdatePatient(t *testing.T) {
	newDOB := &common.Date{Year: 1946, Month: 4, Day: 4}
	newPartnerID := proto.String("789")

	updatedAthenaPatient := getExampleAthenaPatientProto()
	updatedAthenaPatient.DateOfBirth = newDOB

	updatedStationPatient := getExampleStationPatientProto()
	updatedStationPatient.PartnerId = newPartnerID

	updatedPatient := getExamplePatient()
	updatedPatient.DateOfBirth = newDOB
	updatedPatient.PartnerId = newPartnerID

	stationPatientMissingBillingCity := getExampleStationPatientProto()
	stationPatientMissingBillingCity.BillingCity = nil

	patientMissingBillingCity := getExamplePatient()
	patientMissingBillingCity.BillingCity = nil

	defaultGetDepartmentIDResp := &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{
		DepartmentId: "1",
	}

	testcases := []struct {
		description                  string
		patientRequest               *patientspb.UpdatePatientRequest
		expected                     *patientspb.UpdatePatientResponse
		GetDepartmentIDResponse      *stationpatientspb.GetDepartmentIDByBillingCityIDResponse
		GetDepartmentIDError         error
		AthenaGetPatientResponses    []*athenapb.GetPatientResponse
		AthenaUpdatePatientResponse  *athenapb.UpdatePatientResponse
		AthenaGetPatientError        error
		AthenaUpdatePatientError     error
		StationGetPatientResponses   []*stationpatientspb.GetPatientResponse
		StationUpdatePatientResponse *stationpatientspb.UpdatePatientResponse
		StationGetPatientError       error
		StationUpdatePatientError    error
		stationResponse              patient.StationPatient
		stationHTTPStatus            int
		expectedGRPCCode             codes.Code
	}{
		{
			description: "success - patient updated successfully",
			patientRequest: &patientspb.UpdatePatientRequest{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: newDOB,
					PartnerId:   newPartnerID,
				},
				ConsistencyToken: getConsistencyToken(getExamplePatient()),
			},
			expected: &patientspb.UpdatePatientResponse{
				Patient:          updatedPatient,
				ConsistencyToken: getConsistencyToken(updatedPatient),
			},
			GetDepartmentIDResponse: defaultGetDepartmentIDResp,
			AthenaGetPatientResponses: []*athenapb.GetPatientResponse{
				{
					Patient: getExampleAthenaPatientProto(),
				},
				{
					Patient: updatedAthenaPatient,
				},
			},
			AthenaUpdatePatientResponse: &athenapb.UpdatePatientResponse{
				PatientId: proto.String("1"),
			},
			StationGetPatientResponses: []*stationpatientspb.GetPatientResponse{
				{
					Patient: getExampleStationPatientProto(),
				},
				{
					Patient: updatedStationPatient,
				},
			},
			StationUpdatePatientResponse: &stationpatientspb.UpdatePatientResponse{
				PatientId: 1,
			},
			stationResponse: patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: proto.String("1946-04-04"),
			},
			stationHTTPStatus: http.StatusOK,
			expectedGRPCCode:  codes.OK,
		},
		{
			description: "failure - consistency tokens don't match",
			patientRequest: &patientspb.UpdatePatientRequest{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				},
				ConsistencyToken: getConsistencyToken(&common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				}),
			},
			expected: &patientspb.UpdatePatientResponse{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				},
				ConsistencyToken: getConsistencyToken(&common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				}),
			},
			GetDepartmentIDResponse: defaultGetDepartmentIDResp,
			AthenaGetPatientResponses: []*athenapb.GetPatientResponse{
				{
					Patient: getExampleAthenaPatientProto(),
				},
			},
			StationGetPatientResponses: []*stationpatientspb.GetPatientResponse{
				{
					Patient: getExampleStationPatientProto(),
				},
			},
			stationHTTPStatus: http.StatusOK,
			expectedGRPCCode:  codes.FailedPrecondition,
		},
		{
			description: "failed to retrieve patient from Athena",
			patientRequest: &patientspb.UpdatePatientRequest{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				},
				ConsistencyToken: getConsistencyToken(getExamplePatient()),
			},
			expected: &patientspb.UpdatePatientResponse{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				},
				ConsistencyToken: getConsistencyToken(&common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				}),
			},
			GetDepartmentIDResponse: defaultGetDepartmentIDResp,
			AthenaGetPatientResponses: []*athenapb.GetPatientResponse{
				{
					Patient: nil,
				},
			},
			AthenaGetPatientError: status.Error(codes.Internal, "failed to find patient with provided id"),
			StationGetPatientResponses: []*stationpatientspb.GetPatientResponse{
				{
					Patient: getExampleStationPatientProto(),
				},
			},
			stationResponse: patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: proto.String("1946-04-04"),
			},
			stationHTTPStatus: http.StatusOK,
			expectedGRPCCode:  codes.Internal,
		},
		{
			description: "failed to retrieve patient from Station",
			patientRequest: &patientspb.UpdatePatientRequest{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				},
				ConsistencyToken: getConsistencyToken(getExamplePatient()),
			},
			expected: &patientspb.UpdatePatientResponse{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				},
				ConsistencyToken: getConsistencyToken(getExamplePatient()),
			},
			GetDepartmentIDResponse: defaultGetDepartmentIDResp,
			AthenaGetPatientResponses: []*athenapb.GetPatientResponse{
				{
					Patient: getExampleAthenaPatientProto(),
				},
			},
			StationGetPatientResponses: []*stationpatientspb.GetPatientResponse{
				{
					Patient: nil,
				},
			},
			stationResponse: patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: proto.String("1946-04-04"),
			},
			stationHTTPStatus: http.StatusInternalServerError,
			expectedGRPCCode:  codes.Internal,
		},
		{
			description: "failure - billing city not provided",
			patientRequest: &patientspb.UpdatePatientRequest{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				},
				ConsistencyToken: getConsistencyToken(patientMissingBillingCity),
			},
			GetDepartmentIDResponse: defaultGetDepartmentIDResp,
			AthenaGetPatientResponses: []*athenapb.GetPatientResponse{
				{
					Patient: getExampleAthenaPatientProto(),
				},
			},
			StationGetPatientResponses: []*stationpatientspb.GetPatientResponse{
				{
					Patient: stationPatientMissingBillingCity,
				},
			},
			stationResponse: patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: proto.String("1946-04-04"),
			},
			stationHTTPStatus: http.StatusOK,
			expectedGRPCCode:  codes.InvalidArgument,
		},
		{
			description: "failed to update patient in Athena",
			patientRequest: &patientspb.UpdatePatientRequest{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				},
				ConsistencyToken: getConsistencyToken(getExamplePatient()),
			},
			expected: &patientspb.UpdatePatientResponse{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				},
				ConsistencyToken: getConsistencyToken(&common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				}),
			},
			AthenaGetPatientResponses: []*athenapb.GetPatientResponse{
				{
					Patient: getExampleAthenaPatientProto(),
				},
			},
			AthenaUpdatePatientError: status.Error(codes.Internal, "failed to update patient"),
			StationGetPatientResponses: []*stationpatientspb.GetPatientResponse{
				{
					Patient: getExampleStationPatientProto(),
				},
			},
			GetDepartmentIDResponse: defaultGetDepartmentIDResp,
			stationResponse: patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: proto.String("1946-04-04"),
			},
			stationHTTPStatus: http.StatusOK,
			expectedGRPCCode:  codes.Internal,
		},
		{
			description: "failed to find department id",
			patientRequest: &patientspb.UpdatePatientRequest{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				},
				ConsistencyToken: getConsistencyToken(getExamplePatient()),
			},
			expected: &patientspb.UpdatePatientResponse{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				},
				ConsistencyToken: getConsistencyToken(&common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				}),
			},
			GetDepartmentIDError: status.Error(codes.Internal, "failed to find department ID"),
			AthenaGetPatientResponses: []*athenapb.GetPatientResponse{
				{
					Patient: getExampleAthenaPatientProto(),
				},
			},
			AthenaUpdatePatientResponse: &athenapb.UpdatePatientResponse{
				PatientId: proto.String("1"),
			},
			StationGetPatientResponses: []*stationpatientspb.GetPatientResponse{
				{
					Patient: getExampleStationPatientProto(),
				},
			},
			stationResponse: patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: proto.String("1946-04-04"),
			},
			stationHTTPStatus: http.StatusOK,
			expectedGRPCCode:  codes.Internal,
		},
		{
			description: "failed to update patient in Station",
			patientRequest: &patientspb.UpdatePatientRequest{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				},
				ConsistencyToken: getConsistencyToken(getExamplePatient()),
			},
			expected: &patientspb.UpdatePatientResponse{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				},
				ConsistencyToken: getConsistencyToken(&common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: &common.Date{Year: 1946, Month: 4, Day: 4},
				}),
			},
			GetDepartmentIDResponse: defaultGetDepartmentIDResp,
			AthenaGetPatientResponses: []*athenapb.GetPatientResponse{
				{
					Patient: getExampleAthenaPatientProto(),
				},
			},
			StationUpdatePatientError: status.Error(codes.Internal, "failed to update patient"),
			StationGetPatientResponses: []*stationpatientspb.GetPatientResponse{
				{
					Patient: getExampleStationPatientProto(),
				},
			},
			stationResponse: patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: proto.String("1946-04-04"),
			},
			stationHTTPStatus: http.StatusOK,
			expectedGRPCCode:  codes.Internal,
		},
		{
			description: "failed to retrieve patient from Station after updating",
			patientRequest: &patientspb.UpdatePatientRequest{
				Patient: &common.Patient{
					Id:          proto.String("1"),
					DateOfBirth: newDOB,
					PartnerId:   newPartnerID,
				},
				ConsistencyToken: getConsistencyToken(getExamplePatient()),
			},
			expected: &patientspb.UpdatePatientResponse{
				Patient:          updatedPatient,
				ConsistencyToken: getConsistencyToken(updatedPatient),
			},
			GetDepartmentIDResponse: defaultGetDepartmentIDResp,
			AthenaGetPatientResponses: []*athenapb.GetPatientResponse{
				{
					Patient: getExampleAthenaPatientProto(),
				},
				{
					Patient: updatedAthenaPatient,
				},
			},
			AthenaUpdatePatientResponse: &athenapb.UpdatePatientResponse{
				PatientId: proto.String("1"),
			},
			StationGetPatientResponses: []*stationpatientspb.GetPatientResponse{
				{
					Patient: getExampleStationPatientProto(),
				},
				{
					Patient: nil,
				},
			},
			StationUpdatePatientResponse: &stationpatientspb.UpdatePatientResponse{
				PatientId: 1,
			},
			stationResponse: patient.StationPatient{
				ID:          proto.Int64(1),
				DateOfBirth: proto.String("1946-04-04"),
			},
			stationHTTPStatus: http.StatusOK,
			expectedGRPCCode:  codes.Internal,
		},
	}

	for _, test := range testcases {
		t.Run(test.description, func(t *testing.T) {
			getAthenaPatientRequestCount := 0
			getStationPatientRequestCount := 0

			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				if req.Header.Get("Accept") != acceptHeader {
					t.Fatal("header Accept must be application/vnd.*company-data-covered*.com; version=1")
				}

				var (
					res []byte
					err error
				)

				if req.Method != http.MethodGet {
					rw.WriteHeader(test.stationHTTPStatus)
					res, err = json.Marshal(test.stationResponse)
				}

				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.Write(res)
			}))
			defer stationServer.Close()

			s, ctx := setupPatientsGRPCServer(
				GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
					GetPatientHandler: func(ctx context.Context, in *athenapb.GetPatientRequest, opts ...grpc.CallOption) (*athenapb.GetPatientResponse, error) {
						resp := test.AthenaGetPatientResponses[getAthenaPatientRequestCount]
						getAthenaPatientRequestCount++
						return resp, test.AthenaGetPatientError
					},
					UpdatePatientHandler: func(ctx context.Context, in *athenapb.UpdatePatientRequest, opts ...grpc.CallOption) (*athenapb.UpdatePatientResponse, error) {
						return test.AthenaUpdatePatientResponse, test.AthenaUpdatePatientError
					},
				}, StationPatientsClient: &StationPatientsClientMock{
					GetPatientHandler: func(ctx context.Context, in *stationpatientspb.GetPatientRequest, opts ...grpc.CallOption) (*stationpatientspb.GetPatientResponse, error) {
						resp := test.StationGetPatientResponses[getStationPatientRequestCount]
						getStationPatientRequestCount++
						return resp, test.StationGetPatientError
					},
					UpdatePatientsHandler: func(ctx context.Context, in *stationpatientspb.UpdatePatientRequest, opts ...grpc.CallOption) (*stationpatientspb.UpdatePatientResponse, error) {
						return test.StationUpdatePatientResponse, test.StationUpdatePatientError
					},
					GetDepartmentIDByBillingCityIDHandler: func(ctx context.Context, in *stationpatientspb.GetDepartmentIDByBillingCityIDRequest, opts ...grpc.CallOption) (*stationpatientspb.GetDepartmentIDByBillingCityIDResponse, error) {
						return test.GetDepartmentIDResponse, test.GetDepartmentIDError
					},
				},
					StationURL: &stationServer.URL})

			resp, err := s.UpdatePatient(ctx, test.patientRequest)

			respStatus, ok := status.FromError(err)

			if !ok {
				t.Fatal(err)
			}

			if respStatus.Code() != test.expectedGRPCCode {
				t.Fatalf(responseStatusMessage, respStatus, respStatus.Code(), test.expectedGRPCCode)
			}

			if resp != nil {
				testutils.MustMatchProto(t, test.expected, resp, "response does not match")
			}
		})
	}
}

func firstSearchPatientsResult() *common.Patient {
	return &common.Patient{
		Id: proto.String("1234"),
		PrimaryIdentifier: &common.PatientRecordIdentifier{
			Source:   1,
			RecordId: "401429",
		},
		Name: &common.Name{
			GivenName:           proto.String("peter"),
			FamilyName:          proto.String("griffin"),
			MiddleNameOrInitial: proto.String(""),
			Suffix:              proto.String(""),
		},
		ContactInfo: &common.ContactInfo{
			HomeNumber: &common.PhoneNumber{
				PhoneNumberType: 1,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(303) 500-1518"),
			},
			Address: &common.Address{
				AddressLineOne: proto.String("1235 E EVANS AVE"),
				AddressLineTwo: proto.String("#144"),
				City:           proto.String("DENVER"),
				State:          proto.String("CO"),
				ZipCode:        proto.String("80210-4531"),
			},
		},
		DateOfBirth: &common.Date{
			Year:  1937,
			Month: 9,
			Day:   25,
		},
		BillingCity:       &common.BillingCity{Id: "5"},
		Sex:               common.Sex_SEX_MALE.Enum(),
		ChannelItemId:     proto.Int64(1094),
		SourceType:        proto.String("phone"),
		PartnerId:         proto.String("3"),
		PatientSafetyFlag: nil,
		VoicemailConsent:  proto.Bool(true),
	}
}

func secondSearchPatientsResult() *common.Patient {
	return &common.Patient{
		Id: proto.String("456"),
		PrimaryIdentifier: &common.PatientRecordIdentifier{
			Source:   1,
			RecordId: "5515",
		},
		Name: &common.Name{
			GivenName:           proto.String("peterling"),
			FamilyName:          proto.String("griffin"),
			MiddleNameOrInitial: proto.String("jay"),
			Suffix:              proto.String(""),
		},
		ContactInfo: &common.ContactInfo{
			HomeNumber: &common.PhoneNumber{
				PhoneNumberType: 1,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(303) 345-1518"),
			},
			Address: &common.Address{
				AddressLineOne: proto.String("3825 Lafayette St"),
				City:           proto.String("DENVER"),
				State:          proto.String("CO"),
				ZipCode:        proto.String("80205-4531"),
			},
		},
		DateOfBirth: &common.Date{
			Year:  2000,
			Month: 4,
			Day:   25,
		},
		BillingCity:       &common.BillingCity{Id: "5"},
		Sex:               common.Sex_SEX_MALE.Enum(),
		ChannelItemId:     proto.Int64(1094),
		SourceType:        proto.String("phone"),
		PartnerId:         proto.String("3"),
		PatientSafetyFlag: nil,
		VoicemailConsent:  proto.Bool(true),
	}
}

func TestSearchPatients(t *testing.T) {
	tcs := []struct {
		Desc                    string
		SearchPatientsRequest   *patientspb.SearchPatientsRequest
		AthenaResponse          *athenapb.SearchPatientsResponse
		AthenaError             error
		StationPatientsResponse *stationpatientspb.ListPatientsResponse
		StationPatientsError    error

		WantResponse *patientspb.SearchPatientsResponse
		WantGRPCCode codes.Code
	}{
		{
			Desc: "Base case",
			SearchPatientsRequest: &patientspb.SearchPatientsRequest{
				SearchTerm:     proto.String("griffin,peter,12345"),
				ChannelItemIds: []int64{1094},
				PartnerId:      proto.String("3"),
			},
			AthenaResponse: &athenapb.SearchPatientsResponse{
				Results: []*athenapb.SearchPatientsResult{
					{
						Patient: &athenapb.Patient{
							PatientId: proto.String("401429"),
							Name: &common.Name{
								GivenName:           proto.String("peter"),
								FamilyName:          proto.String("griffin"),
								MiddleNameOrInitial: proto.String(""),
								Suffix:              proto.String(""),
							},
							DateOfBirth: &common.Date{Year: 1937, Month: 9, Day: 25},
							Sex:         proto.String("M"),
							ContactInfo: &athenapb.ContactInfo{
								Address: &common.Address{
									AddressLineOne: proto.String("1235 E EVANS AVE"),
									AddressLineTwo: proto.String("#144"),
									City:           proto.String("DENVER"),
									State:          proto.String("CO"),
									ZipCode:        proto.String("80210-4531"),
								},
								HomeNumber: &common.PhoneNumber{
									CountryCode:     proto.Int32(1),
									PhoneNumber:     proto.String("(303) 500-1518"),
									PhoneNumberType: common.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
								},
							},
							DepartmentId: proto.String("2"),
						},
					},
					{
						Patient: &athenapb.Patient{
							PatientId: proto.String("5515"),
							Name: &common.Name{
								GivenName:           proto.String("peterling"),
								FamilyName:          proto.String("griffin"),
								MiddleNameOrInitial: proto.String("jay"),
								Suffix:              proto.String(""),
							},
							DateOfBirth: &common.Date{Year: 2000, Month: 4, Day: 25},
							Sex:         proto.String("M"),
							ContactInfo: &athenapb.ContactInfo{
								Address: &common.Address{
									AddressLineOne: proto.String("3825 Lafayette St"),
									City:           proto.String("DENVER"),
									State:          proto.String("CO"),
									ZipCode:        proto.String("80205-4531"),
								},
								HomeNumber: &common.PhoneNumber{
									CountryCode:     proto.Int32(1),
									PhoneNumber:     proto.String("(303) 345-1518"),
									PhoneNumberType: common.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
								},
							},
							DepartmentId: proto.String("2"),
						},
					},
				},
			},
			StationPatientsResponse: &stationpatientspb.ListPatientsResponse{Patients: []*stationpatientspb.Patient{
				{
					Id:                1234,
					ChannelItemId:     proto.Int64(1094),
					SourceType:        proto.String("phone"),
					PartnerId:         proto.String("3"),
					PatientSafetyFlag: nil,
					VoicemailConsent:  proto.Bool(true),
					BillingCity: &stationpatientspb.BillingCity{
						Id:                proto.Int64(5),
						DefaultDepartment: proto.String("2"),
						UsualProvider:     proto.String("235"),
					},
					PowerOfAttorney: nil,
					EhrId:           proto.String("401429"),
				},
				{
					Id:                456,
					ChannelItemId:     proto.Int64(1094),
					SourceType:        proto.String("phone"),
					PartnerId:         proto.String("3"),
					PatientSafetyFlag: nil,
					VoicemailConsent:  proto.Bool(true),
					BillingCity: &stationpatientspb.BillingCity{
						Id:                proto.Int64(5),
						DefaultDepartment: proto.String("2"),
						UsualProvider:     proto.String("235"),
					},
					PowerOfAttorney: nil,
					EhrId:           proto.String("5515"),
				},
			}},
			WantResponse: &patientspb.SearchPatientsResponse{
				Results: []*patientspb.SearchPatientsResult{
					{
						Patient:          firstSearchPatientsResult(),
						ConsistencyToken: getConsistencyToken(firstSearchPatientsResult()),
					},
					{
						Patient:          secondSearchPatientsResult(),
						ConsistencyToken: getConsistencyToken(secondSearchPatientsResult()),
					},
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "Empty channel item ids works",
			SearchPatientsRequest: &patientspb.SearchPatientsRequest{
				SearchTerm:     proto.String("griffin,peter,12345"),
				ChannelItemIds: []int64{},
				PartnerId:      proto.String("3"),
			},
			AthenaResponse: &athenapb.SearchPatientsResponse{
				Results: []*athenapb.SearchPatientsResult{
					{
						Patient: &athenapb.Patient{
							PatientId: proto.String("5515"),
							Name: &common.Name{
								GivenName:           proto.String("peterling"),
								FamilyName:          proto.String("griffin"),
								MiddleNameOrInitial: proto.String("jay"),
								Suffix:              proto.String(""),
							},
							DateOfBirth: &common.Date{Year: 2000, Month: 4, Day: 25},
							Sex:         proto.String("M"),
							ContactInfo: &athenapb.ContactInfo{
								Address: &common.Address{
									AddressLineOne: proto.String("3825 Lafayette St"),
									City:           proto.String("DENVER"),
									State:          proto.String("CO"),
									ZipCode:        proto.String("80205-4531"),
								},
								HomeNumber: &common.PhoneNumber{
									CountryCode:     proto.Int32(1),
									PhoneNumber:     proto.String("(303) 345-1518"),
									PhoneNumberType: common.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
								},
							},
							DepartmentId: proto.String("2"),
						},
					},
				},
			},
			StationPatientsResponse: &stationpatientspb.ListPatientsResponse{Patients: []*stationpatientspb.Patient{
				{
					Id:                456,
					ChannelItemId:     proto.Int64(1094),
					SourceType:        proto.String("phone"),
					PartnerId:         proto.String("3"),
					PatientSafetyFlag: nil,
					VoicemailConsent:  proto.Bool(true),
					BillingCity: &stationpatientspb.BillingCity{
						Id:                proto.Int64(5),
						DefaultDepartment: proto.String("2"),
						UsualProvider:     proto.String("235"),
					},
					PowerOfAttorney: nil,
					EhrId:           proto.String("5515"),
				},
			}},
			WantResponse: &patientspb.SearchPatientsResponse{
				Results: []*patientspb.SearchPatientsResult{
					{
						Patient:          secondSearchPatientsResult(),
						ConsistencyToken: getConsistencyToken(secondSearchPatientsResult()),
					},
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "nil partner id works",
			SearchPatientsRequest: &patientspb.SearchPatientsRequest{
				SearchTerm:     proto.String("griffin,peter,12345"),
				ChannelItemIds: []int64{347},
				PartnerId:      nil,
			},
			AthenaResponse: &athenapb.SearchPatientsResponse{
				Results: []*athenapb.SearchPatientsResult{
					{
						Patient: &athenapb.Patient{
							PatientId: proto.String("5515"),
							Name: &common.Name{
								GivenName:           proto.String("peterling"),
								FamilyName:          proto.String("griffin"),
								MiddleNameOrInitial: proto.String("jay"),
								Suffix:              proto.String(""),
							},
							DateOfBirth: &common.Date{Year: 2000, Month: 4, Day: 25},
							Sex:         proto.String("M"),
							ContactInfo: &athenapb.ContactInfo{
								Address: &common.Address{
									AddressLineOne: proto.String("3825 Lafayette St"),
									City:           proto.String("DENVER"),
									State:          proto.String("CO"),
									ZipCode:        proto.String("80205-4531"),
								},
								HomeNumber: &common.PhoneNumber{
									CountryCode:     proto.Int32(1),
									PhoneNumber:     proto.String("(303) 345-1518"),
									PhoneNumberType: common.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
								},
							},
							DepartmentId: proto.String("2"),
						},
					},
				},
			},
			StationPatientsResponse: &stationpatientspb.ListPatientsResponse{Patients: []*stationpatientspb.Patient{
				{
					Id:                456,
					ChannelItemId:     proto.Int64(1094),
					SourceType:        proto.String("phone"),
					PartnerId:         proto.String("3"),
					PatientSafetyFlag: nil,
					VoicemailConsent:  proto.Bool(true),
					BillingCity: &stationpatientspb.BillingCity{
						Id:                proto.Int64(5),
						DefaultDepartment: proto.String("2"),
						UsualProvider:     proto.String("235"),
					},
					PowerOfAttorney: nil,
					EhrId:           proto.String("5515"),
				},
			}},
			WantResponse: &patientspb.SearchPatientsResponse{
				Results: []*patientspb.SearchPatientsResult{
					{
						Patient:          secondSearchPatientsResult(),
						ConsistencyToken: getConsistencyToken(secondSearchPatientsResult()),
					},
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "nil search params",
			SearchPatientsRequest: &patientspb.SearchPatientsRequest{
				SearchTerm:     nil,
				ChannelItemIds: []int64{1094},
				PartnerId:      proto.String("3"),
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "empty search params",
			SearchPatientsRequest: &patientspb.SearchPatientsRequest{
				SearchTerm:     proto.String(""),
				ChannelItemIds: []int64{1094},
				PartnerId:      proto.String("3"),
			},
			WantGRPCCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(
				GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
					SearchPatientsHandler: func(ctx context.Context, in *athenapb.SearchPatientsRequest, opts ...grpc.CallOption) (*athenapb.SearchPatientsResponse, error) {
						return tc.AthenaResponse, tc.AthenaError
					},
				},
					StationPatientsClient: &StationPatientsClientMock{ListPatientsHandler: func(ctx context.Context, in *stationpatientspb.ListPatientsRequest, opts ...grpc.CallOption) (*stationpatientspb.ListPatientsResponse, error) {
						return tc.StationPatientsResponse, tc.StationPatientsError
					}}})

			resp, err := s.SearchPatients(ctx, tc.SearchPatientsRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			testutils.MustMatchProto(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

func TestCreateInsurance(t *testing.T) {
	baseID := time.Now().UnixNano()
	femaleSex := common.Sex_SEX_FEMALE
	testCompanyName := proto.String("testcompanyname")
	testPackageID := proto.String("testpackageid")
	testGroupID := proto.String("testgroupid")
	testHolderFirst := proto.String("holderfirst")
	testHolderLast := proto.String("holderlast")

	tcs := []struct {
		Desc              string
		InsuranceRequest  *patientspb.CreateInsuranceRequest
		StationHTTPStatus int
		StationResponse   patient.StationInsurance
		Want              *patientspb.CreateInsuranceResponse
		WantGRPCCode      codes.Code
	}{
		{
			Desc: "success - insurance created",
			InsuranceRequest: &patientspb.CreateInsuranceRequest{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:        insuranceID,
					PatientId: patientID,
					MemberId:  memberID,
					Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
				},
			},
			StationHTTPStatus: http.StatusOK,
			StationResponse: patient.StationInsurance{
				ID:        insuranceStationID,
				PatientID: patientStationID,
				MemberID:  memberID,
				Priority:  priority,
			},
			Want: &patientspb.CreateInsuranceResponse{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:        insuranceID,
					PatientId: patientID,
					MemberId:  memberID,
					Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "success - insurance created with all fields",
			InsuranceRequest: &patientspb.CreateInsuranceRequest{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:              insuranceID,
					PatientId:       patientID,
					MemberId:        memberID,
					Priority:        patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
					CompanyName:     testCompanyName,
					PackageId:       testPackageID,
					InsurancePlanId: proto.Int64(baseID + 1),
					GroupId:         testGroupID,
					PrimaryInsuranceHolder: &patientspb.PrimaryInsuranceHolder{
						Name: &common.Name{
							GivenName:  testHolderFirst,
							FamilyName: testHolderLast,
						},
						Sex: &femaleSex,
					},
					EligibilityStatus:  insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_ELIGIBLE,
					EligibilityMessage: proto.String("you are totally eligible yay"),
				},
			},
			StationHTTPStatus: http.StatusOK,
			StationResponse: patient.StationInsurance{
				ID:              insuranceStationID,
				PatientID:       patientStationID,
				MemberID:        memberID,
				Priority:        priority,
				CompanyName:     testCompanyName,
				PackageID:       testPackageID,
				InsurancePlanID: proto.Int64(baseID + 1),
				GroupNumber:     testGroupID,
				PrimaryInsuranceHolder: &patient.StationPrimaryInsuranceHolder{
					StationPrimaryInsuranceHolderName: &patient.StationPrimaryInsuranceHolderName{
						FirstName: testHolderFirst,
						LastName:  testHolderLast,
					},
					Gender: proto.String("female"),
				},
				Eligible:           proto.String("Eligible"),
				EligibilityMessage: proto.String("you are totally eligible yay"),
			},
			Want: &patientspb.CreateInsuranceResponse{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:              insuranceID,
					PatientId:       patientID,
					MemberId:        memberID,
					Priority:        patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
					CompanyName:     testCompanyName,
					PackageId:       testPackageID,
					InsurancePlanId: proto.Int64(baseID + 1),
					GroupId:         testGroupID,
					PrimaryInsuranceHolder: &patientspb.PrimaryInsuranceHolder{
						Name: &common.Name{
							GivenName:  testHolderFirst,
							FamilyName: testHolderLast,
						},
						Sex: &femaleSex,
					},
					EligibilityStatus:  insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_ELIGIBLE,
					EligibilityMessage: proto.String("you are totally eligible yay"),
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "failure - cannot convert StationResponse to Insurance proto",
			InsuranceRequest: &patientspb.CreateInsuranceRequest{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:        insuranceID,
					PatientId: patientID,
					MemberId:  memberID,
					Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
				},
			},
			StationHTTPStatus: http.StatusOK,
			StationResponse: patient.StationInsurance{
				ID:       insuranceStationID,
				Priority: priority,
			},
			Want: &patientspb.CreateInsuranceResponse{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:        insuranceID,
					PatientId: patientID,
					MemberId:  memberID,
					Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
				},
			},
			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "failure - cannot convert Insurance proto into StationInsurance",
			InsuranceRequest: &patientspb.CreateInsuranceRequest{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:        insuranceID,
					PatientId: patientID,
					MemberId:  memberID,
					Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_TERTIARY,
				},
			},
			StationHTTPStatus: http.StatusOK,
			StationResponse: patient.StationInsurance{
				ID:        insuranceStationID,
				PatientID: patientStationID,
			},
			Want: &patientspb.CreateInsuranceResponse{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:        insuranceID,
					PatientId: patientID,
					MemberId:  memberID,
					Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_TERTIARY,
				},
			},
			WantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				if req.Header.Get("Accept") != acceptHeader {
					t.Fatal("header Accept must be application/vnd.*company-data-covered*.com; version=1")
				}
				rw.WriteHeader(tc.StationHTTPStatus)

				resp, err := json.Marshal(tc.StationResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.Write(resp)
			}))
			defer stationServer.Close()

			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{StationURL: &stationServer.URL})

			resp, err := s.CreateInsurance(ctx, tc.InsuranceRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Fatalf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			if resp != nil {
				matchProtoWithoutConsistencyToken(t, tc.Want, resp, "response does not match")
			}
		})
	}
}

func TestGetInsurance(t *testing.T) {
	tcs := []struct {
		Desc                           string
		SyncEHR                        bool
		StationSyncInsuranceHTTPStatus int
		StationInsuranceHTTPStatus     int
		StationInsuranceResponse       patient.StationInsurance

		WantGRPCCode codes.Code
		Want         *patientspb.GetInsuranceResponse
	}{
		{
			Desc:                       "success - base case",
			StationInsuranceHTTPStatus: http.StatusOK,
			StationInsuranceResponse: patient.StationInsurance{
				ID:        insuranceStationID,
				PatientID: patientStationID,
				MemberID:  memberID,
				Priority:  priority,
			},

			WantGRPCCode: codes.OK,
			Want: &patientspb.GetInsuranceResponse{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:        insuranceID,
					PatientId: patientID,
					MemberId:  memberID,
					Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
				},
			},
		},
		{
			Desc:                           "success - with sync_ehr",
			SyncEHR:                        true,
			StationSyncInsuranceHTTPStatus: http.StatusOK,
			StationInsuranceHTTPStatus:     http.StatusOK,
			StationInsuranceResponse: patient.StationInsurance{
				ID:        insuranceStationID,
				PatientID: patientStationID,
				MemberID:  memberID,
				Priority:  priority,
			},

			WantGRPCCode: codes.OK,
			Want: &patientspb.GetInsuranceResponse{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:        insuranceID,
					PatientId: patientID,
					MemberId:  memberID,
					Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
				},
			},
		},
		{
			Desc:                           "failure - with sync_ehr error",
			SyncEHR:                        true,
			StationSyncInsuranceHTTPStatus: http.StatusInternalServerError,
			StationInsuranceHTTPStatus:     http.StatusOK,
			StationInsuranceResponse: patient.StationInsurance{
				ID:        insuranceStationID,
				PatientID: patientStationID,
				MemberID:  memberID,
				Priority:  priority,
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc:                       "failure - insurance without patient id",
			StationInsuranceHTTPStatus: http.StatusOK,
			StationInsuranceResponse: patient.StationInsurance{
				ID: insuranceStationID,
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc:                       "failure - returned insurance is empty",
			StationInsuranceHTTPStatus: http.StatusOK,

			WantGRPCCode: codes.NotFound,
		},
		{
			Desc:                       "failure - insurance not found",
			StationInsuranceHTTPStatus: http.StatusNotFound,

			WantGRPCCode: codes.NotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				if req.Header.Get("Accept") != acceptHeader {
					t.Fatal("header Accept must be application/vnd.*company-data-covered*.com; version=1")
				}
				var resp []byte
				var err error
				if strings.Contains(req.URL.Path, "/sync") {
					rw.WriteHeader(tc.StationSyncInsuranceHTTPStatus)
				} else {
					rw.WriteHeader(tc.StationInsuranceHTTPStatus)
					resp, err = json.Marshal(tc.StationInsuranceResponse)
					if err != nil {
						t.Fatalf("Failed to marshal json: %s", err)
					}
				}
				rw.Write(resp)
			}))
			defer stationServer.Close()
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{StationURL: &stationServer.URL})

			resp, err := s.GetInsurance(ctx, &patientspb.GetInsuranceRequest{
				InsuranceId: proto.String("1"),
				PatientId:   proto.String("1"),
				SyncEhr:     tc.SyncEHR,
			})
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if reqStatus.Code() != tc.WantGRPCCode {
				t.Fatalf("received unexpected error: %s\n got: %s\nwant: %s", reqStatus, reqStatus.Code(), tc.WantGRPCCode)
			}

			if resp != nil {
				if !proto.Equal(resp, tc.Want) {
					t.Errorf(responseMessage, resp, tc.Want)
				}
			}
		})
	}
}

func TestListInsurances(t *testing.T) {
	testDate := time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC)
	testDateConsistencyToken, _ := protoconv.TimestampToBytes(timestamppb.New(testDate))

	tcs := []struct {
		Desc              string
		InsuranceRequest  *patientspb.ListInsurancesRequest
		StationHTTPStatus int
		StationResponse   []*patient.StationInsurance
		Want              *patientspb.ListInsurancesResponse
		WantGRPCCode      codes.Code
	}{
		{
			Desc:              "success - list insurances received",
			InsuranceRequest:  &patientspb.ListInsurancesRequest{PatientId: proto.String("1")},
			StationHTTPStatus: http.StatusOK,
			StationResponse: []*patient.StationInsurance{
				{
					ID:        insuranceStationID,
					PatientID: patientStationID,
					MemberID:  memberID,
					Priority:  priority,
					Eligible:  proto.String("Eligible"),
				},
				{
					ID:        insuranceStationID,
					PatientID: patientStationID,
					MemberID:  memberID,
					Priority:  proto.String("2"),
					Eligible:  proto.String("Ineligible"),
				},
			},
			Want: &patientspb.ListInsurancesResponse{
				Results: []*patientspb.ListInsurancesResult{
					{
						InsuranceRecord: &patientspb.InsuranceRecord{
							Id:                insuranceID,
							PatientId:         patientID,
							MemberId:          memberID,
							Priority:          patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
							EligibilityStatus: insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_ELIGIBLE,
						},
						ConsistencyToken: testDateConsistencyToken,
					},
					{
						InsuranceRecord: &patientspb.InsuranceRecord{
							Id:                insuranceID,
							PatientId:         patientID,
							MemberId:          memberID,
							Priority:          patientspb.InsurancePriority_INSURANCE_PRIORITY_SECONDARY,
							EligibilityStatus: insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_INELIGIBLE,
						},
						ConsistencyToken: testDateConsistencyToken,
					},
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc:              "success - empty list insurances received",
			InsuranceRequest:  &patientspb.ListInsurancesRequest{PatientId: proto.String("2")},
			StationHTTPStatus: http.StatusOK,
			StationResponse:   []*patient.StationInsurance{},
			Want:              &patientspb.ListInsurancesResponse{},
			WantGRPCCode:      codes.OK,
		},
		{
			Desc:              "failure - cannot convert StationResponse into Insurance proto",
			InsuranceRequest:  &patientspb.ListInsurancesRequest{PatientId: proto.String("3")},
			StationHTTPStatus: http.StatusOK,
			StationResponse: []*patient.StationInsurance{
				{ID: insuranceStationID},
				{ID: insuranceStationID},
			},
			Want:         &patientspb.ListInsurancesResponse{},
			WantGRPCCode: codes.Internal,
		},
		{
			Desc:              "failure - not found error from Station",
			InsuranceRequest:  &patientspb.ListInsurancesRequest{PatientId: proto.String("3")},
			StationHTTPStatus: http.StatusNotFound,
			Want:              &patientspb.ListInsurancesResponse{},
			WantGRPCCode:      codes.NotFound,
		},
		{
			Desc:              "failure - internal server error from Station",
			InsuranceRequest:  &patientspb.ListInsurancesRequest{PatientId: proto.String("3")},
			StationHTTPStatus: http.StatusInternalServerError,
			Want:              &patientspb.ListInsurancesResponse{},
			WantGRPCCode:      codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				if req.Header.Get("Accept") != acceptHeader {
					t.Fatal("header Accept must be application/vnd.*company-data-covered*.com; version=1")
				}
				rw.WriteHeader(tc.StationHTTPStatus)
				resp, err := json.Marshal(tc.StationResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.Write(resp)
			}))
			defer stationServer.Close()

			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{StationURL: &stationServer.URL})
			req := tc.InsuranceRequest
			resp, err := s.ListInsurances(ctx, req)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			for i := range resp.GetResults() {
				matchProtoWithoutConsistencyToken(t, tc.Want.Results[i], resp.Results[i], "response does not match")
			}
		})
	}
}

func TestHealthCheck(t *testing.T) {
	tcs := []struct {
		Desc         string
		Want         *patientspb.HealthCheckResponse
		WantGRPCCode codes.Code
		HasErr       bool
	}{
		{
			Desc:         "success - patients service is up",
			Want:         &patientspb.HealthCheckResponse{},
			WantGRPCCode: codes.OK,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, _ := setupPatientsGRPCServer(GRPCServerConfig{StationURL: proto.String("dummyurl")})

			_, err := s.HealthCheck(context.Background(), &patientspb.HealthCheckRequest{})
			if err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestUpdateInsurance(t *testing.T) {
	tcs := []struct {
		Desc              string
		InsuranceRequest  *patientspb.UpdateInsuranceRequest
		StationHTTPStatus int
		StationResponse   patient.StationInsurance
		Want              *patientspb.UpdateInsuranceResponse
		WantGRPCCode      codes.Code
	}{
		{
			Desc: "success - insurance updated",
			InsuranceRequest: &patientspb.UpdateInsuranceRequest{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:                insuranceID,
					PatientId:         patientID,
					MemberId:          memberID,
					Priority:          patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
					EligibilityStatus: insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_ELIGIBLE,
				},
			},
			StationHTTPStatus: http.StatusOK,
			StationResponse: patient.StationInsurance{
				ID:        insuranceStationID,
				PatientID: patientStationID,
				MemberID:  memberID,
				Priority:  priority,
				Eligible:  proto.String("Eligible"),
			},
			Want: &patientspb.UpdateInsuranceResponse{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:                insuranceID,
					PatientId:         patientID,
					MemberId:          memberID,
					Priority:          patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
					EligibilityStatus: insurance_eligibility.EligibilityStatus_ELIGIBILITY_STATUS_ELIGIBLE,
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "failure - cannot convert Insurance proto into StationInsurance",
			InsuranceRequest: &patientspb.UpdateInsuranceRequest{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:        insuranceID,
					PatientId: patientID,
					MemberId:  memberID,
				},
			},
			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "failure - cannot convert StationResponse to Insurance proto",
			InsuranceRequest: &patientspb.UpdateInsuranceRequest{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:        insuranceID,
					PatientId: patientID,
					MemberId:  memberID,
					Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_TERTIARY,
				},
			},
			StationHTTPStatus: http.StatusOK,
			StationResponse: patient.StationInsurance{
				ID:       insuranceStationID,
				Priority: priority,
			},
			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "insurance does not exist",
			InsuranceRequest: &patientspb.UpdateInsuranceRequest{
				InsuranceRecord: &patientspb.InsuranceRecord{
					Id:        insuranceID,
					PatientId: patientID,
					MemberId:  memberID,
					Priority:  patientspb.InsurancePriority_INSURANCE_PRIORITY_SECONDARY,
				},
			},
			StationHTTPStatus: http.StatusOK,
			WantGRPCCode:      codes.NotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				rw.WriteHeader(tc.StationHTTPStatus)
				resp, err := json.Marshal(tc.StationResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.Write(resp)
			}))

			defer stationServer.Close()

			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{StationURL: &stationServer.URL})

			resp, err := s.UpdateInsurance(ctx, tc.InsuranceRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			matchWithoutConsistencyToken(t, tc.Want, resp, "response does not match")
		})
	}
}

func TestDeleteInsurance(t *testing.T) {
	tcs := []struct {
		Desc              string
		InsuranceRequest  *patientspb.DeleteInsuranceRequest
		StationResponse   *patient.StationInsurance
		StationHTTPStatus int
		Want              *patientspb.DeleteInsuranceResponse
		WantGRPCCode      codes.Code
	}{
		{
			Desc: "success - insurance deleted",
			InsuranceRequest: &patientspb.DeleteInsuranceRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
			},
			StationHTTPStatus: http.StatusOK,
			StationResponse: &patient.StationInsurance{
				ID:        insuranceStationID,
				PatientID: patientStationID,
				MemberID:  memberID,
				Priority:  priority,
			},
			Want:         &patientspb.DeleteInsuranceResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "insurance does not exist",
			InsuranceRequest: &patientspb.DeleteInsuranceRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
			},
			StationHTTPStatus: http.StatusOK,
			WantGRPCCode:      codes.NotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				rw.WriteHeader(tc.StationHTTPStatus)
				resp, err := json.Marshal(tc.StationResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.Write(resp)
			}))

			defer stationServer.Close()

			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{StationURL: &stationServer.URL})

			resp, err := s.DeleteInsurance(ctx, tc.InsuranceRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			matchWithoutConsistencyToken(t, tc.Want, resp, "response does not match")
		})
	}
}

func TestGetPrimaryCareProvider(t *testing.T) {
	tcs := []struct {
		Desc              string
		StationHTTPStatus int
		StationResponse   *patient.StationPCP
		Want              *patientspb.GetPrimaryCareProviderResponse
		WantGRPCCode      codes.Code
	}{
		{
			Desc:              "success - patient pcp received and is on care team",
			StationHTTPStatus: http.StatusOK,
			StationResponse: &patient.StationPCP{
				PatientHasPCP: hasPcp,
				PrimaryCareProvider: &patient.StationClinicalProvider{
					ClinicalProviderID: clinicalProviderID,
				},
			},
			Want: &patientspb.GetPrimaryCareProviderResponse{
				PatientHasPcp: hasPcp,
				PrimaryCareProvider: &patientspb.PrimaryCareProvider{
					ClinicalProviderId: clinicalProviderID,
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc:              "success - patient pcp received but is not on care team",
			StationHTTPStatus: http.StatusOK,
			StationResponse: &patient.StationPCP{
				PatientHasPCP: hasPcp,
			},
			Want: &patientspb.GetPrimaryCareProviderResponse{
				PatientHasPcp:       hasPcp,
				PrimaryCareProvider: &patientspb.PrimaryCareProvider{},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc:              "patient does not have pcp and is not on care team",
			StationHTTPStatus: http.StatusOK,
			StationResponse: &patient.StationPCP{
				PatientHasPCP: hasNoPcp,
			},
			WantGRPCCode: codes.NotFound,
		},
		{
			Desc:              "pcp does not exist",
			StationHTTPStatus: http.StatusOK,
			WantGRPCCode:      codes.NotFound,
		},
	}

	mustMatch := testutils.MustMatchFn()

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				rw.WriteHeader(tc.StationHTTPStatus)
				resp, err := json.Marshal(tc.StationResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.Write(resp)
			}))

			defer stationServer.Close()

			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{StationURL: &stationServer.URL})

			resp, err := s.GetPrimaryCareProvider(ctx, &patientspb.GetPrimaryCareProviderRequest{PatientId: patientID})
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			mustMatch(t, tc.Want, resp, "response does not match")
		})
	}
}

func TestAddInsuranceImage(t *testing.T) {
	tcs := []struct {
		Desc                  string
		InsuranceImageRequest *patientspb.AddInsuranceImageRequest
		StationResponse       *patient.StationInsuranceWithURL
		StationHTTPStatus     int
		Want                  *patientspb.AddInsuranceImageResponse
		WantGRPCCode          codes.Code
	}{
		{
			Desc: "success - insurance image uploaded",
			InsuranceImageRequest: &patientspb.AddInsuranceImageRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
				CardImage: &patientspb.InsuranceCardImage{
					Image: &patientspb.Image{
						Data: []byte("iVBORw0KGgoAAAANSUhEU=="),
						Type: patientspb.Image_MIME_TYPE_PNG,
					},
					SideType: patientspb.InsuranceCardImage_SIDE_TYPE_FRONT,
				},
				Verified: true,
			},
			StationResponse: &patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:                        insuranceStationID,
					ImageRequiresVerification: proto.Bool(true),
				},
				CardFront: &patient.Card{
					URL: proto.String("https://example.com/front"),
					Thumb: patient.URL{
						URL: proto.String("https://example.com/front-thumb"),
					},
					Small: patient.URL{
						URL: proto.String("https://example.com/front-small"),
					},
				},
			},
			StationHTTPStatus: http.StatusOK,
			Want:              &patientspb.AddInsuranceImageResponse{},
			WantGRPCCode:      codes.OK,
		},
		{
			Desc: "failed - cannot convert Insurance Image proto into StationInsurance",
			InsuranceImageRequest: &patientspb.AddInsuranceImageRequest{
				InsuranceId: insuranceID,
			},
			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "failed - station returns HTTP 422 Unprocessable Entity",
			InsuranceImageRequest: &patientspb.AddInsuranceImageRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
				CardImage: &patientspb.InsuranceCardImage{
					Image: &patientspb.Image{
						Data: []byte("iVBORw0KGgoAAAANSUhEU=="),
						Type: patientspb.Image_MIME_TYPE_PNG,
					},
					SideType: patientspb.InsuranceCardImage_SIDE_TYPE_FRONT,
				},
				Verified: true,
			},
			StationHTTPStatus: http.StatusUnprocessableEntity,
			WantGRPCCode:      codes.InvalidArgument,
		},
	}

	mustMatch := testutils.MustMatchFn()

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				rw.WriteHeader(tc.StationHTTPStatus)
				resp, err := json.Marshal(tc.StationResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.Write(resp)
			}))

			defer stationServer.Close()

			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{StationURL: &stationServer.URL})
			req := tc.InsuranceImageRequest

			addInsuranceImageResp, err := s.AddInsuranceImage(ctx, req)
			respStatus, ok := status.FromError(err)

			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			mustMatch(t, tc.Want, addInsuranceImageResp, "response does not match")
		})
	}
}

func TestUpdatePrimaryCareProvider(t *testing.T) {
	tcs := []struct {
		Desc                       string
		PrimaryCareProviderRequest *patientspb.UpdatePrimaryCareProviderRequest
		StationHTTPStatus          int

		Want         *patientspb.UpdatePrimaryCareProviderResponse
		WantGRPCCode codes.Code
	}{
		{
			Desc: "success - primary care provider updated",
			PrimaryCareProviderRequest: &patientspb.UpdatePrimaryCareProviderRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
			},
			StationHTTPStatus: http.StatusNoContent,

			Want:         &patientspb.UpdatePrimaryCareProviderResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "failed - station returns HTTP 422 Unprocessable Entity",
			PrimaryCareProviderRequest: &patientspb.UpdatePrimaryCareProviderRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
			},
			StationHTTPStatus: http.StatusUnprocessableEntity,

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - patient id is nil",
			PrimaryCareProviderRequest: &patientspb.UpdatePrimaryCareProviderRequest{
				ClinicalProviderId: *clinicalProviderID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - clinical provider id nil",
			PrimaryCareProviderRequest: &patientspb.UpdatePrimaryCareProviderRequest{
				PatientId: *patientID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - patient id is empty",
			PrimaryCareProviderRequest: &patientspb.UpdatePrimaryCareProviderRequest{
				PatientId:          "",
				ClinicalProviderId: *clinicalProviderID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - clinical provider id is empty",
			PrimaryCareProviderRequest: &patientspb.UpdatePrimaryCareProviderRequest{
				PatientId:          *patientID,
				ClinicalProviderId: "",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
	}

	mustMatch := testutils.MustMatchFn()

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				rw.WriteHeader(tc.StationHTTPStatus)
			}))

			defer stationServer.Close()

			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{StationURL: &stationServer.URL})

			resp, err := s.UpdatePrimaryCareProvider(ctx, tc.PrimaryCareProviderRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			mustMatch(t, tc.Want, resp, "response does not match")
		})
	}
}

func TestRemoveInsuranceImage(t *testing.T) {
	tcs := []struct {
		Desc                                  string
		InsuranceImageRequest                 *patientspb.RemoveInsuranceImageRequest
		StationGetInsuranceHTTPStatus         int
		StationGetInsuranceResponse           *patient.StationInsuranceWithURL
		StationRemoveInsuranceImageHTTPStatus int

		Want         *patientspb.RemoveInsuranceImageResponse
		WantGRPCCode codes.Code
	}{
		{
			Desc: "success - insurance front image removed",
			InsuranceImageRequest: &patientspb.RemoveInsuranceImageRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
				ImageType:   patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_FRONT.Enum(),
			},
			StationGetInsuranceHTTPStatus: http.StatusOK,
			StationGetInsuranceResponse: &patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:        insuranceStationID,
					PatientID: patientStationID,
					MemberID:  memberID,
					Priority:  priority,
				},
				CardFront: &patient.Card{
					URL: proto.String("https://example.com/front"),
					Thumb: patient.URL{
						URL: proto.String("https://example.com/front-thumb"),
					},
					Small: patient.URL{
						URL: proto.String("https://example.com/front-small"),
					},
				},
				CardBack: &patient.Card{},
			},
			StationRemoveInsuranceImageHTTPStatus: http.StatusOK,

			Want:         &patientspb.RemoveInsuranceImageResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "success - insurance back image removed",
			InsuranceImageRequest: &patientspb.RemoveInsuranceImageRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
				ImageType:   patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_BACK.Enum(),
			},
			StationGetInsuranceHTTPStatus: http.StatusOK,
			StationGetInsuranceResponse: &patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:        insuranceStationID,
					PatientID: patientStationID,
					MemberID:  memberID,
					Priority:  priority,
				},
				CardFront: &patient.Card{},
				CardBack: &patient.Card{
					URL: proto.String("https://example.com/back"),
					Thumb: patient.URL{
						URL: proto.String("https://example.com/back-thumb"),
					},
					Small: patient.URL{
						URL: proto.String("https://example.com/back-small"),
					},
				},
			},
			StationRemoveInsuranceImageHTTPStatus: http.StatusOK,

			Want:         &patientspb.RemoveInsuranceImageResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "failure - cannot convert Insurance proto into StationInsurance",
			InsuranceImageRequest: &patientspb.RemoveInsuranceImageRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
			},
			StationGetInsuranceHTTPStatus: http.StatusOK,
			StationGetInsuranceResponse: &patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:        insuranceStationID,
					PatientID: patientStationID,
					MemberID:  memberID,
					Priority:  priority,
				},
				CardFront: &patient.Card{},
				CardBack: &patient.Card{
					URL: proto.String("https://example.com/back"),
					Thumb: patient.URL{
						URL: proto.String("https://example.com/back-thumb"),
					},
					Small: patient.URL{
						URL: proto.String("https://example.com/back-small"),
					},
				},
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "insurance does not exist",
			InsuranceImageRequest: &patientspb.RemoveInsuranceImageRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
				ImageType:   patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_BACK.Enum(),
			},
			StationGetInsuranceHTTPStatus: http.StatusOK,
			StationGetInsuranceResponse:   &patient.StationInsuranceWithURL{},

			WantGRPCCode: codes.NotFound,
		},
		{
			Desc: "failure - station returns HTTP 422 Unprocessable Entity",
			InsuranceImageRequest: &patientspb.RemoveInsuranceImageRequest{
				InsuranceId: insuranceID,
				PatientId:   patientID,
				ImageType:   patientspb.InsuranceImageType_INSURANCE_IMAGE_TYPE_FRONT.Enum(),
			},
			StationGetInsuranceHTTPStatus: http.StatusOK,
			StationGetInsuranceResponse: &patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:        insuranceStationID,
					PatientID: patientStationID,
					MemberID:  memberID,
					Priority:  priority,
				},
				CardFront: &patient.Card{},
				CardBack: &patient.Card{
					URL: proto.String("https://example.com/back"),
					Thumb: patient.URL{
						URL: proto.String("https://example.com/back-thumb"),
					},
					Small: patient.URL{
						URL: proto.String("https://example.com/back-small"),
					},
				},
			},
			StationRemoveInsuranceImageHTTPStatus: http.StatusUnprocessableEntity,

			WantGRPCCode: codes.InvalidArgument,
		},
	}

	mustMatch := testutils.MustMatchFn()

	for _, tc := range tcs {
		stationGetInsuranceRespSent := false

		t.Run(tc.Desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				if stationGetInsuranceRespSent {
					rw.WriteHeader(tc.StationRemoveInsuranceImageHTTPStatus)
					return
				}

				rw.WriteHeader(tc.StationGetInsuranceHTTPStatus)
				resp, err := json.Marshal(tc.StationGetInsuranceResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.Write(resp)
				stationGetInsuranceRespSent = true
			}))

			defer stationServer.Close()

			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{StationURL: &stationServer.URL})

			resp, err := s.RemoveInsuranceImage(ctx, tc.InsuranceImageRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			mustMatch(t, tc.Want, resp, "response does not match")
		})
	}
}

func TestDeletePrimaryCareProvider(t *testing.T) {
	tcs := []struct {
		Desc                       string
		PrimaryCareProviderRequest *patientspb.DeletePrimaryCareProviderRequest
		StationHTTPStatus          int

		Want         *patientspb.DeletePrimaryCareProviderResponse
		WantGRPCCode codes.Code
	}{
		{
			Desc: "success - primary care provider deleted",
			PrimaryCareProviderRequest: &patientspb.DeletePrimaryCareProviderRequest{
				PatientId: *patientID,
			},
			StationHTTPStatus: http.StatusNoContent,

			Want:         &patientspb.DeletePrimaryCareProviderResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "failed - station returns HTTP 422 Unprocessable Entity",
			PrimaryCareProviderRequest: &patientspb.DeletePrimaryCareProviderRequest{
				PatientId: *patientID,
			},
			StationHTTPStatus: http.StatusUnprocessableEntity,

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - station returns HTTP 404 Not Found",
			PrimaryCareProviderRequest: &patientspb.DeletePrimaryCareProviderRequest{
				PatientId: *patientID,
			},
			StationHTTPStatus: http.StatusNotFound,

			WantGRPCCode: codes.NotFound,
		},
		{
			Desc: "failed - patient id is empty",
			PrimaryCareProviderRequest: &patientspb.DeletePrimaryCareProviderRequest{
				PatientId: "",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				rw.WriteHeader(tc.StationHTTPStatus)
			}))

			defer stationServer.Close()

			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{StationURL: &stationServer.URL})

			resp, err := s.DeletePrimaryCareProvider(ctx, tc.PrimaryCareProviderRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			testutils.MustMatch(t, tc.Want, resp, "response does not match")
		})
	}
}

func TestUpsertCareTeam(t *testing.T) {
	tcs := []struct {
		Desc                  string
		UpsertCareTeamRequest *patientspb.UpsertCareTeamRequest
		AthenaResponse        *athenapb.UpdateCareTeamResponse
		AthenaError           error
		WantResponse          *patientspb.UpsertCareTeamResponse
		WantGRPCCode          codes.Code
	}{
		{
			Desc: "success - base case",
			UpsertCareTeamRequest: &patientspb.UpsertCareTeamRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       *departmentID,
				RecipientClassId:   *recipientClassID,
			},
			AthenaResponse: &athenapb.UpdateCareTeamResponse{},

			WantResponse: &patientspb.UpsertCareTeamResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "failure - unable to upsert care team member",
			UpsertCareTeamRequest: &patientspb.UpsertCareTeamRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       *departmentID,
				RecipientClassId:   *recipientClassID,
			},
			AthenaResponse: nil,
			AthenaError:    status.Error(codes.NotFound, "Unable to upsert care team member"),

			WantResponse: nil,
			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "failed - patient id is nil",
			UpsertCareTeamRequest: &patientspb.UpsertCareTeamRequest{
				ClinicalProviderId: "1",
				DepartmentId:       "2",
				RecipientClassId:   "3",
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - patient id is empty",
			UpsertCareTeamRequest: &patientspb.UpsertCareTeamRequest{
				PatientId:          "",
				ClinicalProviderId: "1",
				DepartmentId:       "2",
				RecipientClassId:   "3",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - clinical provider id is nil",
			UpsertCareTeamRequest: &patientspb.UpsertCareTeamRequest{
				PatientId:        "1",
				DepartmentId:     "2",
				RecipientClassId: "3",
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - clinical provider id is empty",
			UpsertCareTeamRequest: &patientspb.UpsertCareTeamRequest{
				PatientId:          "1",
				ClinicalProviderId: "",
				DepartmentId:       "2",
				RecipientClassId:   "3",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is nil",
			UpsertCareTeamRequest: &patientspb.UpsertCareTeamRequest{
				PatientId:          "1",
				ClinicalProviderId: "2",
				RecipientClassId:   "3",
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is empty",
			UpsertCareTeamRequest: &patientspb.UpsertCareTeamRequest{
				PatientId:          "1",
				ClinicalProviderId: "2",
				DepartmentId:       "",
				RecipientClassId:   "3",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - recipient class id is nil",
			UpsertCareTeamRequest: &patientspb.UpsertCareTeamRequest{
				PatientId:          "1",
				ClinicalProviderId: "2",
				DepartmentId:       "3",
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - recipient class id is empty",
			UpsertCareTeamRequest: &patientspb.UpsertCareTeamRequest{
				PatientId:          "1",
				ClinicalProviderId: "2",
				DepartmentId:       "3",
				RecipientClassId:   "",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				UpdateCareTeamHandler: func(ctx context.Context, in *athenapb.UpdateCareTeamRequest, opts ...grpc.CallOption) (*athenapb.UpdateCareTeamResponse, error) {
					return tc.AthenaResponse, tc.AthenaError
				},
			}})

			resp, err := s.UpsertCareTeam(ctx, tc.UpsertCareTeamRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			testutils.MustMatch(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

func TestDeleteCareTeam(t *testing.T) {
	tcs := []struct {
		Desc                  string
		DeleteCareTeamRequest *patientspb.DeleteCareTeamRequest
		AthenaResponse        *athenapb.DeleteCareTeamResponse
		AthenaError           error

		WantResponse *patientspb.DeleteCareTeamResponse
		WantGRPCCode codes.Code
	}{
		{
			Desc: "success - base case",
			DeleteCareTeamRequest: &patientspb.DeleteCareTeamRequest{
				PatientId:    *patientID,
				MemberId:     *memberID,
				DepartmentId: *departmentID,
			},
			AthenaResponse: &athenapb.DeleteCareTeamResponse{},

			WantResponse: &patientspb.DeleteCareTeamResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "failure - unable to find care team member by provided data",
			DeleteCareTeamRequest: &patientspb.DeleteCareTeamRequest{
				PatientId:    *patientID,
				MemberId:     *memberID,
				DepartmentId: *departmentID,
			},
			AthenaResponse: nil,
			AthenaError:    status.Error(codes.NotFound, "Unable to find care team member by provided data"),

			WantResponse: nil,
			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "failed - patient id is nil",
			DeleteCareTeamRequest: &patientspb.DeleteCareTeamRequest{
				MemberId:     "1",
				DepartmentId: "2",
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - patient id is empty",
			DeleteCareTeamRequest: &patientspb.DeleteCareTeamRequest{
				PatientId:    "",
				MemberId:     "1",
				DepartmentId: "2",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - member id is nil",
			DeleteCareTeamRequest: &patientspb.DeleteCareTeamRequest{
				PatientId:    "1",
				DepartmentId: "2",
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - member id is empty",
			DeleteCareTeamRequest: &patientspb.DeleteCareTeamRequest{
				PatientId:    "1",
				MemberId:     "",
				DepartmentId: "2",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is nil",
			DeleteCareTeamRequest: &patientspb.DeleteCareTeamRequest{
				PatientId: "1",
				MemberId:  "2",
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is empty",
			DeleteCareTeamRequest: &patientspb.DeleteCareTeamRequest{
				PatientId:    "1",
				MemberId:     "2",
				DepartmentId: "",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				DeleteCareTeamHandler: func(ctx context.Context, in *athenapb.DeleteCareTeamRequest, opts ...grpc.CallOption) (*athenapb.DeleteCareTeamResponse, error) {
					return tc.AthenaResponse, tc.AthenaError
				},
			}})

			resp, err := s.DeleteCareTeam(ctx, tc.DeleteCareTeamRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			testutils.MustMatch(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

func TestUpdateDefaultPharmacy(t *testing.T) {
	tcs := []struct {
		Desc                   string
		DefaultPharmacyRequest *patientspb.UpdateDefaultPharmacyRequest
		AthenaResponse         *athenapb.UpdateDefaultPharmacyResponse
		AthenaError            error
		WantResponse           *patientspb.UpdateDefaultPharmacyResponse
		WantGRPCCode           codes.Code
	}{
		{
			Desc: "success - base case",
			DefaultPharmacyRequest: &patientspb.UpdateDefaultPharmacyRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       *departmentID,
			},
			AthenaResponse: &athenapb.UpdateDefaultPharmacyResponse{},

			WantResponse: &patientspb.UpdateDefaultPharmacyResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "failure - unable to update default pharmacy",
			DefaultPharmacyRequest: &patientspb.UpdateDefaultPharmacyRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       *departmentID,
			},
			AthenaResponse: nil,
			AthenaError:    status.Error(codes.NotFound, "Unable to update default pharmacy"),

			WantResponse: nil,
			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "failed - patient id is nil",
			DefaultPharmacyRequest: &patientspb.UpdateDefaultPharmacyRequest{
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       *departmentID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - patient id is empty",
			DefaultPharmacyRequest: &patientspb.UpdateDefaultPharmacyRequest{
				PatientId:          "",
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       *departmentID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - clinical provider id is nil",
			DefaultPharmacyRequest: &patientspb.UpdateDefaultPharmacyRequest{
				PatientId:    *patientID,
				DepartmentId: *departmentID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - clinical provider id is empty",
			DefaultPharmacyRequest: &patientspb.UpdateDefaultPharmacyRequest{
				PatientId:          *patientID,
				ClinicalProviderId: "",
				DepartmentId:       *departmentID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is nil",
			DefaultPharmacyRequest: &patientspb.UpdateDefaultPharmacyRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is empty",
			DefaultPharmacyRequest: &patientspb.UpdateDefaultPharmacyRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       "",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				UpdateDefaultPharmacyHandler: func(ctx context.Context, in *athenapb.UpdateDefaultPharmacyRequest, opts ...grpc.CallOption) (*athenapb.UpdateDefaultPharmacyResponse, error) {
					return tc.AthenaResponse, tc.AthenaError
				},
			}})

			resp, err := s.UpdateDefaultPharmacy(ctx, tc.DefaultPharmacyRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			testutils.MustMatch(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

func TestGetDefaultPharmacy(t *testing.T) {
	defaultPharmacy := &athenapb.Pharmacy{
		PharmacyType:    proto.String("RETAIL"),
		DefaultPharmacy: proto.String("true"),
		Address: &common.Address{
			State:          proto.String("CO"),
			City:           proto.String("Littleton"),
			ZipCode:        proto.String("801232101"),
			AddressLineOne: proto.String("1234 W Belleview"),
			AddressLineTwo: nil,
		},
		ClinicalProvider: &athenapb.ClinicalProvider{
			Id:   proto.String("10812345"),
			Name: proto.String("King Soopers Pharmacy 62000050"),
		},
		ReceiverType: nil,
		AcceptFax:    proto.String("true"),
		PhoneNumber: &common.PhoneNumber{
			PhoneNumberType: common.PhoneNumber_PHONE_NUMBER_TYPE_WORK,
			CountryCode:     proto.Int32(1),
			PhoneNumber:     proto.String("(303) 123-1234"),
		},
		FaxNumber: proto.String("3031231234"),
	}
	tcs := []struct {
		Desc                   string
		DefaultPharmacyRequest *patientspb.GetDefaultPharmacyRequest
		AthenaResponse         *athenapb.GetDefaultPharmacyResponse
		AthenaError            error
		WantResponse           *patientspb.GetDefaultPharmacyResponse
		WantGRPCCode           codes.Code
	}{
		{
			Desc: "success - base case",
			DefaultPharmacyRequest: &patientspb.GetDefaultPharmacyRequest{
				DepartmentId: *departmentID,
				PatientId:    *patientID,
			},
			AthenaResponse: &athenapb.GetDefaultPharmacyResponse{
				Pharmacy: defaultPharmacy,
			},

			WantResponse: &patientspb.GetDefaultPharmacyResponse{
				Pharmacy: defaultPharmacy,
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "failed - patient id is nil",
			DefaultPharmacyRequest: &patientspb.GetDefaultPharmacyRequest{
				DepartmentId: *departmentID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - patient id is empty",
			DefaultPharmacyRequest: &patientspb.GetDefaultPharmacyRequest{
				PatientId:    "",
				DepartmentId: *departmentID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is nil",
			DefaultPharmacyRequest: &patientspb.GetDefaultPharmacyRequest{
				PatientId: *patientID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is empty",
			DefaultPharmacyRequest: &patientspb.GetDefaultPharmacyRequest{
				PatientId:    *patientID,
				DepartmentId: "",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failure - unable to get default pharmacy",
			DefaultPharmacyRequest: &patientspb.GetDefaultPharmacyRequest{
				DepartmentId: *departmentID,
				PatientId:    *patientID,
			},
			AthenaResponse: nil,
			AthenaError:    status.Error(codes.NotFound, "Unable to get default pharmacy"),

			WantResponse: nil,
			WantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				GetDefaultPharmacyHandler: func(ctx context.Context, in *athenapb.GetDefaultPharmacyRequest, opts ...grpc.CallOption) (*athenapb.GetDefaultPharmacyResponse, error) {
					return tc.AthenaResponse, tc.AthenaError
				},
			}})

			resp, err := s.GetDefaultPharmacy(ctx, tc.DefaultPharmacyRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			testutils.MustMatch(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

func TestGetPreferredPharmacy(t *testing.T) {
	pharmaciesList := []*athenapb.Pharmacy{
		{
			PharmacyType:    proto.String("RETAIL"),
			DefaultPharmacy: proto.String("true"),
			Address: &common.Address{
				State:          proto.String("CO"),
				City:           proto.String("Littleton"),
				ZipCode:        proto.String("801232101"),
				AddressLineOne: proto.String("1234 W Belleview"),
				AddressLineTwo: nil,
			},
			ClinicalProvider: &athenapb.ClinicalProvider{
				Id:   proto.String("10812345"),
				Name: proto.String("King Soopers Pharmacy 62000050"),
			},
			ReceiverType: nil,
			AcceptFax:    proto.String("true"),
			PhoneNumber: &common.PhoneNumber{
				PhoneNumberType: common.PhoneNumber_PHONE_NUMBER_TYPE_WORK,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(303) 123-1234"),
			},
			FaxNumber: proto.String("3031231234"),
		},
	}
	tcs := []struct {
		Desc                     string
		PreferredPharmacyRequest *patientspb.GetPreferredPharmaciesRequest
		AthenaResponse           *athenapb.GetPreferredPharmaciesResponse

		WantResponse *patientspb.GetPreferredPharmaciesResponse
		WantGRPCCode codes.Code
	}{
		{
			Desc: "success - base case",
			PreferredPharmacyRequest: &patientspb.GetPreferredPharmaciesRequest{
				DepartmentId: *departmentID,
				PatientId:    *patientID,
			},
			AthenaResponse: &athenapb.GetPreferredPharmaciesResponse{
				Pharmacies: pharmaciesList,
			},

			WantResponse: &patientspb.GetPreferredPharmaciesResponse{
				Pharmacies: pharmaciesList,
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "failed - patient id is nil",
			PreferredPharmacyRequest: &patientspb.GetPreferredPharmaciesRequest{
				DepartmentId: *departmentID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - patient id is empty",
			PreferredPharmacyRequest: &patientspb.GetPreferredPharmaciesRequest{
				PatientId:    "",
				DepartmentId: *departmentID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is nil",
			PreferredPharmacyRequest: &patientspb.GetPreferredPharmaciesRequest{
				PatientId: *patientID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is empty",
			PreferredPharmacyRequest: &patientspb.GetPreferredPharmaciesRequest{
				PatientId:    *patientID,
				DepartmentId: "",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				GetPreferredPharmaciesHandler: func(ctx context.Context, in *athenapb.GetPreferredPharmaciesRequest, opts ...grpc.CallOption) (*athenapb.GetPreferredPharmaciesResponse, error) {
					return tc.AthenaResponse, nil
				},
			}})

			resp, err := s.GetPreferredPharmacies(ctx, tc.PreferredPharmacyRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			testutils.MustMatch(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

func TestDeletePreferredPharmacy(t *testing.T) {
	tcs := []struct {
		Desc                     string
		PreferredPharmacyRequest *patientspb.DeletePreferredPharmacyRequest
		AthenaResponse           *athenapb.DeletePreferredPharmacyResponse
		AthenaError              error
		WantResponse             *patientspb.DeletePreferredPharmacyResponse
		WantGRPCCode             codes.Code
	}{
		{
			Desc: "success - base case",
			PreferredPharmacyRequest: &patientspb.DeletePreferredPharmacyRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       *departmentID,
			},
			AthenaResponse: &athenapb.DeletePreferredPharmacyResponse{},

			WantResponse: &patientspb.DeletePreferredPharmacyResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "failure - unable to delete preferred pharmacy",
			PreferredPharmacyRequest: &patientspb.DeletePreferredPharmacyRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       *departmentID,
			},
			AthenaResponse: nil,
			AthenaError:    status.Error(codes.NotFound, "Unable to delete preferred pharmacy"),

			WantResponse: nil,
			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "failed - patient id is nil",
			PreferredPharmacyRequest: &patientspb.DeletePreferredPharmacyRequest{
				DepartmentId:       *departmentID,
				ClinicalProviderId: *clinicalProviderID,
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - patient id is empty",
			PreferredPharmacyRequest: &patientspb.DeletePreferredPharmacyRequest{
				PatientId:          "",
				DepartmentId:       *departmentID,
				ClinicalProviderId: *clinicalProviderID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is nil",
			PreferredPharmacyRequest: &patientspb.DeletePreferredPharmacyRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is empty",
			PreferredPharmacyRequest: &patientspb.DeletePreferredPharmacyRequest{
				PatientId:          *patientID,
				DepartmentId:       "",
				ClinicalProviderId: *clinicalProviderID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - clinical provider id is nil",
			PreferredPharmacyRequest: &patientspb.DeletePreferredPharmacyRequest{
				PatientId:    *patientID,
				DepartmentId: *departmentID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - clinical provider id is empty",
			PreferredPharmacyRequest: &patientspb.DeletePreferredPharmacyRequest{
				PatientId:          *patientID,
				DepartmentId:       *departmentID,
				ClinicalProviderId: "",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				DeletePreferredPharmacyHandler: func(ctx context.Context, in *athenapb.DeletePreferredPharmacyRequest, opts ...grpc.CallOption) (*athenapb.DeletePreferredPharmacyResponse, error) {
					return tc.AthenaResponse, tc.AthenaError
				},
			}})

			resp, err := s.DeletePreferredPharmacy(ctx, tc.PreferredPharmacyRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			testutils.MustMatch(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

func TestUpdatePreferredPharmacy(t *testing.T) {
	tcs := []struct {
		Desc                     string
		PreferredPharmacyRequest *patientspb.UpdatePreferredPharmacyRequest
		AthenaResponse           *athenapb.UpdatePreferredPharmacyResponse
		AthenaError              error
		WantResponse             *patientspb.UpdatePreferredPharmacyResponse
		WantGRPCCode             codes.Code
	}{
		{
			Desc: "success - base case",
			PreferredPharmacyRequest: &patientspb.UpdatePreferredPharmacyRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       *departmentID,
			},
			AthenaResponse: &athenapb.UpdatePreferredPharmacyResponse{},

			WantResponse: &patientspb.UpdatePreferredPharmacyResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "failure - unable to update preferred pharmacy",
			PreferredPharmacyRequest: &patientspb.UpdatePreferredPharmacyRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       *departmentID,
			},
			AthenaResponse: nil,
			AthenaError:    status.Error(codes.NotFound, "Unable to update preferred pharmacy"),

			WantResponse: nil,
			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "failed - patient id is nil",
			PreferredPharmacyRequest: &patientspb.UpdatePreferredPharmacyRequest{
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       *departmentID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - patient id is empty",
			PreferredPharmacyRequest: &patientspb.UpdatePreferredPharmacyRequest{
				PatientId:          "",
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       *departmentID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - clinical provider id is nil",
			PreferredPharmacyRequest: &patientspb.UpdatePreferredPharmacyRequest{
				PatientId:    *patientID,
				DepartmentId: *departmentID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - clinical provider id is empty",
			PreferredPharmacyRequest: &patientspb.UpdatePreferredPharmacyRequest{
				PatientId:          *patientID,
				ClinicalProviderId: "",
				DepartmentId:       *departmentID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is nil",
			PreferredPharmacyRequest: &patientspb.UpdatePreferredPharmacyRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed - department id is empty",
			PreferredPharmacyRequest: &patientspb.UpdatePreferredPharmacyRequest{
				PatientId:          *patientID,
				ClinicalProviderId: *clinicalProviderID,
				DepartmentId:       "",
			},

			WantGRPCCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				UpdatePreferredPharmacyHandler: func(ctx context.Context, in *athenapb.UpdatePreferredPharmacyRequest, opts ...grpc.CallOption) (*athenapb.UpdatePreferredPharmacyResponse, error) {
					return tc.AthenaResponse, tc.AthenaError
				},
			}})

			resp, err := s.UpdatePreferredPharmacy(ctx, tc.PreferredPharmacyRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			testutils.MustMatch(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

func TestListPatients(t *testing.T) {
	tcs := []struct {
		Desc                    string
		ListPatientsRequest     *patientspb.ListPatientsRequest
		AthenaResponse          *athenapb.EnhancedBestMatchResponse
		AthenaError             error
		StationPatientsResponse *stationpatientspb.ListPatientsResponse
		StationPatientsError    error
		WantResponse            *patientspb.ListPatientsResponse
		WantGRPCCode            codes.Code
	}{
		{
			Desc: "base case",
			ListPatientsRequest: &patientspb.ListPatientsRequest{
				FirstName: "Dan",
				LastName:  "Cooper",
				DateOfBirth: &common.Date{
					Year:  2007,
					Month: 11,
					Day:   1,
				},
				ChannelItemIds: []int64{1094},
				PartnerId:      "1",
			},
			AthenaResponse: &athenapb.EnhancedBestMatchResponse{Results: []*athenapb.EnhancedBestMatchResult{
				{Patient: &athenapb.Patient{
					PatientId: proto.String("1"),
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					DateOfBirth: &common.Date{
						Year:  2007,
						Month: 11,
						Day:   1,
					},
				}},
			}},
			StationPatientsResponse: &stationpatientspb.ListPatientsResponse{Patients: []*stationpatientspb.Patient{
				{
					Id:            1,
					ChannelItemId: proto.Int64(2),
					SourceType:    proto.String("Type"),
					PartnerId:     proto.String("3"),
					EhrId:         proto.String("1"),
				},
			}},
			WantResponse: &patientspb.ListPatientsResponse{
				Results: []*patientspb.ListPatientsResult{
					{
						Patient: &common.Patient{
							Id: proto.String("1"),
							PrimaryIdentifier: &common.PatientRecordIdentifier{
								Source:   1,
								RecordId: "1",
							},
							Name: &common.Name{
								GivenName:  proto.String("Dan"),
								FamilyName: proto.String("Cooper"),
							},
							DateOfBirth: &common.Date{
								Year:  2007,
								Month: 11,
								Day:   1,
							},
							ChannelItemId: proto.Int64(2),
							SourceType:    proto.String("Type"),
							PartnerId:     proto.String("3"),
						},
					},
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "without channel item ids or partner id",
			ListPatientsRequest: &patientspb.ListPatientsRequest{
				FirstName: "Dan",
				LastName:  "Cooper",
				DateOfBirth: &common.Date{
					Year:  2007,
					Month: 11,
					Day:   1,
				},
			},
			AthenaResponse: &athenapb.EnhancedBestMatchResponse{Results: []*athenapb.EnhancedBestMatchResult{
				{Patient: &athenapb.Patient{
					PatientId: proto.String("1"),
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					DateOfBirth: &common.Date{
						Year:  2007,
						Month: 11,
						Day:   1,
					},
				}},
			}},
			StationPatientsResponse: &stationpatientspb.ListPatientsResponse{Patients: []*stationpatientspb.Patient{
				{
					Id:            1,
					ChannelItemId: proto.Int64(2),
					SourceType:    proto.String("Type"),
					PartnerId:     proto.String("3"),
					EhrId:         proto.String("1"),
				},
			}},
			WantResponse: &patientspb.ListPatientsResponse{
				Results: []*patientspb.ListPatientsResult{
					{
						Patient: &common.Patient{
							Id: proto.String("1"),
							PrimaryIdentifier: &common.PatientRecordIdentifier{
								Source:   1,
								RecordId: "1",
							},
							Name: &common.Name{
								GivenName:  proto.String("Dan"),
								FamilyName: proto.String("Cooper"),
							},
							DateOfBirth: &common.Date{
								Year:  2007,
								Month: 11,
								Day:   1,
							},
							ChannelItemId: proto.Int64(2),
							SourceType:    proto.String("Type"),
							PartnerId:     proto.String("3"),
						},
					},
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "multiple station patients for EHR id",
			ListPatientsRequest: &patientspb.ListPatientsRequest{
				FirstName: "Dan",
				LastName:  "Cooper",
				DateOfBirth: &common.Date{
					Year:  2007,
					Month: 11,
					Day:   1,
				},
			},
			AthenaResponse: &athenapb.EnhancedBestMatchResponse{Results: []*athenapb.EnhancedBestMatchResult{
				{Patient: &athenapb.Patient{
					PatientId: proto.String("1"),
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					DateOfBirth: &common.Date{
						Year:  2007,
						Month: 11,
						Day:   1,
					},
				}},
			}},
			StationPatientsResponse: &stationpatientspb.ListPatientsResponse{Patients: []*stationpatientspb.Patient{
				{
					Id:            1,
					ChannelItemId: proto.Int64(2),
					SourceType:    proto.String("Type"),
					PartnerId:     proto.String("3"),
					EhrId:         proto.String("1"),
				},
				{
					Id:            2,
					ChannelItemId: proto.Int64(3),
					SourceType:    proto.String("Type"),
					PartnerId:     proto.String("4"),
					EhrId:         proto.String("1"),
				},
			}},
			WantResponse: &patientspb.ListPatientsResponse{
				Results: []*patientspb.ListPatientsResult{
					{
						Patient: &common.Patient{
							Id: proto.String("1"),
							PrimaryIdentifier: &common.PatientRecordIdentifier{
								Source:   1,
								RecordId: "1",
							},
							Name: &common.Name{
								GivenName:  proto.String("Dan"),
								FamilyName: proto.String("Cooper"),
							},
							DateOfBirth: &common.Date{
								Year:  2007,
								Month: 11,
								Day:   1,
							},
							ChannelItemId: proto.Int64(2),
							SourceType:    proto.String("Type"),
							PartnerId:     proto.String("3"),
						},
					},
					{
						Patient: &common.Patient{
							Id: proto.String("2"),
							PrimaryIdentifier: &common.PatientRecordIdentifier{
								Source:   1,
								RecordId: "1",
							},
							Name: &common.Name{
								GivenName:  proto.String("Dan"),
								FamilyName: proto.String("Cooper"),
							},
							DateOfBirth: &common.Date{
								Year:  2007,
								Month: 11,
								Day:   1,
							},
							ChannelItemId: proto.Int64(3),
							SourceType:    proto.String("Type"),
							PartnerId:     proto.String("4"),
						},
					},
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "empty first name",
			ListPatientsRequest: &patientspb.ListPatientsRequest{
				FirstName: "",
				LastName:  "Cooper",
				DateOfBirth: &common.Date{
					Year:  2007,
					Month: 11,
					Day:   1,
				},
				ChannelItemIds: []int64{1094},
				PartnerId:      "1",
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "empty last name",
			ListPatientsRequest: &patientspb.ListPatientsRequest{
				FirstName: "Dan",
				LastName:  "",
				DateOfBirth: &common.Date{
					Year:  2007,
					Month: 11,
					Day:   1,
				},
				ChannelItemIds: []int64{1094},
				PartnerId:      "1",
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "nil date of birth",
			ListPatientsRequest: &patientspb.ListPatientsRequest{
				FirstName:      "Dan",
				LastName:       "",
				DateOfBirth:    nil,
				ChannelItemIds: []int64{1094},
				PartnerId:      "1",
			},
			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed to convert patient proto",
			ListPatientsRequest: &patientspb.ListPatientsRequest{
				FirstName: "Dan",
				LastName:  "Cooper",
				DateOfBirth: &common.Date{
					Year:  2007,
					Month: 11,
					Day:   1,
				},
				ChannelItemIds: []int64{1094},
				PartnerId:      "1",
			},
			AthenaResponse: &athenapb.EnhancedBestMatchResponse{Results: []*athenapb.EnhancedBestMatchResult{
				{Patient: &athenapb.Patient{PatientId: proto.String("1")}},
			}},
			StationPatientsResponse: &stationpatientspb.ListPatientsResponse{
				Patients: []*stationpatientspb.Patient{
					{
						Id:            1,
						ChannelItemId: proto.Int64(2),
						SourceType:    proto.String("Type"),
						PartnerId:     proto.String("3"),
						EhrId:         proto.String("different_than_athena_response_id"),
					},
				},
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "empty Athena response",
			ListPatientsRequest: &patientspb.ListPatientsRequest{
				FirstName: "Dan",
				LastName:  "Cooper",
				DateOfBirth: &common.Date{
					Year:  2007,
					Month: 11,
					Day:   1,
				},
				ChannelItemIds: []int64{1094},
				PartnerId:      "1",
			},
			AthenaResponse: &athenapb.EnhancedBestMatchResponse{Results: nil},
			StationPatientsResponse: &stationpatientspb.ListPatientsResponse{
				Patients: []*stationpatientspb.Patient{}},
			WantResponse: &patientspb.ListPatientsResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "could not find patients at Athena",
			ListPatientsRequest: &patientspb.ListPatientsRequest{
				FirstName: "Dan",
				LastName:  "Cooper",
				DateOfBirth: &common.Date{
					Year:  2007,
					Month: 11,
					Day:   1,
				},
				ChannelItemIds: []int64{1094},
				PartnerId:      "1",
			},
			AthenaError: status.Error(codes.NotFound, "Unable to find patients"),
			StationPatientsResponse: &stationpatientspb.ListPatientsResponse{
				Patients: []*stationpatientspb.Patient{}},
			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "could not find patients at station",
			ListPatientsRequest: &patientspb.ListPatientsRequest{
				FirstName: "Dan",
				LastName:  "Cooper",
				DateOfBirth: &common.Date{
					Year:  2007,
					Month: 11,
					Day:   1,
				},
				ChannelItemIds: []int64{1094},
				PartnerId:      "1",
			},
			AthenaResponse: &athenapb.EnhancedBestMatchResponse{Results: []*athenapb.EnhancedBestMatchResult{
				{Patient: &athenapb.Patient{
					PatientId: proto.String("1"),
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					DateOfBirth: &common.Date{
						Year:  2007,
						Month: 11,
						Day:   1,
					},
				}},
			}},
			StationPatientsError: status.Error(codes.NotFound, "Unable to find patients"),
			WantGRPCCode:         codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				EnhancedBestMatchHandler: func(ctx context.Context, in *athenapb.EnhancedBestMatchRequest, opts ...grpc.CallOption) (*athenapb.EnhancedBestMatchResponse, error) {
					return tc.AthenaResponse, tc.AthenaError
				},
			}, StationPatientsClient: &StationPatientsClientMock{ListPatientsHandler: func(ctx context.Context, in *stationpatientspb.ListPatientsRequest, opts ...grpc.CallOption) (*stationpatientspb.ListPatientsResponse, error) {
				return tc.StationPatientsResponse, tc.StationPatientsError
			}}})

			resp, err := s.ListPatients(ctx, tc.ListPatientsRequest)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if respStatus.Code() != tc.WantGRPCCode {
				t.Errorf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			for i := range resp.GetResults() {
				matchProtoWithoutConsistencyToken(t, tc.WantResponse.Results[i], resp.Results[i], "response does not match")
			}
		})
	}
}

func TestCreatePatient(t *testing.T) {
	tcs := []struct {
		Desc                                   string
		CreatePatientRequest                   *patientspb.CreatePatientRequest
		AthenaResponse                         *athenapb.CreatePatientResponse
		AthenaPatient                          *athenapb.GetPatientResponse
		AthenaEBMResponse                      *athenapb.EnhancedBestMatchResponse
		AthenaError                            error
		StationPatientsResponse                *stationpatientspb.FindOrCreatePatientResponse
		StationPatientsError                   error
		StationPatientsGetDepartmentIDResponse *stationpatientspb.GetDepartmentIDByBillingCityIDResponse
		StationPatientsGetDepartmentIDError    error
		UpdateStationPatientResponse           *stationpatientspb.UpdatePatientResponse
		UpdateStationPatientError              error
		GetPatientResponse                     *stationpatientspb.GetPatientResponse
		DataDogRecorder                        *monitoring.DataDogRecorder

		WantResponse *patientspb.CreatePatientResponse
		WantGRPCCode codes.Code
	}{
		{
			Desc: "base case",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: getCreatePatientRequestPatient(),
			},
			GetPatientResponse:                     &stationpatientspb.GetPatientResponse{Patient: getExampleStationPatientProto()},
			AthenaResponse:                         &athenapb.CreatePatientResponse{PatientId: proto.String("12")},
			StationPatientsResponse:                &stationpatientspb.FindOrCreatePatientResponse{PatientId: 123},
			StationPatientsGetDepartmentIDResponse: &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{DepartmentId: "5"},
			AthenaPatient: &athenapb.GetPatientResponse{Patient: &athenapb.Patient{
				PatientId: proto.String("123"),
				Name: &common.Name{
					GivenName:  proto.String("Dan"),
					FamilyName: proto.String("Cooper"),
				},
				ContactInfo: &athenapb.ContactInfo{
					MobileNumber: &common.PhoneNumber{
						PhoneNumberType: 2,
						CountryCode:     proto.Int32(1),
						PhoneNumber:     proto.String("(555) 555-5555"),
					},
					Email: proto.String("dan.cooper@example.com"),
				},
			}},
			AthenaEBMResponse: &athenapb.EnhancedBestMatchResponse{Results: nil},

			WantResponse: &patientspb.CreatePatientResponse{
				Patient: &common.Patient{
					Id: proto.String("1234"),
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					PatientSafetyFlag: &common.PatientSafetyFlag{
						FlaggerUserId: "111",
						Type:          1,
						Reason:        proto.String("Narcotic Dependence"),
					},
					PrimaryIdentifier: &common.PatientRecordIdentifier{
						Source:   1,
						RecordId: "123",
					},
					ContactInfo: &common.ContactInfo{
						MobileNumber: &common.PhoneNumber{
							PhoneNumberType: 2,
							CountryCode:     proto.Int32(1),
							PhoneNumber:     proto.String("(555) 555-5555"),
						},
						Email: proto.String("dan.cooper@example.com"),
					},
					MedicalPowerOfAttorney: &common.MedicalPowerOfAttorney{
						Name: &common.Name{
							PreferredName: proto.String("Ruth Seiger"),
						},
						ContactInfo: &common.ContactInfo{
							HomeNumber: &common.PhoneNumber{
								PhoneNumberType: 1,
								CountryCode:     proto.Int32(1),
								PhoneNumber:     proto.String("(303) 555-1234"),
							},
						},
						PatientRelation: &common.PatientRelation{
							Relation:          3,
							OtherRelationText: proto.String("family"),
						},
						Id: mpoaID,
					},
					ChannelItemId:    proto.Int64(123),
					SourceType:       proto.String("phone"),
					PartnerId:        proto.String("456"),
					VoicemailConsent: proto.Bool(true),
					BillingCity:      &common.BillingCity{Id: "5"},
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "Athena patient is found via EBM with int score",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: getCreatePatientRequestPatient(),
			},
			GetPatientResponse:                     &stationpatientspb.GetPatientResponse{Patient: getExampleStationPatientProto()},
			StationPatientsResponse:                &stationpatientspb.FindOrCreatePatientResponse{PatientId: 123},
			StationPatientsGetDepartmentIDResponse: &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{DepartmentId: "5"},
			AthenaPatient: &athenapb.GetPatientResponse{Patient: &athenapb.Patient{
				PatientId: proto.String("123"),
				Name: &common.Name{
					GivenName:  proto.String("Dan"),
					FamilyName: proto.String("Cooper"),
				},
				ContactInfo: &athenapb.ContactInfo{
					MobileNumber: &common.PhoneNumber{
						PhoneNumberType: 2,
						CountryCode:     proto.Int32(1),
						PhoneNumber:     proto.String("(555) 555-5555"),
					},
					Email: proto.String("dan.cooper@example.com"),
				},
			}},
			AthenaEBMResponse: &athenapb.EnhancedBestMatchResponse{Results: []*athenapb.EnhancedBestMatchResult{
				{Patient: &athenapb.Patient{
					PatientId: proto.String("456"),
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					DateOfBirth: &common.Date{
						Year:  2007,
						Month: 11,
						Day:   1,
					},
				},
					ScoreString: *proto.String("26"),
				},
			}},

			WantResponse: &patientspb.CreatePatientResponse{
				Patient: &common.Patient{
					Id: proto.String("1234"),
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					PatientSafetyFlag: &common.PatientSafetyFlag{
						FlaggerUserId: "111",
						Type:          1,
						Reason:        proto.String("Narcotic Dependence"),
					},
					PrimaryIdentifier: &common.PatientRecordIdentifier{
						Source:   1,
						RecordId: "123",
					},
					ContactInfo: &common.ContactInfo{
						MobileNumber: &common.PhoneNumber{
							PhoneNumberType: 2,
							CountryCode:     proto.Int32(1),
							PhoneNumber:     proto.String("(555) 555-5555"),
						},
						Email: proto.String("dan.cooper@example.com"),
					},
					MedicalPowerOfAttorney: &common.MedicalPowerOfAttorney{
						Name: &common.Name{
							PreferredName: proto.String("Ruth Seiger"),
						},
						ContactInfo: &common.ContactInfo{
							HomeNumber: &common.PhoneNumber{
								PhoneNumberType: 1,
								CountryCode:     proto.Int32(1),
								PhoneNumber:     proto.String("(303) 555-1234"),
							},
						},
						PatientRelation: &common.PatientRelation{
							Relation:          3,
							OtherRelationText: proto.String("family"),
						},
						Id: mpoaID,
					},
					ChannelItemId:    proto.Int64(123),
					SourceType:       proto.String("phone"),
					PartnerId:        proto.String("456"),
					VoicemailConsent: proto.Bool(true),
					BillingCity:      &common.BillingCity{Id: "5"},
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "Athena patient is found via EBM with float score",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: getCreatePatientRequestPatient(),
			},
			GetPatientResponse:                     &stationpatientspb.GetPatientResponse{Patient: getExampleStationPatientProto()},
			StationPatientsResponse:                &stationpatientspb.FindOrCreatePatientResponse{PatientId: 123},
			StationPatientsGetDepartmentIDResponse: &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{DepartmentId: "5"},
			AthenaPatient: &athenapb.GetPatientResponse{Patient: &athenapb.Patient{
				PatientId: proto.String("123"),
				Name: &common.Name{
					GivenName:  proto.String("Dan"),
					FamilyName: proto.String("Cooper"),
				},
				ContactInfo: &athenapb.ContactInfo{
					MobileNumber: &common.PhoneNumber{
						PhoneNumberType: 2,
						CountryCode:     proto.Int32(1),
						PhoneNumber:     proto.String("(555) 555-5555"),
					},
					Email: proto.String("dan.cooper@example.com"),
				},
			}},
			AthenaEBMResponse: &athenapb.EnhancedBestMatchResponse{Results: []*athenapb.EnhancedBestMatchResult{
				{Patient: &athenapb.Patient{
					PatientId: proto.String("456"),
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					DateOfBirth: &common.Date{
						Year:  2007,
						Month: 11,
						Day:   1,
					},
				},
					ScoreString: *proto.String("26.7"),
				},
			}},
			DataDogRecorder: &monitoring.DataDogRecorder{Client: &monitoring.MockStatsDClient{}},

			WantResponse: &patientspb.CreatePatientResponse{
				Patient: &common.Patient{
					Id: proto.String("1234"),
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					PatientSafetyFlag: &common.PatientSafetyFlag{
						FlaggerUserId: "111",
						Type:          1,
						Reason:        proto.String("Narcotic Dependence"),
					},
					PrimaryIdentifier: &common.PatientRecordIdentifier{
						Source:   1,
						RecordId: "123",
					},
					ContactInfo: &common.ContactInfo{
						MobileNumber: &common.PhoneNumber{
							PhoneNumberType: 2,
							CountryCode:     proto.Int32(1),
							PhoneNumber:     proto.String("(555) 555-5555"),
						},
						Email: proto.String("dan.cooper@example.com"),
					},
					MedicalPowerOfAttorney: &common.MedicalPowerOfAttorney{
						Name: &common.Name{
							PreferredName: proto.String("Ruth Seiger"),
						},
						ContactInfo: &common.ContactInfo{
							HomeNumber: &common.PhoneNumber{
								PhoneNumberType: 1,
								CountryCode:     proto.Int32(1),
								PhoneNumber:     proto.String("(303) 555-1234"),
							},
						},
						PatientRelation: &common.PatientRelation{
							Relation:          3,
							OtherRelationText: proto.String("family"),
						},
						Id: mpoaID,
					},
					ChannelItemId:    proto.Int64(123),
					SourceType:       proto.String("phone"),
					PartnerId:        proto.String("456"),
					VoicemailConsent: proto.Bool(true),
					BillingCity:      &common.BillingCity{Id: "5"},
				},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc: "Athena EBM returns more than 1 patient",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: getCreatePatientRequestPatient(),
			},
			AthenaEBMResponse: &athenapb.EnhancedBestMatchResponse{
				Results: []*athenapb.EnhancedBestMatchResult{
					{Patient: &athenapb.Patient{PatientId: proto.String("A1234")}},
					{Patient: &athenapb.Patient{PatientId: proto.String("A1234")}},
				},
			},

			WantGRPCCode: codes.FailedPrecondition,
		},
		{
			Desc: "failed to find department id in Athena",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: getCreatePatientRequestPatient(),
			},
			AthenaError:                            status.Error(codes.Internal, "failed to find department id"),
			StationPatientsResponse:                &stationpatientspb.FindOrCreatePatientResponse{PatientId: 123},
			StationPatientsGetDepartmentIDResponse: &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{DepartmentId: "5"},
			AthenaPatient: &athenapb.GetPatientResponse{Patient: &athenapb.Patient{
				Name: &common.Name{
					GivenName:  proto.String("Dan"),
					FamilyName: proto.String("Cooper"),
				},
				ContactInfo: &athenapb.ContactInfo{
					MobileNumber: &common.PhoneNumber{
						PhoneNumberType: 2,
						CountryCode:     proto.Int32(1),
						PhoneNumber:     proto.String("(555) 555-5555"),
					},
					Email: proto.String("dan.cooper@example.com"),
				},
			}},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "failed to parse Athena EBM score",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: getCreatePatientRequestPatient(),
			},
			AthenaEBMResponse: &athenapb.EnhancedBestMatchResponse{Results: []*athenapb.EnhancedBestMatchResult{
				{Patient: &athenapb.Patient{
					PatientId: proto.String("456"),
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					DateOfBirth: &common.Date{
						Year:  2007,
						Month: 11,
						Day:   1,
					},
				},
					ScoreString: *proto.String("invalid"),
				},
			}},
			StationPatientsResponse:                &stationpatientspb.FindOrCreatePatientResponse{PatientId: 123},
			StationPatientsGetDepartmentIDResponse: &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{DepartmentId: "5"},
			AthenaPatient: &athenapb.GetPatientResponse{Patient: &athenapb.Patient{
				Name: &common.Name{
					GivenName:  proto.String("Dan"),
					FamilyName: proto.String("Cooper"),
				},
				ContactInfo: &athenapb.ContactInfo{
					MobileNumber: &common.PhoneNumber{
						PhoneNumberType: 2,
						CountryCode:     proto.Int32(1),
						PhoneNumber:     proto.String("(555) 555-5555"),
					},
					Email: proto.String("dan.cooper@example.com"),
				},
			}},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "failed to find department id in Station",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: getCreatePatientRequestPatient(),
			},
			AthenaResponse:                      &athenapb.CreatePatientResponse{PatientId: proto.String("12")},
			StationPatientsResponse:             &stationpatientspb.FindOrCreatePatientResponse{PatientId: 123},
			StationPatientsGetDepartmentIDError: status.Error(codes.Internal, "failed to find department id"),
			AthenaPatient: &athenapb.GetPatientResponse{Patient: &athenapb.Patient{
				Name: &common.Name{
					GivenName:  proto.String("Dan"),
					FamilyName: proto.String("Cooper"),
				},
				ContactInfo: &athenapb.ContactInfo{
					MobileNumber: &common.PhoneNumber{
						PhoneNumberType: 2,
						CountryCode:     proto.Int32(1),
						PhoneNumber:     proto.String("(555) 555-5555"),
					},
					Email: proto.String("dan.cooper@example.com"),
				},
			}},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "failed to parse billing city",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: getCreatePatientRequestPatient(),
			},
			AthenaResponse:                      &athenapb.CreatePatientResponse{PatientId: proto.String("12")},
			StationPatientsResponse:             &stationpatientspb.FindOrCreatePatientResponse{PatientId: 123},
			StationPatientsGetDepartmentIDError: status.Error(codes.Internal, "failed to find department id"),
			AthenaPatient: &athenapb.GetPatientResponse{Patient: &athenapb.Patient{
				Name: &common.Name{
					GivenName:  proto.String("Dan"),
					FamilyName: proto.String("Cooper"),
				},
				ContactInfo: &athenapb.ContactInfo{
					MobileNumber: &common.PhoneNumber{
						PhoneNumberType: 2,
						CountryCode:     proto.Int32(1),
						PhoneNumber:     proto.String("(555) 555-5555"),
					},
					Email: proto.String("dan.cooper@example.com"),
				},
			}},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "empty given name",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: &common.Patient{
					Name: &common.Name{
						FamilyName: proto.String("Cooper"),
					},
					ContactInfo: &common.ContactInfo{
						MobileNumber: &common.PhoneNumber{
							PhoneNumberType: 2,
							CountryCode:     proto.Int32(1),
							PhoneNumber:     proto.String("(555) 555-5555"),
						},
						Email: proto.String("dan.cooper@example.com"),
					},
					DateOfBirth: &common.Date{
						Year:  2023,
						Month: 1,
						Day:   1,
					},
					Sex:              common.Sex_SEX_MALE.Enum(),
					VoicemailConsent: proto.Bool(true),
					ChannelItemId:    proto.Int64(1),
					SourceType:       proto.String("2"),
					PartnerId:        proto.String("3"),
				},
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "empty family name",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: &common.Patient{
					Name: &common.Name{
						GivenName: proto.String("Dan"),
					},
					ContactInfo: &common.ContactInfo{
						MobileNumber: &common.PhoneNumber{
							PhoneNumberType: 2,
							CountryCode:     proto.Int32(1),
							PhoneNumber:     proto.String("(555) 555-5555"),
						},
						Email: proto.String("dan.cooper@example.com"),
					},
					DateOfBirth: &common.Date{
						Year:  2023,
						Month: 1,
						Day:   1,
					},
					Sex:              common.Sex_SEX_MALE.Enum(),
					VoicemailConsent: proto.Bool(true),
					ChannelItemId:    proto.Int64(1),
					SourceType:       proto.String("2"),
					PartnerId:        proto.String("3"),
				},
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "empty date of birth",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: &common.Patient{
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					ContactInfo: &common.ContactInfo{
						MobileNumber: &common.PhoneNumber{
							PhoneNumberType: 2,
							CountryCode:     proto.Int32(1),
							PhoneNumber:     proto.String("(555) 555-5555"),
						},
						Email: proto.String("dan.cooper@example.com"),
					},
					Sex:              common.Sex_SEX_MALE.Enum(),
					VoicemailConsent: proto.Bool(true),
					ChannelItemId:    proto.Int64(1),
					SourceType:       proto.String("2"),
					PartnerId:        proto.String("3"),
				},
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "empty department id",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: &common.Patient{
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					ContactInfo: &common.ContactInfo{
						MobileNumber: &common.PhoneNumber{
							PhoneNumberType: 2,
							CountryCode:     proto.Int32(1),
							PhoneNumber:     proto.String("(555) 555-5555"),
						},
						Email: proto.String("dan.cooper@example.com"),
					},
					DateOfBirth: &common.Date{
						Year:  2023,
						Month: 1,
						Day:   1,
					},
					Sex:              common.Sex_SEX_MALE.Enum(),
					VoicemailConsent: proto.Bool(true),
					ChannelItemId:    proto.Int64(1),
					SourceType:       proto.String("2"),
					PartnerId:        proto.String("3"),
				},
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "empty email",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: &common.Patient{
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					ContactInfo: &common.ContactInfo{
						MobileNumber: &common.PhoneNumber{
							PhoneNumberType: 2,
							CountryCode:     proto.Int32(1),
							PhoneNumber:     proto.String("(555) 555-5555"),
						},
					},
					DateOfBirth: &common.Date{
						Year:  2023,
						Month: 1,
						Day:   1,
					},
					Sex:              common.Sex_SEX_MALE.Enum(),
					VoicemailConsent: proto.Bool(true),
					ChannelItemId:    proto.Int64(1),
					SourceType:       proto.String("2"),
					PartnerId:        proto.String("3"),
				},
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "empty phone number",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: &common.Patient{
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					ContactInfo: &common.ContactInfo{
						MobileNumber: &common.PhoneNumber{},
						Email:        proto.String("dan.cooper@example.com"),
					},
					DateOfBirth: &common.Date{
						Year:  2023,
						Month: 1,
						Day:   1,
					},
					Sex:              common.Sex_SEX_MALE.Enum(),
					VoicemailConsent: proto.Bool(true),
					ChannelItemId:    proto.Int64(1),
					SourceType:       proto.String("2"),
					PartnerId:        proto.String("3"),
				},
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "failed to create station patient",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: &common.Patient{
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					ContactInfo: &common.ContactInfo{
						MobileNumber: &common.PhoneNumber{
							PhoneNumberType: 2,
							CountryCode:     proto.Int32(1),
							PhoneNumber:     proto.String("(555) 555-5555"),
						},
						Email: proto.String("dan.cooper@example.com"),
					},
					DateOfBirth: &common.Date{
						Year:  2023,
						Month: 1,
						Day:   1,
					},
					Sex:              common.Sex_SEX_MALE.Enum(),
					VoicemailConsent: proto.Bool(true),
					ChannelItemId:    proto.Int64(1),
					SourceType:       proto.String("2"),
					PartnerId:        proto.String("3"),
					BillingCity:      &common.BillingCity{Id: "5"},
				},
			},
			AthenaResponse:                         &athenapb.CreatePatientResponse{PatientId: proto.String("123")},
			StationPatientsGetDepartmentIDResponse: &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{DepartmentId: "5"},
			StationPatientsError:                   status.Error(codes.Internal, "failed to create station patient"),
			AthenaPatient: &athenapb.GetPatientResponse{Patient: &athenapb.Patient{
				PatientId: nil,
				Name: &common.Name{
					GivenName:  proto.String("Dan"),
					FamilyName: proto.String("Cooper"),
				},
				ContactInfo: &athenapb.ContactInfo{
					MobileNumber: &common.PhoneNumber{
						PhoneNumberType: 2,
						CountryCode:     proto.Int32(1),
						PhoneNumber:     proto.String("(555) 555-5555"),
					},
					Email: proto.String("dan.cooper@example.com"),
				},
			}},
			AthenaEBMResponse: &athenapb.EnhancedBestMatchResponse{Results: nil},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "failed to create station patient",
			CreatePatientRequest: &patientspb.CreatePatientRequest{
				Patient: &common.Patient{
					Name: &common.Name{
						GivenName:  proto.String("Dan"),
						FamilyName: proto.String("Cooper"),
					},
					ContactInfo: &common.ContactInfo{
						MobileNumber: &common.PhoneNumber{
							PhoneNumberType: 2,
							CountryCode:     proto.Int32(1),
							PhoneNumber:     proto.String("(555) 555-5555"),
						},
						Email: proto.String("dan.cooper@example.com"),
					},
					DateOfBirth: &common.Date{
						Year:  2023,
						Month: 1,
						Day:   1,
					},
					Sex:              common.Sex_SEX_MALE.Enum(),
					VoicemailConsent: proto.Bool(true),
					ChannelItemId:    proto.Int64(1),
					SourceType:       proto.String("2"),
					PartnerId:        proto.String("3"),
					BillingCity:      &common.BillingCity{Id: "5"},
				},
			},
			AthenaResponse:                         &athenapb.CreatePatientResponse{PatientId: proto.String("123")},
			StationPatientsGetDepartmentIDResponse: &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{DepartmentId: "5"},
			StationPatientsResponse:                nil,
			AthenaPatient: &athenapb.GetPatientResponse{Patient: &athenapb.Patient{
				PatientId: nil,
				Name: &common.Name{
					GivenName:  proto.String("Dan"),
					FamilyName: proto.String("Cooper"),
				},
				ContactInfo: &athenapb.ContactInfo{
					MobileNumber: &common.PhoneNumber{
						PhoneNumberType: 2,
						CountryCode:     proto.Int32(1),
						PhoneNumber:     proto.String("(555) 555-5555"),
					},
					Email: proto.String("dan.cooper@example.com"),
				},
			}},
			AthenaEBMResponse: &athenapb.EnhancedBestMatchResponse{Results: nil},

			WantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				CreatePatientHandler: func(ctx context.Context, in *athenapb.CreatePatientRequest, opts ...grpc.CallOption) (*athenapb.CreatePatientResponse, error) {
					return tc.AthenaResponse, tc.AthenaError
				},
				GetPatientHandler: func(ctx context.Context, in *athenapb.GetPatientRequest, opts ...grpc.CallOption) (*athenapb.GetPatientResponse, error) {
					return tc.AthenaPatient, tc.AthenaError
				},
				EnhancedBestMatchHandler: func(ctx context.Context, in *athenapb.EnhancedBestMatchRequest, opts ...grpc.CallOption) (*athenapb.EnhancedBestMatchResponse, error) {
					return tc.AthenaEBMResponse, tc.AthenaError
				},
			}, StationPatientsClient: &StationPatientsClientMock{FindOrCreatePatientsHandler: func(ctx context.Context, in *stationpatientspb.FindOrCreatePatientRequest, opts ...grpc.CallOption) (*stationpatientspb.FindOrCreatePatientResponse, error) {
				return tc.StationPatientsResponse, tc.StationPatientsError
			}, GetDepartmentIDByBillingCityIDHandler: func(ctx context.Context, in *stationpatientspb.GetDepartmentIDByBillingCityIDRequest, opts ...grpc.CallOption) (*stationpatientspb.GetDepartmentIDByBillingCityIDResponse, error) {
				return tc.StationPatientsGetDepartmentIDResponse, tc.StationPatientsGetDepartmentIDError
			}, UpdatePatientsHandler: func(ctx context.Context, in *stationpatientspb.UpdatePatientRequest, opts ...grpc.CallOption) (*stationpatientspb.UpdatePatientResponse, error) {
				return tc.UpdateStationPatientResponse, tc.UpdateStationPatientError
			},
				GetPatientHandler: func(ctx context.Context, in *stationpatientspb.GetPatientRequest, opts ...grpc.CallOption) (*stationpatientspb.GetPatientResponse, error) {
					return tc.GetPatientResponse, tc.StationPatientsError
				},
			}, DataDogRecorder: tc.DataDogRecorder})

			resp, err := s.CreatePatient(ctx, tc.CreatePatientRequest)

			respStatus := status.Convert(err)

			if respStatus.Code() != tc.WantGRPCCode {
				t.Fatalf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			matchProtoWithoutConsistencyToken(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

func TestGetPatientInsuranceBenefitDetails(t *testing.T) {
	patientWithoutEHRID := getExampleStationPatientProto()
	patientWithoutEHRID.EhrId = nil

	testcases := []struct {
		description                               string
		request                                   *patientspb.GetPatientInsuranceBenefitDetailsRequest
		GetPatientInsuranceBenefitDetailsResponse *athenapb.GetPatientInsuranceBenefitDetailsResponse
		GetPatientInsuranceBenefitDetailsError    error
		StationGetPatientResponse                 *stationpatientspb.GetPatientResponse
		StationGetPatientError                    error
		stationResponse                           patient.StationInsuranceWithURL
		stationHTTPStatus                         int

		want     *patientspb.GetPatientInsuranceBenefitDetailsResponse
		wantCode codes.Code
	}{
		{
			description: "base case",
			request: &patientspb.GetPatientInsuranceBenefitDetailsRequest{
				PatientId:   "1",
				InsuranceId: "2",
				DateOfService: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
				ServiceTypeCode: proto.String("3"),
			},
			GetPatientInsuranceBenefitDetailsResponse: &athenapb.GetPatientInsuranceBenefitDetailsResponse{Details: &athenapb.InsuranceBenefitDetails{
				EligibilityData: "data",
				DateOfService: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
				LastCheckDate: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
			}},
			StationGetPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			stationResponse: patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:    proto.Int64(1),
					EHRID: proto.String("132"),
				},
			},
			stationHTTPStatus: http.StatusOK,

			want: &patientspb.GetPatientInsuranceBenefitDetailsResponse{
				Details: &patientspb.InsuranceBenefitDetails{
					EligibilityData: "data",
					DateOfService: &common.Date{
						Year:  2023,
						Month: 6,
						Day:   1,
					},
					LastCheckDate: &common.Date{
						Year:  2023,
						Month: 6,
						Day:   1,
					},
				},
			},
			wantCode: codes.OK,
		},
		{
			description: "success - only required fields",
			request: &patientspb.GetPatientInsuranceBenefitDetailsRequest{
				PatientId:   "1",
				InsuranceId: "2",
			},
			GetPatientInsuranceBenefitDetailsResponse: &athenapb.GetPatientInsuranceBenefitDetailsResponse{Details: &athenapb.InsuranceBenefitDetails{
				EligibilityData: "data",
				DateOfService: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
				LastCheckDate: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
			}},
			StationGetPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			stationResponse: patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:    proto.Int64(1),
					EHRID: proto.String("132"),
				},
			},
			stationHTTPStatus: http.StatusOK,

			want: &patientspb.GetPatientInsuranceBenefitDetailsResponse{
				Details: &patientspb.InsuranceBenefitDetails{
					EligibilityData: "data",
					DateOfService: &common.Date{
						Year:  2023,
						Month: 6,
						Day:   1,
					},
					LastCheckDate: &common.Date{
						Year:  2023,
						Month: 6,
						Day:   1,
					},
				},
			},
			wantCode: codes.OK,
		},
		{
			description: "request patient id is nil",
			request: &patientspb.GetPatientInsuranceBenefitDetailsRequest{
				InsuranceId: "2",
			},

			wantCode: codes.InvalidArgument,
		},
		{
			description: "request insurance id is nil",
			request: &patientspb.GetPatientInsuranceBenefitDetailsRequest{
				PatientId: "1",
			},

			wantCode: codes.InvalidArgument,
		},
		{
			description: "GetPatient returned Internal",
			request: &patientspb.GetPatientInsuranceBenefitDetailsRequest{
				PatientId:   "1",
				InsuranceId: "2",
			},

			StationGetPatientError: status.Error(codes.Internal, "some error"),
			stationResponse: patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:    proto.Int64(1),
					EHRID: proto.String("132"),
				},
			},

			wantCode: codes.Internal,
		},
		{
			description: "station GetInsurance returned error",
			request: &patientspb.GetPatientInsuranceBenefitDetailsRequest{
				PatientId:   "1",
				InsuranceId: "2",
			},

			StationGetPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			stationHTTPStatus: http.StatusInternalServerError,

			wantCode: codes.Internal,
		},
		{
			description: "GetPatientInsuranceBenefitDetails error",
			request: &patientspb.GetPatientInsuranceBenefitDetailsRequest{
				PatientId:   "1",
				InsuranceId: "2",
			},

			StationGetPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			stationResponse: patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:    proto.Int64(1),
					EHRID: proto.String("132"),
				},
			},
			GetPatientInsuranceBenefitDetailsError: status.Error(codes.Internal, "athena error"),
			stationHTTPStatus:                      http.StatusOK,

			wantCode: codes.Internal,
		},
	}

	for _, test := range testcases {
		t.Run(test.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				if req.Header.Get("Accept") != acceptHeader {
					t.Fatal("header Accept must be application/vnd.*company-data-covered*.com; version=1")
				}

				rw.WriteHeader(test.stationHTTPStatus)
				res, err := json.Marshal(test.stationResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.Write(res)
			}))
			defer stationServer.Close()

			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				GetPatientInsuranceBenefitDetailsHandler: func(ctx context.Context, in *athenapb.GetPatientInsuranceBenefitDetailsRequest, opts ...grpc.CallOption) (*athenapb.GetPatientInsuranceBenefitDetailsResponse, error) {
					return test.GetPatientInsuranceBenefitDetailsResponse, test.GetPatientInsuranceBenefitDetailsError
				},
			}, StationPatientsClient: &StationPatientsClientMock{
				GetPatientHandler: func(ctx context.Context, in *stationpatientspb.GetPatientRequest, opts ...grpc.CallOption) (*stationpatientspb.GetPatientResponse, error) {
					resp := test.StationGetPatientResponse
					return resp, test.StationGetPatientError
				},
			},
				StationURL: &stationServer.URL})

			resp, err := s.GetPatientInsuranceBenefitDetails(ctx, test.request)

			respStatus, ok := status.FromError(err)

			if !ok {
				t.Fatal(err)
			}

			if respStatus.Code() != test.wantCode {
				t.Fatalf(responseStatusMessage, respStatus, respStatus.Code(), test.wantCode)
			}

			testutils.MustMatchProto(t, test.want, resp, "response does not match")
		})
	}
}

func TestGetInsuranceEHRID(t *testing.T) {
	testcases := []struct {
		description       string
		patientID         string
		insuranceID       string
		stationResponse   patient.StationInsuranceWithURL
		stationHTTPStatus int

		want     string
		wantCode codes.Code
	}{
		{
			description: "base case",
			patientID:   "1",
			insuranceID: "2",
			stationResponse: patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:    proto.Int64(1),
					EHRID: proto.String("132"),
				},
			},
			stationHTTPStatus: http.StatusOK,

			want:     "132",
			wantCode: codes.OK,
		},
		{
			description:       "station GetInsurance returned error",
			patientID:         "1",
			insuranceID:       "2",
			stationHTTPStatus: http.StatusInternalServerError,

			wantCode: codes.Internal,
		},
		{
			description: "station GetInsurance returned empty insurance EHR ID",
			stationResponse: patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:    proto.Int64(1),
					EHRID: proto.String(""),
				},
			},
			stationHTTPStatus: http.StatusOK,

			wantCode: codes.Internal,
		},
	}

	for _, test := range testcases {
		t.Run(test.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				if req.Header.Get("Accept") != acceptHeader {
					t.Fatal("header Accept must be application/vnd.*company-data-covered*.com; version=1")
				}

				rw.WriteHeader(test.stationHTTPStatus)
				res, err := json.Marshal(test.stationResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.Write(res)
			}))
			defer stationServer.Close()

			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{StationURL: &stationServer.URL})

			resp, err := s.getInsuranceEHRID(ctx, test.patientID, test.insuranceID)

			respStatus, ok := status.FromError(err)

			if !ok {
				t.Fatal(err)
			}

			if respStatus.Code() != test.wantCode {
				t.Fatalf(responseStatusMessage, respStatus, respStatus.Code(), test.wantCode)
			}

			testutils.MustMatch(t, test.want, resp, "response does not match")
		})
	}
}

func TestGetPatientERHID(t *testing.T) {
	patientWithoutEHRID := getExampleStationPatientProto()
	patientWithoutEHRID.EhrId = nil

	testcases := []struct {
		description               string
		patientID                 string
		StationGetPatientResponse *stationpatientspb.GetPatientResponse
		StationGetPatientError    error

		want     string
		wantCode codes.Code
	}{
		{
			description: "base case",
			patientID:   "1",
			StationGetPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},

			want:     "789",
			wantCode: codes.OK,
		},
		{
			description: "failed to parse patient id",
			patientID:   "invalid",

			wantCode: codes.InvalidArgument,
		},
		{
			description:            "GetPatient returned NotFound",
			patientID:              "1",
			StationGetPatientError: status.Error(codes.NotFound, "patient not found"),

			wantCode: codes.NotFound,
		},
		{
			description:            "GetPatient returned Internal",
			patientID:              "1",
			StationGetPatientError: status.Error(codes.Internal, "some error"),

			wantCode: codes.Internal,
		},
		{
			description: "GetPatient returned empty EHR ID",
			patientID:   "1",
			StationGetPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: patientWithoutEHRID,
			},

			wantCode: codes.Internal,
		},
	}

	for _, test := range testcases {
		t.Run(test.description, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{},
				StationPatientsClient: &StationPatientsClientMock{
					GetPatientHandler: func(ctx context.Context, in *stationpatientspb.GetPatientRequest, opts ...grpc.CallOption) (*stationpatientspb.GetPatientResponse, error) {
						resp := test.StationGetPatientResponse
						return resp, test.StationGetPatientError
					},
				}})
			resp, err := s.getPatientEHRID(ctx, test.patientID)
			respStatus, ok := status.FromError(err)

			if !ok {
				t.Fatal(err)
			}

			if respStatus.Code() != test.wantCode {
				t.Fatalf(responseStatusMessage, respStatus, respStatus.Code(), test.wantCode)
			}

			testutils.MustMatch(t, test.want, resp, "response does not match")
		})
	}
}

func TestTriggerPatientInsuranceEligibilityCheck(t *testing.T) {
	patientWithoutEHRID := getExampleStationPatientProto()
	patientWithoutEHRID.EhrId = nil

	testcases := []struct {
		description                                     string
		request                                         *patientspb.TriggerPatientInsuranceEligibilityCheckRequest
		TriggerPatientInsuranceEligibilityCheckResponse *athenapb.TriggerPatientInsuranceEligibilityCheckResponse
		TriggerPatientInsuranceEligibilityCheckError    error
		StationGetPatientResponse                       *stationpatientspb.GetPatientResponse
		StationGetPatientError                          error
		stationResponse                                 patient.StationInsuranceWithURL
		stationHTTPStatus                               int

		want     *patientspb.TriggerPatientInsuranceEligibilityCheckResponse
		wantCode codes.Code
	}{
		{
			description: "base case",
			request: &patientspb.TriggerPatientInsuranceEligibilityCheckRequest{
				PatientId:   "1",
				InsuranceId: "2",
				DateOfService: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
				ServiceTypeCode: proto.String("3"),
			},
			TriggerPatientInsuranceEligibilityCheckResponse: &athenapb.TriggerPatientInsuranceEligibilityCheckResponse{},
			StationGetPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			stationResponse: patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:    proto.Int64(1),
					EHRID: proto.String("132"),
				},
			},
			stationHTTPStatus: http.StatusOK,

			want:     &patientspb.TriggerPatientInsuranceEligibilityCheckResponse{},
			wantCode: codes.OK,
		},
		{
			description: "success - only required fields",
			request: &patientspb.TriggerPatientInsuranceEligibilityCheckRequest{
				PatientId:   "1",
				InsuranceId: "2",
			},
			TriggerPatientInsuranceEligibilityCheckResponse: &athenapb.TriggerPatientInsuranceEligibilityCheckResponse{},
			StationGetPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			stationResponse: patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:    proto.Int64(1),
					EHRID: proto.String("132"),
				},
			},
			stationHTTPStatus: http.StatusOK,

			want:     &patientspb.TriggerPatientInsuranceEligibilityCheckResponse{},
			wantCode: codes.OK,
		},
		{
			description: "request patient id is nil",
			request: &patientspb.TriggerPatientInsuranceEligibilityCheckRequest{
				InsuranceId: "2",
				DateOfService: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
				ServiceTypeCode: proto.String("3"),
			},

			wantCode: codes.InvalidArgument,
		},
		{
			description: "request insurance id is nil",
			request: &patientspb.TriggerPatientInsuranceEligibilityCheckRequest{
				PatientId: "1",
				DateOfService: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
				ServiceTypeCode: proto.String("3"),
			},

			wantCode: codes.InvalidArgument,
		},
		{
			description: "GetPatient returned Internal",
			request: &patientspb.TriggerPatientInsuranceEligibilityCheckRequest{
				PatientId:   "1",
				InsuranceId: "2",
				DateOfService: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
				ServiceTypeCode: proto.String("3"),
			},
			StationGetPatientError: status.Error(codes.Internal, "some error"),
			stationResponse: patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:    proto.Int64(1),
					EHRID: proto.String("132"),
				},
			},

			wantCode: codes.Internal,
		},
		{
			description: "station GetInsurance returned error",
			request: &patientspb.TriggerPatientInsuranceEligibilityCheckRequest{
				PatientId:   "1",
				InsuranceId: "2",
				DateOfService: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
				ServiceTypeCode: proto.String("3"),
			},
			StationGetPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			stationHTTPStatus: http.StatusInternalServerError,

			wantCode: codes.Internal,
		},
		{
			description: "TriggerPatientInsuranceEligibilityCheck error",
			request: &patientspb.TriggerPatientInsuranceEligibilityCheckRequest{
				PatientId:   "1",
				InsuranceId: "2",
				DateOfService: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   1,
				},
				ServiceTypeCode: proto.String("3"),
			},
			StationGetPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			stationResponse: patient.StationInsuranceWithURL{
				StationInsurance: patient.StationInsurance{
					ID:    proto.Int64(1),
					EHRID: proto.String("132"),
				},
			},
			TriggerPatientInsuranceEligibilityCheckError: status.Error(codes.Internal, "athena error"),
			stationHTTPStatus: http.StatusOK,

			wantCode: codes.Internal,
		},
	}

	for _, test := range testcases {
		t.Run(test.description, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				if req.Header.Get("Accept") != acceptHeader {
					t.Fatal("header Accept must be application/vnd.*company-data-covered*.com; version=1")
				}

				rw.WriteHeader(test.stationHTTPStatus)
				res, err := json.Marshal(test.stationResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.Write(res)
			}))
			defer stationServer.Close()

			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				TriggerPatientInsuranceEligibilityCheckHandler: func(ctx context.Context, in *athenapb.TriggerPatientInsuranceEligibilityCheckRequest, opts ...grpc.CallOption) (*athenapb.TriggerPatientInsuranceEligibilityCheckResponse, error) {
					return test.TriggerPatientInsuranceEligibilityCheckResponse, test.TriggerPatientInsuranceEligibilityCheckError
				},
			}, StationPatientsClient: &StationPatientsClientMock{
				GetPatientHandler: func(ctx context.Context, in *stationpatientspb.GetPatientRequest, opts ...grpc.CallOption) (*stationpatientspb.GetPatientResponse, error) {
					resp := test.StationGetPatientResponse
					return resp, test.StationGetPatientError
				},
			},
				StationURL: &stationServer.URL})

			resp, err := s.TriggerPatientInsuranceEligibilityCheck(ctx, test.request)

			respStatus := status.Convert(err)

			if respStatus.Code() != test.wantCode {
				t.Fatalf(responseStatusMessage, respStatus, respStatus.Code(), test.wantCode)
			}

			testutils.MustMatchProto(t, test.want, resp, "response does not match")
		})
	}
}

func TestListUnverifiedPatients(t *testing.T) {
	testDate := time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC)
	invalidDate := time.Date(100000, time.January, 1, 0, 0, 0, 0, time.UTC)
	testDateProto := timestamppb.New(testDate)

	examplePatientsFromDB := []*patientssql.UnverifiedPatient{
		{
			ID:                    1,
			AthenaID:              sqltypes.ToValidNullInt64(1),
			DateOfBirth:           testDate,
			GivenName:             "John",
			FamilyName:            "Doe",
			PhoneNumber:           sql.NullString{String: "+1-555-555-5555", Valid: true},
			LegalSex:              patientssql.SexM,
			BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDMale),
			GenderIdentity:        ToNullGenderIdentity("m"),
			GenderIdentityDetails: sqltypes.ToValidNullString("test"),
			CreatedAt:             testDate,
			UpdatedAt:             testDate,
		},
		{
			ID:                    2,
			AthenaID:              sqltypes.ToValidNullInt64(12),
			DateOfBirth:           testDate,
			GivenName:             "Jane",
			FamilyName:            "Smith",
			PhoneNumber:           sql.NullString{String: "+1-555-555-5555", Valid: true},
			LegalSex:              patientssql.SexF,
			BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDFemale),
			GenderIdentity:        ToNullGenderIdentity("f"),
			GenderIdentityDetails: sqltypes.ToValidNullString("test"),
			CreatedAt:             testDate,
			UpdatedAt:             testDate,
		},
	}

	examplePatients := []*patientspb.UnverifiedPatient{
		{
			Id:       1,
			AthenaId: proto.Int64(1),
			DateOfBirth: &common.Date{
				Year:  2023,
				Month: 6,
				Day:   7,
			},
			GivenName:  proto.String("John"),
			FamilyName: proto.String("Doe"),
			PhoneNumber: &common.PhoneNumber{
				PhoneNumber: proto.String("+1-555-555-5555"),
			},
			LegalSex: common.Sex_SEX_MALE,
			BirthSex: common.BirthSex_BIRTH_SEX_MALE,
			GenderIdentity: &common.GenderIdentity{
				Category:     common.GenderIdentity_CATEGORY_MALE,
				OtherDetails: proto.String("test"),
			},
			CreatedAt: testDateProto,
			UpdatedAt: testDateProto,
		},
		{
			Id:       2,
			AthenaId: proto.Int64(12),
			DateOfBirth: &common.Date{
				Year:  2023,
				Month: 6,
				Day:   7,
			},
			GivenName:  proto.String("Jane"),
			FamilyName: proto.String("Smith"),
			PhoneNumber: &common.PhoneNumber{
				PhoneNumber: proto.String("+1-555-555-5555"),
			},
			LegalSex: common.Sex_SEX_FEMALE,
			BirthSex: common.BirthSex_BIRTH_SEX_FEMALE,
			GenderIdentity: &common.GenderIdentity{
				Category:     common.GenderIdentity_CATEGORY_FEMALE,
				OtherDetails: proto.String("test"),
			},
			CreatedAt: testDateProto,
			UpdatedAt: testDateProto,
		},
	}

	tcs := []struct {
		Desc                          string
		ListUnverifiedPatientsRequest *patientspb.ListUnverifiedPatientsRequest
		PatientDBResponse             []*patientssql.UnverifiedPatient
		PatientDBError                error

		WantResponse *patientspb.ListUnverifiedPatientsResponse
		WantCode     codes.Code
	}{
		{
			Desc:                          "base case",
			ListUnverifiedPatientsRequest: &patientspb.ListUnverifiedPatientsRequest{Ids: []int64{1, 2}},
			PatientDBResponse:             examplePatientsFromDB,

			WantResponse: &patientspb.ListUnverifiedPatientsResponse{
				Results: []*patientspb.ListUnverifiedPatientResult{
					{
						Patient: examplePatients[0],
					},
					{
						Patient: examplePatients[1],
					},
				},
			},
			WantCode: codes.OK,
		},
		{
			Desc:                          "failed to generate token",
			ListUnverifiedPatientsRequest: &patientspb.ListUnverifiedPatientsRequest{Ids: []int64{1}},
			PatientDBResponse: []*patientssql.UnverifiedPatient{
				{
					ID:                    1,
					AthenaID:              sqltypes.ToValidNullInt64(1),
					DateOfBirth:           testDate,
					GivenName:             "John",
					FamilyName:            "Doe",
					PhoneNumber:           sql.NullString{String: "+1-555-555-5555", Valid: true},
					LegalSex:              patientssql.SexM,
					BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDMale),
					GenderIdentity:        ToNullGenderIdentity("m"),
					GenderIdentityDetails: sqltypes.ToValidNullString("test"),
					CreatedAt:             testDate,
					UpdatedAt:             invalidDate,
				},
			},

			WantCode: codes.Internal,
		},
		{
			Desc:                          "patient DB error",
			ListUnverifiedPatientsRequest: &patientspb.ListUnverifiedPatientsRequest{Ids: []int64{1, 2}},
			PatientDBError:                errors.New("some DB error"),

			WantCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{DBService: &DBServiceMock{
				ListUnverifiedPatientsByIdsHandler: func(ctx context.Context, ids []int64) ([]*patientssql.UnverifiedPatient, error) {
					return tc.PatientDBResponse, tc.PatientDBError
				},
			}})

			resp, err := s.ListUnverifiedPatients(ctx, tc.ListUnverifiedPatientsRequest)
			respStatus := status.Convert(err)

			if respStatus.Code() != tc.WantCode {
				t.Fatalf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantCode)
			}

			if resp != nil && len(resp.Results) != len(tc.WantResponse.Results) {
				t.Fatalf("response length does not match")
			}

			if resp != nil {
				for i := 0; i < len(resp.Results); i++ {
					matchProtoWithoutConsistencyToken(t, tc.WantResponse.Results[i], resp.Results[i], "response does not match")
				}
			}
		})
	}
}

func TestGetUnverifiedPatient(t *testing.T) {
	testDate := time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC)
	invalidDate := time.Date(100000, time.January, 1, 0, 0, 0, 0, time.UTC)

	examplePatientSQL := &patientssql.UnverifiedPatient{
		ID:                    1,
		AthenaID:              sqltypes.ToValidNullInt64(1),
		DateOfBirth:           testDate,
		GivenName:             "John",
		FamilyName:            "Doe",
		PhoneNumber:           sql.NullString{String: "+1-555-555-5555", Valid: true},
		LegalSex:              patientssql.SexM,
		BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDMale),
		GenderIdentity:        ToNullGenderIdentity("m"),
		GenderIdentityDetails: sqltypes.ToValidNullString("test"),
		CreatedAt:             testDate,
		UpdatedAt:             testDate,
	}

	testDateConsistencyToken, _ := protoconv.TimestampToBytes(timestamppb.New(testDate))

	examplePatientProto := UnverifiedPatientSQLToProto(examplePatientSQL)

	tcs := []struct {
		Desc                        string
		GetUnverifiedPatientRequest *patientspb.GetUnverifiedPatientRequest
		PatientDBResponse           *patientssql.UnverifiedPatient
		PatientDBError              error

		WantResponse *patientspb.GetUnverifiedPatientResponse
		WantCode     codes.Code
	}{
		{
			Desc:                        "base case",
			GetUnverifiedPatientRequest: &patientspb.GetUnverifiedPatientRequest{Id: proto.Int64(1)},
			PatientDBResponse:           examplePatientSQL,

			WantResponse: &patientspb.GetUnverifiedPatientResponse{
				Patient:          examplePatientProto,
				ConsistencyToken: testDateConsistencyToken,
			},
			WantCode: codes.OK,
		},
		{
			Desc:                        "failed to generate token",
			GetUnverifiedPatientRequest: &patientspb.GetUnverifiedPatientRequest{Id: proto.Int64(1)},
			PatientDBResponse: &patientssql.UnverifiedPatient{
				ID:                    1,
				AthenaID:              sqltypes.ToValidNullInt64(1),
				DateOfBirth:           testDate,
				GivenName:             "John",
				FamilyName:            "Doe",
				PhoneNumber:           sql.NullString{String: "+1-555-555-5555", Valid: true},
				LegalSex:              patientssql.SexM,
				BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDMale),
				GenderIdentity:        ToNullGenderIdentity("m"),
				GenderIdentityDetails: sqltypes.ToValidNullString("test"),
				CreatedAt:             testDate,
				UpdatedAt:             invalidDate,
			},

			WantCode: codes.Internal,
		},
		{
			Desc:                        "patient DB error",
			GetUnverifiedPatientRequest: &patientspb.GetUnverifiedPatientRequest{Id: proto.Int64(1)},
			PatientDBError:              errors.New("some DB error"),

			WantCode: codes.Internal,
		},
		{
			Desc:                        "unverified patient not found",
			GetUnverifiedPatientRequest: &patientspb.GetUnverifiedPatientRequest{Id: proto.Int64(1)},
			PatientDBError:              errPatientNotFound,

			WantCode: codes.NotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{DBService: &DBServiceMock{
				GetUnverifiedPatientByIDHandler: func(ctx context.Context, id int64) (*patientssql.UnverifiedPatient, error) {
					return tc.PatientDBResponse, tc.PatientDBError
				},
			}})

			resp, err := s.GetUnverifiedPatient(ctx, tc.GetUnverifiedPatientRequest)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.WantCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

func TestListPatientsByID(t *testing.T) {
	tcs := []struct {
		Desc                    string
		GetPatientsByIDRequest  *patientspb.ListPatientsByIDRequest
		AthenaResponse          *athenapb.GetPatientResponse
		AthenaError             error
		StationPatientsResponse *stationpatientspb.ListPatientsByIDResponse
		StationPatientsError    error

		WantResponse *patientspb.ListPatientsByIDResponse
		WantGRPCCode codes.Code
	}{
		{
			Desc:                   "base case",
			GetPatientsByIDRequest: &patientspb.ListPatientsByIDRequest{PatientIds: []int64{1}},
			AthenaResponse: &athenapb.GetPatientResponse{
				Patient: getExampleAthenaPatientProto(),
			},
			StationPatientsResponse: &stationpatientspb.ListPatientsByIDResponse{
				Patients: []*stationpatientspb.Patient{
					getExampleStationPatientProto(),
				},
			},

			WantResponse: &patientspb.ListPatientsByIDResponse{
				Results: []*patientspb.ListPatientsByIDResult{{
					Patient:          getExamplePatient(),
					ConsistencyToken: getConsistencyToken(getExamplePatient()),
				}},
			},
			WantGRPCCode: codes.OK,
		},
		{
			Desc:                   "station patients with empty EHR IDs",
			GetPatientsByIDRequest: &patientspb.ListPatientsByIDRequest{PatientIds: []int64{1}},
			StationPatientsResponse: &stationpatientspb.ListPatientsByIDResponse{
				Patients: []*stationpatientspb.Patient{
					{
						Id:            1234,
						ChannelItemId: proto.Int64(123),
						SourceType:    proto.String("phone"),
						PartnerId:     proto.String("456"),
					},
				},
			},

			WantResponse: &patientspb.ListPatientsByIDResponse{},
			WantGRPCCode: codes.OK,
		},
		{
			Desc:                   "failed to retrieve patients from station",
			GetPatientsByIDRequest: &patientspb.ListPatientsByIDRequest{PatientIds: []int64{1}},
			AthenaResponse: &athenapb.GetPatientResponse{
				Patient: getExampleAthenaPatientProto(),
			},
			StationPatientsError: status.Error(codes.Internal, "failed to retrieve patient from StationPatientsService"),

			WantGRPCCode: codes.Internal,
		},
		{
			Desc:                    "empty station patients",
			GetPatientsByIDRequest:  &patientspb.ListPatientsByIDRequest{PatientIds: []int64{1}},
			StationPatientsResponse: &stationpatientspb.ListPatientsByIDResponse{},

			WantResponse: &patientspb.ListPatientsByIDResponse{},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(
				GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
					GetPatientHandler: func(ctx context.Context, in *athenapb.GetPatientRequest, opts ...grpc.CallOption) (*athenapb.GetPatientResponse, error) {
						return tc.AthenaResponse, tc.AthenaError
					},
				}, StationPatientsClient: &StationPatientsClientMock{ListPatientsByIDHandler: func(ctx context.Context, in *stationpatientspb.ListPatientsByIDRequest, opts ...grpc.CallOption) (*stationpatientspb.ListPatientsByIDResponse, error) {
					return tc.StationPatientsResponse, tc.StationPatientsError
				}}})

			resp, err := s.ListPatientsByID(ctx, tc.GetPatientsByIDRequest)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.WantGRPCCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

func TestComposeWithAthenaPatient(t *testing.T) {
	exampleConsistencyToken := getConsistencyToken(getExamplePatient())
	stationPatientWithoutEhrID := getExampleStationPatientProto()
	stationPatientWithoutEhrID.EhrId = nil

	tcs := []struct {
		Desc           string
		StationPatient *stationpatientspb.Patient
		AthenaResponse *athenapb.GetPatientResponse
		AthenaError    error

		WantPatient          *common.Patient
		WantConsistencyToken ConsistencyToken
		HasError             bool
	}{
		{
			Desc:           "base case",
			StationPatient: getExampleStationPatientProto(),
			AthenaResponse: &athenapb.GetPatientResponse{
				Patient: getExampleAthenaPatientProto(),
			},

			WantPatient:          getExamplePatient(),
			WantConsistencyToken: exampleConsistencyToken,
		},
		{
			Desc:           "station patient without EHR ID",
			StationPatient: stationPatientWithoutEhrID,
			AthenaError:    status.Error(codes.Internal, "failed to retrieve patient from AthenaService"),

			HasError: true,
		},
		{
			Desc:           "failed to retrieve Athena patient",
			StationPatient: getExampleStationPatientProto(),
			AthenaError:    status.Error(codes.NotFound, "failed to retrieve patient from AthenaService"),

			HasError: true,
		},
		{
			Desc:           "failed to compose patients",
			StationPatient: getExampleStationPatientProto(),
			AthenaResponse: &athenapb.GetPatientResponse{},

			HasError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				GetPatientHandler: func(ctx context.Context, in *athenapb.GetPatientRequest, opts ...grpc.CallOption) (*athenapb.GetPatientResponse, error) {
					return tc.AthenaResponse, tc.AthenaError
				},
			}})

			composedPatient, consistencyToken, err := s.composeWithAthenaPatient(ctx, tc.StationPatient)
			if (err != nil) != tc.HasError {
				t.Fatalf("got err != nil %t, want %t, error is %s", err != nil, tc.HasError, err)
			}

			if tc.HasError {
				return
			}

			testutils.MustMatchProto(t, tc.WantPatient, composedPatient, "patients does not match")
			testutils.MustMatch(t, tc.WantConsistencyToken, consistencyToken, "tokens does not match")
		})
	}
}

func TestCreateUnverifiedPatient(t *testing.T) {
	testDate := time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC)
	athenaID := proto.Int64(1)

	examplePatient := UnverifiedPatientSQLToProto(getExampleUnverifiedPatientSQL())
	exampleConsistencyToken, _ := protoconv.TimestampToBytes(timestamppb.New(getExampleUnverifiedPatientSQL().UpdatedAt))

	exampleRequest := &patientspb.CreateUnverifiedPatientRequest{
		AthenaId: athenaID,
		DateOfBirth: &common.Date{
			Year:  2023,
			Month: 6,
			Day:   16,
		},
		GivenName:  proto.String("Jane"),
		FamilyName: proto.String("Smith"),
		PhoneNumber: &common.PhoneNumber{
			PhoneNumber: proto.String("+1-555-555-5555"),
		},
		LegalSex: common.Sex_SEX_FEMALE,
		BirthSex: common.BirthSex_BIRTH_SEX_FEMALE,
		GenderIdentity: &common.GenderIdentity{
			Category:     common.GenderIdentity_CATEGORY_FEMALE,
			OtherDetails: proto.String("test"),
		},
	}

	tcs := []struct {
		Desc                           string
		CreateUnverifiedPatientRequest *patientspb.CreateUnverifiedPatientRequest
		PatientDBResponse              *patientssql.UnverifiedPatient
		PatientDBError                 error

		WantResponse *patientspb.CreateUnverifiedPatientResponse
		WantCode     codes.Code
	}{
		{
			Desc:                           "base case",
			CreateUnverifiedPatientRequest: exampleRequest,
			PatientDBResponse:              getExampleUnverifiedPatientSQL(),

			WantResponse: &patientspb.CreateUnverifiedPatientResponse{
				Patient:          examplePatient,
				ConsistencyToken: exampleConsistencyToken,
			},
			WantCode: codes.OK,
		},
		{
			Desc: "nil given name",
			CreateUnverifiedPatientRequest: &patientspb.CreateUnverifiedPatientRequest{
				AthenaId: athenaID,
				DateOfBirth: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   16,
				},
				FamilyName: proto.String("Smith"),
				PhoneNumber: &common.PhoneNumber{
					PhoneNumber: proto.String("+1-555-555-5555"),
				},
				LegalSex: common.Sex_SEX_FEMALE,
				BirthSex: common.BirthSex_BIRTH_SEX_FEMALE,
				GenderIdentity: &common.GenderIdentity{
					Category:     common.GenderIdentity_CATEGORY_FEMALE,
					OtherDetails: proto.String("test"),
				},
			},

			WantCode: codes.InvalidArgument,
		},
		{
			Desc: "nil family name",
			CreateUnverifiedPatientRequest: &patientspb.CreateUnverifiedPatientRequest{
				AthenaId: athenaID,
				DateOfBirth: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   16,
				},
				GivenName: proto.String("Jane"),
				PhoneNumber: &common.PhoneNumber{
					PhoneNumber: proto.String("+1-555-555-5555"),
				},
				LegalSex: common.Sex_SEX_FEMALE,
				BirthSex: common.BirthSex_BIRTH_SEX_FEMALE,
				GenderIdentity: &common.GenderIdentity{
					Category:     common.GenderIdentity_CATEGORY_FEMALE,
					OtherDetails: proto.String("test"),
				},
			},

			WantCode: codes.InvalidArgument,
		},
		{
			Desc: "nil Name",
			CreateUnverifiedPatientRequest: &patientspb.CreateUnverifiedPatientRequest{
				AthenaId: athenaID,
				DateOfBirth: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   16,
				},
				PhoneNumber: &common.PhoneNumber{
					PhoneNumber: proto.String("+1-555-555-5555"),
				},
				LegalSex: common.Sex_SEX_FEMALE,
				BirthSex: common.BirthSex_BIRTH_SEX_FEMALE,
				GenderIdentity: &common.GenderIdentity{
					Category:     common.GenderIdentity_CATEGORY_FEMALE,
					OtherDetails: proto.String("test"),
				},
			},

			WantCode: codes.InvalidArgument,
		},
		{
			Desc: "nil DOB",
			CreateUnverifiedPatientRequest: &patientspb.CreateUnverifiedPatientRequest{
				AthenaId:   athenaID,
				GivenName:  proto.String("Jane"),
				FamilyName: proto.String("Smith"),
				PhoneNumber: &common.PhoneNumber{
					PhoneNumber: proto.String("+1-555-555-5555"),
				},
				LegalSex: common.Sex_SEX_FEMALE,
				BirthSex: common.BirthSex_BIRTH_SEX_FEMALE,
				GenderIdentity: &common.GenderIdentity{
					Category:     common.GenderIdentity_CATEGORY_FEMALE,
					OtherDetails: proto.String("test"),
				},
			},

			WantCode: codes.InvalidArgument,
		},
		{
			Desc: "nil phone number",
			CreateUnverifiedPatientRequest: &patientspb.CreateUnverifiedPatientRequest{
				AthenaId: athenaID,
				DateOfBirth: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   16,
				},
				GivenName:  proto.String("Jane"),
				FamilyName: proto.String("Doe"),
				LegalSex:   common.Sex_SEX_FEMALE,
				BirthSex:   common.BirthSex_BIRTH_SEX_FEMALE,
				GenderIdentity: &common.GenderIdentity{
					Category:     common.GenderIdentity_CATEGORY_FEMALE,
					OtherDetails: proto.String("test"),
				},
			},

			WantCode: codes.InvalidArgument,
		},
		{
			Desc: "failed to convert phone number",
			CreateUnverifiedPatientRequest: &patientspb.CreateUnverifiedPatientRequest{
				AthenaId: proto.Int64(1),
				DateOfBirth: &common.Date{
					Year:  2023,
					Month: 6,
					Day:   16,
				},
				GivenName:  proto.String("Jane"),
				FamilyName: proto.String("Smith"),
				PhoneNumber: &common.PhoneNumber{
					PhoneNumber: proto.String("invalid format"),
				},
				LegalSex: common.Sex_SEX_FEMALE,
				BirthSex: common.BirthSex_BIRTH_SEX_FEMALE,
				GenderIdentity: &common.GenderIdentity{
					Category:     common.GenderIdentity_CATEGORY_FEMALE,
					OtherDetails: proto.String("test"),
				},
			},

			WantCode: codes.Internal,
		},
		{
			Desc:                           "failed to generate consistency token",
			CreateUnverifiedPatientRequest: exampleRequest,
			PatientDBResponse: &patientssql.UnverifiedPatient{
				ID:                    1,
				AthenaID:              sqltypes.ToValidNullInt64(1),
				DateOfBirth:           testDate,
				GivenName:             "John",
				FamilyName:            "Doe",
				PhoneNumber:           sql.NullString{String: "+1-555-555-5555", Valid: true},
				LegalSex:              patientssql.SexM,
				BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDMale),
				GenderIdentity:        ToNullGenderIdentity("m"),
				GenderIdentityDetails: sqltypes.ToValidNullString("test"),
				CreatedAt:             testDate,
				UpdatedAt:             time.Date(100000, time.January, 1, 0, 0, 0, 0, time.UTC),
			},

			WantCode: codes.Internal,
		},
		{
			Desc:                           "patient DB error",
			CreateUnverifiedPatientRequest: exampleRequest,
			PatientDBError:                 errors.New("some DB error"),

			WantCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{DBService: &DBServiceMock{
				AddUnverifiedPatientHandler: func(ctx context.Context, params patientssql.AddUnverifiedPatientParams) (*patientssql.UnverifiedPatient, error) {
					return tc.PatientDBResponse, tc.PatientDBError
				},
			}})

			resp, err := s.CreateUnverifiedPatient(ctx, tc.CreateUnverifiedPatientRequest)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.WantCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.WantResponse, resp)
		})
	}
}

func TestUpdateUnverifiedPatient(t *testing.T) {
	testDate := time.Date(2023, 6, 7, 0, 0, 0, 0, time.UTC)
	testDateConsistencyToken, _ := protoconv.TimestampToBytes(timestamppb.New(testDate))
	examplePatientProto := UnverifiedPatientSQLToProto(getExampleUnverifiedPatientSQL())
	exampleConsistencyToken, _ := protoconv.TimestampToBytes(timestamppb.New(getExampleUnverifiedPatientSQL().UpdatedAt))

	tcs := []struct {
		Desc                           string
		UpdateUnverifiedPatientRequest *patientspb.UpdateUnverifiedPatientRequest
		PatientDBGetResponse           *patientssql.UnverifiedPatient
		PatientDBGetError              error
		PatientDBUpdateResponse        *patientssql.UnverifiedPatient
		PatientDBUpdateError           error

		WantResponse *patientspb.UpdateUnverifiedPatientResponse
		WantCode     codes.Code
	}{
		{
			Desc: "base case",
			UpdateUnverifiedPatientRequest: &patientspb.UpdateUnverifiedPatientRequest{
				Patient:          examplePatientProto,
				ConsistencyToken: exampleConsistencyToken,
			},
			PatientDBGetResponse:    getExampleUnverifiedPatientSQL(),
			PatientDBUpdateResponse: getExampleUnverifiedPatientSQL(),

			WantResponse: &patientspb.UpdateUnverifiedPatientResponse{
				Patient:          examplePatientProto,
				ConsistencyToken: testDateConsistencyToken,
			},
			WantCode: codes.OK,
		},
		{
			Desc:                           "empty patient",
			UpdateUnverifiedPatientRequest: &patientspb.UpdateUnverifiedPatientRequest{},

			WantCode: codes.InvalidArgument,
		},
		{
			Desc: "patient DB error on get",
			UpdateUnverifiedPatientRequest: &patientspb.UpdateUnverifiedPatientRequest{
				Patient:          examplePatientProto,
				ConsistencyToken: exampleConsistencyToken,
			},
			PatientDBGetResponse: getExampleUnverifiedPatientSQL(),
			PatientDBUpdateError: errors.New("some DB error"),

			WantCode: codes.Internal,
		},
		{
			Desc: "patient DB error on update",
			UpdateUnverifiedPatientRequest: &patientspb.UpdateUnverifiedPatientRequest{
				Patient:          examplePatientProto,
				ConsistencyToken: exampleConsistencyToken,
			},
			PatientDBGetError: errors.New("some DB error"),

			WantCode: codes.Internal,
		},
		{
			Desc: "consistency tokens do not match",
			UpdateUnverifiedPatientRequest: &patientspb.UpdateUnverifiedPatientRequest{
				Patient:          examplePatientProto,
				ConsistencyToken: getConsistencyToken(getExamplePatient()),
			},
			PatientDBGetResponse: getExampleUnverifiedPatientSQL(),

			WantCode: codes.FailedPrecondition,
		},
		{
			Desc: "failed to generate token",
			UpdateUnverifiedPatientRequest: &patientspb.UpdateUnverifiedPatientRequest{
				Patient:          examplePatientProto,
				ConsistencyToken: exampleConsistencyToken,
			},
			PatientDBGetResponse: getExampleUnverifiedPatientSQL(),
			PatientDBUpdateResponse: &patientssql.UnverifiedPatient{
				ID:                    1,
				AthenaID:              sqltypes.ToValidNullInt64(1),
				DateOfBirth:           testDate,
				GivenName:             "John",
				FamilyName:            "Doe",
				PhoneNumber:           sql.NullString{String: "+1-555-555-5555", Valid: true},
				LegalSex:              patientssql.SexM,
				BirthSexID:            sqltypes.ToValidNullInt64(BirthSexIDMale),
				GenderIdentity:        ToNullGenderIdentity("m"),
				GenderIdentityDetails: sqltypes.ToValidNullString("test"),
				CreatedAt:             testDate,
				UpdatedAt:             time.Date(100000, time.January, 1, 0, 0, 0, 0, time.UTC),
			},

			WantCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{DBService: &DBServiceMock{
				GetUnverifiedPatientByIDHandler: func(ctx context.Context, id int64) (*patientssql.UnverifiedPatient, error) {
					return tc.PatientDBGetResponse, tc.PatientDBGetError
				},
				UpdateUnverifiedPatientByIDHandler: func(ctx context.Context, params patientssql.UpdateUnverifiedPatientParams) (*patientssql.UnverifiedPatient, error) {
					return tc.PatientDBUpdateResponse, tc.PatientDBUpdateError
				},
			}})

			resp, err := s.UpdateUnverifiedPatient(ctx, tc.UpdateUnverifiedPatientRequest)
			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.WantCode, reqStatus.Code())
			testutils.MustMatchProto(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

func TestFindOrCreatePatientForUnverifiedPatient(t *testing.T) {
	tcs := []struct {
		Desc                                           string
		FindOrCreatePatientForUnverifiedPatientRequest *patientspb.FindOrCreatePatientForUnverifiedPatientRequest
		DBGetUnverifiedPatientResponse                 *patientssql.UnverifiedPatient
		DBGetUnverifiedPatientError                    error
		AthenaResponse                                 *athenapb.GetPatientResponse
		AthenaError                                    error
		StationPatientResponse                         *stationpatientspb.GetPatientResponse
		StationPatientError                            error
		AthenaEBMResponse                              *athenapb.EnhancedBestMatchResponse
		AthenaEBMError                                 error
		AthenaCreateResponse                           *athenapb.CreatePatientResponse
		AthenaCreateError                              error
		StationPatientCreateResponse                   *stationpatientspb.FindOrCreatePatientResponse
		StationPatientCreateError                      error
		GetDepartmentIDResponse                        *stationpatientspb.GetDepartmentIDByBillingCityIDResponse
		GetDepartmentIDError                           error
		DBUpdateUnverifiedPatientResponse              *patientssql.UnverifiedPatient
		DBUpdateUnverifiedPatientError                 error
		ExpectedParams                                 patientssql.UpdateUnverifiedPatientParams

		WantResponse *patientspb.FindOrCreatePatientForUnverifiedPatientResponse
		WantGRPCCode codes.Code
	}{
		{
			Desc: "success - unverified patient has patient_id",
			FindOrCreatePatientForUnverifiedPatientRequest: &patientspb.FindOrCreatePatientForUnverifiedPatientRequest{
				Id:            proto.Int64(1),
				BillingCityId: proto.Int64(2),
			},
			DBGetUnverifiedPatientResponse: getExampleUnverifiedPatientSQL(),
			AthenaResponse: &athenapb.GetPatientResponse{
				Patient: getExampleAthenaPatientProto(),
			},
			StationPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			GetDepartmentIDResponse: &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{DepartmentId: "5"},

			WantResponse: &patientspb.FindOrCreatePatientForUnverifiedPatientResponse{
				Patient:          getExamplePatient(),
				ConsistencyToken: getConsistencyToken(getExamplePatient()),
			},
		},
		{
			Desc: "success - patient created from unverified patient",
			FindOrCreatePatientForUnverifiedPatientRequest: &patientspb.FindOrCreatePatientForUnverifiedPatientRequest{
				Id:            proto.Int64(1),
				BillingCityId: proto.Int64(5),
			},
			DBGetUnverifiedPatientResponse: getExampleUnverifiedPatientWithoutPatientIDSQL(),
			GetDepartmentIDResponse:        &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{DepartmentId: "5"},
			AthenaEBMResponse:              &athenapb.EnhancedBestMatchResponse{Results: nil},
			AthenaCreateResponse:           &athenapb.CreatePatientResponse{PatientId: proto.String("12")},
			StationPatientCreateResponse:   &stationpatientspb.FindOrCreatePatientResponse{PatientId: 123},
			StationPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			AthenaResponse: &athenapb.GetPatientResponse{
				Patient: getExampleAthenaPatientProto(),
			},
			DBUpdateUnverifiedPatientResponse: &patientssql.UnverifiedPatient{},
			ExpectedParams: patientssql.UpdateUnverifiedPatientParams{
				ID:                    getExampleUnverifiedPatientWithoutPatientIDSQL().ID,
				AthenaID:              sqltypes.ToValidNullInt64(789),
				DateOfBirth:           getExampleUnverifiedPatientWithoutPatientIDSQL().DateOfBirth,
				GivenName:             getExampleUnverifiedPatientWithoutPatientIDSQL().GivenName,
				FamilyName:            getExampleUnverifiedPatientWithoutPatientIDSQL().FamilyName,
				PhoneNumber:           getExampleUnverifiedPatientWithoutPatientIDSQL().PhoneNumber,
				LegalSex:              getExampleUnverifiedPatientWithoutPatientIDSQL().LegalSex,
				BirthSexID:            getExampleUnverifiedPatientWithoutPatientIDSQL().BirthSexID,
				GenderIdentity:        getExampleUnverifiedPatientWithoutPatientIDSQL().GenderIdentity,
				GenderIdentityDetails: getExampleUnverifiedPatientWithoutPatientIDSQL().GenderIdentityDetails,
				PatientID:             sqltypes.ToValidNullInt64(1234),
			},

			WantResponse: &patientspb.FindOrCreatePatientForUnverifiedPatientResponse{
				Patient:          getExamplePatient(),
				ConsistencyToken: getConsistencyToken(getExamplePatient()),
			},
		},
		{
			Desc: "error - failed to get unverified patient",
			FindOrCreatePatientForUnverifiedPatientRequest: &patientspb.FindOrCreatePatientForUnverifiedPatientRequest{
				Id:            proto.Int64(2),
				BillingCityId: proto.Int64(2),
			},
			DBGetUnverifiedPatientError: errors.New("some DB error"),

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "error - existing patient linked - existing patient not found",
			FindOrCreatePatientForUnverifiedPatientRequest: &patientspb.FindOrCreatePatientForUnverifiedPatientRequest{
				Id:            proto.Int64(1),
				BillingCityId: proto.Int64(2),
			},
			DBGetUnverifiedPatientResponse: getExampleUnverifiedPatientSQL(),
			AthenaResponse: &athenapb.GetPatientResponse{
				Patient: getExampleAthenaPatientProto(),
			},
			StationPatientError:     status.Error(codes.NotFound, "failed to retrieve patient from StationPatientsService"),
			GetDepartmentIDResponse: &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{DepartmentId: "5"},

			WantGRPCCode: codes.NotFound,
		},
		{
			Desc: "error - no existing patient linked - no billing city ID",
			FindOrCreatePatientForUnverifiedPatientRequest: &patientspb.FindOrCreatePatientForUnverifiedPatientRequest{
				Id: proto.Int64(1),
			},
			DBGetUnverifiedPatientResponse: getExampleUnverifiedPatientWithoutPatientIDSQL(),
			GetDepartmentIDResponse:        &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{DepartmentId: "5"},
			AthenaEBMResponse:              &athenapb.EnhancedBestMatchResponse{Results: nil},
			AthenaCreateResponse:           &athenapb.CreatePatientResponse{PatientId: proto.String("12")},
			StationPatientCreateResponse:   &stationpatientspb.FindOrCreatePatientResponse{PatientId: 123},
			StationPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			AthenaResponse: &athenapb.GetPatientResponse{
				Patient: getExampleAthenaPatientProto(),
			},
			DBUpdateUnverifiedPatientResponse: &patientssql.UnverifiedPatient{},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "error - no existing patient linked - failed to create patient",
			FindOrCreatePatientForUnverifiedPatientRequest: &patientspb.FindOrCreatePatientForUnverifiedPatientRequest{
				Id:            proto.Int64(1),
				BillingCityId: proto.Int64(5),
			},
			DBGetUnverifiedPatientResponse: getExampleUnverifiedPatientWithoutPatientIDSQL(),
			GetDepartmentIDResponse:        &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{DepartmentId: "5"},
			AthenaEBMResponse:              &athenapb.EnhancedBestMatchResponse{Results: nil},
			AthenaCreateResponse:           &athenapb.CreatePatientResponse{PatientId: proto.String("12")},
			AthenaError:                    status.Error(codes.Internal, "error creating patient"),
			StationPatientCreateResponse:   &stationpatientspb.FindOrCreatePatientResponse{PatientId: 123},
			StationPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			AthenaResponse: &athenapb.GetPatientResponse{
				Patient: getExampleAthenaPatientProto(),
			},
			DBUpdateUnverifiedPatientResponse: &patientssql.UnverifiedPatient{},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "error - no existing patient linked - failed to update unverified patient",
			FindOrCreatePatientForUnverifiedPatientRequest: &patientspb.FindOrCreatePatientForUnverifiedPatientRequest{
				Id:            proto.Int64(1),
				BillingCityId: proto.Int64(5),
			},
			DBGetUnverifiedPatientResponse: getExampleUnverifiedPatientWithoutPatientIDSQL(),
			GetDepartmentIDResponse:        &stationpatientspb.GetDepartmentIDByBillingCityIDResponse{DepartmentId: "5"},
			AthenaEBMResponse:              &athenapb.EnhancedBestMatchResponse{Results: nil},
			AthenaCreateResponse:           &athenapb.CreatePatientResponse{PatientId: proto.String("12")},
			StationPatientCreateResponse:   &stationpatientspb.FindOrCreatePatientResponse{PatientId: 123},
			StationPatientResponse: &stationpatientspb.GetPatientResponse{
				Patient: getExampleStationPatientProto(),
			},
			AthenaResponse: &athenapb.GetPatientResponse{
				Patient: getExampleAthenaPatientProto(),
			},
			DBUpdateUnverifiedPatientError: errors.New("update failed"),

			WantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := setupPatientsGRPCServer(GRPCServerConfig{AthenaClient: &AthenaServiceClientMock{
				GetPatientHandler: func(ctx context.Context, in *athenapb.GetPatientRequest, opts ...grpc.CallOption) (*athenapb.GetPatientResponse, error) {
					return tc.AthenaResponse, tc.AthenaError
				},
				EnhancedBestMatchHandler: func(ctx context.Context, in *athenapb.EnhancedBestMatchRequest, opts ...grpc.CallOption) (*athenapb.EnhancedBestMatchResponse, error) {
					return tc.AthenaEBMResponse, tc.AthenaEBMError
				},
				CreatePatientHandler: func(ctx context.Context, in *athenapb.CreatePatientRequest, opts ...grpc.CallOption) (*athenapb.CreatePatientResponse, error) {
					return tc.AthenaCreateResponse, tc.AthenaCreateError
				},
			},
				DBService: &DBServiceMock{
					UpdateUnverifiedPatientByIDHandler: func(ctx context.Context, params patientssql.UpdateUnverifiedPatientParams) (*patientssql.UnverifiedPatient, error) {
						if params != tc.ExpectedParams {
							return nil, errors.New("update params do not match")
						}
						return tc.DBUpdateUnverifiedPatientResponse, tc.DBUpdateUnverifiedPatientError
					},
					GetUnverifiedPatientByIDHandler: func(ctx context.Context, id int64) (*patientssql.UnverifiedPatient, error) {
						return tc.DBGetUnverifiedPatientResponse, tc.DBGetUnverifiedPatientError
					},
				}, StationPatientsClient: &StationPatientsClientMock{
					GetPatientHandler: func(ctx context.Context, in *stationpatientspb.GetPatientRequest, opts ...grpc.CallOption) (*stationpatientspb.GetPatientResponse, error) {
						return tc.StationPatientResponse, tc.StationPatientError
					},
					GetDepartmentIDByBillingCityIDHandler: func(ctx context.Context, in *stationpatientspb.GetDepartmentIDByBillingCityIDRequest, opts ...grpc.CallOption) (*stationpatientspb.GetDepartmentIDByBillingCityIDResponse, error) {
						return tc.GetDepartmentIDResponse, tc.GetDepartmentIDError
					},
					FindOrCreatePatientsHandler: func(ctx context.Context, in *stationpatientspb.FindOrCreatePatientRequest, opts ...grpc.CallOption) (*stationpatientspb.FindOrCreatePatientResponse, error) {
						return tc.StationPatientCreateResponse, tc.StationPatientCreateError
					},
				}})

			resp, err := s.FindOrCreatePatientForUnverifiedPatient(ctx, tc.FindOrCreatePatientForUnverifiedPatientRequest)
			respStatus := status.Convert(err)

			if respStatus.Code() != tc.WantGRPCCode {
				t.Fatalf(responseStatusMessage, respStatus, respStatus.Code(), tc.WantGRPCCode)
			}

			testutils.MustMatch(t, tc.WantGRPCCode, respStatus.Code())
			testutils.MustMatchProto(t, tc.WantResponse, resp, "response does not match")
		})
	}
}

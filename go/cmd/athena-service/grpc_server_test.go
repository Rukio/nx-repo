package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/athena"
	"github.com/*company-data-covered*/services/go/pkg/athena/converters"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/grpc-ecosystem/grpc-gateway/v2/runtime"
	"github.com/nyaruka/phonenumbers"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

var (
	careTeamMemberID                 = proto.String("1")
	careTeamMemberClinicalProviderID = proto.String("2")
	careTeamMemberFacilityID         = proto.String("3")
	careTeamMemberProviderID         = proto.String("4")
	careTeamMemberAnsisSpecialty     = proto.String("Internal medicine")
	careTeamMemberName               = proto.String("Luis Miguel Basteri MD")
	careTeamMemberFirstName          = proto.String("Luis")
	careTeamMemberLastName           = proto.String("Miguel")
	careTeamMemberMiddleName         = proto.String("Baster")
	careTeamMemberPreferredName      = proto.String("Luismi")
	careTeamMemberSuffix             = proto.String("MD")
	careTeamMemberAddress1           = proto.String("The miami's hospital")
	careTeamMemberAddress2           = proto.String("3445 Lake avenue")
	careTeamMemberCity               = proto.String("Queens")
	careTeamMemberCountry            = proto.String("US")
	careTeamMemberState              = proto.String("NY")
	careTeamMemberZip                = proto.String("12345")
	careTeamMemberFax                = proto.String("3033234823")
	careTeamMemberNPI                = proto.String("1811234148")
	careTeamMemberPhoneNumber        = proto.String("(718) 377-1982")
	recipientClassDesc               = proto.String("Primary Care Provider")
	recipientClassCode               = proto.String("5")
	sexProto                         = commonpb.Sex_SEX_FEMALE
	relationToPatientProto           = athenapb.RelationToPatient_RELATION_TO_PATIENT_MOTHER

	goodAthenaInsurance = converters.PatientInsurance{
		InsuranceID:        proto.String("54321"),
		InsurancePackageID: proto.String("1234"),
		PolicyNumber:       proto.String("4321"),
		InsuranceHolder: &converters.InsuranceHolder{
			InsuranceHolderName: &converters.InsuranceHolderName{
				FirstName:  proto.String("Lorem"),
				MiddleName: proto.String("Ipsum"),
				LastName:   proto.String("Dolor"),
			},
			DOB:                        proto.String("01/30/1970"),
			Sex:                        proto.String("F"),
			RelationshipToPolicyHolder: proto.String("18"),
		},
	}
	unexpectedFieldTypeInAthenaInsuranceResponse = converters.PatientInsurance{
		InsuranceID:        proto.String("54321"),
		InsurancePackageID: proto.String("not a numeric ID"),
		PolicyNumber:       proto.String("4321"),
		InsuranceHolder: &converters.InsuranceHolder{
			InsuranceHolderName: &converters.InsuranceHolderName{
				FirstName:  proto.String("Lorem"),
				MiddleName: proto.String("Ipsum"),
				LastName:   proto.String("Dolor"),
			},
			DOB:                        proto.String("01/30/1970"),
			Sex:                        proto.String("F"),
			RelationshipToPolicyHolder: proto.String("18"),
		},
	}
)

func TestHttpResponseModifier(t *testing.T) {
	testCases := []struct {
		name     string
		metadata runtime.ServerMetadata

		expectedStatusCode int
		expectedErrorMsg   string
	}{
		{
			name: "works",
			metadata: runtime.ServerMetadata{
				HeaderMD: metadata.New(map[string]string{
					"x-http-code": "503",
				}),
			},

			expectedStatusCode: 503,
		},
		{
			name:     "does not modify a request without the custom x-http-code header",
			metadata: runtime.ServerMetadata{},

			expectedStatusCode: 200,
		},
		{
			name: "fails to parse invalid status codes",
			metadata: runtime.ServerMetadata{
				HeaderMD: metadata.New(map[string]string{
					"x-http-code": "this-is-not-an-http-code",
				}),
			},

			expectedErrorMsg: `strconv.Atoi: parsing "this-is-not-an-http-code": invalid syntax`,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			ctx := runtime.NewServerMetadataContext(
				context.Background(),
				testCase.metadata,
			)

			w := httptest.NewRecorder()

			err := httpResponseModifier(ctx, w, nil)

			res := w.Result()
			defer res.Body.Close()

			if testCase.expectedErrorMsg == "" && err != nil {
				t.Fatal("Unexpected error when modifying the response", err.Error())
			}

			if testCase.expectedErrorMsg != "" {
				testutils.MustMatch(t, testCase.expectedErrorMsg, err.Error(), "httpResponseModifier error does not match test case")
			} else {
				testutils.MustMatch(t, testCase.expectedStatusCode, res.StatusCode, "httpResponseModifier set an incorrect status code")
			}
		})
	}
}

func TestGRPCServerGetPatient(t *testing.T) {
	goodAthenaServer := httptest.NewServer(http.HandlerFunc(
		func(rw http.ResponseWriter, req *http.Request) {
			rw.WriteHeader(http.StatusOK)
			rw.Write([]byte(`[{"homephone":"5556666888","guarantorstate":"CO","portalaccessgiven":"false","contactrelationship":"SPOUSE","guarantordob":"04/30/1949","zip":"61364","guarantoraddresssameaspatient":"true","contactmobilephone":"5550676888","lastname":"Heidenreich","guarantorfirstname":"Giovani","city":"DELBERTSIDE","guarantorcity":"DENVER","guarantorzip":"80202-5107","sex":"F","primaryproviderid":"1","contactpreference_billing_email":"true","contactname":"BOYD","contactpreference_announcement_email":"true","registrationdate":"08/31/2016","guarantorlastname":"Johnson","firstname":"John","guarantorcountrycode":"USA","state":"CO","patientid":"29","dob":"05/20/1949","guarantorrelationshiptopatient":"1","address1":"558 Torrey Fords, Damari","guarantorphone":"5550676888","countrycode":"USA","guarantoraddress1":"Apt. 500 6544 Dietrich R","countrycode3166":"US"}]`))
		},
	))
	defer goodAthenaServer.Close()
	badAthenaServer := httptest.NewServer(http.HandlerFunc(
		func(rw http.ResponseWriter, req *http.Request) {
			rw.WriteHeader(http.StatusInternalServerError)
			rw.Write([]byte(`other response`))
		},
	))
	defer badAthenaServer.Close()

	type globals struct {
		athenaHTTPClient *http.Client
		athenaURL        string
	}

	type args struct {
		request *athenapb.GetPatientRequest
	}
	tests := []struct {
		name              string
		AuditServiceError error
		args              args
		globals           globals
		want              *athenapb.GetPatientResponse
		wantErr           bool
	}{
		{
			name:              "Base Case",
			AuditServiceError: nil,
			globals: globals{
				athenaHTTPClient: goodAthenaServer.Client(),
				athenaURL:        goodAthenaServer.URL,
			},
			args: args{
				request: &athenapb.GetPatientRequest{
					PatientId: proto.String("21"),
				},
			},
			want: &athenapb.GetPatientResponse{
				Patient: &athenapb.Patient{
					PatientId: proto.String("29"),
					Name: &commonpb.Name{
						GivenName:  proto.String("John"),
						FamilyName: proto.String("Heidenreich"),
					},
					DateOfBirth: &commonpb.Date{
						Year:  1949,
						Month: 5,
						Day:   20,
					},
					Sex: proto.String("F"),
					ContactInfo: &athenapb.ContactInfo{
						HomeNumber: &commonpb.PhoneNumber{
							PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
							CountryCode:     proto.Int32(1),
							PhoneNumber:     proto.String("(555) 666-6888"),
						},
						Address: &commonpb.Address{
							AddressLineOne: proto.String("558 Torrey Fords, Damari"),
							City:           proto.String("DELBERTSIDE"),
							State:          proto.String("CO"),
							ZipCode:        proto.String("61364"),
						},
					},
					EmergencyContact: &athenapb.EmergencyContact{
						ContactName:         proto.String("BOYD"),
						ContactRelationship: proto.String("SPOUSE"),
						ContactMobilephone:  proto.String("5550676888"),
					},
					Guarantor: &athenapb.Guarantor{
						Name: &commonpb.Name{
							GivenName:  proto.String("Giovani"),
							FamilyName: proto.String("Johnson"),
						},
						DateOfBirth: &commonpb.Date{
							Year:  1949,
							Month: 4,
							Day:   30,
						},
						ContactInfo: &athenapb.ContactInfo{
							HomeNumber: &commonpb.PhoneNumber{
								PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
								CountryCode:     proto.Int32(1),
								PhoneNumber:     proto.String("(555) 067-6888"),
							},
							Address: &commonpb.Address{
								AddressLineOne: proto.String("Apt. 500 6544 Dietrich R"),
								City:           proto.String("DENVER"),
								State:          proto.String("CO"),
								ZipCode:        proto.String("80202-5107"),
							},
						},
						SameAddressAsPatient:  proto.Bool(true),
						RelationshipToPatient: proto.String("1"),
					},
					PrimaryProviderId: proto.String("1"),
					PortalAccessGiven: proto.Bool(false),
				},
			},
			wantErr: false,
		},
		{
			name:              "No patient ID",
			AuditServiceError: nil,
			globals: globals{
				athenaHTTPClient: goodAthenaServer.Client(),
				athenaURL:        goodAthenaServer.URL,
			},
			args: args{
				request: &athenapb.GetPatientRequest{},
			},
			want:    nil,
			wantErr: true,
		},
		{
			name:              "error requesting patient from athena API",
			AuditServiceError: errors.New("an error occurred saving the event"),
			globals: globals{
				athenaHTTPClient: badAthenaServer.Client(),
				athenaURL:        badAthenaServer.URL,
			},
			args: args{
				request: &athenapb.GetPatientRequest{},
			},
			want:    nil,
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			s := &GRPCServer{
				AuthToken: &mockAuthValuer{},
				AthenaClient: &athena.Client{
					AuthToken:     mockAuthValuer{},
					AthenaBaseURL: tt.globals.athenaURL,
					HTTPClient:    tt.globals.athenaHTTPClient,
				},
				Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}
			got, err := s.GetPatient(context.Background(), tt.args.request)
			if (err != nil) != tt.wantErr {
				t.Errorf("GetPatient() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			testutils.MustMatchProto(t, tt.want, got)
		})
	}
}

func TestGRPCServerEnhancedBestMatch(t *testing.T) {
	tests := []struct {
		name         string
		request      *athenapb.EnhancedBestMatchRequest
		response     []*converters.EnhancedBestMatchResult
		responseCode int

		want     *athenapb.EnhancedBestMatchResponse
		wantCode codes.Code
	}{
		{
			name: "Base Case",
			request: &athenapb.EnhancedBestMatchRequest{
				FirstName:   "Luke",
				LastName:    "Skywalker",
				DateOfBirth: &commonpb.Date{Year: 2001, Month: 10, Day: 30},
			},
			response: []*converters.EnhancedBestMatchResult{
				{Patient: &converters.Patient{PatientID: proto.String("A1234")}, Score: "23"},
			},
			responseCode: 200,
			want: &athenapb.EnhancedBestMatchResponse{
				Results: []*athenapb.EnhancedBestMatchResult{
					{Patient: &athenapb.Patient{PatientId: proto.String("A1234")}, ScoreString: "23"},
				},
			},
			wantCode: codes.OK,
		},
		{
			name: "Float Score",
			request: &athenapb.EnhancedBestMatchRequest{
				FirstName:   "Luke",
				LastName:    "Skywalker",
				DateOfBirth: &commonpb.Date{Year: 2001, Month: 10, Day: 30},
			},
			response: []*converters.EnhancedBestMatchResult{
				{Patient: &converters.Patient{PatientID: proto.String("A1234")}, Score: 23.5},
			},
			responseCode: 200,
			want: &athenapb.EnhancedBestMatchResponse{
				Results: []*athenapb.EnhancedBestMatchResult{
					{Patient: &athenapb.Patient{PatientId: proto.String("A1234")}, ScoreString: "23.5"},
				},
			},
			wantCode: codes.OK,
		},
		{
			name: "Unrecognized Score Type",
			request: &athenapb.EnhancedBestMatchRequest{
				FirstName:   "Luke",
				LastName:    "Skywalker",
				DateOfBirth: &commonpb.Date{Year: 2001, Month: 10, Day: 30},
			},
			response: []*converters.EnhancedBestMatchResult{
				{Patient: &converters.Patient{PatientID: proto.String("A1234")}},
			},
			wantCode: codes.Internal,
		},
		{
			name: "Missing first name",
			request: &athenapb.EnhancedBestMatchRequest{
				LastName:    "Skywalker",
				DateOfBirth: &commonpb.Date{Year: 2001, Month: 10, Day: 30},
			},
			wantCode: codes.InvalidArgument,
		},
		{
			name: "Missing last name",
			request: &athenapb.EnhancedBestMatchRequest{
				FirstName:   "Luke",
				DateOfBirth: &commonpb.Date{Year: 2001, Month: 10, Day: 30},
			},
			wantCode: codes.InvalidArgument,
		},
		{
			name: "Missing DOB",
			request: &athenapb.EnhancedBestMatchRequest{
				FirstName: "Luke",
				LastName:  "Skywalker",
			},
			wantCode: codes.InvalidArgument,
		},
		{
			name: "Athena error",
			request: &athenapb.EnhancedBestMatchRequest{
				FirstName:   "Luke",
				LastName:    "Skywalker",
				DateOfBirth: &commonpb.Date{Year: 2001, Month: 10, Day: 30},
			},
			responseCode: 500,
			wantCode:     codes.Internal,
		},
		{
			name: "Fail to convert Athena response to proto",
			request: &athenapb.EnhancedBestMatchRequest{
				FirstName:   "Luke",
				LastName:    "Skywalker",
				DateOfBirth: &commonpb.Date{Year: 2001, Month: 10, Day: 30},
			},
			response: []*converters.EnhancedBestMatchResult{
				{Patient: &converters.Patient{DOB: proto.String("lol")}},
			},
			responseCode: 200,
			wantCode:     codes.Internal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.responseCode)

					resp, err := json.Marshal(tt.response)
					if err != nil {
						t.Fatalf("Failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer athenaServer.Close()

			s := &GRPCServer{
				AuthToken: &mockAuthValuer{},
				AthenaClient: &athena.Client{
					AuthToken:     mockAuthValuer{},
					AthenaBaseURL: athenaServer.URL,
					HTTPClient:    athenaServer.Client(),
				},
				Logger: zap.NewNop().Sugar(),
			}
			got, err := s.EnhancedBestMatch(context.Background(), tt.request)
			if status.Convert(err).Code() != tt.wantCode {
				t.Fatalf("EnhancedBestMatch() error = %v, wantCode %v", err, tt.wantCode)
			}
			testutils.MustMatchProto(t, tt.want, got)
		})
	}
}

func setup(_ *testing.T, athenaURL string, athenaHTTPClient *http.Client) (*GRPCServer, context.Context) {
	return &GRPCServer{
		AuthToken: mockAuthValuer{},
		AthenaClient: &athena.Client{
			AuthToken:     mockAuthValuer{},
			AthenaBaseURL: athenaURL,
			HTTPClient:    athenaHTTPClient,
		},
		Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
	}, context.Background()
}

func newTestPatient() athenapb.Patient {
	return athenapb.Patient{
		PatientId: proto.String("29"),
		Name: &commonpb.Name{
			GivenName:  proto.String("John"),
			FamilyName: proto.String("Heidenreich"),
		},
		DateOfBirth: &commonpb.Date{
			Year:  1949,
			Month: 5,
			Day:   20,
		},
		Sex: proto.String("F"),
		ContactInfo: &athenapb.ContactInfo{
			HomeNumber: &commonpb.PhoneNumber{
				PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(555) 666-6888"),
			},
			Address: &commonpb.Address{
				AddressLineOne: proto.String("558 Torrey Fords, Damari"),
				City:           proto.String("DELBERTSIDE"),
				State:          proto.String("CO"),
				ZipCode:        proto.String("61364"),
			},
		},
		EmergencyContact: &athenapb.EmergencyContact{
			ContactName:         proto.String("BOYD"),
			ContactRelationship: proto.String("SPOUSE"),
			ContactMobilephone:  proto.String("5550676888"),
		},
		Guarantor: &athenapb.Guarantor{
			Name: &commonpb.Name{
				GivenName:  proto.String("Giovani"),
				FamilyName: proto.String("Johnson"),
			},
			DateOfBirth: &commonpb.Date{
				Year:  1949,
				Month: 4,
				Day:   30,
			},
			ContactInfo: &athenapb.ContactInfo{
				HomeNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
					CountryCode:     proto.Int32(1),
					PhoneNumber:     proto.String("(555) 067-6888"),
				},
				Address: &commonpb.Address{
					AddressLineOne: proto.String("Apt. 500 6544 Dietrich R"),
					City:           proto.String("DENVER"),
					State:          proto.String("CO"),
					ZipCode:        proto.String("80202-5107"),
				},
			},
			SameAddressAsPatient:  proto.Bool(true),
			RelationshipToPatient: proto.String("1"),
		},
		PrimaryProviderId: proto.String("1"),
		PortalAccessGiven: proto.Bool(false),
		DepartmentId:      proto.String("1"),
	}
}

func newTestPatientInsurance(patientID *string, packageID *int64, insuranceID *string) athenapb.Insurance {
	sex := commonpb.Sex_SEX_FEMALE
	relationToPatient := athenapb.RelationToPatient_RELATION_TO_PATIENT_FATHER
	return athenapb.Insurance{
		PatientId:    patientID,
		DepartmentId: proto.String("321"),
		MemberId:     proto.String("54321"),
		PackageId:    packageID,
		GroupId:      proto.Int64(4321),
		PrimaryInsuranceHolder: &athenapb.PrimaryInsuranceHolder{
			Name: &commonpb.Name{
				GivenName:           proto.String("Lorem"),
				FamilyName:          proto.String("Dolor"),
				MiddleNameOrInitial: proto.String("Ipsum"),
			},
			DateOfBirth: &commonpb.Date{
				Year:  1970,
				Month: 1,
				Day:   30,
			},
			Sex:      &sex,
			Relation: &relationToPatient,
		},
		UpdateAppointments: proto.Bool(true),
		InsuranceId:        insuranceID,
	}
}

func TestGetCareTeam(t *testing.T) {
	tests := []struct {
		desc             string
		getCareTeamReq   *athenapb.GetCareTeamRequest
		athenaHTTPStatus int
		athenaResponse   *converters.CareTeam

		wantGRPCCode codes.Code
		wantResponse *athenapb.GetCareTeamResponse
	}{
		{
			desc: "success - get care team",
			getCareTeamReq: &athenapb.GetCareTeamRequest{
				PatientId:    proto.String("1"),
				DepartmentId: proto.String("2"),
			},
			athenaHTTPStatus: http.StatusOK,
			athenaResponse: &converters.CareTeam{
				Members: []converters.CareTeamMember{
					{
						MemberID:           careTeamMemberID,
						ClinicalProviderID: careTeamMemberClinicalProviderID,
						FacilityID:         careTeamMemberFacilityID,
						ProviderID:         careTeamMemberProviderID,
						AnsiSpecialtyName:  careTeamMemberAnsisSpecialty,
						Name:               careTeamMemberName,
						FirstName:          careTeamMemberFirstName,
						LastName:           careTeamMemberLastName,
						MiddleName:         careTeamMemberMiddleName,
						PreferredName:      careTeamMemberPreferredName,
						Suffix:             careTeamMemberSuffix,
						Address1:           careTeamMemberAddress1,
						Address2:           careTeamMemberAddress2,
						City:               careTeamMemberCity,
						Country:            careTeamMemberCountry,
						State:              careTeamMemberState,
						Zip:                careTeamMemberZip,
						Fax:                careTeamMemberFax,
						NPI:                careTeamMemberNPI,
						PhoneNumber:        careTeamMemberPhoneNumber,
						RecipientClass: &converters.RecipientClass{
							Description: recipientClassDesc,
							Code:        recipientClassCode,
						},
					},
				},
				Note: proto.String("Emergency"),
			},

			wantGRPCCode: codes.OK,
			wantResponse: &athenapb.GetCareTeamResponse{
				Members: []*athenapb.CareTeamMember{
					{
						Address: &commonpb.Address{
							AddressLineOne: careTeamMemberAddress1,
							AddressLineTwo: careTeamMemberAddress2,
							City:           careTeamMemberCity,
							State:          careTeamMemberState,
							ZipCode:        careTeamMemberZip,
						},
						Name: &commonpb.Name{
							GivenName:           careTeamMemberFirstName,
							FamilyName:          careTeamMemberLastName,
							MiddleNameOrInitial: careTeamMemberMiddleName,
							Suffix:              careTeamMemberSuffix,
							PreferredName:       careTeamMemberPreferredName,
						},
						Phone: &commonpb.PhoneNumber{
							CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
							PhoneNumber:     careTeamMemberPhoneNumber,
							PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
						},
						ClinicalProviderId: careTeamMemberClinicalProviderID,
						AnsiSpecialtyName:  careTeamMemberAnsisSpecialty,
						Country:            careTeamMemberCountry,
						FacilityId:         careTeamMemberFacilityID,
						MemberId:           careTeamMemberID,
						Npi:                careTeamMemberNPI,
						ProviderId:         careTeamMemberProviderID,
						RecipientClass: &athenapb.RecipientClass{
							Description: recipientClassDesc,
							Code:        recipientClassCode,
						},
					},
				},
				Note: proto.String("Emergency"),
			},
		},
		{
			desc: "failure - patient id is empty",

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - department id is empty",
			getCareTeamReq: &athenapb.GetCareTeamRequest{
				PatientId: proto.String("1"),
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - athena is not available",
			getCareTeamReq: &athenapb.GetCareTeamRequest{
				PatientId:    proto.String("1"),
				DepartmentId: proto.String("2"),
			},
			athenaHTTPStatus: http.StatusServiceUnavailable,

			wantGRPCCode: codes.Internal,
		},
		{
			desc: "failure - patient does not have care team",
			getCareTeamReq: &athenapb.GetCareTeamRequest{
				PatientId:    proto.String("1"),
				DepartmentId: proto.String("2"),
			},
			athenaHTTPStatus: http.StatusOK,
			athenaResponse:   &converters.CareTeam{},

			wantGRPCCode: codes.NotFound,
		},
		{
			desc: "failure - unable to convert care team to care team proto",
			getCareTeamReq: &athenapb.GetCareTeamRequest{
				PatientId:    proto.String("1"),
				DepartmentId: proto.String("2"),
			},
			athenaHTTPStatus: http.StatusOK,
			athenaResponse: &converters.CareTeam{
				Members: []converters.CareTeamMember{
					{
						PhoneNumber: proto.String("+1"),
					},
				},
			},

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					resp, err := json.Marshal(tt.athenaResponse)
					if err != nil {
						t.Fatalf("Failed to marshal json: %s", err)
					}
					rw.Write(resp)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())

			resp, err := s.GetCareTeam(ctx, tt.getCareTeamReq)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")

			testutils.MustMatch(t, tt.wantResponse, resp, "response does not match")
		})
	}
}

func TestGRPCServerUpdatePatientDefaultPharmacy(t *testing.T) {
	type args struct {
		request *athenapb.UpdateDefaultPharmacyRequest
	}

	goodRequest := athenapb.UpdateDefaultPharmacyRequest{
		PatientId:          "23",
		DepartmentId:       "2",
		ClinicalProviderId: "10812312",
	}

	tests := []struct {
		name              string
		args              args
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.UpdateDefaultPharmacyResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus: http.StatusOK,
			want:             &athenapb.UpdateDefaultPharmacyResponse{},
			wantGRPCCode:     codes.OK,
		},
		{
			name: "failure - no patient id",
			args: args{
				request: &athenapb.UpdateDefaultPharmacyRequest{
					DepartmentId:       "2",
					ClinicalProviderId: "10812312",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no department id",
			args: args{
				request: &athenapb.UpdateDefaultPharmacyRequest{
					PatientId:          "23",
					ClinicalProviderId: "10812312",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no clinical provider id",
			args: args{
				request: &athenapb.UpdateDefaultPharmacyRequest{
					PatientId:    "23",
					DepartmentId: "2",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - athena server is unavailable",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Unknown,
		},
		{
			name: "failure - data for requested patientID, departmentID and clinicalProviderId not found",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.UpdateDefaultPharmacy(ctx, tt.args.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerGetPatientPreferredPharmacy(t *testing.T) {
	type args struct {
		request *athenapb.GetPreferredPharmaciesRequest
	}

	goodRequest := athenapb.GetPreferredPharmaciesRequest{
		PatientId:    "23",
		DepartmentId: "2",
	}

	tests := []struct {
		name              string
		args              args
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.GetPreferredPharmaciesResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`{"pharmacies": [{"pharmacytype": "RETAIL","defaultpharmacy": "true","state": "CO","city": "Littleton","receivertype": "ERX","acceptfax": "true","clinicalproviderid": "10812345","zip": "801232101","phonenumber": "3031231234","clinicalprovidername": "King Soopers Pharmacy 62000050","address1": "1234 W Belleview","faxnumber": "3031231234"}],"totalcount": 1}`),

			want: &athenapb.GetPreferredPharmaciesResponse{
				Pharmacies: []*athenapb.Pharmacy{
					{
						PharmacyType:    proto.String("RETAIL"),
						DefaultPharmacy: proto.String("true"),
						Address: &commonpb.Address{
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
						PhoneNumber: &commonpb.PhoneNumber{
							PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK,
							CountryCode:     proto.Int32(1),
							PhoneNumber:     proto.String("(303) 123-1234"),
						},
						FaxNumber: proto.String("3031231234"),
					},
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name: "failure - no patient id",
			args: args{
				request: &athenapb.GetPreferredPharmaciesRequest{
					DepartmentId: "2",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no department id",
			args: args{
				request: &athenapb.GetPreferredPharmaciesRequest{
					PatientId: "23",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - athena server is unavailable",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure - unable to convert athena response",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`wrong response json`),

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure - data for requested patientID and departmentID pair not found",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.GetPreferredPharmacies(ctx, tt.args.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerUpdatePatientPreferredPharmacy(t *testing.T) {
	type args struct {
		request *athenapb.UpdatePreferredPharmacyRequest
	}

	goodRequest := athenapb.UpdatePreferredPharmacyRequest{
		PatientId:          "23",
		DepartmentId:       "2",
		ClinicalProviderId: "10812312",
	}

	tests := []struct {
		name              string
		args              args
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.UpdatePreferredPharmacyResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus: http.StatusOK,
			want:             &athenapb.UpdatePreferredPharmacyResponse{},
			wantGRPCCode:     codes.OK,
		},
		{
			name: "failure - no patient id",
			args: args{
				request: &athenapb.UpdatePreferredPharmacyRequest{
					DepartmentId:       "2",
					ClinicalProviderId: "10812312",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no department id",
			args: args{
				request: &athenapb.UpdatePreferredPharmacyRequest{
					PatientId:          "23",
					ClinicalProviderId: "10812312",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no clinical provider id",
			args: args{
				request: &athenapb.UpdatePreferredPharmacyRequest{
					PatientId:    "23",
					DepartmentId: "2",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - athena server is unavailable",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure - data for requested patientID, departmentID and clinicalProviderId not found",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.UpdatePreferredPharmacy(ctx, tt.args.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerDeletePatientPreferredPharmacy(t *testing.T) {
	type args struct {
		request *athenapb.DeletePreferredPharmacyRequest
	}

	goodRequest := athenapb.DeletePreferredPharmacyRequest{
		PatientId:          "23",
		DepartmentId:       "2",
		ClinicalProviderId: "10812312",
	}

	tests := []struct {
		name              string
		args              args
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.DeletePreferredPharmacyResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus: http.StatusOK,
			want:             &athenapb.DeletePreferredPharmacyResponse{},
			wantGRPCCode:     codes.OK,
		},
		{
			name: "failure - no patient id",
			args: args{
				request: &athenapb.DeletePreferredPharmacyRequest{
					DepartmentId:       "2",
					ClinicalProviderId: "10812312",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no department id",
			args: args{
				request: &athenapb.DeletePreferredPharmacyRequest{
					PatientId:          "23",
					ClinicalProviderId: "10812312",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no clinical provider id",
			args: args{
				request: &athenapb.DeletePreferredPharmacyRequest{
					PatientId:    "23",
					DepartmentId: "2",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - athena server is unavailable",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure - data for requested patientID, departmentID and clinicalProviderId not found",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.DeletePreferredPharmacy(ctx, tt.args.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestCreatePatient(t *testing.T) {
	goodPatient := newTestPatient()
	patientNoDepartmentID := newTestPatient()
	patientNoDepartmentID.DepartmentId = nil
	patientNoGivenName := newTestPatient()
	patientNoGivenName.Name.GivenName = nil
	patientNoFamilyName := newTestPatient()
	patientNoFamilyName.Name.FamilyName = nil
	patientNoDoB := newTestPatient()
	patientNoDoB.DateOfBirth = nil
	type args struct {
		request *athenapb.CreatePatientRequest
	}
	tests := []struct {
		name             string
		args             args
		athenaHTTPStatus int
		athenaResponse   []byte

		wantResponse   *athenapb.CreatePatientResponse
		wantGRPCCode   codes.Code
		wantErrMessage string
	}{
		{
			name: "Base Case - Create patient",
			args: args{
				request: &athenapb.CreatePatientRequest{
					Patient: &goodPatient,
				},
			},
			athenaHTTPStatus: http.StatusCreated,
			athenaResponse:   []byte(`[{"patientid":"436184"}]`),

			wantResponse: &athenapb.CreatePatientResponse{PatientId: proto.String("436184")},
			wantGRPCCode: codes.OK,
		},
		{
			name: "error - no patient in request",
			args: args{
				request: &athenapb.CreatePatientRequest{
					Patient: nil,
				},
			},

			wantResponse:   nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "patient is empty",
		},
		{
			name: "error - no departmentID in request",
			args: args{
				request: &athenapb.CreatePatientRequest{
					Patient: &patientNoDepartmentID,
				},
			},

			wantResponse:   nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "department id is empty",
		},
		{
			name: "error - no patient given name in request",
			args: args{
				request: &athenapb.CreatePatientRequest{
					Patient: &patientNoGivenName,
				},
			},

			wantResponse:   nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "patient given_name is empty",
		},
		{
			name: "error - no patient family name in request",
			args: args{
				request: &athenapb.CreatePatientRequest{
					Patient: &patientNoFamilyName,
				},
			},

			wantResponse:   nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "patient family_name is empty",
		},
		{
			name: "error - no patient date_of_birth in request",
			args: args{
				request: &athenapb.CreatePatientRequest{
					Patient: &patientNoDoB,
				},
			},

			wantResponse:   nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "patient date_of_birth is empty",
		},
		{
			name: "error - athena responds with unexpected status code",
			args: args{
				request: &athenapb.CreatePatientRequest{
					Patient: &goodPatient,
				},
			},
			athenaHTTPStatus: http.StatusBadRequest,
			athenaResponse:   []byte(`{"error":"Additional fields are required."}`),

			wantResponse:   nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: `HTTP request had error response 400: {"error":"Additional fields are required."}`,
		},
		{
			name: "error - Athena responds with unexpected response",
			args: args{
				request: &athenapb.CreatePatientRequest{
					Patient: &goodPatient,
				},
			},
			athenaHTTPStatus: http.StatusCreated,
			athenaResponse:   []byte(`[]`),

			wantResponse:   nil,
			wantGRPCCode:   codes.Internal,
			wantErrMessage: "Unexpected AthenaAPI response for create patient. Expected 1 result, received 0",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaResponse)
				},
			))
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			resp, err := s.CreatePatient(ctx, tt.args.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tt.wantErrMessage, respStatus.Message())
			testutils.MustMatch(t, tt.wantResponse, resp)
		})
	}
}

func TestUpdateCareTeam(t *testing.T) {
	tests := []struct {
		desc              string
		updateCareTeamReq *athenapb.UpdateCareTeamRequest
		athenaHTTPStatus  int

		wantGRPCCode codes.Code
	}{
		{
			desc: "success - care team update",
			updateCareTeamReq: &athenapb.UpdateCareTeamRequest{
				PatientId:          "1",
				ClinicalProviderId: "2",
				DepartmentId:       "3",
				RecipientClassId:   "4",
			},
			athenaHTTPStatus: http.StatusOK,

			wantGRPCCode: codes.OK,
		},
		{
			desc:              "failure - patient id is empty",
			updateCareTeamReq: &athenapb.UpdateCareTeamRequest{},
			wantGRPCCode:      codes.InvalidArgument,
		},
		{
			desc: "failure - clinical provider id is empty",
			updateCareTeamReq: &athenapb.UpdateCareTeamRequest{
				PatientId: "1",
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - department id is empty",
			updateCareTeamReq: &athenapb.UpdateCareTeamRequest{
				PatientId:          "1",
				ClinicalProviderId: "2",
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - recipient class id is empty",
			updateCareTeamReq: &athenapb.UpdateCareTeamRequest{
				PatientId:          "1",
				ClinicalProviderId: "2",
				DepartmentId:       "3",
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - athena is not available",
			updateCareTeamReq: &athenapb.UpdateCareTeamRequest{
				PatientId:          "1",
				ClinicalProviderId: "2",
				DepartmentId:       "3",
				RecipientClassId:   "4",
			},
			athenaHTTPStatus: http.StatusServiceUnavailable,

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())

			_, err := s.UpdateCareTeam(ctx, tt.updateCareTeamReq)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
		})
	}
}

func TestUpdatePatient(t *testing.T) {
	goodUpdateRequest := athenapb.Patient{
		PatientId: proto.String("436184"),
		DateOfBirth: &commonpb.Date{
			Year:  1990,
			Month: 3,
			Day:   3,
		},
	}
	type args struct {
		request *athenapb.UpdatePatientRequest
	}
	tests := []struct {
		name             string
		args             args
		athenaHTTPStatus int
		athenaResponse   []byte

		wantResponse   *athenapb.UpdatePatientResponse
		wantGRPCCode   codes.Code
		wantErrMessage string
	}{
		{
			name: "Base Case - Update patient",
			args: args{
				request: &athenapb.UpdatePatientRequest{
					Patient: &goodUpdateRequest,
				},
			},
			athenaHTTPStatus: http.StatusCreated,
			athenaResponse:   []byte(`[{"patientid":"436184"}]`),

			wantResponse: &athenapb.UpdatePatientResponse{PatientId: proto.String("436184")},
			wantGRPCCode: codes.OK,
		},
		{
			name: "error - no patient in request",
			args: args{
				request: &athenapb.UpdatePatientRequest{
					Patient: nil,
				},
			},

			wantResponse:   nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "patient is empty",
		},
		{
			name: "error - no patientID in request",
			args: args{
				request: &athenapb.UpdatePatientRequest{
					Patient: &athenapb.Patient{
						ContactInfo: &athenapb.ContactInfo{
							Email: proto.String("correo@example.com"),
						},
					},
				},
			},

			wantResponse:   nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "patient_id is empty",
		},
		{
			name: "error - athena responds with unexpected status code",
			args: args{
				request: &athenapb.UpdatePatientRequest{
					Patient: &goodUpdateRequest,
				},
			},
			athenaHTTPStatus: http.StatusBadRequest,
			athenaResponse:   []byte(`{"error":"Additional fields are required."}`),

			wantResponse:   nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: `HTTP request had error response 400: {"error":"Additional fields are required."}`,
		},
		{
			name: "error - Athena responds with unexpected response",
			args: args{
				request: &athenapb.UpdatePatientRequest{
					Patient: &goodUpdateRequest,
				},
			},
			athenaHTTPStatus: http.StatusCreated,
			athenaResponse:   []byte(`[]`),

			wantResponse:   nil,
			wantGRPCCode:   codes.Internal,
			wantErrMessage: "Unexpected AthenaAPI response for create patient. Expected 1 result, received 0",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaResponse)
				},
			))
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			resp, err := s.UpdatePatient(ctx, tt.args.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tt.wantErrMessage, respStatus.Message())
			testutils.MustMatch(t, tt.wantResponse, resp)
		})
	}
}

func TestDeleteCareTeam(t *testing.T) {
	tests := []struct {
		desc              string
		deleteCareTeamReq *athenapb.DeleteCareTeamRequest
		athenaHTTPStatus  int

		wantGRPCCode codes.Code
	}{
		{
			desc: "success - care team delete",
			deleteCareTeamReq: &athenapb.DeleteCareTeamRequest{
				PatientId:    "1",
				MemberId:     "2",
				DepartmentId: "3",
			},
			athenaHTTPStatus: http.StatusOK,

			wantGRPCCode: codes.OK,
		},
		{
			desc: "failure - patient id is empty",
			deleteCareTeamReq: &athenapb.DeleteCareTeamRequest{
				MemberId:     "2",
				DepartmentId: "3",
			},
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - member id is empty",
			deleteCareTeamReq: &athenapb.DeleteCareTeamRequest{
				PatientId:    "1",
				DepartmentId: "3",
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - department id is empty",
			deleteCareTeamReq: &athenapb.DeleteCareTeamRequest{
				PatientId: "1",
				MemberId:  "2",
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - athena is not available",
			deleteCareTeamReq: &athenapb.DeleteCareTeamRequest{
				PatientId:    "1",
				MemberId:     "2",
				DepartmentId: "3",
			},
			athenaHTTPStatus: http.StatusServiceUnavailable,

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())

			_, err := s.DeleteCareTeam(ctx, tt.deleteCareTeamReq)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
		})
	}
}

func TestGRPCServer_CreatePatientInsurance(t *testing.T) {
	goodPatientInsuranceRequest := newTestPatientInsurance(proto.String("123"), proto.Int64(1234), nil)
	noPatientIDPatientInsuranceRequest := newTestPatientInsurance(nil, proto.Int64(1234), nil)
	noPackageIDPatientInsuranceRequest := newTestPatientInsurance(proto.String("123"), nil, nil)

	type args struct {
		request *athenapb.CreatePatientInsuranceRequest
	}
	tests := []struct {
		name             string
		args             args
		athenaHTTPStatus int
		athenaResponse   []converters.PatientInsurance

		want           *athenapb.CreatePatientInsuranceResponse
		wantGRPCCode   codes.Code
		wantErrMessage string
	}{
		{
			name: "Base Case",
			args: args{
				request: &athenapb.CreatePatientInsuranceRequest{
					InsuranceRecord: &goodPatientInsuranceRequest,
				},
			},
			athenaHTTPStatus: http.StatusCreated,
			athenaResponse: []converters.PatientInsurance{
				goodAthenaInsurance,
			},

			want: &athenapb.CreatePatientInsuranceResponse{
				InsuranceRecord: &athenapb.Insurance{
					MemberId:  proto.String("54321"),
					PackageId: proto.Int64(1234),
					GroupId:   proto.Int64(4321),
					PrimaryInsuranceHolder: &athenapb.PrimaryInsuranceHolder{
						Name: &commonpb.Name{
							GivenName:           proto.String("Lorem"),
							MiddleNameOrInitial: proto.String("Ipsum"),
							FamilyName:          proto.String("Dolor"),
						},
						DateOfBirth: &commonpb.Date{
							Year:  1970,
							Month: 1,
							Day:   30,
						},
						Sex:      &sexProto,
						Relation: &relationToPatientProto,
					},
				},
			},
			wantGRPCCode: 0,
		},
		{
			name: "returns error if athena responds with more than one item",
			args: args{
				request: &athenapb.CreatePatientInsuranceRequest{
					InsuranceRecord: &goodPatientInsuranceRequest,
				},
			},
			athenaHTTPStatus: http.StatusCreated,
			athenaResponse: []converters.PatientInsurance{
				goodAthenaInsurance,
				goodAthenaInsurance,
			},

			wantGRPCCode:   codes.Internal,
			wantErrMessage: "Unexpected athena response for create patient insurance. Expected 1 result, received 2",
		},
		{
			name: "returns error if athena responds with incompatible response",
			args: args{
				request: &athenapb.CreatePatientInsuranceRequest{
					InsuranceRecord: &goodPatientInsuranceRequest,
				},
			},
			athenaHTTPStatus: http.StatusCreated,
			athenaResponse: []converters.PatientInsurance{
				unexpectedFieldTypeInAthenaInsuranceResponse,
			},

			wantGRPCCode:   codes.Internal,
			wantErrMessage: `Failed to build CreatePatientInsurance response, err: strconv.ParseInt: parsing "not a numeric ID": invalid syntax`,
		},
		{
			name: "returns error if insurance details is empty",
			args: args{
				request: &athenapb.CreatePatientInsuranceRequest{InsuranceRecord: nil},
			},

			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "insurance data is empty",
		},
		{
			name: "returns error if patientId is empty",
			args: args{
				request: &athenapb.CreatePatientInsuranceRequest{InsuranceRecord: &noPatientIDPatientInsuranceRequest},
			},

			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "patientId is empty",
		},
		{
			name: "returns error if insurance package id is empty",
			args: args{
				request: &athenapb.CreatePatientInsuranceRequest{InsuranceRecord: &noPackageIDPatientInsuranceRequest},
			},

			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "insurance package id is empty",
		},
		{
			name: "returns error if athena request is not successful",
			args: args{
				request: &athenapb.CreatePatientInsuranceRequest{InsuranceRecord: &goodPatientInsuranceRequest},
			},
			athenaHTTPStatus: http.StatusBadRequest,
			athenaResponse:   nil,

			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "HTTP request had error response 400: null",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					resp, err := json.Marshal(tt.athenaResponse)
					if err != nil {
						t.Fatal(err)
					}
					rw.Write(resp)
				},
			))
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.CreatePatientInsurance(ctx, tt.args.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tt.wantErrMessage, respStatus.Message())
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerGetPatientInsurance(t *testing.T) {
	type args struct {
		request *athenapb.GetPatientInsuranceRequest
	}
	tests := []struct {
		name               string
		args               args
		athenaHTTPResponse converters.GetPatientInsuranceResponse
		athenaHTTPStatus   int

		want           *athenapb.GetPatientInsuranceResponse
		wantGRPCCode   codes.Code
		wantErrMessage string
	}{
		{
			name: "Base Case",
			args: args{
				request: &athenapb.GetPatientInsuranceRequest{
					PatientId: proto.String("1234"),
				},
			},
			athenaHTTPResponse: converters.GetPatientInsuranceResponse{
				Insurances: []converters.PatientInsurance{
					goodAthenaInsurance,
				},
			},
			athenaHTTPStatus: http.StatusOK,

			want: &athenapb.GetPatientInsuranceResponse{
				InsuranceRecord: []*athenapb.Insurance{
					{
						MemberId:  proto.String("54321"),
						PackageId: proto.Int64(1234),
						GroupId:   proto.Int64(4321),
						PrimaryInsuranceHolder: &athenapb.PrimaryInsuranceHolder{
							Name: &commonpb.Name{
								GivenName:           proto.String("Lorem"),
								MiddleNameOrInitial: proto.String("Ipsum"),
								FamilyName:          proto.String("Dolor"),
							},
							DateOfBirth: &commonpb.Date{
								Year:  1970,
								Month: 1,
								Day:   30,
							},
							Sex:      &sexProto,
							Relation: &relationToPatientProto,
						},
					},
				},
			},
			wantGRPCCode: 0,
		},
		{
			name: "Returns empty response if patient doesnt have insurances ",
			args: args{
				request: &athenapb.GetPatientInsuranceRequest{
					PatientId: proto.String("1234"),
				},
			},
			athenaHTTPResponse: converters.GetPatientInsuranceResponse{},
			athenaHTTPStatus:   http.StatusOK,

			want: &athenapb.GetPatientInsuranceResponse{
				InsuranceRecord: []*athenapb.Insurance{},
			},
			wantGRPCCode: 0,
		},
		{
			name: "Returns error if the patient is not in request",
			args: args{
				request: &athenapb.GetPatientInsuranceRequest{},
			},

			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "patientId is empty",
		},
		{
			name: "Returns error if the patient is not found",
			args: args{
				request: &athenapb.GetPatientInsuranceRequest{
					PatientId: proto.String("1234"),
				},
			},
			athenaHTTPStatus: http.StatusNotFound,

			wantGRPCCode:   codes.NotFound,
			wantErrMessage: "HTTP request had error response 404: {}",
		},
		{
			name: "returns error if athena responds with incompatible response",
			args: args{
				request: &athenapb.GetPatientInsuranceRequest{
					PatientId: proto.String("1234"),
				},
			},
			athenaHTTPStatus: http.StatusOK,
			athenaHTTPResponse: converters.GetPatientInsuranceResponse{Insurances: []converters.PatientInsurance{
				unexpectedFieldTypeInAthenaInsuranceResponse,
			}},

			wantGRPCCode:   codes.Internal,
			wantErrMessage: `Failed to build GetPatientInsurance response, err: strconv.ParseInt: parsing "not a numeric ID": invalid syntax`,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					resp, err := json.Marshal(tt.athenaHTTPResponse)
					if err != nil {
						t.Fatal(err)
					}
					rw.Write(resp)
				},
			))
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.GetPatientInsurance(ctx, tt.args.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tt.wantErrMessage, respStatus.Message())
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServer_UpdatePatientInsurance(t *testing.T) {
	goodPatientInsurance := newTestPatientInsurance(proto.String("1234"), proto.Int64(4321), proto.String("987654"))
	noPatientIDInPatientInsurance := newTestPatientInsurance(nil, proto.Int64(4321), proto.String("987654"))
	noInsuranceIDInPatientInsurance := newTestPatientInsurance(proto.String("1234"), proto.Int64(4321), nil)
	badPatientIDInPatientInsurance := newTestPatientInsurance(proto.String(string(byte(0x7f))), proto.Int64(4321), proto.String("987654"))
	type args struct {
		request *athenapb.UpdatePatientInsuranceRequest
	}
	tests := []struct {
		name             string
		args             args
		athenaHTTPStatus int

		want           *athenapb.UpdatePatientInsuranceResponse
		wantGRPCCode   codes.Code
		wantErrMessage string
	}{
		{
			name: "base case",
			args: args{
				request: &athenapb.UpdatePatientInsuranceRequest{
					InsuranceRecord: &goodPatientInsurance,
				},
			},
			athenaHTTPStatus: http.StatusOK,

			want:         &athenapb.UpdatePatientInsuranceResponse{},
			wantGRPCCode: 0,
		},
		{
			name: "returns error if insurance details are empty",
			args: args{
				request: &athenapb.UpdatePatientInsuranceRequest{},
			},

			want:           nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "insurance data is empty",
		},
		{
			name: "returns error if patient id is empty",
			args: args{
				request: &athenapb.UpdatePatientInsuranceRequest{
					InsuranceRecord: &noPatientIDInPatientInsurance,
				},
			},

			want:           nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "patientId is empty",
		},
		{
			name: "returns error if athena insurance id is empty",
			args: args{
				request: &athenapb.UpdatePatientInsuranceRequest{
					InsuranceRecord: &noInsuranceIDInPatientInsurance,
				},
			},

			want:           nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "insuranceId is empty",
		},
		{
			name: "returns error if cannot build update url",
			args: args{
				request: &athenapb.UpdatePatientInsuranceRequest{
					InsuranceRecord: &badPatientIDInPatientInsurance,
				},
			},

			want:           nil,
			wantGRPCCode:   codes.Internal,
			wantErrMessage: `failed to build update specific insurance URL: parse "/patients/\x7f/insurances": net/url: invalid control character in URL`,
		},
		{
			name: "returns error if athena update insurance call fails",
			args: args{
				request: &athenapb.UpdatePatientInsuranceRequest{
					InsuranceRecord: &goodPatientInsurance,
				},
			},
			athenaHTTPStatus: http.StatusNotFound,

			want:           nil,
			wantGRPCCode:   codes.Internal,
			wantErrMessage: "failed to update patient insurance: rpc error: code = NotFound desc = HTTP request had error response 404: ",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
				},
			))

			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.UpdatePatientInsurance(ctx, tt.args.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tt.wantErrMessage, respStatus.Message())
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServer_DeletePatientSpecificInsurance(t *testing.T) {
	type args struct {
		request *athenapb.DeletePatientSpecificInsuranceRequest
	}

	goodRequest := &athenapb.DeletePatientSpecificInsuranceRequest{
		PatientId:   "1234",
		InsuranceId: "5678",
	}

	tests := []struct {
		name              string
		args              args
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.DeletePatientSpecificInsuranceResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			args: args{
				request: goodRequest,
			},
			athenaHTTPStatus: http.StatusOK,
			want:             &athenapb.DeletePatientSpecificInsuranceResponse{},
			wantGRPCCode:     codes.OK,
		},
		{
			name: "failure - no patient id",
			args: args{
				request: &athenapb.DeletePatientSpecificInsuranceRequest{
					InsuranceId: "5678",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no insurance id",
			args: args{
				request: &athenapb.DeletePatientSpecificInsuranceRequest{
					PatientId: "1234",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - athena server is unavailable",
			args: args{
				request: goodRequest,
			},
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure - data for requested patientID and insuranceID not found",
			args: args{
				request: goodRequest,
			},
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.DeletePatientSpecificInsurance(ctx, tt.args.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestSearchClinicalProviders(t *testing.T) {
	tests := []struct {
		desc                      string
		searchClinicalProviderReq *athenapb.SearchClinicalProvidersRequest
		athenaHTTPStatus          int
		athenaResponse            *converters.ClinicalProviderSearchResult

		wantGRPCCode codes.Code
		wantResponse *athenapb.SearchClinicalProvidersResponse
	}{
		{
			desc: "success - returns search list of clinical providers",
			searchClinicalProviderReq: &athenapb.SearchClinicalProvidersRequest{
				Name: "Sarah Jones",
				Zip:  "68124",
			},
			athenaHTTPStatus: http.StatusOK,
			athenaResponse: &converters.ClinicalProviderSearchResult{
				ClinicalProviders: []*converters.ClinicalProvider{
					{
						ID:          proto.String("1"),
						Name:        proto.String("Sarah Jones MD"),
						FirstName:   proto.String("Sarah"),
						LastName:    proto.String("Jones"),
						City:        proto.String("CO"),
						State:       proto.String("Denver"),
						Address:     proto.String("9239 W CENTER RD"),
						PhoneNumber: proto.String("4023999305"),
						FaxNumber:   proto.String("4023973191"),
						Zip:         proto.String("68124"),
						NCPDID:      proto.String("2"),
						Distance:    proto.String("74.4"),
					},
				},
			},

			wantGRPCCode: codes.OK,
			wantResponse: &athenapb.SearchClinicalProvidersResponse{
				ClinicalProviders: []*athenapb.ClinicalProviderSearchResult{
					{
						ClinicalProviderId: proto.String("1"),
						ProviderName: &commonpb.Name{
							GivenName:  proto.String("Sarah"),
							FamilyName: proto.String("Jones"),
						},
						Address: &commonpb.Address{
							AddressLineOne: proto.String("9239 W CENTER RD"),
							City:           proto.String("CO"),
							State:          proto.String("Denver"),
							ZipCode:        proto.String("68124"),
						},
						Distance: proto.Float64(74.4),
						PhoneNumber: &commonpb.PhoneNumber{
							CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
							PhoneNumber:     proto.String("(402) 399-9305"),
							PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
						},
						FaxNumber: &commonpb.PhoneNumber{
							CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
							PhoneNumber:     proto.String("(402) 397-3191"),
							PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
						},
						NcpdpId:          proto.String("2"),
						OrganizationName: proto.String("Sarah Jones MD"),
					},
				},
			},
		},
		{
			desc: "failure - search clinical providers request is empty",

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - athena response about missing city and state fields",
			searchClinicalProviderReq: &athenapb.SearchClinicalProvidersRequest{
				Name: "Sarah Jones",
			},
			athenaHTTPStatus: http.StatusBadRequest,

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - athena is not available",
			searchClinicalProviderReq: &athenapb.SearchClinicalProvidersRequest{
				Name: "Sarah Jones",
				Zip:  "68124",
			},
			athenaHTTPStatus: http.StatusServiceUnavailable,

			wantGRPCCode: codes.Internal,
		},
		{
			desc: "failure - cannot convert clinical provider proto to clinical provider due invalid fax number",
			searchClinicalProviderReq: &athenapb.SearchClinicalProvidersRequest{
				Name: "Sarah Jones",
				Zip:  "68124",
				FaxNumber: &commonpb.PhoneNumber{
					PhoneNumber: proto.String("1"),
				},
			},
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - cannot convert clinical provider to clinical provider proto due invalid distance",
			searchClinicalProviderReq: &athenapb.SearchClinicalProvidersRequest{
				Name: "Sarah Jones",
				Zip:  "68124",
			},
			athenaHTTPStatus: http.StatusOK,
			athenaResponse: &converters.ClinicalProviderSearchResult{
				ClinicalProviders: []*converters.ClinicalProvider{
					{
						ID:          proto.String("1"),
						Name:        proto.String("Sarah Jones MD"),
						FirstName:   proto.String("Sarah"),
						LastName:    proto.String("Jones"),
						City:        proto.String("CO"),
						State:       proto.String("Denver"),
						Address:     proto.String("9239 W CENTER RD"),
						PhoneNumber: proto.String("4023999305"),
						FaxNumber:   proto.String("4023973191"),
						Zip:         proto.String("68124"),
						NCPDID:      proto.String("2"),
						Distance:    proto.String("abcd"),
					},
				},
			},

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					resp, err := json.Marshal(tt.athenaResponse)
					if err != nil {
						t.Fatal(err)
					}
					rw.Write(resp)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())

			resp, err := s.SearchClinicalProviders(ctx, tt.searchClinicalProviderReq)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.wantResponse, resp, "response does not match")
		})
	}
}

func TestGRPCServerGetPatientDefaultPharmacy(t *testing.T) {
	type args struct {
		request *athenapb.GetDefaultPharmacyRequest
	}

	goodRequest := athenapb.GetDefaultPharmacyRequest{
		PatientId:    "23",
		DepartmentId: "2",
	}

	tests := []struct {
		name              string
		args              args
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.GetDefaultPharmacyResponse
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`{"pharmacytype": "RETAIL","defaultpharmacy": "true","state": "CO","city": "Littleton","receivertype": "ERX","acceptfax": "true","clinicalproviderid": "10812345","zip": "801232101","phonenumber": "3031231234","clinicalprovidername": "King Soopers Pharmacy 62000050","address1": "1234 W Belleview","faxnumber": "3031231234"}`),

			want: &athenapb.GetDefaultPharmacyResponse{
				Pharmacy: &athenapb.Pharmacy{
					PharmacyType:    proto.String("RETAIL"),
					DefaultPharmacy: proto.String("true"),
					Address: &commonpb.Address{
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
					PhoneNumber: &commonpb.PhoneNumber{
						PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK,
						CountryCode:     proto.Int32(1),
						PhoneNumber:     proto.String("(303) 123-1234"),
					},
					FaxNumber: proto.String("3031231234"),
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name: "failure - no patient id",
			args: args{
				request: &athenapb.GetDefaultPharmacyRequest{
					DepartmentId: "2",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no department id",
			args: args{
				request: &athenapb.GetDefaultPharmacyRequest{
					PatientId: "23",
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - athena server is unavailable",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure - unable to convert athena response",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`wrong response json`),

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure - data for requested patientID and departmentID pair not found",
			args: args{
				request: &goodRequest,
			},
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.GetDefaultPharmacy(ctx, tt.args.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerUpdatePatientDiscussionNotes(t *testing.T) {
	encounterID := "23"
	discussionNote := "test"
	goodRequest := athenapb.UpdatePatientDiscussionNotesRequest{
		EncounterId:            encounterID,
		DiscussionNotes:        "test",
		ReplaceDiscussionNotes: false,
	}

	tests := []struct {
		name              string
		request           *athenapb.UpdatePatientDiscussionNotesRequest
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.UpdatePatientDiscussionNotesResponse
		wantGRPCCode codes.Code
	}{
		{
			name:    "success - base case",
			request: &goodRequest,

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`{"discussionnotes": "test"}`),
			want: &athenapb.UpdatePatientDiscussionNotesResponse{
				DiscussionNotes: discussionNote,
			},
			wantGRPCCode: codes.OK,
		},
		{
			name: "failure - no encounter id",
			request: &athenapb.UpdatePatientDiscussionNotesRequest{
				DiscussionNotes:        discussionNote,
				ReplaceDiscussionNotes: false,
			},

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no discussion notes",
			request: &athenapb.UpdatePatientDiscussionNotesRequest{
				EncounterId:            encounterID,
				ReplaceDiscussionNotes: false,
			},

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no replace discussion notes bool",
			request: &athenapb.UpdatePatientDiscussionNotesRequest{
				EncounterId:     encounterID,
				DiscussionNotes: discussionNote,
			},

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:    "failure - athena server is unavailable",
			request: &goodRequest,

			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:    "failure - data not found",
			request: &goodRequest,

			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.UpdatePatientDiscussionNotes(ctx, tt.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerGetPatientLabResults(t *testing.T) {
	goodRequest := athenapb.ListPatientLabResultsRequest{
		PatientId:    "23",
		DepartmentId: "2",
		EncounterId:  "32",
	}
	tests := []struct {
		name              string
		request           *athenapb.ListPatientLabResultsRequest
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.ListPatientLabResultsResponse
		wantGRPCCode codes.Code
	}{
		{
			name:              "success - base case",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`{"results":[{"priority": "2","labresultdate": "08/30/2018","resultstatus": "final","isreviewedbyprovider": "1","labresultid": "356609","performinglabname": "Quest Diagnostics - Oklahoma City","labresultdatetime": "08/30/2018 11:33:00","facilityid": "10977989","description": "TSH, serum or plasma","attachmentexists": "false","labresultloinc": "3016-3"}]}`),

			want: &athenapb.ListPatientLabResultsResponse{
				Results: []*athenapb.LabResult{
					{
						Priority: proto.String("2"),
						Date: &commonpb.Date{
							Year:  2018,
							Month: 8,
							Day:   30,
						},
						ResultStatus:         proto.String("final"),
						IsReviewedByProvider: proto.Bool(true),
						PerformingLabAddress: &commonpb.Address{},
						Id:                   proto.String("356609"),
						PerformingLabName:    proto.String("Quest Diagnostics - Oklahoma City"),
						DateTime: &commonpb.DateTime{
							Year:    2018,
							Month:   8,
							Day:     30,
							Hours:   11,
							Minutes: 33,
							Seconds: 0,
						},
						Analytes:         []*athenapb.Analyte{},
						FacilityId:       proto.String("10977989"),
						Description:      proto.String("TSH, serum or plasma"),
						AttachmentExists: proto.Bool(false),
						Loinc:            proto.String("3016-3"),
					},
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name: "failure - no patient id",
			request: &athenapb.ListPatientLabResultsRequest{
				DepartmentId: "2",
				EncounterId:  "32",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no department id",
			request: &athenapb.ListPatientLabResultsRequest{
				PatientId:   "23",
				EncounterId: "32",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no encounter id",
			request: &athenapb.ListPatientLabResultsRequest{
				PatientId:    "23",
				DepartmentId: "2",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:              "failure - athena server is unavailable",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - unable to convert athena response",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`wrong response json`),

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - data for requested patientID and departmentID pair not found",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.ListPatientLabResults(ctx, tt.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerListRecipientClasses(t *testing.T) {
	goodRequest := athenapb.ListRecipientClassesRequest{
		Limit:  proto.Int32(99),
		Offset: proto.Int32(100),
	}
	goodAthenaRawResponse := []byte(`{"recipientclasses":[{"description":"PrimaryCareProvider","code":"3"},{"description":"ReferringProvider","code":"4"},{"description":"Cardiologist","code":"82"}]}`)
	goodProtoResponse := athenapb.ListRecipientClassesResponse{
		RecipientClasses: []*athenapb.RecipientClass{
			{
				Description: proto.String("PrimaryCareProvider"),
				Code:        proto.String("3"),
			},
			{
				Description: proto.String("ReferringProvider"),
				Code:        proto.String("4"),
			},
			{
				Description: proto.String("Cardiologist"),
				Code:        proto.String("82"),
			},
		},
	}

	tests := []struct {
		name              string
		request           *athenapb.ListRecipientClassesRequest
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.ListRecipientClassesResponse
		wantGRPCCode codes.Code
	}{
		{
			name:              "success - base case",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want:         &goodProtoResponse,
			wantGRPCCode: codes.OK,
		},
		{
			name: "success - no limit",
			request: &athenapb.ListRecipientClassesRequest{
				Offset: proto.Int32(100),
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`{"recipientclasses":[{"description":"PrimaryCareProvider","code":"3"},{"description":"ReferringProvider","code":"4"},{"description":"Cardiologist","code":"82"}]}`),

			want: &athenapb.ListRecipientClassesResponse{
				RecipientClasses: []*athenapb.RecipientClass{
					{
						Description: proto.String("PrimaryCareProvider"),
						Code:        proto.String("3"),
					},
					{
						Description: proto.String("ReferringProvider"),
						Code:        proto.String("4"),
					},
					{
						Description: proto.String("Cardiologist"),
						Code:        proto.String("82"),
					},
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name: "success - no offset",
			request: &athenapb.ListRecipientClassesRequest{
				Limit: proto.Int32(99),
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`{"recipientclasses":[{"description":"PrimaryCareProvider","code":"3"},{"description":"ReferringProvider","code":"4"},{"description":"Cardiologist","code":"82"}]}`),

			want: &athenapb.ListRecipientClassesResponse{
				RecipientClasses: []*athenapb.RecipientClass{
					{
						Description: proto.String("PrimaryCareProvider"),
						Code:        proto.String("3"),
					},
					{
						Description: proto.String("ReferringProvider"),
						Code:        proto.String("4"),
					},
					{
						Description: proto.String("Cardiologist"),
						Code:        proto.String("82"),
					},
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name:              "failure - athena server is unavailable",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - unable to convert athena response",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`wrong response json`),

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.ListRecipientClasses(ctx, tt.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerListChangedLabResults(t *testing.T) {
	tests := []struct {
		name             string
		request          *athenapb.ListChangedLabResultsRequest
		athenaResponse   *converters.ChangedLabResults
		athenaHTTPStatus int

		want             *athenapb.ListChangedLabResultsResponse
		wantAthenaParams url.Values
		wantGRPCCode     codes.Code
	}{
		{
			name:             "success - base case",
			request:          &athenapb.ListChangedLabResultsRequest{},
			athenaHTTPStatus: http.StatusOK,
			athenaResponse: &converters.ChangedLabResults{
				LabResults: []converters.ChangedLabResult{
					{
						LabResultID:  proto.String("examplelabresultid"),
						DepartmentID: proto.String("exampledepartmentid"),
						EncounterID:  proto.String("exampleencounterid"),
						PatientID:    proto.String("examplepatientid"),
					},
					{
						LabResultID:  proto.String("examplelabresultid2"),
						DepartmentID: proto.String("exampledepartmentid"),
						EncounterID:  proto.String("exampleencounterid"),
						PatientID:    proto.String("examplepatientid"),
					},
				},
			},

			want: &athenapb.ListChangedLabResultsResponse{
				Results: []*athenapb.ListChangedLabResultsResult{
					{
						LabResultId:  proto.String("examplelabresultid"),
						DepartmentId: proto.String("exampledepartmentid"),
						EncounterId:  proto.String("exampleencounterid"),
						PatientId:    proto.String("examplepatientid"),
					},
					{
						LabResultId:  proto.String("examplelabresultid2"),
						DepartmentId: proto.String("exampledepartmentid"),
						EncounterId:  proto.String("exampleencounterid"),
						PatientId:    proto.String("examplepatientid"),
					},
				},
			},
			wantAthenaParams: url.Values{},
			wantGRPCCode:     codes.OK,
		},
		{
			name: "success - params propagated",
			request: &athenapb.ListChangedLabResultsRequest{
				ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
				ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
				Limit:                      proto.Int32(12),
				Offset:                     proto.Int32(23),
				LeaveUnprocessed:           proto.Bool(true),
			},
			athenaHTTPStatus: http.StatusOK,
			athenaResponse: &converters.ChangedLabResults{
				LabResults: []converters.ChangedLabResult{
					{
						LabResultID:  proto.String("examplelabresultid"),
						DepartmentID: proto.String("exampledepartmentid"),
						EncounterID:  proto.String("exampleencounterid"),
						PatientID:    proto.String("examplepatientid"),
					},
				},
			},

			want: &athenapb.ListChangedLabResultsResponse{
				Results: []*athenapb.ListChangedLabResultsResult{
					{
						LabResultId:  proto.String("examplelabresultid"),
						DepartmentId: proto.String("exampledepartmentid"),
						EncounterId:  proto.String("exampleencounterid"),
						PatientId:    proto.String("examplepatientid"),
					},
				},
			},
			wantAthenaParams: url.Values{
				"showprocessedstartdatetime": []string{"01/02/2023 01:02:03"},
				"showprocessedenddatetime":   []string{"01/02/2023 02:03:04"},
				"limit":                      []string{"12"},
				"offset":                     []string{"23"},
				"leaveunprocessed":           []string{"true"},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name:             "success - no encounter id",
			request:          &athenapb.ListChangedLabResultsRequest{},
			athenaHTTPStatus: http.StatusOK,
			athenaResponse: &converters.ChangedLabResults{
				LabResults: []converters.ChangedLabResult{
					{
						LabResultID:  proto.String("examplelabresultid"),
						DepartmentID: proto.String("exampledepartmentid"),
						PatientID:    proto.String("examplepatientid"),
					},
				},
			},

			want: &athenapb.ListChangedLabResultsResponse{
				Results: []*athenapb.ListChangedLabResultsResult{
					{
						LabResultId:  proto.String("examplelabresultid"),
						DepartmentId: proto.String("exampledepartmentid"),
						PatientId:    proto.String("examplepatientid"),
					},
				},
			},
			wantAthenaParams: url.Values{},
			wantGRPCCode:     codes.OK,
		},
		{
			name:             "success - empty result",
			request:          &athenapb.ListChangedLabResultsRequest{},
			athenaHTTPStatus: http.StatusOK,
			athenaResponse: &converters.ChangedLabResults{
				LabResults: []converters.ChangedLabResult{{}},
			},

			want: &athenapb.ListChangedLabResultsResponse{
				Results: []*athenapb.ListChangedLabResultsResult{{}},
			},
			wantAthenaParams: url.Values{},
			wantGRPCCode:     codes.OK,
		},
		{
			name: "error - athena error",
			request: &athenapb.ListChangedLabResultsRequest{
				ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
				ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
				Limit:                      proto.Int32(12),
				Offset:                     proto.Int32(23),
				LeaveUnprocessed:           proto.Bool(true),
			},
			athenaHTTPStatus: http.StatusBadGateway,
			wantAthenaParams: url.Values{
				"showprocessedstartdatetime": []string{"01/02/2023 01:02:03"},
				"showprocessedenddatetime":   []string{"01/02/2023 02:03:04"},
				"limit":                      []string{"12"},
				"offset":                     []string{"23"},
				"leaveunprocessed":           []string{"true"},
			},

			wantGRPCCode: codes.Internal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					resp, err := json.Marshal(tt.athenaResponse)
					if err != nil {
						t.Fatal(err)
					}
					rw.Write(resp)
					testutils.MustMatch(t, tt.wantAthenaParams, req.URL.Query())
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.ListChangedLabResults(ctx, tt.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerListChangedPatients(t *testing.T) {
	tests := []struct {
		name             string
		request          *athenapb.ListChangedPatientsRequest
		athenaResponse   *converters.ChangedPatients
		athenaHTTPStatus int

		want             *athenapb.ListChangedPatientsResponse
		wantAthenaParams url.Values
		wantGRPCCode     codes.Code
	}{
		{
			name:             "success - base case",
			request:          &athenapb.ListChangedPatientsRequest{},
			athenaHTTPStatus: http.StatusOK,
			athenaResponse: &converters.ChangedPatients{
				Patients: []converters.ChangedPatient{
					{
						DepartmentID:       proto.String("exampledepartmentid"),
						PatientID:          proto.String("examplepatientid"),
						PreviousPatientIDs: nil,
					},
					{
						DepartmentID:       proto.String("exampledepartmentid"),
						PatientID:          proto.String("examplepatientid2"),
						PreviousPatientIDs: nil,
					},
				},
			},

			want: &athenapb.ListChangedPatientsResponse{
				Results: []*athenapb.ListChangedPatientsResult{
					{
						DepartmentId:       proto.String("exampledepartmentid"),
						PatientId:          proto.String("examplepatientid"),
						PreviousPatientIds: nil,
					},
					{
						DepartmentId:       proto.String("exampledepartmentid"),
						PatientId:          proto.String("examplepatientid2"),
						PreviousPatientIds: nil,
					},
				},
			},
			wantAthenaParams: url.Values{"showpreviouspatientids": []string{"true"}},
			wantGRPCCode:     codes.OK,
		},
		{
			name: "success - params propagated",
			request: &athenapb.ListChangedPatientsRequest{
				ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
				ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
				Limit:                      proto.Int32(12),
				Offset:                     proto.Int32(23),
				LeaveUnprocessed:           proto.Bool(true),
			},
			athenaHTTPStatus: http.StatusOK,
			athenaResponse: &converters.ChangedPatients{
				Patients: []converters.ChangedPatient{
					{
						DepartmentID:       proto.String("exampledepartmentid"),
						PatientID:          proto.String("examplepatientid"),
						PreviousPatientIDs: nil,
					},
				},
			},

			want: &athenapb.ListChangedPatientsResponse{
				Results: []*athenapb.ListChangedPatientsResult{
					{
						DepartmentId:       proto.String("exampledepartmentid"),
						PatientId:          proto.String("examplepatientid"),
						PreviousPatientIds: nil,
					},
				},
			},
			wantAthenaParams: url.Values{
				"showpreviouspatientids":     []string{"true"},
				"showprocessedstartdatetime": []string{"01/02/2023 01:02:03"},
				"showprocessedenddatetime":   []string{"01/02/2023 02:03:04"},
				"limit":                      []string{"12"},
				"offset":                     []string{"23"},
				"leaveunprocessed":           []string{"true"},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name:             "success - with previous patient ids",
			request:          &athenapb.ListChangedPatientsRequest{},
			athenaHTTPStatus: http.StatusOK,
			athenaResponse: &converters.ChangedPatients{
				Patients: []converters.ChangedPatient{
					{
						DepartmentID:       proto.String("exampledepartmentid"),
						PatientID:          proto.String("examplepatientid"),
						PreviousPatientIDs: []string{"prev1", "prev2"},
					},
				},
			},

			want: &athenapb.ListChangedPatientsResponse{
				Results: []*athenapb.ListChangedPatientsResult{
					{
						DepartmentId:       proto.String("exampledepartmentid"),
						PatientId:          proto.String("examplepatientid"),
						PreviousPatientIds: []string{"prev1", "prev2"},
					},
				},
			},
			wantAthenaParams: url.Values{"showpreviouspatientids": []string{"true"}},
			wantGRPCCode:     codes.OK,
		},
		{
			name:             "success - empty result",
			request:          &athenapb.ListChangedPatientsRequest{},
			athenaHTTPStatus: http.StatusOK,
			athenaResponse: &converters.ChangedPatients{
				Patients: []converters.ChangedPatient{{}},
			},

			want: &athenapb.ListChangedPatientsResponse{
				Results: []*athenapb.ListChangedPatientsResult{{}},
			},
			wantAthenaParams: url.Values{"showpreviouspatientids": []string{"true"}},
			wantGRPCCode:     codes.OK,
		},
		{
			name: "error - athena error",
			request: &athenapb.ListChangedPatientsRequest{
				ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
				ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
				Limit:                      proto.Int32(12),
				Offset:                     proto.Int32(23),
				LeaveUnprocessed:           proto.Bool(true),
			},
			athenaHTTPStatus: http.StatusBadGateway,

			wantAthenaParams: url.Values{
				"showpreviouspatientids":     []string{"true"},
				"showprocessedstartdatetime": []string{"01/02/2023 01:02:03"},
				"showprocessedenddatetime":   []string{"01/02/2023 02:03:04"},
				"limit":                      []string{"12"},
				"offset":                     []string{"23"},
				"leaveunprocessed":           []string{"true"},
			},
			wantGRPCCode: codes.Internal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					resp, err := json.Marshal(tt.athenaResponse)
					if err != nil {
						t.Fatal(err)
					}
					rw.Write(resp)
					testutils.MustMatch(t, tt.wantAthenaParams, req.URL.Query())
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.ListChangedPatients(ctx, tt.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerCheckLabResultsSubscriptionStatus(t *testing.T) {
	tests := []struct {
		name             string
		athenaHTTPStatus int
		athenaResponse   *converters.LabResultChangeEventsSubscription

		want         *athenapb.CheckLabResultsSubscriptionStatusResponse
		wantGRPCCode codes.Code
	}{
		{
			name:             "success - base case",
			athenaHTTPStatus: http.StatusOK,
			athenaResponse:   &converters.LabResultChangeEventsSubscription{Status: proto.String("ACTIVE")},

			want:         &athenapb.CheckLabResultsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_ACTIVE},
			wantGRPCCode: codes.OK,
		},
		{
			name:             "success - inactive",
			athenaHTTPStatus: http.StatusOK,
			athenaResponse:   &converters.LabResultChangeEventsSubscription{Status: proto.String("INACTIVE")},

			want:         &athenapb.CheckLabResultsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_INACTIVE},
			wantGRPCCode: codes.OK,
		},
		{
			name:             "success - partial",
			athenaHTTPStatus: http.StatusOK,
			athenaResponse:   &converters.LabResultChangeEventsSubscription{Status: proto.String("PARTIAL")},

			want:         &athenapb.CheckLabResultsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_PARTIAL},
			wantGRPCCode: codes.OK,
		},
		{
			name:             "success - unspecified",
			athenaHTTPStatus: http.StatusOK,
			athenaResponse:   &converters.LabResultChangeEventsSubscription{Status: proto.String("LOL WHO CARES")},

			want:         &athenapb.CheckLabResultsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_UNSPECIFIED},
			wantGRPCCode: codes.OK,
		},
		{
			name:             "failure - not ok",
			athenaHTTPStatus: http.StatusBadGateway,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:             "failure - not found",
			athenaHTTPStatus: http.StatusNotFound,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					if tt.athenaResponse != nil {
						resp, err := json.Marshal(tt.athenaResponse)
						if err != nil {
							t.Fatal(err)
						}
						rw.Write(resp)
					}
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.CheckLabResultsSubscriptionStatus(ctx, &athenapb.CheckLabResultsSubscriptionStatusRequest{})

			testutils.MustMatch(t, tt.wantGRPCCode, status.Convert(err).Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerSubscribeLabResultEvents(t *testing.T) {
	tests := []struct {
		name             string
		athenaHTTPStatus int

		want         *athenapb.SubscribeLabResultEventsResponse
		wantGRPCCode codes.Code
	}{
		{
			name:             "success - base case",
			athenaHTTPStatus: http.StatusOK,

			want:         &athenapb.SubscribeLabResultEventsResponse{},
			wantGRPCCode: codes.OK,
		},
		{
			name:             "failure - not found",
			athenaHTTPStatus: http.StatusNotFound,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
		{
			name:             "failure - other error",
			athenaHTTPStatus: http.StatusExpectationFailed,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.SubscribeLabResultEvents(ctx, &athenapb.SubscribeLabResultEventsRequest{})

			testutils.MustMatch(t, tt.wantGRPCCode, status.Convert(err).Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerCheckPatientsSubscriptionStatus(t *testing.T) {
	tests := []struct {
		name             string
		athenaHTTPStatus int
		athenaResponse   *converters.PatientChangeEventsSubscription

		want         *athenapb.CheckPatientsSubscriptionStatusResponse
		wantGRPCCode codes.Code
	}{
		{
			name:             "success - base case",
			athenaHTTPStatus: http.StatusOK,
			athenaResponse:   &converters.PatientChangeEventsSubscription{Status: proto.String("ACTIVE")},

			want:         &athenapb.CheckPatientsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_ACTIVE},
			wantGRPCCode: codes.OK,
		},
		{
			name:             "success - inactive",
			athenaHTTPStatus: http.StatusOK,
			athenaResponse:   &converters.PatientChangeEventsSubscription{Status: proto.String("INACTIVE")},

			want:         &athenapb.CheckPatientsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_INACTIVE},
			wantGRPCCode: codes.OK,
		},
		{
			name:             "success - partial",
			athenaHTTPStatus: http.StatusOK,
			athenaResponse:   &converters.PatientChangeEventsSubscription{Status: proto.String("PARTIAL")},

			want:         &athenapb.CheckPatientsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_PARTIAL},
			wantGRPCCode: codes.OK,
		},
		{
			name:             "success - unspecified",
			athenaHTTPStatus: http.StatusOK,
			athenaResponse:   &converters.PatientChangeEventsSubscription{Status: proto.String("LOL WHO CARES")},

			want:         &athenapb.CheckPatientsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_UNSPECIFIED},
			wantGRPCCode: codes.OK,
		},
		{
			name:             "failure - not ok",
			athenaHTTPStatus: http.StatusBadGateway,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:             "failure - not found",
			athenaHTTPStatus: http.StatusNotFound,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					if tt.athenaResponse != nil {
						resp, err := json.Marshal(tt.athenaResponse)
						if err != nil {
							t.Fatal(err)
						}
						rw.Write(resp)
					}
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.CheckPatientsSubscriptionStatus(ctx, &athenapb.CheckPatientsSubscriptionStatusRequest{})

			testutils.MustMatch(t, tt.wantGRPCCode, status.Convert(err).Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerSubscribePatientEvents(t *testing.T) {
	tests := []struct {
		name             string
		athenaHTTPStatus int

		want         *athenapb.SubscribePatientEventsResponse
		wantGRPCCode codes.Code
	}{
		{
			name:             "success - base case",
			athenaHTTPStatus: http.StatusOK,

			want:         &athenapb.SubscribePatientEventsResponse{},
			wantGRPCCode: codes.OK,
		},
		{
			name:             "failure - not found",
			athenaHTTPStatus: http.StatusNotFound,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
		{
			name:             "failure - other error",
			athenaHTTPStatus: http.StatusExpectationFailed,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.SubscribePatientEvents(ctx, &athenapb.SubscribePatientEventsRequest{})

			testutils.MustMatch(t, tt.wantGRPCCode, status.Convert(err).Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerSearchPatients(t *testing.T) {
	type args struct {
		request *athenapb.SearchPatientsRequest
	}
	tests := []struct {
		name               string
		args               args
		athenaHTTPResponse converters.SearchPatientResponse
		athenaHTTPStatus   int

		want           *athenapb.SearchPatientsResponse
		wantGRPCCode   codes.Code
		wantErrMessage string
	}{
		{
			name: "Base Case",
			args: args{
				request: &athenapb.SearchPatientsRequest{
					SearchTerm: "smith",
				},
			},
			athenaHTTPResponse: converters.SearchPatientResponse{
				SearchPatientResults: []converters.SearchPatientResult{
					{
						FirstName:           proto.String("ABDUL"),
						CurrentDepartmentID: proto.String("2"),
						MiddleInitial:       proto.String("EFFERTZ"),
						LastName:            proto.String("SMITH"),
						State:               proto.String("CO"),
						City:                proto.String("DENVER"),
						CountryID:           proto.String("1"),
						HomePhone:           proto.String("(303) 500-1518"),
						PatientID:           proto.String("401429"),
						Sex:                 proto.String("M"),
						DOB:                 proto.String("09/25/1937"),
						Zip:                 proto.String("80210-4531"),
						CurrentDepartment:   proto.String("DEN - HOME"),
						Address1:            proto.String("1235 E EVANS AVE"),
						Address2:            proto.String("#144"),
						NameSuffix:          proto.String(""),
					},
				},
			},
			athenaHTTPStatus: http.StatusOK,

			want: &athenapb.SearchPatientsResponse{
				Results: []*athenapb.SearchPatientsResult{
					{
						Patient: &athenapb.Patient{
							PatientId: proto.String("401429"),
							Name: &commonpb.Name{
								GivenName:           proto.String("ABDUL"),
								FamilyName:          proto.String("SMITH"),
								MiddleNameOrInitial: proto.String("EFFERTZ"),
								Suffix:              proto.String(""),
							},
							DateOfBirth: &commonpb.Date{Year: 1937, Month: 9, Day: 25},
							Sex:         proto.String("M"),
							ContactInfo: &athenapb.ContactInfo{
								Address: &commonpb.Address{
									AddressLineOne: proto.String("1235 E EVANS AVE"),
									AddressLineTwo: proto.String("#144"),
									City:           proto.String("DENVER"),
									State:          proto.String("CO"),
									ZipCode:        proto.String("80210-4531"),
								},
								HomeNumber: &commonpb.PhoneNumber{
									CountryCode:     proto.Int32(1),
									PhoneNumber:     proto.String("(303) 500-1518"),
									PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
								},
							},
							DepartmentId: proto.String("2"),
						},
					},
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name: "Returns empty response if no patients found",
			args: args{
				request: &athenapb.SearchPatientsRequest{
					SearchTerm: "lastName, person",
				},
			},
			athenaHTTPResponse: converters.SearchPatientResponse{},
			athenaHTTPStatus:   http.StatusOK,

			want: &athenapb.SearchPatientsResponse{
				Results: []*athenapb.SearchPatientsResult{},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name: "Returns error if the search term is not in request",
			args: args{
				nil,
			},

			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "search patients request is empty",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					resp, err := json.Marshal(tt.athenaHTTPResponse)
					if err != nil {
						t.Fatal(err)
					}
					rw.Write(resp)
				},
			))
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.SearchPatients(ctx, tt.args.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tt.wantErrMessage, respStatus.Message())
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerGetPatientLabResultDocument(t *testing.T) {
	goodRequest := athenapb.GetPatientLabResultDocumentRequest{
		PatientId:   "23",
		LabResultId: "2",
	}
	athenaJSON := []map[string]any{{"departmentid": "2", "documentroute": "Fax", "documentsource": "INTERFACE", "documenttypeid": "3", "encounterdate": "08/30/2018", "encounterid": "4", "facilityid": "5", "isconfidential": "false", "labresultid": "6", "labresultloinc": "7", "observationdatetime": "2018-08-30T11:33:55-05:00", "observations": []map[string]any{{"observationidentifier": "55080400", "resultstatus": "final", "analytename": "TSH", "description": "Description", "value": "tnp", "analyteid": "1234", "units": "g/dL", "loinc": "31234", "note": "note"}}, "providerid": "8", "tietoorderid": "9"}}
	athenaResp, err := json.Marshal(athenaJSON)
	if err != nil {
		t.Fatal("failed to Marshal Athena Resp")
	}
	tests := []struct {
		name              string
		request           *athenapb.GetPatientLabResultDocumentRequest
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.GetPatientLabResultDocumentResponse
		wantGRPCCode codes.Code
	}{
		{
			name:              "success - base case",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: athenaResp,

			want: &athenapb.GetPatientLabResultDocumentResponse{
				Results: []*athenapb.LabResultDocument{
					{
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
								Units:                 proto.String("g/dL"),
								Description:           proto.String("Description"),
								Loinc:                 proto.String("31234"),
								Note:                  proto.String("note"),
								Id:                    proto.String("1234"),
							},
						},
						ProviderId: proto.String("8"),
						OrderId:    proto.String("9"),
					},
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name: "failure - no patient id",
			request: &athenapb.GetPatientLabResultDocumentRequest{
				LabResultId: "2",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - no lab result id",
			request: &athenapb.GetPatientLabResultDocumentRequest{
				PatientId: "23",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:              "failure - athena server is unavailable",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - unable to convert athena response",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`wrong response json`),

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - data for requested patientID and labResultID pair not found",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.GetPatientLabResultDocument(ctx, tt.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGetPatientInsuranceBenefitDetails(t *testing.T) {
	tests := []struct {
		desc                                 string
		athenaRawResponse                    []byte
		getPatientInsuranceBenefitDetailsReq *athenapb.GetPatientInsuranceBenefitDetailsRequest
		athenaHTTPStatus                     int

		want         *athenapb.GetPatientInsuranceBenefitDetailsResponse
		wantGRPCCode codes.Code
	}{
		{
			desc: "base case",
			getPatientInsuranceBenefitDetailsReq: &athenapb.GetPatientInsuranceBenefitDetailsRequest{
				PatientId:       "1",
				InsuranceId:     "1",
				ServiceTypeCode: proto.String("30"),
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
			},
			athenaRawResponse: []byte(`{"ansi271": "text", "dateofservice": "05/26/2023", "lastcheckdate": "05/26/2023"}`),
			athenaHTTPStatus:  http.StatusOK,

			want: &athenapb.GetPatientInsuranceBenefitDetailsResponse{Details: &athenapb.InsuranceBenefitDetails{
				EligibilityData: "text",
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
				LastCheckDate: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
			}},
			wantGRPCCode: codes.OK,
		},
		{
			desc: "success - only required fields",
			getPatientInsuranceBenefitDetailsReq: &athenapb.GetPatientInsuranceBenefitDetailsRequest{
				PatientId:   "1",
				InsuranceId: "1",
			},
			athenaRawResponse: []byte(`{"ansi271": "text", "dateofservice": "05/26/2023", "lastcheckdate": "05/26/2023"}`),
			athenaHTTPStatus:  http.StatusOK,

			want: &athenapb.GetPatientInsuranceBenefitDetailsResponse{Details: &athenapb.InsuranceBenefitDetails{
				EligibilityData: "text",
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
				LastCheckDate: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
			}},
			wantGRPCCode: codes.OK,
		},
		{
			desc: "failure - patient id is empty",
			getPatientInsuranceBenefitDetailsReq: &athenapb.GetPatientInsuranceBenefitDetailsRequest{
				InsuranceId:     "1",
				ServiceTypeCode: proto.String("30"),
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - insurance id is empty",
			getPatientInsuranceBenefitDetailsReq: &athenapb.GetPatientInsuranceBenefitDetailsRequest{
				PatientId:       "1",
				ServiceTypeCode: proto.String("30"),
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
			},

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - athena is not available",
			getPatientInsuranceBenefitDetailsReq: &athenapb.GetPatientInsuranceBenefitDetailsRequest{
				PatientId:       "1",
				InsuranceId:     "1",
				ServiceTypeCode: proto.String("30"),
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
			},
			athenaHTTPStatus: http.StatusServiceUnavailable,

			wantGRPCCode: codes.Internal,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())

			got, err := s.GetPatientInsuranceBenefitDetails(ctx, tt.getPatientInsuranceBenefitDetailsReq)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.want, got)
			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
		})
	}
}

func TestTriggerPatientInsuranceEligibilityCheck(t *testing.T) {
	tests := []struct {
		desc                                       string
		triggerPatientInsuranceEligibilityCheckReq *athenapb.TriggerPatientInsuranceEligibilityCheckRequest
		athenaHTTPStatus                           int
		enableInsuranceEligibilityCheck            bool

		wantGRPCCode codes.Code
	}{
		{
			desc: "base case",
			triggerPatientInsuranceEligibilityCheckReq: &athenapb.TriggerPatientInsuranceEligibilityCheckRequest{
				PatientId:       "1",
				InsuranceId:     "1",
				ServiceTypeCode: proto.String("30"),
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
			},
			athenaHTTPStatus:                http.StatusOK,
			enableInsuranceEligibilityCheck: true,

			wantGRPCCode: codes.OK,
		},
		{
			desc: "sucess - only required fields",
			triggerPatientInsuranceEligibilityCheckReq: &athenapb.TriggerPatientInsuranceEligibilityCheckRequest{
				PatientId:   "1",
				InsuranceId: "1",
			},
			athenaHTTPStatus:                http.StatusOK,
			enableInsuranceEligibilityCheck: true,

			wantGRPCCode: codes.OK,
		},
		{
			desc: "failure - patient id is empty",
			triggerPatientInsuranceEligibilityCheckReq: &athenapb.TriggerPatientInsuranceEligibilityCheckRequest{
				InsuranceId:     "1",
				ServiceTypeCode: proto.String("30"),
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
			},
			enableInsuranceEligibilityCheck: true,

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - insurance id is empty",
			triggerPatientInsuranceEligibilityCheckReq: &athenapb.TriggerPatientInsuranceEligibilityCheckRequest{
				PatientId:       "1",
				ServiceTypeCode: proto.String("30"),
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
			},
			enableInsuranceEligibilityCheck: true,

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - athena is not available",
			triggerPatientInsuranceEligibilityCheckReq: &athenapb.TriggerPatientInsuranceEligibilityCheckRequest{
				PatientId:       "1",
				InsuranceId:     "1",
				ServiceTypeCode: proto.String("30"),
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
			},
			athenaHTTPStatus:                http.StatusServiceUnavailable,
			enableInsuranceEligibilityCheck: true,

			wantGRPCCode: codes.Internal,
		},
		{
			desc: "failure - insurance eligibility check is disabled",
			triggerPatientInsuranceEligibilityCheckReq: &athenapb.TriggerPatientInsuranceEligibilityCheckRequest{
				PatientId:       "1",
				InsuranceId:     "1",
				ServiceTypeCode: proto.String("30"),
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
			},
			athenaHTTPStatus:                http.StatusOK,
			enableInsuranceEligibilityCheck: false,

			wantGRPCCode: codes.Unimplemented,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
				},
			))
			defer athenaServer.Close()
			s := &GRPCServer{
				AuthToken: mockAuthValuer{},
				AthenaClient: &athena.Client{
					AuthToken:     mockAuthValuer{},
					AthenaBaseURL: athenaServer.URL,
					HTTPClient:    athenaServer.Client(),
				},
				Logger:                          baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
				EnableInsuranceEligibilityCheck: tt.enableInsuranceEligibilityCheck,
			}
			ctx := context.Background()

			_, err := s.TriggerPatientInsuranceEligibilityCheck(ctx, tt.triggerPatientInsuranceEligibilityCheckReq)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
		})
	}
}

func TestGRPCServerGetPatientGoals(t *testing.T) {
	goodRequest := athenapb.GetPatientGoalsRequest{
		EncounterId: "23",
	}

	tests := []struct {
		name              string
		request           *athenapb.GetPatientGoalsRequest
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.GetPatientGoalsResponse
		wantGRPCCode codes.Code
	}{
		{
			name:    "success - base case",
			request: &goodRequest,

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`{"discussionnotes": "test"}`),
			want: &athenapb.GetPatientGoalsResponse{
				DiscussionNotes: "test",
			},
			wantGRPCCode: codes.OK,
		},
		{
			name:    "failure - no encounter id",
			request: &athenapb.GetPatientGoalsRequest{},

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:    "failure - athena server is unavailable",
			request: &goodRequest,

			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:    "failure - data not found",
			request: &goodRequest,

			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.GetPatientGoals(ctx, tt.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGRPCServerGetPatientOrder(t *testing.T) {
	patientID := "23"
	orderID := "34"
	encounterID := "45"
	goodRequest := athenapb.GetPatientOrderRequest{
		PatientId: patientID,
		OrderId:   orderID,
	}

	tests := []struct {
		name              string
		request           *athenapb.GetPatientOrderRequest
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.GetPatientOrderResponse
		wantGRPCCode codes.Code
	}{
		{
			name:    "success - base case",
			request: &goodRequest,

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(fmt.Sprintf(`[{"orderid": "%s", "encounterid": "%s"}]`, orderID, encounterID)),
			want: &athenapb.GetPatientOrderResponse{
				Order: &athenapb.PatientOrder{
					OrderId:     proto.String(orderID),
					EncounterId: proto.String(encounterID),
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name:    "failure - no patient id",
			request: &athenapb.GetPatientOrderRequest{OrderId: orderID},

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:    "failure - no order id",
			request: &athenapb.GetPatientOrderRequest{PatientId: patientID},

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name:    "failure - athena server is unavailable",
			request: &goodRequest,

			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:    "failure - data not found",
			request: &goodRequest,

			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(t, athenaServer.URL, athenaServer.Client())
			got, err := s.GetPatientOrder(ctx, tt.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

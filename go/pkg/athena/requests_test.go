package athena

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/athena/converters"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/nyaruka/phonenumbers"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

func TestClientIsHealthy(t *testing.T) {
	goodAthenaRawResponse := []byte(`{"pong": "true"}`)
	badAthenaRawResponse := []byte(`{"pong": "other"}`)
	badAthenaRawErrorResponse := []byte(`{"error": "Invalid Access Token.","detailedmessage": "The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header."}`)
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want bool
	}{
		{
			name:              "is healthy: athena is available",
			athenaRawResponse: goodAthenaRawResponse,
			athenaHTTPStatus:  http.StatusOK,

			want: true,
		},
		{
			name:              "is not healthy: athena responds with unexpected status code",
			athenaRawResponse: goodAthenaRawResponse,
			athenaHTTPStatus:  http.StatusUnauthorized,

			want: false,
		},
		{
			name:              "is not healthy: athena responds with unexpected response shape",
			athenaRawResponse: badAthenaRawErrorResponse,
			athenaHTTPStatus:  http.StatusOK,

			want: false,
		},
		{
			name:              "is not healthy: athena responds with unexpected response value",
			athenaRawResponse: badAthenaRawResponse,

			athenaHTTPStatus: http.StatusOK,
			want:             false,
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			got := sc.IsHealthy(context.Background())
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

var goodAthenaAPIPatient = converters.Patient{
	PatientID: proto.String("29"),
	DOB:       proto.String("05/20/1949"),
	Name: &converters.Name{
		Firstname: proto.String("John"),
		Lastname:  proto.String("Heidenreich"),
	},
	Sex: proto.String("F"),
	ContactInfo: &converters.ContactInfo{
		HomePhone: proto.String("5556666888"),
	},
	Address: &converters.Address{
		AddressLineOne: proto.String("558 Torrey Fords, Damari"),
		State:          proto.String("CO"),
		ZipCode:        proto.String("61364"),
		City:           proto.String("DELBERTSIDE"),
	},
	EmergencyContact: &converters.EmergencyContact{
		Name:         proto.String("BOYD"),
		Relationship: proto.String("SPOUSE"),
		MobilePhone:  proto.String("5550676888"),
	},
	Guarantor: &converters.Guarantor{
		Firstname:             proto.String("Giovani"),
		Lastname:              proto.String("Johnson"),
		DOB:                   proto.String("04/30/1949"),
		Phone:                 proto.String("5550676888"),
		AddressLineOne:        proto.String("Apt. 500 6544 Dietrich R"),
		City:                  proto.String("DENVER"),
		State:                 proto.String("CO"),
		ZipCode:               proto.String("80202-5107"),
		AddressSameAsPatient:  proto.String("true"),
		RelationshipToPatient: proto.String("1"),
	},
	PrimaryProviderID: proto.String("1"),
	PortalAccessGiven: proto.String("false"),
}

var goodAthenaServicePatient = athenapb.Patient{
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
}

func TestClientGetPatient(t *testing.T) {
	mockPatient := []converters.Patient{goodAthenaAPIPatient}
	goodAthenaRawResponse, _ := json.Marshal(mockPatient)
	noPatientResponse := []byte(`[]`)
	badValueMappingAthenaRawResponse := []byte(`[{"patientid": 123,"dob":"2020-05-04", "firstname":"John"]`)
	athenaRawErrorResponse := []byte(`{"error": "Invalid Access Token.","detailedmessage": "The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header."}`)

	type args struct {
		patientID string
	}
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int
		args              args
		want              *athenapb.Patient
		wantErr           *struct {
			code    codes.Code
			message string
		}
	}{
		{
			name: "Base Case",
			args: args{
				patientID: "29",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,
			want:              &goodAthenaServicePatient,
			wantErr:           nil,
		},
		{
			name: "Athena API returns an error",
			args: args{
				patientID: "29",
			},
			athenaHTTPStatus:  http.StatusInternalServerError,
			athenaRawResponse: athenaRawErrorResponse,
			want:              nil,
			wantErr: &struct {
				code    codes.Code
				message string
			}{
				code:    codes.Internal,
				message: "Failed to get patient from AthenaAPI. err: rpc error: code = Internal desc = HTTP request had error response 500: {\"error\": \"Invalid Access Token.\",\"detailedmessage\": \"The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header.\"}",
			},
		},
		{
			name: "No Results",
			args: args{
				patientID: "29",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: noPatientResponse,
			want:              nil,
			wantErr: &struct {
				code    codes.Code
				message string
			}{
				code:    codes.Internal,
				message: "Failed to get patient from AthenaAPI. Expected 1 result, received 0",
			},
		},
		{
			name: "Response in wrong shape",
			args: args{
				patientID: "29",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: badValueMappingAthenaRawResponse,
			want:              nil,
			wantErr: &struct {
				code    codes.Code
				message string
			}{
				code:    codes.Internal,
				message: "Failed to get patient from AthenaAPI. err: rpc error: code = Internal desc = Failed to unmarshal json into given struct: invalid character ']' after object key:value pair",
			},
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			got, err := sc.GetPatient(context.Background(), tt.args.patientID)
			if err != nil {
				if tt.wantErr == nil {
					t.Errorf("GetPatient() error = %v, wantErr %v", err, tt.wantErr)
					return
				}
				e, _ := status.FromError(err)
				testutils.MustMatch(t, tt.wantErr.code, e.Code())
				testutils.MustMatch(t, tt.wantErr.message, e.Message())
			}
			testutils.MustMatchProto(t, tt.want, got)
		})
	}
}

func TestClientEnhancedBestMatch(t *testing.T) {
	tests := []struct {
		name         string
		request      *converters.EnhancedBestMatchRequest
		response     []*converters.EnhancedBestMatchResult
		responseCode int

		want     []*athenapb.EnhancedBestMatchResult
		wantCode codes.Code
	}{
		{
			name: "Base Case",
			request: &converters.EnhancedBestMatchRequest{
				FirstName:   "Luke",
				LastName:    "Skywalker",
				DateOfBirth: "10/30/2001",
			},
			response: []*converters.EnhancedBestMatchResult{
				{Patient: &converters.Patient{PatientID: proto.String("A1234")}, Score: 23},
			},
			responseCode: 200,
			want: []*athenapb.EnhancedBestMatchResult{
				{Patient: &athenapb.Patient{PatientId: proto.String("A1234")}, ScoreString: "23"},
			},
			wantCode: codes.OK,
		},
		{
			name: "Athena error",
			request: &converters.EnhancedBestMatchRequest{
				FirstName:   "Luke",
				LastName:    "Skywalker",
				DateOfBirth: "10/30/2001",
			},
			responseCode: 500,
			wantCode:     codes.Internal,
		},
		{
			name: "Fail to convert Athena response to proto",
			request: &converters.EnhancedBestMatchRequest{
				FirstName:   "Luke",
				LastName:    "Skywalker",
				DateOfBirth: "10/30/2001",
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

			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			got, err := c.EnhancedBestMatch(context.Background(), tt.request)
			if status.Convert(err).Code() != tt.wantCode {
				t.Fatalf("EnhancedBestMatch() error = %v, wantCode %v", err, tt.wantCode)
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientGetCareTeam(t *testing.T) {
	tests := []struct {
		desc             string
		athenaHTTPStatus int
		athenaResponse   *converters.CareTeam

		wantGRPCCode codes.Code
		wantMembers  []*athenapb.CareTeamMember
		wantNote     *string
	}{
		{
			desc:             "success - get care team",
			athenaHTTPStatus: http.StatusOK,
			athenaResponse: &converters.CareTeam{
				Members: []converters.CareTeamMember{
					{
						MemberID:  proto.String("examplememberid"),
						FirstName: proto.String("examplefirst"),
						LastName:  proto.String("examplelast"),
					},
				},
				Note: proto.String("examplenote"),
			},

			wantGRPCCode: codes.OK,
			wantMembers: []*athenapb.CareTeamMember{
				{
					MemberId: proto.String("examplememberid"),
					Name: &commonpb.Name{
						GivenName:  proto.String("examplefirst"),
						FamilyName: proto.String("examplelast"),
					},
				},
			},
			wantNote: proto.String("examplenote"),
		},
		{
			desc:             "failure - athena is not available",
			athenaHTTPStatus: http.StatusServiceUnavailable,

			wantGRPCCode: codes.Internal,
		},
		{
			desc:             "failure - patient does not have care team",
			athenaHTTPStatus: http.StatusOK,
			athenaResponse:   &converters.CareTeam{},

			wantGRPCCode: codes.NotFound,
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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			members, note, err := c.GetCareTeam(context.Background(), "examplepatientid", "exampledepartmentid")
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")

			testutils.MustMatch(t, tt.wantMembers, members, "response does not match")
			testutils.MustMatch(t, tt.wantNote, note, "response does not match")
		})
	}
}

var goodAthenaServicePatientPreferredPharmacy = []*athenapb.Pharmacy{
	{
		PharmacyType:    proto.String("RETAIL"),
		DefaultPharmacy: proto.String("true"),
		ReceiverType:    nil,
		AcceptFax:       proto.String("true"),
		ClinicalProvider: &athenapb.ClinicalProvider{
			Id:   proto.String("10121234"),
			Name: proto.String("King Pharmacy"),
		},
		Address: &commonpb.Address{
			AddressLineOne: proto.String("1337 W Belleview"),
			City:           proto.String("Littleton"),
			State:          proto.String("CO"),
			ZipCode:        proto.String("801231234"),
		},
		PhoneNumber: &commonpb.PhoneNumber{
			PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK,
			CountryCode:     proto.Int32(1),
			PhoneNumber:     proto.String("(303) 321-3213"),
		},
		FaxNumber: proto.String("3031231234"),
	},
}

func TestClientGetPreferredPharmacies(t *testing.T) {
	goodAthenaRawResponse := []byte(`{
    "pharmacies": [
        {
            "pharmacytype": "RETAIL",
            "defaultpharmacy": "true",
            "state": "CO",
            "city": "Littleton",
            "receivertype": "ERX",
            "acceptfax": "true",
            "clinicalproviderid": "10121234",
            "zip": "801231234",
            "phonenumber": "3033213213",
            "clinicalprovidername": "King Pharmacy",
            "address1": "1337 W Belleview",
            "faxnumber": "3031231234"
        }
    ]
}`)
	badRawResponseWithEmptyArray := []byte(`{"PreferredPharmacy": []}`)
	badMalformedAthenaRawResponse := []byte(`[{"patientid": 123]`)
	athenaRawErrorResponse := []byte(`{"error": "Invalid Access Token.","detailedmessage": "The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header."}`)

	type args struct {
		patientID    string
		departmentID string
	}
	type wantError struct {
		code    codes.Code
		message string
	}
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int
		args              args

		want    []*athenapb.Pharmacy
		wantErr *wantError
	}{
		{
			name: "Base Case",
			args: args{
				patientID:    "228",
				departmentID: "2",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want:    goodAthenaServicePatientPreferredPharmacy,
			wantErr: nil,
		},
		{
			name: "Athena API returns an error",
			args: args{
				patientID: "29",
			},
			athenaHTTPStatus:  http.StatusInternalServerError,
			athenaRawResponse: athenaRawErrorResponse,

			want: nil,
			wantErr: &wantError{
				code:    codes.Internal,
				message: "Failed to get patient preferred pharmacy from AthenaAPI. err: rpc error: code = Internal desc = HTTP request had error response 500: {\"error\": \"Invalid Access Token.\",\"detailedmessage\": \"The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header.\"}",
			},
		},
		{
			name: "Response in wrong shape",
			args: args{
				patientID:    "29",
				departmentID: "2",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: badMalformedAthenaRawResponse,

			want: nil,
			wantErr: &wantError{
				code:    codes.Internal,
				message: "Failed to get patient preferred pharmacy from AthenaAPI. err: rpc error: code = Internal desc = Failed to unmarshal json into given struct: invalid character ']' after object key:value pair",
			},
		},
		{
			name: "Response in an empty array",
			args: args{
				patientID:    "29",
				departmentID: "2",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: badRawResponseWithEmptyArray,

			want:    nil,
			wantErr: nil,
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			got, err := sc.GetPreferredPharmacies(context.Background(), tt.args.patientID, tt.args.departmentID)
			if err != nil {
				if tt.wantErr == nil {
					t.Errorf("GetPreferredPharmacy() error = %v, wantErr %v", err, tt.wantErr)
					return
				}
				e, _ := status.FromError(err)
				testutils.MustMatch(t, tt.wantErr.code, e.Code())
				testutils.MustMatch(t, tt.wantErr.message, e.Message())
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientUpdatePatientPreferredPharmacy(t *testing.T) {
	goodAthenaRawResponse := []byte(`{"success": "true"}`)
	athenaRawTokenErrorResponse := []byte(`{"error": "Invalid Access Token.","detailedmessage": "The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header."}`)
	athenaRawNotFoundResponse := []byte(`{"error":"The Patient ID or Department ID is invalid."}`)
	athenaRawBadRequestResponse := []byte(`{"detailedmessage":"NCPDPID or CLINICALPROVIDERID must be set. Only one of NCPDPID or CLINICALPROVIDERID can be provided.","error":"The data provided is invalid."}`)

	type args struct {
		patientID          string
		departmentID       string
		clinicalProviderID string
	}
	type wantError struct {
		code    codes.Code
		message string
	}
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int
		args              args

		wantErr *wantError
	}{
		{
			name: "Base Case",
			args: args{
				patientID:          "228",
				departmentID:       "2",
				clinicalProviderID: "10812312",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			wantErr: nil,
		},
		{
			name: "Athena API returns an error",
			args: args{
				patientID: "29",
			},
			athenaHTTPStatus:  http.StatusInternalServerError,
			athenaRawResponse: athenaRawTokenErrorResponse,

			wantErr: &wantError{
				code:    codes.Internal,
				message: "HTTP request had error response 500: {\"error\": \"Invalid Access Token.\",\"detailedmessage\": \"The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header.\"}",
			},
		},
		{
			name: "Athena API returns bad request",
			args: args{
				patientID:          "29",
				clinicalProviderID: "123",
			},
			athenaHTTPStatus:  http.StatusBadRequest,
			athenaRawResponse: athenaRawBadRequestResponse,

			wantErr: &wantError{
				code:    codes.InvalidArgument,
				message: "HTTP request had error response 400: {\"detailedmessage\":\"NCPDPID or CLINICALPROVIDERID must be set. Only one of NCPDPID or CLINICALPROVIDERID can be provided.\",\"error\":\"The data provided is invalid.\"}",
			},
		},
		{
			name: "Athena API returns not found",
			args: args{
				patientID: "29",
			},
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: athenaRawNotFoundResponse,

			wantErr: &wantError{
				code:    codes.NotFound,
				message: "HTTP request had error response 404: {\"error\":\"The Patient ID or Department ID is invalid.\"}",
			},
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			err := sc.UpdatePreferredPharmacy(context.Background(), tt.args.patientID, tt.args.departmentID, tt.args.clinicalProviderID)
			if err != nil {
				if tt.wantErr == nil {
					t.Errorf("UpdatePreferredPharmacy() error = %v, wantErr %v", err, tt.wantErr)
					return
				}
				e, _ := status.FromError(err)
				testutils.MustMatch(t, tt.wantErr.code, e.Code())
				testutils.MustMatch(t, tt.wantErr.message, e.Message())
			}
		})
	}
}

func TestClientDeletePatientPreferredPharmacy(t *testing.T) {
	goodAthenaRawResponse := []byte(`{"success": "true"}`)
	athenaRawTokenErrorResponse := []byte(`{"error": "Invalid Access Token.","detailedmessage": "The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header."}`)
	athenaRawNotFoundResponse := []byte(`{"error":"The Patient ID or Department ID is invalid."}`)
	athenaRawBadRequestResponse := []byte(`{"detailedmessage":"NCPDPID or CLINICALPROVIDERID must be set. Only one of NCPDPID or CLINICALPROVIDERID can be provided.","error":"The data provided is invalid."}`)

	type args struct {
		patientID          string
		departmentID       string
		clinicalProviderID string
	}
	type wantError struct {
		code    codes.Code
		message string
	}
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int
		args              args

		wantErr *wantError
	}{
		{
			name: "Base Case",
			args: args{
				patientID:          "228",
				departmentID:       "2",
				clinicalProviderID: "10812312",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			wantErr: nil,
		},
		{
			name: "Athena API returns an error",
			args: args{
				patientID: "29",
			},
			athenaHTTPStatus:  http.StatusInternalServerError,
			athenaRawResponse: athenaRawTokenErrorResponse,

			wantErr: &wantError{
				code:    codes.Internal,
				message: "HTTP request had error response 500: {\"error\": \"Invalid Access Token.\",\"detailedmessage\": \"The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header.\"}",
			},
		},
		{
			name: "Athena API returns bad request",
			args: args{
				patientID:          "29",
				clinicalProviderID: "123",
			},
			athenaHTTPStatus:  http.StatusBadRequest,
			athenaRawResponse: athenaRawBadRequestResponse,

			wantErr: &wantError{
				code:    codes.InvalidArgument,
				message: "HTTP request had error response 400: {\"detailedmessage\":\"NCPDPID or CLINICALPROVIDERID must be set. Only one of NCPDPID or CLINICALPROVIDERID can be provided.\",\"error\":\"The data provided is invalid.\"}",
			},
		},
		{
			name: "Athena API returns not found",
			args: args{
				patientID: "29",
			},
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: athenaRawNotFoundResponse,

			wantErr: &wantError{
				code:    codes.NotFound,
				message: "HTTP request had error response 404: {\"error\":\"The Patient ID or Department ID is invalid.\"}",
			},
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			err := sc.DeletePreferredPharmacy(context.Background(), tt.args.patientID, tt.args.departmentID, tt.args.clinicalProviderID)
			if err != nil {
				if tt.wantErr == nil {
					t.Errorf("UpdatePreferredPharmacy() error = %v, wantErr %v", err, tt.wantErr)
					return
				}
				e, _ := status.FromError(err)
				testutils.MustMatch(t, tt.wantErr.code, e.Code())
				testutils.MustMatch(t, tt.wantErr.message, e.Message())
			}
		})
	}
}

func TestCreatePatient(t *testing.T) {
	tests := []struct {
		name             string
		patient          *athenapb.Patient
		athenaHTTPStatus int
		athenaResponse   []byte

		wantResponse   *string
		wantGRPCCode   codes.Code
		wantErrMessage string
	}{
		{
			name:             "Base Case - Create patient",
			patient:          &athenapb.Patient{PatientId: proto.String("436184")},
			athenaHTTPStatus: http.StatusCreated,
			athenaResponse:   []byte(`[{"patientid":"436184"}]`),

			wantResponse: proto.String("436184"),
			wantGRPCCode: codes.OK,
		},
		{
			name:             "error - athena responds with unexpected status code",
			patient:          &athenapb.Patient{PatientId: proto.String("436184")},
			athenaHTTPStatus: http.StatusBadRequest,
			athenaResponse:   []byte(`{"error":"Additional fields are required."}`),

			wantResponse:   nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: `HTTP request had error response 400: {"error":"Additional fields are required."}`,
		},
		{
			name:             "error - Athena responds with unexpected response",
			patient:          &athenapb.Patient{PatientId: proto.String("436184")},
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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			resp, err := c.CreatePatient(context.Background(), tt.patient)
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
		desc             string
		athenaHTTPStatus int

		wantGRPCCode codes.Code
	}{
		{
			desc:             "success - care team update",
			athenaHTTPStatus: http.StatusOK,

			wantGRPCCode: codes.OK,
		},
		{
			desc:             "failure - athena is not available",
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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			err := c.UpdateCareTeam(context.Background(), "1", "2", "3", "4")
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
		})
	}
}

func TestUpdatePatient(t *testing.T) {
	tests := []struct {
		name             string
		athenaHTTPStatus int
		athenaResponse   []byte

		wantResponse   *string
		wantGRPCCode   codes.Code
		wantErrMessage string
	}{
		{
			name:             "Base Case - Update patient",
			athenaHTTPStatus: http.StatusCreated,
			athenaResponse:   []byte(`[{"patientid":"436184"}]`),

			wantResponse: proto.String("436184"),
			wantGRPCCode: codes.OK,
		},
		{
			name:             "error - athena responds with unexpected status code",
			athenaHTTPStatus: http.StatusBadRequest,
			athenaResponse:   []byte(`{"error":"Additional fields are required."}`),

			wantResponse:   nil,
			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: `HTTP request had error response 400: {"error":"Additional fields are required."}`,
		},
		{
			name:             "error - Athena responds with unexpected response",
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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			resp, err := c.UpdatePatient(context.Background(), &athenapb.Patient{PatientId: proto.String("436184")})
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
			desc:             "success - care team delete",
			athenaHTTPStatus: http.StatusOK,

			wantGRPCCode: codes.OK,
		},
		{
			desc:             "failure - athena is not available",
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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			err := c.DeleteCareTeam(context.Background(), "1", "2", "3")
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
		})
	}
}
func TestClientCreatePatientInsurance(t *testing.T) {
	goodConverterInsurance := converters.PatientInsurance{
		InsuranceID:        proto.String("54321"),
		InsurancePackageID: proto.String("1234"),
		PolicyNumber:       proto.String("4321"),
		InsuranceHolder: &converters.InsuranceHolder{
			InsuranceHolderName: &converters.InsuranceHolderName{
				FirstName:  proto.String("Lorem"),
				MiddleName: proto.String("Ipsum"),
				LastName:   proto.String("Dolor"),
			},
			DOB: proto.String("01/30/1970"),
		},
	}
	badConverterInsurance := converters.PatientInsurance{
		InsuranceID:        proto.String("54321"),
		InsurancePackageID: proto.String("nonnumeric"),
	}
	tests := []struct {
		name             string
		athenaHTTPStatus int
		athenaResponse   []converters.PatientInsurance

		want           *athenapb.Insurance
		wantGRPCCode   codes.Code
		wantErrMessage string
	}{
		{
			name:             "Base Case",
			athenaHTTPStatus: http.StatusCreated,
			athenaResponse: []converters.PatientInsurance{
				goodConverterInsurance,
			},

			want: &athenapb.Insurance{
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
				},
			},
			wantGRPCCode: 0,
		},
		{
			name:             "returns error if athena responds with more than one item",
			athenaHTTPStatus: http.StatusCreated,
			athenaResponse: []converters.PatientInsurance{
				goodConverterInsurance,
				goodConverterInsurance,
			},

			wantGRPCCode:   codes.Internal,
			wantErrMessage: "Unexpected athena response for create patient insurance. Expected 1 result, received 2",
		},
		{
			name:             "returns error if athena responds with incompatible response",
			athenaHTTPStatus: http.StatusCreated,
			athenaResponse: []converters.PatientInsurance{
				badConverterInsurance,
			},

			wantGRPCCode:   codes.Internal,
			wantErrMessage: `Failed to build CreatePatientInsurance response, err: strconv.ParseInt: parsing "nonnumeric": invalid syntax`,
		},
		{
			name:             "returns error if athena request is not successful",
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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			got, err := c.CreatePatientInsurance(context.Background(), &athenapb.Insurance{PatientId: proto.String("1")})
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

func TestClient_UpdateSpecificInsurance(t *testing.T) {
	type args struct {
		insuranceRecord *athenapb.Insurance
	}
	tests := []struct {
		name              string
		args              args
		athenaHTTPStatus  int
		athenaRawResponse []byte

		wantGRPCCode   codes.Code
		wantErrMessage string
	}{
		{
			name: "base case",
			args: args{
				insuranceRecord: &athenapb.Insurance{
					InsuranceId: proto.String("123"),
					PatientId:   proto.String("1234"),
				},
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(""),
			wantGRPCCode:      0,
		},
		{
			name: "returns error if called with nil insuranceRecord",

			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "insurance data is empty",
		},
		{
			name: "returns error if called with nil patientID",
			args: args{
				insuranceRecord: &athenapb.Insurance{
					InsuranceId: proto.String("123"),
				},
			},

			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "patient id is empty",
		},
		{
			name: "returns error if called with nil insuranceID",
			args: args{
				insuranceRecord: &athenapb.Insurance{
					PatientId: proto.String("123"),
				},
			},

			wantGRPCCode:   codes.InvalidArgument,
			wantErrMessage: "athena insurance id is empty",
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

			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			err := c.UpdateSpecificInsurance(context.Background(), tt.args.insuranceRecord)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tt.wantErrMessage, respStatus.Message())
		})
	}
}

func TestClient_DeletePatientSpecificInsurance(t *testing.T) {
	goodAthenaRawResponse := []byte(`{"success": "true"}`)
	athenaRawTokenErrorResponse := []byte(`{"error": "Invalid Access Token.","detailedmessage": "The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header."}`)
	athenaRawNotFoundResponse := []byte(`{"error":"The Patient ID or Insurance ID is invalid."}`)
	athenaRawBadRequestResponse := []byte(`{"detailedmessage":"Please make sure all required values are provided.","error":"The data provided is invalid."}`)

	type args struct {
		patientID   string
		insuranceID string
	}
	type wantError struct {
		code    codes.Code
		message string
	}
	tests := []struct {
		name              string
		athenaHTTPStatus  int
		athenaRawResponse []byte
		args              args

		wantErr *wantError
	}{
		{
			name: "Base case",
			args: args{
				patientID:   "1234",
				insuranceID: "2",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			wantErr: nil,
		},
		{
			name: "Athena API returns an error",
			args: args{
				patientID:   "1234",
				insuranceID: "2",
			},
			athenaHTTPStatus:  http.StatusInternalServerError,
			athenaRawResponse: athenaRawTokenErrorResponse,

			wantErr: &wantError{
				code:    codes.Internal,
				message: "HTTP request had error response 500: {\"error\": \"Invalid Access Token.\",\"detailedmessage\": \"The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header.\"}",
			},
		},
		{
			name: "Athena API returns not found",
			args: args{
				patientID:   "1234",
				insuranceID: "5678",
			},
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: athenaRawNotFoundResponse,

			wantErr: &wantError{
				code:    codes.NotFound,
				message: "HTTP request had error response 404: {\"error\":\"The Patient ID or Insurance ID is invalid.\"}",
			},
		},
		{
			name: "Athena API returns bad request",
			args: args{
				patientID:   "1234",
				insuranceID: "5678",
			},
			athenaHTTPStatus:  http.StatusBadRequest,
			athenaRawResponse: athenaRawBadRequestResponse,

			wantErr: &wantError{
				code:    codes.InvalidArgument,
				message: "HTTP request had error response 400: {\"detailedmessage\":\"Please make sure all required values are provided.\",\"error\":\"The data provided is invalid.\"}",
			},
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			err := sc.DeleteSpecificInsurance(context.Background(), tt.args.patientID, tt.args.insuranceID)

			if err != nil {
				if tt.wantErr == nil {
					t.Errorf("DeleteSpecificInsurance() error = %v, wantErr %v", err, tt.wantErr)
					return
				}
				e, _ := status.FromError(err)
				testutils.MustMatch(t, tt.wantErr.code, e.Code())
				testutils.MustMatch(t, tt.wantErr.message, e.Message())
			}
		})
	}
}

func TestSearchClinicalProviders(t *testing.T) {
	tests := []struct {
		desc                      string
		searchClinicalProviderReq *converters.ClinicalProvider
		athenaHTTPStatus          int
		athenaResponse            *converters.ClinicalProviderSearchResult

		wantGRPCCode codes.Code
		wantResponse []*athenapb.ClinicalProviderSearchResult
	}{
		{
			desc: "success - returns search list of clinical providers",
			searchClinicalProviderReq: &converters.ClinicalProvider{
				Name: proto.String("Sarah Jones"),
				Zip:  proto.String("68124"),
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
			wantResponse: []*athenapb.ClinicalProviderSearchResult{
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
		{
			desc: "failure - athena bad request",
			searchClinicalProviderReq: &converters.ClinicalProvider{
				Name: proto.String("Sarah Jones"),
			},
			athenaHTTPStatus: http.StatusBadRequest,

			wantGRPCCode: codes.InvalidArgument,
		},
		{
			desc: "failure - athena is not available",
			searchClinicalProviderReq: &converters.ClinicalProvider{
				Name: proto.String("Sarah Jones"),
				Zip:  proto.String("68124"),
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
					resp, err := json.Marshal(tt.athenaResponse)
					if err != nil {
						t.Fatal(err)
					}
					rw.Write(resp)
				},
			))
			defer athenaServer.Close()
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			resp, err := c.SearchClinicalProviders(context.Background(), &converters.ClinicalProvider{})
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.wantResponse, resp, "response does not match")
		})
	}
}

var goodAthenaServicePatientDefaultPharmacy = athenapb.Pharmacy{
	PharmacyType:    proto.String("RETAIL"),
	DefaultPharmacy: proto.String("true"),
	ReceiverType:    nil,
	AcceptFax:       proto.String("true"),
	ClinicalProvider: &athenapb.ClinicalProvider{
		Id:   proto.String("10121234"),
		Name: proto.String("King Pharmacy"),
	},
	Address: &commonpb.Address{
		AddressLineOne: proto.String("1337 W Belleview"),
		City:           proto.String("Littleton"),
		State:          proto.String("CO"),
		ZipCode:        proto.String("801231234"),
	},
	PhoneNumber: &commonpb.PhoneNumber{
		PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK,
		CountryCode:     proto.Int32(1),
		PhoneNumber:     proto.String("(303) 321-3213"),
	},
	FaxNumber: proto.String("3031231234"),
}

func TestClientUpdatePatientDefaultPharmacy(t *testing.T) {
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.UpdateDefaultPharmacyResponse
		wantGRPCCode codes.Code
	}{
		{
			name:             "success - base case",
			athenaHTTPStatus: http.StatusOK,
			want:             &athenapb.UpdateDefaultPharmacyResponse{},
			wantGRPCCode:     codes.OK,
		},
		{
			name:              "failure - athena server is unavailable",
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Unknown,
		},
		{
			name:              "failure - data for requested patientID, departmentID and clinicalProviderId not found",
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

			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			err := c.UpdateDefaultPharmacy(context.Background(), "23", "2", "20812312")
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
		})
	}
}

func TestClientGetDefaultPharmacy(t *testing.T) {
	goodAthenaRawResponse := []byte(`{
		"pharmacytype": "RETAIL",
		"defaultpharmacy": "true",
		"state": "CO",
		"city": "Littleton",
		"receivertype": "ERX",
		"acceptfax": "true",
		"clinicalproviderid": "10121234",
		"zip": "801231234",
		"phonenumber": "3033213213",
		"clinicalprovidername": "King Pharmacy",
		"address1": "1337 W Belleview",
		"faxnumber": "3031231234"
}`)
	badMalformedAthenaRawResponse := []byte(`[{"patientid": 123]`)
	athenaRawErrorResponse := []byte(`{"error": "Invalid Access Token.","detailedmessage": "The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header."}`)

	type args struct {
		patientID    string
		departmentID string
	}
	type wantError struct {
		code    codes.Code
		message string
	}
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int
		args              args

		want    *athenapb.Pharmacy
		wantErr *wantError
	}{
		{
			name: "Base Case",
			args: args{
				patientID:    "228",
				departmentID: "2",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want:    &goodAthenaServicePatientDefaultPharmacy,
			wantErr: nil,
		},
		{
			name: "Athena API returns an error",
			args: args{
				patientID: "29",
			},
			athenaHTTPStatus:  http.StatusInternalServerError,
			athenaRawResponse: athenaRawErrorResponse,

			want: nil,
			wantErr: &wantError{
				code:    codes.Internal,
				message: "Failed to get patient default pharmacy from AthenaAPI. err: rpc error: code = Internal desc = HTTP request had error response 500: {\"error\": \"Invalid Access Token.\",\"detailedmessage\": \"The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header.\"}",
			},
		},
		{
			name: "Response in wrong shape",
			args: args{
				patientID:    "29",
				departmentID: "2",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: badMalformedAthenaRawResponse,

			want: nil,
			wantErr: &wantError{
				code:    codes.Internal,
				message: "Failed to get patient default pharmacy from AthenaAPI. err: rpc error: code = Internal desc = Failed to unmarshal json into given struct: invalid character ']' after object key:value pair",
			},
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			got, err := sc.GetDefaultPharmacy(context.Background(), tt.args.patientID, tt.args.departmentID)
			if err != nil {
				if tt.wantErr == nil {
					t.Errorf("GetDefaultPharmacy() error = %v, wantErr %v", err, tt.wantErr)
					return
				}
				e, _ := status.FromError(err)
				testutils.MustMatch(t, tt.wantErr.code, e.Code())
				testutils.MustMatch(t, tt.wantErr.message, e.Message())
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientCheckLabResultsSubscriptionStatus(t *testing.T) {
	goodAthenaRawResponse := []byte(`{"status": "INACTIVE"}`)
	badMalformedAthenaRawResponse := []byte(`[{"status": 123]`)

	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want     string
		wantCode codes.Code
	}{
		{
			name:              "Base Case",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: "INACTIVE",
		},
		{
			name:              "Athena API returns not found",
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: goodAthenaRawResponse,

			wantCode: codes.NotFound,
		},
		{
			name:              "Athena API returns an error",
			athenaHTTPStatus:  http.StatusBadGateway,
			athenaRawResponse: goodAthenaRawResponse,

			wantCode: codes.Internal,
		},
		{
			name:              "Response in wrong shape",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: badMalformedAthenaRawResponse,

			wantCode: codes.Internal,
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			got, err := sc.CheckLabResultsSubscriptionStatus(context.Background())
			e := status.Convert(err)
			testutils.MustMatch(t, tt.wantCode, e.Code())
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientSubscribeLabResultEvents(t *testing.T) {
	tests := []struct {
		name             string
		athenaHTTPStatus int

		wantCode codes.Code
	}{
		{
			name:             "Base Case",
			athenaHTTPStatus: http.StatusOK,
		},
		{
			name:             "Athena API returns not found",
			athenaHTTPStatus: http.StatusNotFound,

			wantCode: codes.NotFound,
		},
		{
			name:             "Athena API returns any other error",
			athenaHTTPStatus: http.StatusBadGateway,

			wantCode: codes.Internal,
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			err := sc.SubscribeLabResultEvents(context.Background())
			e := status.Convert(err)
			testutils.MustMatch(t, tt.wantCode, e.Code())
		})
	}
}

func TestClientCheckPatientsSubscriptionStatus(t *testing.T) {
	goodAthenaRawResponse := []byte(`{"status": "INACTIVE"}`)
	badMalformedAthenaRawResponse := []byte(`[{"status": 123]`)

	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want     string
		wantCode codes.Code
	}{
		{
			name:              "Base Case",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: "INACTIVE",
		},
		{
			name:              "Athena API returns not found",
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: goodAthenaRawResponse,

			wantCode: codes.NotFound,
		},
		{
			name:              "Athena API returns an error",
			athenaHTTPStatus:  http.StatusBadGateway,
			athenaRawResponse: goodAthenaRawResponse,

			wantCode: codes.Internal,
		},
		{
			name:              "Response in wrong shape",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: badMalformedAthenaRawResponse,

			wantCode: codes.Internal,
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			got, err := sc.CheckPatientsSubscriptionStatus(context.Background())
			e := status.Convert(err)
			testutils.MustMatch(t, tt.wantCode, e.Code())
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientSubscribePatientEvents(t *testing.T) {
	tests := []struct {
		name             string
		athenaHTTPStatus int

		wantCode codes.Code
	}{
		{
			name:             "Base Case",
			athenaHTTPStatus: http.StatusOK,
		},
		{
			name:             "Athena API returns not found",
			athenaHTTPStatus: http.StatusNotFound,

			wantCode: codes.NotFound,
		},
		{
			name:             "Athena API returns any other error",
			athenaHTTPStatus: http.StatusBadGateway,

			wantCode: codes.Internal,
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			err := sc.SubscribePatientEvents(context.Background())
			e := status.Convert(err)
			testutils.MustMatch(t, tt.wantCode, e.Code())
		})
	}
}

func TestClientListChangedLabResults(t *testing.T) {
	goodAthenaResponse := converters.ChangedLabResults{
		LabResults: []converters.ChangedLabResult{
			{
				LabResultID:  proto.String("121"),
				DepartmentID: proto.String("122"),
				EncounterID:  proto.String("123"),
				PatientID:    proto.String("124"),
			},
		},
	}
	goodAthenaRawResponse, err := json.Marshal(goodAthenaResponse)
	if err != nil {
		t.Fatalf("Could not marshal athena response: %s", err)
	}
	badMalformedAthenaRawResponse := []byte(`[{"patientid": 123]`)
	athenaRawErrorResponse := []byte(`{"error": "Invalid Access Token.","detailedmessage": "The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header."}`)

	type wantError struct {
		code    codes.Code
		message string
	}
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int
		params            url.Values

		want    *converters.ChangedLabResults
		wantErr *wantError
	}{
		{
			name: "Base Case",

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,
			params:            url.Values{"utensil": []string{"fork"}},

			want: &converters.ChangedLabResults{
				LabResults: []converters.ChangedLabResult{
					{
						LabResultID:  proto.String("121"),
						DepartmentID: proto.String("122"),
						EncounterID:  proto.String("123"),
						PatientID:    proto.String("124"),
					},
				},
			},
			wantErr: nil,
		},
		{
			name: "Athena API returns an error",

			athenaHTTPStatus:  http.StatusInternalServerError,
			athenaRawResponse: athenaRawErrorResponse,
			params:            url.Values{"utensil": []string{"spoon"}},

			want: nil,
			wantErr: &wantError{
				code:    codes.Internal,
				message: "HTTP request had error response 500: {\"error\": \"Invalid Access Token.\",\"detailedmessage\": \"The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header.\"}",
			},
		},
		{
			name:              "Response in wrong shape",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: badMalformedAthenaRawResponse,
			params:            url.Values{"utensil": []string{"knife"}},

			want: nil,
			wantErr: &wantError{
				code:    codes.Internal,
				message: "Failed to unmarshal json into given struct: invalid character ']' after object key:value pair",
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
					testutils.MustMatch(t, tt.params, req.URL.Query(), "Query params must match")
				},
			))
			defer athenaServer.Close()

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			got, err := sc.ListChangedLabResults(context.Background(), tt.params)
			if err != nil {
				if tt.wantErr == nil {
					t.Errorf("ListChangedLabResults() error = %v, wantErr %v", err, tt.wantErr)
					return
				}
				e, _ := status.FromError(err)
				testutils.MustMatch(t, tt.wantErr.code, e.Code())
				testutils.MustMatch(t, tt.wantErr.message, e.Message())
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientListChangedPatients(t *testing.T) {
	goodAthenaResponse := converters.ChangedPatients{
		Patients: []converters.ChangedPatient{
			{
				PatientID:          proto.String("405010"),
				PreviousPatientIDs: []string{"405009"},
			},
		},
	}
	goodAthenaRawResponse, err := json.Marshal(goodAthenaResponse)
	if err != nil {
		t.Fatalf("Could not marshal athena response: %s", err)
	}
	goodAthenaMultiplePatientsResponse := converters.ChangedPatients{
		Patients: []converters.ChangedPatient{
			{
				PatientID:          proto.String("405010"),
				PreviousPatientIDs: []string{"405009"},
			},
			{
				PatientID: proto.String("123"),
			},
		},
	}
	goodAthenaMultiplePatientsRawResponse, err := json.Marshal(goodAthenaMultiplePatientsResponse)
	if err != nil {
		t.Fatalf("Could not marshal athena response: %s", err)
	}
	badMalformedAthenaRawResponse := []byte(`[{"patientid": 123]`)
	errorAthenaResponse := map[string]string{
		"error":           "Invalid Access Token.",
		"detailedmessage": "lol no goal",
	}
	errorRawAthenaResponse, _ := json.Marshal(errorAthenaResponse)

	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int
		params            url.Values

		want       *converters.ChangedPatients
		wantParams url.Values
		wantCode   codes.Code
	}{
		{
			name: "Base Case",

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: &converters.ChangedPatients{
				Patients: []converters.ChangedPatient{{
					PatientID:          proto.String("405010"),
					PreviousPatientIDs: []string{"405009"},
				}},
			},
			wantCode: codes.OK,
		},
		{
			name: "Leave unprocessed",

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,
			params:            url.Values{"leaveunprocessed": []string{"true"}},

			want: &converters.ChangedPatients{
				Patients: []converters.ChangedPatient{{
					PatientID:          proto.String("405010"),
					PreviousPatientIDs: []string{"405009"},
				}},
			},
			wantParams: url.Values{"leaveunprocessed": []string{"true"}},
			wantCode:   codes.OK,
		},
		{
			name: "Multiple patients",

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaMultiplePatientsRawResponse,

			want: &converters.ChangedPatients{
				Patients: []converters.ChangedPatient{
					{
						PatientID:          proto.String("405010"),
						PreviousPatientIDs: []string{"405009"},
					},
					{
						PatientID: proto.String("123"),
					},
				},
			},
			wantCode: codes.OK,
		},
		{
			name: "Athena API returns an error",

			athenaHTTPStatus:  http.StatusUnauthorized,
			athenaRawResponse: errorRawAthenaResponse,

			want:     nil,
			wantCode: codes.Unauthenticated,
		},
		{
			name:              "Response in wrong shape",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: badMalformedAthenaRawResponse,

			want:     nil,
			wantCode: codes.Internal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					if tt.wantParams != nil {
						for key, value := range tt.wantParams {
							testutils.MustMatch(t, value[0], req.URL.Query().Get(key))
						}
					}
					rw.WriteHeader(tt.athenaHTTPStatus)
					rw.Write(tt.athenaRawResponse)
				},
			))
			defer athenaServer.Close()

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			got, err := sc.ListChangedPatients(context.Background(), tt.params)
			s := status.Convert(err)
			testutils.MustMatch(t, tt.wantCode, s.Code())
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientUpdatePatientDiscussionNotes(t *testing.T) {
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *string
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`{"discussionnotes": "test"}`),
			want:              proto.String("test"),
			wantGRPCCode:      codes.OK,
		},
		{
			name: "failure - athena server is unavailable",

			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure - data not found",

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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			got, err := c.UpdatePatientDiscussionNotes(context.Background(), "encounterid", "notes", false)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientListPatientLabResults(t *testing.T) {
	results := converters.LabResults{
		LabResults: []converters.LabResult{{
			Priority:             proto.String("2"),
			Date:                 proto.String("08/30/2018"),
			ResultStatus:         proto.String("final"),
			IsReviewedByProvider: "1",
			ID:                   proto.String("356609"),
			PerformingLabName:    proto.String("Quest Diagnostics - Oklahoma City"),
			Description:          proto.String("TSH, serum or plasma"),
			AttachmentExists:     "false",
			LoInc:                proto.String("3016-3"),
		}},
	}
	athenaRawResponse, err := json.Marshal(results)
	if err != nil {
		t.Fatal("Could not marshal lab results")
	}
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         []*athenapb.LabResult
		wantGRPCCode codes.Code
	}{
		{
			name:              "success - base case",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: athenaRawResponse,

			want: []*athenapb.LabResult{
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
					Analytes:             []*athenapb.Analyte{},
					Description:          proto.String("TSH, serum or plasma"),
					AttachmentExists:     proto.Bool(false),
					Loinc:                proto.String("3016-3"),
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name:              "failure - athena server is unavailable",
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - unable to convert athena response",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`wrong response json`),

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - data for requested patientID and departmentID pair not found",
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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			got, err := c.ListPatientLabResults(context.Background(), "1", "2", "3")
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientListRecipientClasses(t *testing.T) {
	recipientClassesResponse := &converters.GetRecipientClassesResponse{
		RecipientClasses: []converters.RecipientClass{
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
	goodAthenaRawResponse, err := json.Marshal(recipientClassesResponse)
	if err != nil {
		t.Fatal("Could not marshal recipient classes")
	}

	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *converters.GetRecipientClassesResponse
		wantGRPCCode codes.Code
	}{
		{
			name:              "success - base case",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: recipientClassesResponse,
		},
		{
			name:              "failure - athena server is unavailable",
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - unable to convert athena response",
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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			got, err := c.ListRecipientClasses(context.Background(), proto.Int32(0), proto.Int32(0))
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientMakePatientPayment(t *testing.T) {
	var goodAthenaRawResponse = []byte("[{\"epaymentid\":\"12345\",\"success\":\"true\"}]")
	var badAthenaRawResponse = []byte("[{\"errortext\":\"EXPIRED CARD\",\"success\":\"false\"}]")
	paymentInfo := converters.PatientPaymentInformation{}

	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         []*converters.PatientPaymentResponse
		wantGRPCCode codes.Code
	}{
		{
			name:              "success - base case",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: []*converters.PatientPaymentResponse{
				{
					PaymentID: proto.String("12345"),
					Success:   proto.String("true"),
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name:              "failure - athena server is unavailable",
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - unable to convert athena response",
			athenaHTTPStatus:  http.StatusInternalServerError,
			athenaRawResponse: []byte(`wrong response json`),

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - expired card response",
			athenaHTTPStatus:  http.StatusBadRequest,
			athenaRawResponse: badAthenaRawResponse,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			got, err := c.MakePatientPayment(context.Background(), "", &paymentInfo)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientUploadPatientCreditCardDetails(t *testing.T) {
	var goodAthenaRawResponse = []byte("[{\"epaymentid\":\"12345\",\"success\":\"true\"}]")
	var badAthenaRawResponse = []byte("[{\"errortext\":\"EXPIRED CARD\",\"success\":\"false\"}]")
	paymentInfo := converters.AthenaCreditCardInformation{}

	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         []*converters.UploadPatientCreditCardResponse
		wantGRPCCode codes.Code
	}{
		{
			name:              "success - base case",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: []*converters.UploadPatientCreditCardResponse{
				{
					PaymentID: proto.String("12345"),
					Success:   proto.String("true"),
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			name:              "failure - athena server is unavailable",
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - unable to convert athena response",
			athenaHTTPStatus:  http.StatusInternalServerError,
			athenaRawResponse: []byte(`wrong response json`),

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - expired card response",
			athenaHTTPStatus:  http.StatusBadRequest,
			athenaRawResponse: badAthenaRawResponse,

			want:         nil,
			wantGRPCCode: codes.InvalidArgument,
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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			got, err := c.UploadPatientCreditCardDetails(context.Background(), "", &paymentInfo)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientGetPatientCreditCardDetails(t *testing.T) {
	storedCreditCardResponse := &converters.GetStoredCreditCardResponse{
		Status:                   "success",
		CardType:                 "Visa",
		BillingZip:               "44017",
		BillingCity:              "Berea",
		BillingState:             "Ohio",
		StoredCardID:             "1",
		PreferredCard:            "1",
		BillingAddress:           "2327 Cottman Ave",
		CardExpirationMonthYear:  "2027/12",
		CardNumberLastFourDigits: "4444",
	}
	goodAthenaRawResponse, err := json.Marshal([]*converters.GetStoredCreditCardResponse{storedCreditCardResponse})
	if err != nil {
		t.Fatalf("could not marshal get credit card details response: %v", err)
	}

	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         []*converters.GetStoredCreditCardResponse
		wantGRPCCode codes.Code
	}{
		{
			name:              "success - base case",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: []*converters.GetStoredCreditCardResponse{
				storedCreditCardResponse,
			},
			wantGRPCCode: codes.OK,
		},
		{
			name:              "failure - athena server is unavailable",
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - unable to convert athena response",
			athenaHTTPStatus:  http.StatusInternalServerError,
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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			got, err := c.GetPatientCreditCardDetails(context.Background(), "1", "2")
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.want, got)
			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
		})
	}
}

func TestClientDeleteStoredCreditCard(t *testing.T) {
	goodAthenaRawResponse := []byte(`{"success": "true"}`)
	goodAthenaUnsuccessfulRawResponse := []byte(`{"success": "false"}`)
	athenaRawTokenErrorResponse := []byte(`{"error": "Invalid Access Token.","detailedmessage": "The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header."}`)
	athenaRawNotFoundResponse := []byte(`{"error":"The Patient ID or Department ID is invalid."}`)
	athenaRawBadRequestResponse := []byte(`{"error":"Invalid credit card ID"}`)

	type args struct {
		patientID    string
		departmentID string
		storedCardID string
	}
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int
		args              args

		wantResp     *converters.DeleteStoredCardResponse
		wantErr      error
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",
			args: args{
				patientID:    "228",
				departmentID: "2",
				storedCardID: "10812312",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			wantErr: nil,
			wantResp: &converters.DeleteStoredCardResponse{
				Success: proto.String("true"),
			},
			wantGRPCCode: codes.OK,
		},
		{
			name: "failure - base case",
			args: args{
				patientID:    "228",
				departmentID: "2",
				storedCardID: "10812312",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaUnsuccessfulRawResponse,

			wantErr: nil,
			wantResp: &converters.DeleteStoredCardResponse{
				Success: proto.String("false"),
			},
			wantGRPCCode: codes.OK,
		},
		{
			name: "failure - Athena API returns an error",
			args: args{
				patientID: "29",
			},
			athenaHTTPStatus:  http.StatusInternalServerError,
			athenaRawResponse: athenaRawTokenErrorResponse,

			wantErr:      status.Errorf(codes.Internal, "HTTP request had error response 500: {\"error\": \"Invalid Access Token.\",\"detailedmessage\": \"The access token provided is not valid. Please verify the token is correct and provided as a bearer token in the authorization header.\"}"),
			wantResp:     nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure - Athena API returns bad request",
			args: args{
				patientID:    "29",
				storedCardID: "123",
			},
			athenaHTTPStatus:  http.StatusBadRequest,
			athenaRawResponse: athenaRawBadRequestResponse,

			wantErr:      status.Errorf(codes.InvalidArgument, "HTTP request had error response 400: {\"error\":\"Invalid credit card ID\"}"),
			wantResp:     nil,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			name: "failure - Athena API returns not found",
			args: args{
				patientID: "29",
			},
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: athenaRawNotFoundResponse,

			wantErr:      status.Errorf(codes.NotFound, "HTTP request had error response 404: {\"error\":\"The Patient ID or Department ID is invalid.\"}"),
			wantResp:     nil,
			wantGRPCCode: codes.NotFound,
		},
		{
			name: "failure - Athena API returns not acceptable",
			args: args{
				patientID:    "invalid patient id",
				departmentID: "invalid department id",
				storedCardID: "invalid stored card",
			},
			athenaHTTPStatus:  http.StatusNotAcceptable,
			athenaRawResponse: athenaRawBadRequestResponse,

			wantErr:      status.Errorf(codes.Internal, "failed to delete patient credit card from AthenaAPI. err: rpc error: code = Unknown desc = HTTP request had error response 406: {\"error\":\"Invalid credit card ID\"}"),
			wantResp:     nil,
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			resp, err := sc.DeleteStoredCreditCard(context.Background(), tt.args.patientID, tt.args.departmentID, tt.args.storedCardID)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tt.wantErr, err)
			testutils.MustMatch(t, tt.wantResp, resp)
			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code())
		})
	}
}

var goodAthenaAPISearchPatients = []converters.SearchPatientResult{
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
	},
	{
		FirstName:           proto.String("ABEL"),
		CurrentDepartmentID: proto.String("2"),
		MiddleInitial:       proto.String("PURDY"),
		LastName:            proto.String("SMITH"),
		State:               proto.String("CO"),
		City:                proto.String("DENVER"),
		CountryID:           proto.String("1"),
		HomePhone:           proto.String("(303) 987-6543"),
		PatientID:           proto.String("402472"),
		Sex:                 proto.String("M"),
		DOB:                 proto.String("08/16/1998"),
		Zip:                 proto.String("80218-5215"),
		CurrentDepartment:   proto.String("DEN - HOME"),
		Address1:            proto.String("1052 N DOWNING ST"),
	},
	{
		FirstName:           proto.String("ALIYAH"),
		CurrentDepartmentID: proto.String("2"),
		MiddleInitial:       proto.String("MIDDLE"),
		LastName:            proto.String("SMITH"),
		State:               proto.String("CO"),
		City:                proto.String("DENVER"),
		CountryID:           proto.String("1"),
		HomePhone:           proto.String("(303) 500-1518"),
		PatientID:           proto.String("424981"),
		Sex:                 proto.String("F"),
		DOB:                 proto.String("08/23/1992"),
		Zip:                 proto.String("80205-3339"),
		CurrentDepartment:   proto.String("DEN - HOME"),
		Address1:            proto.String("3827 N LAFAYETTE ST"),
	},
}

func TestClientSearchPatients(t *testing.T) {
	mockSearchPatientResponse := converters.SearchPatientResponse{SearchPatientResults: goodAthenaAPISearchPatients}
	goodAthenaRawResponse, _ := json.Marshal(mockSearchPatientResponse)

	type args struct {
		searchTerm string
	}
	type wantError struct {
		code    codes.Code
		message string
	}
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int
		args              args

		want    []*athenapb.SearchPatientsResult
		wantErr *wantError
	}{
		{
			name: "success - base case",
			args: args{
				searchTerm: "smith",
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: []*athenapb.SearchPatientsResult{
				{
					Patient: &athenapb.Patient{
						PatientId: proto.String("401429"),
						Name: &commonpb.Name{
							GivenName:           proto.String("ABDUL"),
							FamilyName:          proto.String("SMITH"),
							MiddleNameOrInitial: proto.String("EFFERTZ"),
						},
						DateOfBirth: &commonpb.Date{Year: 1937, Month: 9, Day: 25},
						Sex:         proto.String("M"),
						ContactInfo: &athenapb.ContactInfo{
							Address: &commonpb.Address{
								AddressLineOne: proto.String("1235 E EVANS AVE"),
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
				{
					Patient: &athenapb.Patient{
						PatientId: proto.String("402472"),
						Name: &commonpb.Name{
							GivenName:           proto.String("ABEL"),
							FamilyName:          proto.String("SMITH"),
							MiddleNameOrInitial: proto.String("PURDY"),
						},
						DateOfBirth: &commonpb.Date{Year: 1998, Month: 8, Day: 16},
						Sex:         proto.String("M"),
						ContactInfo: &athenapb.ContactInfo{
							Address: &commonpb.Address{
								AddressLineOne: proto.String("1052 N DOWNING ST"),
								City:           proto.String("DENVER"),
								State:          proto.String("CO"),
								ZipCode:        proto.String("80218-5215"),
							},
							HomeNumber: &commonpb.PhoneNumber{
								CountryCode:     proto.Int32(1),
								PhoneNumber:     proto.String("(303) 987-6543"),
								PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
							},
						},
						DepartmentId: proto.String("2"),
					},
				},
				{
					Patient: &athenapb.Patient{
						PatientId: proto.String("424981"),
						Name: &commonpb.Name{
							GivenName:           proto.String("ALIYAH"),
							FamilyName:          proto.String("SMITH"),
							MiddleNameOrInitial: proto.String("MIDDLE"),
						},
						DateOfBirth: &commonpb.Date{Year: 1992, Month: 8, Day: 23},
						Sex:         proto.String("F"),
						ContactInfo: &athenapb.ContactInfo{
							Address: &commonpb.Address{
								AddressLineOne: proto.String("3827 N LAFAYETTE ST"),
								City:           proto.String("DENVER"),
								State:          proto.String("CO"),
								ZipCode:        proto.String("80205-3339"),
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
			wantErr: nil,
		},
		{
			name:              "failure - athena server is unavailable",
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want: nil,
			wantErr: &wantError{
				code:    codes.Internal,
				message: "Failed to query patients from AthenaAPI. err: rpc error: code = Unknown desc = HTTP request had error response 503: ",
			},
		},
		{
			name:             "failure - unable to convert athena response",
			athenaHTTPStatus: http.StatusOK,
			athenaRawResponse: []byte(`[
				{
					"firstname": "ABDUL",
					"currentdepartmentid": "2",
					"middleinitial": "EFFERTZ",
					"lastname": "SMITH",
				},
			]`),

			want: nil,
			wantErr: &wantError{
				code:    codes.Internal,
				message: "Failed to query patients from AthenaAPI. err: rpc error: code = Internal desc = Failed to unmarshal json into given struct: invalid character '}' looking for beginning of object key string",
			},
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			got, err := sc.SearchPatients(context.Background(), tt.args.searchTerm)
			if err != nil {
				if tt.wantErr == nil {
					t.Errorf("SearchPatients() error = %v, wantErr %v", err, tt.wantErr)
					return
				}
				e, _ := status.FromError(err)
				testutils.MustMatch(t, tt.wantErr.code, e.Code())
				testutils.MustMatch(t, tt.wantErr.message, e.Message())
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientGetPatientLabResultDocument(t *testing.T) {
	responseBody := []converters.LabResultDocument{
		{
			DepartmentID:        proto.String("2"),
			DocumentRoute:       proto.String("Fax"),
			DocumentSource:      proto.String("INTERFACE"),
			DocumentTypeID:      proto.String("3"),
			EncounterDate:       nil,
			EncounterID:         proto.String("4"),
			FacilityID:          proto.String("5"),
			IsConfidential:      proto.String("false"),
			ID:                  proto.String("6"),
			Loinc:               proto.String("7"),
			ObservationDateTime: nil,
			Observations: []converters.Analyte{
				{
					ObservationIdentifier: proto.String("55080400"),
					ResultStatus:          proto.String("final"),
					Name:                  proto.String("TSH"),
					Value:                 proto.String("tnp"),
					Description:           proto.String("Description"),
					LoInc:                 proto.String("31234"),
					Note:                  proto.String("note"),
					ID:                    proto.String("1234"),
				},
			},
			ProviderID: proto.String("8"),
			OrderID:    proto.String("9"),
		},
	}
	athenaRawResponse, err := json.Marshal(responseBody)
	if err != nil {
		t.Fatal("Could not marshal lab results")
	}
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         []*athenapb.LabResultDocument
		wantGRPCCode codes.Code
	}{
		{
			name:              "success - base case",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: athenaRawResponse,

			want: []*athenapb.LabResultDocument{
				{
					DepartmentId:        proto.String("2"),
					DocumentRoute:       proto.String("Fax"),
					DocumentSource:      proto.String("INTERFACE"),
					DocumentTypeId:      proto.String("3"),
					EncounterDate:       nil,
					EncounterId:         proto.String("4"),
					FacilityId:          proto.String("5"),
					IsConfidential:      proto.Bool(false),
					Id:                  proto.String("6"),
					Loinc:               proto.String("7"),
					ObservationDateTime: nil,
					Observations: []*athenapb.Analyte{
						{
							ObservationIdentifier: proto.String("55080400"),
							ResultStatus:          proto.String("final"),
							Name:                  proto.String("TSH"),
							Value:                 proto.String("tnp"),
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
			wantGRPCCode: codes.OK,
		},
		{
			name:              "failure - athena server is unavailable",
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - unable to convert athena response",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`[{"isconfidential": true, "observations": [], "observationdatetime": "02-20-2023 01:02:03"}]`),

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name:              "failure - data for requested patientID and labResultID pair not found",
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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			got, err := c.GetPatientLabResultDocument(context.Background(), "1", "2")
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGetPatientInsuranceBenefitDetails(t *testing.T) {
	goodAthenaResponse := converters.PatientInsuranceBenefitDetails{
		EligibilityData: proto.String("text"),
		DateOfService:   proto.String("05/26/2023"),
		LastCheckDate:   proto.String("05/26/2023"),
	}
	goodAthenaRawResponse, err := json.Marshal(goodAthenaResponse)
	if err != nil {
		t.Fatalf("Could not marshal athena response: %s", err)
	}

	badMalformedAthenaRawResponse := []byte(`[{"patientid": 123]`)
	errorAthenaResponse := map[string]string{
		"error":           "Athena Error",
		"detailedmessage": "Error Text",
	}
	errorRawAthenaResponse, _ := json.Marshal(errorAthenaResponse)

	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int
		patientID         string
		insuranceID       string
		serviceTypeCode   string
		dateOfService     *commonpb.Date

		want     *athenapb.InsuranceBenefitDetails
		wantCode codes.Code
	}{
		{
			name:            "Base Case",
			patientID:       "1",
			insuranceID:     "2",
			serviceTypeCode: "3",
			dateOfService: &commonpb.Date{
				Year:  2023,
				Month: 5,
				Day:   26,
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: &athenapb.InsuranceBenefitDetails{
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
			},
			wantCode: codes.OK,
		},
		{
			name:              "success without optional fields",
			patientID:         "1",
			insuranceID:       "2",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: &athenapb.InsuranceBenefitDetails{
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
			},
			wantCode: codes.OK,
		},
		{
			name: "Athena API returns an error",

			athenaHTTPStatus:  http.StatusUnauthorized,
			athenaRawResponse: errorRawAthenaResponse,

			wantCode: codes.Internal,
		},
		{
			name:            "Failed to build response",
			patientID:       "1",
			insuranceID:     "2",
			serviceTypeCode: "3",
			dateOfService: &commonpb.Date{
				Year:  2023,
				Month: 5,
				Day:   26,
			},
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`{"ansi271": "text", "dateofservice": "invalid", "lastcheckdate": "05/26/2023"}`),

			wantCode: codes.Internal,
		},
		{
			name:              "Response in wrong shape",
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: badMalformedAthenaRawResponse,

			wantCode: codes.Internal,
		},
		{
			name:             "Athena returns NotFound",
			athenaHTTPStatus: http.StatusNotFound,

			wantCode: codes.NotFound,
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

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			got, err := sc.GetPatientInsuranceBenefitDetails(context.Background(), tt.patientID, tt.insuranceID, tt.serviceTypeCode, tt.dateOfService)
			s := status.Convert(err)
			testutils.MustMatch(t, tt.wantCode, s.Code())
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestTriggerPatientInsuranceEligibilityCheck(t *testing.T) {
	tests := []struct {
		name             string
		patientID        string
		insuranceID      string
		serviceTypeCode  string
		dateOfService    *commonpb.Date
		athenaHTTPStatus int

		wantCode codes.Code
	}{
		{
			name:            "success - base case",
			patientID:       "1",
			insuranceID:     "2",
			serviceTypeCode: "3",
			dateOfService: &commonpb.Date{
				Year:  2023,
				Month: 5,
				Day:   26,
			},
			athenaHTTPStatus: http.StatusOK,

			wantCode: codes.OK,
		},
		{
			name:             "success without optional fields",
			patientID:        "1",
			insuranceID:      "2",
			athenaHTTPStatus: http.StatusOK,

			wantCode: codes.OK,
		},
		{
			name:             "Athena API returns an error",
			patientID:        "1",
			insuranceID:      "2",
			athenaHTTPStatus: http.StatusUnauthorized,

			wantCode: codes.Internal,
		},
	}

	for _, tc := range tests {
		t.Run(tc.name, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.athenaHTTPStatus)
				},
			))
			defer athenaServer.Close()

			sc := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}

			err := sc.TriggerPatientInsuranceEligibilityCheck(context.Background(), tc.patientID, tc.insuranceID, tc.serviceTypeCode, tc.dateOfService)
			s := status.Convert(err)
			testutils.MustMatch(t, tc.wantCode, s.Code())
		})
	}
}

func TestClientGetPatientGoals(t *testing.T) {
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *string
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`{"discussionnotes": "test"}`),
			want:              proto.String("test"),
			wantGRPCCode:      codes.OK,
		},
		{
			name: "failure - athena server is unavailable",

			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure - data not found",

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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			got, err := c.GetPatientGoals(context.Background(), "encounterid")
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClientGetPatientOrder(t *testing.T) {
	tests := []struct {
		name              string
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapb.PatientOrder
		wantGRPCCode codes.Code
	}{
		{
			name: "success - base case",

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`[{"orderid": "1", "encounterid": "2"}]`),
			want: &athenapb.PatientOrder{
				OrderId:     proto.String("1"),
				EncounterId: proto.String("2"),
			},
			wantGRPCCode: codes.OK,
		},
		{
			name: "failure - athena server is unavailable",

			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.Internal,
		},
		{
			name: "failure - data not found",

			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantGRPCCode: codes.NotFound,
		},
		{
			name: "failure - empty list",

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`[]`),
			want:              nil,
			wantGRPCCode:      codes.Internal,
		},
		{
			name: "failure - multiple orders",

			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte(`[{"orderid": "1", "encounterid": "2"},{"orderid": "2", "encounterid": "2"}}]`),
			want:              nil,
			wantGRPCCode:      codes.Internal,
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
			c := &Client{
				AuthToken:     mockAuthValuer{},
				AthenaBaseURL: athenaServer.URL,
				HTTPClient:    athenaServer.Client(),
			}
			got, err := c.GetPatientOrder(context.Background(), "patientid", "orderid")
			respStatus := status.Convert(err)

			testutils.MustMatch(t, tt.wantGRPCCode, respStatus.Code(), "response code does not match")
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

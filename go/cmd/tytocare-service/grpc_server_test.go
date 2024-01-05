package main

import (
	"context"
	"encoding/json"
	"net"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	tytocarepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/tytocare"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/peer"
	"google.golang.org/grpc/status"
)

type TytoCareResponse struct {
}

var (
	mockClinicianURL = "test-clinician-url"
	mockedAndroidURL = "test-url-android"
	mockedIOSURL     = "test-url-ios"
)

func setup(tytocareURL string, httpClient *http.Client) (*GRPCServer, context.Context) {
	return &GRPCServer{
		TytoCareBaseURL: tytocareURL,
		TytoCareAuthToken: auth.FixedToken{
			TokenType:   "fake-tytocare-token-type",
			AccessToken: "fake-tytocare-access-token",
		},
		Client: httpClient,
		Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
	}, context.Background()
}

func TestLogAndReturnError(t *testing.T) {
	tcs := []struct {
		Desc         string
		InputCode    codes.Code
		InputMessage string
		WantCode     codes.Code
		WantMessage  string
	}{
		{
			Desc:         "should receive error with input code and message",
			InputCode:    codes.Aborted,
			InputMessage: "Abort operation",

			WantCode:    codes.Aborted,
			WantMessage: "Abort operation",
		},
		{
			Desc:         "should receive error with input code and default message",
			InputCode:    codes.Aborted,
			InputMessage: "",

			WantCode:    codes.Aborted,
			WantMessage: "something went wrong!",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			tytocareServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				res := []byte{0}
				rw.Write(res)
			}))
			defer tytocareServer.Close()

			s, _ := setup(tytocareServer.URL, tytocareServer.Client())

			err := s.logAndReturnError(tc.InputCode, tc.InputMessage)

			respStatus, _ := status.FromError(err)

			if respStatus.Code() != tc.WantCode {
				t.Fatal("Unexpected error code")
			}
			if respStatus.Message() != tc.WantMessage {
				t.Fatal("Unexpected error message")
			}
		})
	}
}

func TestCreatePatient(t *testing.T) {
	id := "1"
	firstName := "John"
	lastName := "Doe"
	dateOfBirth := common.Date{Year: 1939, Month: 2, Day: 1}
	sex := common.Sex_SEX_MALE
	tcs := []struct {
		Desc               string
		PatientRequest     *tytocarepb.CreatePatientRequest
		TytoCareResponse   TytoCareResponse
		TytoCareHTTPStatus int
		WantGRPCCode       codes.Code
	}{
		{
			Desc: "success - patient created successfully",
			PatientRequest: &tytocarepb.CreatePatientRequest{
				Id:          id,
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: &dateOfBirth,
				Sex:         sex,
			},
			TytoCareHTTPStatus: http.StatusOK,
			TytoCareResponse:   TytoCareResponse{},

			WantGRPCCode: codes.OK,
		},
		{
			Desc: "error - wrong patient payload",
			PatientRequest: &tytocarepb.CreatePatientRequest{
				Id:          id,
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: &dateOfBirth,
				Sex:         common.Sex_SEX_UNSPECIFIED,
			},
			TytoCareHTTPStatus: http.StatusOK,
			TytoCareResponse:   TytoCareResponse{},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "error - request execution returns error",
			PatientRequest: &tytocarepb.CreatePatientRequest{
				Id:          id,
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: &dateOfBirth,
				Sex:         sex,
			},
			TytoCareHTTPStatus: http.StatusInternalServerError,
			TytoCareResponse:   TytoCareResponse{},

			WantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			tytocareServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				res, err := json.Marshal(tc.TytoCareResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.WriteHeader(tc.TytoCareHTTPStatus)
				rw.Write(res)
			}))
			defer tytocareServer.Close()

			s, ctx := setup(tytocareServer.URL, tytocareServer.Client())

			_, err := s.CreatePatient(ctx, tc.PatientRequest)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			if respStatus.Code() != tc.WantGRPCCode {
				t.Fatalf("response status: %s \n got %s want %s", respStatus, respStatus.Code(), tc.WantGRPCCode)
			}
		})
	}
}

func TestCreateVisit(t *testing.T) {
	visitID := "1"
	patientID := "2"
	dhmtID := "3"
	virtualAPPID := "4"
	mockTytoIdentifier := "5"
	virtualAPPRemoteAddress := "10.12.13.14"
	tcs := []struct {
		Desc                    string
		VisitRequest            *tytocarepb.CreateVisitRequest
		TytoCreateVisitResponse TytoCareCreateVisitResponse
		TytoCareHTTPStatus      int
		WantGRPCCode            codes.Code
	}{
		{
			Desc: "success - visit created successfully",
			VisitRequest: &tytocarepb.CreateVisitRequest{
				VisitId:                 visitID,
				PatientId:               patientID,
				DhmtId:                  dhmtID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},
			TytoCareHTTPStatus: http.StatusCreated,
			TytoCreateVisitResponse: TytoCareCreateVisitResponse{
				TytoIdentifier: &mockTytoIdentifier,
			},

			WantGRPCCode: codes.OK,
		},
		{
			Desc: "error - visit response convert into proto error",
			VisitRequest: &tytocarepb.CreateVisitRequest{
				VisitId:                 visitID,
				PatientId:               patientID,
				DhmtId:                  dhmtID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},
			TytoCareHTTPStatus: http.StatusCreated,
			TytoCreateVisitResponse: TytoCareCreateVisitResponse{
				TytoIdentifier: nil,
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "error - invalid visit request payload",
			VisitRequest: &tytocarepb.CreateVisitRequest{
				VisitId:                 "",
				PatientId:               patientID,
				DhmtId:                  dhmtID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},
			TytoCareHTTPStatus: http.StatusOK,
			TytoCreateVisitResponse: TytoCareCreateVisitResponse{
				TytoIdentifier: &mockTytoIdentifier,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "error - request execution returns error",
			VisitRequest: &tytocarepb.CreateVisitRequest{
				VisitId:                 visitID,
				PatientId:               patientID,
				DhmtId:                  dhmtID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},
			TytoCareHTTPStatus: http.StatusInternalServerError,
			TytoCreateVisitResponse: TytoCareCreateVisitResponse{
				TytoIdentifier: &mockTytoIdentifier,
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "error - TytoCare returns 409 status",
			VisitRequest: &tytocarepb.CreateVisitRequest{
				VisitId:                 visitID,
				PatientId:               patientID,
				DhmtId:                  dhmtID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},
			TytoCareHTTPStatus: http.StatusConflict,
			TytoCreateVisitResponse: TytoCareCreateVisitResponse{
				TytoIdentifier: &mockTytoIdentifier,
			},

			WantGRPCCode: codes.AlreadyExists,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			tytocareServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				res, err := json.Marshal(tc.TytoCreateVisitResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.WriteHeader(tc.TytoCareHTTPStatus)
				rw.Write(res)
			}))
			defer tytocareServer.Close()

			s, ctx := setup(tytocareServer.URL, tytocareServer.Client())

			_, err := s.CreateVisit(ctx, tc.VisitRequest)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			if respStatus.Code() != tc.WantGRPCCode {
				t.Fatalf("response status: %s \n got %s want %s", respStatus, respStatus.Code(), tc.WantGRPCCode)
			}
		})
	}
}

func TestActivateVisit(t *testing.T) {
	visitID := "1"
	virtualAPPID := "4"
	mockTytoIdentifier := "5"
	virtualAPPRemoteAddress := "10.12.13.14"
	invalidVirtualAPPRemoteAddress := "a.b.c"
	peerWithPort := &peer.Peer{
		Addr: &net.TCPAddr{
			IP:   net.IPv4(1, 2, 3, 4),
			Port: 80,
		},
	}
	peerWithoutPort := &peer.Peer{
		Addr: &net.IPAddr{
			IP: net.IPv4(1, 2, 3, 4),
		},
	}
	peerWithInvalidIP := &peer.Peer{
		Addr: &net.IPAddr{},
	}
	tcs := []struct {
		Desc                    string
		Peer                    *peer.Peer
		VisitRequest            *tytocarepb.ActivateVisitRequest
		TytoCreateVisitResponse TytoCareActivateVisitResponse
		TytoCareHTTPStatus      int
		WantGRPCCode            codes.Code
	}{
		{
			Desc: "success - visit activated successfully",
			VisitRequest: &tytocarepb.ActivateVisitRequest{
				VisitId:                 visitID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},
			TytoCareHTTPStatus: http.StatusOK,
			TytoCreateVisitResponse: TytoCareActivateVisitResponse{
				TytoIdentifier: &mockTytoIdentifier,
				ClinicianURL:   &mockClinicianURL,
			},

			WantGRPCCode: codes.OK,
		},
		{
			Desc: "success - nil VirtualAppRemoteAddress with valid peer with port",
			VisitRequest: &tytocarepb.ActivateVisitRequest{
				VisitId:                 visitID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: "",
			},
			Peer:               peerWithPort,
			TytoCareHTTPStatus: http.StatusOK,
			TytoCreateVisitResponse: TytoCareActivateVisitResponse{
				TytoIdentifier: &mockTytoIdentifier,
				ClinicianURL:   &mockClinicianURL,
			},

			WantGRPCCode: codes.OK,
		},
		{
			Desc: "success - nil VirtualAppRemoteAddress with valid peer without port",
			VisitRequest: &tytocarepb.ActivateVisitRequest{
				VisitId:                 visitID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: "",
			},
			Peer:               peerWithoutPort,
			TytoCareHTTPStatus: http.StatusOK,
			TytoCreateVisitResponse: TytoCareActivateVisitResponse{
				TytoIdentifier: &mockTytoIdentifier,
				ClinicianURL:   &mockClinicianURL,
			},

			WantGRPCCode: codes.OK,
		},
		{
			Desc: "error - invalid VirtualAppRemoteAddress",
			VisitRequest: &tytocarepb.ActivateVisitRequest{
				VisitId:                 visitID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: invalidVirtualAPPRemoteAddress,
			},
			TytoCareHTTPStatus: http.StatusOK,
			TytoCreateVisitResponse: TytoCareActivateVisitResponse{
				TytoIdentifier: &mockTytoIdentifier,
				ClinicianURL:   &mockClinicianURL,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "error - nil VirtualAppRemoteAddress without peer",
			VisitRequest: &tytocarepb.ActivateVisitRequest{
				VisitId:                 visitID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: "",
			},
			TytoCareHTTPStatus: http.StatusOK,
			TytoCreateVisitResponse: TytoCareActivateVisitResponse{
				TytoIdentifier: &mockTytoIdentifier,
				ClinicianURL:   &mockClinicianURL,
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "error - nil VirtualAppRemoteAddress with peer with invalid IP",
			VisitRequest: &tytocarepb.ActivateVisitRequest{
				VisitId:                 visitID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: "",
			},
			Peer:               peerWithInvalidIP,
			TytoCareHTTPStatus: http.StatusOK,
			TytoCreateVisitResponse: TytoCareActivateVisitResponse{
				TytoIdentifier: &mockTytoIdentifier,
				ClinicianURL:   &mockClinicianURL,
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "error - invalid request payload, missing required CareRequestId",
			VisitRequest: &tytocarepb.ActivateVisitRequest{
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},
			TytoCareHTTPStatus:      http.StatusOK,
			TytoCreateVisitResponse: TytoCareActivateVisitResponse{},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "error - visit response convert into proto error",
			VisitRequest: &tytocarepb.ActivateVisitRequest{
				VisitId:                 visitID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},
			TytoCareHTTPStatus: http.StatusOK,
			TytoCreateVisitResponse: TytoCareActivateVisitResponse{
				TytoIdentifier: nil,
				ClinicianURL:   &mockClinicianURL,
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "error - request execution returns error",
			VisitRequest: &tytocarepb.ActivateVisitRequest{
				VisitId:                 visitID,
				VirtualAppId:            virtualAPPID,
				VirtualAppRemoteAddress: virtualAPPRemoteAddress,
			},
			TytoCareHTTPStatus: http.StatusInternalServerError,
			TytoCreateVisitResponse: TytoCareActivateVisitResponse{
				TytoIdentifier: &mockTytoIdentifier,
				ClinicianURL:   &mockClinicianURL,
			},

			WantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			tytocareServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				res, err := json.Marshal(tc.TytoCreateVisitResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.WriteHeader(tc.TytoCareHTTPStatus)
				rw.Write(res)
			}))
			defer tytocareServer.Close()

			s, ctx := setup(tytocareServer.URL, tytocareServer.Client())

			if tc.Peer != nil {
				ctx = peer.NewContext(ctx, tc.Peer)
			}

			_, err := s.ActivateVisit(ctx, tc.VisitRequest)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			if respStatus.Code() != tc.WantGRPCCode {
				t.Fatalf("response status: %s \n got %s want %s", respStatus, respStatus.Code(), tc.WantGRPCCode)
			}
		})
	}
}

func TestAssignClinicianToVisit(t *testing.T) {
	visitID := "1"
	virtualAPPID := "4"
	unexistingVirtualAPPID := "-1"
	tcs := []struct {
		Desc               string
		VisitRequest       *tytocarepb.AssignClinicianToVisitRequest
		TytoCareResponse   TytoCareResponse
		TytoCareHTTPStatus int
		WantGRPCCode       codes.Code
	}{
		{
			Desc: "success - visit updated successfully",
			VisitRequest: &tytocarepb.AssignClinicianToVisitRequest{
				VisitId:      visitID,
				VirtualAppId: virtualAPPID,
			},
			TytoCareHTTPStatus: http.StatusOK,

			WantGRPCCode: codes.OK,
		},
		{
			Desc: "error - invalid request payload, missing required VirtualAppId",
			VisitRequest: &tytocarepb.AssignClinicianToVisitRequest{
				VisitId: visitID,
			},
			TytoCareHTTPStatus: http.StatusOK,

			WantGRPCCode: codes.InvalidArgument,
		},
		{
			Desc: "error - clinician is busy in another visit",
			VisitRequest: &tytocarepb.AssignClinicianToVisitRequest{
				VisitId:      visitID,
				VirtualAppId: virtualAPPID,
			},
			TytoCareHTTPStatus: http.StatusConflict,

			WantGRPCCode: codes.AlreadyExists,
		},
		{
			Desc: "error - invalid virtual APP id",
			VisitRequest: &tytocarepb.AssignClinicianToVisitRequest{
				VisitId:      visitID,
				VirtualAppId: unexistingVirtualAPPID,
			},
			TytoCareHTTPStatus: http.StatusNotFound,

			WantGRPCCode: codes.NotFound,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			tytocareServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				res, err := json.Marshal(tc.TytoCareResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.WriteHeader(tc.TytoCareHTTPStatus)
				rw.Write(res)
			}))
			defer tytocareServer.Close()

			s, ctx := setup(tytocareServer.URL, tytocareServer.Client())

			_, err := s.AssignClinicianToVisit(ctx, tc.VisitRequest)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			if respStatus.Code() != tc.WantGRPCCode {
				t.Fatalf("response status: %s \n got %s want %s", respStatus, respStatus.Code(), tc.WantGRPCCode)
			}
		})
	}
}

func TestCommonErrors(t *testing.T) {
	allowedResponseCodes := []int{http.StatusCreated}
	tcs := []struct {
		Desc                        string
		PatientID                   string
		TytoCareHTTPStatus          int
		RawJSONResponse             []byte
		TytoCareServerIsUnavailable bool

		WantGRPCCode codes.Code
	}{
		{
			Desc:               "Bad JSON returned",
			TytoCareHTTPStatus: http.StatusCreated,
			RawJSONResponse: []byte(`{
				"id": 1,
				"dob": "20
			}`),

			WantGRPCCode: codes.Internal,
		},
		{
			Desc:               "HTTP 403 Forbidden Error",
			TytoCareHTTPStatus: http.StatusForbidden,

			WantGRPCCode: codes.PermissionDenied,
		},
		{
			Desc:               "HTTP 429 Too Many Requests Error",
			TytoCareHTTPStatus: http.StatusTooManyRequests,

			WantGRPCCode: codes.ResourceExhausted,
		},
		{
			Desc:               "HTTP 500 Internal Server Error",
			TytoCareHTTPStatus: http.StatusInternalServerError,

			WantGRPCCode: codes.Internal,
		},
		{
			Desc:               "HTTP 501 Not Implemented Error",
			TytoCareHTTPStatus: http.StatusNotImplemented,

			WantGRPCCode: codes.Unimplemented,
		},
		{
			Desc:               "Generic HTTP Error",
			TytoCareHTTPStatus: 418,

			WantGRPCCode: codes.Unknown,
		},
		{
			Desc:                        "TytoCare server is unavailable",
			TytoCareServerIsUnavailable: true,

			WantGRPCCode: codes.Unavailable,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			tytocareServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				rw.WriteHeader(tc.TytoCareHTTPStatus)
				if tc.RawJSONResponse != nil {
					rw.Write(tc.RawJSONResponse)
				}
			}))
			defer tytocareServer.Close()
			s, ctx := setup(tytocareServer.URL, tytocareServer.Client())

			if tc.TytoCareServerIsUnavailable {
				tytocareServer.Close()
			}

			err := s.executeTytoCareRequest(ctx, http.MethodPost, "/", TytoCareCreatePatientRequest{}, allowedResponseCodes, &tytocarepb.CreatePatientResponse{})

			reqStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}
			if reqStatus.Code() != tc.WantGRPCCode {
				t.Fatalf("received unexpected error: %s\n got: %s\nwant: %s", reqStatus, reqStatus.Code(), tc.WantGRPCCode)
			}
		})
	}
}

func TestGenerateDeepLink(t *testing.T) {
	visitID := "1"
	patientID := "2"
	dhmtID := "3"
	tcs := []struct {
		Desc                         string
		GenerateDeepLinkRequest      *tytocarepb.GenerateDeepLinkRequest
		TytoGenerateDeepLinkResponse TytoCareGenerateDeepLinkResponse
		TytoCareHTTPStatus           int
		WantGRPCCode                 codes.Code
		TytoCareServerIsUnavailable  bool
	}{
		{
			Desc: "success - successfully get deep link",
			GenerateDeepLinkRequest: &tytocarepb.GenerateDeepLinkRequest{
				VisitId:   visitID,
				PatientId: patientID,
				DhmtId:    dhmtID,
			},
			TytoCareHTTPStatus: http.StatusCreated,
			TytoGenerateDeepLinkResponse: TytoCareGenerateDeepLinkResponse{
				AndroidDeepLink: &mockedAndroidURL,
				IOSDeepLink:     &mockedIOSURL,
			},

			WantGRPCCode: codes.OK,
		},
		{
			Desc: "error - generate deep link convert into proto error",
			GenerateDeepLinkRequest: &tytocarepb.GenerateDeepLinkRequest{
				VisitId:   visitID,
				PatientId: patientID,
				DhmtId:    dhmtID,
			},
			TytoCareHTTPStatus: http.StatusCreated,
			TytoGenerateDeepLinkResponse: TytoCareGenerateDeepLinkResponse{
				IOSDeepLink: nil,
			},

			WantGRPCCode: codes.Internal,
		},
		{
			Desc: "error - convert proto into deep link request error",
			GenerateDeepLinkRequest: &tytocarepb.GenerateDeepLinkRequest{
				VisitId:   "",
				PatientId: patientID,
				DhmtId:    dhmtID,
			},
			TytoCareHTTPStatus: http.StatusCreated,
			TytoGenerateDeepLinkResponse: TytoCareGenerateDeepLinkResponse{
				IOSDeepLink:     &mockedIOSURL,
				AndroidDeepLink: &mockedAndroidURL,
			},

			WantGRPCCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			tytocareServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				res, err := json.Marshal(tc.TytoGenerateDeepLinkResponse)
				if err != nil {
					t.Fatalf("Failed to marshal json: %s", err)
				}
				rw.WriteHeader(tc.TytoCareHTTPStatus)
				rw.Write(res)
			}))
			defer tytocareServer.Close()

			if tc.TytoCareServerIsUnavailable {
				tytocareServer.Close()
			}

			s, ctx := setup(tytocareServer.URL, tytocareServer.Client())

			_, err := s.GenerateDeepLink(ctx, tc.GenerateDeepLinkRequest)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			if respStatus.Code() != tc.WantGRPCCode {
				t.Fatalf("response status: %s \n got %s want %s", respStatus, respStatus.Code(), tc.WantGRPCCode)
			}
		})
	}
}

func TestHealthCheck(t *testing.T) {
	tcs := []struct {
		Desc string
		Want *tytocarepb.HealthCheckResponse
	}{
		{
			Desc: "success - tytocare service is up",
			Want: &tytocarepb.HealthCheckResponse{
				Version: buildinfo.Version,
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s, ctx := &GRPCServer{
				Logger: baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
			}, context.Background()

			result, err := s.HealthCheck(ctx, &tytocarepb.HealthCheckRequest{})

			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchProto(t, result, tc.Want, "HealthCheck response mismatch")
		})
	}
}

package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/athena"
	"github.com/*company-data-covered*/services/go/pkg/athena/converters"
	athenapcipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena_pci"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type mockAuthValuer struct{}

func (m mockAuthValuer) AuthorizationValue() string {
	return "Bearer AccessTokenString"
}

func setup(athenaURL string, athenaHTTPClient *http.Client, logger *zap.SugaredLogger) (*GRPCServer, context.Context) {
	sugaredLogger := logger
	if sugaredLogger == nil {
		sugaredLogger = zap.NewNop().Sugar()
	}

	return &GRPCServer{
		AthenaClient: &athena.Client{
			AuthToken:     mockAuthValuer{},
			AthenaBaseURL: athenaURL,
			HTTPClient:    athenaHTTPClient,
		},
		Logger: sugaredLogger,
	}, context.Background()
}

func TestGRPCServerCreatePatientPayment(t *testing.T) {
	goodRequest := athenapcipb.CreatePatientPaymentRequest{
		AthenaPatientId: athenaPatientID,
		AccountNumber:   &accountNumber,
		BillingAddress:  &billingAddress,
		BillingZip:      &billingZip,
		Cvv:             cvv,
		ExpirationMonth: expirationMonth,
		ExpirationYear:  expirationYear,
		NameOnCard:      &nameOnCard,
		Amount:          &amount,
		DepartmentId:    departmentID,
	}

	goodAthenaResponse := &converters.PatientPaymentResponse{
		PaymentID: &paymentID,
		Success:   &successTrue,
	}

	goodAthenaResponseList := []*converters.PatientPaymentResponse{
		goodAthenaResponse,
	}

	goodAthenaRawResponse, err := json.Marshal(goodAthenaResponseList)
	if err != nil {
		t.Fatalf("Could not marshal athena response: %s", err)
	}

	multipleAthenaResponse := []*converters.PatientPaymentResponse{
		goodAthenaResponse,
		goodAthenaResponse,
	}

	multipleAthenaRawResponse, err := json.Marshal(multipleAthenaResponse)
	if err != nil {
		t.Fatalf("Could not marshal athena response: %s", err)
	}

	type errLog struct {
		message  string
		key      string
		keyValue string
	}

	tcs := []struct {
		description       string
		request           *athenapcipb.CreatePatientPaymentRequest
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapcipb.CreatePatientPaymentResponse
		wantErr      error
		wantGRPCCode codes.Code
		wantErrLog   errLog
	}{
		{
			description:       "success - base case",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: &athenapcipb.CreatePatientPaymentResponse{
				PaymentId: &paymentID,
				Success:   &successTrue,
			},
			wantGRPCCode: codes.OK,
		},
		{
			description:       "failure - athena server returned empty array response",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte("[]"),

			want:         nil,
			wantErr:      status.Error(codes.Internal, "received empty response from Athena API"),
			wantGRPCCode: codes.Internal,
		},
		{
			description:       "success - log message that athena returned multiple payment responses",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: multipleAthenaRawResponse,

			want: &athenapcipb.CreatePatientPaymentResponse{
				PaymentId: &paymentID,
				Success:   &successTrue,
			},
			wantGRPCCode: codes.OK,
			wantErrLog: errLog{
				message:  "received multiple payment responses from Athena",
				key:      "patientID",
				keyValue: goodRequest.AthenaPatientId,
			},
		},
		{
			description:       "failure - athena server is unavailable",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantErr:      status.Error(codes.Internal, "Failed to make a patient's payment. err: rpc error: code = Unknown desc = HTTP request had error response 503: "),
			wantGRPCCode: codes.Internal,
		},
		{
			description:       "failure - data for requested patientID, departmentID not found",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantErr:      status.Error(codes.NotFound, "HTTP request had error response 404: "),
			wantGRPCCode: codes.NotFound,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			core, recordedLogs := observer.New(zapcore.WarnLevel)
			testLogger := zap.New(core)
			zap.ReplaceGlobals(testLogger)

			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.athenaHTTPStatus)
					rw.Write(tc.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(athenaServer.URL, athenaServer.Client(), testLogger.Sugar())
			got, err := s.CreatePatientPayment(ctx, tc.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			var gotErrLog errLog
			for _, entry := range recordedLogs.All() {
				if entry.Level == zapcore.ErrorLevel {
					gotErrLog.message = entry.Message
					gotErrLog.key = entry.Context[0].Key
					gotErrLog.keyValue = entry.Context[0].String
				}
			}

			testutils.MustMatch(t, tc.want, got)
			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tc.wantErr, err)
			testutils.MustMatch(t, tc.wantErrLog, gotErrLog)
		})
	}
}

func TestGRPCServerGetPatientCreditCards(t *testing.T) {
	goodRequest := athenapcipb.GetPatientCreditCardsRequest{
		AthenaPatientId: athenaPatientID,
		DepartmentId:    *protoconv.ProtoInt64ToString(departmentID),
	}

	athenaCreditCard := &converters.GetStoredCreditCardResponse{
		CardType:                 cardType,
		BillingZip:               billingZip,
		BillingCity:              billingCity,
		BillingState:             billingState,
		BillingAddress:           billingAddress,
		StoredCardID:             storedCardID,
		PreferredCard:            preferredCard,
		CardExpirationMonthYear:  expirationMonthYear,
		CardNumberLastFourDigits: lastFourDigits,
	}

	protoCreditCard := &athenapcipb.CreditCard{
		CardType:             cardType,
		BillingZip:           billingZip,
		BillingCity:          billingCity,
		BillingState:         billingState,
		BillingAddress:       billingAddress,
		Id:                   storedCardID,
		IsPreferredCard:      preferredCard,
		ExpirationMonthYear:  expirationMonthYear,
		NumberLastFourDigits: lastFourDigits,
	}

	goodAthenaRawResponse, err := json.Marshal([]*converters.GetStoredCreditCardResponse{athenaCreditCard, athenaCreditCard})
	if err != nil {
		t.Fatalf("Could not marshal athena response: %s", err)
	}

	tcs := []struct {
		description       string
		request           *athenapcipb.GetPatientCreditCardsRequest
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapcipb.GetPatientCreditCardsResponse
		wantErr      error
		wantGRPCCode codes.Code
	}{
		{
			description:       "success - base case",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: &athenapcipb.GetPatientCreditCardsResponse{
				CreditCards: []*athenapcipb.CreditCard{
					protoCreditCard,
					protoCreditCard,
				},
			},
			wantGRPCCode: codes.OK,
		},
		{
			description:       "success - athena server returned empty array of credit cards",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte("[]"),

			want: &athenapcipb.GetPatientCreditCardsResponse{
				CreditCards: []*athenapcipb.CreditCard{},
			},
			wantGRPCCode: codes.OK,
		},
		{
			description:       "failure - athena server is unavailable",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantErr:      status.Error(codes.Internal, "failed to get patient credit card details. err: rpc error: code = Unknown desc = HTTP request had error response 503: "),
			wantGRPCCode: codes.Internal,
		},
		{
			description:       "failure - data for requested patientID, departmentID not found",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantErr:      status.Error(codes.NotFound, "HTTP request had error response 404: "),
			wantGRPCCode: codes.NotFound,
		},
		{
			description: "failure - empty athenaPatientID param",
			request: &athenapcipb.GetPatientCreditCardsRequest{
				DepartmentId: "321",
			},

			want:         nil,
			wantErr:      errEmptyAthenaPatientID,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			description: "failure - empty DepartmentId param",
			request: &athenapcipb.GetPatientCreditCardsRequest{
				AthenaPatientId: "123",
			},

			want:         nil,
			wantErr:      errEmptyDepartmentID,
			wantGRPCCode: codes.InvalidArgument,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.athenaHTTPStatus)
					rw.Write(tc.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(athenaServer.URL, athenaServer.Client(), nil)
			got, err := s.GetPatientCreditCards(ctx, tc.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantErr, err)
			testutils.MustMatch(t, tc.want, got)
			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code())
		})
	}
}

func TestGRPCServerCreatePatientCreditCard(t *testing.T) {
	goodRequest := athenapcipb.CreatePatientCreditCardRequest{
		AthenaPatientId: athenaPatientID,
		AccountNumber:   &accountNumber,
		BillingAddress:  &billingAddress,
		BillingZip:      &billingZip,
		Cvv:             cvv,
		ExpirationMonth: expirationMonth,
		ExpirationYear:  expirationYear,
		NameOnCard:      &nameOnCard,
		DepartmentId:    departmentID,
	}

	goodAthenaResponse := &converters.UploadPatientCreditCardResponse{
		Success:      &successTrue,
		StoredCardID: &storedCardID,
	}

	goodAthenaResponseList := []*converters.UploadPatientCreditCardResponse{
		goodAthenaResponse,
	}

	goodAthenaRawResponse, err := json.Marshal(goodAthenaResponseList)
	if err != nil {
		t.Fatalf("Could not marshal athena response: %s", err)
	}

	multipleAthenaResponse := []*converters.UploadPatientCreditCardResponse{
		goodAthenaResponse,
		goodAthenaResponse,
	}

	multipleAthenaRawResponse, err := json.Marshal(multipleAthenaResponse)
	if err != nil {
		t.Fatalf("Could not marshal athena response: %s", err)
	}

	type errLog struct {
		message  string
		key      string
		keyValue string
	}

	tcs := []struct {
		description       string
		request           *athenapcipb.CreatePatientCreditCardRequest
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapcipb.CreatePatientCreditCardResponse
		wantErr      error
		wantGRPCCode codes.Code
		wantErrLog   errLog
	}{
		{
			description:       "success - base case",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: &athenapcipb.CreatePatientCreditCardResponse{
				Success:      &successTrue,
				StoredCardId: &storedCardID,
			},
			wantGRPCCode: codes.OK,
		},
		{
			description:       "failure - athena server returned empty array response",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: []byte("[]"),

			want:         nil,
			wantErr:      status.Error(codes.Internal, "received empty credit card response from Athena API"),
			wantGRPCCode: codes.Internal,
		},
		{
			description:       "success - log message that athena returned multiple credit card responses",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: multipleAthenaRawResponse,

			want: &athenapcipb.CreatePatientCreditCardResponse{
				Success:      &successTrue,
				StoredCardId: &storedCardID,
			},
			wantGRPCCode: codes.OK,
			wantErrLog: errLog{
				message:  "received multiple create credit card responses from Athena",
				key:      "patientID",
				keyValue: goodRequest.AthenaPatientId,
			},
		},
		{
			description:       "failure - athena server is unavailable",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantErr:      status.Error(codes.Internal, "failed to make a patient's payment. err: rpc error: code = Unknown desc = HTTP request had error response 503: "),
			wantGRPCCode: codes.Internal,
		},
		{
			description:       "failure - data for requested patientID, departmentID not found",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantErr:      status.Error(codes.NotFound, "HTTP request had error response 404: "),
			wantGRPCCode: codes.NotFound,
		},
		{
			description: "failure - empty athenaPatientID param",
			request: &athenapcipb.CreatePatientCreditCardRequest{
				DepartmentId: departmentID,
			},

			want:         nil,
			wantErr:      errEmptyAthenaPatientID,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			description: "failure - empty DepartmentId param",
			request: &athenapcipb.CreatePatientCreditCardRequest{
				AthenaPatientId: athenaPatientID,
			},

			want:         nil,
			wantErr:      errEmptyDepartmentID,
			wantGRPCCode: codes.InvalidArgument,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			core, recordedLogs := observer.New(zapcore.WarnLevel)
			testLogger := zap.New(core)
			zap.ReplaceGlobals(testLogger)

			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.athenaHTTPStatus)
					rw.Write(tc.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(athenaServer.URL, athenaServer.Client(), testLogger.Sugar())
			got, err := s.CreatePatientCreditCard(ctx, tc.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			var gotErrLog errLog
			for _, entry := range recordedLogs.All() {
				if entry.Level == zapcore.ErrorLevel {
					gotErrLog.message = entry.Message
					gotErrLog.key = entry.Context[0].Key
					gotErrLog.keyValue = entry.Context[0].String
				}
			}

			testutils.MustMatch(t, tc.want, got)
			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tc.wantErr, err)
			testutils.MustMatch(t, tc.wantErrLog, gotErrLog)
		})
	}
}

func TestGRPCServerDeletePatientCreditCard(t *testing.T) {
	goodRequest := athenapcipb.DeletePatientCreditCardRequest{
		AthenaPatientId: athenaPatientID,
		CreditCardId:    storedCardID,
		DepartmentId:    *protoconv.ProtoInt64ToString(departmentID),
	}

	goodAthenaResponse := &converters.DeleteStoredCardResponse{
		Success: &successTrue,
	}

	goodAthenaRawResponse, err := json.Marshal(goodAthenaResponse)
	if err != nil {
		t.Fatalf("Could not marshal athena response: %s", err)
	}

	badAthenaResponse := &converters.DeleteStoredCardResponse{
		Success: &successFalse,
	}

	badAthenaRawResponse, err := json.Marshal(badAthenaResponse)
	if err != nil {
		t.Fatalf("Could not marshal athena response: %s", err)
	}

	tcs := []struct {
		description       string
		request           *athenapcipb.DeletePatientCreditCardRequest
		athenaRawResponse []byte
		athenaHTTPStatus  int

		want         *athenapcipb.DeletePatientCreditCardResponse
		wantErr      error
		wantGRPCCode codes.Code
	}{
		{
			description:       "success - base case",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: goodAthenaRawResponse,

			want: &athenapcipb.DeletePatientCreditCardResponse{
				Success: &successTrue,
			},
			wantGRPCCode: codes.OK,
		},
		{
			description:       "success - failed to delete credit card",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusOK,
			athenaRawResponse: badAthenaRawResponse,

			want: &athenapcipb.DeletePatientCreditCardResponse{
				Success: &successFalse,
			},
			wantGRPCCode: codes.OK,
		},
		{
			description:       "failure - athena server is unavailable",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusServiceUnavailable,
			athenaRawResponse: nil,

			want:         nil,
			wantErr:      status.Error(codes.Internal, "failed to delete patient credit card from AthenaAPI. err: rpc error: code = Unknown desc = HTTP request had error response 503: "),
			wantGRPCCode: codes.Internal,
		},
		{
			description:       "failure - data for requested patientID, departmentID not found",
			request:           &goodRequest,
			athenaHTTPStatus:  http.StatusNotFound,
			athenaRawResponse: nil,

			want:         nil,
			wantErr:      status.Error(codes.NotFound, "HTTP request had error response 404: "),
			wantGRPCCode: codes.NotFound,
		},
		{
			description: "failure - empty athenaPatientID param",
			request: &athenapcipb.DeletePatientCreditCardRequest{
				CreditCardId: storedCardID,
				DepartmentId: *protoconv.ProtoInt64ToString(departmentID),
			},

			want:         nil,
			wantErr:      errEmptyAthenaPatientID,
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			description: "failure - empty creditCardID param",
			request: &athenapcipb.DeletePatientCreditCardRequest{
				AthenaPatientId: athenaPatientID,
				DepartmentId:    *protoconv.ProtoInt64ToString(departmentID),
			},

			want:         nil,
			wantErr:      status.Error(codes.InvalidArgument, "creditCardID is empty"),
			wantGRPCCode: codes.InvalidArgument,
		},
		{
			description: "failure - empty departmentID param",
			request: &athenapcipb.DeletePatientCreditCardRequest{
				AthenaPatientId: athenaPatientID,
				CreditCardId:    storedCardID,
			},

			want:         nil,
			wantErr:      errEmptyDepartmentID,
			wantGRPCCode: codes.InvalidArgument,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			athenaServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.athenaHTTPStatus)
					rw.Write(tc.athenaRawResponse)
				},
			))
			defer athenaServer.Close()
			s, ctx := setup(athenaServer.URL, athenaServer.Client(), nil)
			got, err := s.DeletePatientCreditCard(ctx, tc.request)
			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.want, got)
			testutils.MustMatch(t, tc.wantGRPCCode, respStatus.Code())
			testutils.MustMatch(t, tc.wantErr, err)
		})
	}
}

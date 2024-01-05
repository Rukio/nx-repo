package main

import (
	"context"
	"errors"
	"testing"

	clinicalkpipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestSerializeGetProviderMetricsByMarket(t *testing.T) {
	type args struct {
		req any
	}
	mockPolicyData := map[string]any{
		"MarketId": []int64{1, 2, 3, 4},
	}
	tests := []struct {
		name           string
		args           args
		mockDBService  *mockClinicalKPIDB
		want           any
		wantStatusCode error
	}{
		{
			name: "success: base case",
			args: args{req: &clinicalkpipb.GetProviderMetricsByMarketRequest{ProviderId: int64(12)}},
			mockDBService: &mockClinicalKPIDB{
				getProviderMarketIDsResult: []int64{1, 2, 3, 4},
				getProviderMarketIDsError:  nil,
			},
			want:           mockPolicyData,
			wantStatusCode: nil,
		},
		{
			name: "failure: type: dbServise failed to obtain active user markets",
			args: args{req: &clinicalkpipb.GetProviderMetricsByMarketRequest{ProviderId: int64(12)}},
			mockDBService: &mockClinicalKPIDB{
				getProviderMarketIDsResult: nil,
				getProviderMarketIDsError:  errors.New("1, 2, 3, 4"),
			},
			want:           nil,
			wantStatusCode: status.Error(codes.Internal, "failed to get provider markets: 1, 2, 3, 4"),
		},
		{
			name:           "failure: invalid request type",
			args:           args{req: nil},
			mockDBService:  nil,
			want:           nil,
			wantStatusCode: status.Error(codes.InvalidArgument, invalidRequestTypeError),
		},
	}
	for _, tc := range tests {
		clinicalKpiResourceSerializer := ClinicalKpiPolicyResourceSerializer{dbService: tc.mockDBService}
		testPolicyResourceSerializer := &GetProviderMetricsByMarketRequestSerializer{clinicalKpiResourceSerializer}
		t.Run(tc.name, func(t *testing.T) {
			got, code := testPolicyResourceSerializer.SerializePolicyResource(context.Background(), tc.args.req)
			testutils.MustMatch(t, tc.wantStatusCode, code, "received unexpected status code")
			testutils.MustMatch(t, tc.want, got, "received unexpected response ")
		})
	}
}

func TestSerializeListProviderMetricsByMarket(t *testing.T) {
	type args struct {
		req any
	}
	mockPolicyData := map[string]any{
		"MarketId": int64(1),
	}
	tests := []struct {
		name           string
		args           args
		want           any
		wantStatusCode error
	}{
		{
			name:           "success: base case",
			args:           args{req: &clinicalkpipb.ListProviderMetricsByMarketRequest{MarketId: int64(1)}},
			want:           mockPolicyData,
			wantStatusCode: nil,
		},
		{
			name:           "failure: invalid MarketID error",
			args:           args{req: &clinicalkpipb.ListProviderMetricsByMarketRequest{MarketId: int64(-1)}},
			want:           nil,
			wantStatusCode: status.Errorf(codes.InvalidArgument, invalidMarketIDError, -1),
		},
		{
			name:           "failure: invalid request type",
			args:           args{req: nil},
			want:           nil,
			wantStatusCode: status.Error(codes.InvalidArgument, invalidRequestTypeError),
		},
	}
	for _, tc := range tests {
		testPolicyResourceSerializer := &ListProviderMetricsByMarketRequestSerializer{}
		t.Run(tc.name, func(t *testing.T) {
			got, code := testPolicyResourceSerializer.SerializePolicyResource(context.Background(), tc.args.req)
			testutils.MustMatch(t, tc.wantStatusCode, code, "received unexpected status code")
			testutils.MustMatch(t, tc.want, got, "received unexpected response ")
		})
	}
}

func TestSerializeGetMarketOverallMetrics(t *testing.T) {
	type args struct {
		req any
	}

	mockPolicyData := map[string]any{
		"MarketId": int64(1),
	}
	tests := []struct {
		name           string
		args           args
		mockDBService  *mockClinicalKPIDB
		want           any
		wantStatusCode error
	}{
		{
			name:           "success: base case",
			args:           args{req: &clinicalkpipb.GetMarketOverallMetricsRequest{MarketId: int64(1)}},
			want:           mockPolicyData,
			wantStatusCode: nil,
		},
		{
			name:           "failure: invalid MarketID error",
			args:           args{req: &clinicalkpipb.GetMarketOverallMetricsRequest{MarketId: int64(-1)}},
			want:           nil,
			wantStatusCode: status.Errorf(codes.InvalidArgument, invalidMarketIDError, -1),
		},
		{
			name:           "failure: invalid request type",
			args:           args{req: nil},
			want:           nil,
			wantStatusCode: status.Error(codes.InvalidArgument, invalidRequestTypeError),
		},
	}
	for _, tc := range tests {
		testPolicyResourceSerializer := &GetMarketOverallMetricsRequestSerializer{}
		t.Run(tc.name, func(t *testing.T) {
			got, code := testPolicyResourceSerializer.SerializePolicyResource(context.Background(), tc.args.req)
			testutils.MustMatch(t, tc.wantStatusCode, code, "received unexpected status code")
			testutils.MustMatch(t, tc.want, got, "received unexpected response ")
		})
	}
}

func TestSerializeGetProviderOverallMetrics(t *testing.T) {
	type args struct {
		req any
	}
	mockPolicyData := map[string]any{
		"MarketId": []int64{1, 2, 3, 4},
	}
	tests := []struct {
		name           string
		args           args
		mockDBService  *mockClinicalKPIDB
		want           any
		wantStatusCode error
	}{
		{
			name: "success: base case",
			args: args{req: &clinicalkpipb.GetProviderOverallMetricsRequest{ProviderId: int64(12)}},
			mockDBService: &mockClinicalKPIDB{
				getProviderMarketIDsResult: []int64{1, 2, 3, 4},
				getProviderMarketIDsError:  nil,
			},
			want:           mockPolicyData,
			wantStatusCode: nil,
		},
		{
			name: "failure: type: dbServise failed to obtain active user markets",
			args: args{req: &clinicalkpipb.GetProviderOverallMetricsRequest{ProviderId: int64(12)}},
			mockDBService: &mockClinicalKPIDB{
				getProviderMarketIDsResult: nil,
				getProviderMarketIDsError:  errors.New("1, 2, 3, 4"),
			},
			want:           nil,
			wantStatusCode: status.Error(codes.Internal, "failed to get provider markets: 1, 2, 3, 4"),
		},
		{
			name:           "failure: invalid request type",
			args:           args{req: nil},
			mockDBService:  nil,
			want:           nil,
			wantStatusCode: status.Error(codes.InvalidArgument, invalidRequestTypeError),
		},
	}
	for _, tc := range tests {
		clinicalKpiResourceSerializer := ClinicalKpiPolicyResourceSerializer{dbService: tc.mockDBService}
		testPolicyResourceSerializer := &GetProviderOverallMetricsRequestSerializer{clinicalKpiResourceSerializer}
		t.Run(tc.name, func(t *testing.T) {
			got, code := testPolicyResourceSerializer.SerializePolicyResource(context.Background(), tc.args.req)
			testutils.MustMatch(t, tc.wantStatusCode, code, "received unexpected status code")
			testutils.MustMatch(t, tc.want, got, "received unexpected response ")
		})
	}
}

func TestSerializeGetProviderLookBack(t *testing.T) {
	type args struct {
		req any
	}
	mockPolicyData := map[string]any{
		"ProviderId": int64(3),
	}

	tests := []struct {
		name string
		args args

		want           any
		wantStatusCode error
	}{
		{
			name: "success: base case",
			args: args{req: &clinicalkpipb.GetProviderLookBackRequest{ProviderId: int64(3)}},

			want:           mockPolicyData,
			wantStatusCode: nil,
		},
		{
			name: "failure: invalid request type",
			args: args{req: nil},

			want:           nil,
			wantStatusCode: status.Error(codes.InvalidArgument, invalidRequestTypeError),
		},
	}
	for _, tc := range tests {
		testPolicyResourceSerializer := &GetProviderLookBackSerializer{}
		t.Run(tc.name, func(t *testing.T) {
			got, code := testPolicyResourceSerializer.SerializePolicyResource(context.Background(), tc.args.req)
			testutils.MustMatch(t, tc.wantStatusCode, code, "received unexpected status code")
			testutils.MustMatch(t, tc.want, got, "received unexpected response ")
		})
	}
}

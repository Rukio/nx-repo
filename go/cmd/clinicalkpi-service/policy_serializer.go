package main

import (
	"context"

	clinicalkpipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/clinicalkpi"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const (
	invalidRequestTypeError = "invalid request type"
	invalidMarketIDError    = "invalid market id %d"
)

type ClinicalKpiPolicyResourceSerializer struct {
	dbService DBService
}

type GetProviderOverallMetricsRequestSerializer struct {
	ClinicalKpiPolicyResourceSerializer
}

func (m *GetProviderOverallMetricsRequestSerializer) SerializePolicyResource(ctx context.Context, req any) (any, error) {
	providerReq, ok := req.(*clinicalkpipb.GetProviderOverallMetricsRequest)
	if !ok {
		return nil, status.Error(codes.InvalidArgument, invalidRequestTypeError)
	}
	provider := providerReq.GetProviderId()

	providerMarketIDs, err := m.dbService.GetProviderMarketIDs(ctx, provider)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get provider markets: %s", err)
	}

	policyData := map[string]any{
		"MarketId": providerMarketIDs,
	}

	return policyData, nil
}

type GetMarketOverallMetricsRequestSerializer struct {
}

func (m *GetMarketOverallMetricsRequestSerializer) SerializePolicyResource(ctx context.Context, req any) (any, error) {
	marketReq, ok := req.(*clinicalkpipb.GetMarketOverallMetricsRequest)
	if !ok {
		return nil, status.Error(codes.InvalidArgument, invalidRequestTypeError)
	}

	marketID := marketReq.GetMarketId()
	if marketID <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, invalidMarketIDError, marketID)
	}

	policyData := map[string]any{
		"MarketId": marketID,
	}

	return policyData, nil
}

type ListProviderMetricsByMarketRequestSerializer struct {
}

func (m *ListProviderMetricsByMarketRequestSerializer) SerializePolicyResource(ctx context.Context, req any) (any, error) {
	marketReq, ok := req.(*clinicalkpipb.ListProviderMetricsByMarketRequest)
	if !ok {
		return nil, status.Error(codes.InvalidArgument, invalidRequestTypeError)
	}

	marketID := marketReq.GetMarketId()
	if marketID <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, invalidMarketIDError, marketID)
	}

	policyData := map[string]any{
		"MarketId": marketID,
	}

	return policyData, nil
}

type GetProviderMetricsByMarketRequestSerializer struct {
	ClinicalKpiPolicyResourceSerializer
}

func (m *GetProviderMetricsByMarketRequestSerializer) SerializePolicyResource(ctx context.Context, req any) (any, error) {
	providerReq, ok := req.(*clinicalkpipb.GetProviderMetricsByMarketRequest)
	if !ok {
		return nil, status.Error(codes.InvalidArgument, invalidRequestTypeError)
	}
	provider := providerReq.GetProviderId()

	providerMarketIDs, err := m.dbService.GetProviderMarketIDs(ctx, provider)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get provider markets: %s", err)
	}

	policyData := map[string]any{
		"MarketId": providerMarketIDs,
	}

	return policyData, nil
}

type GetProviderLookBackSerializer struct{}

func (m *GetProviderLookBackSerializer) SerializePolicyResource(ctx context.Context, req any) (any, error) {
	providerLookBackRequest, ok := req.(*clinicalkpipb.GetProviderLookBackRequest)
	if !ok {
		return nil, status.Error(codes.InvalidArgument, invalidRequestTypeError)
	}
	providerID := providerLookBackRequest.GetProviderId()

	return map[string]any{
		"ProviderId": providerID,
	}, nil
}

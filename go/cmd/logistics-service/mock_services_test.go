package main

import (
	"context"
	"errors"

	"github.com/*company-data-covered*/services/go/pkg/monitoring"

	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	marketpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/market"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"google.golang.org/grpc"
)

type MockMarketServiceClient struct {
	GetMarketResult                   *marketpb.GetMarketResponse
	GetAuthenticatedUserMarketsResult *marketpb.GetAuthenticatedUserMarketsResponse
	GetMarketErr                      error
	GetAuthenticatedUserMarketsErr    error
}

func (c *MockMarketServiceClient) GetMarket(ctx context.Context, in *marketpb.GetMarketRequest, opts ...grpc.CallOption) (*marketpb.GetMarketResponse, error) {
	return c.GetMarketResult, c.GetMarketErr
}

func (c *MockMarketServiceClient) GetAuthenticatedUserMarkets(ctx context.Context, in *marketpb.GetAuthenticatedUserMarketsRequest, opts ...grpc.CallOption) (*marketpb.GetAuthenticatedUserMarketsResponse, error) {
	return c.GetAuthenticatedUserMarketsResult, c.GetAuthenticatedUserMarketsErr
}

type MockShiftTeamServiceClient struct {
	shiftteampb.ShiftTeamServiceClient
	GetShiftTeamResult *shiftteampb.GetShiftTeamResponse
	GetShiftTeamErr    error
}

func (c *MockShiftTeamServiceClient) GetShiftTeam(ctx context.Context, in *shiftteampb.GetShiftTeamRequest, opts ...grpc.CallOption) (*shiftteampb.GetShiftTeamResponse, error) {
	return c.GetShiftTeamResult, c.GetShiftTeamErr
}

type MockEpisodeServiceClient struct {
	episodepb.EpisodeServiceClient

	GetVisitResult *episodepb.GetVisitResponse
	GetVisitErr    error
}

func (c *MockEpisodeServiceClient) GetVisit(ctx context.Context, in *episodepb.GetVisitRequest, opts ...grpc.CallOption) (*episodepb.GetVisitResponse, error) {
	return c.GetVisitResult, c.GetVisitErr
}

func (c *MockEpisodeServiceClient) ListVisits(ctx context.Context, in *episodepb.ListVisitsRequest, opts ...grpc.CallOption) (*episodepb.ListVisitsResponse, error) {
	return nil, errors.New("unimplemented")
}
func (c *MockEpisodeServiceClient) DuplicateVisit(ctx context.Context, in *episodepb.DuplicateVisitRequest, opts ...grpc.CallOption) (*episodepb.DuplicateVisitResponse, error) {
	return nil, errors.New("unimplemented")
}

func (c *MockEpisodeServiceClient) GetVisitPossibleServiceLines(ctx context.Context, in *episodepb.GetVisitPossibleServiceLinesRequest, opts ...grpc.CallOption) (*episodepb.GetVisitPossibleServiceLinesResponse, error) {
	return nil, errors.New("unimplemented")
}

func (c *MockEpisodeServiceClient) UpsertVisitETARange(ctx context.Context, in *episodepb.UpsertVisitETARangeRequest, opts ...grpc.CallOption) (*episodepb.UpsertVisitETARangeResponse, error) {
	return nil, errors.New("unimplemented")
}

func (c *MockEpisodeServiceClient) SearchVisits(ctx context.Context, in *episodepb.SearchVisitsRequest, opts ...grpc.CallOption) (*episodepb.SearchVisitsResponse, error) {
	return nil, errors.New("unimplemented")
}

type MockMapService struct {
	GetRouteResult            *logistics.Route
	GetRouteErr               error
	GetDistanceSourceIDResult int64
}

func (m *MockMapService) GetDistanceMatrix(context.Context, monitoring.Tags, []logistics.LatLng, []logistics.LatLng) (logistics.DistanceMatrix, error) {
	return nil, errors.New("unimplemented")
}

func (m *MockMapService) GetPathDistanceMatrix(context.Context, monitoring.Tags, ...logistics.LatLng) (logistics.DistanceMatrix, error) {
	return nil, errors.New("unimplemented")
}

func (m *MockMapService) GetRoute(context.Context, monitoring.Tags, ...logistics.LatLng) (*logistics.Route, error) {
	return m.GetRouteResult, m.GetRouteErr
}

func (m *MockMapService) IsHealthy(context.Context) bool {
	return true
}

func (m *MockMapService) GetDistanceSourceID() int64 {
	return m.GetDistanceSourceIDResult
}

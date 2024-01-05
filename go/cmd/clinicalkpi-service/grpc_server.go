package main

import (
	"context"
	"database/sql"
	"errors"
	"math"
	"time"

	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpiconv"
	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpidb"
	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	clinicalkpipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/clinicalkpi"
	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"go.uber.org/zap"
	"golang.org/x/exp/slices"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

const (
	performanceHubSettingsStatsigKey                          = "performance_hub_settings"
	defaultFilterProvidersByLastCompletedCareRequestAfterDays = 90
	defaultPage                                               = 1
	defaultPageSize                                           = 10
	errInvalidMarketID                                        = "invalid MarketId input type parameter: %d"
	errInvalidProviderID                                      = "invalid ProviderId input type parameter: %d"
	errTokenIsUnauthorized                                    = "current token is unauthorized"
	errFailedToGetLoggedInUser                                = "failed to get logged in user. err: %s"
	errCheckAuthenticationWithStation                         = "failed to check authentication with Station. err: %s"
	errLogInvalidProviderID                                   = "invalid ProviderID"
	errLogInvalidMarketID                                     = "invalid MarketID"
	errInvalidProviderProfilePosition                         = "invalid provider profile position"
)

var (
	providerPositionAPP           = "advanced practice provider"
	providerPositionDHMT          = "emt"
	providerPositionVirtualDoctor = "virtual doctor"
	validProviderProfilePositions = []string{providerPositionAPP, providerPositionDHMT}
	sortByProtoToString           = map[clinicalkpipb.MetricsSortBy]*string{
		clinicalkpipb.MetricsSortBy_METRICS_SORT_BY_UNSPECIFIED:         nil,
		clinicalkpipb.MetricsSortBy_METRICS_SORT_BY_ON_SCENE_TIME:       proto.String("on_scene_time"),
		clinicalkpipb.MetricsSortBy_METRICS_SORT_BY_CHART_CLOSURE_RATE:  proto.String("chart_closure_rate"),
		clinicalkpipb.MetricsSortBy_METRICS_SORT_BY_SURVEY_CAPTURE_RATE: proto.String("survey_capture_rate"),
		clinicalkpipb.MetricsSortBy_METRICS_SORT_BY_NET_PROMOTER_SCORE:  proto.String("net_promoter_score"),
	}
	sortOrderProtoToString = map[clinicalkpipb.SortOrder]string{
		clinicalkpipb.SortOrder_SORT_ORDER_UNSPECIFIED: "",
		clinicalkpipb.SortOrder_SORT_ORDER_DESC:        "DESC",
		clinicalkpipb.SortOrder_SORT_ORDER_ASC:         "ASC",
	}
)

// DBService demands what the grpc server needs from a DB implementation. Primarily for mocking purposes.
type DBService interface {
	GetLatestMetricsForProvider(ctx context.Context, providerID int64) (*clinicalkpisql.CalculatedProviderMetric, error)
	GetCalculatedMetricsForProvidersActiveAfterDate(ctx context.Context, args clinicalkpisql.GetCalculatedMetricsForProvidersActiveAfterDateParams) ([]*clinicalkpisql.CalculatedProviderMetric, error)
	GetActiveProvidersForMarket(ctx context.Context, marketID int64) ([]int64, error)
	GetActiveMarketsForProvider(ctx context.Context, providerID int64) ([]int64, error)
	ProcessStagingRecords(ctx context.Context, changeDaysPeriod int, logger *zap.SugaredLogger) error
	GetProviderVisits(ctx context.Context, args clinicalkpidb.GetProviderVisitsParams) (*clinicalkpidb.GetProviderVisitsResponse, error)
	GetProviderMetricsByMarket(ctx context.Context, args clinicalkpidb.GetProviderMetricsByMarketParams) (*clinicalkpisql.GetProviderMetricsByMarketRow, error)
	GetMarketMetrics(ctx context.Context, marketID int64) (*clinicalkpisql.GetMarketMetricsRow, error)
	GetShiftSnapshots(ctx context.Context, shiftTeamID int64) ([]*clinicalkpisql.GetShiftSnapshotsRow, error)
	GetProviderShifts(ctx context.Context, args clinicalkpidb.GetProviderShiftsParams) (*clinicalkpidb.GetProviderShiftsResponse, error)
	GetProviderMetrics(ctx context.Context, providerID int64) (*clinicalkpisql.GetProviderMetricsRow, error)
	GetProvidersMetricsByMarket(ctx context.Context, args clinicalkpidb.GetProvidersMetricsByMarketParams) (*clinicalkpidb.GetProvidersMetricsByMarketResponse, error)
	GetProviderDailyMetricsWithMarketGroupAveragesFromDate(ctx context.Context, args clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateParams) ([]*clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow, error)
	GetLastShiftSnapshots(ctx context.Context, providerID int64) ([]*clinicalkpisql.GetLastShiftSnapshotsRow, error)
	UpdateProviderAvatars(ctx context.Context, val clinicalkpisql.UpdateProviderAvatarsParams) error
	GetProviderAvatars(ctx context.Context) ([]*clinicalkpisql.GetProviderAvatarsRow, error)
	GetProviderMarketIDs(ctx context.Context, providerID int64) ([]int64, error)
	GetProviderMarkets(ctx context.Context, providerID int64) ([]*clinicalkpisql.Market, error)
}

type GRPCServer struct {
	clinicalkpipb.UnimplementedClinicalKpiServiceServer
	DBService       DBService
	StationClient   *station.Client
	StatsigProvider *providers.StatsigProvider
	Logger          *zap.SugaredLogger
}

type gRPCServerParams struct {
	dbService       DBService
	stationClient   *station.Client
	statsigProvider *providers.StatsigProvider
	logger          *zap.SugaredLogger
}

func NewGRPCServer(params gRPCServerParams) *GRPCServer {
	return &GRPCServer{
		DBService:       params.dbService,
		StationClient:   params.stationClient,
		StatsigProvider: params.statsigProvider,
		Logger:          params.logger,
	}
}

func (s *GRPCServer) GetAuthenticatedUser(ctx context.Context, _ *clinicalkpipb.GetAuthenticatedUserRequest) (*clinicalkpipb.GetAuthenticatedUserResponse, error) {
	user, err := s.getCurrentUser(ctx)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to obtain user details: %s", err)
	}
	availableMarketIDs, err := s.DBService.GetActiveMarketsForProvider(ctx, user.ID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to obtain active user markets: %s", err)
	}
	return &clinicalkpipb.GetAuthenticatedUserResponse{User: StationUserToProto(user, availableMarketIDs)}, nil
}

func (s *GRPCServer) GetLatestMetricsForProvider(ctx context.Context, mr *clinicalkpipb.GetLatestMetricsForProviderRequest) (*clinicalkpipb.GetLatestMetricsForProviderResponse, error) {
	providerID := mr.GetProviderId()
	if providerID <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, errInvalidProviderID, providerID)
	}

	_, err := s.getCurrentUser(ctx)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() == codes.Unauthenticated {
			return nil, status.Errorf(codes.Unauthenticated, errTokenIsUnauthorized)
		}
		return nil, status.Errorf(codes.Internal, errCheckAuthenticationWithStation, err)
	}

	metrics, err := s.DBService.GetLatestMetricsForProvider(ctx, providerID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to perform query: %s", err)
	}

	individualMetrics := clinicalkpiconv.ProviderMetricsSQLToProto(metrics, int32(*completedCareRequestsThreshold))

	return &clinicalkpipb.GetLatestMetricsForProviderResponse{
		Metrics: individualMetrics,
	}, nil
}

func (s *GRPCServer) GetLatestMetricsByMarket(ctx context.Context, r *clinicalkpipb.GetLatestMetricsByMarketRequest) (*clinicalkpipb.GetLatestMetricsByMarketResponse, error) {
	marketID := r.GetMarketId()
	if marketID <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, errInvalidMarketID, marketID)
	}

	currentUser, err := s.getCurrentUser(ctx)
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() == codes.Unauthenticated {
			return nil, status.Errorf(codes.Unauthenticated, errTokenIsUnauthorized)
		}
		return nil, status.Errorf(codes.Internal, errFailedToGetLoggedInUser, err)
	}
	if currentUser.ProviderProfile == nil || !slices.Contains(validProviderProfilePositions, currentUser.ProviderProfile.Position) {
		return nil, status.Errorf(codes.PermissionDenied, errInvalidProviderProfilePosition)
	}

	stationProviders, err := s.getStationProviders(ctx, &StationProvidersParams{marketIDs: []int64{marketID}, providerProfilePosition: &currentUser.ProviderProfile.Position, forwardAuth: true})
	if err != nil {
		return nil, err
	}

	providersActiveInMarket, err := s.DBService.GetActiveProvidersForMarket(ctx, marketID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get providers active in market: %s", err)
	}

	providerIds := make([]int64, 0, len(providersActiveInMarket))
	providerMap := map[int64]*StationProvider{}
	for i := range stationProviders {
		providerID := stationProviders[i].ID
		if slices.Contains(providersActiveInMarket, providerID) {
			providerIds = append(providerIds, providerID)
			providerMap[providerID] = &stationProviders[i]
		}
	}

	var settings performanceHubSettings
	err = s.StatsigProvider.Struct(performanceHubSettingsStatsigKey, &settings)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get performance hub settings from statsig: %s", err)
	}

	now := time.Now().UTC()
	activeAfterTime := sqltypes.ToValidNullTime(now.AddDate(0, 0, -settings.FilterProvidersByLastCompletedCareRequestIntervalDays()))
	providerMetrics, err := s.DBService.GetCalculatedMetricsForProvidersActiveAfterDate(ctx, clinicalkpisql.GetCalculatedMetricsForProvidersActiveAfterDateParams{
		ProviderIds: providerIds,
		ActiveAfter: activeAfterTime,
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to get metrics from database: %s", err)
	}

	results := make([]*clinicalkpipb.ProviderMetrics, len(providerMetrics))
	for i, providerMetric := range providerMetrics {
		provider, ok := providerMap[providerMetric.ProviderID]
		if !ok {
			return nil, status.Errorf(codes.Internal, "failed to link metrics with providerId: %d", providerMetric.ProviderID)
		}

		results[i] = &clinicalkpipb.ProviderMetrics{
			Provider: StationProviderToProto(provider),
			Metrics:  clinicalkpiconv.ProviderMetricsSQLToProto(providerMetric, int32(*completedCareRequestsThreshold)),
		}
	}
	return &clinicalkpipb.GetLatestMetricsByMarketResponse{ProviderMetrics: results}, nil
}

func (s *GRPCServer) ProcessStagingRecords(ctx context.Context, _ *clinicalkpipb.ProcessStagingRecordsRequest) (*clinicalkpipb.ProcessStagingRecordsResponse, error) {
	_, err := s.getStationProviders(ctx, &StationProvidersParams{forwardAuth: true})
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() == codes.Unauthenticated {
			return nil, status.Errorf(codes.Unauthenticated, errTokenIsUnauthorized)
		}
		return nil, status.Errorf(codes.Internal, errCheckAuthenticationWithStation, err)
	}

	err = s.DBService.ProcessStagingRecords(ctx, changeDaysPeriod, s.Logger)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "Something went wrong during the processing. Error: %v ", err)
	}

	return &clinicalkpipb.ProcessStagingRecordsResponse{}, nil
}

func (s *GRPCServer) ListProviderShifts(ctx context.Context, r *clinicalkpipb.ListProviderShiftsRequest) (*clinicalkpipb.ListProviderShiftsResponse, error) {
	providerID := r.GetProviderId()
	logger := s.Logger.Named("ListProviderShifts").With("ProviderID", providerID)
	logger.Debugw("start")
	if providerID <= 0 {
		logger.Debugw(errLogInvalidProviderID)
		return nil, status.Errorf(codes.InvalidArgument, errInvalidProviderID, providerID)
	}

	page := r.GetPage()
	if page == 0 {
		page = defaultPage
	}
	perPage := r.GetPerPage()
	if perPage == 0 {
		perPage = defaultPageSize
	}

	result, err := s.DBService.GetProviderShifts(ctx, clinicalkpidb.GetProviderShiftsParams{
		ProviderID:           providerID,
		Page:                 page,
		PerPage:              perPage,
		FromDate:             protoconv.ProtoTimestampToTime(r.FromTimestamp),
		ServiceDateSortOrder: sortOrderProtoToString[r.GetSortOrder()],
	})
	if err != nil {
		logger.Errorf("ailed to get provider's shifts: %s", err)
		return nil, status.Errorf(codes.Internal, "failed to get provider's shifts: %s", err)
	}
	logger.Debugw("provider shifts received from the DB")

	shifts := make([]*clinicalkpipb.ProviderShift, len(result.Rows))
	for i, shift := range result.Rows {
		shifts[i] = clinicalkpiconv.ProviderShiftSQLToProto(shift)
	}

	return &clinicalkpipb.ListProviderShiftsResponse{
		ProviderShifts: shifts,
		Pagination: &clinicalkpipb.Pagination{
			Total:      result.Total,
			Page:       page,
			TotalPages: int64(math.Ceil(float64(result.Total) / float64(perPage))),
		},
	}, nil
}

func (s *GRPCServer) GetMarketOverallMetrics(ctx context.Context, r *clinicalkpipb.GetMarketOverallMetricsRequest) (*clinicalkpipb.GetMarketOverallMetricsResponse, error) {
	marketID := r.GetMarketId()
	logger := s.Logger.Named("GetMarketOverallMetrics").With("MarketID", marketID)
	logger.Debugw("start")
	if marketID <= 0 {
		logger.Debugw(errLogInvalidMarketID)
		return nil, status.Errorf(codes.InvalidArgument, errInvalidMarketID, marketID)
	}

	metrics, err := s.DBService.GetMarketMetrics(ctx, marketID)
	if err != nil {
		logger.Errorf("can not fetch market metrics from the DB %s", err)
		if errors.Is(err, clinicalkpidb.ErrMarketMetricsNotFound) {
			return nil, status.Errorf(codes.NotFound, "metrics for market was not found. MarketID: %v", marketID)
		}
		return nil, status.Errorf(codes.Internal, "failed to get market metrics: %s", err)
	}
	logger.Debugw("market metrics received from the DB")

	return &clinicalkpipb.GetMarketOverallMetricsResponse{
		MarketMetrics: clinicalkpiconv.MarketMetricsSQLToProto(metrics),
		Market:        clinicalkpiconv.MarketMetricsMarketSQLToProto(metrics),
	}, nil
}

func (s *GRPCServer) GetProviderOverallMetrics(ctx context.Context, r *clinicalkpipb.GetProviderOverallMetricsRequest) (*clinicalkpipb.GetProviderOverallMetricsResponse, error) {
	providerID := r.GetProviderId()
	logger := s.Logger.Named("GetProviderOverallMetrics").With("ProviderID", providerID)
	logger.Debugw("start")
	if providerID <= 0 {
		logger.Debugw(errLogInvalidProviderID)
		return nil, status.Errorf(codes.InvalidArgument, errInvalidProviderID, providerID)
	}

	metrics, err := s.DBService.GetProviderMetrics(ctx, providerID)
	if err != nil {
		logger.Errorf("can not fetch provider metrics from the DB %s", err)
		if errors.Is(err, clinicalkpidb.ErrProviderMetricsNotFound) {
			return nil, status.Errorf(codes.NotFound, "metrics for provider were not found. Provider ID: %d", providerID)
		}
		return nil, status.Errorf(codes.Internal, "failed to get provider metrics: %s", err)
	}
	logger.Debugw("provider metrics received from the DB")

	return &clinicalkpipb.GetProviderOverallMetricsResponse{
		ProviderMetrics: clinicalkpiconv.ProviderOverallMetricsSQLToProto(metrics),
	}, nil
}

func (s *GRPCServer) ListProviderVisits(ctx context.Context, r *clinicalkpipb.ListProviderVisitsRequest) (*clinicalkpipb.ListProviderVisitsResponse, error) {
	providerID := r.GetProviderId()
	logger := s.Logger.Named("ListProviderVisits").With("ProviderID", providerID)
	logger.Debugw("start")
	if providerID <= 0 {
		logger.Debugw(errLogInvalidProviderID)
		return nil, status.Errorf(codes.InvalidArgument, errInvalidProviderID, providerID)
	}

	page := r.GetPage()
	if page == 0 {
		page = defaultPage
	}
	perPage := r.GetPerPage()
	if perPage == 0 {
		perPage = defaultPageSize
	}

	result, err := s.DBService.GetProviderVisits(ctx, clinicalkpidb.GetProviderVisitsParams{
		ProviderID:      providerID,
		IsAbxPrescribed: r.IsAbxPrescribed,
		IsEscalated:     r.IsEscalated,
		SearchText:      r.SearchText,
		Page:            page,
		PerPage:         perPage,
	})
	if err != nil {
		logger.Errorf("can not fetch provider visits from the DB %s", err)
		return nil, status.Errorf(codes.Internal, "failed to get provider's visits: %s", err)
	}
	logger.Debugw("provider visits received from the DB")

	visits := make([]*clinicalkpipb.ProviderVisit, len(result.Rows))
	for i, visit := range result.Rows {
		visits[i] = clinicalkpiconv.ProviderVisitSQLToProto(visit)
	}

	return &clinicalkpipb.ListProviderVisitsResponse{
		ProviderVisits: visits,
		Pagination: &clinicalkpipb.Pagination{
			Total:      result.Total,
			Page:       page,
			TotalPages: int64(math.Ceil(float64(result.Total) / float64(perPage))),
		},
	}, nil
}

func (s *GRPCServer) ListProviderMetricsByMarket(ctx context.Context, r *clinicalkpipb.ListProviderMetricsByMarketRequest) (*clinicalkpipb.ListProviderMetricsByMarketResponse, error) {
	marketID := r.GetMarketId()
	logger := s.Logger.Named("ListProviderMetricsByMarket").With("MarketID", marketID)
	logger.Debugw("start")
	if marketID <= 0 {
		logger.Debugw(errLogInvalidMarketID)
		return nil, status.Errorf(codes.InvalidArgument, errInvalidMarketID, marketID)
	}

	page := r.GetPage()
	if page == 0 {
		page = defaultPage
	}
	perPage := r.GetPerPage()
	if perPage == 0 {
		perPage = defaultPageSize
	}

	result, err := s.DBService.GetProvidersMetricsByMarket(ctx, clinicalkpidb.GetProvidersMetricsByMarketParams{
		MarketID:         marketID,
		SortBy:           sortByProtoToString[r.GetSortBy()],
		ProviderJobTitle: r.ProviderJobTitle,
		SearchText:       r.SearchText,
		Page:             page,
		PerPage:          perPage,
	})
	if err != nil {
		logger.Errorf("can not fetch market provider metrics from the DB %s", err)
		return nil, status.Errorf(codes.Internal, "failed to get provider's metrics for the market: %s", err)
	}
	logger.Debugw("market provider metrics received from the DB")

	metrics := make([]*clinicalkpipb.MarketProviderMetricsListItem, len(result.Rows))
	for i, metric := range result.Rows {
		metrics[i] = clinicalkpiconv.MarketProviderMetricsListItemSQLToProto(metric)
	}
	return &clinicalkpipb.ListProviderMetricsByMarketResponse{
		MarketProviderMetrics: metrics,
		Pagination: &clinicalkpipb.Pagination{
			Total:      result.Total,
			Page:       page,
			TotalPages: int64(math.Ceil(float64(result.Total) / float64(perPage))),
		},
	}, nil
}

func (s *GRPCServer) GetProviderMetricsByMarket(ctx context.Context, r *clinicalkpipb.GetProviderMetricsByMarketRequest) (*clinicalkpipb.GetProviderMetricsByMarketResponse, error) {
	providerID := r.GetProviderId()
	marketID := r.GetMarketId()
	logger := s.Logger.Named("GetProviderMetricsByMarket").With("MarketID", marketID, "ProviderID", providerID)
	logger.Debugw("start")
	if providerID <= 0 {
		logger.Debugw(errLogInvalidProviderID)
		return nil, status.Errorf(codes.InvalidArgument, errInvalidProviderID, providerID)
	}
	if marketID <= 0 {
		logger.Debugw(errLogInvalidMarketID)
		return nil, status.Errorf(codes.InvalidArgument, errInvalidMarketID, marketID)
	}

	metrics, err := s.DBService.GetProviderMetricsByMarket(ctx, clinicalkpidb.GetProviderMetricsByMarketParams{
		ProviderID: providerID,
		MarketID:   marketID,
	})
	if err != nil {
		logger.Errorf("can not fetch market provider metrics from the DB %s", err)
		if errors.Is(err, clinicalkpidb.ErrProviderMetricsByMarketNotFound) {
			return nil, status.Errorf(codes.NotFound, "metrics for provider by market was not found. ProviderID: %v, MarketID: %v", providerID, marketID)
		}

		return nil, status.Errorf(codes.Internal, "failed to get provider's metrics for all their markets: %s", err)
	}
	logger.Debugw("market provider metrics received from the DB")

	return &clinicalkpipb.GetProviderMetricsByMarketResponse{
		MarketProviderMetrics: clinicalkpiconv.MarketProviderMetricsSQLToProto(metrics),
	}, nil
}

func (s *GRPCServer) ListShiftSnapshots(ctx context.Context, r *clinicalkpipb.ListShiftSnapshotsRequest) (*clinicalkpipb.ListShiftSnapshotsResponse, error) {
	shiftTeamID := r.GetShiftTeamId()
	logger := s.Logger.Named("ListShiftSnapshots").With("ShiftTeamID", shiftTeamID)
	logger.Debugw("start")
	if shiftTeamID <= 0 {
		logger.Debugw("invalid ShiftTeamID")
		return nil, status.Errorf(codes.InvalidArgument, "invalid shiftTeamID input type parameter: %d", shiftTeamID)
	}

	shiftSnapshots, err := s.DBService.GetShiftSnapshots(ctx, shiftTeamID)
	if err != nil {
		logger.Errorf("can not fetch shift snapshots from the DB %s", err)
		return nil, status.Errorf(codes.Internal, "failed to get shift's snapshots: %s", err)
	}
	logger.Debugw("shift snapshots received from the DB")

	results := make([]*clinicalkpipb.ShiftSnapshot, len(shiftSnapshots))
	for i, shiftSnapshots := range shiftSnapshots {
		results[i] = clinicalkpiconv.ShiftSnapshotsSQLToProto(shiftSnapshots)
	}

	return &clinicalkpipb.ListShiftSnapshotsResponse{
		ShiftSnapshots: results,
	}, nil
}

func (s *GRPCServer) ListProviderMarkets(ctx context.Context, r *clinicalkpipb.ListProviderMarketsRequest) (*clinicalkpipb.ListProviderMarketsResponse, error) {
	providerID := r.GetProviderId()
	logger := s.Logger.Named("ListProviderMarkets").With("ProviderID", providerID)
	logger.Debugw("start")
	if providerID <= 0 {
		logger.Debugw("invalid providerID")
		return nil, status.Errorf(codes.InvalidArgument, errInvalidProviderID, providerID)
	}

	markets, err := s.DBService.GetProviderMarkets(ctx, providerID)
	if err != nil {
		logger.Errorf("can not fetch provider's markets from the DB %s", err)
		return nil, status.Errorf(codes.Internal, "failed to get provider's markets: %s", err)
	}
	logger.Debugw("provider's markets received from the DB")

	results := make([]*clinicalkpipb.Market, len(markets))
	for i, market := range markets {
		results[i] = clinicalkpiconv.MarketSQLToProto(market)
	}

	return &clinicalkpipb.ListProviderMarketsResponse{
		Markets: results,
	}, nil
}

func (s *GRPCServer) GetProviderLookBack(ctx context.Context, req *clinicalkpipb.GetProviderLookBackRequest) (*clinicalkpipb.GetProviderLookBackResponse, error) {
	providerID := req.GetProviderId()
	if providerID == 0 {
		return nil, status.Errorf(codes.InvalidArgument, errInvalidProviderID, providerID)
	}

	now := time.Now()
	today := clinicalkpiconv.TimestampToDate(now)
	measuredFromDate := today.AddDate(0, 0, -lookBackShiftsTrendDays)

	providerDailyMetrics, err := s.DBService.GetProviderDailyMetricsWithMarketGroupAveragesFromDate(ctx, clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateParams{ProviderID: providerID, FromDate: measuredFromDate})
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to obtain provider daily metrics: %s", err)
	}

	providerShiftSnapshots, err := s.DBService.GetLastShiftSnapshots(ctx, providerID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, "failed to obtain last provider shift snapshots: %s", err)
	}

	return &clinicalkpipb.GetProviderLookBackResponse{
		ShiftsTrend:      clinicalkpiconv.ProviderDailyMetricsWithMarketAveragesRowsSQLToLookBackMetricsListProto(providerDailyMetrics),
		LastDayBreakdown: clinicalkpiconv.LastProviderShiftSnapshotsSQLToBreakdownProto(providerShiftSnapshots),
	}, nil
}

func (s *GRPCServer) SyncProviderAvatars(ctx context.Context, _ *clinicalkpipb.SyncProviderAvatarsRequest) (*clinicalkpipb.SyncProviderAvatarsResponse, error) {
	logger := s.Logger.Named("SyncProviderAvatars")
	logger.Debug("start")
	stationProviders, err := s.getStationProviders(ctx, &StationProvidersParams{forwardAuth: true})
	if err != nil {
		if respStatus, ok := status.FromError(err); ok && respStatus.Code() == codes.Unauthenticated {
			logger.Errorf("station authorization failed: %s", err)
			return nil, status.Errorf(codes.Unauthenticated, errTokenIsUnauthorized)
		}
		logger.Errorf("can not get providers from the Station. err: %s", err)
		return nil, status.Errorf(codes.Internal, "failed to get providers from Station. err: %s", err)
	}
	logger.Debug("providers were fetched from the Station")

	existingProviderAvatars, err := s.DBService.GetProviderAvatars(ctx)
	if err != nil {
		logger.Errorf("failed to fetch providers from ClinikalKPI DB: %s", err)
		return nil, status.Errorf(codes.Internal, "failed to get providers from ClinikalKPI. err: %s", err)
	}

	providerAvatarsMap := make(map[int64]sql.NullString)
	for _, provider := range existingProviderAvatars {
		providerAvatarsMap[provider.ProviderID] = provider.AvatarUrl
	}

	var providersToUpdate clinicalkpisql.UpdateProviderAvatarsParams

	for _, provider := range stationProviders {
		if existingAvatarURL, ok := providerAvatarsMap[provider.ID]; ok {
			avatarURL := ""
			if provider.ProviderImageTinyURL != nil {
				avatarURL = *provider.ProviderImageTinyURL
			}
			if avatarURL != existingAvatarURL.String {
				providersToUpdate.ProviderIds = append(providersToUpdate.ProviderIds, provider.ID)
				providersToUpdate.AvatarUrls = append(providersToUpdate.AvatarUrls, avatarURL)
			}
		}
	}

	if len(providersToUpdate.ProviderIds) > 0 {
		logger.Debug("count Providers to update: ", len(providersToUpdate.ProviderIds))
		err = s.DBService.UpdateProviderAvatars(ctx, providersToUpdate)
		if err != nil {
			logger.Errorf("failed to update provider avatar urls. err: %s", err)
			return nil, status.Errorf(codes.Internal, "failed to update provider avatar url. err: %s", err)
		}
	}

	return &clinicalkpipb.SyncProviderAvatarsResponse{}, nil
}

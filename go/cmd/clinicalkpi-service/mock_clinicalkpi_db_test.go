package main

import (
	"context"

	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpidb"
	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"go.uber.org/zap"
)

// mockClinicalKPIDB is a mock implementation of ClinicalKPIDB for testing.
//
// It allows direct configuration of the return (including error) values.
// It does not (yet) capture whether it is called or the arguments that it is
// called with, but that is a relatively simple extension if desired.
type mockClinicalKPIDB struct {
	clinicalkpidb.ClinicalKPIDB
	getCalculatedMetricsForProvidersActiveAfterDateResult        []*clinicalkpisql.CalculatedProviderMetric
	getCalculatedMetricsForProvidersActiveAfterDateErr           error
	getActiveProvidersForMarketResult                            []int64
	getActiveProvidersForMarketErr                               error
	getActiveMarketsForProviderResult                            []int64
	getActiveMarketsForProviderErr                               error
	getMetricsForProviderError                                   error
	upsertCalculatedProviderMetricResult                         *clinicalkpisql.CalculatedProviderMetric
	upsertCalculatedProviderMetricErr                            error
	getMetricsForProviderResult                                  *clinicalkpisql.CalculatedProviderMetric
	processStagingRecordsErr                                     error
	addActiveProviderForMarketsErr                               error
	addAddStagingProviderMetricResult                            *clinicalkpisql.StagingProviderMetric
	addAddStagingProviderMetricErr                               error
	deleteAllStagingProviderMetricsErr                           error
	getProviderVisitsResult                                      *clinicalkpidb.GetProviderVisitsResponse
	getProviderVisitsError                                       error
	getProviderMetricsByMarketResult                             *clinicalkpisql.GetProviderMetricsByMarketRow
	getProviderMetricsByMarketError                              error
	getMarketMetricsResult                                       *clinicalkpisql.GetMarketMetricsRow
	getMarketMetricsError                                        error
	getShiftSnapshotsResult                                      []*clinicalkpisql.GetShiftSnapshotsRow
	getShiftSnapshotsError                                       error
	getProviderShiftsResult                                      *clinicalkpidb.GetProviderShiftsResponse
	getProviderShiftsError                                       error
	getProviderMetricsResult                                     *clinicalkpisql.GetProviderMetricsRow
	getProviderMetricsError                                      error
	getProvidersMetricsByMarketResult                            *clinicalkpidb.GetProvidersMetricsByMarketResponse
	getProvidersMetricsByMarketError                             error
	getProviderDailyMetricsWithMarketGroupAveragesFromDateResult []*clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow
	getProviderDailyMetricsWithMarketGroupAveragesFromDateErr    error
	getLastShiftSnapshotsResult                                  []*clinicalkpisql.GetLastShiftSnapshotsRow
	getLastShiftSnapshotsErr                                     error
	UpdateProviderAvatarsErr                                     error
	GetProviderAvatarsResult                                     []*clinicalkpisql.GetProviderAvatarsRow
	GetProviderAvatarsErr                                        error
	getProviderMarketIDsResult                                   []int64
	getProviderMarketIDsError                                    error
	seedMarketsResult                                            int64
	seedMarketsErr                                               error
	seedMarketGroupsResult                                       []*clinicalkpisql.MarketGroup
	seedMarketGroupsErr                                          error
	seedProviderDailyMetricsResult                               []*clinicalkpisql.ProviderDailyMetric
	seedProviderDailyMetricsErr                                  error
	deleteAllLookBackMetricsErr                                  error
	getProviderMarketsResult                                     []*clinicalkpisql.Market
	getProviderMarketsError                                      error
	seedShiftSnapshotsErr                                        error
}

func (m *mockClinicalKPIDB) ProcessStagingRecords(ctx context.Context, changeDaysPeriod int, logger *zap.SugaredLogger) error {
	return m.processStagingRecordsErr
}

func (m *mockClinicalKPIDB) GetLatestMetricsForProvider(ctx context.Context, provider int64) (*clinicalkpisql.CalculatedProviderMetric, error) {
	return m.getMetricsForProviderResult, m.getMetricsForProviderError
}

func (m *mockClinicalKPIDB) GetCalculatedMetricsForProvidersActiveAfterDate(ctx context.Context, args clinicalkpisql.GetCalculatedMetricsForProvidersActiveAfterDateParams) ([]*clinicalkpisql.CalculatedProviderMetric, error) {
	return m.getCalculatedMetricsForProvidersActiveAfterDateResult, m.getCalculatedMetricsForProvidersActiveAfterDateErr
}

func (m *mockClinicalKPIDB) GetActiveMarketsForProvider(ctx context.Context, providerID int64) ([]int64, error) {
	return m.getActiveMarketsForProviderResult, m.getActiveMarketsForProviderErr
}

func (m *mockClinicalKPIDB) UpsertCalculatedProviderMetric(ctx context.Context, metric clinicalkpisql.UpsertCalculatedProviderMetricsParams) (*clinicalkpisql.CalculatedProviderMetric, error) {
	return m.upsertCalculatedProviderMetricResult, m.upsertCalculatedProviderMetricErr
}

func (m *mockClinicalKPIDB) AddActiveProviderForMarkets(ctx context.Context, val clinicalkpisql.AddActiveProviderForMarketsParams) error {
	return m.addActiveProviderForMarketsErr
}

func (m *mockClinicalKPIDB) GetActiveProvidersForMarket(ctx context.Context, marketID int64) ([]int64, error) {
	return m.getActiveProvidersForMarketResult, m.getActiveProvidersForMarketErr
}

func (m *mockClinicalKPIDB) AddStagingProviderMetric(ctx context.Context, val clinicalkpisql.AddStagingProviderMetricParams) (*clinicalkpisql.StagingProviderMetric, error) {
	return m.addAddStagingProviderMetricResult, m.addAddStagingProviderMetricErr
}

func (m *mockClinicalKPIDB) DeleteAllStagingProviderMetrics(ctx context.Context) error {
	return m.deleteAllStagingProviderMetricsErr
}

func (m *mockClinicalKPIDB) GetProviderVisits(ctx context.Context, args clinicalkpidb.GetProviderVisitsParams) (*clinicalkpidb.GetProviderVisitsResponse, error) {
	return m.getProviderVisitsResult, m.getProviderVisitsError
}

func (m *mockClinicalKPIDB) GetProviderMetricsByMarket(ctx context.Context, args clinicalkpidb.GetProviderMetricsByMarketParams) (*clinicalkpisql.GetProviderMetricsByMarketRow, error) {
	return m.getProviderMetricsByMarketResult, m.getProviderMetricsByMarketError
}

func (m *mockClinicalKPIDB) GetMarketMetrics(ctx context.Context, marketID int64) (*clinicalkpisql.GetMarketMetricsRow, error) {
	return m.getMarketMetricsResult, m.getMarketMetricsError
}

func (m *mockClinicalKPIDB) GetShiftSnapshots(ctx context.Context, shiftTeamID int64) ([]*clinicalkpisql.GetShiftSnapshotsRow, error) {
	return m.getShiftSnapshotsResult, m.getShiftSnapshotsError
}

func (m *mockClinicalKPIDB) GetProviderShifts(ctx context.Context, args clinicalkpidb.GetProviderShiftsParams) (*clinicalkpidb.GetProviderShiftsResponse, error) {
	return m.getProviderShiftsResult, m.getProviderShiftsError
}

func (m *mockClinicalKPIDB) GetProviderMetrics(ctx context.Context, providerID int64) (*clinicalkpisql.GetProviderMetricsRow, error) {
	return m.getProviderMetricsResult, m.getProviderMetricsError
}

func (m *mockClinicalKPIDB) GetProvidersMetricsByMarket(ctx context.Context, args clinicalkpidb.GetProvidersMetricsByMarketParams) (*clinicalkpidb.GetProvidersMetricsByMarketResponse, error) {
	return m.getProvidersMetricsByMarketResult, m.getProvidersMetricsByMarketError
}

func (m *mockClinicalKPIDB) GetProviderDailyMetricsWithMarketGroupAveragesFromDate(ctx context.Context, args clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateParams) ([]*clinicalkpisql.GetProviderDailyMetricsWithMarketGroupAveragesFromDateRow, error) {
	return m.getProviderDailyMetricsWithMarketGroupAveragesFromDateResult, m.getProviderDailyMetricsWithMarketGroupAveragesFromDateErr
}

func (m *mockClinicalKPIDB) GetLastShiftSnapshots(ctx context.Context, providerID int64) ([]*clinicalkpisql.GetLastShiftSnapshotsRow, error) {
	return m.getLastShiftSnapshotsResult, m.getLastShiftSnapshotsErr
}

func (m *mockClinicalKPIDB) DeleteAllLeaderHubMetrics(ctx context.Context) error {
	return nil
}

func (m *mockClinicalKPIDB) SeedProviderMetrics(ctx context.Context, providerMetrics []*clinicalkpidb.ProviderMetrics) ([]*clinicalkpisql.ProviderMetric, error) {
	return nil, nil
}

func (m *mockClinicalKPIDB) SeedMarketProviderMetrics(ctx context.Context, providerMetrics []*clinicalkpidb.MarketProviderMetrics) ([]*clinicalkpisql.MarketProviderMetric, error) {
	return nil, nil
}

func (m *mockClinicalKPIDB) SeedMarketMetrics(ctx context.Context, markerMetrics []*clinicalkpidb.MarketMetrics) ([]*clinicalkpisql.MarketMetric, error) {
	return nil, nil
}

func (m *mockClinicalKPIDB) SeedProviderVisits(ctx context.Context, providerVisits []*clinicalkpidb.ProviderVisit) ([]*clinicalkpisql.ProviderVisit, error) {
	return nil, nil
}

func (m *mockClinicalKPIDB) SeedProviderShifts(ctx context.Context, providerShifts []*clinicalkpidb.ProviderShift) ([]*clinicalkpisql.ProviderShift, error) {
	return nil, nil
}

func (m *mockClinicalKPIDB) SeedShiftSnapshots(ctx context.Context, shiftSnapshots []*clinicalkpidb.ShiftSnapshot) ([]*clinicalkpisql.ShiftSnapshot, error) {
	return nil, m.seedShiftSnapshotsErr
}

func (m *mockClinicalKPIDB) SeedProviders(ctx context.Context, providers []*clinicalkpidb.Provider) (int64, error) {
	return 0, nil
}

func (m *mockClinicalKPIDB) SeedMarkets(ctx context.Context, markets []*clinicalkpidb.Market) (int64, error) {
	return m.seedMarketsResult, m.seedMarketsErr
}

func (m *mockClinicalKPIDB) UpdateProviderAvatars(ctx context.Context, val clinicalkpisql.UpdateProviderAvatarsParams) error {
	return m.UpdateProviderAvatarsErr
}

func (m *mockClinicalKPIDB) GetProviderAvatars(ctx context.Context) ([]*clinicalkpisql.GetProviderAvatarsRow, error) {
	return m.GetProviderAvatarsResult, m.GetProviderAvatarsErr
}

func (m *mockClinicalKPIDB) GetProviderMarketIDs(ctx context.Context, args int64) ([]int64, error) {
	return m.getProviderMarketIDsResult, m.getProviderMarketIDsError
}

func (m *mockClinicalKPIDB) SeedMarketGroups(ctx context.Context, marketGroups []clinicalkpidb.MarketGroup) ([]*clinicalkpisql.MarketGroup, error) {
	return m.seedMarketGroupsResult, m.seedMarketGroupsErr
}

func (m *mockClinicalKPIDB) SeedProviderDailyMetrics(ctx context.Context, metrics []clinicalkpidb.ProviderDailyMetrics) ([]*clinicalkpisql.ProviderDailyMetric, error) {
	return m.seedProviderDailyMetricsResult, m.seedProviderDailyMetricsErr
}

func (m *mockClinicalKPIDB) DeleteAllLookBackMetrics(ctx context.Context) error {
	return m.deleteAllLookBackMetricsErr
}

func (m *mockClinicalKPIDB) GetProviderMarkets(ctx context.Context, providerID int64) ([]*clinicalkpisql.Market, error) {
	return m.getProviderMarketsResult, m.getProviderMarketsError
}

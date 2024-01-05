package main

import (
	"context"
	"fmt"
	"math/rand"
	"strconv"
	"strings"
	"time"

	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpiconv"
	"github.com/*company-data-covered*/services/go/cmd/clinicalkpi-service/clinicalkpidb"
	clinicalkpisql "github.com/*company-data-covered*/services/go/pkg/generated/sql/clinicalkpi"
	"github.com/*company-data-covered*/services/go/pkg/pgtypes"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

const (
	jobTitleAPPConst                      = "APP"
	jobTitleDHMTConst                     = "DHMT"
	retrieveStationProvidersErrorTemplate = "failed retrieving station providers: %w"
	retrieveStationMarketsErrorTemplate   = "failed retrieving station markets: %w"
)

var (
	stationMarketIDs = []int64{159, 160, 161, 162, 164, 165, 166, 167, 168, 169, 170, 171, 172, 173, 174, 175, 176, 177, 178, 179, 180, 181, 185, 186, 188, 189, 190, 191, 192, 193, 194, 195, 196, 197, 198, 199, 200, 201, 202, 203, 204, 205, 206, 207, 208, 212, 213, 214, 215, 216, 217, 219, 220, 221, 222, 223, 250}
	shiftDayStages   = []int64{3, 1, 2, 3, 1, 2, 3, 4, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 1}
)

// SeedDBService demands what the seeding methods need from a DB implementation. Primarily for mocking purposes.
type SeedDBService interface {
	UpsertCalculatedProviderMetric(ctx context.Context, metric clinicalkpisql.UpsertCalculatedProviderMetricsParams) (*clinicalkpisql.CalculatedProviderMetric, error)
	AddActiveProviderForMarkets(ctx context.Context, val clinicalkpisql.AddActiveProviderForMarketsParams) error
	AddStagingProviderMetric(ctx context.Context, val clinicalkpisql.AddStagingProviderMetricParams) (*clinicalkpisql.StagingProviderMetric, error)
	DeleteAllStagingProviderMetrics(ctx context.Context) error
	DeleteAllLeaderHubMetrics(ctx context.Context) error
	SeedProviderMetrics(ctx context.Context, providerMetrics []*clinicalkpidb.ProviderMetrics) ([]*clinicalkpisql.ProviderMetric, error)
	SeedMarketProviderMetrics(ctx context.Context, providerMetrics []*clinicalkpidb.MarketProviderMetrics) ([]*clinicalkpisql.MarketProviderMetric, error)
	SeedMarketMetrics(ctx context.Context, markerMetrics []*clinicalkpidb.MarketMetrics) ([]*clinicalkpisql.MarketMetric, error)
	SeedProviderVisits(ctx context.Context, providerVisits []*clinicalkpidb.ProviderVisit) ([]*clinicalkpisql.ProviderVisit, error)
	SeedProviderShifts(ctx context.Context, providerShifts []*clinicalkpidb.ProviderShift) ([]*clinicalkpisql.ProviderShift, error)
	SeedShiftSnapshots(ctx context.Context, shiftBreakdowns []*clinicalkpidb.ShiftSnapshot) ([]*clinicalkpisql.ShiftSnapshot, error)
	SeedProviders(ctx context.Context, providers []*clinicalkpidb.Provider) (int64, error)
	SeedMarkets(ctx context.Context, markets []*clinicalkpidb.Market) (int64, error)
	SeedMarketGroups(ctx context.Context, marketGroups []clinicalkpidb.MarketGroup) ([]*clinicalkpisql.MarketGroup, error)
	SeedProviderDailyMetrics(ctx context.Context, metrics []clinicalkpidb.ProviderDailyMetrics) ([]*clinicalkpisql.ProviderDailyMetric, error)
	DeleteAllLookBackMetrics(ctx context.Context) error
}

func seedCalculatedMetrics(ctx context.Context, logger *zap.SugaredLogger, server *GRPCServer, clinicalkpiDB SeedDBService) error {
	logger.Info("Seeding Calculated Metrics")

	providers, err := server.getStationProviders(ctx, &StationProvidersParams{forwardAuth: false})
	if err != nil {
		return fmt.Errorf(retrieveStationProvidersErrorTemplate, err)
	}

	logger.Info("Provider Count: " + strconv.Itoa(len(providers)))

	marketIDsCount := len(stationMarketIDs)
	halfMarketIDsCount := marketIDsCount / 2
	for _, provider := range providers {
		if *provider.ProviderProfilePosition != providerPositionAPP && *provider.ProviderProfilePosition != providerPositionDHMT {
			continue
		}
		r := rand.New(rand.NewSource(provider.ID))
		careRequestsCompletedLastSevenDays := int32(r.Int() % 20)

		medianNps, _ := pgtypes.BuildNumeric(r.Float32() * 100)
		medianNpsChangeSign := (r.Int()%2)*-2 + 1
		medianNpsChange, _ := pgtypes.BuildNumeric(r.Float32() * 10 * float32(medianNpsChangeSign))

		surveyCaptureRate, _ := pgtypes.BuildNumeric(r.Float32() * 100)
		surveyCaptureRateChangeSign := (r.Int()%2)*-2 + 1
		surveyCaptureRateChange, _ := pgtypes.BuildNumeric(r.Float32() * 10 * float32(surveyCaptureRateChangeSign))

		chartClosureRate, _ := pgtypes.BuildNumeric(r.Float32() * 100)
		chartClosureRateChangeSign := (r.Int()%2)*-2 + 1
		chartClosureRateChange, _ := pgtypes.BuildNumeric(r.Float32() * 10 * float32(chartClosureRateChangeSign))

		medianOnSceneTimeSecs := r.Int31()%(60*60) + 20*60
		onSceneTimeSecsChangeSign := (r.Int()%2)*-2 + 1
		medianOnSceneTimeSecsChange := int32(r.Int() % (10 * 60) * onSceneTimeSecsChangeSign)

		_, err = clinicalkpiDB.UpsertCalculatedProviderMetric(ctx, clinicalkpisql.UpsertCalculatedProviderMetricsParams{
			ProviderID:                         provider.ID,
			CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
			AverageNetPromoterScore:            medianNps,
			AverageNetPromoterScoreChange:      medianNpsChange,
			SurveyCaptureRate:                  surveyCaptureRate,
			SurveyCaptureRateChange:            surveyCaptureRateChange,
			ChartClosureRate:                   chartClosureRate,
			ChartClosureRateChange:             chartClosureRateChange,
			MedianOnSceneTimeSecs:              sqltypes.ToValidNullInt32(medianOnSceneTimeSecs),
			MedianOnSceneTimeSecsChange:        sqltypes.ToValidNullInt32(medianOnSceneTimeSecsChange),
			ChangeDays:                         7,
			LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(time.Now().AddDate(0, 0, -(r.Int() % 90)).UTC()),
			CompletedCareRequests:              int32(*completedCareRequestsThreshold + 10),
		})
		if err != nil {
			logger.Infof("Failed seeding calculated for provider with ID: %d", provider.ID)
		}

		marketIDs := stationMarketIDs[r.Int()%halfMarketIDsCount : (r.Int()%halfMarketIDsCount)+halfMarketIDsCount]
		err := clinicalkpiDB.AddActiveProviderForMarkets(ctx, clinicalkpisql.AddActiveProviderForMarketsParams{
			ProviderID: provider.ID,
			MarketIds:  marketIDs,
		})
		if err != nil {
			logger.Errorf("Failed seeding active markets for provider with ID %d with error: %w", provider.ID, err)
		}
	}
	logger.Info("Seeding Complete - Calculated Metrics")

	return nil
}

func seedStagingMetrics(ctx context.Context, logger *zap.SugaredLogger, server *GRPCServer, clinicalkpiDB SeedDBService) error {
	logger.Info("Seeding Staging Metrics")

	providers, err := server.getStationProviders(ctx, &StationProvidersParams{forwardAuth: false})
	if err != nil {
		return fmt.Errorf(retrieveStationProvidersErrorTemplate, err)
	}

	logger.Infow("Providers", "count", len(providers))

	marketIDsCount := len(stationMarketIDs)
	halfMarketIDsCount := marketIDsCount / 2

	err = clinicalkpiDB.DeleteAllStagingProviderMetrics(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete all staging metrics: %w", err)
	}

	for _, provider := range providers {
		if *provider.ProviderProfilePosition != providerPositionAPP && *provider.ProviderProfilePosition != providerPositionDHMT {
			continue
		}
		r := rand.New(rand.NewSource(provider.ID))
		careRequestsCompletedLastSevenDays := int32(r.Int() % 20)
		medianNps, _ := pgtypes.BuildNumeric(r.Float32() * 100)
		surveyCaptureRate, _ := pgtypes.BuildNumeric(r.Float32() * 100)
		chartClosureRate, _ := pgtypes.BuildNumeric(r.Float32() * 100)
		medianOnSceneTimeSecs := r.Int31()%(60*60) + 20*60

		marketIDs := stationMarketIDs[r.Int()%halfMarketIDsCount : (r.Int()%halfMarketIDsCount)+halfMarketIDsCount]
		marketIDStrings := make([]string, len(marketIDs))
		for i, mid := range marketIDs {
			marketIDStrings[i] = fmt.Sprint(mid)
		}

		_, err = clinicalkpiDB.AddStagingProviderMetric(ctx, clinicalkpisql.AddStagingProviderMetricParams{
			ProviderID:                         provider.ID,
			CareRequestsCompletedLastSevenDays: careRequestsCompletedLastSevenDays,
			AverageNetPromoterScore:            medianNps,
			SurveyCaptureRate:                  surveyCaptureRate,
			ChartClosureRate:                   chartClosureRate,
			MedianOnSceneTimeSecs:              sqltypes.ToValidNullInt32(medianOnSceneTimeSecs),
			LastCareRequestCompletedAt:         sqltypes.ToValidNullTime(time.Now().AddDate(0, 0, -(r.Int() % 90)).UTC()),
			MarketIds:                          sqltypes.ToValidNullString(strings.Join(marketIDStrings, "|")),
			CompletedCareRequests:              int32(*completedCareRequestsThreshold + 10),
		})
		if err != nil {
			logger.Infof("Failed seeding staging for provider with ID: %d", provider.ID)
		}
	}
	logger.Info("Seeding Complete - Staging Metrics")

	return nil
}

type ProviderMetrics struct {
	ProviderID                int64
	MarketID                  int64
	OnSceneTimeMedianSeconds  int32
	ChartClosureRateAverage   float64
	SurveyCaptureRateAverage  float64
	NetPromoterScoreAverage   float64
	OnTaskPercentAverage      float64
	EscalationRateAverage     float64
	AbxPrescribingRateAverage float64
}

func providerProfilePositionToJobTitle(position *string) *string {
	if position == nil {
		return nil
	}
	if *position == providerPositionAPP {
		return proto.String(jobTitleAPPConst)
	}
	if *position == providerPositionDHMT {
		return proto.String(jobTitleDHMTConst)
	}
	return nil
}

func seedLeaderHubMetrics(ctx context.Context, logger *zap.SugaredLogger, server *GRPCServer, clinicalkpiDB SeedDBService) error {
	logger.Info("Seeding Leader Hub Metrics")

	providers, err := server.getStationProviders(ctx, &StationProvidersParams{forwardAuth: false})
	if err != nil {
		return fmt.Errorf(retrieveStationProvidersErrorTemplate, err)
	}
	markets, err := server.getStationMarkets(ctx, false)
	if err != nil {
		return fmt.Errorf(retrieveStationMarketsErrorTemplate, err)
	}

	logger.Infow("Providers", "count", len(providers))

	err = clinicalkpiDB.DeleteAllLeaderHubMetrics(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete all leader hub metrics: %w", err)
	}

	logger.Info("Leader Hub tables were cleared")

	countProvidersInMarket := len(providers) / (len(markets) - 1)
	providerMetrics := make(map[int]*ProviderMetrics, len(providers))
	var providerMetricsToSave []*clinicalkpidb.ProviderMetrics
	var marketProviderMetricsToSave []*clinicalkpidb.MarketProviderMetrics
	for i, provider := range providers {
		if provider.ProviderProfilePosition == nil || *provider.ProviderProfilePosition != providerPositionAPP && *provider.ProviderProfilePosition != providerPositionDHMT {
			continue
		}

		r := rand.New(rand.NewSource(provider.ID))
		providerMetrics[i] = &ProviderMetrics{
			ProviderID:                provider.ID,
			MarketID:                  markets[i/countProvidersInMarket].ID,
			OnSceneTimeMedianSeconds:  int32(r.Intn(30) + 29),
			ChartClosureRateAverage:   r.Float64()*30 + 69,
			SurveyCaptureRateAverage:  r.Float64()*30 + 69,
			NetPromoterScoreAverage:   r.Float64()*30 + 69,
			OnTaskPercentAverage:      r.Float64()*30 + 69,
			EscalationRateAverage:     r.Float64() * 17,
			AbxPrescribingRateAverage: r.Float64() * 25,
		}
		providerMetricsToSave = append(providerMetricsToSave, &clinicalkpidb.ProviderMetrics{
			ProviderID:                provider.ID,
			OnSceneTimeMedianSeconds:  providerMetrics[i].OnSceneTimeMedianSeconds,
			ChartClosureRateAverage:   providerMetrics[i].ChartClosureRateAverage,
			SurveyCaptureRateAverage:  providerMetrics[i].SurveyCaptureRateAverage,
			NetPromoterScoreAverage:   providerMetrics[i].NetPromoterScoreAverage,
			OnTaskPercentAverage:      providerMetrics[i].OnTaskPercentAverage,
			EscalationRateAverage:     providerMetrics[i].EscalationRateAverage,
			AbxPrescribingRateAverage: providerMetrics[i].AbxPrescribingRateAverage,
		})
		marketProviderMetricsToSave = append(marketProviderMetricsToSave, &clinicalkpidb.MarketProviderMetrics{
			ProviderID:                   provider.ID,
			MarketID:                     providerMetrics[i].MarketID,
			OnSceneTimeMedianSeconds:     providerMetrics[i].OnSceneTimeMedianSeconds,
			OnSceneTimeWeekChangeSeconds: int32(r.Intn(10) - 5),
			ChartClosureRate:             providerMetrics[i].ChartClosureRateAverage,
			ChartClosureRateWeekChange:   r.Float64()*10 - 5,
			SurveyCaptureRate:            providerMetrics[i].SurveyCaptureRateAverage,
			SurveyCaptureRateWeekChange:  r.Float64()*10 - 5,
			NetPromoterScoreAverage:      providerMetrics[i].NetPromoterScoreAverage,
			NetPromoterScoreWeekChange:   r.Float64()*10 - 5,
			OnTaskPercent:                providerMetrics[i].OnTaskPercentAverage,
			OnTaskPercentWeekChange:      r.Float64()*10 - 5,
		})
	}

	var marketMetricsToSave []*clinicalkpidb.MarketMetrics
	for _, market := range markets {
		r := rand.New(rand.NewSource(market.ID))
		marketMetricsToSave = append(marketMetricsToSave, &clinicalkpidb.MarketMetrics{
			MarketID:                     market.ID,
			OnSceneTimeMedianSeconds:     int32(r.Int()*30 + 29),
			OnSceneTimeWeekChangeSeconds: int32(r.Int()*10 - 5),
			ChartClosureRate:             r.Float64()*30 + 69,
			ChartClosureRateWeekChange:   r.Float64()*10 - 5,
			SurveyCaptureRate:            r.Float64()*30 + 69,
			SurveyCaptureRateWeekChange:  r.Float64()*10 - 5,
			NetPromoterScoreAverage:      r.Float64()*30 + 69,
			NetPromoterScoreWeekChange:   r.Float64()*10 - 5,
		})
	}

	var providerVisitsToSave []*clinicalkpidb.ProviderVisit
	for i, provider := range providers {
		r := rand.New(rand.NewSource(provider.ID))
		for j := range [20]int{} {
			providerVisitsToSave = append(providerVisitsToSave, &clinicalkpidb.ProviderVisit{
				ProviderID:       provider.ID,
				CareRequestID:    int64(i*100 + j),
				PatientFirstName: "Patient",
				PatientLastName:  "Name",
				PatientAthenaID:  "12312",
				ServiceDate:      time.Now().Add(-24 * time.Hour),
				ChiefComplaint:   "Skin infection (cellulitis)",
				Diagnosis:        "LLE Cellulitis w failure of outpatient tx.",
				IsAbxPrescribed:  r.Intn(100) > 90,
				AbxDetails:       "some abx details",
				IsEscalated:      r.Intn(100) > 90,
				EscalatedReason:  "some escalation reason",
			})
		}
	}

	providerShiftsToSave, shiftSnapshotsToSave, err := generateShiftsAndSnapshots(providers)
	if err != nil {
		return err
	}

	var providersToSave []*clinicalkpidb.Provider
	for _, provider := range providers {
		jobTitle := providerProfilePositionToJobTitle(provider.ProviderProfilePosition)
		if jobTitle != nil {
			providersToSave = append(providersToSave, &clinicalkpidb.Provider{
				ProviderID: provider.ID,
				FirstName:  provider.FirstName,
				LastName:   provider.LastName,
				AvatarURL:  provider.ProviderImageTinyURL,
				JobTitle:   jobTitle,
			})
		}
	}

	var marketsToSave []*clinicalkpidb.Market
	for _, market := range markets {
		marketsToSave = append(marketsToSave, &clinicalkpidb.Market{
			MarketID:  market.ID,
			Name:      market.Name,
			ShortName: market.ShortName,
		})
	}

	_, err = clinicalkpiDB.SeedProviderMetrics(ctx, providerMetricsToSave)
	if err != nil {
		return fmt.Errorf("failed to save leader hub provider metrics: %w", err)
	}

	_, err = clinicalkpiDB.SeedMarketProviderMetrics(ctx, marketProviderMetricsToSave)
	if err != nil {
		return fmt.Errorf("failed to save leader hub market provider metrics: %w", err)
	}

	_, err = clinicalkpiDB.SeedMarketMetrics(ctx, marketMetricsToSave)
	if err != nil {
		return fmt.Errorf("failed to save leader hub market metrics: %w", err)
	}

	_, err = clinicalkpiDB.SeedProviderVisits(ctx, providerVisitsToSave)
	if err != nil {
		return fmt.Errorf("failed to save leader hub provider visits: %w", err)
	}

	_, err = clinicalkpiDB.SeedProviderShifts(ctx, providerShiftsToSave)
	if err != nil {
		return fmt.Errorf("failed to save leader hub provider shifts: %w", err)
	}

	_, err = clinicalkpiDB.SeedProviders(ctx, providersToSave)
	if err != nil {
		return fmt.Errorf("failed to save providers: %w", err)
	}

	_, err = clinicalkpiDB.SeedMarkets(ctx, marketsToSave)
	if err != nil {
		return fmt.Errorf("failed to save markets: %w", err)
	}

	_, err = clinicalkpiDB.SeedShiftSnapshots(ctx, shiftSnapshotsToSave)
	if err != nil {
		return fmt.Errorf("failed to save leader hub provider shift breakdowns: %w", err)
	}

	logger.Info("Seeding Complete - Leader Hub Metrics")

	return nil
}

func generateShiftsAndSnapshots(providers []StationProvider) ([]*clinicalkpidb.ProviderShift, []*clinicalkpidb.ShiftSnapshot, error) {
	var providerShiftsToSave []*clinicalkpidb.ProviderShift
	var providerShiftBreakdownsToSave []*clinicalkpidb.ShiftSnapshot
	for i, provider := range providers {
		r := rand.New(rand.NewSource(provider.ID))
		for j := range [20]int{} {
			shiftTeamID := int64(i*100 + j + 1)

			providerShiftsToSave = append(providerShiftsToSave, &clinicalkpidb.ProviderShift{
				ProviderID:                provider.ID,
				ShiftTeamID:               shiftTeamID,
				ServiceDate:               time.Now().Add(time.Duration(-24*(j+1)) * time.Hour),
				StartTime:                 time.Now().Add(-1 * time.Hour),
				EndTime:                   time.Now().Add(1 * time.Hour),
				PatientsSeen:              int32(r.Intn(4) + 5),
				OutTheDoorDurationSeconds: int32(r.Intn(16) + 4),
				EnRouteDurationSeconds:    int32(r.Intn(30) + 150),
				OnSceneDurationSeconds:    int32(r.Intn(30) + 210),
				OnBreakDurationSeconds:    int32(r.Intn(15) + 25),
				IdleDurationSeconds:       int32(r.Intn(25) + 5),
			})

			r := rand.New(rand.NewSource(shiftTeamID))

			startTime, err := time.Parse("2006-01-02 15:04", "2023-05-25 0"+strconv.Itoa(r.Intn(4)+5)+":00")
			if err != nil {
				return nil, nil, fmt.Errorf("failed to parswe start time for breakdown: %w", err)
			}
			duration := randomDurationMinutes(2, r)
			endTime := startTime.Add(duration)
			providerShiftBreakdownsToSave = append(providerShiftBreakdownsToSave, &clinicalkpidb.ShiftSnapshot{
				ShiftTeamID:              shiftTeamID,
				StartTimestamp:           startTime,
				EndTimestamp:             endTime,
				ShiftSnapshotPhaseTypeID: 2,
			})

			for _, stage := range shiftDayStages {
				startTime = endTime
				duration = randomDurationMinutes(stage, r)
				endTime = startTime.Add(duration)
				providerShiftBreakdownsToSave = append(providerShiftBreakdownsToSave, &clinicalkpidb.ShiftSnapshot{
					ShiftTeamID:              shiftTeamID,
					StartTimestamp:           startTime,
					EndTimestamp:             endTime,
					ShiftSnapshotPhaseTypeID: stage,
				})
			}
		}
	}

	return providerShiftsToSave, providerShiftBreakdownsToSave, nil
}

func randomDurationMinutes(stage int64, r *rand.Rand) time.Duration {
	switch stage {
	case 2:
		return time.Duration(r.Intn(15)+15) * time.Minute
	case 3:
		return time.Duration(r.Intn(15)+30) * time.Minute
	case 4:
		return time.Duration(r.Intn(25)+10) * time.Minute
	case 1:
		return time.Duration(r.Intn(10)+5) * time.Minute
	default:
		return 0
	}
}

func generateOnShiftSeconds(patientsSeen int32, r *rand.Rand) int32 {
	return 60 * patientsSeen * (50 + r.Int31n(30))
}

func generateProviderDailyMetrics(providerID int64, marketID int64, serviceDate time.Time, r *rand.Rand) clinicalkpidb.ProviderDailyMetrics {
	patientsSeen := int32(r.Intn(10))
	return clinicalkpidb.ProviderDailyMetrics{
		ProviderID:             providerID,
		MarketID:               marketID,
		ServiceDate:            serviceDate,
		PatientsSeen:           patientsSeen,
		OnShiftDurationSeconds: generateOnShiftSeconds(patientsSeen, r),
	}
}

func seedLookBackDailyMetrics(ctx context.Context, logger *zap.SugaredLogger, server *GRPCServer, clinicalkpiDB SeedDBService) error {
	logger.Info("Seeding Look Back Daily Metrics")

	providers, err := server.getStationProviders(ctx, &StationProvidersParams{forwardAuth: false})
	if err != nil {
		return fmt.Errorf(retrieveStationProvidersErrorTemplate, err)
	}

	logger.Infow("Providers", "count", len(providers))

	stationMarkets, err := server.getStationMarkets(ctx, false)
	if err != nil {
		return fmt.Errorf(retrieveStationMarketsErrorTemplate, err)
	}

	logger.Infow("Markets", "count", len(stationMarkets))

	err = clinicalkpiDB.DeleteAllLookBackMetrics(ctx)
	if err != nil {
		return fmt.Errorf("failed to delete all Look Back metrics: %w", err)
	}
	logger.Info("Look Back tables were cleared")

	marketsByState := make(map[string][]StationMarket, len(stationMarkets))
	for _, market := range stationMarkets {
		marketsByState[market.State] = append(marketsByState[market.State], market)
	}

	markets := make([]*clinicalkpidb.Market, 0, len(stationMarkets))
	marketGroups := make([]clinicalkpidb.MarketGroup, 0, len(marketsByState))
	marketGroupIndex := 0
	for _, marketGroup := range marketsByState {
		marketGroupID := int64(marketGroupIndex + 1)
		marketNames := make([]string, len(marketGroup))
		for i, market := range marketGroup {
			markets = append(markets, &clinicalkpidb.Market{
				MarketID:      market.ID,
				Name:          market.Name,
				ShortName:     market.ShortName,
				MarketGroupID: &marketGroupID,
			})
			marketNames[i] = market.Name
		}
		marketGroups = append(marketGroups, clinicalkpidb.MarketGroup{
			MarketGroupID: marketGroupID,
			Name:          strings.Join(marketNames, "|"),
		})
		marketGroupIndex++
	}

	now := time.Now()
	r := rand.New(rand.NewSource(now.Unix()))

	startDate := clinicalkpiconv.TimestampToDate(now).AddDate(0, 0, -lookBackShiftsTrendDays)

	providerDailyMetrics := make([]clinicalkpidb.ProviderDailyMetrics, 0, len(providers)*lookBackShiftsTrendDays)
	for _, provider := range providers {
		if *provider.ProviderProfilePosition != providerPositionAPP && *provider.ProviderProfilePosition != providerPositionDHMT {
			continue
		}

		marketID := markets[r.Intn(len(markets))].MarketID
		for n := 0; n < lookBackShiftsTrendDays; n++ {
			currentDate := startDate.AddDate(0, 0, n)
			firstProviderDailyMetrics := generateProviderDailyMetrics(provider.ID, marketID, currentDate, r)
			providerDailyMetrics = append(providerDailyMetrics, firstProviderDailyMetrics)

			secondMarketID := markets[r.Intn(len(markets))].MarketID
			if marketID != secondMarketID && r.Intn(10) > 7 {
				secondProviderDailyMetrics := generateProviderDailyMetrics(provider.ID, secondMarketID, currentDate, r)
				providerDailyMetrics = append(providerDailyMetrics, secondProviderDailyMetrics)
			}
		}
	}

	providerShiftsToSave, shiftSnapshotsToSave, err := generateShiftsAndSnapshots(providers)
	if err != nil {
		return err
	}

	_, err = clinicalkpiDB.SeedMarketGroups(ctx, marketGroups)
	if err != nil {
		return fmt.Errorf("failed to save market groups: %w", err)
	}

	_, err = clinicalkpiDB.SeedMarkets(ctx, markets)
	if err != nil {
		return fmt.Errorf("failed to save markets: %w", err)
	}

	_, err = clinicalkpiDB.SeedProviderDailyMetrics(ctx, providerDailyMetrics)
	if err != nil {
		return fmt.Errorf("failed to save provider daily metrics: %w", err)
	}

	_, err = clinicalkpiDB.SeedProviderShifts(ctx, providerShiftsToSave)
	if err != nil {
		return fmt.Errorf("failed to save provider shifts: %w", err)
	}

	_, err = clinicalkpiDB.SeedShiftSnapshots(ctx, shiftSnapshotsToSave)
	if err != nil {
		return fmt.Errorf("failed to save shift snapshots: %w", err)
	}

	logger.Info("Seeding Complete - Look Back Daily Metrics")

	return nil
}

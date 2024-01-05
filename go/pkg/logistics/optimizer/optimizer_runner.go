package optimizer

import (
	"context"
	"errors"
	"fmt"
	"os"
	"sort"
	"sync"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/collections"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/logistics/validation"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"

	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

const (
	runsMeasurementName = "runs"

	optimizerConfigTag       = "optimizer_config"
	serviceDateTag           = "service_date"
	serviceRegionTag         = "service_region"
	terminationDurationMsTag = "termination_duration_ms"

	durationMsField          = "duration_ms"
	errorField               = "error"
	feasibilityField         = "feasibility"
	feasibleSolutionsField   = "feasible_solutions"
	infeasibleSolutionsField = "infeasible_solutions"
	pinnedVisitsField        = "pinned_visits"
	shiftTeamsField          = "shift_teams"
	unassignedVisitsField    = "unassigned_visits"
	visitsField              = "visits"

	dateLayout = "2006-01-02"

	defaultRestBreakDuration = 30 * time.Minute
)

var (
	DefaultConstraintConfig = &ConstraintConfig{
		basis: &optimizerpb.VRPConstraintConfig{
			WorkDistribution: DefaultWorkDistributionConfig,
			LateArrival:      DefaultLateArrivalConfig,
			ClinicalUrgency:  DefaultClinicalUrgencyConfig,
			DepotLateArrival: DefaultDepotArrivalConfig,
		},
	}
	DefaultLateArrivalConfig = &optimizerpb.VRPConstraintConfig_LateArrivalConstraintConfig{
		HardLatenessThresholdMs: uint64((30 * time.Minute).Milliseconds()),
		Policy: &optimizerpb.VRPConstraintConfig_LateArrivalConstraintConfig_LinearOffsetPolicy_{
			LinearOffsetPolicy: &optimizerpb.VRPConstraintConfig_LateArrivalConstraintConfig_LinearOffsetPolicy{
				LatenessCostUsdMillsPerMs:    0.0835,
				OffsetPriorToTimeWindowEndMs: uint64(time.Hour.Milliseconds()),
			}}}

	DefaultWorkDistributionConfig = &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig{
		Policy: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig_ExponentialPolicy_{
			ExponentialPolicy: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig_ExponentialPolicy{
				BaseNumerator:               2,
				BaseDenominator:             1,
				FullQueueValueLimitUsdMills: 250000,
			}}}

	DefaultClinicalUrgencyConfig = &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig{
		HigherLevelValueWins: true,
		Policy: &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig_LinearOffsetPolicy_{
			LinearOffsetPolicy: &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig_LinearOffsetPolicy{
				LatenessCostUsdMillsPerMs:       0.0833,
				OffsetPriorToUrgencyWindowEndMs: uint64(time.Hour.Milliseconds()),
			},
		},
	}

	DefaultDepotArrivalConfig = &optimizerpb.VRPConstraintConfig_DepotLateArrivalConstraintConfig{
		HardLatenessThresholdMs: (30 * time.Minute).Milliseconds(),
		Policy: &optimizerpb.VRPConstraintConfig_DepotLateArrivalConstraintConfig_LinearOffsetPolicy_{
			LinearOffsetPolicy: &optimizerpb.VRPConstraintConfig_DepotLateArrivalConstraintConfig_LinearOffsetPolicy{
				LatenessCostUsdMillsPerMs:   0.0833,
				OffsetPriorToDepotDueTimeMs: time.Hour.Milliseconds(),
			},
		},
	}

	vrpRequestMarshall = protojson.MarshalOptions{
		UseProtoNames: true,
	}
)

type ConstraintConfig struct {
	basis *optimizerpb.VRPConstraintConfig
}

func (cc ConstraintConfig) ToProto() *optimizerpb.VRPConstraintConfig {
	return cc.basis
}

func (cc ConstraintConfig) WithDisallowedLateArrivalVisitIds(visitIDs ...int64) *ConstraintConfig {
	config := &ConstraintConfig{
		basis: proto.Clone(cc.basis).(*optimizerpb.VRPConstraintConfig),
	}
	if config.basis.DepotLateArrival != nil {
		config.basis.DepotLateArrival.DisallowedLateArrivalVisitIds = visitIDs
	}
	return config
}

func (cc ConstraintConfig) WithOptimizerSettings(settings optimizersettings.Settings) ConstraintConfig {
	// TODO(MARK-2295): Move time parsing to this function.
	config := ConstraintConfig{
		basis: proto.Clone(cc.basis).(*optimizerpb.VRPConstraintConfig),
	}

	clinicalUrgencyConfig := settings.ClinicalUrgencyConfig()
	if clinicalUrgencyConfig != nil {
		config.basis.ClinicalUrgency = clinicalUrgencyConfig
	}

	workDistributionConfig := settings.WorkDistributionConfig()
	if workDistributionConfig != nil {
		config.basis.WorkDistribution = workDistributionConfig
	}

	opportunityCostConfig := settings.OpportunityCostConfig()
	if opportunityCostConfig != nil {
		config.basis.OpportunityCost = opportunityCostConfig
	}

	return config
}

type VisitLatenessToleranceOverridesParams struct {
	VRPVisits                  []*optimizerpb.VRPVisit
	VisitArrivalTimestamps     map[int64]time.Time
	FeasibilityCheckVisitIDs   []int64
	DefaultLatenessThresholdMs int64
	ShiftTeamStartBufferSec    int64
}

func (cc ConstraintConfig) WithVisitLatenessToleranceOverrides(params VisitLatenessToleranceOverridesParams) *ConstraintConfig {
	config := &ConstraintConfig{
		basis: proto.Clone(cc.basis).(*optimizerpb.VRPConstraintConfig),
	}
	if config.basis.LateArrival == nil {
		config.basis.LateArrival = &optimizerpb.VRPConstraintConfig_LateArrivalConstraintConfig{}
	}

	visitLatenessToleranceOverrides := make([]*optimizerpb.VRPVisitLatenessTolerance, 0, len(params.VRPVisits))

	// Check feasibility visits should not be allowed to be late.
	for _, visitID := range params.FeasibilityCheckVisitIDs {
		visitLatenessTolerance := &optimizerpb.VRPVisitLatenessTolerance{
			VisitId:                 visitID,
			HardLatenessThresholdMs: uint64(params.DefaultLatenessThresholdMs),
		}
		visitLatenessToleranceOverrides = append(visitLatenessToleranceOverrides, visitLatenessTolerance)
	}

	shiftTeamStartBufferDuration := time.Duration(params.ShiftTeamStartBufferSec) * time.Second
	for _, visit := range params.VRPVisits {
		endTimestampSec := visit.ArrivalTimeWindow.EndTimestampSec
		if endTimestampSec == nil {
			continue
		}

		endTimestamp := time.Unix(*endTimestampSec, 0)
		arrivalTimestamp, ok := params.VisitArrivalTimestamps[*visit.Id]
		if !ok {
			// Feasibility check visits don't have arrival timestamps.
			continue
		}
		// We shift all arrival timestamps forward because Shift Teams starts are all shifted
		// by this shiftTeamStartBuffer in VRP Problem for check feasibility
		arrivalTimestamp = arrivalTimestamp.Add(shiftTeamStartBufferDuration)

		// Visits not already late should not be allowed to become too late.
		latenessThresholdMs := params.DefaultLatenessThresholdMs

		// Visits that are already late should not be allowed to get any later.
		if arrivalTimestamp.After(endTimestamp) {
			latenessThresholdMs = arrivalTimestamp.Sub(endTimestamp).Milliseconds()
		}

		visitLatenessToleranceOverrides = append(visitLatenessToleranceOverrides, &optimizerpb.VRPVisitLatenessTolerance{
			VisitId:                 *visit.Id,
			HardLatenessThresholdMs: uint64(latenessThresholdMs),
		})
	}

	config.basis.LateArrival.VisitLatenessToleranceOverrides = visitLatenessToleranceOverrides

	return config
}

// TODO(MARK-2601): Refactor: Correctly name the schedule runner structs and fields before market availability release.
type runInstanceSettingsMap map[RunInstanceKey]*SettingsConfig

type availabilityRunInstanceSettingsMap map[RunInstanceKey]*AvailabilitySettingsConfig

type RunnerLogisticsDB interface {
	SolveVRPLogisticsDB

	GetOptimizerConfigsByIDs(ctx context.Context, configIDs []int64) (map[int64]*logisticssql.OptimizerConfig, error)
	GetServiceRegionByID(ctx context.Context, serviceRegionID int64) (*logisticssql.ServiceRegion, error)
	HasAnyNewInfoInRegionDateSinceLastRun(ctx context.Context, params logisticsdb.HasNewInfoParams) (*logisticsdb.NewRegionInfo, error)
	HasAnyNewScheduleSinceLastAvailabilityRun(ctx context.Context, params logisticsdb.HasNewScheduleParams) (bool, error)
	CreateVRPProblem(ctx context.Context, params logisticsdb.VRPProblemParams) (*logisticsdb.VRPProblemData, error)
	GetServiceRegionVRPData(ctx context.Context, params *logisticsdb.ServiceRegionVRPDataParams) (*logisticsdb.ServiceRegionVRPData, error)
	GetLatestAvailabilityVisitsInRegion(ctx context.Context, serviceRegionID int64) ([]*logisticssql.ServiceRegionAvailabilityVisit, error)
	GetAvailabilityAttributesByVisitID(ctx context.Context, visitIDs []int64) (map[int64][]*logisticssql.Attribute, error)
	GetAttributesForNames(ctx context.Context, attrNames []string) ([]*logisticssql.Attribute, error)
	AddServiceRegionAvailabilityVisitsTransactionally(ctx context.Context, params *logisticsdb.AddServiceRegionAvailabilityVisitsTransactionallyParams) ([]*logisticssql.ServiceRegionAvailabilityVisit, []*logisticssql.ServiceRegionAvailabilityVisitAttribute, error)
	VisitArrivalTimestampsForSchedule(ctx context.Context, scheduleID int64) (map[int64]time.Time, error)
}

type RunResult struct {
	OriginalDescription *optimizerpb.VRPDescription
	Responses           []*WrappedSolveVRPResp
}

type RunnerVRPSolver interface {
	SolveVRP(ctx context.Context, solveVRPParams *SolveVRPParams) (<-chan *WrappedSolveVRPResp, error)
}

type Runner struct {
	VRPSolver            RunnerVRPSolver
	ldb                  RunnerLogisticsDB
	settingsPollInterval time.Duration
	optimizerConn        *grpc.ClientConn
	logger               *zap.SugaredLogger
	metrics              monitoring.Scope
	settingsService      optimizersettings.Service

	mx                              sync.RWMutex
	instanceSettingsMap             runInstanceSettingsMap
	availabilityInstanceSettingsMap availabilityRunInstanceSettingsMap
	availabilityRunnerDebug         bool
}

type SettingsConfig struct {
	ServiceRegionID int64
	Settings        optimizersettings.Settings
	Config          *logisticssql.OptimizerConfig
}

func (c *SettingsConfig) TerminationDurationMs() int64 {
	if c.Settings.OptimizerTerminationDurationMs > 0 {
		return c.Settings.OptimizerTerminationDurationMs
	}

	return c.Config.TerminationDurationMs
}

type AvailabilitySettingsConfig struct {
	ServiceRegionID int64
	Settings        optimizersettings.AvailabilitySettings
	OptimizerConfig *logisticssql.OptimizerConfig
}

func (c *AvailabilitySettingsConfig) TerminationDurationMs() int64 {
	if c.Settings.OptimizerTerminationDurationMs > 0 {
		return c.Settings.OptimizerTerminationDurationMs
	}

	return c.OptimizerConfig.TerminationDurationMs
}

func NewRunner(ldb RunnerLogisticsDB, optimizerConn *grpc.ClientConn, logger *zap.SugaredLogger, metrics monitoring.Scope, settingsPollInterval time.Duration, settingsService optimizersettings.Service) *Runner {
	return &Runner{
		VRPSolver: &VRPSolver{
			OptimizerServiceClient: optimizerpb.NewOptimizerServiceClient(optimizerConn),
			SolveVRPLogisticsDB:    ldb,
			RouteProvider:          nil,
		},
		ldb:                  ldb,
		settingsPollInterval: settingsPollInterval,
		optimizerConn:        optimizerConn,
		logger:               logger.Named("optimizer_runner"),
		metrics:              metrics,
		settingsService:      settingsService,

		instanceSettingsMap:             runInstanceSettingsMap{},
		availabilityInstanceSettingsMap: availabilityRunInstanceSettingsMap{},
		availabilityRunnerDebug:         os.Getenv("DEBUG_ENABLE_CHECK_FEASIBILITY_DIAGNOSTICS") == "true",
	}
}

func (r *Runner) Start(ctx context.Context) {
	go func() {
		for {
			r.populateInstanceSettings(ctx)

			select {
			case <-ctx.Done():
				return

			case <-time.After(r.settingsPollInterval):
				continue
			}
		}
	}()
}

func (r *Runner) getServiceRegionAndBaseServiceDate(
	ctx context.Context,
	serviceRegionID int64,
	now time.Time) (*logisticssql.ServiceRegion, *time.Time, error) {
	logger := r.logger.With("service_region_id", serviceRegionID)
	serviceRegion, err := r.ldb.GetServiceRegionByID(ctx, serviceRegionID)
	if err != nil {
		logger.Errorw("cannot get service region", zap.Error(err))
		return nil, nil, err
	}
	logger = logger.With("service_region", serviceRegion.Description)

	tzLoc, err := time.LoadLocation(serviceRegion.IanaTimeZoneName)
	if err != nil {
		logger.Errorw("unable to load timezone",
			"timezone", serviceRegion.IanaTimeZoneName,
			zap.Error(err))
		return nil, nil, err
	}

	serviceRegionNow := now.In(tzLoc)
	baseServiceDate := TimestampToDate(serviceRegionNow)

	return serviceRegion, &baseServiceDate, nil
}

type AllInstancesMap struct {
	OptimizerRegionSettingsMap    runInstanceSettingsMap
	AvailabilityRegionSettingsMap availabilityRunInstanceSettingsMap
}

func (r *Runner) getAllInstanceSettingsMap(ctx context.Context, now time.Time) (*AllInstancesMap, error) {
	allSettings, err := r.settingsService.AllSettings(ctx)
	if err != nil {
		r.logger.Errorw("Could not get all the settings from the settings-service", zap.Error(err))
		return nil, err
	}

	optimizerRegionSettingsMap := allSettings.OptimizerRegionSettingsMap

	optimizerConfigIDs := collections.NewLinkedInt64Set(len(optimizerRegionSettingsMap))
	for _, settings := range optimizerRegionSettingsMap {
		optimizerConfigIDs.Add(settings.OptimizerConfigID)
	}
	optimizerConfigMap, err := r.ldb.GetOptimizerConfigsByIDs(ctx, optimizerConfigIDs.Elems())
	if err != nil {
		r.logger.Errorw("Could not load optimizer configs", zap.Error(err))
		return nil, err
	}

	baseServiceDateByRegions := map[int64]*time.Time{}
	scheduleInstancesMap := runInstanceSettingsMap{}
	for serviceRegionID, optSettings := range optimizerRegionSettingsMap {
		serviceRegion, baseServiceDate, err := r.getServiceRegionAndBaseServiceDate(ctx, serviceRegionID, now)
		if err != nil {
			return nil, err
		}
		baseServiceDateByRegions[serviceRegion.ID] = baseServiceDate

		for i := 0; i < int(optSettings.OptimizeHorizonDays); i++ {
			serviceDate := baseServiceDate.AddDate(0, 0, i)
			scheduleInstancesMap[RunInstanceKey{
				serviceRegionID: serviceRegion.ID,
				serviceDate:     serviceDate,
			}] = &SettingsConfig{
				ServiceRegionID: serviceRegion.ID,
				Settings:        optSettings,
				Config:          optimizerConfigMap[optSettings.OptimizerConfigID],
			}
		}
	}

	availabilityInstancesMap := availabilityRunInstanceSettingsMap{}
	for serviceRegionID, availSettings := range allSettings.AvailabilityRegionSettingsMap {
		optSettings, ok := optimizerRegionSettingsMap[serviceRegionID]
		if !ok {
			r.logger.Errorw("Availability region settings id not found in Optimizer settings",
				"service_region_id", serviceRegionID)
			return nil, errors.New("inconsistent settings")
		}

		for i := 0; i < int(optSettings.OptimizeHorizonDays); i++ {
			serviceDate := baseServiceDateByRegions[serviceRegionID].AddDate(0, 0, i)
			availabilityInstancesMap[RunInstanceKey{
				serviceRegionID: serviceRegionID,
				serviceDate:     serviceDate,
				horizonDay:      i,
			}] = &AvailabilitySettingsConfig{
				ServiceRegionID: serviceRegionID,
				Settings:        availSettings,
				OptimizerConfig: optimizerConfigMap[optSettings.OptimizerConfigID],
			}
		}
	}

	return &AllInstancesMap{
		OptimizerRegionSettingsMap:    scheduleInstancesMap,
		AvailabilityRegionSettingsMap: availabilityInstancesMap,
	}, nil
}

func newInstanceKeys[V any](newInstances, oldInstances map[RunInstanceKey]V) []RunInstanceKey {
	var newRunnerInstanceKeys []RunInstanceKey
	for instanceKey := range newInstances {
		_, ok := oldInstances[instanceKey]
		if !ok {
			newRunnerInstanceKeys = append(newRunnerInstanceKeys, instanceKey)
		}
	}

	return newRunnerInstanceKeys
}

type runInstance func(ctx context.Context, instanceKey RunInstanceKey, logger *zap.SugaredLogger, metrics monitoring.Scope)

func (r *Runner) startInstances(ctx context.Context, runnerType string, instanceKeys []RunInstanceKey, fn runInstance) {
	logger := r.logger.With("runner", runnerType)
	for _, instanceKey := range instanceKeys {
		logger := logger.With(
			"service_region_id", instanceKey.serviceRegionID,
			"service_date", instanceKey.serviceDate.Format(dateLayout))
		logger.Infow("Adding runner")

		metrics := r.metrics.With(runnerType,
			monitoring.Tags{
				serviceRegionTag: logisticsdb.I64ToA(instanceKey.serviceRegionID),
				serviceDateTag:   instanceKey.serviceDate.Format(dateLayout),
			}, nil)

		go func(instanceKey RunInstanceKey) {
			fn(ctx, instanceKey, logger, metrics)
		}(instanceKey)
	}
}

func (r *Runner) populateInstanceSettings(ctx context.Context) {
	r.logger.Debug("Getting settings...")

	now := time.Now()

	allInstanceSettingsMap, err := r.getAllInstanceSettingsMap(ctx, now)
	if err != nil {
		r.logger.Errorw("Could not populate instance settings", zap.Error(err))
		return
	}
	instanceSettingsMap := allInstanceSettingsMap.OptimizerRegionSettingsMap
	availabilityInstanceSettingsMap := allInstanceSettingsMap.AvailabilityRegionSettingsMap

	r.mx.Lock()
	oldInstanceSettingsMap := r.instanceSettingsMap
	r.instanceSettingsMap = instanceSettingsMap

	oldAvailabilityInstanceSettingsMap := r.availabilityInstanceSettingsMap
	r.availabilityInstanceSettingsMap = availabilityInstanceSettingsMap
	r.mx.Unlock()

	scheduleInstanceKeys := newInstanceKeys(instanceSettingsMap, oldInstanceSettingsMap)
	availabilityInstanceKeys := newInstanceKeys(availabilityInstanceSettingsMap, oldAvailabilityInstanceSettingsMap)

	r.startInstances(ctx, "Schedule", scheduleInstanceKeys, r.RunScheduleRunnerInstance)
	r.startInstances(ctx, "Availability", availabilityInstanceKeys, r.RunAvailabilityRunnerInstance)

	r.logger.Debug("Finished getting settings.")
}

type RunInstanceKey struct {
	serviceRegionID int64
	serviceDate     time.Time
	horizonDay      int
}

func (k RunInstanceKey) String() string {
	return fmt.Sprintf("[%d, %s]", k.serviceRegionID, k.serviceDate.Format(time.UnixDate))
}

func (r *Runner) RunScheduleRunnerInstance(ctx context.Context, instanceKey RunInstanceKey, logger *zap.SugaredLogger, metrics monitoring.Scope) {
	var initialJitter sync.Once
	for {
		r.mx.RLock()
		settingConfig, ok := r.instanceSettingsMap[instanceKey]
		r.mx.RUnlock()

		if !ok {
			logger.Info("Runner not enabled, stopping.")
			return
		}

		initialJitter.Do(func() {
			time.Sleep(settingConfig.Settings.NextJitterInterval())
		})

		logger.Info("Running region...")

		startTimestamp := time.Now()

		// TODO: Consider using database current_timestamp.
		latestSnapshotTimestamp := time.Now()

		settings := settingConfig.Settings

		tags := monitoring.Tags{
			optimizerConfigTag:       logisticsdb.I64ToA(settings.OptimizerConfigID),
			terminationDurationMsTag: logisticsdb.I64ToA(settingConfig.TerminationDurationMs()),
		}

		runResult, err := r.runRegionWithSettingConfig(ctx, logger, settingConfig, instanceKey.serviceDate, latestSnapshotTimestamp)
		if err != nil {
			logger.Errorw("Problem running region", zap.Error(err))
		}

		fields := fieldMetricsForRunResult(runResult, err, time.Since(startTimestamp).Milliseconds())
		metrics.WritePoint(runsMeasurementName, tags, fields)

		logger.Info("Region run done.")

		select {
		case <-ctx.Done():
			return

		case <-time.After(settings.NextPollInterval()):
			continue
		}
	}
}

type stalenessChecker struct {
	currentDayScheduleMaxStalenessSec *int64
	serviceDate                       time.Time
	latestSnapshotTimestamp           time.Time
	tz                                *time.Location
}

func (s stalenessChecker) ShouldForceRecomputeRegion(lastRun *logisticssql.OptimizerRun) bool {
	if lastRun == nil {
		return true
	}
	if s.currentDayScheduleMaxStalenessSec == nil {
		return false
	}
	// we recompute (only) the current date, since CheckFeasibility relies on time advancing even with no new data.
	isCurrentDate := TimestampToDate(s.latestSnapshotTimestamp.In(s.tz)).Equal(TimestampToDate(s.serviceDate))
	if !isCurrentDate {
		return false
	}
	forceRecomputeInterval := time.Second * time.Duration(*s.currentDayScheduleMaxStalenessSec)

	return lastRun.SnapshotTimestamp.Add(forceRecomputeInterval).Before(s.latestSnapshotTimestamp)
}

func (r *Runner) runRegionWithSettingConfig(ctx context.Context, logger *zap.SugaredLogger, settingConfig *SettingsConfig, serviceDate time.Time, latestSnapshotTimestamp time.Time) (*RunResult, error) {
	settings := settingConfig.Settings

	newRegionInfo, err := r.ldb.HasAnyNewInfoInRegionDateSinceLastRun(ctx, logisticsdb.HasNewInfoParams{
		ServiceRegionID:     settingConfig.ServiceRegionID,
		ServiceDate:         serviceDate,
		DistanceValiditySec: settings.DistanceValiditySec,
		LatestTimestamp:     latestSnapshotTimestamp,
	})
	if err != nil {
		return nil, err
	}
	lastRun := newRegionInfo.LastRun

	checker := stalenessChecker{
		currentDayScheduleMaxStalenessSec: settings.CurrentDayScheduleMaxStalenessSec,
		latestSnapshotTimestamp:           latestSnapshotTimestamp,
		serviceDate:                       serviceDate,
		tz:                                newRegionInfo.TZ,
	}
	if !newRegionInfo.HasNewInfo && !checker.ShouldForceRecomputeRegion(lastRun) {
		return nil, nil
	}

	earliestDistanceTimestamp := latestSnapshotTimestamp.Add(-time.Duration(settings.DistanceValiditySec) * time.Second)

	vrpData, err := r.ldb.GetServiceRegionVRPData(ctx, &logisticsdb.ServiceRegionVRPDataParams{
		ServiceRegionID: settingConfig.ServiceRegionID,
		ServiceDate:     serviceDate,
		SnapshotTime:    latestSnapshotTimestamp,
	})
	if err != nil {
		return nil, err
	}

	problemData, err := r.ldb.CreateVRPProblem(ctx, logisticsdb.VRPProblemParams{
		ServiceRegionVRPData:       vrpData,
		UseDistancesAfterTime:      earliestDistanceTimestamp,
		UnrequestedRestBreakConfig: logisticsdb.UnrequestedRestBreakConfig{IncludeUnrequestedRestBreaks: false},
		ValidationConfig: validation.Config{
			// for production; we want to gracefully handle recoverable errors and not fail.
			FailOnRecoverableError: false,
			ProblemValidators:      logisticsdb.DefaultProblemValidators,
		},
	})
	if err != nil {
		if errors.Is(err, logisticsdb.ErrEmptyVRPDescription) {
			return nil, nil
		}

		return nil, err
	}

	problemData.OptimizerRun.OptimizerConfigID = settingConfig.Settings.OptimizerConfigID

	problem := problemData.VRPProblem
	req := &optimizerpb.SolveVRPRequest{
		Problem: problem,
		Config: &optimizerpb.VRPConfig{
			TerminationDurationMs:                  proto.Int64(settingConfig.TerminationDurationMs()),
			UnimprovedScoreTerminationDurationMs:   proto.Int64(settingConfig.Settings.OptimizerUnimprovedScoreTerminationDurationMs),
			IncludeIntermediateInfeasibleSolutions: nil,
			IncludeDistanceMatrix:                  nil,
			PerVisitRevenueUsdCents:                &settingConfig.Config.PerVisitRevenueUsdCents,
			AppHourlyCostUsdCents:                  &settingConfig.Config.AppHourlyCostUsdCents,
			DhmtHourlyCostUsdCents:                 &settingConfig.Config.DhmtHourlyCostUsdCents,
			TerminationType:                        optimizerpb.VRPConfig_TERMINATION_TYPE_BEST_FOR_TIME.Enum(),
			IncludeIntermediateSolutions:           proto.Bool(false),
			ConstraintConfig:                       DefaultConstraintConfig.WithOptimizerSettings(settings).ToProto(),
		},
		Monitoring: &optimizerpb.Monitoring{
			Tags: map[string]string{
				serviceRegionTag: logisticsdb.I64ToA(settingConfig.ServiceRegionID),
				serviceDateTag:   serviceDate.Format(dateLayout),

				SolveVRPUseTag: SolveVRPUseTagSchedule,
			},
		},
	}

	logger.Debugw("vrp request", zap.String("req", req.String()))

	respChan, err := r.VRPSolver.SolveVRP(ctx, &SolveVRPParams{
		SolveVRPRequest:   req,
		OptimizerRun:      problemData.OptimizerRun,
		OptimizerSettings: &settings,
		OptimizerRunType:  logisticsdb.ServiceRegionScheduleRunType,
		WriteToDatabase:   true,
	})
	if err != nil {
		return nil, err
	}

	var resps []*WrappedSolveVRPResp
	for resp := range respChan {
		resps = append(resps, resp)

		logger.Debugw("vrp response", "resp", resp)
	}

	return &RunResult{Responses: resps, OriginalDescription: problemData.VRPProblem.GetDescription()}, nil
}

func attrsMap(attrs []*logisticssql.Attribute) map[int64]*logisticssql.Attribute {
	attrMap := map[int64]*logisticssql.Attribute{}
	for _, attr := range attrs {
		attrMap[attr.ID] = attr
	}

	return attrMap
}

func attrNamesGroupByCategory(settingsAttributes []optimizersettings.AvailabilityAttribute) [][]string {
	var variantsGroupByAttrCategory [][]string
	for _, attr := range settingsAttributes {
		attrNames := []string{}
		for _, variant := range attr.Variants {
			attrNames = append(attrNames, fmt.Sprintf("%s:%s", attr.Name, variant))
		}
		variantsGroupByAttrCategory = append(variantsGroupByAttrCategory, attrNames)
	}

	return variantsGroupByAttrCategory
}

func getAttrCombinations(attrsGroupByCategory [][]*logisticssql.Attribute) [][]int64 {
	combinations := [][]int64{}

	combinations = append(combinations, []int64{})
	for _, attributes := range attrsGroupByCategory {
		var updatedCombinations [][]int64
		for _, existingCombination := range combinations {
			for _, attr := range attributes {
				newCombination := existingCombination
				newCombination = append(newCombination, attr.ID)
				updatedCombinations = append(updatedCombinations, newCombination)
			}
		}
		combinations = updatedCombinations
	}

	return combinations
}

type simpleAvailabilityVisit struct {
	LocID    int64
	AttrIDs  []int64
	Duration int64
}

func toSimpleAvailVisits(
	availabilityVisits []*logisticssql.ServiceRegionAvailabilityVisit,
	attrsGroupByVisitID map[int64][]*logisticssql.Attribute,
) []*simpleAvailabilityVisit {
	var simpleVisits []*simpleAvailabilityVisit
	for _, v := range availabilityVisits {
		var attrIDs []int64
		for _, a := range attrsGroupByVisitID[v.ID] {
			attrIDs = append(attrIDs, a.ID)
		}
		simpleVisits = append(simpleVisits, &simpleAvailabilityVisit{
			LocID:    v.LocationID,
			AttrIDs:  attrIDs,
			Duration: v.ServiceDurationSec,
		})
	}
	return simpleVisits
}

func generateSimpleAvailabilityVisits(locIDs []int64, attributeCombinations [][]int64, durations logisticsdb.VisitServiceDurations) []*simpleAvailabilityVisit {
	var availVisits []*simpleAvailabilityVisit
	for _, duration := range durations {
		for _, locID := range locIDs {
			for _, attrIDs := range attributeCombinations {
				availVisits = append(availVisits, &simpleAvailabilityVisit{
					LocID:    locID,
					AttrIDs:  attrIDs,
					Duration: int64(duration.Seconds()),
				})
			}
		}
	}

	return availVisits
}

func areEqualVisits(visits1, visits2 []*simpleAvailabilityVisit) bool {
	if len(visits1) != len(visits2) {
		return false
	}

	v1Locs := collections.NewLinkedInt64Set(len(visits1))
	v1Durations := collections.NewLinkedInt64Set(len(visits1))
	v1Attrs := collections.NewLinkedSet[string](len(visits1))
	for _, v1 := range visits1 {
		v1Locs.Add(v1.LocID)
		v1Durations.Add(v1.Duration)
		sort.Slice(v1.AttrIDs, func(i, j int) bool {
			return v1.AttrIDs[i] < v1.AttrIDs[j]
		})
		v1Attrs.Add(fmt.Sprintf("%v", v1.AttrIDs))
	}
	v2Locs := collections.NewLinkedInt64Set(len(visits2))
	v2Durations := collections.NewLinkedInt64Set(len(visits2))
	v2Attrs := collections.NewLinkedSet[string](len(visits2))
	for _, v2 := range visits2 {
		v2Locs.Add(v2.LocID)
		v2Durations.Add(v2.Duration)
		sort.Slice(v2.AttrIDs, func(i, j int) bool {
			return v2.AttrIDs[i] < v2.AttrIDs[j]
		})
		v2Attrs.Add(fmt.Sprintf("%v", v2.AttrIDs))
	}

	if v1Locs.Size() != v2Locs.Size() || !v1Locs.Has(v2Locs.Elems()...) {
		return false
	}
	if v1Durations.Size() != v2Durations.Size() || !v1Durations.Has(v2Durations.Elems()...) {
		return false
	}
	if v1Attrs.Size() != v2Attrs.Size() || !v1Attrs.Has(v2Attrs.Elems()...) {
		return false
	}

	return true
}

type createAvailabilityVisitsParams struct {
	serviceRegionID int64

	locIDs              []int64
	attrIDsCombinations [][]int64
	serviceDurations    logisticsdb.VisitServiceDurations
	openHoursDay        *logisticssql.ServiceRegionOpenHoursScheduleDay

	attrsMap map[int64]*logisticssql.Attribute
}

func (r *Runner) createAvailabilityVisits(
	ctx context.Context,
	params *createAvailabilityVisitsParams,
) ([]*logisticssql.ServiceRegionAvailabilityVisit, map[int64][]*logisticssql.Attribute, error) {
	txParams := &logisticsdb.AddServiceRegionAvailabilityVisitsTransactionallyParams{
		ServiceRegionID:       params.serviceRegionID,
		OpenHoursDay:          params.openHoursDay,
		LocIDs:                params.locIDs,
		AttrIDsCombinations:   params.attrIDsCombinations,
		VisitServiceDurations: params.serviceDurations,
	}
	newAvailabilityVisits, newAvailabilityAttrs, err := r.ldb.AddServiceRegionAvailabilityVisitsTransactionally(ctx, txParams)
	if err != nil {
		return nil, nil, fmt.Errorf("error adding a new set of availability visits: %w", err)
	}

	attrsGroupByVisitID := map[int64][]*logisticssql.Attribute{}
	for _, attr := range newAvailabilityAttrs {
		visitID := attr.ServiceRegionAvailabilityVisitID
		attrsGroupByVisitID[visitID] = append(attrsGroupByVisitID[visitID], params.attrsMap[attr.AttributeID])
	}

	return newAvailabilityVisits, attrsGroupByVisitID, nil
}

func (r *Runner) getLatestAvailabilityVisits(
	ctx context.Context,
	serviceRegionID int64,
) ([]*logisticssql.ServiceRegionAvailabilityVisit, map[int64][]*logisticssql.Attribute, error) {
	latestAvailabilityVisits, err := r.ldb.GetLatestAvailabilityVisitsInRegion(ctx, serviceRegionID)
	if err != nil {
		return nil, nil, fmt.Errorf("error getting latest availability visits in region %w", err)
	}

	var latestAvailabilityVisitIDs []int64
	for _, v := range latestAvailabilityVisits {
		latestAvailabilityVisitIDs = append(latestAvailabilityVisitIDs, v.ID)
	}

	attrsGroupByVisitID, err := r.ldb.GetAvailabilityAttributesByVisitID(ctx, latestAvailabilityVisitIDs)
	if err != nil {
		return nil, nil, fmt.Errorf("error getting availability visit attributes %w", err)
	}

	return latestAvailabilityVisits, attrsGroupByVisitID, nil
}

type getAvailabilityVisitsParams struct {
	serviceRegionID         int64
	locIDs                  []int64
	attributes              []optimizersettings.AvailabilityAttribute
	openHoursTW             *logisticsdb.TimeWindow
	openHoursDay            *logisticssql.ServiceRegionOpenHoursScheduleDay
	serviceDurations        logisticsdb.VisitServiceDurations
	extraSetupDurationSec   int64
	expendableVisitsEnabled bool
}

func (r *Runner) getAvailabilityVisits(ctx context.Context, params *getAvailabilityVisitsParams) ([]*optimizerpb.VRPVisit, logisticsdb.AvailabilityVisitIDMap, error) {
	settingsAttributes := params.attributes
	serviceDurations := params.serviceDurations
	canonicalLocations := params.locIDs

	attrNamesGroupByCategory := attrNamesGroupByCategory(settingsAttributes)

	allAttrs := []*logisticssql.Attribute{}
	attrsGroupByCategory := [][]*logisticssql.Attribute{}
	for _, attrNames := range attrNamesGroupByCategory {
		attrsForNames, err := r.ldb.GetAttributesForNames(ctx, attrNames)
		if err != nil {
			return nil, nil, fmt.Errorf("error getting attributes data for availability: %w", err)
		}
		if len(attrsForNames) != len(attrNames) {
			return nil, nil, fmt.Errorf("couldn't get all the attributes data for: %v", attrNames)
		}
		allAttrs = append(allAttrs, attrsForNames...)
		attrsGroupByCategory = append(attrsGroupByCategory, attrsForNames)
	}

	attrIDCombinations := getAttrCombinations(attrsGroupByCategory)
	generatedSimpleAvailVisits := generateSimpleAvailabilityVisits(canonicalLocations, attrIDCombinations, serviceDurations)

	latestAvailabilityVisits, latestAttrsGroupByVisitID, err := r.getLatestAvailabilityVisits(ctx, params.serviceRegionID)
	if err != nil {
		return nil, nil, fmt.Errorf("error getting latest availability visits: %w", err)
	}

	latestSimpleVisits := toSimpleAvailVisits(latestAvailabilityVisits, latestAttrsGroupByVisitID)
	if areEqualVisits(generatedSimpleAvailVisits, latestSimpleVisits) {
		visits, idMap := logisticsdb.BuildAvailabilityVRPVisits(logisticsdb.BuildAvailabilityVRPVisitsParams{
			Visits:                latestAvailabilityVisits,
			AttrsGroupByVisitID:   latestAttrsGroupByVisitID,
			ExtraSetupDurationSec: params.extraSetupDurationSec,
			OpenHoursTW:           params.openHoursTW,
			ExpendableVisits:      params.expendableVisitsEnabled,
		})
		return visits, idMap, nil
	}

	attrsMap := attrsMap(allAttrs)
	newAvailabilityVisits, newAttrsGroupByVisitID, err := r.createAvailabilityVisits(ctx, &createAvailabilityVisitsParams{
		serviceRegionID:     params.serviceRegionID,
		locIDs:              params.locIDs,
		attrIDsCombinations: attrIDCombinations,
		serviceDurations:    serviceDurations,
		openHoursDay:        params.openHoursDay,
		attrsMap:            attrsMap,
	})
	if err != nil {
		return nil, nil, fmt.Errorf("error creating availability visits: %w", err)
	}

	visits, idMap := logisticsdb.BuildAvailabilityVRPVisits(logisticsdb.BuildAvailabilityVRPVisitsParams{
		Visits:                newAvailabilityVisits,
		AttrsGroupByVisitID:   newAttrsGroupByVisitID,
		ExtraSetupDurationSec: params.extraSetupDurationSec,
		OpenHoursTW:           params.openHoursTW,
		ExpendableVisits:      params.expendableVisitsEnabled,
	})
	return visits, idMap, nil
}

type vrpConfigForAvailabilityParams struct {
	vrpVisits              []*optimizerpb.VRPVisit
	availabilityVisitIDs   []int64
	visitArrivalTimestamps map[int64]time.Time

	optimizerSettings          *optimizersettings.Settings
	availabilitySettingsConfig *AvailabilitySettingsConfig
}

func vrpConfigForAvailability(params vrpConfigForAvailabilityParams) *optimizerpb.VRPConfig {
	optimizerSettings := params.optimizerSettings
	availabilityVisitIDs := params.availabilityVisitIDs

	constraintConfig := DefaultConstraintConfig.
		WithOptimizerSettings(*optimizerSettings)

	availabilitySettingsConfig := params.availabilitySettingsConfig
	availabilitySettings := availabilitySettingsConfig.Settings
	if !availabilitySettings.AllowLateAvailabilityVisits {
		constraintConfig = *constraintConfig.WithDisallowedLateArrivalVisitIds(availabilityVisitIDs...)
	}

	latenessThresholdMs := optimizerSettings.FeasibilityCheckLatenessThresholdOverrideMs
	if latenessThresholdMs != nil {
		constraintConfig = *constraintConfig.
			WithVisitLatenessToleranceOverrides(VisitLatenessToleranceOverridesParams{
				VRPVisits:                  params.vrpVisits,
				VisitArrivalTimestamps:     params.visitArrivalTimestamps,
				FeasibilityCheckVisitIDs:   availabilityVisitIDs,
				DefaultLatenessThresholdMs: *latenessThresholdMs,
				ShiftTeamStartBufferSec:    optimizerSettings.FeasibilityShiftTeamStartBufferSec,
			})
	}

	optimizerConfig := availabilitySettingsConfig.OptimizerConfig
	return &optimizerpb.VRPConfig{
		IncludeIntermediateInfeasibleSolutions: proto.Bool(false),
		TerminationDurationMs:                  proto.Int64(availabilitySettingsConfig.TerminationDurationMs()),
		UnimprovedScoreTerminationDurationMs:   proto.Int64(availabilitySettings.OptimizerUnimprovedScoreTerminationDurationMs),
		AppHourlyCostUsdCents:                  &optimizerConfig.AppHourlyCostUsdCents,
		DhmtHourlyCostUsdCents:                 &optimizerConfig.DhmtHourlyCostUsdCents,
		PerVisitRevenueUsdCents:                &optimizerConfig.PerVisitRevenueUsdCents,
		TerminationType:                        optimizerpb.VRPConfig_TERMINATION_TYPE_BEST_FOR_TIME.Enum(),
		ConstraintConfig:                       constraintConfig.ToProto(),
	}
}

type vrpInputForAvailability struct {
	VRPProblemData *logisticsdb.VRPProblemData
	VRPRequest     *optimizerpb.SolveVRPRequest
	OptimizerRun   *logisticssql.OptimizerRun
}

type VRPInputForAvailabilityParams struct {
	ServiceRegionVRPData       *logisticsdb.ServiceRegionVRPData
	VRPAvailabilityVisits      []*optimizerpb.VRPVisit
	AvailabilitySettingsConfig *AvailabilitySettingsConfig

	LatestSnapshotTimestamp time.Time
}

func (r *Runner) vrpInputForAvailability(
	ctx context.Context,
	params VRPInputForAvailabilityParams,
) (*vrpInputForAvailability, error) {
	optimizerSettings := params.ServiceRegionVRPData.Settings
	earliestDistanceTimestamp := params.LatestSnapshotTimestamp.Add(-time.Duration(optimizerSettings.DistanceValiditySec) * time.Second)
	vrpProblemData, err := r.ldb.CreateVRPProblem(ctx, logisticsdb.VRPProblemParams{
		ServiceRegionVRPData:  params.ServiceRegionVRPData,
		UseDistancesAfterTime: earliestDistanceTimestamp,
		UnrequestedRestBreakConfig: logisticsdb.UnrequestedRestBreakConfig{
			IncludeUnrequestedRestBreaks: true,
			RestBreakDuration:            defaultRestBreakDuration,
		}, ValidationConfig: validation.Config{
			FailOnRecoverableError: false,
			ProblemValidators:      logisticsdb.DefaultProblemValidators,
		},
	})
	if err != nil {
		if errors.Is(err, logisticsdb.ErrEmptyVRPDescription) {
			return nil, nil
		}
		return nil, fmt.Errorf("error creating vrp description: %w", err)
	}
	var checkFeasibilityDiagnostics *logisticspb.CheckFeasibilityDiagnostics
	visitArrivalTimestamps := map[int64]time.Time{}
	if vrpProblemData.CheckFeasibilityDiagnostics != nil {
		checkFeasibilityDiagnostics = vrpProblemData.CheckFeasibilityDiagnostics
		visitArrivalTimestamps, err = r.ldb.VisitArrivalTimestampsForSchedule(ctx, checkFeasibilityDiagnostics.ScheduleId)
		if err != nil {
			return nil, err
		}
	}

	vrpProblemData, err = logisticsdb.AddAvailabilityVisitsToProblem(vrpProblemData, params.VRPAvailabilityVisits)
	if err != nil {
		return nil, err
	}
	vrpVisits := vrpProblemData.VRPProblem.GetDescription().GetVisits()
	vrpProblemData.OptimizerRun.OptimizerConfigID = optimizerSettings.OptimizerConfigID

	vrpConfig := vrpConfigForAvailability(vrpConfigForAvailabilityParams{
		vrpVisits:                  vrpVisits,
		availabilityVisitIDs:       vrpProblemData.FeasibilityVisitIDs,
		visitArrivalTimestamps:     visitArrivalTimestamps,
		availabilitySettingsConfig: params.AvailabilitySettingsConfig,
		optimizerSettings:          optimizerSettings,
	})

	return &vrpInputForAvailability{
		VRPProblemData: vrpProblemData,
		VRPRequest: &optimizerpb.SolveVRPRequest{
			Problem: vrpProblemData.VRPProblem,
			Config:  vrpConfig,
			Monitoring: &optimizerpb.Monitoring{
				Tags: map[string]string{
					serviceRegionTag: logisticsdb.I64ToA(params.ServiceRegionVRPData.ServiceRegionID),
					serviceDateTag:   params.ServiceRegionVRPData.ServiceDate.Format(dateLayout),

					SolveVRPUseTag: SolveVRPUseTagAvailability,
				},
			},
		},
	}, nil
}

func (r *Runner) runAvailabilityRegionWithSettingConfig(
	ctx context.Context,
	logger *zap.SugaredLogger,
	settingConfig *AvailabilitySettingsConfig,
	serviceDate time.Time,
	latestSnapshotTimestamp time.Time,
	horizonDay int) (*RunResult, error) {
	settingsAttributes := settingConfig.Settings.Attributes
	if settingsAttributes == nil {
		return nil, errors.New("no attributes in settings")
	}

	serviceRegionID := settingConfig.ServiceRegionID

	hasNewScheduleSinceLastRun, err := r.ldb.HasAnyNewScheduleSinceLastAvailabilityRun(ctx, logisticsdb.HasNewScheduleParams{
		ServiceRegionID:    serviceRegionID,
		ServiceDate:        serviceDate,
		LatestSnapShotTime: latestSnapshotTimestamp,
	})
	if err != nil {
		return nil, fmt.Errorf(
			"error checking if we have new schedule data for service region %d in service date %s: %w",
			serviceRegionID,
			serviceDate,
			err)
	}

	if !hasNewScheduleSinceLastRun {
		return nil, nil
	}

	serviceRegionVRPData, err := r.ldb.GetServiceRegionVRPData(ctx, &logisticsdb.ServiceRegionVRPDataParams{
		ServiceRegionID: serviceRegionID,
		ServiceDate:     serviceDate,
		SnapshotTime:    latestSnapshotTimestamp,
		CheckFeasibilityVisit: &logisticspb.CheckFeasibilityVisit{
			MarketId: &settingConfig.ServiceRegionID,
		},
		ShiftTeamCapacitySettings: settingConfig.Settings.CapacitySettings,
		HorizonDay:                horizonDay,
	})
	if err != nil {
		return nil, fmt.Errorf("error getting service region VRP data %w", err)
	}
	checkFeasibilityData := serviceRegionVRPData.CheckFeasibilityData
	if checkFeasibilityData == nil {
		return nil, nil
	}
	canonicalLocationIDs := checkFeasibilityData.LocIDs

	vrpAvailabilityVisits, availabilityVisitIDMap, err := r.getAvailabilityVisits(ctx, &getAvailabilityVisitsParams{
		serviceRegionID:         serviceRegionID,
		locIDs:                  canonicalLocationIDs,
		attributes:              settingsAttributes,
		openHoursTW:             serviceRegionVRPData.OpenHoursTW,
		openHoursDay:            serviceRegionVRPData.OpenHoursDay,
		serviceDurations:        checkFeasibilityData.Durations,
		extraSetupDurationSec:   serviceRegionVRPData.Settings.VisitExtraSetupDurationSec,
		expendableVisitsEnabled: settingConfig.Settings.AllowExpendableAvailabilityVisits,
	})
	if err != nil {
		return nil, fmt.Errorf("error getting availability visits %w", err)
	}

	vrpInput, err := r.vrpInputForAvailability(ctx, VRPInputForAvailabilityParams{
		ServiceRegionVRPData:       serviceRegionVRPData,
		VRPAvailabilityVisits:      vrpAvailabilityVisits,
		AvailabilitySettingsConfig: settingConfig,
		LatestSnapshotTimestamp:    latestSnapshotTimestamp,
	})
	if err != nil {
		return nil, fmt.Errorf("error generating vrp input for availability")
	}
	if vrpInput == nil {
		return nil, nil
	}

	if r.availabilityRunnerDebug {
		buff, err := vrpRequestMarshall.Marshal(vrpInput.VRPRequest)
		if err != nil {
			logger.Info("unable to marshal availability problem")
		}

		logger.Infow("availability vrp request", zap.String("req", string(buff)))
	}

	respChan, err := r.VRPSolver.SolveVRP(ctx, &SolveVRPParams{
		SolveVRPRequest:   vrpInput.VRPRequest,
		OptimizerRun:      vrpInput.VRPProblemData.OptimizerRun,
		OptimizerSettings: serviceRegionVRPData.Settings,
		OptimizerRunType:  logisticsdb.ServiceRegionAvailabilityRunType,
		WriteToDatabase:   true,

		AvailabilityVisitIDMap: availabilityVisitIDMap,
		UnassignedVisits:       serviceRegionVRPData.PreviousUnassignedVisits,
	})
	if err != nil {
		return nil, err
	}

	var resps []*WrappedSolveVRPResp
	for resp := range respChan {
		resps = append(resps, resp)

		logger.Debugw("vrp response", "resp", resp)
	}

	return &RunResult{Responses: resps, OriginalDescription: vrpInput.VRPRequest.GetProblem().GetDescription()}, nil
}

func (r *Runner) RunAvailabilityRunnerInstance(
	ctx context.Context,
	instanceKey RunInstanceKey,
	logger *zap.SugaredLogger,
	metrics monitoring.Scope) {
	var initialJitter sync.Once
	for {
		r.mx.RLock()
		settingConfig, ok := r.availabilityInstanceSettingsMap[instanceKey]
		r.mx.RUnlock()

		if !ok {
			logger.Info("Runner not enabled, stopping.")
			return
		}

		initialJitter.Do(func() {
			time.Sleep(settingConfig.Settings.NextJitterInterval())
		})

		logger.Info("Running region...")

		now := time.Now()
		startTimestamp := now
		latestSnapshotTimestamp := now

		_, err := r.runAvailabilityRegionWithSettingConfig(ctx, logger, settingConfig, instanceKey.serviceDate, latestSnapshotTimestamp, instanceKey.horizonDay)

		elapsedTime := time.Since(startTimestamp)
		fields := monitoring.Fields{
			durationMsField: elapsedTime,
		}
		if err != nil {
			logger.Errorw("Problem running region", zap.Error(err))
			fields[errorField] = err.Error()
		}
		metrics.WritePoint(runsMeasurementName, nil, fields)

		logger.Info("Region run done.")

		select {
		case <-ctx.Done():
			return

		case <-time.After(settingConfig.Settings.NextPollInterval()):
			continue
		}
	}
}

func fieldMetricsForRunResult(runResult *RunResult, err error, elapsedTime int64) monitoring.Fields {
	fields := monitoring.Fields{
		durationMsField: elapsedTime,
	}

	if err != nil {
		fields[errorField] = err.Error()
		return fields
	}

	if runResult == nil || len(runResult.Responses) == 0 {
		return fields
	}

	solveVRPResponses := runResult.Responses

	lastSolveVRPResponse := solveVRPResponses[len(solveVRPResponses)-1]
	solution := lastSolveVRPResponse.Response.GetSolution()
	solutionDescription := solution.GetDescription()

	var numPinnedVisits int
	for _, shiftTeam := range solutionDescription.GetShiftTeams() {
		for _, stop := range shiftTeam.GetRoute().GetStops() {
			if stop.GetPinned() {
				numPinnedVisits++
			}
		}
	}

	var numFeasibleSolutions int
	var numInfeasibleSolutions int
	for _, solveVRPResponse := range solveVRPResponses {
		solution := solveVRPResponse.Response.GetSolution()
		if isFeasibleScore(solution.GetScore()) {
			numFeasibleSolutions++
		} else {
			numInfeasibleSolutions++
		}
	}

	vrpDescription := runResult.OriginalDescription
	return monitoring.Fields{
		shiftTeamsField:          len(vrpDescription.ShiftTeams),
		visitsField:              len(vrpDescription.Visits),
		unassignedVisitsField:    len(solutionDescription.UnassignedVisits),
		pinnedVisitsField:        numPinnedVisits,
		feasibilityField:         feasibleStatus(solution.GetScore()),
		feasibleSolutionsField:   numFeasibleSolutions,
		infeasibleSolutionsField: numInfeasibleSolutions,
		durationMsField:          elapsedTime,
	}
}

// TODO(https://github.com/*company-data-covered*/services/pull/1212/files#r959761575): use shared logic.
func isFeasibleScore(score *optimizerpb.VRPScore) bool {
	return score.GetHardScore() == 0 && score.GetUnassignedVisitsScore() == 0
}

func feasibleStatus(score *optimizerpb.VRPScore) logisticspb.CheckFeasibilityResponse_Status {
	if isFeasibleScore(score) {
		return logisticspb.CheckFeasibilityResponse_STATUS_FEASIBLE
	}
	return logisticspb.CheckFeasibilityResponse_STATUS_INFEASIBLE
}

// TODO: Move to converters package.
func TimestampToDate(timestamp time.Time) time.Time {
	date := time.Date(timestamp.Year(), timestamp.Month(), timestamp.Day(), 0, 0, 0, 0, time.UTC)
	return date
}

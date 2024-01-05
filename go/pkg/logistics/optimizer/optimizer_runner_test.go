package optimizer

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

var (
	errUnimplemented = errors.New("unimplemented")
)

type mockRunnerLDB struct {
	optimizerRun                                 *logisticssql.OptimizerRun
	serviceRegionMap                             map[int64]*logisticssql.ServiceRegion
	optimizerConfigs                             map[int64]*logisticssql.OptimizerConfig
	optimizerConfigsErr                          error
	attributes                                   []*logisticssql.Attribute
	attributesErr                                error
	availabilityVisits                           []*logisticssql.ServiceRegionAvailabilityVisit
	availabilityVisitsErr                        error
	availabilityVisitAttrs                       map[int64][]*logisticssql.Attribute
	availabilityVisitAttrsErr                    error
	availabilityVisitsTx                         []*logisticssql.ServiceRegionAvailabilityVisit
	availabilityVisitAttrsTx                     []*logisticssql.ServiceRegionAvailabilityVisitAttribute
	availabilityVisitsTxErr                      error
	visitArrivalTimestampsForSchedule            map[int64]time.Time
	visitArrivalTimestampsForScheduleErr         error
	hasAnyNewScheduleSinceLastAvailabilityRun    bool
	hasAnyNewScheduleSinceLastAvailabilityRunErr error

	hasAnyNewInfoInRegionDateSinceLastRunFunc func(context.Context, logisticsdb.HasNewInfoParams) (*logisticsdb.NewRegionInfo, error)
	GetServiceRegionVRPDataRunFunc            func(context.Context, *logisticsdb.ServiceRegionVRPDataParams) (*logisticsdb.ServiceRegionVRPData, error)
	CreateVRPProblemRunFunc                   func(context.Context, logisticsdb.VRPProblemParams) (*logisticsdb.VRPProblemData, error)
}

func (ldb *mockRunnerLDB) GetServiceRegionByID(ctx context.Context, serviceRegionID int64) (*logisticssql.ServiceRegion, error) {
	if ldb.serviceRegionMap == nil {
		return nil, errors.New("no service region")
	}

	return ldb.serviceRegionMap[serviceRegionID], nil
}

func (ldb *mockRunnerLDB) GetOptimizerConfigsByIDs(ctx context.Context, configIDs []int64) (map[int64]*logisticssql.OptimizerConfig, error) {
	if ldb.optimizerConfigsErr != nil {
		return nil, ldb.optimizerConfigsErr
	}
	return ldb.optimizerConfigs, nil
}

func (ldb *mockRunnerLDB) HasAnyNewInfoInRegionDateSinceLastRun(ctx context.Context, params logisticsdb.HasNewInfoParams) (*logisticsdb.NewRegionInfo, error) {
	return ldb.hasAnyNewInfoInRegionDateSinceLastRunFunc(ctx, params)
}

func (ldb *mockRunnerLDB) CreateVRPProblem(ctx context.Context, params logisticsdb.VRPProblemParams) (*logisticsdb.VRPProblemData, error) {
	return ldb.CreateVRPProblemRunFunc(ctx, params)
}

func (ldb *mockRunnerLDB) AddOptimizerRun(context.Context, logisticssql.AddOptimizerRunParams, *optimizerpb.VRPConstraintConfig, *optimizersettings.Settings) (*logisticssql.OptimizerRun, error) {
	return ldb.optimizerRun, nil
}

func (ldb *mockRunnerLDB) AddOptimizerRunError(context.Context, logisticssql.AddOptimizerRunErrorParams) error {
	return errUnimplemented
}

func (ldb *mockRunnerLDB) WriteScheduleForVRPSolution(ctx context.Context, params *logisticsdb.WriteScheduleForVRPSolutionParams) (*logisticssql.Schedule, error) {
	return nil, errUnimplemented
}

func (ldb *mockRunnerLDB) GetServiceRegionVRPData(ctx context.Context, params *logisticsdb.ServiceRegionVRPDataParams) (*logisticsdb.ServiceRegionVRPData, error) {
	return ldb.GetServiceRegionVRPDataRunFunc(ctx, params)
}

func (ldb *mockRunnerLDB) GetLatestAvailabilityVisitsInRegion(ctx context.Context, serviceRegionID int64) ([]*logisticssql.ServiceRegionAvailabilityVisit, error) {
	if ldb.availabilityVisitsErr != nil {
		return nil, ldb.availabilityVisitsErr
	}
	return ldb.availabilityVisits, nil
}

func (ldb *mockRunnerLDB) GetAvailabilityAttributesByVisitID(ctx context.Context, visitIDs []int64) (map[int64][]*logisticssql.Attribute, error) {
	if ldb.availabilityVisitAttrsErr != nil {
		return nil, ldb.availabilityVisitAttrsErr
	}
	return ldb.availabilityVisitAttrs, nil
}

func (ldb *mockRunnerLDB) GetAttributesForNames(ctx context.Context, attrNames []string) ([]*logisticssql.Attribute, error) {
	if ldb.attributesErr != nil {
		return nil, ldb.attributesErr
	}
	return ldb.attributes, nil
}

func (ldb *mockRunnerLDB) AddServiceRegionAvailabilityVisitsTransactionally(ctx context.Context, params *logisticsdb.AddServiceRegionAvailabilityVisitsTransactionallyParams) ([]*logisticssql.ServiceRegionAvailabilityVisit, []*logisticssql.ServiceRegionAvailabilityVisitAttribute, error) {
	if ldb.availabilityVisitsTxErr != nil {
		return nil, nil, ldb.availabilityVisitsTxErr
	}
	return ldb.availabilityVisitsTx, ldb.availabilityVisitAttrsTx, nil
}

func (ldb *mockRunnerLDB) VisitArrivalTimestampsForSchedule(ctx context.Context, scheduleID int64) (map[int64]time.Time, error) {
	if ldb.visitArrivalTimestampsForScheduleErr != nil {
		return nil, ldb.visitArrivalTimestampsForScheduleErr
	}
	return ldb.visitArrivalTimestampsForSchedule, nil
}

func (ldb *mockRunnerLDB) HasAnyNewScheduleSinceLastAvailabilityRun(ctx context.Context, params logisticsdb.HasNewScheduleParams) (bool, error) {
	return ldb.hasAnyNewScheduleSinceLastAvailabilityRun, ldb.hasAnyNewScheduleSinceLastAvailabilityRunErr
}

func TestOptimizerRunner_HorizonDays(t *testing.T) {
	logger := baselogger.NewSugaredLogger(baselogger.LoggerOptions{})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	now := time.Date(2022, time.January, 23, 23, 0, 0, 0, time.UTC)

	tcs := []struct {
		Desc             string
		HorizonDays      int64
		IanaTimeZoneName string

		ExpectedDates []time.Time
		HasErr        bool
	}{
		{
			Desc:             "base case, Denver",
			HorizonDays:      1,
			IanaTimeZoneName: "America/Denver",

			ExpectedDates: []time.Time{
				TimestampToDate(now).AddDate(0, 0, 0),
			},
		},
		{
			Desc:             "base case - 3 days, Denver",
			HorizonDays:      3,
			IanaTimeZoneName: "America/Denver",

			ExpectedDates: []time.Time{
				TimestampToDate(now).AddDate(0, 0, 0),
				TimestampToDate(now).AddDate(0, 0, 1),
				TimestampToDate(now).AddDate(0, 0, 2),
			},
		},
		{
			Desc:             "base case - 3 days, Tokyo",
			HorizonDays:      3,
			IanaTimeZoneName: "Asia/Tokyo",

			ExpectedDates: []time.Time{
				TimestampToDate(now).AddDate(0, 0, 1),
				TimestampToDate(now).AddDate(0, 0, 2),
				TimestampToDate(now).AddDate(0, 0, 3),
			},
		},
		{
			Desc:             "bad time zone",
			HorizonDays:      1,
			IanaTimeZoneName: "BAD TZ",

			HasErr: true,
		},
		{
			Desc:             "no horizon days",
			HorizonDays:      0,
			IanaTimeZoneName: "Asia/Tokyo",

			ExpectedDates: []time.Time{},
		},
	}

	serviceRegionID := int64(123)
	optimizerConfigID := int64(23)

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			ldb := &mockRunnerLDB{
				serviceRegionMap: map[int64]*logisticssql.ServiceRegion{
					serviceRegionID: {
						ID:               serviceRegionID,
						IanaTimeZoneName: tc.IanaTimeZoneName,
					},
				},
				optimizerConfigs: map[int64]*logisticssql.OptimizerConfig{
					optimizerConfigID: {},
				},
			}
			runner := NewRunner(ldb, nil, logger, nil, 1*time.Hour, &optimizersettings.MockSettingsService{
				AllSettingsConfigs: &optimizersettings.AllSettings{
					OptimizerRegionSettingsMap: optimizersettings.RegionSettingsMap{
						serviceRegionID: optimizersettings.Settings{
							OptimizeHorizonDays: tc.HorizonDays,
							OptimizerConfigID:   optimizerConfigID,
						},
					},
				},
			})
			allConfigsMap, err := runner.getAllInstanceSettingsMap(ctx, now)
			if tc.HasErr != (err != nil) {
				t.Fatal(tc, err)
			}
			if tc.HasErr {
				return
			}

			expectedInstances := runInstanceSettingsMap{}
			for _, date := range tc.ExpectedDates {
				expectedInstances[RunInstanceKey{
					serviceRegionID: serviceRegionID,
					serviceDate:     date,
				}] = &SettingsConfig{
					ServiceRegionID: serviceRegionID,
					Settings: optimizersettings.Settings{
						OptimizeHorizonDays: tc.HorizonDays,
						OptimizerConfigID:   optimizerConfigID,
					},
					Config: &logisticssql.OptimizerConfig{},
				}
			}

			testutils.MustMatch(t, expectedInstances, allConfigsMap.OptimizerRegionSettingsMap, "not matching configs")
		})
	}
}

func TestRunner_newInstanceKeys(t *testing.T) {
	tcs := []struct {
		name         string
		newInstances runInstanceSettingsMap
		oldInstances runInstanceSettingsMap
		want         []RunInstanceKey
	}{
		{
			name: "new instance keys",
			newInstances: runInstanceSettingsMap{
				RunInstanceKey{serviceRegionID: 3}: nil,
			},
			oldInstances: runInstanceSettingsMap{
				RunInstanceKey{serviceRegionID: 1}: nil,
				RunInstanceKey{serviceRegionID: 2}: nil,
			},
			want: []RunInstanceKey{
				{serviceRegionID: 3},
			},
		},
		{
			name:         "no new instance keys",
			newInstances: nil,
			oldInstances: runInstanceSettingsMap{
				RunInstanceKey{serviceRegionID: 1}: nil,
				RunInstanceKey{serviceRegionID: 2}: nil,
			},
			want: nil,
		},
		{
			name: "no old instance keys",
			newInstances: runInstanceSettingsMap{
				RunInstanceKey{serviceRegionID: 3}: nil,
			},
			oldInstances: nil,
			want: []RunInstanceKey{
				{serviceRegionID: 3},
			},
		},
		{
			name:         "empty new instance keys",
			newInstances: runInstanceSettingsMap{},
			oldInstances: runInstanceSettingsMap{
				RunInstanceKey{serviceRegionID: 1}: nil,
				RunInstanceKey{serviceRegionID: 2}: nil,
			},
			want: nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			got := newInstanceKeys(tc.newInstances, tc.oldInstances)

			testutils.MustMatch(t, tc.want, got)
		})
	}
}

func TestStalenessChecker_ShouldForceRecomputeRegion(t *testing.T) {
	now := time.Now().UTC()
	currentDate := TimestampToDate(now)
	// make sure our math is always within the confines of a UTC day.
	now = currentDate.Add(12*time.Hour + 6*time.Second)

	sixtySecondStaleness := proto.Int64(60)
	twoDaySecondsStaleness := proto.Int64(60 * 60 * 24 * 2)

	tcs := []struct {
		name                           string
		currentDayScheduleMaxStaleness *int64
		lastRun                        time.Time
		thisRun                        time.Time

		expected bool
	}{
		{
			name:                           "base case true",
			currentDayScheduleMaxStaleness: sixtySecondStaleness,
			lastRun:                        now.Add(-70 * time.Second),
			thisRun:                        now,

			expected: true,
		},
		{
			name:                           "base case false",
			currentDayScheduleMaxStaleness: sixtySecondStaleness,
			lastRun:                        now.Add(-50 * time.Second),
			thisRun:                        now,

			expected: false,
		},
		{
			name:                           "yesterday false, even if allowed",
			currentDayScheduleMaxStaleness: twoDaySecondsStaleness,
			lastRun:                        now,
			thisRun:                        now.Add(25 * time.Hour),

			expected: false,
		},
		{
			name:                           "tomorrow false, even if allowed",
			currentDayScheduleMaxStaleness: twoDaySecondsStaleness,
			lastRun:                        now.Add(25 * time.Hour),
			thisRun:                        now,

			expected: false,
		},
		{
			name:                           "NULL staleness turns things off",
			currentDayScheduleMaxStaleness: nil,

			expected: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			checker := stalenessChecker{
				currentDayScheduleMaxStalenessSec: tc.currentDayScheduleMaxStaleness,
				serviceDate:                       currentDate,
				latestSnapshotTimestamp:           tc.thisRun,
				tz:                                time.UTC,
			}
			got := checker.ShouldForceRecomputeRegion(&logisticssql.OptimizerRun{SnapshotTimestamp: tc.lastRun})
			testutils.MustMatch(t, tc.expected, got)
		})
	}
	testutils.MustMatch(t, true, stalenessChecker{}.ShouldForceRecomputeRegion(nil), "no previous run triggers recompute")
}

func TestStalenessChecker_UTCDayOverlap(t *testing.T) {
	pacificTZ, err := time.LoadLocation("America/Los_Angeles")
	if err != nil {
		t.Fatal(err)
	}
	serviceDate := time.Date(2022, 10, 7, 0, 0, 0, 0, time.UTC)
	lastRunTimestamp, err := time.Parse(time.RFC3339, "2022-10-08T04:17:31Z")
	if err != nil {
		t.Fatal(err)
	}

	checker := stalenessChecker{
		currentDayScheduleMaxStalenessSec: proto.Int64(10),
		serviceDate:                       serviceDate,
		latestSnapshotTimestamp:           lastRunTimestamp.Add(time.Minute),
		tz:                                pacificTZ,
	}
	got := checker.ShouldForceRecomputeRegion(&logisticssql.OptimizerRun{SnapshotTimestamp: lastRunTimestamp})
	testutils.MustMatch(t, true, got, "service_date before the UTC cutoff")
}

type MockVRPSolver struct {
	SolveVRPRunFunc func(context.Context, *SolveVRPParams) (<-chan *WrappedSolveVRPResp, error)
}

func (m *MockVRPSolver) SolveVRP(ctx context.Context, params *SolveVRPParams) (<-chan *WrappedSolveVRPResp, error) {
	return m.SolveVRPRunFunc(ctx, params)
}

func TestRunRegionWithSettingsWithOptimizerRunType(t *testing.T) {
	lastRun := &logisticssql.OptimizerRun{SnapshotTimestamp: time.Now()}
	r := &Runner{
		ldb: &mockRunnerLDB{
			hasAnyNewInfoInRegionDateSinceLastRunFunc: func(context.Context, logisticsdb.HasNewInfoParams) (*logisticsdb.NewRegionInfo, error) {
				return &logisticsdb.NewRegionInfo{HasNewInfo: true, LastRun: lastRun, TZ: time.UTC}, nil
			},
			GetServiceRegionVRPDataRunFunc: func(context.Context, *logisticsdb.ServiceRegionVRPDataParams) (*logisticsdb.ServiceRegionVRPData, error) {
				return &logisticsdb.ServiceRegionVRPData{}, nil
			},
			CreateVRPProblemRunFunc: func(context.Context, logisticsdb.VRPProblemParams) (*logisticsdb.VRPProblemData, error) {
				return &logisticsdb.VRPProblemData{
					OptimizerRun: &logisticssql.OptimizerRun{},
					VRPProblem:   &optimizerpb.VRPProblem{},
				}, nil
			},
		},
		VRPSolver: &MockVRPSolver{
			SolveVRPRunFunc: func(ctx context.Context, params *SolveVRPParams) (<-chan *WrappedSolveVRPResp, error) {
				solveVRPResps := make(chan *WrappedSolveVRPResp, 1)
				defer close(solveVRPResps)

				resp := &optimizerpb.SolveVRPResponse{}
				solveVRPResps <- &WrappedSolveVRPResp{
					Response: resp,
				}

				testutils.MustMatch(t, params.OptimizerRunType, logisticsdb.ServiceRegionScheduleRunType)
				return solveVRPResps, nil
			},
		},
	}
	result, err := r.runRegionWithSettingConfig(
		context.Background(),
		zap.L().Sugar(),
		&SettingsConfig{
			Settings: optimizersettings.Settings{
				CurrentDayScheduleMaxStalenessSec: nil,
				OptimizerTerminationDurationMs:    100,
			},
			Config: &logisticssql.OptimizerConfig{},
		},
		TimestampToDate(time.Now()),
		time.Now(),
	)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, true, result != nil)
}

func TestRunAvailabilityRegionWithSettingsBaseCase(t *testing.T) {
	visitID := int64(10)
	locationID := int64(99)
	setID := int64(123)
	now := time.Now()
	openHoursTW := &logisticsdb.TimeWindow{
		Start: now,
		End:   now.Add(8 * time.Hour),
	}
	serviceNameAcute := "service_name:Acute"
	r := &Runner{
		ldb: &mockRunnerLDB{
			GetServiceRegionVRPDataRunFunc: func(context.Context, *logisticsdb.ServiceRegionVRPDataParams) (*logisticsdb.ServiceRegionVRPData, error) {
				return &logisticsdb.ServiceRegionVRPData{
					Settings: &optimizersettings.Settings{
						DistanceValiditySec: 1,
					},
					CheckFeasibilityData: &logisticsdb.CheckFeasibilityVRPDataResult{
						LocIDs: []int64{1},
						Visits: []*logisticspb.CheckFeasibilityVisit{
							{
								ServiceDurationSec: proto.Int64(1),
							},
						},
					},
				}, nil
			},
			attributes: []*logisticssql.Attribute{
				{ID: 1, Name: serviceNameAcute},
			},
			availabilityVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
				{
					ID:                                  visitID,
					LocationID:                          locationID,
					ArrivalStartTime:                    openHoursTW.Start,
					ArrivalEndTime:                      openHoursTW.End,
					ServiceRegionAvailabilityVisitSetID: setID,
				},
			},
			availabilityVisitAttrs: map[int64][]*logisticssql.Attribute{
				visitID: {
					{ID: 1, Name: serviceNameAcute},
				},
			},
			CreateVRPProblemRunFunc: func(context.Context, logisticsdb.VRPProblemParams) (*logisticsdb.VRPProblemData, error) {
				return &logisticsdb.VRPProblemData{
					OptimizerRun: &logisticssql.OptimizerRun{},
					VRPProblem: &optimizerpb.VRPProblem{
						Description: &optimizerpb.VRPDescription{
							Visits: []*optimizerpb.VRPVisit{},
						},
					},
				}, nil
			},
			hasAnyNewScheduleSinceLastAvailabilityRun: true,
		},
		VRPSolver: &MockVRPSolver{
			SolveVRPRunFunc: func(ctx context.Context, params *SolveVRPParams) (<-chan *WrappedSolveVRPResp, error) {
				solveVRPResps := make(chan *WrappedSolveVRPResp, 1)
				defer close(solveVRPResps)

				resp := &optimizerpb.SolveVRPResponse{}
				solveVRPResps <- &WrappedSolveVRPResp{
					Response: resp,
				}

				return solveVRPResps, nil
			},
		},
		availabilityRunnerDebug: true,
	}
	horizonDay := 1
	result, err := r.runAvailabilityRegionWithSettingConfig(
		context.Background(),
		zap.L().Sugar(),
		&AvailabilitySettingsConfig{
			Settings: optimizersettings.AvailabilitySettings{
				Attributes: []optimizersettings.AvailabilityAttribute{
					{
						Name:     "service_name",
						Variants: []string{"Acute"},
					},
				},
			},
			OptimizerConfig: &logisticssql.OptimizerConfig{},
		},
		TimestampToDate(now),
		now,
		horizonDay,
	)
	if err != nil {
		t.Fatal(err)
	}
	testutils.MustMatch(t, true, result != nil)

	runnerWithError := &Runner{
		ldb: &mockRunnerLDB{
			hasAnyNewScheduleSinceLastAvailabilityRunErr: errors.New("lol random error"),
		},
	}

	_, err = runnerWithError.runAvailabilityRegionWithSettingConfig(
		context.Background(),
		zap.L().Sugar(),
		&AvailabilitySettingsConfig{
			Settings: optimizersettings.AvailabilitySettings{
				Attributes: []optimizersettings.AvailabilityAttribute{
					{
						Name:     "service_name",
						Variants: []string{"Acute"},
					},
				},
			},
		},
		TimestampToDate(now),
		now,
		horizonDay,
	)
	testutils.MustMatch(t, true, err != nil)

	runnerWithNoNewSchedule := &Runner{
		ldb: &mockRunnerLDB{
			hasAnyNewScheduleSinceLastAvailabilityRun: false,
		},
	}

	result, err = runnerWithNoNewSchedule.runAvailabilityRegionWithSettingConfig(
		context.Background(),
		zap.L().Sugar(),
		&AvailabilitySettingsConfig{
			Settings: optimizersettings.AvailabilitySettings{
				Attributes: []optimizersettings.AvailabilityAttribute{
					{
						Name:     "service_name",
						Variants: []string{"Acute"},
					},
				},
			},
		},
		TimestampToDate(now),
		now,
		horizonDay,
	)
	testutils.MustMatch(t, true, result == nil)
	testutils.MustMatch(t, true, err == nil)
}

func TestRunRegionWithSettingConfigNoNewInfo(t *testing.T) {
	lastRun := &logisticssql.OptimizerRun{SnapshotTimestamp: time.Now()}
	r := &Runner{ldb: &mockRunnerLDB{
		hasAnyNewInfoInRegionDateSinceLastRunFunc: func(context.Context, logisticsdb.HasNewInfoParams) (*logisticsdb.NewRegionInfo, error) {
			// no new info since last run.
			return &logisticsdb.NewRegionInfo{HasNewInfo: false, LastRun: lastRun, TZ: time.UTC}, nil
		},
	}}
	result, err := r.runRegionWithSettingConfig(
		context.Background(),
		nil,
		&SettingsConfig{
			Settings: optimizersettings.Settings{
				CurrentDayScheduleMaxStalenessSec: nil,
			},
		},
		TimestampToDate(time.Now()),
		time.Now(),
	)
	testutils.MustMatch(t, true, result == nil, "no new info --> nil nil")
	testutils.MustMatch(t, true, err == nil, "no new info --> nil nil")
}

func TestConstraintConfigurations(t *testing.T) {
	expectedDefaultConfig := &ConstraintConfig{
		basis: &optimizerpb.VRPConstraintConfig{
			WorkDistribution: DefaultWorkDistributionConfig,
			LateArrival:      DefaultLateArrivalConfig,
			ClinicalUrgency:  DefaultClinicalUrgencyConfig,
			DepotLateArrival: DefaultDepotArrivalConfig,
		},
	}
	testutils.MustMatchProto(t, expectedDefaultConfig.ToProto(),
		DefaultConstraintConfig.ToProto(), "default constraint configuration doesn't match")

	configWithDisallowedLateArrivalVisitIds := DefaultConstraintConfig.WithDisallowedLateArrivalVisitIds(1, 2).ToProto()
	testutils.MustMatch(t, []int64{1, 2}, configWithDisallowedLateArrivalVisitIds.DepotLateArrival.DisallowedLateArrivalVisitIds, "not matching ids")
}

func TestSettingsConfig_TerminationDurationMs(t *testing.T) {
	configDurationMs := int64(1234)
	c := &SettingsConfig{
		Config: &logisticssql.OptimizerConfig{
			TerminationDurationMs: *proto.Int64(configDurationMs),
		},
	}

	testutils.MustMatch(t, configDurationMs, c.TerminationDurationMs())

	c.Settings.OptimizerTerminationDurationMs = 456
	testutils.MustMatch(t, c.Settings.OptimizerTerminationDurationMs, c.TerminationDurationMs())
}

func TestConstraintConfig_WithVisitLatenessToleranceOverrides(t *testing.T) {
	visits := []*optimizerpb.VRPVisit{
		// on-time.
		{
			Id: proto.Int64(1),
			ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{
				EndTimestampSec: proto.Int64(30),
			},
		},
		// already late.
		{
			Id: proto.Int64(2),
			ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{
				EndTimestampSec: proto.Int64(24),
			},
		},
		// feasibility check
		{
			Id: proto.Int64(-1),
			ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{
				EndTimestampSec: proto.Int64(30),
			},
		},
	}

	visitArrivalTimestamps := map[int64]time.Time{
		1: time.Unix(15, 0),
		2: time.Unix(18, 0),
	}

	feasibilityCheckVisitIDs := []int64{-1}

	thresholdMs := int64(100)
	shiftTeamStartBuffSec := int64(10)

	constraintConfig := ConstraintConfig{
		basis: &optimizerpb.VRPConstraintConfig{},
	}.WithVisitLatenessToleranceOverrides(VisitLatenessToleranceOverridesParams{
		VRPVisits:                  visits,
		VisitArrivalTimestamps:     visitArrivalTimestamps,
		FeasibilityCheckVisitIDs:   feasibilityCheckVisitIDs,
		DefaultLatenessThresholdMs: thresholdMs,
		ShiftTeamStartBufferSec:    shiftTeamStartBuffSec,
	})

	want := []*optimizerpb.VRPVisitLatenessTolerance{
		// feasibility check visits should not be allowed to be late
		{
			VisitId:                 -1,
			HardLatenessThresholdMs: uint64(thresholdMs),
		},
		// visits that are on-time should not become late.
		{
			VisitId:                 1,
			HardLatenessThresholdMs: uint64(thresholdMs),
		},
		// visits that are already late should not be allowed to get any later.
		{
			VisitId:                 2,
			HardLatenessThresholdMs: uint64(4000),
		},
	}

	testutils.MustMatch(
		t,
		want,
		constraintConfig.basis.LateArrival.VisitLatenessToleranceOverrides,
	)
}

func TestSettingsConstraintConfig(t *testing.T) {
	customUSDMillsCost := float32(0.0045)
	customFullQueueValueLimitUsdMills := uint64(100)
	onSceneCostScaleFactor := float32(0.012)
	foregoneVisitCostCentsPerMinute := float32(0.5)

	tcs := []struct {
		name     string
		settings optimizersettings.Settings

		expectedHighClinicalUrgencyConfig *optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig
		expectedWorkDistributionConfig    *optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig
		expectedOpportunityCostConfig     *optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig
	}{
		{
			name: "with custom values",
			settings: optimizersettings.Settings{
				ClinicalUrgencyLatenessCostUSDMillsPerMs:    &customUSDMillsCost,
				WorkDistributionFullQueueValueLimitUSDMills: &customFullQueueValueLimitUsdMills,
				OnSceneCostScaleFactor:                      &onSceneCostScaleFactor,
				ForegoneVisitCostCentsPerMinute:             &foregoneVisitCostCentsPerMinute,
			},

			expectedHighClinicalUrgencyConfig: &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig{
				HigherLevelValueWins: true,
				Policy: &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig_LinearOffsetPolicy_{
					LinearOffsetPolicy: &optimizerpb.VRPConstraintConfig_ClinicalUrgencyConfig_LinearOffsetPolicy{
						LatenessCostUsdMillsPerMs:       customUSDMillsCost,
						OffsetPriorToUrgencyWindowEndMs: uint64(time.Hour.Milliseconds()),
					},
				},
			},
			expectedWorkDistributionConfig: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig{
				Policy: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig_ExponentialPolicy_{
					ExponentialPolicy: &optimizerpb.VRPConstraintConfig_WorkDistributionConstraintConfig_ExponentialPolicy{
						BaseNumerator:               2,
						BaseDenominator:             1,
						FullQueueValueLimitUsdMills: customFullQueueValueLimitUsdMills,
					},
				},
			},
			expectedOpportunityCostConfig: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig{
				OnSceneCost: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearOnSceneCost{
					LinearOnSceneCost: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearOnSceneCostPolicy{
						ScalingFactor: onSceneCostScaleFactor,
					},
				},
				ForegoneVisitCost: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearForegoneVisitValue{
					LinearForegoneVisitValue: &optimizerpb.VRPConstraintConfig_OpportunityCostConstraintConfig_LinearForegoneVisitValuePolicy{
						CentsPerMinute: foregoneVisitCostCentsPerMinute,
					},
				},
			},
		},
		{
			name:     "with empty settings settings",
			settings: optimizersettings.Settings{},

			expectedHighClinicalUrgencyConfig: DefaultClinicalUrgencyConfig,
			expectedWorkDistributionConfig:    DefaultWorkDistributionConfig,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			res := DefaultConstraintConfig.WithOptimizerSettings(tc.settings)

			wantConfig := ConstraintConfig{
				basis: &optimizerpb.VRPConstraintConfig{
					WorkDistribution: tc.expectedWorkDistributionConfig,
					LateArrival:      DefaultLateArrivalConfig,
					ClinicalUrgency:  tc.expectedHighClinicalUrgencyConfig,
					DepotLateArrival: DefaultDepotArrivalConfig,
					OpportunityCost:  tc.expectedOpportunityCostConfig,
				},
			}

			testutils.MustMatchProto(t, wantConfig.ToProto(),
				res.ToProto(), "expected constraint config doesn't match")
		})
	}
}

func TestGetServiceRegionAndBaseServiceDate(t *testing.T) {
	logger := baselogger.NewSugaredLogger(baselogger.LoggerOptions{})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	now := time.Date(2022, time.June, 14, 15, 0, 0, 0, time.UTC)

	serviceRegionID := int64(123)

	serviceRegion := &logisticssql.ServiceRegion{
		ID:               serviceRegionID,
		IanaTimeZoneName: "America/Denver",
	}

	baseCaseTime := TimestampToDate(now)

	tcs := []struct {
		desc string

		ldb *mockRunnerLDB

		expectedServiceRegion   *logisticssql.ServiceRegion
		expectedBaseServiceDate *time.Time

		hasErr bool
	}{
		{
			desc: "base case",

			ldb: &mockRunnerLDB{
				serviceRegionMap: map[int64]*logisticssql.ServiceRegion{
					serviceRegionID: serviceRegion,
				},
			},

			expectedServiceRegion:   serviceRegion,
			expectedBaseServiceDate: &baseCaseTime,
		},
		{
			desc: "error getting service region",

			ldb: &mockRunnerLDB{},

			hasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			runner := NewRunner(tc.ldb, nil, logger, nil, 1*time.Hour, &optimizersettings.MockSettingsService{})

			gotServiceRegion, gotBaseServiceDate, err := runner.getServiceRegionAndBaseServiceDate(ctx, serviceRegionID, now)
			if tc.hasErr != (err != nil) {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.expectedServiceRegion, gotServiceRegion)
			testutils.MustMatch(t, tc.expectedBaseServiceDate, gotBaseServiceDate)
		})
	}
}

func TestGetAllInstanceSettingsMap(t *testing.T) {
	logger := baselogger.NewSugaredLogger(baselogger.LoggerOptions{})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	now := time.Date(2022, time.June, 14, 15, 0, 0, 0, time.UTC)

	goodServiceRegionID := int64(123)
	badServiceRegionID := int64(987)

	serviceRegion := &logisticssql.ServiceRegion{
		ID:               goodServiceRegionID,
		IanaTimeZoneName: "America/Denver",
	}

	optimizerConfigID := int64(234)
	optimizerSettings := optimizersettings.Settings{
		OptimizeHorizonDays: 1,
		OptimizerConfigID:   optimizerConfigID,
	}

	runInstanceKey := RunInstanceKey{
		serviceRegionID: goodServiceRegionID,
		serviceDate:     TimestampToDate(now),
	}

	emptyAllInstancesMap := &AllInstancesMap{
		OptimizerRegionSettingsMap:    runInstanceSettingsMap{},
		AvailabilityRegionSettingsMap: availabilityRunInstanceSettingsMap{},
	}

	tcs := []struct {
		desc string

		ldb             *mockRunnerLDB
		settingsService optimizersettings.MockSettingsService

		expectedAllInstancesMap *AllInstancesMap

		hasErr bool
	}{
		{
			desc: "base case",

			settingsService: optimizersettings.MockSettingsService{
				AllSettingsConfigs: &optimizersettings.AllSettings{
					OptimizerRegionSettingsMap: optimizersettings.RegionSettingsMap{
						goodServiceRegionID: optimizerSettings,
					},
					AvailabilityRegionSettingsMap: optimizersettings.AvailabilityRegionSettingsMap{
						goodServiceRegionID: optimizersettings.AvailabilitySettings{},
					},
				},
			},
			ldb: &mockRunnerLDB{
				optimizerConfigs: map[int64]*logisticssql.OptimizerConfig{
					goodServiceRegionID: {},
				},
				serviceRegionMap: map[int64]*logisticssql.ServiceRegion{
					goodServiceRegionID: serviceRegion,
				},
			},

			expectedAllInstancesMap: &AllInstancesMap{
				OptimizerRegionSettingsMap: runInstanceSettingsMap{
					runInstanceKey: &SettingsConfig{
						ServiceRegionID: goodServiceRegionID,
						Settings:        optimizerSettings,
					},
				},
				AvailabilityRegionSettingsMap: availabilityRunInstanceSettingsMap{
					runInstanceKey: &AvailabilitySettingsConfig{
						ServiceRegionID: goodServiceRegionID,
						Settings:        optimizersettings.AvailabilitySettings{},
					},
				},
			},
		},
		{
			desc: "error no optimizer configs found",

			settingsService: optimizersettings.MockSettingsService{
				AllSettingsConfigs: &optimizersettings.AllSettings{
					OptimizerRegionSettingsMap: optimizersettings.RegionSettingsMap{},
				},
			},
			ldb: &mockRunnerLDB{
				optimizerConfigsErr: errors.New("no optmizer configs"),
			},

			hasErr: true,
		},
		{
			desc: "error not all settings found",

			settingsService: optimizersettings.MockSettingsService{
				AllSettingsErr: errors.New("not all statsig settings found"),
			},

			hasErr: true,
		},
		{
			desc: "all settings are empty",

			settingsService: optimizersettings.MockSettingsService{
				AllSettingsConfigs: &optimizersettings.AllSettings{
					OptimizerRegionSettingsMap: optimizersettings.RegionSettingsMap{
						goodServiceRegionID: optimizersettings.Settings{},
					},
					AvailabilityRegionSettingsMap: optimizersettings.AvailabilityRegionSettingsMap{
						goodServiceRegionID: optimizersettings.AvailabilitySettings{},
					},
				},
			},
			ldb: &mockRunnerLDB{
				optimizerConfigs: map[int64]*logisticssql.OptimizerConfig{
					goodServiceRegionID: {},
				},
				serviceRegionMap: map[int64]*logisticssql.ServiceRegion{
					goodServiceRegionID: serviceRegion,
				},
			},

			expectedAllInstancesMap: emptyAllInstancesMap,
		},
		{
			desc: "availability settings inconsistent with optimizer settings",

			settingsService: optimizersettings.MockSettingsService{
				AllSettingsConfigs: &optimizersettings.AllSettings{
					OptimizerRegionSettingsMap: optimizersettings.RegionSettingsMap{
						goodServiceRegionID: optimizerSettings,
					},
					AvailabilityRegionSettingsMap: optimizersettings.AvailabilityRegionSettingsMap{
						badServiceRegionID: optimizersettings.AvailabilitySettings{},
					},
				},
			},
			ldb: &mockRunnerLDB{
				optimizerConfigs: map[int64]*logisticssql.OptimizerConfig{
					goodServiceRegionID: {},
				},
				serviceRegionMap: map[int64]*logisticssql.ServiceRegion{
					goodServiceRegionID: serviceRegion,
				},
			},

			hasErr: true,
		},
		{
			desc: "with capacity settings",

			settingsService: optimizersettings.MockSettingsService{
				AllSettingsConfigs: &optimizersettings.AllSettings{
					OptimizerRegionSettingsMap: optimizersettings.RegionSettingsMap{
						goodServiceRegionID: optimizerSettings,
					},
					AvailabilityRegionSettingsMap: optimizersettings.AvailabilityRegionSettingsMap{
						goodServiceRegionID: optimizersettings.AvailabilitySettings{
							CapacitySettings: []*optimizersettings.CapacitySettings{
								{
									ShiftTeamAttributes:           []string{"attr"},
									CapacityPercentForHorizonDays: []int32{100, 50},
								},
							},
						},
					},
				},
			},
			ldb: &mockRunnerLDB{
				optimizerConfigs: map[int64]*logisticssql.OptimizerConfig{
					goodServiceRegionID: {},
				},
				serviceRegionMap: map[int64]*logisticssql.ServiceRegion{
					goodServiceRegionID: serviceRegion,
				},
			},

			expectedAllInstancesMap: &AllInstancesMap{
				OptimizerRegionSettingsMap: runInstanceSettingsMap{
					runInstanceKey: &SettingsConfig{
						ServiceRegionID: goodServiceRegionID,
						Settings:        optimizerSettings,
					},
				},
				AvailabilityRegionSettingsMap: availabilityRunInstanceSettingsMap{
					runInstanceKey: &AvailabilitySettingsConfig{
						ServiceRegionID: goodServiceRegionID,
						Settings: optimizersettings.AvailabilitySettings{
							CapacitySettings: []*optimizersettings.CapacitySettings{
								{
									ShiftTeamAttributes:           []string{"attr"},
									CapacityPercentForHorizonDays: []int32{100, 50},
								},
							},
						},
					},
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			runner := NewRunner(tc.ldb, nil, logger, nil, 1*time.Hour, &tc.settingsService)

			gotAllInstancesMap, err := runner.getAllInstanceSettingsMap(ctx, now)
			if tc.hasErr != (err != nil) {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.expectedAllInstancesMap, gotAllInstancesMap)
		})
	}
}

func TestStartInstances(t *testing.T) {
	logger := baselogger.NewSugaredLogger(baselogger.LoggerOptions{})
	metrics := monitoring.NewMockScope()

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	serviceRegionID := int64(123)
	now := time.Date(2022, time.June, 14, 15, 0, 0, 0, time.UTC)
	keys := []RunInstanceKey{
		{
			serviceRegionID: serviceRegionID,
			serviceDate:     TimestampToDate(now),
		},
	}

	runner := NewRunner(nil, nil, logger, metrics, 1*time.Hour, nil)

	testFn := func(ctx context.Context, instanceKey RunInstanceKey, logger *zap.SugaredLogger, metrics monitoring.Scope) {
	}

	runner.startInstances(ctx, "starting instance test", keys, testFn)
}

func TestPopulateInstanceSettings_EmptySettingsMap(t *testing.T) {
	logger := baselogger.NewSugaredLogger(baselogger.LoggerOptions{})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	serviceRegionID := int64(123)
	optimizerConfigID := int64(234)
	ldb := &mockRunnerLDB{
		serviceRegionMap: map[int64]*logisticssql.ServiceRegion{
			serviceRegionID: {
				ID:               serviceRegionID,
				IanaTimeZoneName: "America/Denver",
			},
		},
		optimizerConfigs: map[int64]*logisticssql.OptimizerConfig{
			serviceRegionID: {},
		},
	}
	settingsService := optimizersettings.MockSettingsService{
		AllSettingsConfigs: &optimizersettings.AllSettings{
			OptimizerRegionSettingsMap: optimizersettings.RegionSettingsMap{
				serviceRegionID: optimizersettings.Settings{
					OptimizerConfigID: optimizerConfigID,
				},
			},
			AvailabilityRegionSettingsMap: optimizersettings.AvailabilityRegionSettingsMap{
				serviceRegionID: optimizersettings.AvailabilitySettings{},
			},
		},
	}
	runner := NewRunner(ldb, nil, logger, nil, 1*time.Hour, &settingsService)

	runner.populateInstanceSettings(ctx)

	testutils.MustMatch(t, runInstanceSettingsMap{}, runner.instanceSettingsMap)
	testutils.MustMatch(t, availabilityRunInstanceSettingsMap{}, runner.availabilityInstanceSettingsMap)
}

func TestGetAttrCombinations(t *testing.T) {
	tcs := []struct {
		desc                 string
		attributeGroups      [][]*logisticssql.Attribute
		expectedCombinations [][]int64
	}{
		{
			desc: "1 attribute group x 2 variants",
			attributeGroups: [][]*logisticssql.Attribute{
				{
					&logisticssql.Attribute{ID: 100, Name: "service_name:Acute"},
					&logisticssql.Attribute{ID: 200, Name: "service_name:Bridge"},
				},
			},

			expectedCombinations: [][]int64{
				{100},
				{200},
			},
		},
		{
			desc: "2 attribute group x 3 variants",
			attributeGroups: [][]*logisticssql.Attribute{
				{
					&logisticssql.Attribute{ID: 100, Name: "service_name:Acute"},
					&logisticssql.Attribute{ID: 200, Name: "service_name:Bridge"},
					&logisticssql.Attribute{ID: 300, Name: "service_name:Advanced"},
				},
				{
					&logisticssql.Attribute{ID: 1000, Name: "presentation_modality:in_person"},
					&logisticssql.Attribute{ID: 2000, Name: "presentation_modality:hybrid"},
					&logisticssql.Attribute{ID: 3000, Name: "presentation_modality:virtual"},
				},
			},

			expectedCombinations: [][]int64{
				{100, 1000},
				{100, 2000},
				{100, 3000},
				{200, 1000},
				{200, 2000},
				{200, 3000},
				{300, 1000},
				{300, 2000},
				{300, 3000},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			gotCombinations := getAttrCombinations(tc.attributeGroups)
			testutils.MustMatch(t, tc.expectedCombinations, gotCombinations)
		})
	}
}

func TestGenerateSimpleAvailVisits(t *testing.T) {
	tcs := []struct {
		desc string

		locIDs              []int64
		attrIDsCombinations [][]int64
		serviceDurations    logisticsdb.VisitServiceDurations

		expectedVisits []*simpleAvailabilityVisit
	}{
		{
			desc:   "1 location x 2 combinations x 2 durations",
			locIDs: []int64{1},
			attrIDsCombinations: [][]int64{
				{1},
				{2},
			},
			serviceDurations: logisticsdb.VisitServiceDurations{
				logisticsdb.MinVisitServiceDurationKey: 1 * time.Second,
				logisticsdb.MaxVisitServiceDurationKey: 2 * time.Second,
			},
			expectedVisits: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{1}, Duration: 1},
				{LocID: 1, AttrIDs: []int64{2}, Duration: 1},
				{LocID: 1, AttrIDs: []int64{1}, Duration: 2},
				{LocID: 1, AttrIDs: []int64{2}, Duration: 2},
			},
		},
		{
			desc:   "2 location x 4 combinations x 2 durations",
			locIDs: []int64{1, 2},
			attrIDsCombinations: [][]int64{
				{1, 10},
				{1, 20},
				{2, 10},
				{2, 20},
			},
			serviceDurations: logisticsdb.VisitServiceDurations{
				logisticsdb.MinVisitServiceDurationKey: 1 * time.Second,
				logisticsdb.MaxVisitServiceDurationKey: 2 * time.Second,
			},
			expectedVisits: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{1, 10}, Duration: 1},
				{LocID: 1, AttrIDs: []int64{1, 20}, Duration: 1},
				{LocID: 1, AttrIDs: []int64{2, 10}, Duration: 1},
				{LocID: 1, AttrIDs: []int64{2, 20}, Duration: 1},
				{LocID: 2, AttrIDs: []int64{1, 10}, Duration: 1},
				{LocID: 2, AttrIDs: []int64{1, 20}, Duration: 1},
				{LocID: 2, AttrIDs: []int64{2, 10}, Duration: 1},
				{LocID: 2, AttrIDs: []int64{2, 20}, Duration: 1},
				{LocID: 1, AttrIDs: []int64{1, 10}, Duration: 2},
				{LocID: 1, AttrIDs: []int64{1, 20}, Duration: 2},
				{LocID: 1, AttrIDs: []int64{2, 10}, Duration: 2},
				{LocID: 1, AttrIDs: []int64{2, 20}, Duration: 2},
				{LocID: 2, AttrIDs: []int64{1, 10}, Duration: 2},
				{LocID: 2, AttrIDs: []int64{1, 20}, Duration: 2},
				{LocID: 2, AttrIDs: []int64{2, 10}, Duration: 2},
				{LocID: 2, AttrIDs: []int64{2, 20}, Duration: 2},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			gotVisits := generateSimpleAvailabilityVisits(tc.locIDs, tc.attrIDsCombinations, tc.serviceDurations)
			testutils.MustMatch(t, len(tc.expectedVisits), len(gotVisits), "length of generated visits doesn't match")
		})
	}
}

func TestAreEqualVisits(t *testing.T) {
	tcs := []struct {
		desc string

		visits1 []*simpleAvailabilityVisit
		visits2 []*simpleAvailabilityVisit

		expected bool
	}{
		{
			desc: "base case",
			visits1: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 10},
			},
			visits2: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 10},
			},
			expected: true,
		},
		{
			desc: "different visits length",
			visits1: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 10},
				{LocID: 2, AttrIDs: []int64{100, 200}, Duration: 10},
			},
			visits2: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 10},
			},

			expected: false,
		},
		{
			desc: "different visit loc ids",
			visits1: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 10},
			},
			visits2: []*simpleAvailabilityVisit{
				{LocID: 999, AttrIDs: []int64{100, 200}, Duration: 10},
			},
			expected: false,
		},
		{
			desc: "different visit attribute length",
			visits1: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 10},
			},
			visits2: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{100, 200, 300}, Duration: 10},
			},
			expected: false,
		},
		{
			desc: "different visit attributes ids",
			visits1: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 10},
			},
			visits2: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{900, 800}, Duration: 10},
			},
			expected: false,
		},
		{
			desc: "different visit durations",
			visits1: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 10},
			},
			visits2: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 20},
			},
			expected: false,
		},
		{
			desc: "equal unordered visits and repeated fields",
			visits1: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 10},
				{LocID: 2, AttrIDs: []int64{400, 300}, Duration: 10},
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 20},
				{LocID: 2, AttrIDs: []int64{300, 400}, Duration: 20},
			},
			visits2: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{200, 100}, Duration: 10},
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 20},
				{LocID: 2, AttrIDs: []int64{300, 400}, Duration: 20},
				{LocID: 2, AttrIDs: []int64{400, 300}, Duration: 10},
			},
			expected: true,
		},
		{
			desc: "no equal unordered visits and repeated fields ",
			visits1: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 10},
				{LocID: 2, AttrIDs: []int64{400, 300}, Duration: 10},
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 20},
				{LocID: 3, AttrIDs: []int64{300, 400}, Duration: 20},
			},
			visits2: []*simpleAvailabilityVisit{
				{LocID: 1, AttrIDs: []int64{200, 100}, Duration: 10},
				{LocID: 1, AttrIDs: []int64{100, 200}, Duration: 20},
				{LocID: 2, AttrIDs: []int64{300, 400}, Duration: 20},
				{LocID: 2, AttrIDs: []int64{555, 300}, Duration: 11},
			},
			expected: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			testutils.MustMatch(t, tc.expected, areEqualVisits(tc.visits1, tc.visits2))
		})
	}
}

func TestGetLatestAvailabilityVisits(t *testing.T) {
	logger := baselogger.NewSugaredLogger(baselogger.LoggerOptions{})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	visitID := int64(1)
	locationID := int64(99)
	setID := int64(123)
	now := time.Now()
	openHoursTW := &logisticsdb.TimeWindow{
		Start: now,
		End:   now.Add(8 * time.Hour),
	}
	attrs := []*logisticssql.Attribute{
		{ID: 1, Name: "service_name:Acute"},
	}
	availabilityVisit := &logisticssql.ServiceRegionAvailabilityVisit{
		ID:                                  visitID,
		LocationID:                          locationID,
		ArrivalStartTime:                    openHoursTW.Start,
		ArrivalEndTime:                      openHoursTW.End,
		ServiceRegionAvailabilityVisitSetID: setID,
	}

	tcs := []struct {
		desc string

		ldb *mockRunnerLDB

		expectedVisits []*logisticssql.ServiceRegionAvailabilityVisit
		expectedAttrs  map[int64][]*logisticssql.Attribute
		hasErr         bool
	}{
		{
			desc: "base case",
			ldb: &mockRunnerLDB{
				availabilityVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
					availabilityVisit,
				},
				availabilityVisitAttrs: map[int64][]*logisticssql.Attribute{
					visitID: attrs,
				},
			},
			expectedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
				availabilityVisit,
			},
			expectedAttrs: map[int64][]*logisticssql.Attribute{
				visitID: attrs,
			},
		},
		{
			desc: "cannot get latest availability visits",
			ldb: &mockRunnerLDB{
				availabilityVisitsErr: errors.New("unexpected crashing"),
			},

			hasErr: true,
		},
		{
			desc: "cannot get availability attributes",
			ldb: &mockRunnerLDB{
				availabilityVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
					availabilityVisit,
				},
				availabilityVisitAttrsErr: errors.New("another unexpected crashing"),
			},

			hasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			settingsPollInterval := 1 * time.Hour
			runner := NewRunner(tc.ldb, nil, logger, nil, settingsPollInterval, &optimizersettings.MockSettingsService{})

			serviceRegionID := int64(1)
			gotVisits, gotAttrs, err := runner.getLatestAvailabilityVisits(ctx, serviceRegionID)
			if tc.hasErr != (err != nil) {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.expectedVisits, gotVisits)
			testutils.MustMatch(t, tc.expectedAttrs, gotAttrs)
		})
	}
}

func TestCreateAvailabilityVisits(t *testing.T) {
	logger := baselogger.NewSugaredLogger(baselogger.LoggerOptions{})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	visitID := int64(1)
	locationID := int64(99)
	setID := int64(123)
	now := time.Now()
	openHoursTW := &logisticsdb.TimeWindow{
		Start: now,
		End:   now.Add(8 * time.Hour),
	}
	attrs := []*logisticssql.Attribute{
		{ID: 1, Name: "service_name:Acute"},
	}
	availabilityVisitTx := &logisticssql.ServiceRegionAvailabilityVisit{
		ID:                                  visitID,
		LocationID:                          locationID,
		ArrivalStartTime:                    openHoursTW.Start,
		ArrivalEndTime:                      openHoursTW.End,
		ServiceRegionAvailabilityVisitSetID: setID,
	}

	tcs := []struct {
		desc string

		ldb *mockRunnerLDB

		expectedVisits []*logisticssql.ServiceRegionAvailabilityVisit
		expectedAttrs  map[int64][]*logisticssql.Attribute
		hasErr         bool
	}{
		{
			desc: "base case",
			ldb: &mockRunnerLDB{
				availabilityVisitsTx: []*logisticssql.ServiceRegionAvailabilityVisit{
					availabilityVisitTx,
				},
				availabilityVisitAttrsTx: []*logisticssql.ServiceRegionAvailabilityVisitAttribute{
					{ID: 5, AttributeID: 1, ServiceRegionAvailabilityVisitID: visitID},
				},
			},
			expectedVisits: []*logisticssql.ServiceRegionAvailabilityVisit{
				availabilityVisitTx,
			},
			expectedAttrs: map[int64][]*logisticssql.Attribute{
				visitID: attrs,
			},
		},
		{
			desc: "error during transaction",
			ldb: &mockRunnerLDB{
				availabilityVisitsTxErr: errors.New("oh no, transaction crashed"),
			},

			hasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			settingsPollInterval := 1 * time.Hour
			runner := NewRunner(tc.ldb, nil, logger, nil, settingsPollInterval, &optimizersettings.MockSettingsService{})

			serviceRegion := int64(1)
			now := time.Now()
			openHoursDay := &logisticssql.ServiceRegionOpenHoursScheduleDay{
				StartTime: now,
				EndTime:   now.Add(8 * time.Hour),
			}
			attrIDsCombinations := [][]int64{
				{1, 2},
			}
			attrsMap := map[int64]*logisticssql.Attribute{
				1: {ID: 1, Name: "service_name:Acute"},
				2: {ID: 2, Name: "service_name:Bridge"},
			}
			params := &createAvailabilityVisitsParams{
				serviceRegionID:     serviceRegion,
				locIDs:              []int64{locationID},
				attrIDsCombinations: attrIDsCombinations,
				openHoursDay:        openHoursDay,
				attrsMap:            attrsMap,
			}

			gotVisits, gotAttrs, err := runner.createAvailabilityVisits(ctx, params)
			if tc.hasErr != (err != nil) {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.expectedVisits, gotVisits)
			testutils.MustMatch(t, tc.expectedAttrs, gotAttrs)
		})
	}
}

func TestGetAvailabilityVisits(t *testing.T) {
	logger := baselogger.NewSugaredLogger(baselogger.LoggerOptions{})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	visitID := int64(10)
	locationID := int64(99)
	setID := int64(123)
	now := time.Now()
	openHoursTW := &logisticsdb.TimeWindow{
		Start: now,
		End:   now.Add(8 * time.Hour),
	}
	minServiceDuration := 300 * time.Second
	maxServiceDuration := 600 * time.Second
	visitDurations := make(logisticsdb.VisitServiceDurations)
	visitDurations[logisticsdb.MinVisitServiceDurationKey] = minServiceDuration
	visitDurations[logisticsdb.MaxVisitServiceDurationKey] = maxServiceDuration
	minServiceDurationSec := int64(minServiceDuration.Seconds())
	maxServiceDurationSec := int64(maxServiceDuration.Seconds())
	availabilityVisits := []*logisticssql.ServiceRegionAvailabilityVisit{
		{
			ID:                                  visitID,
			LocationID:                          locationID,
			ArrivalStartTime:                    openHoursTW.Start,
			ArrivalEndTime:                      openHoursTW.End,
			ServiceRegionAvailabilityVisitSetID: setID,
			ServiceDurationSec:                  minServiceDurationSec,
		},
		{
			ID:                                  visitID,
			LocationID:                          locationID,
			ArrivalStartTime:                    openHoursTW.Start,
			ArrivalEndTime:                      openHoursTW.End,
			ServiceRegionAvailabilityVisitSetID: setID,
			ServiceDurationSec:                  maxServiceDurationSec,
		},
	}
	overlapSetKey1 := logisticsdb.I64ToA(setID)
	serviceNameAcute := "service_name:Acute"
	attrs1 := []*logisticssql.Attribute{
		{ID: 1, Name: serviceNameAcute},
	}
	requiredAttrs := []*optimizerpb.VRPAttribute{
		{Id: serviceNameAcute},
	}

	visitIDTx := int64(20)
	setIDTx := int64(234)
	overlapSetKey2 := logisticsdb.I64ToA(setIDTx)
	attrs2 := []*logisticssql.Attribute{
		{ID: 2, Name: "presentation_modality:in_person"},
	}
	availabilityVisitsTx := []*logisticssql.ServiceRegionAvailabilityVisit{
		{
			ID:                                  visitIDTx,
			LocationID:                          locationID,
			ArrivalStartTime:                    openHoursTW.Start,
			ArrivalEndTime:                      openHoursTW.End,
			ServiceRegionAvailabilityVisitSetID: setIDTx,
			ServiceDurationSec:                  minServiceDurationSec,
		},
		{
			ID:                                  visitIDTx,
			LocationID:                          locationID,
			ArrivalStartTime:                    openHoursTW.Start,
			ArrivalEndTime:                      openHoursTW.End,
			ServiceRegionAvailabilityVisitSetID: setIDTx,
			ServiceDurationSec:                  maxServiceDurationSec,
		},
	}
	availabilityVisitAttrsTx := []*logisticssql.ServiceRegionAvailabilityVisitAttribute{
		{AttributeID: 1, ServiceRegionAvailabilityVisitID: visitIDTx},
	}
	arrivalTimeWindow := &optimizerpb.VRPTimeWindow{
		StartTimestampSec: proto.Int64(openHoursTW.Start.Unix()),
		EndTimestampSec:   proto.Int64(openHoursTW.End.Unix()),
	}
	acuity := &optimizerpb.VRPVisitAcuity{Level: proto.Int64(logisticsdb.DefaultOptimizerAcuityLevel)}

	tcs := []struct {
		desc string

		ldb *mockRunnerLDB

		expectedVRPVisits  []*optimizerpb.VRPVisit
		expectedVisitIDMap logisticsdb.AvailabilityVisitIDMap
		hasErr             bool
	}{
		{
			desc: "same availability visits, returns latest set",
			ldb: &mockRunnerLDB{
				attributes:         attrs1,
				availabilityVisits: availabilityVisits,
				availabilityVisitAttrs: map[int64][]*logisticssql.Attribute{
					visitID: attrs1,
				},
			},
			expectedVRPVisits: []*optimizerpb.VRPVisit{
				{
					Id:                    proto.Int64(-visitID),
					Acuity:                acuity,
					ArrivalTimeWindow:     arrivalTimeWindow,
					ServiceDurationSec:    proto.Int64(minServiceDurationSec),
					ExtraSetupDurationSec: proto.Int64(0),
					RequiredAttributes:    requiredAttrs,
					LocationId:            proto.Int64(locationID),
					OverlapSetKey:         proto.String(overlapSetKey1),
					IsExpendable:          proto.Bool(true),
				},
				{
					Id:                    proto.Int64(-visitID),
					Acuity:                acuity,
					ArrivalTimeWindow:     arrivalTimeWindow,
					ServiceDurationSec:    proto.Int64(maxServiceDurationSec),
					ExtraSetupDurationSec: proto.Int64(0),
					RequiredAttributes:    requiredAttrs,
					LocationId:            proto.Int64(locationID),
					OverlapSetKey:         proto.String(overlapSetKey1),
					IsExpendable:          proto.Bool(true),
				},
			},
			expectedVisitIDMap: logisticsdb.AvailabilityVisitIDMap{
				-visitID: visitID,
			},
		},
		{
			desc: "different availability visits, creates new set",
			ldb: &mockRunnerLDB{
				attributes:         attrs1,
				availabilityVisits: availabilityVisits,
				availabilityVisitAttrs: map[int64][]*logisticssql.Attribute{
					visitID: attrs2,
				},
				availabilityVisitsTx:     availabilityVisitsTx,
				availabilityVisitAttrsTx: availabilityVisitAttrsTx,
			},
			expectedVRPVisits: []*optimizerpb.VRPVisit{
				{
					Id:                    proto.Int64(-visitIDTx),
					Acuity:                acuity,
					ArrivalTimeWindow:     arrivalTimeWindow,
					ServiceDurationSec:    proto.Int64(minServiceDurationSec),
					ExtraSetupDurationSec: proto.Int64(0),
					RequiredAttributes:    requiredAttrs,
					LocationId:            proto.Int64(locationID),
					OverlapSetKey:         proto.String(overlapSetKey2),
					IsExpendable:          proto.Bool(true),
				},
				{
					Id:                    proto.Int64(-visitIDTx),
					Acuity:                acuity,
					ArrivalTimeWindow:     arrivalTimeWindow,
					ServiceDurationSec:    proto.Int64(maxServiceDurationSec),
					ExtraSetupDurationSec: proto.Int64(0),
					RequiredAttributes:    requiredAttrs,
					LocationId:            proto.Int64(locationID),
					OverlapSetKey:         proto.String(overlapSetKey2),
					IsExpendable:          proto.Bool(true),
				},
			},
			expectedVisitIDMap: logisticsdb.AvailabilityVisitIDMap{
				-visitIDTx: visitIDTx,
			},
		},
		{
			desc: "error retrieving latest visits",
			ldb: &mockRunnerLDB{
				attributes:            attrs1,
				availabilityVisitsErr: errors.New("obscure error"),
			},

			hasErr: true,
		},
		{
			desc: "error retrieving attributes",
			ldb: &mockRunnerLDB{
				attributesErr: errors.New("unexpected crashing"),
			},

			hasErr: true,
		},
		{
			desc: "incomplete attributes data",
			ldb: &mockRunnerLDB{
				attributes: []*logisticssql.Attribute{},
			},

			hasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			settingsPollInterval := 1 * time.Hour
			runner := NewRunner(tc.ldb, nil, logger, nil, settingsPollInterval, &optimizersettings.MockSettingsService{
				RegionSettings: &optimizersettings.Settings{
					VisitExtraSetupDurationSec: 0,
				},
			})

			serviceRegionID := int64(1)
			locIDs := []int64{locationID}
			settingsAttributes := []optimizersettings.AvailabilityAttribute{
				{Name: "service_name", Variants: []string{"Acute"}},
			}

			gotVRPVisits, gotIDMap, err := runner.getAvailabilityVisits(ctx, &getAvailabilityVisitsParams{
				serviceRegionID:         serviceRegionID,
				locIDs:                  locIDs,
				attributes:              settingsAttributes,
				openHoursTW:             openHoursTW,
				serviceDurations:        visitDurations,
				expendableVisitsEnabled: true,
			})
			if tc.hasErr != (err != nil) {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.expectedVRPVisits, gotVRPVisits, "expected visits does not match")
			testutils.MustMatch(t, tc.expectedVisitIDMap, gotIDMap, "expected visit ids map does not match")
		})
	}
}

func TestVRPInputForAvailability(t *testing.T) {
	logger := baselogger.NewSugaredLogger(baselogger.LoggerOptions{})

	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()

	optimizerSettings := &optimizersettings.Settings{
		DistanceValiditySec:                         1,
		OptimizerConfigID:                           1,
		FeasibilityCheckLatenessThresholdOverrideMs: proto.Int64(1),
	}
	serviceRegionVRPData := &logisticsdb.ServiceRegionVRPData{
		Settings: optimizerSettings,
	}
	latestSnapshotTimestamp := time.Now()

	tcs := []struct {
		desc string

		ldb *mockRunnerLDB

		vrpAvailabilityVisits []*optimizerpb.VRPVisit

		expectedVRPInputProblem *optimizerpb.VRPProblem
		hasErr                  bool
	}{
		{
			desc: "base case",
			ldb: &mockRunnerLDB{
				CreateVRPProblemRunFunc: func(context.Context, logisticsdb.VRPProblemParams) (*logisticsdb.VRPProblemData, error) {
					return &logisticsdb.VRPProblemData{
						VRPProblem: &optimizerpb.VRPProblem{
							Description: &optimizerpb.VRPDescription{
								Visits: []*optimizerpb.VRPVisit{
									{Id: proto.Int64(1), ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{EndTimestampSec: proto.Int64(1000)},
										Priority: &optimizerpb.VRPVisitPriority{UnassignedPriorityLevel: proto.Uint32(9)}},
									{Id: proto.Int64(2), ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{EndTimestampSec: proto.Int64(2000)},
										Priority: &optimizerpb.VRPVisitPriority{UnassignedPriorityLevel: proto.Uint32(2)}},
									{Id: proto.Int64(3), ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{EndTimestampSec: proto.Int64(3000)}},
								},
							},
						},
						OptimizerRun: &logisticssql.OptimizerRun{
							OptimizerConfigID: 0,
						},
						CheckFeasibilityDiagnostics: &logisticspb.CheckFeasibilityDiagnostics{
							ScheduleId: int64(999),
						},
					}, nil
				},
				visitArrivalTimestampsForSchedule: map[int64]time.Time{
					1: time.Unix(150, 0),
					2: time.Unix(250, 0),
					3: time.Unix(350, 0),
				},
			},
			vrpAvailabilityVisits: []*optimizerpb.VRPVisit{
				{Id: proto.Int64(-1), ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{EndTimestampSec: proto.Int64(4000)}},
				{Id: proto.Int64(-2), ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{EndTimestampSec: proto.Int64(5000)}},
			},

			expectedVRPInputProblem: &optimizerpb.VRPProblem{
				Description: &optimizerpb.VRPDescription{
					Visits: []*optimizerpb.VRPVisit{
						{Id: proto.Int64(1), ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{EndTimestampSec: proto.Int64(1000)},
							Priority: &optimizerpb.VRPVisitPriority{UnassignedPriorityLevel: proto.Uint32(9)}},
						{Id: proto.Int64(2), ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{EndTimestampSec: proto.Int64(2000)},
							Priority: &optimizerpb.VRPVisitPriority{UnassignedPriorityLevel: proto.Uint32(3)}},
						{Id: proto.Int64(3), ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{EndTimestampSec: proto.Int64(3000)},
							Priority: &optimizerpb.VRPVisitPriority{UnassignedPriorityLevel: proto.Uint32(1)}},
						{Id: proto.Int64(-1), ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{EndTimestampSec: proto.Int64(4000)}},
						{Id: proto.Int64(-2), ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{EndTimestampSec: proto.Int64(5000)}},
					},
				},
			},
		},
		{
			desc: "error creating vrp description",
			ldb: &mockRunnerLDB{
				CreateVRPProblemRunFunc: func(context.Context, logisticsdb.VRPProblemParams) (*logisticsdb.VRPProblemData, error) {
					return nil, errors.New("weird random vrp error")
				},
			},
			vrpAvailabilityVisits: []*optimizerpb.VRPVisit{
				{Id: proto.Int64(-1)},
			},

			hasErr: true,
		},
		{
			desc: "invalid priority",
			ldb: &mockRunnerLDB{
				CreateVRPProblemRunFunc: func(context.Context, logisticsdb.VRPProblemParams) (*logisticsdb.VRPProblemData, error) {
					return &logisticsdb.VRPProblemData{
						VRPProblem: &optimizerpb.VRPProblem{
							Description: &optimizerpb.VRPDescription{
								Visits: []*optimizerpb.VRPVisit{
									{Priority: &optimizerpb.VRPVisitPriority{UnassignedPriorityLevel: proto.Uint32(888)}},
								},
							},
						},
					}, nil
				},
			},

			hasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			settingsPollInterval := 1 * time.Hour
			runner := NewRunner(tc.ldb, nil, logger, nil, settingsPollInterval, &optimizersettings.MockSettingsService{})

			gotVRPInput, err := runner.vrpInputForAvailability(ctx, VRPInputForAvailabilityParams{
				ServiceRegionVRPData:    serviceRegionVRPData,
				VRPAvailabilityVisits:   tc.vrpAvailabilityVisits,
				LatestSnapshotTimestamp: latestSnapshotTimestamp,
				AvailabilitySettingsConfig: &AvailabilitySettingsConfig{
					OptimizerConfig: &logisticssql.OptimizerConfig{},
					Settings: optimizersettings.AvailabilitySettings{
						AllowLateAvailabilityVisits: true,
					},
				},
			})
			if tc.hasErr != (err != nil) {
				t.Fatal(err)
			}
			if tc.hasErr {
				return
			}

			testutils.MustMatch(t, tc.expectedVRPInputProblem, gotVRPInput.VRPRequest.Problem)
		})
	}
}

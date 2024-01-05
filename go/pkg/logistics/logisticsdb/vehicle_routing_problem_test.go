//go:build db_test

package logisticsdb_test

import (
	"context"
	"sort"
	"strconv"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/buildinfo"

	"github.com/*company-data-covered*/services/go/pkg/collections"
	"github.com/*company-data-covered*/services/go/pkg/logistics/validation"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

func TestCreateVRPProblem(t *testing.T) { //nolint:gocyclo,cyclop
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	mapService := &mockDistanceMatrix{distanceSourceID: 5}

	mockSettingsService := &optimizersettings.MockSettingsService{
		RegionSettings: &optimizersettings.Settings{
			VisitExtraSetupDurationSec:                    1,
			MarketAvailabilityUseCanonicalLocationsVisits: false,
			FeasibilityGetUnscheduledVisits:               true,
		},
	}

	tzLoc, err := time.LoadLocation("Asia/Tokyo")
	if err != nil {
		t.Fatal(err)
	}

	startDayTime, err := time.Parse(time.Kitchen, "0:00AM")
	if err != nil {
		t.Fatal(err)
	}
	endDayTime, err := time.Parse(time.Kitchen, "11:59PM")
	if err != nil {
		t.Fatal(err)
	}
	now := time.Now().In(tzLoc)
	date := time.Date(now.Year(), now.Month(), now.Day(), 0, 0, 0, 0, now.Location())

	startTimestamp := logisticsdb.TimestampFromDateTimeLoc(date, startDayTime, tzLoc)
	endTimestamp := logisticsdb.TimestampFromDateTimeLoc(date, endDayTime, tzLoc)

	nextShiftTeamID := time.Now().UnixNano()
	nextCareReqID := time.Now().UnixNano()

	urgencyLevelID := int64(commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_HIGH)
	urgencyOptimizerLevelID := int64(3)       // Current value for HIGH urgency level
	urgencyConfigTimeWindowSec := int64(7200) // 2 hours in secs

	tcs := []struct {
		Desc                                string
		PerShiftTeamSnapshotCounts          []int
		PerVisitSnapshotCounts              []int
		IncludeCheckFeasibility             bool
		CheckFeasibilityDate                bool
		ExpectedNumberOfDistances           int
		ShiftTeamsHaveUnrequestedRestBreaks bool

		HasError bool
	}{
		{
			Desc:                       "base case",
			PerShiftTeamSnapshotCounts: []int{1},
			PerVisitSnapshotCounts:     []int{1},
			ExpectedNumberOfDistances:  12,
		},
		{
			Desc:                       "2 shift teams",
			PerShiftTeamSnapshotCounts: []int{1, 1},
			PerVisitSnapshotCounts:     []int{1},
			ExpectedNumberOfDistances:  24,
		},
		{
			Desc:                       "2 visits",
			PerShiftTeamSnapshotCounts: []int{1},
			PerVisitSnapshotCounts:     []int{1, 1},
			ExpectedNumberOfDistances:  19,
		},
		{
			Desc:                       "2 visits - multiple snapshots",
			PerShiftTeamSnapshotCounts: []int{1},
			PerVisitSnapshotCounts:     []int{2, 2},
			// fewer distances needed since committed visits are in the linear portion of the distances
			// i.e. only need one distance incoming to them from the shift team's current position.
			// (and the 2's in PerVisitSnapshotCounts transitions the visits into committed states)
			ExpectedNumberOfDistances: 9,
		},
		{
			Desc:                       "base case, with feasibility request time window",
			PerShiftTeamSnapshotCounts: []int{1},
			PerVisitSnapshotCounts:     []int{1},
			ExpectedNumberOfDistances:  19,
			IncludeCheckFeasibility:    true,
			CheckFeasibilityDate:       false,
		},
		{
			Desc:                                "base case, with feasibility request time window, with unrequested rest break",
			PerShiftTeamSnapshotCounts:          []int{1},
			PerVisitSnapshotCounts:              []int{1},
			ExpectedNumberOfDistances:           16,
			IncludeCheckFeasibility:             true,
			CheckFeasibilityDate:                false,
			ShiftTeamsHaveUnrequestedRestBreaks: true,
		},
		{
			Desc:                       "base case, with feasibility request date",
			PerShiftTeamSnapshotCounts: []int{1},
			PerVisitSnapshotCounts:     []int{1},
			ExpectedNumberOfDistances:  19,
			IncludeCheckFeasibility:    true,
			CheckFeasibilityDate:       true,
		},
		{
			Desc:     "no visits and no shift teams",
			HasError: true,
		},
		{
			Desc:                      "no visits and no shift teams, has feasibility request",
			IncludeCheckFeasibility:   true,
			HasError:                  false,
			ExpectedNumberOfDistances: 1,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			ldb := logisticsdb.NewLogisticsDB(
				db,
				logistics.NewMapServicePicker(
					mapService,
					mapService,
					mockSettingsService,
				),
				mockSettingsService,
				monitoring.NewMockScope())
			serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
				Description:      "vrp description region",
				IanaTimeZoneName: tzLoc.String(),
			})
			if err != nil {
				t.Fatal(err)
			}

			minServiceDuration := 300 * time.Second
			maxServiceDuration := 600 * time.Second
			_, err = queries.AddServiceRegionCanonicalVisitDurations(ctx, logisticssql.AddServiceRegionCanonicalVisitDurationsParams{
				ServiceRegionID:       serviceRegion.ID,
				ServiceDurationMinSec: int64(minServiceDuration.Seconds()),
				ServiceDurationMaxSec: int64(maxServiceDuration.Seconds()),
			})
			if err != nil {
				t.Fatal(err)
			}

			shiftTeamStartBufferSecFromSettings := int64(100)
			stationMarketID := time.Now().UnixNano()

			_, err = queries.AddMarket(ctx, logisticssql.AddMarketParams{
				ServiceRegionID: serviceRegion.ID,
				StationMarketID: stationMarketID,
			})
			if err != nil {
				t.Fatal(err)
			}

			schedule, err := queries.AddServiceRegionOpenHoursSchedule(ctx, serviceRegion.ID)
			if err != nil {
				t.Fatal(err)
			}

			_, err = queries.AddServiceRegionOpenHoursScheduleDays(
				ctx,
				logisticssql.AddServiceRegionOpenHoursScheduleDaysParams{
					ServiceRegionOpenHoursScheduleIds: []int64{schedule.ID},
					DaysOfWeek:                        []int32{int32(date.Weekday())},
					StartTimes:                        []time.Time{startDayTime},
					EndTimes:                          []time.Time{endDayTime},
				})
			if err != nil {
				t.Fatal(err)
			}

			var restBreakRequests []*logisticssql.ShiftTeamRestBreakRequest
			latestShiftTeams := make([]*logisticssql.ShiftTeamSnapshot, 0, len(tc.PerShiftTeamSnapshotCounts))
			var newestShiftTeamSnapshot *logisticssql.ShiftTeamSnapshot
			var expectedUnrequestedVRPRestBreaks []*optimizerpb.VRPRestBreak
			shiftKnownTimestampSecs := make(map[int64]int64)

			const restBreakDuration = 5 * time.Second

			for _, snapshotCount := range tc.PerShiftTeamSnapshotCounts {
				shiftTeamID := nextShiftTeamID
				nextShiftTeamID++

				for i := 0; i < snapshotCount; i++ {
					shiftTeamSnapshot, err := ldb.WriteShiftTeamSnapshot(
						ctx,
						shiftTeamID,
						&shiftteampb.GetShiftTeamResponse{
							ShiftTeam: &shiftteampb.ShiftTeam{
								Id:       shiftTeamID,
								MarketId: &stationMarketID,
								BaseLocation: &commonpb.Location{
									LatitudeE6:  *proto.Int32(int32(time.Now().UnixNano())),
									LongitudeE6: *proto.Int32(int32(time.Now().UnixNano())),
								},
								ShiftTimeWindow: &commonpb.TimeWindow{
									StartDatetime: logisticsdb.TimeToProtoDateTime(&startTimestamp),
									EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTimestamp),
								},
								ShiftTeamAttributes: []*commonpb.Attribute{
									{Name: "shift team attr1"},
									{Name: "shift team attr2"},
								},
							},
						})
					if err != nil {
						t.Fatal(err)
					}
					newestShiftTeamSnapshot = shiftTeamSnapshot
				}

				if newestShiftTeamSnapshot != nil { //nolint:nestif
					latestShiftTeams = append(latestShiftTeams, newestShiftTeamSnapshot)
					loc, err := queries.UpsertLocation(ctx, logisticssql.UpsertLocationParams{
						LatitudeE6:  int32(time.Now().UnixNano()),
						LongitudeE6: int32(time.Now().UnixNano()),
					})
					if err != nil {
						t.Fatal(err)
					}

					if tc.ShiftTeamsHaveUnrequestedRestBreaks {
						expectedUnrequestedVRPRestBreaks = append(
							expectedUnrequestedVRPRestBreaks,
							&optimizerpb.VRPRestBreak{
								Id:          proto.Int64(newestShiftTeamSnapshot.ShiftTeamID),
								ShiftTeamId: proto.Int64(newestShiftTeamSnapshot.ID),
								DurationSec: proto.Int64(int64(restBreakDuration.Seconds())),
								Unrequested: proto.Bool(true),
							})
					} else {
						restBreakStart := newestShiftTeamSnapshot.CreatedAt.Add(10 * time.Minute)
						rbrResponse, err := ldb.AddShiftTeamRestBreakRequest(
							ctx,
							logisticsdb.AddShiftTeamRestBreakParams{
								RestBreakParams: logisticssql.AddShiftTeamRestBreakRequestParams{
									ShiftTeamID:          newestShiftTeamSnapshot.ShiftTeamID,
									StartTimestampSec:    restBreakStart.Unix(),
									DurationSec:          int64(restBreakDuration.Seconds()),
									LocationID:           loc[0].ID,
									MaxRestBreakRequests: 1,
								},
								LatestTimestamp: newestShiftTeamSnapshot.CreatedAt,
							},
						)
						if err != nil {
							t.Fatal(err)
						}

						restBreakRequests = append(restBreakRequests, rbrResponse.RestBreakRequest)
						shiftKnownTimestampSecs[shiftTeamID] = rbrResponse.RestBreakRequest.StartTimestampSec
					}
				}
			}
			writeSnapshot := func(careReqID int64, name logisticsdb.VisitPhaseShortName) *logisticssql.VisitSnapshot {
				var shiftTeamID *int64
				if name == logisticsdb.VisitPhaseTypeShortNameCommitted {
					shiftTeamID = proto.Int64(newestShiftTeamSnapshot.ShiftTeamID)
				}
				writeVisitSnapshotParams := &writeVisitSnapshotParams{
					stationMarketID: stationMarketID,
					careReqID:       careReqID,
					shiftTeamID:     shiftTeamID,
					visitPhase:      name,
					start:           startTimestamp,
					end:             endTimestamp,
					ldb:             ldb,
				}
				return writeVisitSnapshotWithStartEnd(ctx, t, writeVisitSnapshotParams)
			}

			if err != nil {
				t.Fatal(err)
			}

			latestVisits := make([]*logisticssql.VisitSnapshot, 0, len(tc.PerVisitSnapshotCounts))
			var latestCommittedVisitSnapshots []*logisticssql.VisitSnapshot
			for _, snapshotCount := range tc.PerVisitSnapshotCounts {
				var newestSnapshot *logisticssql.VisitSnapshot

				careReqID := nextCareReqID
				nextCareReqID++

				// if the test has multiple snapshots, move them through this progression.
				statusProgression := []logisticsdb.VisitPhaseShortName{
					logisticsdb.VisitPhaseTypeShortNameUncommitted,
					logisticsdb.VisitPhaseTypeShortNameCommitted,
				}
				for i := 0; i < snapshotCount; i++ {
					newestSnapshot = writeSnapshot(careReqID, statusProgression[i])
					if i == snapshotCount-1 {
						if statusProgression[i] == logisticsdb.VisitPhaseTypeShortNameCommitted {
							latestCommittedVisitSnapshots = append(latestCommittedVisitSnapshots, newestSnapshot)
						}
					}

					_, err = queries.AddVisitAcuitySnapshot(
						ctx,
						logisticssql.AddVisitAcuitySnapshotParams{
							VisitSnapshotID:        newestSnapshot.ID,
							ClinicalUrgencyLevelID: sqltypes.ToValidNullInt64(urgencyLevelID),
						},
					)
					if err != nil {
						t.Fatal(err)
					}
				}

				latestVisits = append(latestVisits, newestSnapshot)
			}
			var unassignedVisitSnapshot *logisticssql.VisitSnapshot
			if tc.PerVisitSnapshotCounts != nil {
				// only add this unassigned visit if we have other visits
				unassignedVisitSnapshot = writeSnapshot(nextCareReqID, logisticsdb.VisitPhaseTypeShortNameUncommitted)

				_, err = queries.AddVisitAcuitySnapshot(
					ctx,
					logisticssql.AddVisitAcuitySnapshotParams{
						VisitSnapshotID:        unassignedVisitSnapshot.ID,
						ClinicalUrgencyLevelID: sqltypes.ToValidNullInt64(urgencyLevelID),
					},
				)
				if err != nil {
					t.Fatal(err)
				}

				latestVisits = append(latestVisits, unassignedVisitSnapshot)
			}

			snapshotTime := time.Now()
			if len(latestShiftTeams) > 0 {
				snapshotTime = latestShiftTeams[len(latestShiftTeams)-1].CreatedAt
			}
			if len(latestVisits) > 0 {
				snapshotTime = latestVisits[len(latestVisits)-1].CreatedAt
			}

			useDistancesAfterTime := snapshotTime.Add(-10 * time.Hour)

			var feasibilityReq *logisticspb.CheckFeasibilityRequest
			var feasibilityVisit *logisticspb.CheckFeasibilityVisit
			var cfLocIDs []int64
			if tc.IncludeCheckFeasibility {
				cfvLocation := &commonpb.Location{
					LatitudeE6:  *proto.Int32(int32(time.Now().UnixNano())),
					LongitudeE6: *proto.Int32(int32(time.Now().UnixNano())),
				}
				feasibilityReq = &logisticspb.CheckFeasibilityRequest{
					Visits: []*logisticspb.CheckFeasibilityVisit{
						{
							ServiceDurationSec: proto.Int64(123),
							Location:           cfvLocation,
							ArrivalTimeSpecification: &logisticspb.CheckFeasibilityVisit_ArrivalTimeWindow{
								ArrivalTimeWindow: &commonpb.TimeWindow{
									StartDatetime: logisticsdb.TimeToProtoDateTime(&startTimestamp),
									EndDatetime:   logisticsdb.TimeToProtoDateTime(&endTimestamp),
								},
							},
							RequiredAttributes: []*commonpb.Attribute{
								{Name: "required visit attr1"},
								{Name: "required visit attr2"},
							},
							PreferredAttributes: []*commonpb.Attribute{
								{Name: "preferred visit attr1"},
								{Name: "preferred visit attr2"},
							},
							ForbiddenAttributes: []*commonpb.Attribute{
								{Name: "forbidden visit attr1"},
								{Name: "forbidden visit attr2"},
							},
							UnwantedAttributes: []*commonpb.Attribute{
								{Name: "unwanted visit attr1"},
								{Name: "unwanted visit attr2"},
							},
						},
					},
				}

				if tc.CheckFeasibilityDate {
					feasibilityReq.Visits[0].ArrivalTimeSpecification = &logisticspb.CheckFeasibilityVisit_ArrivalDate{
						ArrivalDate: logisticsdb.TimeToProtoDate(&startTimestamp),
					}
				}

				err := ldb.UpsertVisitLocations(ctx, feasibilityReq.Visits)
				if err != nil {
					t.Fatal(err)
				}

				cfvLoc, err := queries.GetLocation(ctx, logisticssql.GetLocationParams{
					LatitudeE6:  cfvLocation.LatitudeE6,
					LongitudeE6: cfvLocation.LongitudeE6,
				})
				if err != nil {
					t.Fatal(err)
				}

				cfLocIDs = append(cfLocIDs, cfvLoc.ID)
				feasibilityVisit = feasibilityReq.Visits[0]
			}

			lastOptimizerRun, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
				ServiceRegionID:  serviceRegion.ID,
				ServiceDate:      date,
				OptimizerRunType: string(logisticsdb.ServiceRegionScheduleRunType),
			})
			if err != nil {
				t.Fatal(err)
			}
			snapshotTime = lastOptimizerRun.CreatedAt
			testutils.MustFn(t)(queries.AddSchedule(ctx,
				logisticssql.AddScheduleParams{ServiceRegionID: serviceRegion.ID, OptimizerRunID: lastOptimizerRun.ID},
			))
			latestSchedule, err := queries.AddSchedule(ctx,
				logisticssql.AddScheduleParams{ServiceRegionID: serviceRegion.ID, OptimizerRunID: lastOptimizerRun.ID},
			)
			if err != nil {
				t.Fatal(err)
			}
			if unassignedVisitSnapshot != nil {
				_, err = queries.AddUnassignedScheduleVisitsToSchedule(
					ctx,
					logisticssql.AddUnassignedScheduleVisitsToScheduleParams{
						ScheduleID: latestSchedule.ID,
						// the second should be reconciled out of the description since it doesn't exist anymore.
						VisitSnapshotIds: []int64{unassignedVisitSnapshot.ID, time.Now().UnixNano()},
					})
				if err != nil {
					t.Fatal(err)
				}
			}

			var shiftTeamStartBufferSec int64
			if tc.IncludeCheckFeasibility {
				shiftTeamStartBufferSec = shiftTeamStartBufferSecFromSettings
			}

			// TODO(MARK-2388): Build the VRP data manually instead of calling this
			vrpData, err := ldb.GetServiceRegionVRPData(ctx, &logisticsdb.ServiceRegionVRPDataParams{
				ServiceRegionID:       serviceRegion.ID,
				ServiceDate:           date,
				CheckFeasibilityVisit: feasibilityVisit,
				SnapshotTime:          snapshotTime,
			})
			if err != nil {
				t.Fatal(err)
			}

			problemData, err := ldb.CreateVRPProblem(ctx, logisticsdb.VRPProblemParams{
				ServiceRegionVRPData:  vrpData,
				UseDistancesAfterTime: useDistancesAfterTime,
				ValidationConfig: validation.Config{
					// for testing, we ensure that we fail as early as possible.
					FailOnRecoverableError: true,
					ProblemValidators:      logisticsdb.DefaultProblemValidators,
				},
				ShiftTeamStartBufferSec: shiftTeamStartBufferSec,
				UnrequestedRestBreakConfig: logisticsdb.UnrequestedRestBreakConfig{
					IncludeUnrequestedRestBreaks: feasibilityReq != nil,
					RestBreakDuration:            restBreakDuration,
				},
			})

			if (err != nil) != tc.HasError {
				t.Fatalf("HasError does not match: %v, tc: %+v", err, tc)
			}

			if tc.HasError {
				return
			}

			newOptimizerRun, err := ldb.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
				ServiceRegionID:            problemData.OptimizerRun.ServiceRegionID,
				ServiceDate:                problemData.OptimizerRun.ServiceDate,
				OpenHoursScheduleDayID:     problemData.OptimizerRun.OpenHoursScheduleDayID,
				OpenHoursStartTimestampSec: problemData.OptimizerRun.OpenHoursStartTimestampSec,
				OpenHoursEndTimestampSec:   problemData.OptimizerRun.OpenHoursEndTimestampSec,
				EarliestDistanceTimestamp:  problemData.OptimizerRun.EarliestDistanceTimestamp,
				LatestDistanceTimestamp:    problemData.OptimizerRun.LatestDistanceTimestamp,
				SnapshotTimestamp:          problemData.OptimizerRun.SnapshotTimestamp,
				OptimizerConfigID:          problemData.OptimizerRun.OptimizerConfigID,
				ServiceVersion:             problemData.OptimizerRun.ServiceVersion,
				OptimizerRunType:           string(logisticsdb.ServiceRegionScheduleRunType),
			}, &optimizerpb.VRPConstraintConfig{}, &optimizersettings.Settings{})
			if err != nil {
				t.Fatal(err)
			}
			problem := problemData.VRPProblem
			desc := problem.GetDescription()

			var shiftTeamProtos []*optimizerpb.VRPShiftTeam
			idx := make(map[int64]int64, len(shiftTeamProtos))
			for _, shiftTeam := range latestShiftTeams {
				idx[shiftTeam.ShiftTeamID] = shiftTeam.ID

				startTimestampSec := shiftTeam.StartTimestampSec + shiftTeamStartBufferSec
				knownTimestampSec := snapshotTime.Unix()
				if shiftKnownTimestampSecs[shiftTeam.ShiftTeamID] > 0 {
					knownTimestampSec = shiftKnownTimestampSecs[shiftTeam.ShiftTeamID]
				}
				shiftTeamProto := &optimizerpb.VRPShiftTeam{
					Id:              &shiftTeam.ID,
					DepotLocationId: &shiftTeam.BaseLocationID,
					AvailableTimeWindow: &optimizerpb.VRPTimeWindow{
						StartTimestampSec: &startTimestampSec,
						EndTimestampSec:   &shiftTeam.EndTimestampSec,
					},
					Attributes: []*optimizerpb.VRPAttribute{
						{Id: "shift team attr1"},
						{Id: "shift team attr2"},
					},
					RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
						CurrentPosition: &optimizerpb.VRPShiftTeamPosition{
							LocationId:        shiftTeam.BaseLocationID,
							KnownTimestampSec: knownTimestampSec,
						},
					},
					UpcomingCommitments: &optimizerpb.VRPShiftTeamCommitments{},
					NumAppMembers:       proto.Int32(shiftTeam.NumAppMembers),
					NumDhmtMembers:      proto.Int32(shiftTeam.NumDhmtMembers),
				}
				if shiftTeam == newestShiftTeamSnapshot {
					for _, v := range latestCommittedVisitSnapshots {
						shiftTeamProto.UpcomingCommitments.Commitments = append(shiftTeamProto.UpcomingCommitments.Commitments,
							&optimizerpb.VRPShiftTeamCommitment{VisitId: proto.Int64(v.ID)},
						)
					}
				}
				shiftTeamProtos = append(shiftTeamProtos, shiftTeamProto)
			}
			var restBreakProtos []*optimizerpb.VRPRestBreak
			for _, rbr := range restBreakRequests {
				restBreakProtos = append(restBreakProtos,
					&optimizerpb.VRPRestBreak{
						Id:                proto.Int64(rbr.ID),
						ShiftTeamId:       proto.Int64(idx[rbr.ShiftTeamID]),
						LocationId:        proto.Int64(rbr.LocationID),
						StartTimestampSec: proto.Int64(rbr.StartTimestampSec),
						DurationSec:       proto.Int64(rbr.DurationSec),
						Unrequested:       proto.Bool(false),
					},
				)

				for _, st := range shiftTeamProtos {
					if st.GetId() != idx[rbr.ShiftTeamID] {
						continue
					}
					st.RouteHistory.Stops = append(st.RouteHistory.Stops, &optimizerpb.VRPShiftTeamRouteStop{
						Stop: &optimizerpb.VRPShiftTeamRouteStop_RestBreak{
							RestBreak: &optimizerpb.VRPShiftTeamRestBreak{
								RestBreakId:       proto.Int64(rbr.ID),
								StartTimestampSec: proto.Int64(rbr.StartTimestampSec),
							}},
						ActualStartTimestampSec: proto.Int64(rbr.StartTimestampSec),
						// note that the rest break is currently in progress (i.e. latestTimestamp < start + duration)
						Pinned: proto.Bool(true),
					})
					knownTimestampSec := snapshotTime.Unix()
					if shiftKnownTimestampSecs[rbr.ShiftTeamID] > 0 {
						knownTimestampSec = shiftKnownTimestampSecs[rbr.ShiftTeamID]
					}
					st.RouteHistory.CurrentPosition = &optimizerpb.VRPShiftTeamPosition{
						LocationId:        rbr.LocationID,
						KnownTimestampSec: knownTimestampSec,
					}
				}
			}
			restBreakProtos = append(restBreakProtos, expectedUnrequestedVRPRestBreaks...)
			var visitProtos []*optimizerpb.VRPVisit
			for _, visit := range latestVisits {
				visitProtos = append(visitProtos,
					&optimizerpb.VRPVisit{
						Id:         &visit.ID,
						LocationId: &visit.LocationID,
						ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{
							StartTimestampSec: proto.Int64(startTimestamp.Unix()),
							EndTimestampSec:   proto.Int64(endTimestamp.Unix()),
						},
						ServiceDurationSec: &visit.ServiceDurationSec,
						RequiredAttributes: []*optimizerpb.VRPAttribute{
							{Id: "required visit attr1"},
							{Id: "required visit attr2"},
							// preferred attrs are mapped for non manually-overridden CRs.
							{Id: "preferred visit attr1"},
							{Id: "preferred visit attr2"},
						},
						ForbiddenAttributes: []*optimizerpb.VRPAttribute{
							{Id: "forbidden visit attr1"},
							{Id: "forbidden visit attr2"},
							// setting unwanted attributes as forbidden
							{Id: "unwanted visit attr1"},
							{Id: "unwanted visit attr2"},
						},
						Acuity: &optimizerpb.VRPVisitAcuity{
							Level: &urgencyOptimizerLevelID,
							TimeWindow: &optimizerpb.VRPTimeWindow{
								StartTimestampSec: proto.Int64(startTimestamp.Unix()),
								EndTimestampSec:   proto.Int64(startTimestamp.Unix() + urgencyConfigTimeWindowSec),
							},
						},
						ExtraSetupDurationSec: proto.Int64(1),
					})
			}
			var unassignedVisitProtos []*optimizerpb.VRPUnassignedVisit
			if unassignedVisitSnapshot != nil {
				unassignedVisitProtos = append(unassignedVisitProtos, &optimizerpb.VRPUnassignedVisit{
					VisitId: proto.Int64(unassignedVisitSnapshot.ID),
					Pinned:  proto.Bool(tc.IncludeCheckFeasibility),
				})
			}

			testutils.MustMatchProtoFn("locations", "distance_matrix")(t, &optimizerpb.VRPDescription{
				ShiftTeams:          shiftTeamProtos,
				RestBreaks:          restBreakProtos,
				Visits:              visitProtos,
				UnassignedVisits:    unassignedVisitProtos,
				CurrentTimestampSec: proto.Int64(snapshotTime.Unix()),
			}, desc, "not matching VRPDescription")

			// in production, usually the rest break requests actually use the latest snapshot's location;
			// but this test case writes new locations.
			testutils.MustMatch(
				t,
				len(tc.PerShiftTeamSnapshotCounts)+len(cfLocIDs)+len(restBreakRequests)+len(latestVisits),
				len(desc.Locations),
				"wrong number of locations")

			testutils.MustMatch(
				t,
				tc.ExpectedNumberOfDistances,
				len(desc.DistanceMatrix.Distances),
				"wrong number of distances")

			// and test GetOptimizerRunDiagnostics a little, given how complicated this CreateVRPProblem setup is.
			diagnostics, err := ldb.GetOptimizerRunDiagnostics(ctx, newOptimizerRun.ID, nil, nil)
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatch(t, newOptimizerRun.ID, diagnostics.Run.ID)
			testutils.MustMatch(t, true, diagnostics.UnvalidatedProblem != nil)
			testutils.MustMatch(t, true, diagnostics.Problem != nil)
		})
	}
}

func TestGetUnscheduledVisitsVRPData(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	startDayTime, _ := time.Parse(time.Kitchen, "8:00AM")
	endDayTime, _ := time.Parse(time.Kitchen, "10:00PM")

	serviceDate := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)

	startTimestamp := logisticsdb.TimestampFromDateTimeLoc(serviceDate, startDayTime, time.UTC)
	endTimestamp := logisticsdb.TimestampFromDateTimeLoc(serviceDate, endDayTime, time.UTC)
	marketID := time.Now().UnixNano()

	settings := &optimizersettings.Settings{
		FeasibilityGetUnscheduledVisits: false,
	}
	mockSettingsService = &optimizersettings.MockSettingsService{RegionSettings: settings}
	ldb := logisticsdb.NewLogisticsDB(db, nil, mockSettingsService, monitoring.NewMockScope())

	serviceRegionData, err := setupForGetServiceRegionVRPData(
		ctx,
		queries,
		marketID,
		startTimestamp,
		endTimestamp,
	)
	if err != nil {
		t.Fatal(err)
	}

	serviceRegion := serviceRegionData.serviceRegion
	schedule, err := createNewSchedule(ctx, &newScheduleParams{
		serviceRegionID: serviceRegion.ID,
		serviceDate:     serviceDate,
		queries:         queries,
	})
	if err != nil {
		t.Fatal(err)
	}

	var stSnapshots []*logisticssql.ShiftTeamSnapshot
	var stIDs []int64
	var stAttrRows []*logisticssql.GetAttributesForShiftTeamSnapshotsRow
	depotLocIDs := collections.NewLinkedInt64Set(4)
	allLocIDs := collections.NewLinkedInt64Set(8)

	stSnapshots, stIDs = createShiftTeamSnapshots(ctx, t, createShiftTeamSnapshotsParams{
		shiftTeamsCount: 4,
		stationMarketID: marketID,
		startTimestamp:  startTimestamp,
		endTimestamp:    endTimestamp,
		ldb:             ldb,
	})

	for _, sts := range stSnapshots {
		depotLocIDs.Add(sts.BaseLocationID)
		allLocIDs.Add(sts.BaseLocationID)
	}

	attrRows, err := queries.GetAttributesForShiftTeamSnapshots(ctx, stIDs)
	if err != nil {
		t.Fatal(err)
	}
	stAttrRows = append(stAttrRows, attrRows...)

	var visitSnapshots []*logisticssql.VisitSnapshot
	var visitAttrRows []*logisticssql.GetAttributesForVisitSnapshotsRow
	scheduledVisitSnapshots, scheduledVsIDs, _, err := createVisitSnapshots(ctx, t, createVisitSnapshotsParams{
		visitsCount:     2,
		idsStart:        0,
		queries:         queries,
		ldb:             ldb,
		marketID:        marketID,
		scheduleID:      schedule.ID,
		startTimestamp:  startTimestamp,
		endTimestamp:    endTimestamp,
		scheduledVisits: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	unassignedVisitSnapshots, unassignedVsIDs, unassignedVisits, err := createVisitSnapshots(ctx, t, createVisitSnapshotsParams{
		visitsCount:      2,
		idsStart:         2,
		queries:          queries,
		ldb:              ldb,
		marketID:         marketID,
		scheduleID:       schedule.ID,
		startTimestamp:   startTimestamp,
		endTimestamp:     endTimestamp,
		unassignedVisits: true,
	})
	if err != nil {
		t.Fatal(err)
	}
	allVisitSnapshots := scheduledVisitSnapshots
	allVisitSnapshots = append(allVisitSnapshots, unassignedVisitSnapshots...)
	allVsIDs := scheduledVsIDs
	allVsIDs = append(allVsIDs, unassignedVsIDs...)

	latestSnapshotTime := allVisitSnapshots[len(allVisitSnapshots)-1].CreatedAt
	for _, vs := range allVisitSnapshots {
		allLocIDs.Add(vs.LocationID)
	}
	locations, err := queries.GetLocationsByIDs(ctx, allLocIDs.Elems())
	if err != nil {
		t.Fatal(err)
	}

	allVisitAttrRows, err := queries.GetAttributesForVisitSnapshots(ctx, allVsIDs)
	if err != nil {
		t.Fatal(err)
	}
	visitAttrRows = append(visitAttrRows, allVisitAttrRows...)

	var restBreakReq *logisticssql.ShiftTeamRestBreakRequest
	if len(stSnapshots) > 0 {
		restBreakReq, err = queries.AddShiftTeamRestBreakRequest(
			ctx,
			logisticssql.AddShiftTeamRestBreakRequestParams{
				ShiftTeamID:          stSnapshots[0].ShiftTeamID,
				StartTimestampSec:    startTimestamp.Unix(),
				DurationSec:          30 * 60,
				LocationID:           stSnapshots[0].BaseLocationID,
				MaxRestBreakRequests: 1,
			},
		)
		if err != nil {
			t.Fatal(err)
		}
		latestSnapshotTime = restBreakReq.CreatedAt
	}

	var unassignedVisitsForSchedule []*logisticssql.GetUnassignedScheduleVisitsForScheduleIDRow
	var defaultClinicalUrgencyWindowDurationSec = sqltypes.ToValidNullInt64(7200)
	var defaultClinicalUrgencyLevelID = sqltypes.ToValidNullInt64(int64(commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_HIGH))
	for i, unassignedVisitSnapshot := range unassignedVisitSnapshots {
		unassignedVisitForSchedule := logisticssql.GetUnassignedScheduleVisitsForScheduleIDRow{
			ID:                               unassignedVisits[i].ID,
			ScheduleID:                       schedule.ID,
			VisitSnapshotID:                  sqltypes.ToValidNullInt64(unassignedVisitSnapshot.ID),
			CreatedAt:                        unassignedVisits[i].CreatedAt,
			CareRequestID:                    unassignedVisitSnapshot.CareRequestID,
			ArrivalStartTimestampSec:         unassignedVisitSnapshot.ArrivalStartTimestampSec,
			ArrivalEndTimestampSec:           unassignedVisitSnapshot.ArrivalEndTimestampSec,
			ClinicalUrgencyWindowDurationSec: defaultClinicalUrgencyWindowDurationSec,
			ClinicalUrgencyLevelID:           defaultClinicalUrgencyLevelID,
		}
		unassignedVisitsForSchedule = append(unassignedVisitsForSchedule, &unassignedVisitForSchedule)
	}

	var defaultServiceDurationSec int64 = 3600
	var locIDs []int64
	cfVisits := []*logisticspb.CheckFeasibilityVisit{{ServiceDurationSec: &defaultServiceDurationSec}}
	for _, loc := range serviceRegionData.canonicalLocations {
		locIDs = append(locIDs, loc.ID)
	}
	locations = append(serviceRegionData.canonicalLocations, locations...)
	expectedVRPData := &logisticsdb.ServiceRegionVRPData{
		DepotLocationIDs:         depotLocIDs,
		Locations:                locations,
		ShiftTeamAttrs:           stAttrRows,
		VisitAttrs:               visitAttrRows,
		ServiceDate:              serviceDate,
		ServiceRegionID:          serviceRegion.ID,
		Settings:                 settings,
		ShiftTeamSnapshots:       stSnapshots,
		ShiftTeamCapacities:      []*logisticsdb.ShiftTeamCapacity{},
		PreviousUnassignedVisits: unassignedVisitsForSchedule,
		OpenHoursTW: &logisticsdb.TimeWindow{
			Start: startTimestamp,
			End:   endTimestamp,
		},
		OpenHoursDay: serviceRegionData.openHoursScheduleDays[0],
		SnapshotTime: latestSnapshotTime,
		CheckFeasibilityData: &logisticsdb.CheckFeasibilityVRPDataResult{
			Visits: cfVisits,
			Diagnostics: &logisticspb.CheckFeasibilityDiagnostics{
				OptimizerRunId:   schedule.OptimizerRunID,
				ScheduleId:       schedule.ID,
				LogisticsVersion: buildinfo.Version,
			},
			LocIDs: locIDs,
		},
	}
	if restBreakReq != nil {
		expectedVRPData.RestBreakRequests = []*logisticssql.ShiftTeamRestBreakRequest{restBreakReq}
	}

	params := &logisticsdb.ServiceRegionVRPDataParams{
		ServiceRegionID:       serviceRegion.ID,
		ServiceDate:           serviceDate,
		SnapshotTime:          latestSnapshotTime,
		CheckFeasibilityVisit: cfVisits[0],
	}
	serviceRegionVRPData, err := ldb.GetServiceRegionVRPData(ctx, params)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatchFn(".VisitSnapshots",
		".CheckFeasibilityData")(t, expectedVRPData, serviceRegionVRPData)
	testutils.MustMatch(t, len(allVisitSnapshots), len(serviceRegionVRPData.VisitSnapshots))
	for i, visit := range visitSnapshots {
		testutils.MustMatch(t, visit.ID, serviceRegionVRPData.VisitSnapshots[i].ID)
	}

	newLocIDs := collections.NewLinkedInt64Set(1)
	newVisitSnapshots, newVisitIDs, _, err := createVisitSnapshots(ctx, t, createVisitSnapshotsParams{
		visitsCount:    1,
		idsStart:       4,
		queries:        queries,
		ldb:            ldb,
		marketID:       marketID,
		startTimestamp: startTimestamp,
		endTimestamp:   endTimestamp,
	})
	if err != nil {
		t.Fatal(err)
	}
	_, _, _, err = createVisitSnapshots(ctx, t, createVisitSnapshotsParams{
		visitsCount:    1,
		idsStart:       0,
		queries:        queries,
		ldb:            ldb,
		marketID:       marketID,
		startTimestamp: startTimestamp,
		endTimestamp:   endTimestamp,
	})
	if err != nil {
		t.Fatal(err)
	}
	for _, vs := range newVisitSnapshots {
		newLocIDs.Add(vs.LocationID)
	}

	params = &logisticsdb.ServiceRegionVRPDataParams{
		ServiceRegionID:       serviceRegion.ID,
		ServiceDate:           serviceDate,
		SnapshotTime:          latestSnapshotTime,
		CheckFeasibilityVisit: cfVisits[0],
	}

	serviceRegionVRPData, err = ldb.GetServiceRegionVRPData(ctx, params)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatchFn(".VisitSnapshots",
		".CheckFeasibilityData")(t, expectedVRPData, serviceRegionVRPData)
	sort.Slice(serviceRegionVRPData.VisitSnapshots, func(i, j int) bool {
		return serviceRegionVRPData.VisitSnapshots[i].ID < serviceRegionVRPData.VisitSnapshots[j].ID
	})
	testutils.MustMatch(t, len(allVisitSnapshots), len(serviceRegionVRPData.VisitSnapshots))
	for i, visit := range allVisitSnapshots {
		testutils.MustMatch(t, visit.ID, serviceRegionVRPData.VisitSnapshots[i].ID)
	}

	for i, visit := range cfVisits {
		expectedVisit := expectedVRPData.CheckFeasibilityData.Visits[i]
		testutils.MustMatchProto(t, visit, expectedVisit, "check feasibility visits doesn't match")
	}

	settings = &optimizersettings.Settings{
		FeasibilityGetUnscheduledVisits: true,
	}
	mockSettingsService = &optimizersettings.MockSettingsService{RegionSettings: settings}
	ldb = logisticsdb.NewLogisticsDB(db, nil, mockSettingsService, monitoring.NewMockScope())
	serviceRegionVRPData, err = ldb.GetServiceRegionVRPData(ctx, params)
	if err != nil {
		t.Fatal(err)
	}

	newVisitAttrRows, err := queries.GetAttributesForVisitSnapshots(ctx, newVisitIDs)
	if err != nil {
		t.Fatal(err)
	}
	locations, err = queries.GetLocationsByIDs(ctx, newLocIDs.Elems())
	if err != nil {
		t.Fatal(err)
	}
	expectedVRPData.VisitAttrs = append(expectedVRPData.VisitAttrs, newVisitAttrRows...)
	expectedVRPData.Locations = append(expectedVRPData.Locations, locations...)
	expectedVRPData.Settings.FeasibilityGetUnscheduledVisits = true
	allVisitSnapshots = append(allVisitSnapshots, newVisitSnapshots...)

	testutils.MustMatchFn(".VisitSnapshots",
		".CheckFeasibilityData")(t, expectedVRPData, serviceRegionVRPData)
	testutils.MustMatch(t, len(allVisitSnapshots), len(serviceRegionVRPData.VisitSnapshots))
	sort.Slice(serviceRegionVRPData.VisitSnapshots, func(i, j int) bool {
		return serviceRegionVRPData.VisitSnapshots[i].ID < serviceRegionVRPData.VisitSnapshots[j].ID
	})
	for i, visit := range allVisitSnapshots {
		testutils.MustMatch(t, visit.ID, serviceRegionVRPData.VisitSnapshots[i].ID)
	}

	for i, visit := range cfVisits {
		expectedVisit := expectedVRPData.CheckFeasibilityData.Visits[i]
		testutils.MustMatchProto(t, visit, expectedVisit, "check feasibility visits doesn't match")
	}
}

func TestGetServiceRegionVRPData(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	startDayTime, _ := time.Parse(time.Kitchen, "8:00AM")
	endDayTime, _ := time.Parse(time.Kitchen, "10:00PM")
	latestSnapshotTime := time.Now()

	serviceDate := time.Date(2022, time.January, 1, 0, 0, 0, 0, time.UTC)

	startTimestamp := logisticsdb.TimestampFromDateTimeLoc(serviceDate, startDayTime, time.UTC)
	endTimestamp := logisticsdb.TimestampFromDateTimeLoc(serviceDate, endDayTime, time.UTC)

	tcs := []struct {
		Desc                 string
		ServiceDate          time.Time
		ShiftTeamsCount      int
		VisitsCount          int
		SkipPreviousRun      bool
		IsCheckFeasibility   bool
		GetUnscheduledVisits bool
	}{
		{
			Desc:            "base case",
			ServiceDate:     serviceDate,
			ShiftTeamsCount: 4,
			VisitsCount:     4,
		},
		{
			Desc:            "base case, no visits",
			ServiceDate:     serviceDate,
			ShiftTeamsCount: 4,
			VisitsCount:     0,
		},
		{
			Desc:            "base case, no shift teams",
			ServiceDate:     serviceDate,
			ShiftTeamsCount: 0,
			VisitsCount:     3,
		},
		{
			Desc:            "base case, no shift teams, no visits",
			ServiceDate:     serviceDate,
			ShiftTeamsCount: 0,
			VisitsCount:     0,
		},
		{
			Desc:            "no previous run",
			ServiceDate:     serviceDate,
			ShiftTeamsCount: 4,
			VisitsCount:     4,
			SkipPreviousRun: true,
		},
		{
			Desc:                 "check feasibility uses previous schedule",
			ServiceDate:          serviceDate,
			ShiftTeamsCount:      4,
			VisitsCount:          4,
			IsCheckFeasibility:   true,
			GetUnscheduledVisits: false,
		},
		{
			Desc:                 "check feasibility uses previous schedule appends new visit",
			ServiceDate:          serviceDate,
			ShiftTeamsCount:      4,
			VisitsCount:          4,
			IsCheckFeasibility:   true,
			GetUnscheduledVisits: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			marketID := time.Now().UnixNano()

			settings := &optimizersettings.Settings{
				FeasibilityCheckUseLastScheduleRun:            true,
				MarketAvailabilityUseCanonicalLocationsVisits: true,
				FeasibilityGetUnscheduledVisits:               tc.GetUnscheduledVisits,
			}
			mockSettingsService = &optimizersettings.MockSettingsService{RegionSettings: settings}
			ldb := logisticsdb.NewLogisticsDB(db, nil, mockSettingsService, monitoring.NewMockScope())

			serviceRegionData, err := setupForGetServiceRegionVRPData(
				ctx,
				queries,
				marketID,
				startTimestamp,
				endTimestamp,
			)
			if err != nil {
				t.Fatal(err)
			}

			serviceRegion := serviceRegionData.serviceRegion
			if !tc.SkipPreviousRun {
				schedule, err := createNewSchedule(ctx, &newScheduleParams{
					serviceRegionID: serviceRegion.ID,
					serviceDate:     serviceDate,
					queries:         queries,
				})
				if err != nil {
					t.Fatal(err)
				}

				latestSnapshotTime = schedule.CreatedAt
			}

			var stSnapshots []*logisticssql.ShiftTeamSnapshot
			var stIDs []int64
			var stAttrRows []*logisticssql.GetAttributesForShiftTeamSnapshotsRow
			depotLocIDs := collections.NewLinkedInt64Set(tc.ShiftTeamsCount)
			allLocIDs := collections.NewLinkedInt64Set(tc.ShiftTeamsCount + tc.VisitsCount)
			if tc.ShiftTeamsCount > 0 {
				stSnapshots, stIDs = createShiftTeamSnapshots(ctx, t, createShiftTeamSnapshotsParams{
					shiftTeamsCount: tc.ShiftTeamsCount,
					stationMarketID: marketID,
					startTimestamp:  startTimestamp,
					endTimestamp:    endTimestamp,
					ldb:             ldb,
				})
				latestSnapshotTime = stSnapshots[len(stSnapshots)-1].CreatedAt

				for _, sts := range stSnapshots {
					depotLocIDs.Add(sts.BaseLocationID)
					allLocIDs.Add(sts.BaseLocationID)
				}

				attrRows, err := queries.GetAttributesForShiftTeamSnapshots(ctx, stIDs)
				if err != nil {
					t.Fatal(err)
				}
				stAttrRows = append(stAttrRows, attrRows...)
			}

			var visitSnapshots []*logisticssql.VisitSnapshot
			var visitAttrRows []*logisticssql.GetAttributesForVisitSnapshotsRow
			var vsIDs []int64
			if tc.VisitsCount > 0 {
				visitSnapshots, vsIDs, _, err = createVisitSnapshots(ctx, t, createVisitSnapshotsParams{
					visitsCount:    tc.VisitsCount,
					idsStart:       0,
					queries:        queries,
					ldb:            ldb,
					marketID:       marketID,
					startTimestamp: startTimestamp,
					endTimestamp:   endTimestamp,
				})
				if err != nil {
					t.Fatal(err)
				}

				latestSnapshotTime = visitSnapshots[len(visitSnapshots)-1].CreatedAt

				for _, vs := range visitSnapshots {
					allLocIDs.Add(vs.LocationID)
				}

				attrRows, err := queries.GetAttributesForVisitSnapshots(ctx, vsIDs)
				if err != nil {
					t.Fatal(err)
				}
				visitAttrRows = append(visitAttrRows, attrRows...)
			}
			var restBreakReq *logisticssql.ShiftTeamRestBreakRequest
			if len(stSnapshots) > 0 {
				restBreakReq, err = queries.AddShiftTeamRestBreakRequest(
					ctx,
					logisticssql.AddShiftTeamRestBreakRequestParams{
						ShiftTeamID:          stSnapshots[0].ShiftTeamID,
						StartTimestampSec:    startTimestamp.Unix(),
						DurationSec:          30 * 60,
						LocationID:           stSnapshots[0].BaseLocationID,
						MaxRestBreakRequests: 1,
					},
				)
				if err != nil {
					t.Fatal(err)
				}
				latestSnapshotTime = restBreakReq.CreatedAt
			}

			locations, err := queries.GetLocationsByIDs(ctx, allLocIDs.Elems())
			if err != nil {
				t.Fatal(err)
			}

			expectedVRPData := &logisticsdb.ServiceRegionVRPData{
				DepotLocationIDs:   depotLocIDs,
				Locations:          locations,
				ShiftTeamAttrs:     stAttrRows,
				VisitAttrs:         visitAttrRows,
				ServiceDate:        serviceDate,
				ServiceRegionID:    serviceRegion.ID,
				Settings:           settings,
				ShiftTeamSnapshots: stSnapshots,
				OpenHoursTW: &logisticsdb.TimeWindow{
					Start: startTimestamp,
					End:   endTimestamp,
				},
				OpenHoursDay:        serviceRegionData.openHoursScheduleDays[0],
				SnapshotTime:        latestSnapshotTime,
				ShiftTeamCapacities: []*logisticsdb.ShiftTeamCapacity{},
			}
			if restBreakReq != nil {
				expectedVRPData.RestBreakRequests = []*logisticssql.ShiftTeamRestBreakRequest{restBreakReq}
			}

			params := &logisticsdb.ServiceRegionVRPDataParams{
				ServiceRegionID: serviceRegion.ID,
				ServiceDate:     serviceDate,
				SnapshotTime:    latestSnapshotTime,
			}

			serviceRegionVRPData, err := ldb.GetServiceRegionVRPData(ctx, params)
			if err != nil {
				t.Fatal(err)
			}

			testutils.MustMatchFn(".VisitSnapshots")(t, expectedVRPData, serviceRegionVRPData)
			testutils.MustMatch(t, len(visitSnapshots), len(serviceRegionVRPData.VisitSnapshots))
			for i, visit := range visitSnapshots {
				testutils.MustMatch(t, visit.ID, serviceRegionVRPData.VisitSnapshots[i].ID)
			}

			if tc.IsCheckFeasibility { //nolint: nestif
				wantedDurations, err := queries.AddServiceRegionCanonicalVisitDurations(ctx,
					logisticssql.AddServiceRegionCanonicalVisitDurationsParams{
						ServiceRegionID:       serviceRegion.ID,
						ServiceDurationMinSec: 1,
						ServiceDurationMaxSec: 2,
					})
				if err != nil {
					t.Fatal(err)
				}

				schedule, err := createNewSchedule(ctx, &newScheduleParams{
					serviceRegionID: serviceRegion.ID,
					serviceDate:     serviceDate,
					queries:         queries,
				})
				if err != nil {
					t.Fatal(err)
				}

				latestSnapshotTime = schedule.CreatedAt
				newVisitSnapshots, newIDs, _, err := createVisitSnapshots(ctx, t, createVisitSnapshotsParams{
					visitsCount:    1,
					idsStart:       tc.VisitsCount,
					queries:        queries,
					ldb:            ldb,
					marketID:       marketID,
					startTimestamp: startTimestamp,
					endTimestamp:   endTimestamp,
				})
				if err != nil {
					t.Fatal(err)
				}
				if tc.GetUnscheduledVisits {
					attrRows, err := queries.GetAttributesForVisitSnapshots(ctx, newIDs)
					if err != nil {
						t.Fatal(err)
					}
					locations, err := queries.GetLocationsByIDs(ctx, []int64{newVisitSnapshots[0].LocationID})
					if err != nil {
						t.Fatal(err)
					}
					expectedVRPData.VisitAttrs = append(expectedVRPData.VisitAttrs, attrRows...)
					expectedVRPData.Locations = append(expectedVRPData.Locations, locations...)
				}
				var locIDs []int64
				for _, loc := range serviceRegionData.canonicalLocations {
					locIDs = append(locIDs, loc.ID)
				}

				cfVisits := []*logisticspb.CheckFeasibilityVisit{{}}
				params := &logisticsdb.ServiceRegionVRPDataParams{
					ServiceRegionID:       serviceRegion.ID,
					ServiceDate:           serviceDate,
					SnapshotTime:          latestSnapshotTime,
					CheckFeasibilityVisit: cfVisits[0],
				}

				serviceRegionVRPData, err := ldb.GetServiceRegionVRPData(ctx, params)
				if err != nil {
					t.Fatal(err)
				}

				expectedVRPData.CheckFeasibilityData = &logisticsdb.CheckFeasibilityVRPDataResult{
					Visits: cfVisits,
					Diagnostics: &logisticspb.CheckFeasibilityDiagnostics{
						OptimizerRunId:   schedule.OptimizerRunID,
						ScheduleId:       schedule.ID,
						LogisticsVersion: buildinfo.Version,
					},
					LocIDs: locIDs,
				}

				expectedVRPData.Locations = append(serviceRegionData.canonicalLocations, expectedVRPData.Locations...)
				expectedVRPData.SnapshotTime = schedule.CreatedAt

				testutils.MustMatchFn(".VisitSnapshots",
					".CheckFeasibilityData")(t, expectedVRPData, serviceRegionVRPData)
				var addVisits = 0
				if tc.GetUnscheduledVisits {
					addVisits = 1
				}
				testutils.MustMatch(t, len(visitSnapshots)+addVisits, len(serviceRegionVRPData.VisitSnapshots))
				for i, visit := range visitSnapshots {
					testutils.MustMatch(t, visit.ID, serviceRegionVRPData.VisitSnapshots[i].ID)
				}

				testutils.MustMatchProto(t, expectedVRPData.CheckFeasibilityData.Diagnostics,
					serviceRegionVRPData.CheckFeasibilityData.Diagnostics,
					"diagnostic doesn't match")

				for i, visit := range cfVisits {
					expectedVisit := expectedVRPData.CheckFeasibilityData.Visits[i]
					testutils.MustMatchProto(t, visit, expectedVisit, "check feasibility visits doesn't match")
					testutils.MustMatch(t, wantedDurations.ServiceDurationMinSec,
						*expectedVisit.ServiceDurationSec, "duration sec doesn't match")
				}
			}
		})
	}
}

type newScheduleParams struct {
	serviceRegionID int64
	serviceDate     time.Time
	queries         *logisticssql.Queries
}

func createNewSchedule(ctx context.Context, params *newScheduleParams) (*logisticssql.Schedule, error) {
	queries := params.queries
	serviceRegionID := params.serviceRegionID
	serviceDate := params.serviceDate
	previousOptimizerRun, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:  serviceRegionID,
		ServiceDate:      serviceDate,
		OptimizerRunType: string(logisticsdb.ServiceRegionScheduleRunType),
	})
	if err != nil {
		return nil, err
	}
	previousRunID := previousOptimizerRun.ID

	schedule, err := queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
		ServiceRegionID: serviceRegionID,
		OptimizerRunID:  previousRunID,
		HardScore:       0,
	})
	if err != nil {
		return nil, err
	}
	return schedule, nil
}

type createShiftTeamSnapshotsParams struct {
	stationMarketID int64
	shiftTeamsCount int

	startTimestamp time.Time
	endTimestamp   time.Time

	ldb *logisticsdb.LogisticsDB
}

func createShiftTeamSnapshots(ctx context.Context, t *testing.T, params createShiftTeamSnapshotsParams) ([]*logisticssql.ShiftTeamSnapshot, []int64) {
	stSnapshots := make([]*logisticssql.ShiftTeamSnapshot, params.shiftTeamsCount)
	stIDs := make([]int64, params.shiftTeamsCount)
	baseID := time.Now().UnixNano()
	for i := 0; i < params.shiftTeamsCount; i++ {
		stSnapshots[i] = writeTeamShiftSnapshot(ctx, t, &writeTeamShiftTeamSnapshotParams{
			shiftTeamID:     baseID + int64(i),
			stationMarketID: params.stationMarketID,

			startTimestamp: &params.startTimestamp,
			endTimestamp:   &params.endTimestamp,

			ldb: params.ldb,
		})
		stIDs[i] = stSnapshots[i].ID
	}

	return stSnapshots, stIDs
}

type createVisitSnapshotsParams struct {
	visitsCount      int
	idsStart         int
	queries          *logisticssql.Queries
	ldb              *logisticsdb.LogisticsDB
	marketID         int64
	scheduleID       int64
	scheduledVisits  bool
	unassignedVisits bool
	startTimestamp   time.Time
	endTimestamp     time.Time
}

func createVisitSnapshots(
	ctx context.Context,
	t *testing.T,
	params createVisitSnapshotsParams,
) ([]*logisticssql.VisitSnapshot, []int64, []*logisticssql.UnassignedScheduleVisit, error) {
	urgencyLevelID := int64(commonpb.ClinicalUrgencyLevel_CLINICAL_URGENCY_LEVEL_HIGH)
	visitSnapshots := make([]*logisticssql.VisitSnapshot, params.visitsCount)
	visitSnapshotIDs := make([]int64, params.visitsCount)
	unassignedVisitSnapshots := make([]*logisticssql.UnassignedScheduleVisit, params.visitsCount)
	for i := 0; i < params.visitsCount; i++ {
		writeVisitSnapshotParams := &writeVisitSnapshotParams{
			stationMarketID: params.marketID,
			careReqID:       int64(params.idsStart + i + 1),
			visitPhase:      logisticsdb.VisitPhaseTypeShortNameUncommitted,
			start:           params.startTimestamp,
			end:             params.endTimestamp,
			ldb:             params.ldb,
		}
		visitSnapshots[i] = writeVisitSnapshotWithStartEnd(ctx, t, writeVisitSnapshotParams)
		_, err := params.queries.AddVisitAcuitySnapshot(
			ctx,
			logisticssql.AddVisitAcuitySnapshotParams{
				VisitSnapshotID:        visitSnapshots[i].ID,
				ClinicalUrgencyLevelID: sqltypes.ToValidNullInt64(urgencyLevelID),
			},
		)
		if err != nil {
			return nil, nil, nil, err
		}
		if params.scheduledVisits {
			_, err := params.queries.AddScheduleVisit(
				ctx,
				logisticssql.AddScheduleVisitParams{
					ScheduleID:      params.scheduleID,
					VisitSnapshotID: sqltypes.ToValidNullInt64(visitSnapshots[i].ID),
				})
			if err != nil {
				return nil, nil, nil, err
			}
		}
		if params.unassignedVisits {
			unassignedVisitSnapshotsForSchedule, err := params.queries.AddUnassignedScheduleVisitsToSchedule(
				ctx,
				logisticssql.AddUnassignedScheduleVisitsToScheduleParams{
					ScheduleID:       params.scheduleID,
					VisitSnapshotIds: []int64{visitSnapshots[i].ID},
				})
			if err != nil {
				return nil, nil, nil, err
			}
			unassignedVisitSnapshots[i] = unassignedVisitSnapshotsForSchedule[0]
		}

		visitSnapshotIDs[i] = visitSnapshots[i].ID
	}
	return visitSnapshots, visitSnapshotIDs, unassignedVisitSnapshots, nil
}

type serviceRegionData struct {
	serviceRegion         *logisticssql.ServiceRegion
	openHoursScheduleDays []*logisticssql.ServiceRegionOpenHoursScheduleDay
	canonicalLocations    []*logisticssql.Location
}

func setupForGetServiceRegionVRPData(
	ctx context.Context,
	queries *logisticssql.Queries,
	marketID int64,
	startDayTime time.Time,
	endDayTime time.Time,
) (*serviceRegionData, error) {
	serviceRegion, err := queries.AddServiceRegion(ctx, logisticssql.AddServiceRegionParams{
		Description:      "open hours region",
		IanaTimeZoneName: time.UTC.String(),
	})
	if err != nil {
		return nil, err
	}

	_, err = queries.AddMarket(ctx, logisticssql.AddMarketParams{
		ServiceRegionID: serviceRegion.ID,
		StationMarketID: marketID,
		ShortName:       strconv.Itoa(int(marketID)),
	})
	if err != nil {
		return nil, err
	}

	schedule, err := queries.AddServiceRegionOpenHoursSchedule(ctx, serviceRegion.ID)
	if err != nil {
		return nil, err
	}

	_, err = queries.AddServiceRegionCanonicalVisitDurations(ctx,
		logisticssql.AddServiceRegionCanonicalVisitDurationsParams{
			ServiceRegionID:       serviceRegion.ID,
			ServiceDurationMinSec: int64(0),
			ServiceDurationMaxSec: int64(3600),
		})
	if err != nil {
		return nil, err
	}

	days, err := queries.AddServiceRegionOpenHoursScheduleDays(
		ctx,
		logisticssql.AddServiceRegionOpenHoursScheduleDaysParams{
			ServiceRegionOpenHoursScheduleIds: []int64{schedule.ID},
			DaysOfWeek:                        []int32{int32(startDayTime.Weekday())},
			StartTimes:                        []time.Time{startDayTime},
			EndTimes:                          []time.Time{endDayTime},
		})
	if err != nil {
		return nil, err
	}

	now := time.Now()
	loc, err := queries.AddLocation(ctx, logisticssql.AddLocationParams{
		LatitudeE6:  int32(now.UnixNano()),
		LongitudeE6: int32(now.UnixNano()),
	})
	if err != nil {
		return nil, err
	}

	set, err := queries.AddServiceRegionCanonicalLocationSet(ctx, serviceRegion.ID)
	if err != nil {
		return nil, err
	}

	_, err = queries.AddServiceRegionCanonicalLocations(ctx, logisticssql.AddServiceRegionCanonicalLocationsParams{
		LocationsIds:                        []int64{loc.ID},
		ServiceRegionCanonicalLocationSetID: set.ID,
	})
	if err != nil {
		return nil, err
	}

	return &serviceRegionData{
		serviceRegion:         serviceRegion,
		openHoursScheduleDays: days,
		canonicalLocations:    []*logisticssql.Location{loc},
	}, nil
}

func TestLogisticsDB_VRPAvailabilityVisitsForScheduleID(t *testing.T) {
	ctx, db, queries, done := setupDBTest(t)
	defer done()

	baseDate := time.Date(2023, 10, 31, 0, 0, 0, 0, time.UTC)
	baseID := time.Now().UnixNano()
	optimizerRun, err := queries.AddOptimizerRun(ctx, logisticssql.AddOptimizerRunParams{
		ServiceRegionID:  baseID,
		ServiceDate:      baseDate,
		OptimizerRunType: string(logisticsdb.ServiceRegionAvailabilityRunType),
	})
	if err != nil {
		t.Fatal(err)
	}

	schedule, err := queries.AddSchedule(ctx, logisticssql.AddScheduleParams{
		ServiceRegionID: baseID,
		OptimizerRunID:  optimizerRun.ID,
	})
	if err != nil {
		t.Fatal(err)
	}

	availabilityVisitSet, err := queries.AddServiceRegionAvailabilityVisitSet(ctx, baseID)
	if err != nil {
		t.Fatal(err)
	}

	arrivalTime := baseDate.Add(time.Duration(12) * time.Hour)
	endTime := arrivalTime.Add(time.Duration(2) * time.Hour)
	serviceDuration := int64(2400)
	availabilityVisits, err := queries.AddServiceRegionAvailabilityVisits(ctx, logisticssql.AddServiceRegionAvailabilityVisitsParams{
		ServiceRegionAvailabilityVisitSetIds: []int64{availabilityVisitSet.ID, availabilityVisitSet.ID},
		ArrivalStartTimes:                    []time.Time{arrivalTime, arrivalTime},
		ArrivalEndTimes:                      []time.Time{endTime, endTime},
		ServiceDurationsSec:                  []int64{serviceDuration, serviceDuration},
		LocationIds:                          []int64{10, 2},
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.AddScheduleVisit(ctx, logisticssql.AddScheduleVisitParams{
		ScheduleID:                       schedule.ID,
		ScheduleRouteID:                  0,
		ServiceRegionAvailabilityVisitID: sqltypes.ToValidNullInt64(availabilityVisits[0].ID),
	})
	if err != nil {
		t.Fatal(err)
	}

	_, err = queries.AddUnassignedScheduleVisitsToSchedule(ctx, logisticssql.AddUnassignedScheduleVisitsToScheduleParams{
		ScheduleID:                        schedule.ID,
		ServiceRegionAvailabilityVisitIds: []int64{availabilityVisits[1].ID},
	})
	if err != nil {
		t.Fatal(err)
	}

	attributeName := logisticsdb.I64ToA(baseID)
	attributes, err := queries.UpsertAttributes(ctx, []string{attributeName})
	if err != nil {
		t.Fatal(err)
	}

	availabilityVisitIDs := make([]int64, len(availabilityVisits))
	attributesIDs := make([]int64, len(availabilityVisits))
	isRequireds := make([]bool, len(availabilityVisits))
	isOthers := make([]bool, len(availabilityVisits))
	for i, aVisit := range availabilityVisits {
		availabilityVisitIDs[i] = aVisit.ID
		attributesIDs[i] = attributes[0].ID
		isRequireds[i] = true
		isOthers[i] = false
	}

	_, err = queries.AddServiceRegionAvailabilityVisitAttributes(ctx, logisticssql.AddServiceRegionAvailabilityVisitAttributesParams{
		ServiceRegionAvailabilityVisitIds: availabilityVisitIDs,
		AttributeIds:                      attributesIDs,
		IsRequireds:                       isRequireds,
		IsForbiddens:                      isOthers,
		IsPreferreds:                      isOthers,
		IsUnwanteds:                       isOthers,
	})
	if err != nil {
		t.Fatal(err)
	}

	extraSetupDuration := int64(1200)
	expectedVRPVisits := make([]*optimizerpb.VRPVisit, len(availabilityVisits))
	for i, visit := range availabilityVisits {
		expectedVRPVisits[i] = &optimizerpb.VRPVisit{
			Id:                    proto.Int64(-visit.ID),
			Acuity:                &optimizerpb.VRPVisitAcuity{Level: proto.Int64(logisticsdb.DefaultOptimizerAcuityLevel)},
			ServiceDurationSec:    proto.Int64(visit.ServiceDurationSec),
			ExtraSetupDurationSec: proto.Int64(extraSetupDuration),
			OverlapSetKey:         proto.String(logisticsdb.I64ToA(availabilityVisitSet.ID)),
			IsExpendable:          proto.Bool(true),
			LocationId:            proto.Int64(visit.LocationID),
			RequiredAttributes: []*optimizerpb.VRPAttribute{
				{
					Id: attributeName,
				},
			},
			ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{
				StartTimestampSec: proto.Int64(arrivalTime.Unix()),
				EndTimestampSec:   proto.Int64(endTime.Unix()),
			},
		}
	}

	mapService := &mockDistanceMatrix{distanceSourceID: 5}
	mockSettingsService := &optimizersettings.MockSettingsService{}

	ldb := logisticsdb.NewLogisticsDB(
		db,
		logistics.NewMapServicePicker(
			mapService,
			mapService,
			mockSettingsService,
		),
		mockSettingsService,
		monitoring.NewMockScope())

	vrpVisits, err := ldb.VRPAvailabilityVisitsForScheduleID(ctx, schedule.ID, extraSetupDuration, &logisticsdb.TimeWindow{
		Start: arrivalTime,
		End:   endTime,
	})
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, expectedVRPVisits, vrpVisits, "not matching vrp visits")
}

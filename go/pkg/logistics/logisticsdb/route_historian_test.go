package logisticsdb

import (
	"testing"
	"time"

	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"google.golang.org/protobuf/proto"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

type testQueue struct {
	data []time.Time
	done chan int
}

func newTestQueue() *testQueue {
	return &testQueue{done: make(chan int, 1)}
}

func (q *testQueue) Add(t time.Time) {
	q.data = append(q.data, t)
}

func (q *testQueue) Close() {
	q.done <- 1
	close(q.done)
}

func (q *testQueue) Wait(t *testing.T) {
	t.Helper()
	select {
	case <-q.done:
		return
	case <-time.After(time.Second):
		t.Fatal("waited too long for queue")
	}
}

func TestShiftTeamActuals_AddRaces(t *testing.T) {
	now := time.Now()
	arrivalQueue := newTestQueue()
	completedQueue := newTestQueue()
	committedQueue := newTestQueue()
	enRouteQueue := newTestQueue()
	for i := 0; i < 100; i++ {
		arrivalQueue.Add(now.Add(time.Duration(i) * time.Second))
		completedQueue.Add(now.Add(time.Duration(i+100) * time.Second))
		committedQueue.Add(now.Add(time.Duration(i+200) * time.Second))
		enRouteQueue.Add(now.Add(time.Duration(i+300) * time.Second))
	}

	shiftTeamActuals := NewShiftTeamActuals()
	shiftTeamID := ShiftTeamID(time.Now().UnixNano())
	careRequestID := CareRequestID(time.Now().UnixNano())
	pair := EntityIDPair{
		ShiftTeamID:   shiftTeamID,
		CareRequestID: careRequestID,
	}
	go func() {
		for _, t := range arrivalQueue.data {
			shiftTeamActuals.AddArrival(pair, t)
		}
		arrivalQueue.Close()
	}()
	go func() {
		for _, t := range completedQueue.data {
			shiftTeamActuals.AddCompletion(pair, t)
		}
		completedQueue.Close()
	}()
	go func() {
		for _, t := range committedQueue.data {
			shiftTeamActuals.AddCommitted(pair, t)
		}
		committedQueue.Close()
	}()
	go func() {
		for _, t := range enRouteQueue.data {
			shiftTeamActuals.AddCurrentlyEnRoute(pair, t)
		}
		enRouteQueue.Close()
	}()

	arrivalQueue.Wait(t)
	completedQueue.Wait(t)
	committedQueue.Wait(t)
	enRouteQueue.Wait(t)

	_, ok := shiftTeamActuals.Get(ShiftTeamID(time.Now().UnixNano()))
	testutils.MustMatch(t, false, ok)
	actuals, ok := shiftTeamActuals.Get(shiftTeamID)
	testutils.MustMatch(t, true, ok)
	testutils.MustMatch(t, map[CareRequestID]*Actuals{
		careRequestID: {
			Arrival:          now.Add(99 * time.Second),
			Completion:       now.Add(199 * time.Second),
			Committed:        now.Add(299 * time.Second),
			CurrentlyEnRoute: now.Add(399 * time.Second),
		},
	}, actuals.careRequestData)
}

func TestShiftTeamActuals_AddRestBreak(t *testing.T) {
	rbID0 := time.Now().UnixNano()
	rbID1 := time.Now().Add(time.Millisecond).UnixNano()
	shiftTeamID := ShiftTeamID(time.Now().UnixNano())

	a0 := &Actuals{Arrival: time.Now()}
	a1 := &Actuals{Arrival: time.Now().Add(time.Second)}
	shiftTeamActuals := NewShiftTeamActuals()

	_, ok := shiftTeamActuals.Get(shiftTeamID)
	testutils.MustMatch(t, false, ok, "data doesn't exist yet")

	shiftTeamActuals.AddRestBreak(shiftTeamID, rbID0, a0)
	r0, ok := shiftTeamActuals.Get(shiftTeamID)
	testutils.MustMatch(t, true, ok, "data exists")
	testutils.MustMatch(t, a0, r0.restBreakData[rbID0], "and is found for the rest break in question")

	shiftTeamActuals.AddRestBreak(shiftTeamID, rbID1, a1)
	r1, ok := shiftTeamActuals.Get(shiftTeamID)
	testutils.MustMatch(t, true, ok, "data still exists")
	testutils.MustMatch(t, a0, r1.restBreakData[rbID0], "other rest break data is still there")
	testutils.MustMatch(t, a1, r1.restBreakData[rbID1], "and new data is also here")
}

func TestStopFromCareRequestActual(t *testing.T) {
	crID := CareRequestID(time.Now().UnixNano())
	visitID := VisitSnapshotID(time.Now().Add(time.Second).UnixNano())
	arrival := time.Now()
	completion := time.Now().Add(time.Minute)

	h := &routeHistorian{snapshotIDReconciler: &snapshotIDReconciler{
		canonicalCareReqIDToCurrentVisit: map[CareRequestID]*optimizerpb.VRPVisit{
			crID: {Id: proto.Int64(int64(visitID))},
		},
	}}

	stop := h.routeHistoryStopFromCareRequestActual(crID, &Actuals{Arrival: arrival, Completion: completion})
	testutils.MustMatch(t, &optimizerpb.VRPShiftTeamRouteStop{
		Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{
			Visit: &optimizerpb.VRPShiftTeamVisit{
				VisitId:             proto.Int64(int64(visitID)),
				ArrivalTimestampSec: nullableProtoTimeSec(arrival),
			},
		},
		Pinned:                       proto.Bool(true),
		ActualStartTimestampSec:      nullableProtoTimeSec(arrival),
		ActualCompletionTimestampSec: nullableProtoTimeSec(completion),
	}, stop)
}

func TestStopsFromShiftTeamActuals_Ordering(t *testing.T) {
	crID := CareRequestID(1)
	visitID := VisitSnapshotID(2)
	crID2 := CareRequestID(3)
	visitID2 := VisitSnapshotID(4)
	crID3WithoutStartTime := CareRequestID(5)
	visitID3WithoutStartTime := VisitSnapshotID(6)
	committedCrID4 := CareRequestID(7)
	committedVisitID4 := VisitSnapshotID(8)

	arrival := time.Now()
	completion := arrival.Add(time.Minute)
	laterArrival := completion.Add(time.Second)
	laterCompletion := laterArrival.Add(time.Minute)

	h := &routeHistorian{snapshotIDReconciler: &snapshotIDReconciler{
		canonicalCareReqIDToCurrentVisit: map[CareRequestID]*optimizerpb.VRPVisit{
			crID:                  {Id: proto.Int64(int64(visitID))},
			crID2:                 {Id: proto.Int64(int64(visitID2))},
			crID3WithoutStartTime: {Id: proto.Int64(int64(visitID3WithoutStartTime))},
			committedCrID4:        {Id: proto.Int64(int64(committedVisitID4))},
		},
	}}

	stops := h.routeHistoryStopsFromShiftTeamActuals(&StopTypeActuals{careRequestData: map[CareRequestID]*Actuals{
		crID:                  {Arrival: arrival, Completion: completion},
		crID2:                 {Arrival: laterArrival, Completion: laterCompletion},
		crID3WithoutStartTime: {CurrentlyEnRoute: time.Now().Add(time.Hour)},
		committedCrID4:        {Committed: time.Now().Add(time.Hour)},
	}})
	testutils.MustMatch(t, []*optimizerpb.VRPShiftTeamRouteStop{
		{
			Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{
				Visit: &optimizerpb.VRPShiftTeamVisit{
					VisitId:             proto.Int64(int64(visitID)),
					ArrivalTimestampSec: nullableProtoTimeSec(arrival),
				},
			},
			Pinned:                       proto.Bool(true),
			ActualStartTimestampSec:      nullableProtoTimeSec(arrival),
			ActualCompletionTimestampSec: nullableProtoTimeSec(completion),
		},
		{
			Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{
				Visit: &optimizerpb.VRPShiftTeamVisit{
					VisitId:             proto.Int64(int64(visitID2)),
					ArrivalTimestampSec: nullableProtoTimeSec(laterArrival),
				},
			},
			Pinned:                       proto.Bool(true),
			ActualStartTimestampSec:      nullableProtoTimeSec(laterArrival),
			ActualCompletionTimestampSec: nullableProtoTimeSec(laterCompletion),
		},
		{
			Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{
				Visit: &optimizerpb.VRPShiftTeamVisit{
					VisitId:             proto.Int64(int64(visitID3WithoutStartTime)),
					ArrivalTimestampSec: nil,
				},
			},
			Pinned:                       proto.Bool(true),
			ActualStartTimestampSec:      nil,
			ActualCompletionTimestampSec: nil,
		},
	}, stops, "notably, shouldn't include the only committed one")
}

func TestCommitmentsFromShiftTeamActuals(t *testing.T) {
	crID := CareRequestID(time.Now().UnixNano())
	visitID := VisitSnapshotID(time.Now().Add(time.Second).UnixNano())
	uncommitedCrID := CareRequestID(time.Now().Add(time.Microsecond).UnixNano())
	uncommitedVisitID := VisitSnapshotID(time.Now().Add(time.Millisecond).UnixNano())

	h := &routeHistorian{snapshotIDReconciler: &snapshotIDReconciler{
		canonicalCareReqIDToCurrentVisit: map[CareRequestID]*optimizerpb.VRPVisit{
			crID:           {Id: proto.Int64(int64(visitID))},
			uncommitedCrID: {Id: proto.Int64(int64(uncommitedVisitID))},
		},
		visitIDToPhaseTypeShortName: map[VisitSnapshotID]VisitPhaseShortName{
			visitID:           VisitPhaseTypeShortNameCommitted,
			uncommitedVisitID: VisitPhaseTypeShortNameCompleted,
		},
	}}

	commitments := h.commitmentsFromShiftTeamActuals(&StopTypeActuals{
		careRequestData: map[CareRequestID]*Actuals{
			crID:           {Committed: time.Now()},
			uncommitedCrID: {Arrival: time.Now().Add(time.Second), Completion: time.Now().Add(time.Hour)},
		},
	})
	testutils.MustMatch(t, []*optimizerpb.VRPShiftTeamCommitment{{VisitId: proto.Int64(int64(visitID))}}, commitments)
}

func TestRouteHistoryPathDistanceReqsAndTailLocationIDs(t *testing.T) {
	now := proto.Int64(12345)
	baseID := time.Now().UnixNano()
	depotLocID := baseID
	visitID := baseID + 1
	visitLocID := baseID + 2
	restBreakID := baseID + 3
	restBreakLocID := baseID + 4
	currentPositionLocID := baseID + 5
	committedVisitID := baseID + 6
	committedVisitLocID := baseID + 7
	noLocIDVisitID := baseID + 8
	restBreakWithoutLocationID := baseID + 9
	restBreakID2 := baseID + 10
	restBreakLocID2 := baseID + 11
	visits := []*optimizerpb.VRPVisit{
		{Id: proto.Int64(visitID), LocationId: proto.Int64(visitLocID)},
		{Id: proto.Int64(committedVisitID), LocationId: proto.Int64(committedVisitLocID)},
		{Id: proto.Int64(noLocIDVisitID)},
	}
	upcomingCommitments := &optimizerpb.VRPShiftTeamCommitments{
		Commitments: []*optimizerpb.VRPShiftTeamCommitment{{VisitId: proto.Int64(committedVisitID)}},
	}
	restBreaks := restBreaks{
		restBreak{basis: &optimizerpb.VRPRestBreak{Id: proto.Int64(restBreakID), LocationId: proto.Int64(restBreakLocID)}},
		restBreak{basis: &optimizerpb.VRPRestBreak{Id: proto.Int64(restBreakID2), LocationId: proto.Int64(restBreakLocID2)}},
		restBreak{basis: &optimizerpb.VRPRestBreak{Id: proto.Int64(restBreakWithoutLocationID)}},
	}

	visitStop := &optimizerpb.VRPShiftTeamRouteStop{
		ActualStartTimestampSec: now,
		Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{
			Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: proto.Int64(visitID)},
		},
	}
	restBreakStop := &optimizerpb.VRPShiftTeamRouteStop{
		ActualStartTimestampSec: now,
		Stop: &optimizerpb.VRPShiftTeamRouteStop_RestBreak{
			RestBreak: &optimizerpb.VRPShiftTeamRestBreak{RestBreakId: proto.Int64(restBreakID)},
		},
	}
	noLocIDVisitStop := &optimizerpb.VRPShiftTeamRouteStop{
		ActualStartTimestampSec: now,
		Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{
			Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: proto.Int64(noLocIDVisitID)},
		},
	}
	noLocIDRestBreakStop := &optimizerpb.VRPShiftTeamRouteStop{
		ActualStartTimestampSec: now,
		Stop: &optimizerpb.VRPShiftTeamRouteStop_RestBreak{
			RestBreak: &optimizerpb.VRPShiftTeamRestBreak{RestBreakId: proto.Int64(restBreakWithoutLocationID)},
		},
	}
	enRouteRestBreakStop := &optimizerpb.VRPShiftTeamRouteStop{
		Stop: &optimizerpb.VRPShiftTeamRouteStop_RestBreak{
			RestBreak: &optimizerpb.VRPShiftTeamRestBreak{RestBreakId: proto.Int64(restBreakID)},
		},
	}
	enRouteRestBreakStop2 := &optimizerpb.VRPShiftTeamRouteStop{
		Stop: &optimizerpb.VRPShiftTeamRouteStop_RestBreak{
			RestBreak: &optimizerpb.VRPShiftTeamRestBreak{RestBreakId: proto.Int64(restBreakID2)},
		},
	}

	tcs := []struct {
		Desc      string
		ShiftTeam *optimizerpb.VRPShiftTeam

		ExpectedReqs            []DistanceMatrixRequest
		ExpectedTailLocationIDs []int64
		HasError                bool
	}{
		{
			Desc: "shift team with no stops in route history",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops:           []*optimizerpb.VRPShiftTeamRouteStop{},
				},
			},

			ExpectedReqs:            []DistanceMatrixRequest{PathDistancesReq{depotLocID, currentPositionLocID}},
			ExpectedTailLocationIDs: []int64{currentPositionLocID},
		},
		{
			Desc: "shift team with visit and rest break stops in route history",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						visitStop,
						restBreakStop,
					},
				},
			},

			ExpectedReqs: []DistanceMatrixRequest{PathDistancesReq{
				depotLocID,
				visitLocID,
				restBreakLocID,
				currentPositionLocID,
			}},

			ExpectedTailLocationIDs: []int64{currentPositionLocID},
		},
		{
			Desc: "shift team with rest break and visit stops in route history in the other order",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						restBreakStop,
						visitStop,
					},
				},
			},

			ExpectedReqs: []DistanceMatrixRequest{PathDistancesReq{
				depotLocID,
				restBreakLocID,
				visitLocID,
				currentPositionLocID,
			}},
			ExpectedTailLocationIDs: []int64{currentPositionLocID},
		},
		{
			Desc: "shift team with single visit stop in route history",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						visitStop,
					},
				},
			},

			ExpectedReqs: []DistanceMatrixRequest{PathDistancesReq{
				depotLocID,
				visitLocID,
				currentPositionLocID,
			}},
			ExpectedTailLocationIDs: []int64{currentPositionLocID},
		},
		{
			Desc: "shift team with single rest break stop in route history",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						restBreakStop,
					},
				},
			},

			ExpectedReqs: []DistanceMatrixRequest{PathDistancesReq{
				depotLocID,
				restBreakLocID,
				currentPositionLocID,
			}},
			ExpectedTailLocationIDs: []int64{currentPositionLocID},
		},
		{
			Desc: "shift team with single en route rest break stop in route history",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						enRouteRestBreakStop,
					},
				},
			},

			ExpectedReqs: []DistanceMatrixRequest{PathDistancesReq{
				depotLocID,
				currentPositionLocID,
				restBreakLocID,
			}},
			ExpectedTailLocationIDs: []int64{restBreakLocID},
		},
		{
			Desc: "shift team with multiple en route rest break stops in route history has additional distances",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						enRouteRestBreakStop,
						enRouteRestBreakStop2,
					},
				},
			},

			ExpectedReqs: []DistanceMatrixRequest{
				PathDistancesReq{
					depotLocID,
					restBreakLocID,
					currentPositionLocID,
					restBreakLocID2,
				},
			},
			ExpectedTailLocationIDs: []int64{restBreakLocID2},
		},
		{
			Desc: "shift team with an en route stop in the middle (invalid) computes normal distances",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						visitStop,
						enRouteRestBreakStop2,
						restBreakStop,
					},
				},
			},

			ExpectedReqs: []DistanceMatrixRequest{
				PathDistancesReq{
					depotLocID,
					visitLocID,
					restBreakLocID2,
					restBreakLocID,
					// if the en route stop is not at the end... the current position should be last!
					currentPositionLocID,
				},
			},
			ExpectedTailLocationIDs: []int64{currentPositionLocID},
		},
		{
			Desc: "shift team with visit and rest break stops and commitment",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						visitStop,
						restBreakStop,
					},
				},
				UpcomingCommitments: upcomingCommitments,
			},

			ExpectedReqs: []DistanceMatrixRequest{PathDistancesReq{
				depotLocID,
				visitLocID,
				restBreakLocID,
				currentPositionLocID,
				committedVisitLocID,
			}},
			ExpectedTailLocationIDs: []int64{committedVisitLocID},
		},
		{
			Desc: "shift team with en-route final stop has a current position segment to it that continues onto the upcoming commitments",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						visitStop,
						// en-route without an actual start time
						enRouteRestBreakStop,
					},
				},
				UpcomingCommitments: upcomingCommitments,
			},

			ExpectedReqs: []DistanceMatrixRequest{PathDistancesReq{
				depotLocID,
				visitLocID,
				currentPositionLocID,
				restBreakLocID,
				committedVisitLocID,
			}},
			ExpectedTailLocationIDs: []int64{committedVisitLocID},
		},
		{
			Desc: "bad rest break ID returns error",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						visitStop,
						{ActualStartTimestampSec: now,
							Stop: &optimizerpb.VRPShiftTeamRouteStop_RestBreak{RestBreak: &optimizerpb.VRPShiftTeamRestBreak{
								// some random bad ID.
								RestBreakId: proto.Int64(time.Now().UnixNano())}}},
					},
				},
			},

			HasError: true,
		},
		{
			Desc: "visit stop with missing location ID returns error",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						noLocIDVisitStop,
					},
				},
			},

			HasError: true,
		},
		{
			Desc: "rest break stop with missing location ID returns error",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						noLocIDRestBreakStop,
					},
				},
			},

			HasError: true,
		},
		{
			Desc: "bad visit ID returns error",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						{ActualStartTimestampSec: now,
							Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{
								// some random bad ID.
								VisitId: proto.Int64(time.Now().UnixNano())}}},
						restBreakStop,
					},
				},
			},

			HasError: true,
		},
		{
			Desc: "bad stop returns error",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: &optimizerpb.VRPShiftTeamPosition{LocationId: currentPositionLocID},
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						{Stop: nil},
					},
				},
			},

			HasError: true,
		},
	}

	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			h := &routeHistorian{snapshotIDReconciler: &snapshotIDReconciler{stopLocations: newStopLocations(visits, restBreaks)}}
			pathReqs, tails, err := h.routeHistoryPathDistanceReqsAndTailLocationIDs([]*optimizerpb.VRPShiftTeam{tc.ShiftTeam})
			testutils.MustMatch(t, tc.ExpectedReqs, pathReqs)
			testutils.MustMatch(t, tc.ExpectedTailLocationIDs, tails)
			testutils.MustMatch(t, tc.HasError, err != nil)
		})
	}
}

func TestLocationIDsOfStopsNotInRouteHistoryOrUpcomingCommitments(t *testing.T) {
	baseID := time.Now().UnixNano()
	depotLocID := baseID
	visitID := baseID + 1
	visitLocID := baseID + 2
	restBreakID := baseID + 3
	restBreakLocID := baseID + 4
	visits := []*optimizerpb.VRPVisit{
		{Id: proto.Int64(visitID), LocationId: proto.Int64(visitLocID)},
	}
	validRestBreaks := restBreaks{
		restBreak{basis: &optimizerpb.VRPRestBreak{Id: proto.Int64(restBreakID), LocationId: proto.Int64(restBreakLocID)}},
	}

	goodStopLocations := newStopLocations(visits, validRestBreaks)
	badNoLocIDStopLocations := newStopLocations(
		[]*optimizerpb.VRPVisit{{Id: proto.Int64(visitID)}},
		restBreaks{restBreak{basis: &optimizerpb.VRPRestBreak{Id: proto.Int64(restBreakID)}}})
	visitStop := &optimizerpb.VRPShiftTeamRouteStop{
		Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{Visit: &optimizerpb.VRPShiftTeamVisit{VisitId: proto.Int64(visitID)}},
	}
	restBreakStop := &optimizerpb.VRPShiftTeamRouteStop{
		Stop: &optimizerpb.VRPShiftTeamRouteStop_RestBreak{RestBreak: &optimizerpb.VRPShiftTeamRestBreak{RestBreakId: proto.Int64(restBreakID)}},
	}
	tcs := []struct {
		Desc          string
		ShiftTeam     *optimizerpb.VRPShiftTeam
		StopLocations stopLocations

		ExpectedLocationIDs []int64
		HasError            bool
	}{
		{
			Desc: "no stops in route history have everything",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: nil,
					Stops:           []*optimizerpb.VRPShiftTeamRouteStop{},
				},
			},
			StopLocations: goodStopLocations,

			ExpectedLocationIDs: []int64{visitLocID, restBreakLocID},
		},
		{
			Desc: "all stops in route history are accounted for",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: nil,
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						visitStop,
						restBreakStop,
					},
				},
			},
			StopLocations: goodStopLocations,

			ExpectedLocationIDs: []int64{},
		},
		{
			Desc: "missing rest break locationID is surfaced",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: nil,
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						visitStop,
					},
				},
			},
			StopLocations: goodStopLocations,

			ExpectedLocationIDs: []int64{restBreakLocID},
		},
		{
			Desc: "missing visit locationID is surfaced",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: nil,
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						restBreakStop,
					},
				},
			},
			StopLocations: goodStopLocations,

			ExpectedLocationIDs: []int64{visitLocID},
		},
		{
			Desc: "but if its in the upcoming commitments, back to normal",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: nil,
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						restBreakStop,
					},
				},
				UpcomingCommitments: &optimizerpb.VRPShiftTeamCommitments{Commitments: []*optimizerpb.VRPShiftTeamCommitment{{VisitId: proto.Int64(visitID)}}},
			},
			StopLocations: goodStopLocations,

			ExpectedLocationIDs: []int64{},
		},
		{
			Desc: "bad stop returns error",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: nil,
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						{Stop: nil},
					},
				},
			},
			StopLocations: goodStopLocations,

			HasError: true,
		},
		{
			Desc: "missing rest break locationID errors when not found since its missing a location ID",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: nil,
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						visitStop,
					},
				},
			},
			StopLocations: badNoLocIDStopLocations,

			HasError: true,
		},
		{
			Desc: "missing visit locationID errors when not found since its missing a location ID",
			ShiftTeam: &optimizerpb.VRPShiftTeam{
				DepotLocationId: proto.Int64(depotLocID),
				RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
					CurrentPosition: nil,
					Stops: []*optimizerpb.VRPShiftTeamRouteStop{
						restBreakStop,
					},
				},
			},
			StopLocations: badNoLocIDStopLocations,

			HasError: true,
		},
	}

	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			h := &routeHistorian{snapshotIDReconciler: &snapshotIDReconciler{stopLocations: tc.StopLocations}}
			missingLocationsIDs, err := h.locationIDsOfStopsNotInRouteHistoryOrUpcomingCommitments([]*optimizerpb.VRPShiftTeam{tc.ShiftTeam})
			testutils.MustMatch(t, tc.ExpectedLocationIDs, missingLocationsIDs)
			testutils.MustMatch(t, tc.HasError, err != nil)
		})
	}
}

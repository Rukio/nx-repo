package logisticsdb

import (
	"errors"
	"fmt"
	"sort"
	"sync"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/collections"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"google.golang.org/protobuf/proto"
)

type routeHistorian struct {
	*snapshotIDReconciler
	shiftStartBufferSec int64
}

type CareRequestActuals struct {
	// TODO: actually do this ;) The first two at least are unused.
	// TODO: fold all of this into the ShiftTeamActuals after merge of 1600.

	// ArrivalTimes mark the actual on-scene visit phase transition by care requests, for on-scene and completed care requests.
	ArrivalTimes map[CareRequestID]time.Time
	// CompletionTimes mark actual completion timestamps for care requests, for care requests in the completed phase.
	CompletionTimes map[CareRequestID]time.Time
	// CurrentlyEnRouteTimes are timestamps when the care request transitioned into
	// an en-route phase;  where the care request is currently en-route.
	CurrentlyEnRouteTimes map[CareRequestID]time.Time

	// ShiftTeamActuals tracks the data for each shift team +care request.
	ShiftTeamActuals *ShiftTeamActuals
}

type StopTypeActuals struct {
	careRequestData map[CareRequestID]*Actuals
	restBreakData   map[int64]*Actuals
}

type ShiftTeamActuals struct {
	mu   sync.RWMutex
	data map[ShiftTeamID]*StopTypeActuals
}

func NewShiftTeamActuals() *ShiftTeamActuals {
	return &ShiftTeamActuals{data: make(map[ShiftTeamID]*StopTypeActuals)}
}

func newStopTypeActuals() *StopTypeActuals {
	return &StopTypeActuals{
		careRequestData: make(map[CareRequestID]*Actuals),
		restBreakData:   make(map[int64]*Actuals),
	}
}

func (s *StopTypeActuals) withRestBreak(restBreakID int64, a *Actuals) *StopTypeActuals {
	s.restBreakData[restBreakID] = a
	return s
}

func (s *StopTypeActuals) withCareRequest(careRequestID CareRequestID, a *Actuals) *StopTypeActuals {
	s.careRequestData[careRequestID] = a
	return s
}

type Actuals struct {
	Committed time.Time
	// CurrentlyEnRoute is set only if the shift team is currently en-route for this stop.
	// (and not, e.g., the timestamp of the latest transition to that state like the other fields).
	CurrentlyEnRoute time.Time
	// Arrival is the "on-scene"-equivalent for care requests (or rest break start).
	Arrival time.Time
	// Completion is the timestamp after which a stop is completed.
	Completion time.Time
}

func (a *Actuals) isRouteHistoryStop() bool {
	return !a.CurrentlyEnRoute.IsZero() || !a.Arrival.IsZero() || !a.Completion.IsZero()
}

func maxTime(a, b time.Time) time.Time {
	if a.After(b) {
		return a
	}
	return b
}

func (a *Actuals) stopComesBeforeInRouteHistory(b *Actuals) (less bool, equal bool) { //nolint: nonamedreturns
	latestATime := maxTime(a.CurrentlyEnRoute, maxTime(a.Arrival, a.Completion))
	latestBTime := maxTime(b.CurrentlyEnRoute, maxTime(b.Arrival, b.Completion))

	return latestATime.Before(latestBTime), latestATime.Equal(latestBTime)
}

func (s *ShiftTeamActuals) Get(id ShiftTeamID) (*StopTypeActuals, bool) {
	s.mu.RLock()
	defer s.mu.RUnlock()
	a, ok := s.data[id]
	if !ok {
		return a, ok
	}

	copiedCR := make(map[CareRequestID]*Actuals, len(a.careRequestData))
	for k, v := range a.careRequestData {
		c := *v
		copiedCR[k] = &c
	}
	copiedRestBreak := make(map[int64]*Actuals, len(a.restBreakData))
	for k, v := range a.restBreakData {
		c := *v
		copiedRestBreak[k] = &c
	}
	return &StopTypeActuals{
		careRequestData: copiedCR,
		restBreakData:   copiedRestBreak,
	}, ok
}

func (s *ShiftTeamActuals) AddRestBreak(shiftTeamID ShiftTeamID, restBreakID int64, actuals *Actuals) {
	s.mu.Lock()
	defer s.mu.Unlock()
	d, ok := s.data[shiftTeamID]
	if !ok {
		s.data[shiftTeamID] = newStopTypeActuals().withRestBreak(restBreakID, actuals)
		return
	}
	// given that the API is for all actuals, we don't check for existence here.
	d.restBreakData[restBreakID] = actuals
}

func (s *ShiftTeamActuals) AddArrival(p EntityIDPair, t time.Time) {
	s.mu.Lock()
	defer s.mu.Unlock()
	d, ok := s.data[p.ShiftTeamID]
	if !ok {
		s.data[p.ShiftTeamID] = newStopTypeActuals().withCareRequest(p.CareRequestID, &Actuals{Arrival: t})
		return
	}
	crd, ok := d.careRequestData[p.CareRequestID]
	if !ok {
		d.careRequestData[p.CareRequestID] = &Actuals{Arrival: t}
		return
	}

	crd.Arrival = t
}

func (s *ShiftTeamActuals) AddCommitted(p EntityIDPair, t time.Time) {
	s.mu.Lock()
	defer s.mu.Unlock()
	d, ok := s.data[p.ShiftTeamID]
	if !ok {
		s.data[p.ShiftTeamID] = newStopTypeActuals().withCareRequest(p.CareRequestID, &Actuals{Committed: t})
		return
	}
	crd, ok := d.careRequestData[p.CareRequestID]
	if !ok {
		d.careRequestData[p.CareRequestID] = &Actuals{Committed: t}
		return
	}

	crd.Committed = t
}

func (s *ShiftTeamActuals) AddCompletion(p EntityIDPair, t time.Time) {
	s.mu.Lock()
	defer s.mu.Unlock()
	d, ok := s.data[p.ShiftTeamID]
	if !ok {
		s.data[p.ShiftTeamID] = newStopTypeActuals().withCareRequest(p.CareRequestID, &Actuals{Completion: t})
		return
	}
	crd, ok := d.careRequestData[p.CareRequestID]
	if !ok {
		d.careRequestData[p.CareRequestID] = &Actuals{Completion: t}
		return
	}

	crd.Completion = t
}

func (s *ShiftTeamActuals) AddCurrentlyEnRoute(p EntityIDPair, t time.Time) {
	s.mu.Lock()
	defer s.mu.Unlock()
	d, ok := s.data[p.ShiftTeamID]
	if !ok {
		s.data[p.ShiftTeamID] = newStopTypeActuals().withCareRequest(p.CareRequestID, &Actuals{CurrentlyEnRoute: t})
		return
	}
	crd, ok := d.careRequestData[p.CareRequestID]
	if !ok {
		d.careRequestData[p.CareRequestID] = &Actuals{CurrentlyEnRoute: t}
		return
	}

	crd.CurrentlyEnRoute = t
}

func (h *routeHistorian) vrpShiftTeamsForSnapshots(snapshots []*logisticssql.ShiftTeamSnapshot, attrs []*logisticssql.GetAttributesForShiftTeamSnapshotsRow) ([]*optimizerpb.VRPShiftTeam, error) {
	snapshotAttrs := map[int64][]*optimizerpb.VRPAttribute{}
	for _, attr := range attrs {
		snapshotAttrs[attr.ShiftTeamSnapshotID] = append(snapshotAttrs[attr.ShiftTeamSnapshotID], &optimizerpb.VRPAttribute{
			Id: attr.Name,
		})
	}

	shiftTeamIDMapping := make(map[ShiftTeamSnapshotID]ShiftTeamID, len(snapshots))
	shiftTeams := make([]*optimizerpb.VRPShiftTeam, len(snapshots))
	for i, snapshot := range snapshots {
		shiftTeamIDMapping[ShiftTeamSnapshotID(snapshot.ID)] = ShiftTeamID(snapshot.ShiftTeamID)
		startTimestampSec := min(snapshot.StartTimestampSec+h.shiftStartBufferSec, snapshot.EndTimestampSec)
		shiftTeams[i] = &optimizerpb.VRPShiftTeam{
			Id:              &snapshot.ID,
			DepotLocationId: &snapshot.BaseLocationID,
			AvailableTimeWindow: &optimizerpb.VRPTimeWindow{
				StartTimestampSec: &startTimestampSec,
				EndTimestampSec:   &snapshot.EndTimestampSec,
			},
			Attributes:          snapshotAttrs[snapshot.ID],
			RouteHistory:        &optimizerpb.VRPShiftTeamRouteHistory{},
			UpcomingCommitments: &optimizerpb.VRPShiftTeamCommitments{},
			NumAppMembers:       proto.Int32(snapshot.NumAppMembers),
			NumDhmtMembers:      proto.Int32(snapshot.NumDhmtMembers),
		}
	}
	err := h.annotateRouteHistories(shiftTeams, shiftTeamIDMapping)
	if err != nil {
		return nil, fmt.Errorf("error annotating route histories: %w", err)
	}
	err = h.annotateUpcomingCommitments(shiftTeams, shiftTeamIDMapping)
	if err != nil {
		return nil, fmt.Errorf("error annotating upcoming commitments: %w", err)
	}

	return shiftTeams, nil
}

func min(x int64, y int64) int64 {
	if x >= y {
		return y
	}
	return x
}

func (h *routeHistorian) annotateRouteHistories(shiftTeams []*optimizerpb.VRPShiftTeam, idMapping map[ShiftTeamSnapshotID]ShiftTeamID) error {
	for _, st := range shiftTeams {
		shiftTeamID, ok := idMapping[ShiftTeamSnapshotID(st.GetId())]
		if !ok {
			return fmt.Errorf("invalid idMapping, unknown shift team ID for snapshot ID: %d", st.GetId())
		}
		actuals, ok := h.careRequestActuals.ShiftTeamActuals.Get(shiftTeamID)
		if !ok {
			// if we don't have actuals, we don't add to the route history stops.
			continue
		}
		st.RouteHistory.Stops = h.routeHistoryStopsFromShiftTeamActuals(actuals)
	}

	return h.annotateRouteHistoryCurrentPositions(shiftTeams)
}

func nullableProtoTimeSec(t time.Time) *int64 {
	if t.IsZero() {
		return nil
	}
	return proto.Int64(t.Unix())
}

func (h *routeHistorian) routeHistoryStopFromCareRequestActual(careRequestID CareRequestID, actual *Actuals) *optimizerpb.VRPShiftTeamRouteStop {
	currentVisit := h.canonicalCareReqIDToCurrentVisit[careRequestID]
	return &optimizerpb.VRPShiftTeamRouteStop{
		Stop: &optimizerpb.VRPShiftTeamRouteStop_Visit{
			Visit: &optimizerpb.VRPShiftTeamVisit{
				VisitId:             proto.Int64(currentVisit.GetId()),
				ArrivalTimestampSec: nullableProtoTimeSec(actual.Arrival),
			},
		},
		// TODO: deprecate VRPShiftTeamRouteStop.Pinned after we stop using Route.Stops.Pinned on the output.
		Pinned:                       proto.Bool(true),
		ActualStartTimestampSec:      nullableProtoTimeSec(actual.Arrival),
		ActualCompletionTimestampSec: nullableProtoTimeSec(actual.Completion),
	}
}

func (h *routeHistorian) stopFromRestBreakActual(restBreakID int64, actual *Actuals) *optimizerpb.VRPShiftTeamRouteStop {
	return &optimizerpb.VRPShiftTeamRouteStop{
		Stop: &optimizerpb.VRPShiftTeamRouteStop_RestBreak{
			RestBreak: &optimizerpb.VRPShiftTeamRestBreak{
				RestBreakId:       proto.Int64(restBreakID),
				StartTimestampSec: nullableProtoTimeSec(actual.Arrival),
			},
		},
		Pinned:                       proto.Bool(true),
		ActualStartTimestampSec:      nullableProtoTimeSec(actual.Arrival),
		ActualCompletionTimestampSec: nullableProtoTimeSec(actual.Completion),
	}
}

func (h *routeHistorian) routeHistoryStopsFromShiftTeamActuals(actuals *StopTypeActuals) []*optimizerpb.VRPShiftTeamRouteStop {
	type stopActual struct {
		stop   *optimizerpb.VRPShiftTeamRouteStop
		actual *Actuals
	}
	var unorderedStops []stopActual

	for careRequestID, actual := range actuals.careRequestData {
		if !actual.isRouteHistoryStop() {
			continue
		}
		unorderedStops = append(unorderedStops, stopActual{stop: h.routeHistoryStopFromCareRequestActual(careRequestID, actual), actual: actual})
	}
	for restBreakID, actual := range actuals.restBreakData {
		if !actual.isRouteHistoryStop() {
			continue
		}
		unorderedStops = append(unorderedStops, stopActual{stop: h.stopFromRestBreakActual(restBreakID, actual), actual: actual})
	}

	// Order the stops by their actual data.
	sort.Slice(unorderedStops, func(i, j int) bool {
		less, eq := unorderedStops[i].actual.stopComesBeforeInRouteHistory(unorderedStops[j].actual)
		if eq {
			// to prevent test flakes, we explicitly handle equality based on increasing visitID.
			return unorderedStops[i].stop.GetVisit().GetVisitId() < unorderedStops[j].stop.GetVisit().GetVisitId()
		}
		return less
	})
	var orderedStops []*optimizerpb.VRPShiftTeamRouteStop
	for _, sa := range unorderedStops {
		orderedStops = append(orderedStops, sa.stop)
	}
	return orderedStops
}

func (h *routeHistorian) annotateUpcomingCommitments(shiftTeams []*optimizerpb.VRPShiftTeam, idMapping map[ShiftTeamSnapshotID]ShiftTeamID) error {
	for _, st := range shiftTeams {
		shiftTeamID, ok := idMapping[ShiftTeamSnapshotID(st.GetId())]
		if !ok {
			return fmt.Errorf("invalid idMapping, unknown shift team ID for snapshot ID: %d", st.GetId())
		}
		actuals, ok := h.careRequestActuals.ShiftTeamActuals.Get(shiftTeamID)
		if !ok {
			// if we don't have actuals, we don't add to the upcoming commitments.
			continue
		}
		st.UpcomingCommitments.Commitments = h.commitmentsFromShiftTeamActuals(actuals)
	}

	return nil
}

func (h *routeHistorian) commitmentsFromShiftTeamActuals(actuals *StopTypeActuals) []*optimizerpb.VRPShiftTeamCommitment {
	var unorderedCommitments []*optimizerpb.VRPShiftTeamCommitment
	var commitTimes = make(map[VisitSnapshotID]time.Time)
	for crID, actual := range actuals.careRequestData {
		visitSnapshotID := VisitSnapshotID(h.canonicalCareReqIDToCurrentVisit[crID].GetId())
		currentVisitPhase := h.visitIDToPhaseTypeShortName[visitSnapshotID]
		if currentVisitPhase == VisitPhaseTypeShortNameCommitted {
			unorderedCommitments = append(unorderedCommitments,
				&optimizerpb.VRPShiftTeamCommitment{VisitId: proto.Int64(int64(visitSnapshotID))},
			)
			commitTimes[visitSnapshotID] = actual.Committed
		}
	}
	// Order the stops by the time they transitioned into the committed status.
	sort.Slice(unorderedCommitments, func(i, j int) bool {
		iCommitTime := commitTimes[VisitSnapshotID(unorderedCommitments[i].GetVisitId())]
		jCommitTime := commitTimes[VisitSnapshotID(unorderedCommitments[j].GetVisitId())]
		// to prevent test flakes, we explicitly handle equality based on increasing visitID.
		if iCommitTime.Equal(jCommitTime) {
			return unorderedCommitments[i].GetVisitId() < unorderedCommitments[j].GetVisitId()
		}
		return iCommitTime.Before(jCommitTime)
	})
	return unorderedCommitments
}

/*
Compute the linear chain of segments that are "fixed"/pinned for each shift team:

	depot -> route history stops (...) -> current position -> upcoming commitments (...)

NOTE: Because the CurrentPosition is not a dedicated stop type that is sent to Optimizer, we have a leaky abstraction
that's handled in this function. In the case where an en-route stop is the last route history stop, Optimizer
injects the current position "just before" that en-route stop (en-route = when that stop does not have a start timestamp)
Thus in that case, we need to compute the next distance FROM en-route stop TO the next upcoming commitment.

The case of multiple en-route stops, or en-route stops that are not at the end of the route history will result in a
validation error (which we only expect for LAA which has less upstream validation).  This function only puts the current
position in before the final stop if is en-route.

	depot -> route history stops (...) -> current position -> last-en-route stop -> upcoming commitments (...)
*/
func (h *routeHistorian) routeHistoryPathDistanceReqsAndTailLocationIDs(vrpShiftTeams []*optimizerpb.VRPShiftTeam) ([]DistanceMatrixRequest, []int64, error) {
	var tailLocationIDs []int64

	pathReqs := make([]DistanceMatrixRequest, 0, len(vrpShiftTeams))
	for _, st := range vrpShiftTeams {
		currentPositionLocationID := st.GetRouteHistory().GetCurrentPosition().GetLocationId()
		if currentPositionLocationID == 0 {
			return nil, nil, fmt.Errorf("0 location ID for currentPositionLocationID on shift team snapshot: %d", st.GetId())
		}

		depotLocID := st.GetDepotLocationId()
		if depotLocID == 0 {
			return nil, nil, fmt.Errorf("0 location ID for GetDepotLocationId on shift team snapshot: %d", st.GetId())
		}

		stops := st.GetRouteHistory().GetStops()
		path := make(PathDistancesReq, 0, len(stops)+1)
		path = append(path, depotLocID)

		var lastRouteHistoryStopIsEnRoute bool
		for i, stop := range stops {
			isLastStop := i == len(stops)-1
			locID, err := h.stopLocations.locationIDForStop(stop)
			if err != nil {
				return nil, nil, fmt.Errorf("error resolving locationID for stop on shift team snapshot(%d): %w", st.GetId(), err)
			}

			if stop.ActualStartTimestampSec == nil && isLastStop {
				// If the stop hasn't started yet, we need a distance from the last completed stop, to the current position, to it.
				// We validate later that there is only one of these "en-route" stops, at the end of the route history.
				path = append(path, currentPositionLocationID)
				lastRouteHistoryStopIsEnRoute = true
			} else {
				lastRouteHistoryStopIsEnRoute = false
			}
			path = append(path, locID)
		}
		// Get to the current position from route history (if it's not already in there).
		if !lastRouteHistoryStopIsEnRoute {
			path = append(path, currentPositionLocationID)
		}

		for _, upcomingCommitment := range st.GetUpcomingCommitments().GetCommitments() {
			locID, err := h.stopLocations.locationIDForUpcomingCommitment(upcomingCommitment)
			if err != nil {
				return nil, nil, fmt.Errorf("error resolving locationID for upcoming commitment on shift team snapshot(%d): %w", st.GetId(), err)
			}

			path = append(path, locID)
		}

		lastLocID := path[len(path)-1]
		tailLocationIDs = append(tailLocationIDs, lastLocID)
		pathReqs = append(pathReqs, path)
	}

	return pathReqs, tailLocationIDs, nil
}

func (s stopLocations) locationIDForUpcomingCommitment(uc *optimizerpb.VRPShiftTeamCommitment) (int64, error) {
	locID, ok := s.visitLocations[VisitSnapshotID(uc.GetVisitId())]
	if !ok {
		return 0, fmt.Errorf("unknown location for visit ID(%d) in shift team upcoming commitment", uc.GetVisitId())
	}
	if locID == 0 {
		return 0, fmt.Errorf("0 location ID for upcoming commitment visit: %d", uc.GetVisitId())
	}
	return locID, nil
}

func (s stopLocations) locationIDForStop(stop *optimizerpb.VRPShiftTeamRouteStop) (int64, error) {
	switch stop.GetStop().(type) {
	case *optimizerpb.VRPShiftTeamRouteStop_Visit:
		v := stop.GetVisit()
		locID, ok := s.visitLocations[VisitSnapshotID(v.GetVisitId())]
		if !ok {
			return 0, fmt.Errorf("unknown location for visit ID(%d) in shift team route history", v.GetVisitId())
		}
		if locID == 0 {
			return 0, fmt.Errorf("0 location ID for locationIDForStop on visit stop: %d", v.GetVisitId())
		}
		return locID, nil

	case *optimizerpb.VRPShiftTeamRouteStop_RestBreak:
		rb := stop.GetRestBreak()
		locID, ok := s.restBreakLocations[rb.GetRestBreakId()]
		if !ok {
			return 0, fmt.Errorf("unknown location for rest break ID(%d) in shift team route history", rb.GetRestBreakId())
		}
		if locID == 0 {
			return 0, fmt.Errorf("0 location ID for locationIDForStop on rest break stop: %d", rb.GetRestBreakId())
		}
		return locID, nil
	}
	return 0, errors.New("unhandled stop type in locationIDsOfStopsNotInRouteHistoryOrUpcomingCommitments")
}

// stopTracker provides a utility to walk shift teams' route histories and keep track
// of which stop entities have not been seen yet.  For use in computing which locationIDs
// need to still have distances computed for them.
type stopTracker struct {
	unobservedVisits     map[VisitSnapshotID]*optimizerpb.VRPVisit
	unobservedRestBreaks map[int64]restBreak
}

func newStopTracker(visits []*optimizerpb.VRPVisit, restBreaks restBreaks) *stopTracker {
	vs := make(map[VisitSnapshotID]*optimizerpb.VRPVisit, len(visits))
	rbs := make(map[int64]restBreak, len(restBreaks))
	for _, v := range visits {
		vs[VisitSnapshotID(v.GetId())] = v
	}
	for _, rb := range restBreaks {
		rbs[rb.basis.GetId()] = rb
	}
	return &stopTracker{
		unobservedVisits:     vs,
		unobservedRestBreaks: rbs,
	}
}

func (s *stopTracker) unobservedStopLocationIDs() ([]int64, error) {
	locationIDs := collections.NewLinkedInt64Set(len(s.unobservedRestBreaks) + len(s.unobservedVisits))
	for _, v := range s.unobservedVisits {
		locID := v.GetLocationId()
		if locID == 0 {
			return nil, fmt.Errorf("0 location ID for unobservedStopLocationIDs visit: %d", v.GetId())
		}

		locationIDs.Add(locID)
	}
	for _, rb := range s.unobservedRestBreaks {
		if rb.basis.GetUnrequested() && rb.basis.GetLocationId() == 0 {
			// unrequested rest breaks are allowed to not have locations.
			continue
		}
		locID := rb.basis.GetLocationId()
		if locID == 0 {
			return nil, fmt.Errorf("0 location ID for unobservedStopLocationIDs rest break: %d", rb.basis.GetId())
		}

		locationIDs.Add(locID)
	}
	return locationIDs.Elems(), nil
}

func (s *stopTracker) observeVisitCommitment(vc *optimizerpb.VRPShiftTeamCommitment) {
	delete(s.unobservedVisits, VisitSnapshotID(vc.GetVisitId()))
}

func (s *stopTracker) observeStop(stop *optimizerpb.VRPShiftTeamRouteStop) error {
	switch stop.GetStop().(type) {
	case *optimizerpb.VRPShiftTeamRouteStop_Visit:
		s.observeVisit(VisitSnapshotID(stop.GetVisit().GetVisitId()))
		return nil
	case *optimizerpb.VRPShiftTeamRouteStop_RestBreak:
		s.observeRestBreak(stop.GetRestBreak().GetRestBreakId())
		return nil
	}
	return errors.New("unhandled stop type in stopTracker.observeStop")
}

func (s *stopTracker) observeVisit(visitID VisitSnapshotID) {
	delete(s.unobservedVisits, visitID)
}

func (s *stopTracker) observeRestBreak(restBreakID int64) {
	delete(s.unobservedRestBreaks, restBreakID)
}

// locationIDsOfStopsNotInRouteHistoryOrUpcomingCommitments returns visit and rest break request location IDs for entities that are not referenced
// in the vrpShiftTeams route history stops or upcoming commitments. These are "planning visits" for which we need to compute more distances for.
//
// Note that we are extra careful to allow locationIDs to be shared across entities.  For example, if two visits have
// the same location ID, one in a route history and one not -- we still need to return that location ID in the response.
func (h *routeHistorian) locationIDsOfStopsNotInRouteHistoryOrUpcomingCommitments(vrpShiftTeams []*optimizerpb.VRPShiftTeam) ([]int64, error) {
	stopTracker := newStopTracker(h.stopLocations.visits, h.stopLocations.restBreaks)
	for _, st := range vrpShiftTeams {
		for _, stop := range st.GetRouteHistory().GetStops() {
			if err := stopTracker.observeStop(stop); err != nil {
				return nil, fmt.Errorf("error observing stop on shift team snapshot(%d): %w", st.GetId(), err)
			}
		}
		for _, uc := range st.GetUpcomingCommitments().GetCommitments() {
			stopTracker.observeVisitCommitment(uc)
		}
	}
	return stopTracker.unobservedStopLocationIDs()
}

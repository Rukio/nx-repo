package logisticsdb

import (
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/logistics/validation"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

const (
	shiftTeamSnapshotIDField = "shift_team_snapshot_id"
	visitSnapshotIDField     = "visit_snapshot_id"
	restBreakIDField         = "rest_break_id"
)

var (
	h routeHistoryValidator

	// TODO: add a problem validator for care request actuals and include in DefaultProblemValidators:
	// For each shift team:
	//  - arrival < completion for all stops (and completion set --> arrival is set)
	//  - current position timestamp >= arrival for all stops

	// DefaultProblemValidators are the problem validators to be run by default
	// in core optimization and check feasibility problem preparation.
	DefaultProblemValidators = []validation.ProblemValidator{
		hasDescription,
		// Validate the RouteHistory.
		h.validateAllShiftTeamsHaveUpcomingCommitments,
		h.validateAllShiftTeamsHaveRouteHistory,
		h.validateCompletedStopsHaveArrivals,
		h.validateArrivalsAreBeforeCompletions,
		h.validateAtMostOneEnRouteStop,
		h.validateEnRouteStopMustBeAtEndOfRouteHistory,
		// TODO: validate current position timestamp after these mods?
		// TODO: validate current position invariants.
		// TODO: validate that a given visit only shows up in one place.
	}
)

func hasDescription(problem *optimizerpb.VRPProblem) *validation.Error {
	desc := problem.GetDescription()
	if desc == nil {
		return &validation.Error{Name: "nil_problem_description", Msg: "nil problem description"}
	}
	return nil
}

type routeHistoryValidator struct{}

func (h routeHistoryValidator) validateAllShiftTeamsHaveRouteHistory(problem *optimizerpb.VRPProblem) *validation.Error {
	shiftTeams := problem.GetDescription().GetShiftTeams()
	var err *validation.Error

	for _, st := range shiftTeams {
		if st.GetRouteHistory() == nil {
			err = &validation.Error{
				Name:        "no_shift_team_route_history",
				Msg:         "shift teams must have at least an empty route history message",
				Recoverable: true,
				Fields:      monitoring.Fields{"shift_team_snapshot_id": st.GetId()},
			}
			st.RouteHistory = &optimizerpb.VRPShiftTeamRouteHistory{}
		}
	}
	return err
}

func (h routeHistoryValidator) validateAllShiftTeamsHaveUpcomingCommitments(problem *optimizerpb.VRPProblem) *validation.Error {
	shiftTeams := problem.GetDescription().GetShiftTeams()
	var err *validation.Error

	for _, st := range shiftTeams {
		if st.GetUpcomingCommitments() == nil {
			err = &validation.Error{
				Name:        "no_shift_team_upcoming_commitments",
				Msg:         "shift teams must have at least an empty upcoming commitments message",
				Recoverable: true,
				Fields:      monitoring.Fields{"shift_team_snapshot_id": st.GetId()},
			}
			st.UpcomingCommitments = &optimizerpb.VRPShiftTeamCommitments{}
		}
	}
	return err
}

func (h routeHistoryValidator) validateCompletedStopsHaveArrivals(problem *optimizerpb.VRPProblem) *validation.Error {
	shiftTeams := problem.GetDescription().GetShiftTeams()
	var err *validation.Error

	for _, shiftTeam := range shiftTeams {
		for _, stop := range shiftTeam.GetRouteHistory().GetStops() {
			if stop.ActualCompletionTimestampSec != nil {
				if stop.ActualStartTimestampSec == nil {
					err = &validation.Error{
						Name:        "missing_arrival_timestamp_for_completed",
						Msg:         "we expect completed stops to also have an actual arrival",
						Recoverable: true,
						Fields: monitoring.Fields{
							shiftTeamSnapshotIDField: shiftTeam.GetId(),
							visitSnapshotIDField:     stop.GetVisit().GetVisitId(),
							restBreakIDField:         stop.GetRestBreak().GetRestBreakId(),
						},
					}

					// when there's no actual at all... we fill it to be the same as the completion.
					stop.ActualStartTimestampSec = stop.ActualCompletionTimestampSec
				}
			}
		}
	}
	return err
}

func (h routeHistoryValidator) validateArrivalsAreBeforeCompletions(problem *optimizerpb.VRPProblem) *validation.Error {
	shiftTeams := problem.GetDescription().GetShiftTeams()
	var err *validation.Error

	for _, shiftTeam := range shiftTeams {
		for _, stop := range shiftTeam.GetRouteHistory().GetStops() {
			if stop.ActualCompletionTimestampSec != nil && stop.ActualStartTimestampSec != nil {
				correctOrder := *stop.ActualCompletionTimestampSec >= *stop.ActualStartTimestampSec
				if !correctOrder {
					err = &validation.Error{
						Name:        "arrival_after_completion",
						Msg:         "we expect completion timestamps to always be after arrival timestamps",
						Recoverable: true,
						Fields: monitoring.Fields{
							shiftTeamSnapshotIDField: shiftTeam.GetId(),
							visitSnapshotIDField:     stop.GetVisit().GetVisitId(),
							restBreakIDField:         stop.GetRestBreak().GetRestBreakId(),
						},
					}
					// when in the wrong order, fix by putting the arrival back in time to the completion.
					stop.ActualStartTimestampSec = stop.ActualCompletionTimestampSec
				}
			}
		}
	}
	return err
}

func (h routeHistoryValidator) validateEnRouteStopMustBeAtEndOfRouteHistory(problem *optimizerpb.VRPProblem) *validation.Error {
	shiftTeams := problem.GetDescription().GetShiftTeams()
	var err *validation.Error

	for _, st := range shiftTeams {
		lastStopIndex := len(st.GetRouteHistory().GetStops()) - 1
		for i, stop := range st.GetRouteHistory().GetStops() {
			if stop.ActualStartTimestampSec == nil {
				if i != lastStopIndex {
					err = &validation.Error{
						Name:        "enroute_stop_not_at_end_of_route_history",
						Msg:         "enroute stops must be at the end of route history",
						Recoverable: true,
						Fields: monitoring.Fields{
							shiftTeamSnapshotIDField: st.GetId(),
							visitSnapshotIDField:     stop.GetVisit().GetVisitId(),
							restBreakIDField:         stop.GetRestBreak().GetRestBreakId(),
						},
					}
					// Note that we don't actually "fix" things, we simply report on this data quirk.
					// with a "recoverable" error and move forward.
					// Note: ideally we can chain together multiple errors to know how many shift teams have this.
				}
			}
		}
	}
	return err
}

func (h routeHistoryValidator) validateAtMostOneEnRouteStop(problem *optimizerpb.VRPProblem) *validation.Error {
	shiftTeams := problem.GetDescription().GetShiftTeams()
	var err *validation.Error

	for _, st := range shiftTeams {
		var numberOfEnrouteStops int
		for _, stop := range st.GetRouteHistory().GetStops() {
			if stop.ActualStartTimestampSec == nil {
				numberOfEnrouteStops++
			}
			if numberOfEnrouteStops > 1 {
				err = &validation.Error{
					Name:        "too_many_enroute_stops_for_route_history",
					Msg:         "route history should have at most one enroute (current) stop",
					Recoverable: true,
					Fields: monitoring.Fields{
						shiftTeamSnapshotIDField: st.GetId(),
						visitSnapshotIDField:     stop.GetVisit().GetVisitId(),
						restBreakIDField:         stop.GetRestBreak().GetRestBreakId(),
					},
				}
			}
			// we also don't actually fix anything here -- just track it.
		}
	}
	return err
}

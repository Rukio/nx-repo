package logisticsdb

import (
	"testing"

	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

func empty() *optimizerpb.VRPShiftTeam {
	return &optimizerpb.VRPShiftTeam{}
}

func emptyRouteHistory() *optimizerpb.VRPShiftTeam {
	return &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{}}
}

func emptyUpcomingCommitments() *optimizerpb.VRPShiftTeam {
	return &optimizerpb.VRPShiftTeam{UpcomingCommitments: &optimizerpb.VRPShiftTeamCommitments{}}
}

func vrpProblem(shiftTeams ...*optimizerpb.VRPShiftTeam) *optimizerpb.VRPProblem {
	return &optimizerpb.VRPProblem{Description: &optimizerpb.VRPDescription{ShiftTeams: shiftTeams}}
}

func TestValidateAllShiftTeamsHaveRouteHistory(t *testing.T) {
	err := h.validateAllShiftTeamsHaveRouteHistory(vrpProblem(empty()))
	testutils.MustMatch(t, true, err != nil)
	testutils.MustMatch(t, true, err.Recoverable, "and should be recoverable")

	err = h.validateAllShiftTeamsHaveRouteHistory(vrpProblem(emptyRouteHistory()))
	testutils.MustMatch(t, false, err != nil)
}

func TestValidateAllShiftTeamsHaveUpcomingCommitments(t *testing.T) {
	err := h.validateAllShiftTeamsHaveUpcomingCommitments(vrpProblem(empty()))
	testutils.MustMatch(t, true, err != nil)
	testutils.MustMatch(t, true, err.Recoverable, "and should be recoverable")

	err = h.validateAllShiftTeamsHaveUpcomingCommitments(vrpProblem(emptyUpcomingCommitments()))
	testutils.MustMatch(t, false, err != nil)
}

func TestValidateCompletedStopsHaveArrivals(t *testing.T) {
	err := h.validateCompletedStopsHaveArrivals(vrpProblem(emptyRouteHistory()))
	testutils.MustMatch(t, false, err != nil, "no error for empty shift team")

	shiftTeam := &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
		Stops: []*optimizerpb.VRPShiftTeamRouteStop{
			{ActualCompletionTimestampSec: proto.Int64(10), ActualStartTimestampSec: nil},
		},
	}}
	err = h.validateCompletedStopsHaveArrivals(vrpProblem(shiftTeam))
	testutils.MustMatch(t, true, err != nil, "has error")
	testutils.MustMatch(t, true, shiftTeam.RouteHistory.Stops[0].ActualStartTimestampSec != nil, "data is filled forward")
	testutils.MustMatch(t, true, err.Recoverable, "and should be recoverable")
}

func TestValidateArrivalsAreBeforeCompletions(t *testing.T) {
	err := h.validateArrivalsAreBeforeCompletions(vrpProblem(emptyRouteHistory()))
	testutils.MustMatch(t, false, err != nil, "no error for empty shift team")

	shiftTeam := &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
		Stops: []*optimizerpb.VRPShiftTeamRouteStop{
			{ActualCompletionTimestampSec: proto.Int64(10), ActualStartTimestampSec: proto.Int64(20)},
		},
	}}
	err = h.validateArrivalsAreBeforeCompletions(vrpProblem(shiftTeam))
	testutils.MustMatch(t, true, err != nil, err.Error())
	testutils.MustMatch(t, proto.Int64(10), shiftTeam.RouteHistory.Stops[0].ActualStartTimestampSec, "data is filled forward")
	testutils.MustMatch(t, true, err.Recoverable, "and should be recoverable")
}

func TestValidateAtMostOneEnRouteStop(t *testing.T) {
	err := h.validateAtMostOneEnRouteStop(vrpProblem(emptyRouteHistory()))
	testutils.MustMatch(t, false, err != nil, "no error for empty shift team")

	shiftTeam := &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
		Stops: []*optimizerpb.VRPShiftTeamRouteStop{
			{ActualStartTimestampSec: nil},
			{ActualStartTimestampSec: nil},
		},
	}}
	err = h.validateAtMostOneEnRouteStop(vrpProblem(shiftTeam))
	testutils.MustMatch(t, true, err != nil, "should have an error")
	testutils.MustMatch(t, true, err.Recoverable, "and should be recoverable")
}

func TestValidateEnRouteStopMustBeAtEndOfRouteHistory(t *testing.T) {
	err := h.validateEnRouteStopMustBeAtEndOfRouteHistory(vrpProblem(emptyRouteHistory()))
	testutils.MustMatch(t, false, err != nil, "no error for empty shift team")
	shiftTeam := &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
		Stops: []*optimizerpb.VRPShiftTeamRouteStop{
			{ActualStartTimestampSec: proto.Int64(10)},
			{ActualStartTimestampSec: nil}, // at the end.
		},
	}}
	err = h.validateEnRouteStopMustBeAtEndOfRouteHistory(vrpProblem(shiftTeam))
	testutils.MustMatch(t, false, err != nil, "should not have an error at the end")

	shiftTeam = &optimizerpb.VRPShiftTeam{RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
		Stops: []*optimizerpb.VRPShiftTeamRouteStop{
			{ActualStartTimestampSec: nil}, // not at the end.
			{ActualStartTimestampSec: proto.Int64(10)},
		},
	}}
	err = h.validateEnRouteStopMustBeAtEndOfRouteHistory(vrpProblem(shiftTeam))
	testutils.MustMatch(t, true, err != nil, "should have an error")
	testutils.MustMatch(t, true, err.Recoverable, "and should be recoverable")
}

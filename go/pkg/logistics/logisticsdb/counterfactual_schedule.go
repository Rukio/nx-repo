package logisticsdb

import (
	"errors"
	"sync"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"google.golang.org/protobuf/proto"
)

type vrpShiftTeamsMap map[ShiftTeamSnapshotID]*optimizerpb.VRPShiftTeam
type vrpVisitsMap map[VisitSnapshotID]*optimizerpb.VRPVisit
type vrpLocationsMap map[int64]*optimizerpb.VRPLocation
type vrpRestBreaksMap map[int64]*optimizerpb.VRPRestBreak
type CounterfactualSchedule struct {
	CounterfactualSolution *optimizerpb.VRPSolution
	EntityMappings         EntityMappings
	ServiceDate            *common.Date

	scheduleOnce sync.Once
	schedule     *logisticspb.ServiceRegionDateSchedule
	err          error

	vrpShiftTeamsMap vrpShiftTeamsMap
	vrpVisitsMap     vrpVisitsMap
	vrpLocationsMap  vrpLocationsMap
	vrpRestBreaksMap vrpRestBreaksMap
}

func (s *CounterfactualSchedule) Schedule() (*ScheduleAndDebugScore, error) {
	if s.CounterfactualSolution == nil {
		return nil, errors.New("VRP Solution is nil")
	}

	s.scheduleOnce.Do(func() {
		s.initMaps()
		shiftTeamSchedules, err := s.shiftTeamSchedules()
		if err != nil {
			s.err = err
			return
		}
		s.schedule = &logisticspb.ServiceRegionDateSchedule{
			Schedules:          shiftTeamSchedules,
			UnassignableVisits: s.unassignedVisits(),
			Meta: &logisticspb.ScheduleMetadata{
				ServiceDate: s.ServiceDate,
			},
		}
	})

	return &ScheduleAndDebugScore{
		Schedule: s.schedule,
		Score:    s.CounterfactualSolution.GetScore(),
	}, s.err
}

func (s *CounterfactualSchedule) initMaps() {
	shiftTeams := s.CounterfactualSolution.Description.ShiftTeams
	shiftTeamsMap := make(vrpShiftTeamsMap, len(shiftTeams))
	for _, shiftTeam := range shiftTeams {
		shiftTeamsMap[ShiftTeamSnapshotID(*shiftTeam.Id)] = shiftTeam
	}
	s.vrpShiftTeamsMap = shiftTeamsMap

	visits := s.CounterfactualSolution.Description.Visits
	visitsMap := make(vrpVisitsMap, len(visits))
	for _, visit := range visits {
		visitsMap[VisitSnapshotID(*visit.Id)] = visit
	}
	s.vrpVisitsMap = visitsMap

	locations := s.CounterfactualSolution.Description.Locations
	locationsMap := make(vrpLocationsMap, len(locations))
	for _, location := range locations {
		locationsMap[*location.Id] = location
	}
	s.vrpLocationsMap = locationsMap

	restBreaks := s.CounterfactualSolution.Description.RestBreaks
	restBreaksMap := make(vrpRestBreaksMap, len(restBreaks))
	for _, restBreak := range restBreaks {
		restBreaksMap[*restBreak.Id] = restBreak
	}
	s.vrpRestBreaksMap = restBreaksMap
}

func (s *CounterfactualSchedule) shiftTeamSchedules() ([]*logisticspb.ShiftTeamSchedule, error) {
	var shiftTeamSchedules []*logisticspb.ShiftTeamSchedule
	for vrpShiftTeamID, vrpShiftTeam := range s.vrpShiftTeamsMap {
		shiftTeamID := s.EntityMappings.ShiftTeams[vrpShiftTeamID]
		shiftTeamRoute, err := s.shiftTeamRoute(vrpShiftTeam)
		if err != nil {
			return nil, err
		}

		shiftTeamSchedules = append(shiftTeamSchedules,
			&logisticspb.ShiftTeamSchedule{
				ShiftTeamId: shiftTeamID.Int64(),
				Route:       shiftTeamRoute,
			})
	}

	return shiftTeamSchedules, nil
}

func (s *CounterfactualSchedule) shiftTeamRoute(shiftTeam *optimizerpb.VRPShiftTeam) (*logisticspb.ShiftTeamRoute, error) {
	vrpStops := shiftTeam.Route.Stops
	stops := make([]*logisticspb.ShiftTeamRouteStop, len(vrpStops))

	for i, stop := range vrpStops {
		switch stop.GetStop().(type) {
		case *optimizerpb.VRPShiftTeamRouteStop_Visit:
			visit := stop.GetVisit()

			visitSnapshotID := VisitSnapshotID(visit.GetVisitId())
			careRequestID := s.EntityMappings.CareRequests[visitSnapshotID]
			vrpVisit := s.vrpVisitsMap[visitSnapshotID]
			location := s.vrpLocationsMap[*vrpVisit.LocationId]

			stops[i] = &logisticspb.ShiftTeamRouteStop{
				Stop: &logisticspb.ShiftTeamRouteStop_Visit{
					Visit: &logisticspb.ShiftTeamVisit{
						CareRequestId: proto.Int64(careRequestID.Int64()),
						Location: &common.Location{
							LatitudeE6:  *location.LatitudeE6,
							LongitudeE6: *location.LongitudeE6,
						},
						ArrivalTimestampSec: visit.ArrivalTimestampSec,
						// TODO(MARK-2528): Add acuity, completion timestamp and status
					},
				},
			}
		case *optimizerpb.VRPShiftTeamRouteStop_RestBreak:
			vrpRestBreak := stop.GetRestBreak()
			restBreak := s.vrpRestBreaksMap[*vrpRestBreak.RestBreakId]
			location := s.vrpLocationsMap[*restBreak.LocationId]

			stops[i] = &logisticspb.ShiftTeamRouteStop{
				Stop: &logisticspb.ShiftTeamRouteStop_RestBreak{
					RestBreak: &logisticspb.ShiftTeamRestBreak{
						RestBreakId:       *restBreak.Id,
						StartTimestampSec: restBreak.StartTimestampSec,
						DurationSec:       restBreak.DurationSec,
						Location: &common.Location{
							LatitudeE6:  *location.LatitudeE6,
							LongitudeE6: *location.LongitudeE6,
						},
					},
				},
			}
		default:
			return nil, errors.New("unhandled ShiftTeamRouteStop type")
		}
	}

	location := s.vrpLocationsMap[*shiftTeam.DepotLocationId]
	return &logisticspb.ShiftTeamRoute{
		Stops:                             stops,
		BaseLocationDepartureTimestampSec: shiftTeam.Route.DepotDepartureTimestampSec,
		BaseLocationArrivalTimestampSec:   shiftTeam.Route.DepotArrivalTimestampSec,
		BaseLocation: &common.Location{
			LatitudeE6:  *location.LatitudeE6,
			LongitudeE6: *location.LongitudeE6,
		},
	}, nil
}

func (s *CounterfactualSchedule) unassignedVisits() []*logisticspb.UnassignableVisit {
	vrpUnassignedVisits := s.CounterfactualSolution.Description.UnassignedVisits
	unassignedVisits := make([]*logisticspb.UnassignableVisit, len(vrpUnassignedVisits))
	for i, vrpUnassignedVisit := range vrpUnassignedVisits {
		visitID := VisitSnapshotID(*vrpUnassignedVisit.VisitId)
		careRequestID := s.EntityMappings.CareRequests[visitID]

		unassignedVisits[i] = &logisticspb.UnassignableVisit{
			CareRequestId: proto.Int64(careRequestID.Int64()),
		}
	}

	return unassignedVisits
}

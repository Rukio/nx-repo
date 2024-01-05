package demo

import (
	"context"
	"fmt"
	"math/rand"
	"time"

	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"google.golang.org/protobuf/proto"
)

type VRPMapService struct {
	logistics.MapService
	logistics.NearestWaypointMapService
}

type DescriptionConfig struct {
	ShiftTeamCount int
	ShiftDuration  time.Duration

	VisitCount                 int
	VisitArrivalWindowDuration time.Duration
	VisitServiceDuration       time.Duration

	SouthWestCorner logistics.LatLng
	NorthEastCorner logistics.LatLng

	MapService VRPMapService
}

func GenVRPDescription(ctx context.Context, c DescriptionConfig, randomSource *rand.Rand) (*optimizerpb.VRPDescription, error) {
	locCount := c.ShiftTeamCount + c.VisitCount

	latlngs, err := randLatLngsInBounds(
		ctx,
		c.SouthWestCorner,
		c.NorthEastCorner,
		locCount,
		randomSource,
		c.MapService.NearestWaypointMapService)
	if err != nil {
		return nil, fmt.Errorf("error generating locations, is OSRM running?: %w", err)
	}

	matrix, err := c.MapService.GetDistanceMatrix(ctx, nil, latlngs, latlngs)
	if err != nil {
		return nil, err
	}

	var vrpShiftTeams []*optimizerpb.VRPShiftTeam
	for i := 0; i < c.ShiftTeamCount; i++ {
		vrpShiftTeams = append(vrpShiftTeams, &optimizerpb.VRPShiftTeam{
			Id:              proto.Int64(int64(i + 1)),
			DepotLocationId: proto.Int64(int64(i + 1)),
			AvailableTimeWindow: &optimizerpb.VRPTimeWindow{
				StartTimestampSec: proto.Int64(0),
				EndTimestampSec:   proto.Int64(int64(c.ShiftDuration.Seconds())),
			},
			RouteHistory: &optimizerpb.VRPShiftTeamRouteHistory{
				CurrentPosition: &optimizerpb.VRPShiftTeamPosition{
					LocationId:        int64(i + 1),
					KnownTimestampSec: 0,
				},
			},
			UpcomingCommitments: &optimizerpb.VRPShiftTeamCommitments{},
		})
	}

	var vrpVisits []*optimizerpb.VRPVisit
	for i := 0; i < c.VisitCount; i++ {
		startTimestampSec := randomSource.Int63n(int64(c.ShiftDuration.Seconds() - c.VisitArrivalWindowDuration.Seconds()))
		endTimestampSec := startTimestampSec + int64(c.VisitArrivalWindowDuration.Seconds())
		vrpVisits = append(vrpVisits, &optimizerpb.VRPVisit{
			Id:         proto.Int64(int64(i + 1)),
			Acuity:     &optimizerpb.VRPVisitAcuity{Level: proto.Int64(logisticsdb.DefaultOptimizerAcuityLevel)},
			LocationId: proto.Int64(int64(c.ShiftTeamCount + i + 1)),
			ArrivalTimeWindow: &optimizerpb.VRPTimeWindow{
				StartTimestampSec: proto.Int64(startTimestampSec),
				EndTimestampSec:   proto.Int64(endTimestampSec),
			},
			ServiceDurationSec: proto.Int64(int64(c.VisitServiceDuration.Seconds())),
		})
	}

	var vrpLocs []*optimizerpb.VRPLocation
	distanceMatrix := &optimizerpb.VRPDistanceMatrix{}
	for i := 0; i < locCount; i++ {
		vrpLocs = append(vrpLocs, &optimizerpb.VRPLocation{
			Id:          proto.Int64(int64(i + 1)),
			LatitudeE6:  &latlngs[i].LatE6,
			LongitudeE6: &latlngs[i].LngE6,
		})
		for j := 0; j < locCount; j++ {
			distance := matrix[latlngs[i]][latlngs[j]]
			distanceMatrix.Distances = append(distanceMatrix.Distances, &optimizerpb.VRPDistance{
				FromLocationId: proto.Int64(int64(i + 1)),
				ToLocationId:   proto.Int64(int64(j + 1)),
				DurationSec:    proto.Int64(int64(distance.Duration.Seconds())),
				LengthMeters:   &distance.LengthMeters,
			})
		}
	}
	vrpDesc := optimizerpb.VRPDescription{
		ShiftTeams:     vrpShiftTeams,
		Visits:         vrpVisits,
		Locations:      vrpLocs,
		DistanceMatrix: distanceMatrix,
	}

	return &vrpDesc, nil
}

func randLatLngsInBounds(ctx context.Context, southWestCorner, northEastCorner logistics.LatLng, n int, randomSource *rand.Rand, mapService logistics.NearestWaypointMapService) ([]logistics.LatLng, error) {
	var latLngs []logistics.LatLng
	for i := 0; i < n; i++ {
		ll, err := randLatLngInBounds(ctx, southWestCorner, northEastCorner, randomSource, mapService)
		if err != nil {
			return nil, err
		}
		latLngs = append(latLngs, ll)
	}
	return latLngs, nil
}

func randLatLngInBounds(ctx context.Context, southWestCorner, northEastCorner logistics.LatLng, randomSource *rand.Rand, mapService logistics.NearestWaypointMapService) (logistics.LatLng, error) {
	latLng := logistics.LatLng{
		LatE6: southWestCorner.LatE6 + randomSource.Int31n(northEastCorner.LatE6-southWestCorner.LatE6),
		LngE6: southWestCorner.LngE6 + randomSource.Int31n(northEastCorner.LngE6-southWestCorner.LngE6),
	}

	if mapService == nil {
		return latLng, nil
	}

	newLatLng, err := mapService.GetNearestWaypoint(ctx, latLng)
	if err != nil {
		return logistics.LatLng{}, err
	}

	return *newLatLng, nil
}

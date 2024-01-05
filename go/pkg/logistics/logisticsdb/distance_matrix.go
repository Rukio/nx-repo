package logisticsdb

import (
	"context"
	"errors"
	"fmt"
	"math"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/collections"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"golang.org/x/sync/errgroup"
	"google.golang.org/protobuf/proto"
)

type buildDistanceMatrixReqsParams struct {
	routeHistoryPaths  []DistanceMatrixRequest
	tailLocationIDs    []int64
	planningStopLocIDs []int64
	depotLocIDs        []int64
}

// Ref: docs/architecture/logistics/distance_matrix.md.
func buildDistanceMatrixReqs(params buildDistanceMatrixReqsParams) []DistanceMatrixRequest {
	/*
	                              (A)        (B)             (D)               (E)
	                                              _________________________
	     ShiftTeam0  depot --------------->|     | planning stops that    |
	     ShiftTeam1  depot --------------->|     | can all move around +  |
	     ...                               | --> | connect to each other  |--------> Back to the set of depots
	     ShiftTeamN  depot --------------->|\    |________________________|     /
	                                         \_________________________________/
	                                                  (C)
	   (A) is the most complicated: A linear history of pinned segments for each shift team.  The tail of this
	   chain of segments can either connect to the set of planning stops (i.e. those that are not in any history yet),
	   or go straight back to the depot.
	*/
	return append(
		// (A) For each shift team: Route History linear distances
		params.routeHistoryPaths,
		// (B) Tail position sets of shift teams: Current Position / End of Route History -> Planning Stops:
		&RectDistancesReq{
			FromLocationIDs: params.tailLocationIDs,
			ToLocationIDs:   params.planningStopLocIDs},
		// (C) Tail position sets of shift teams, Current Position / End of Route History --> Depots.
		// NOTE: this could maybe be cleaned up to support the (currently non-existent) case where there are
		// multiple depots; as this approach computes extra distances in that case.
		&RectDistancesReq{
			FromLocationIDs: params.tailLocationIDs,
			ToLocationIDs:   params.depotLocIDs},
		// (D) Planning Stops -> Planning Stops:
		&RectDistancesReq{
			FromLocationIDs: params.planningStopLocIDs,
			ToLocationIDs:   params.planningStopLocIDs},
		// (E) Planning Visits -> Depots:
		&RectDistancesReq{
			FromLocationIDs: params.planningStopLocIDs,
			ToLocationIDs:   params.depotLocIDs},
		&RectDistancesReq{
			FromLocationIDs: params.depotLocIDs,
			ToLocationIDs:   params.depotLocIDs,
		},
	)
}

type DistanceMatrixMapsTags struct {
	ServiceRegionID int64
	ServiceDate     time.Time
}

type DistanceMatrixRequest interface {
	LocIDPairSet() *collections.LinkedSet[locIDPair]
	IsEmpty() bool
}

type MissingLocReq struct {
	DistanceMatrixRequest
}

type PathDistancesReq []int64

func (pdr PathDistancesReq) LocIDPairSet() *collections.LinkedSet[locIDPair] {
	if pdr.IsEmpty() {
		return collections.NewLinkedSet[locIDPair](0)
	}

	locIDPairSet := collections.NewLinkedSet[locIDPair](len(pdr) - 1)
	for i := 0; i < len(pdr)-1; i++ {
		locIDPairSet.Add(locIDPair{from: pdr[i], to: pdr[i+1]})
	}

	return locIDPairSet
}

func (pdr PathDistancesReq) IsEmpty() bool {
	return len(pdr) <= 1
}

func (pdr PathDistancesReq) LatLngs(mapper *latLngMapper) []logistics.LatLng {
	latLngs := make([]logistics.LatLng, len(pdr))
	for i, locID := range pdr {
		latLngs[i] = mapper.LatLng(locID)
	}

	return latLngs
}

type RectDistancesReq struct {
	FromLocationIDs []int64
	ToLocationIDs   []int64
}

func (rdr *RectDistancesReq) LocIDPairSet() *collections.LinkedSet[locIDPair] {
	locIDPairSet := collections.NewLinkedSet[locIDPair](len(rdr.FromLocationIDs) * len(rdr.ToLocationIDs))

	for _, fromLocID := range rdr.FromLocationIDs {
		for _, toLocID := range rdr.ToLocationIDs {
			locIDPairSet.Add(locIDPair{from: fromLocID, to: toLocID})
		}
	}

	return locIDPairSet
}

func (rdr *RectDistancesReq) IsEmpty() bool {
	return len(rdr.FromLocationIDs) == 0 || len(rdr.ToLocationIDs) == 0
}

func (rdr *RectDistancesReq) LatLngs(mapper *latLngMapper) ([]logistics.LatLng, []logistics.LatLng) {
	originLatLngs := make([]logistics.LatLng, len(rdr.FromLocationIDs))
	destLatLngs := make([]logistics.LatLng, len(rdr.ToLocationIDs))
	for i, locID := range rdr.FromLocationIDs {
		originLatLngs[i] = mapper.LatLng(locID)
	}
	for i, locID := range rdr.ToLocationIDs {
		destLatLngs[i] = mapper.LatLng(locID)
	}

	return originLatLngs, destLatLngs
}

type latLngMapper struct {
	locIDLatLngs map[int64]logistics.LatLng
	latLngLocIDs map[logistics.LatLng]int64
}

func newLatLngMapper(locs []*logisticssql.Location) *latLngMapper {
	locIDLatLngs := map[int64]logistics.LatLng{}
	latLngLocIDs := map[logistics.LatLng]int64{}
	for _, loc := range locs {
		latLng := logistics.LatLng{
			LatE6: loc.LatitudeE6,
			LngE6: loc.LongitudeE6,
		}
		locIDLatLngs[loc.ID] = latLng
		latLngLocIDs[latLng] = loc.ID
	}

	return &latLngMapper{
		locIDLatLngs: locIDLatLngs,
		latLngLocIDs: latLngLocIDs,
	}
}

func (m *latLngMapper) LocID(ll logistics.LatLng) int64 {
	return m.latLngLocIDs[ll]
}

func (m *latLngMapper) LatLng(locID int64) logistics.LatLng {
	return m.locIDLatLngs[locID]
}

type GetDistanceMatrixParams struct {
	Reqs           []DistanceMatrixRequest
	AfterCreatedAt time.Time

	// Primary map service
	MapService logistics.MapService
	// Other map services for best effort research
	ResearchMapServices []logistics.MapService

	MapsTags *DistanceMatrixMapsTags
	Settings optimizersettings.Settings
}

// GetDistanceMatrix computes a single (not-necessarily square) matrix composed of the results
// of all DistanceMatrixRequests. For example:
//
//	Let reqs = [
//	  {
//	     FromLocationIDs: [0]
//	     ToLocationIDs:   [1, 2]
//	  },
//	  {
//	     FromLocationIDs: [3, 4]
//	     ToLocationIDs:   [3, 4, 5]
//	  },
//	]
//	Then the result should have the following pairs in it:
//	   (0, 1);  (0, 2)  // from the 1st request
//	   (3, 3), (3, 4), (3, 5); // from the 2nd request, from=3
//	   (4, 3), (4, 4), (4, 5)  // from the 2nd request, from=4
func (ldb *LogisticsDB) GetDistanceMatrix(ctx context.Context, params GetDistanceMatrixParams) (*optimizerpb.VRPDistanceMatrix, *TimeWindow, error) {
	reqs := params.Reqs
	if allDistanceMatrixRequestsEmpty(reqs) {
		return &optimizerpb.VRPDistanceMatrix{}, &TimeWindow{}, nil
	}

	queries := ldb.queries

	reqWantLocIDPairSets := make([]*collections.LinkedSet[locIDPair], len(reqs))
	for i, req := range reqs {
		locIDPairSet := req.LocIDPairSet()
		reqWantLocIDPairSets[i] = locIDPairSet
	}
	wantLocIDPairSet := collections.NewLinkedSet[locIDPair](0)
	wantLocIDPairSet.AddSet(reqWantLocIDPairSets...)

	batchSize := ldb.QuerySettings.GetLatestDistancesForLocationsBatchSize
	if batchSize == 0 {
		batchSize = uint(wantLocIDPairSet.Size())
	}
	batches := int(math.Ceil(float64(wantLocIDPairSet.Size()) / float64(batchSize)))
	latestDistanceParams := make([]logisticssql.BatchGetLatestDistancesForLocationsParams, batches)

	for i := 0; i < batches; i++ {
		latestDistanceParams[i].AfterCreatedAt = params.AfterCreatedAt
		latestDistanceParams[i].FromLocationIds = make([]int64, 0, batchSize)
		latestDistanceParams[i].ToLocationIds = make([]int64, 0, batchSize)
		latestDistanceParams[i].SourceIds = make([]int64, 0, batchSize)
	}

	i := uint(0)
	batch := 0
	sourceID := params.MapService.GetDistanceSourceID()
	wantLocIDPairSet.Map(func(pair locIDPair) {
		latestDistanceParam := &latestDistanceParams[batch]
		latestDistanceParam.FromLocationIds = append(latestDistanceParam.FromLocationIds, pair.from)
		latestDistanceParam.ToLocationIds = append(latestDistanceParam.ToLocationIds, pair.to)
		latestDistanceParam.SourceIds = append(latestDistanceParam.SourceIds, sourceID)

		i++
		if i == batchSize {
			i = 0
			batch++
		}
	})

	distances, err := ldb.batchGetLatestDistancesForLocations(ctx, latestDistanceParams)
	if err != nil {
		return nil, nil, err
	}

	if len(distances) == wantLocIDPairSet.Size() {
		return distanceMatrixForDistances(distances), getDistanceTW(distances), nil
	}

	currentLocIDPairSet := collections.NewLinkedSet[locIDPair](len(distances))
	for _, d := range distances {
		currentLocIDPairSet.Add(locIDPair{d.FromLocationID, d.ToLocationID})
	}

	var allMissingLocReqs []MissingLocReq
	currAndRequestedLocIDPairs := currentLocIDPairSet.Clone()
	for i, req := range reqs {
		wantLocIDPairSet := reqWantLocIDPairSets[i]

		missingLocsReqs, err := missingLocIDPairs(wantLocIDPairSet, currAndRequestedLocIDPairs, req)
		if err != nil {
			return nil, nil, err
		}

		allMissingLocReqs = append(allMissingLocReqs, missingLocsReqs...)
		currAndRequestedLocIDPairs.AddSet(wantLocIDPairSet)
	}

	allLocIDs := collections.NewLinkedInt64Set(wantLocIDPairSet.Size())
	wantLocIDPairSet.Map(func(v locIDPair) {
		allLocIDs.Add(v.from, v.to)
	})
	allLocations, err := ldb.GetLocationsByIDs(ctx, allLocIDs.Elems())
	if err != nil {
		if errors.Is(err, ErrNotAllLocationIDsFound) {
			found := collections.NewLinkedInt64Set(len(allLocations))
			for _, l := range allLocations {
				found.Add(l.ID)
			}
			return nil, nil, fmt.Errorf("%w: found: %v, wanted: %v", err, found.Elems(), allLocIDs.Elems())
		}
		return nil, nil, err
	}

	mapper := newLatLngMapper(allLocations)
	err = ldb.addMissingDistances(ctx, queries, allMissingLocReqs, mapper, params)
	if err != nil {
		return nil, nil, err
	}

	distances, err = ldb.batchGetLatestDistancesForLocations(ctx, latestDistanceParams)
	if err != nil {
		return nil, nil, err
	}

	if len(distances) != wantLocIDPairSet.Size() {
		return nil, nil, fmt.Errorf("not enough distances, after adding missing distances: "+
			"service_region_id(%d), "+
			"num_distances(%d), "+
			"wanted(%d), "+
			"num_missing_loc_reqs(%d)",
			params.MapsTags.ServiceRegionID,
			len(distances),
			wantLocIDPairSet.Size(),
			len(allMissingLocReqs),
		)
	}

	return distanceMatrixForDistances(distances), getDistanceTW(distances), nil
}

// addMissingDistances queries the map service and writes to the DB for the all the missingLocationsReqs.
func (ldb *LogisticsDB) addMissingDistances(
	ctx context.Context,
	queries *logisticssql.Queries,
	missingLocationsReqs []MissingLocReq,
	mapper *latLngMapper,
	params GetDistanceMatrixParams) error {
	if len(missingLocationsReqs) == 0 {
		return nil
	}

	mapsTags := params.MapsTags

	tags := monitoring.Tags{
		serviceRegionTag: I64ToA(mapsTags.ServiceRegionID),
		serviceDateTag:   mapsTags.ServiceDate.Format(dateLayout),
	}

	fetch := func(ctx context.Context, req MissingLocReq, mapService logistics.MapService, tags monitoring.Tags) func() error {
		return func() error {
			var m logistics.DistanceMatrix
			var err error
			switch r := req.DistanceMatrixRequest.(type) {
			case *RectDistancesReq:
				origins, destinations := r.LatLngs(mapper)
				m, err = mapService.GetDistanceMatrix(ctx, tags, origins, destinations)

			case PathDistancesReq:
				path := r.LatLngs(mapper)
				m, err = mapService.GetPathDistanceMatrix(ctx, tags, path...)

			default:
				return fmt.Errorf("unhandled DistanceMatrixRequest type: %v", r)
			}

			if err != nil {
				return err
			}

			addDistancesParams := addDistancesParamsFromMatrix(m, mapper, mapService.GetDistanceSourceID())
			_, err = queries.AddDistances(ctx, addDistancesParams)

			return err
		}
	}

	eg, egCtx := errgroup.WithContext(ctx)
	for _, req := range missingLocationsReqs {
		req := req
		eg.Go(fetch(egCtx, req, params.MapService, tags))
	}

	fetchTimeoutMs := params.Settings.FetchOtherMapServiceDistancesTimeoutMs
	if len(params.ResearchMapServices) > 0 && fetchTimeoutMs > 0 {
		researchTags := tags.Clone()
		researchTags[distanceMatrixUseTag] = distancematrixUseTagResearch

		bestEffortCtx, bestEffortCancel := context.WithTimeout(context.Background(), time.Duration(fetchTimeoutMs)*time.Millisecond)
		bestEffortEG, bestEffortEGCtx := errgroup.WithContext(bestEffortCtx)
		for _, req := range missingLocationsReqs {
			req := req
			for _, mapService := range params.ResearchMapServices {
				//nolint: contextcheck
				bestEffortEG.Go(fetch(bestEffortEGCtx, req, mapService, researchTags))
			}
		}

		go func() {
			defer bestEffortCancel()

			_ = bestEffortEG.Wait()
		}()
	}

	err := eg.Wait()
	if err != nil {
		return err
	}

	return err
}

func addDistancesParamsFromMatrix(m logistics.DistanceMatrix, mapper *latLngMapper, sourceID int64) logisticssql.AddDistancesParams {
	var params logisticssql.AddDistancesParams
	for fromLatLng, toLatLngDistances := range m {
		fromLocID := mapper.LocID(logistics.LatLng{
			LatE6: fromLatLng.LatE6,
			LngE6: fromLatLng.LngE6,
		})
		for toLatLng, distance := range toLatLngDistances {
			toLocID := mapper.LocID(logistics.LatLng{
				LatE6: toLatLng.LatE6,
				LngE6: toLatLng.LngE6,
			})
			params.FromLocationIds = append(params.FromLocationIds, fromLocID)
			params.ToLocationIds = append(params.ToLocationIds, toLocID)
			params.DistancesMeters = append(params.DistancesMeters, int32(distance.LengthMeters))
			params.DurationsSeconds = append(params.DurationsSeconds, int32(distance.Duration.Seconds()))
			params.SourceIds = append(params.SourceIds, sourceID)
		}
	}

	return params
}

func allDistanceMatrixRequestsEmpty(ms []DistanceMatrixRequest) bool {
	for _, m := range ms {
		if !m.IsEmpty() {
			return false
		}
	}
	return true
}

// decomposeRectDistanceReq returns an decomposed list of MissingLocReqs that will cover the missingPairs.
func decomposeRectDistanceReq(
	missingPairs *collections.LinkedSet[locIDPair],
	hasLocIDPairSet collections.Set[locIDPair],
	srcReq *RectDistancesReq) ([]MissingLocReq, error) {
	// Example missing matrix (1 = missing, 0 = has, x = unknown)
	// F1 = From locID1, T1 = To locID1
	//    T1 2 3 4
	//   +--------
	// F1| 1 1 1 0
	//  2| 1 0 1 1
	//  3| 1 1 1 1
	//
	// 1. "Move/find" all full rank rows/columns to top/left, by counting occurences of each from/to locID.
	//    T1 3 2 4
	//   +--------
	// F3| 1 1 1 1
	//  1| 1 1 1 0
	//  2| 1 1 0 1
	//
	// 2. Decompose full rank rows/columns into 2 sub rectangles, and recursively work on leftover box.
	// fF=fullFrom, fT=fullTo, nfF=nonFullFrom, nfT=nonFullTo, .=recursive leftover box
	//
	//        fT   nfT
	//        ---- ----
	//        T1 3 2 4
	//       +-----------
	// fF  F3| a a a a
	// nfF  1| b b . .
	// nfF  2| b b . .
	//
	// => a[fullFrom, allTo] + b[nonFullFrom, fullTo] + recurse([nonFullFrom, nonFullTo])

	// 1. "Move/find" all full rank rows/columns to top/left, by counting occurences of each from/to locID.
	fromLocIDs := collections.NewLinkedInt64Set(missingPairs.Size())
	toLocIDs := collections.NewLinkedInt64Set(missingPairs.Size())
	fromLocIDCounts := map[int64]int{}
	toLocIDCounts := map[int64]int{}
	missingPairs.Map(func(pair locIDPair) {
		fromLocIDs.Add(pair.from)
		toLocIDs.Add(pair.to)

		fromLocIDCounts[pair.from]++
		toLocIDCounts[pair.to]++
	})

	var fullFromLocIDs, nonFullFromLocIDs []int64
	fromLocIDs.Map(func(locID int64) {
		if fromLocIDCounts[locID] == toLocIDs.Size() {
			fullFromLocIDs = append(fullFromLocIDs, locID)
		} else {
			nonFullFromLocIDs = append(nonFullFromLocIDs, locID)
		}
	})
	var fullToLocIDs, nonFullToLocIDs []int64
	toLocIDs.Map(func(locID int64) {
		if toLocIDCounts[locID] == fromLocIDs.Size() {
			fullToLocIDs = append(fullToLocIDs, locID)
		} else {
			nonFullToLocIDs = append(nonFullToLocIDs, locID)
		}
	})

	// 2. Decompose full rank rows/columns into 2 sub rectangles, and recursively work on leftover box.
	var reqs []MissingLocReq
	var reqSets collections.UnionSet[locIDPair]
	if len(fullFromLocIDs) > 0 {
		r := &RectDistancesReq{
			FromLocationIDs: fullFromLocIDs,
			ToLocationIDs:   toLocIDs.Elems(),
		}
		reqSets = append(reqSets, r.LocIDPairSet())
		reqs = append(reqs, MissingLocReq{DistanceMatrixRequest: r})
	}
	if len(fullToLocIDs) > 0 {
		if len(nonFullFromLocIDs) > 0 {
			r := &RectDistancesReq{
				FromLocationIDs: nonFullFromLocIDs,
				ToLocationIDs:   fullToLocIDs,
			}
			reqSets = append(reqSets, r.LocIDPairSet())
			reqs = append(reqs, MissingLocReq{DistanceMatrixRequest: r})
		}
	}

	if len(reqSets) > 0 {
		// Recursively find smaller requests.
		reqSets = append(reqSets, hasLocIDPairSet)
		wantLocIDPairSet := missingPairs
		newReqs, err := missingLocIDPairs(wantLocIDPairSet, reqSets, srcReq)
		if err != nil {
			return nil, err
		}

		return append(reqs, newReqs...), nil
	}

	return []MissingLocReq{
		{
			DistanceMatrixRequest: &RectDistancesReq{
				FromLocationIDs: fromLocIDs.Elems(),
				ToLocationIDs:   toLocIDs.Elems(),
			},
		},
	}, nil
}

func distanceMatrixForDistances(distancesForLocations []*logisticssql.BatchGetLatestDistancesForLocationsRow) *optimizerpb.VRPDistanceMatrix {
	seenDistances := collections.NewLinkedSet[locIDPair](len(distancesForLocations))
	var distances []*optimizerpb.VRPDistance
	for _, distanceForLocation := range distancesForLocations {
		key := locIDPair{
			from: distanceForLocation.FromLocationID,
			to:   distanceForLocation.ToLocationID,
		}
		if seenDistances.Has(key) {
			continue
		}
		seenDistances.Add(key)

		distances = append(distances, &optimizerpb.VRPDistance{
			FromLocationId: &key.from,
			ToLocationId:   &key.to,
			LengthMeters:   proto.Int64(int64(distanceForLocation.DistanceMeters)),
			DurationSec:    proto.Int64(int64(distanceForLocation.DurationSeconds)),
		})
	}

	return &optimizerpb.VRPDistanceMatrix{Distances: distances}
}

func missingLocIDPairs(
	wantLocIDPairSet *collections.LinkedSet[locIDPair],
	hasLocIDPairSet collections.Set[locIDPair],
	srcReq DistanceMatrixRequest) ([]MissingLocReq, error) {
	missingPairs := collections.NewLinkedSet[locIDPair](wantLocIDPairSet.Size())

	wantLocIDPairSet.Map(func(v locIDPair) {
		if !hasLocIDPairSet.Has(v) {
			missingPairs.Add(v)
		}
	})

	if missingPairs.Size() == 0 {
		return nil, nil
	}

	switch r := srcReq.(type) {
	case *RectDistancesReq:
		return decomposeRectDistanceReq(missingPairs, hasLocIDPairSet, r)

	case PathDistancesReq:
		return []MissingLocReq{{DistanceMatrixRequest: r}}, nil

	default:
		return nil, errors.New("unhandled type of DistanceMatrixRequest")
	}
}

func getDistanceTW(distances []*logisticssql.BatchGetLatestDistancesForLocationsRow) *TimeWindow {
	var distanceTW TimeWindow
	if len(distances) > 0 {
		for i, distance := range distances {
			if i == 0 {
				distanceTW.Start = distance.CreatedAt
				distanceTW.End = distance.CreatedAt
				continue
			}

			if distance.CreatedAt.Before(distanceTW.Start) {
				distanceTW.Start = distance.CreatedAt
			}
			if distance.CreatedAt.After(distanceTW.End) {
				distanceTW.End = distance.CreatedAt
			}
		}
	}
	return &distanceTW
}

package logisticsdb

import (
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestBuildDistanceMatrixReqs(t *testing.T) {
	routeHistoryPaths := PathDistancesReq{1, 2, 3, 4}
	tailLocationIDs := []int64{5, 6, 7, 8}
	planningStopLocIDs := []int64{9, 10, 11, 12}
	depotLocIDs := []int64{13, 14, 15, 16}

	fromTailToPlanningStopRectDistancesReq := &RectDistancesReq{
		FromLocationIDs: tailLocationIDs,
		ToLocationIDs:   planningStopLocIDs,
	}
	fromTailToDepotRectDistancesReq := &RectDistancesReq{
		FromLocationIDs: tailLocationIDs,
		ToLocationIDs:   depotLocIDs,
	}
	fromPlanningStopToPlanningStopRectDistancesReq := &RectDistancesReq{
		FromLocationIDs: planningStopLocIDs,
		ToLocationIDs:   planningStopLocIDs,
	}
	fromPlanningStopToDepotRectDistancesReq := &RectDistancesReq{
		FromLocationIDs: planningStopLocIDs,
		ToLocationIDs:   depotLocIDs,
	}
	fromDepotToDepotRectDistancesReq := &RectDistancesReq{
		FromLocationIDs: depotLocIDs,
		ToLocationIDs:   depotLocIDs,
	}

	tcs := []struct {
		desc string
		want []DistanceMatrixRequest
	}{
		{
			desc: "base case",
			want: []DistanceMatrixRequest{
				routeHistoryPaths,
				fromTailToPlanningStopRectDistancesReq,
				fromTailToDepotRectDistancesReq,
				fromPlanningStopToPlanningStopRectDistancesReq,
				fromPlanningStopToDepotRectDistancesReq,
				fromDepotToDepotRectDistancesReq,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := buildDistanceMatrixReqs(buildDistanceMatrixReqsParams{
				routeHistoryPaths:  []DistanceMatrixRequest{routeHistoryPaths},
				tailLocationIDs:    tailLocationIDs,
				planningStopLocIDs: planningStopLocIDs,
				depotLocIDs:        depotLocIDs,
			})

			testutils.MustMatch(t, tc.want, got)
		})
	}
}

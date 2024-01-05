package logistics

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestOSRM_DistanceMatrixURL(t *testing.T) {
	s := &OSRMService{
		Addr: "addr",
	}

	testutils.MustMatch(t, "3;4;5;6", s.indexesStr(3, 7))

	url := s.DistanceMatrixURL([]LatLng{NewLatLng(1, 2), NewLatLng(3, 4)}, []LatLng{NewLatLng(5, 6), NewLatLng(7, 8)})
	testutils.MustMatch(t, "addr/table/v1/driving/2.000000,1.000000;4.000000,3.000000;6.000000,5.000000;8.000000,7.000000?annotations=distance,duration&skip_waypoints=true&sources=0;1&destinations=2;3", url)
}

func TestOSRM_GetDistanceMatrix(t *testing.T) {
	ctx := context.Background()

	ll1 := NewLatLng(1, 2)
	ll2 := NewLatLng(3, 4)

	tcs := []struct {
		Desc         string
		Origins      []LatLng
		Destinations []LatLng
		OSRMResp     *osrmTableResp

		Want DistanceMatrix
	}{
		{
			Desc: "Nothing",
			Want: DistanceMatrix{},
		},
		{
			Desc:         "Single same origin/destination should have a 0 distance",
			Origins:      []LatLng{ll1},
			Destinations: []LatLng{ll1},

			Want: DistanceMatrix{
				ll1: map[LatLng]Distance{
					ll1: {},
				},
			},
		},
		{
			Desc:         "Different origin/destination should have exactly 1 response",
			Origins:      []LatLng{ll1},
			Destinations: []LatLng{ll2},
			OSRMResp: &osrmTableResp{
				Code: osrmOKCode,
				DurationsSec: [][]float64{{
					1,
				}},
				LengthsMeters: [][]float64{{
					2,
				}},
			},

			Want: DistanceMatrix{
				ll1: map[LatLng]Distance{
					ll2: {
						Duration:     1 * time.Second,
						LengthMeters: 2,
					},
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			mockOSRM := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				buf, _ := json.Marshal(tc.OSRMResp)
				w.Write(buf)
			}))
			defer mockOSRM.Close()

			s := *NewOSRMService(mockOSRM.URL, 1, &monitoring.NoopScope{})
			dm, err := s.GetDistanceMatrix(ctx, nil, tc.Origins, tc.Destinations)
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.Want, dm)
		})
	}
}

func TestOSRM_GetPathDistanceMatrix(t *testing.T) {
	ctx := context.Background()

	ll1 := NewLatLng(1, 2)
	ll2 := NewLatLng(3, 4)

	tcs := []struct {
		Desc     string
		Path     []LatLng
		OSRMCode string
		Legs     []osrmRouteLeg

		Want DistanceMatrix
	}{
		{
			Desc: "Nothing",
			Want: DistanceMatrix{},
		},
		{
			Desc: "1 elem",
			Path: []LatLng{ll1},
			Want: DistanceMatrix{},
		},
		{
			Desc:     "2 elem",
			Path:     []LatLng{ll1, ll2},
			OSRMCode: osrmOKCode,
			Legs: []osrmRouteLeg{
				{
					DistanceMeters: 1,
					DurationSec:    2,
				},
			},

			Want: DistanceMatrix{
				ll1: map[LatLng]Distance{
					ll2: {
						LengthMeters: 1,
						Duration:     2 * time.Second,
					},
				},
				ll2: {},
			},
		},
		{
			Desc:     "2 elem - same latlng 0's",
			Path:     []LatLng{ll1, ll1},
			OSRMCode: osrmOKCode,
			Legs: []osrmRouteLeg{
				{
					DistanceMeters: 1,
					DurationSec:    2,
				},
			},

			Want: DistanceMatrix{
				ll1: map[LatLng]Distance{
					ll1: {},
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			mockOSRM := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				buf, _ := json.Marshal(&osrmRouteResp{
					Code: tc.OSRMCode,
					Routes: []osrmRoute{
						{
							Legs: tc.Legs,
						},
					},
				})
				w.Write(buf)
			}))
			defer mockOSRM.Close()

			s := *NewOSRMService(mockOSRM.URL, 1, &monitoring.NoopScope{})
			dm, err := s.GetPathDistanceMatrix(ctx, nil, tc.Path...)
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.Want, dm)
		})
	}
}

func TestOSRM_GetDistanceSource(t *testing.T) {
	tcs := []struct {
		Desc             string
		DistanceSourceID int64
	}{
		{
			Desc:             "Base case",
			DistanceSourceID: 5,
		},
		{
			Desc: "Distance source ID not set",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := OSRMService{
				DistanceSourceID: tc.DistanceSourceID,
			}

			testutils.MustMatch(t, tc.DistanceSourceID, s.GetDistanceSourceID())
		})
	}
}

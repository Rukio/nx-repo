package logistics

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"cloud.google.com/go/maps/routing/apiv2/routingpb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/genproto/googleapis/type/latlng"
)

func TestMapServicePickerForRegion(t *testing.T) {
	validUseOSRMSettingService := &optimizersettings.MockSettingsService{RegionSettings: &optimizersettings.Settings{UseOSRMMapService: true}}
	validDoNotUseOSRMSettingService := &optimizersettings.MockSettingsService{RegionSettings: &optimizersettings.Settings{UseOSRMMapService: false}}
	invalidSettingService := &optimizersettings.MockSettingsService{ServiceRegionSettingsErr: errors.New("bad")}
	defaultMaps := &GoogleMapsService{
		DistanceSourceID: 123,
	}
	osrm := &OSRMService{
		DistanceSourceID: 456,
	}

	tcs := []struct {
		Desc   string
		Picker *MapServicePicker

		Want       MapService
		WantOthers []MapService

		HasErr bool
	}{
		{
			Desc:   "default maps when set and not overridden",
			Picker: NewMapServicePicker(osrm, defaultMaps, validDoNotUseOSRMSettingService),

			Want:       defaultMaps,
			WantOthers: []MapService{osrm},
		},
		{
			Desc:   "osrm maps when we want to use it",
			Picker: NewMapServicePicker(osrm, defaultMaps, validUseOSRMSettingService),

			Want:       osrm,
			WantOthers: []MapService{defaultMaps},
		},
		{
			Desc:   "osrm when default maps is not set even if we dont override to osrm",
			Picker: NewMapServicePicker(osrm, nil, validDoNotUseOSRMSettingService),
			Want:   osrm,
		},
		{
			Desc:   "settings error case for coverage",
			Picker: NewMapServicePicker(osrm, nil, invalidSettingService),
			HasErr: true,
		},
	}
	for _, tc := range tcs {
		tc := tc
		t.Run(tc.Desc, func(t *testing.T) {
			ms, err := tc.Picker.MapServiceForRegion(context.Background(), 1)
			testutils.MustMatch(t, tc.HasErr, err != nil)
			testutils.MustMatch(t, tc.Want, ms)

			oms, err := tc.Picker.OtherMapServicesForRegion(context.Background(), 1)
			testutils.MustMatch(t, tc.HasErr, err != nil)
			testutils.MustMatch(t, tc.WantOthers, oms)
		})
	}
}

func TestMapServicePickerRealTimeTrafficMapService(t *testing.T) {
	defaultMaps := &GoogleMapsService{}
	osrm := &OSRMService{}

	tcs := []struct {
		Desc                            string
		UseGoogleMapsForRealTimeTraffic bool

		Want MapService
	}{
		{
			Desc:                            "overwrite option is turned off",
			UseGoogleMapsForRealTimeTraffic: false,
			Want:                            osrm,
		},
		{
			Desc:                            "overwrite option is turned on",
			UseGoogleMapsForRealTimeTraffic: true,
			Want:                            defaultMaps,
		},
	}

	ctx := context.Background()
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			picker := NewMapServicePicker(osrm, defaultMaps, &optimizersettings.MockSettingsService{
				RegionSettings: &optimizersettings.Settings{
					UseOSRMMapService:               true,
					UseGoogleMapsForRealTimeTraffic: tc.UseGoogleMapsForRealTimeTraffic,
				},
			})
			mapService, err := picker.RealTimeTrafficMapService(ctx, 1)
			if err != nil {
				t.Fatal(err)
			}
			testutils.MustMatch(t, tc.Want, mapService)
		})
	}
}

func latLngHash(lls ...LatLng) int64 {
	var s int32

	for _, ll := range lls {
		s += 31 * (ll.LatE6)
		s += 31 * (s + ll.LngE6)
	}

	return int64(s)
}

func GenDistanceMatrix(origins, destinations []LatLng) DistanceMatrix {
	matrix := DistanceMatrix{}
	for _, fromLL := range origins {
		distances := map[LatLng]Distance{}
		for _, toLL := range destinations {
			distances[toLL] = Distance{
				Duration:     time.Duration(latLngHash(fromLL, toLL)) * time.Second,
				LengthMeters: latLngHash(toLL, fromLL),
			}
		}
		matrix[fromLL] = distances
	}

	return matrix
}

func TestWithEnforceDiagonalDistancesAreZero(t *testing.T) {
	var nilMap DistanceMatrix
	testutils.MustMatch(t, DistanceMatrix(nil), nilMap.withEnforceDiagonalDistancesAreZero())

	a := LatLng{LatE6: 0, LngE6: 0}
	b := LatLng{LatE6: 0, LngE6: 1}
	distance0 := Distance{}
	distance1 := Distance{
		Duration:     1,
		LengthMeters: 1,
	}
	twoByTwo := DistanceMatrix{
		a: map[LatLng]Distance{a: distance1, b: distance1},
		b: map[LatLng]Distance{a: distance1, b: distance1},
	}

	testutils.MustMatch(t, DistanceMatrix{
		a: map[LatLng]Distance{a: distance0, b: distance1},
		b: map[LatLng]Distance{a: distance1, b: distance0},
	}, twoByTwo.withEnforceDiagonalDistancesAreZero())
}

func TestDistanceMatrixRequest_ComputeRouteMatrixRequest(t *testing.T) {
	dmr := &DistanceMatrixRequest{
		Origins:      latLngList{NewLatLng(1, 2)},
		Destinations: latLngList{NewLatLng(3, 4)},
		RouteModifiers: &routingpb.RouteModifiers{
			AvoidTolls: true,
		},
		RoutingPreference: routingpb.RoutingPreference_TRAFFIC_AWARE_OPTIMAL,
	}

	testutils.MustMatch(t, &routingpb.ComputeRouteMatrixRequest{
		Origins: []*routingpb.RouteMatrixOrigin{
			{
				Waypoint: &routingpb.Waypoint{
					LocationType: &routingpb.Waypoint_Location{
						Location: &routingpb.Location{
							LatLng: &latlng.LatLng{
								Latitude:  1,
								Longitude: 2,
							},
						},
					},
				},
				RouteModifiers: &routingpb.RouteModifiers{
					AvoidTolls: true,
				},
			},
		},
		Destinations: []*routingpb.RouteMatrixDestination{
			{
				Waypoint: &routingpb.Waypoint{
					LocationType: &routingpb.Waypoint_Location{
						Location: &routingpb.Location{
							LatLng: &latlng.LatLng{
								Latitude:  3,
								Longitude: 4,
							},
						},
					},
				},
			},
		},
		TravelMode:        routingpb.RouteTravelMode_DRIVE,
		RoutingPreference: routingpb.RoutingPreference_TRAFFIC_AWARE_OPTIMAL,
	}, dmr.ComputeRouteMatrixRequest())
}

func TestDistanceMatrixRequest_Size(t *testing.T) {
	req := &DistanceMatrixRequest{
		Origins:      latLngList{{}, {}, {}},
		Destinations: latLngList{{}, {}},
	}
	want := 6
	got := req.Size()
	testutils.MustMatch(t, want, got)
}

func TestDistanceMatrixList_Merge(t *testing.T) {
	ll1 := LatLng{1, 1}
	ll2 := LatLng{2, 2}
	ll3 := LatLng{3, 3}
	dm1 := GenDistanceMatrix([]LatLng{ll1}, []LatLng{ll2})
	tcs := []struct {
		Desc string
		List []DistanceMatrix

		Expected DistanceMatrix
	}{
		{
			Desc:     "empty",
			Expected: DistanceMatrix{},
		},
		{
			Desc:     "1 matrix",
			List:     []DistanceMatrix{dm1},
			Expected: dm1,
		},
		{
			Desc:     "2 same matrix",
			List:     []DistanceMatrix{dm1, dm1},
			Expected: dm1,
		},
		{
			Desc: "2 different matrix, same origin",
			List: []DistanceMatrix{
				GenDistanceMatrix([]LatLng{ll1}, []LatLng{ll2}),
				GenDistanceMatrix([]LatLng{ll1}, []LatLng{ll3}),
			},
			Expected: GenDistanceMatrix([]LatLng{ll1}, []LatLng{ll2, ll3}),
		},
		{
			Desc: "2 different matrix, same destination",
			List: []DistanceMatrix{
				GenDistanceMatrix([]LatLng{ll1}, []LatLng{ll3}),
				GenDistanceMatrix([]LatLng{ll2}, []LatLng{ll3}),
			},
			Expected: GenDistanceMatrix([]LatLng{ll1, ll2}, []LatLng{ll3}),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			m := DistanceMatrixList(tc.List).Merge()
			testutils.MustMatch(t, tc.Expected, m)
		})
	}
}

type MockMonitoringScope struct {
	StatusTag       string
	ErrorValue      string
	MeasurementName string
}

func (m *MockMonitoringScope) WritePoint(name string, t monitoring.Tags, f monitoring.Fields) {
	m.StatusTag = t[statusTag]
	m.ErrorValue = fmt.Sprintf("%v", f[errorField])
	m.MeasurementName = name
}

func (m *MockMonitoringScope) With(name string, t monitoring.Tags, f monitoring.Fields) monitoring.Scope {
	return m
}
func TestSendMonitoring(t *testing.T) {
	tcs := []struct {
		Desc string
		Want MockMonitoringScope
	}{
		{
			Desc: "Status success",
			Want: MockMonitoringScope{
				StatusTag:       statusTagSuccess,
				MeasurementName: "awesone metric",
			},
		},
		{
			Desc: "Status with error",
			Want: MockMonitoringScope{
				StatusTag:       statusTagError,
				MeasurementName: "another metric",
				ErrorValue:      "something happened",
			},
		},
	}

	for _, tc := range tcs {
		scope := tc.Want
		var err error
		if len(scope.ErrorValue) > 0 {
			err = errors.New(scope.ErrorValue)
		}
		params := &SendMonitoringParams{
			Scope:           &scope,
			StartTime:       time.Now(),
			ErrorPtr:        &err,
			MeasurementName: scope.MeasurementName,
		}
		SendMonitoring(params)
		testutils.MustMatch(t, tc.Want, scope)
	}
}

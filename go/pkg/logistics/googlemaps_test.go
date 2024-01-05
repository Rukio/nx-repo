package logistics

import (
	"context"
	"encoding/json"
	"errors"
	"io"
	"math/rand"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"cloud.google.com/go/maps/routing/apiv2/routingpb"
	"github.com/*company-data-covered*/services/go/pkg/collections"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/genproto/googleapis/rpc/code"
	"google.golang.org/genproto/googleapis/rpc/status"
	"google.golang.org/genproto/googleapis/type/latlng"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
	"google.golang.org/protobuf/reflect/protoreflect"
	"google.golang.org/protobuf/types/known/durationpb"
	"googlemaps.github.io/maps"
)

type MockMapsClient struct {
	DistanceMatrixError error
	DirectionsErr       error
	Routes              []maps.Route
}

func (m *MockMapsClient) okResponseElement(_, _ string) *maps.DistanceMatrixElement {
	// TODO(for better testing): come up with a cute way to map origin and destination
	// to return better, non-identical durations.
	return &maps.DistanceMatrixElement{
		Status:            googleMapsOKStatus,
		Duration:          time.Minute,
		DurationInTraffic: time.Minute,
		Distance:          maps.Distance{Meters: 10},
	}
}

func (m *MockMapsClient) Directions(context.Context, *maps.DirectionsRequest) ([]maps.Route, []maps.GeocodedWaypoint, error) {
	return m.Routes, nil, m.DirectionsErr
}

func (m *MockMapsClient) DistanceMatrix(_ context.Context, req *maps.DistanceMatrixRequest) (*maps.DistanceMatrixResponse, error) {
	if m.DistanceMatrixError != nil {
		return nil, m.DistanceMatrixError
	}

	var rows []maps.DistanceMatrixElementsRow
	for _, o := range req.Origins {
		var elements []*maps.DistanceMatrixElement
		for _, d := range req.Destinations {
			elements = append(elements, m.okResponseElement(o, d))
		}
		rows = append(rows, maps.DistanceMatrixElementsRow{Elements: elements})
	}
	return &maps.DistanceMatrixResponse{Rows: rows}, nil
}

func TestGoogleMapsService_GetDistanceMatrix(t *testing.T) {
	influxRecorder, influxServer, err := newTestInfluxRecorder(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer influxServer.Close()

	s := GoogleMapsService{
		Limits: GoogleMapsStandardAPILimits,
		RoutesAPIClient: &RoutesAPIAdapter{
			Client: &MockMapsClient{},
		},
		MatrixThrottler: NewThrottler(0, 0, GoogleMapsLimits{}, MatrixThrottlerErrors),
		ScopedMetrics:   influxRecorder.With("test", make(monitoring.Tags), make(monitoring.Fields)),
	}
	ll1, ll2, ll3, ll4 := LatLng{1, 1}, LatLng{2, 2}, LatLng{3, 3}, LatLng{4, 4}
	lls := []LatLng{ll1, ll2, ll3, ll4}

	resp, err := s.GetDistanceMatrix(context.Background(), monitoring.Tags{}, lls, lls)
	if err != nil {
		t.Fatal(err)
	}
	// and we should get a 4x4 matrix back (note: this should really test that the distances show up in the right place..)
	testutils.MustMatch(t, 4, len(resp))
	for o, destinations := range resp {
		testutils.MustMatch(t, 4, len(destinations))
		for d, v := range destinations {
			if o == d {
				// the identity distance should be coerced to 0.
				testutils.MustMatch(t, Distance{Duration: 0, LengthMeters: 0}, v)
			} else {
				testutils.MustMatch(t, Distance{Duration: time.Minute, LengthMeters: 10}, v)
			}
		}
	}

	s.RoutesAPIClient = &RoutesAPIAdapter{
		Client: &MockMapsClient{
			DistanceMatrixError: errors.New("should fail"),
		},
	}
	_, err = s.GetDistanceMatrix(context.Background(), monitoring.Tags{}, lls, lls)
	if err == nil {
		t.Fatal("error should be returned")
	}
}

type mockPathDistanceMatrixClient struct {
	matrix DistanceMatrix
}

func (c *mockPathDistanceMatrixClient) PathDistanceMatrix(ctx context.Context, req *PathDistanceMatrixRequest) (DistanceMatrix, error) {
	return c.matrix, nil
}

func TestGoogleMapsService_GetPathDistanceMatrix(t *testing.T) {
	influxRecorder, influxServer, err := newTestInfluxRecorder(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer influxServer.Close()

	ll1, ll2 := LatLng{1, 1}, LatLng{2, 2}
	lls := []LatLng{ll1, ll2}

	matrix := GenDistanceMatrix([]LatLng{ll1}, []LatLng{ll2})

	s := GoogleMapsService{
		Limits: GoogleMapsLimits{
			maxRouteWaypoints: 2,
		},

		RouteThrottler: NewThrottler(0, 0, GoogleMapsLimits{}, RouteThrottlerErrors),
		PathDistanceMatrixClient: &mockPathDistanceMatrixClient{
			matrix: matrix,
		},
		ScopedMetrics: influxRecorder.With("test", make(monitoring.Tags), make(monitoring.Fields)),
	}
	resp, err := s.GetPathDistanceMatrix(context.Background(), monitoring.Tags{}, lls...)
	if err != nil {
		t.Fatal(err)
	}

	testutils.MustMatch(t, matrix, resp)
}

func TestGoogleMapsService_PathDistanceMatrixReqs(t *testing.T) {
	ll1, ll2, ll3, ll4 := LatLng{1, 2}, LatLng{3, 4}, LatLng{5, 6}, LatLng{7, 8}
	tcs := []struct {
		Desc  string
		Path  latLngList
		Limit int

		Expected []*PathDistanceMatrixRequest
	}{
		{
			Desc:  "base case",
			Path:  latLngList{ll1, ll2},
			Limit: 2,

			Expected: []*PathDistanceMatrixRequest{
				{
					Path: []LatLng{ll1, ll2},
				},
			},
		},
		{
			Desc:  "2 reqs",
			Path:  latLngList{ll1, ll2, ll3},
			Limit: 2,

			Expected: []*PathDistanceMatrixRequest{
				{
					Path: []LatLng{ll1, ll2},
				},
				{
					Path: []LatLng{ll2, ll3},
				},
			},
		},
		{
			Desc:  "2 reqs, non-even",
			Path:  latLngList{ll1, ll2, ll3, ll4},
			Limit: 3,

			Expected: []*PathDistanceMatrixRequest{
				{
					Path: []LatLng{ll1, ll2, ll3},
				},
				{
					Path: []LatLng{ll3, ll4},
				},
			},
		},
		{
			Desc:  "2 reqs, non-even",
			Path:  latLngList{ll1, ll2, ll3, ll4},
			Limit: 3,

			Expected: []*PathDistanceMatrixRequest{
				{
					Path: []LatLng{ll1, ll2, ll3},
				},
				{
					Path: []LatLng{ll3, ll4},
				},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := GoogleMapsService{
				Limits: GoogleMapsLimits{
					maxRouteWaypoints: tc.Limit,
				},
			}

			reqs := s.PathDistanceMatrixReqs(tc.Path...)

			testutils.MustMatch(t, tc.Expected, reqs)
		})
	}
}

type MockRoutesAPIAdapter struct {
	Routes  []*Route
	DMatrix DistanceMatrix
}

func (m *MockRoutesAPIAdapter) Directions(_ context.Context, req *DirectionsRequest) ([]*Route, error) {
	return m.Routes, nil
}

func (m *MockRoutesAPIAdapter) DistanceMatrix(_ context.Context, req *DistanceMatrixRequest) (DistanceMatrix, error) {
	return m.DMatrix, nil
}

func TestGoogleMapsService_GetRoute(t *testing.T) {
	influxRecorder, influxServer, err := newTestInfluxRecorder(context.Background())
	if err != nil {
		t.Fatal(err)
	}
	defer influxServer.Close()

	poly := RoutePolyline{NewLatLng(1, 1), NewLatLng(2, 2)}

	s := GoogleMapsService{
		Limits:          GoogleMapsStandardAPILimits,
		MatrixThrottler: NewThrottler(0, 0, GoogleMapsLimits{}, MatrixThrottlerErrors),
		RoutesAPIClient: &MockRoutesAPIAdapter{
			Routes: []*Route{
				{
					Distance: Distance{
						Duration:     3 * time.Second,
						LengthMeters: 30,
					},
					Polyline: poly,
				},
			},
		},
		ScopedMetrics: influxRecorder.With("test", make(monitoring.Tags), make(monitoring.Fields)),
	}

	want := &Route{
		Polyline: RoutePolyline{
			NewLatLng(1, 1),
			NewLatLng(2, 2),
		},
		Distance: Distance{
			LengthMeters: 30,
			Duration:     3 * time.Second,
		},
	}

	got, err := s.GetRoute(context.Background(), monitoring.Tags{}, LatLng{}, LatLng{})

	testutils.MustMatch(t, nil, err)
	testutils.MustMatch(t, want, got)
}

func TestGoogleMapsRoutesAPIAdapter_Directions(t *testing.T) {
	numPoints := 10
	mapsLatLngs := make([]maps.LatLng, 0, numPoints)
	latLngs := make([]LatLng, 0, numPoints)
	mapsLegs := make([]*maps.Leg, 0, numPoints)
	legs := make(Legs, 0, numPoints)
	for i := 1; i <= numPoints; i++ {
		mapsLatLngs = append(mapsLatLngs, maps.LatLng{Lat: float64(i), Lng: float64(i)})
		latLngs = append(latLngs, NewLatLng(float64(i), float64(i)))
		mapsLegs = append(mapsLegs, &maps.Leg{
			Distance: maps.Distance{Meters: i},
			Duration: time.Duration(i * int(time.Second)),
		})
		legs = append(legs, &Distance{
			Duration:     time.Duration(i * int(time.Second)),
			LengthMeters: int64(i),
		})
	}
	adapter := &RoutesAPIAdapter{
		Client: &MockMapsClient{
			Routes: []maps.Route{
				{
					Legs:             mapsLegs,
					OverviewPolyline: maps.Polyline{Points: maps.Encode(mapsLatLngs)},
				},
			},
		},
	}
	req := &DirectionsRequest{
		Origin:        latLngs[0],
		Destination:   latLngs[len(latLngs)-1],
		Intermediates: latLngs[1 : len(latLngs)-2],
	}

	got, err := adapter.Directions(context.Background(), req)
	if err != nil {
		t.Fatal(err)
	}
	expectedSum := numPoints * (numPoints + 1) / 2
	want := []*Route{
		{
			Distance: Distance{
				Duration:     time.Duration(expectedSum * int(time.Second)),
				LengthMeters: int64(expectedSum),
			},
			Polyline: latLngs,
			Legs:     legs,
		},
	}
	testutils.MustMatch(t, got, want)
}

func generateDirectionsRequest(numPoints int) DirectionsRequest {
	latLngs := make([]LatLng, 0, numPoints)
	for i := 0; i < numPoints; i++ {
		latLngs = append(latLngs, NewLatLng(float64(i), float64(i)))
	}
	return DirectionsRequest{
		Origin:        latLngs[0],
		Destination:   latLngs[len(latLngs)-1],
		Intermediates: latLngs[1 : len(latLngs)-2],
	}
}

func TestGoogleMapsDirectionsRequest_DirectionsAPIRequest(t *testing.T) {
	numPoints := 13
	req := generateDirectionsRequest(numPoints)

	got := req.DirectionsAPIRequest()
	want := &maps.DirectionsRequest{
		Origin:      req.Origin.GoogleMapsCoordinate(),
		Destination: req.Destination.GoogleMapsCoordinate(),
		Waypoints:   req.Intermediates.GoogleMapsCoordinates(),
		Units:       maps.UnitsMetric,
	}
	testutils.MustMatch(t, got, want)
}

func TestGoogleMapsDirectionsRequest_ComputeRoutesRequest(t *testing.T) {
	numPoints := 13
	req := generateDirectionsRequest(numPoints)

	got := req.ComputeRoutesRequest()
	want := &routingpb.ComputeRoutesRequest{
		Origin:                   req.Origin.GoogleMapsRoutesWaypoint(),
		Destination:              req.Destination.GoogleMapsRoutesWaypoint(),
		Intermediates:            req.Intermediates.GoogleMapsRoutesWaypoints(),
		Units:                    routingpb.Units_METRIC,
		TravelMode:               routingpb.RouteTravelMode_DRIVE,
		ComputeAlternativeRoutes: false,
	}
	testutils.MustMatch(t, got, want)
}

func TestGoogleMapsDistanceMatrixRequests(t *testing.T) {
	ll1, ll2, ll3 := LatLng{}, LatLng{}, LatLng{}

	tcs := []struct {
		Desc    string
		Limits  GoogleMapsLimits
		LatLngs []LatLng

		ExpectedTiles []MatrixTile
	}{
		{
			Desc: "2x2 fits perfectly in 4 max elements",
			Limits: GoogleMapsLimits{
				maxDistanceMatrixElems: 4,
			},
			LatLngs: []LatLng{ll1, ll2},
			ExpectedTiles: []MatrixTile{
				{IOffset: 0, JOffset: 0},
			},
		},
		{
			Desc: "3x3 doesn't fit perfectly with 4 max elements",
			Limits: GoogleMapsLimits{
				maxDistanceMatrixElems: 4,
			},
			LatLngs: []LatLng{ll1, ll2, ll3},
			ExpectedTiles: []MatrixTile{
				{IOffset: 0, JOffset: 0},
				{IOffset: 0, JOffset: 2},
				{IOffset: 2, JOffset: 0},
				{IOffset: 2, JOffset: 2},
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := GoogleMapsService{
				Limits: tc.Limits,
			}

			reqs := s.DistanceMatrixRequests(tc.LatLngs, tc.LatLngs)
			var tiles []MatrixTile
			for _, r := range reqs {
				tiles = append(tiles, r.Tile)
			}
			testutils.MustMatch(t, tiles, tc.ExpectedTiles)
		})
	}
}

func TestGoogleMapsRouteReq(t *testing.T) {
	ll1 := LatLng{}
	ll2 := LatLng{}

	tcs := []struct {
		Desc    string
		Limits  GoogleMapsLimits
		LatLngs []LatLng

		HasErr bool
	}{
		{
			Desc: "Base case",
			Limits: GoogleMapsLimits{
				maxRouteWaypoints: 2,
			},
			LatLngs: []LatLng{ll1, ll2},
		},
		{
			Desc: "Not enough waypoints",
			Limits: GoogleMapsLimits{
				maxRouteWaypoints: 2,
			},
			LatLngs: []LatLng{ll1},

			HasErr: true,
		},
		{
			Desc: "Too many waypoints",
			Limits: GoogleMapsLimits{
				maxRouteWaypoints: 1,
			},
			LatLngs: []LatLng{ll1, ll2},

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := GoogleMapsService{
				Limits: tc.Limits,
			}

			_, err := s.RouteReq(tc.LatLngs...)
			if (err != nil) != tc.HasErr {
				t.Fatalf("hasErr: %v, tc: %+v", err, tc)
			}
		})
	}
}

func TestDistanceMatrixThrottler_Wait(t *testing.T) {
	tcs := []struct {
		desc                       string
		elementsPerRequestRequired int
		requestsRequired           int
		requestsLimit              int
		elementsLimit              int

		hasErr bool
	}{
		{
			desc:                       "request 2 elements in 1 req - limits: 3 elements, 1 req",
			elementsPerRequestRequired: 2,
			requestsRequired:           1,
			elementsLimit:              3,
			requestsLimit:              1,

			hasErr: false,
		},
		{
			desc:                       "request 3 elements in 1 req, limits: 3 element, 1 req",
			elementsPerRequestRequired: 3,
			requestsRequired:           1,
			elementsLimit:              3,
			requestsLimit:              1,

			hasErr: false,
		},
		{
			desc:                       "request 4 elements in 1 req, limits: 3 elements, 1 req",
			elementsPerRequestRequired: 4,
			requestsRequired:           1,
			elementsLimit:              3,
			requestsLimit:              1,

			hasErr: true,
		},
		{
			desc:                       "request 2 elements in 2 reqs, limits: 4 elements, 2 req",
			elementsPerRequestRequired: 2,
			requestsRequired:           2,
			elementsLimit:              4,
			requestsLimit:              2,

			hasErr: false,
		},
		{
			desc:                       "request 3 elements in 2 reqs, limits: 4 elements, 2 req",
			elementsPerRequestRequired: 3,
			requestsRequired:           2,
			elementsLimit:              4,
			requestsLimit:              2,

			hasErr: true,
		},
		{
			desc:                       "request limit exceeded",
			elementsPerRequestRequired: 1,
			requestsRequired:           2,
			elementsLimit:              40,
			requestsLimit:              1,

			hasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			matrixThrottler := NewThrottler(tc.requestsLimit, tc.elementsLimit, GoogleMapsLimits{maxDistanceMatrixElems: tc.elementsLimit}, MatrixThrottlerErrors)

			ctx, cancel := context.WithTimeout(context.Background(), time.Millisecond)
			defer cancel()

			var err error
			for i := 0; i < tc.requestsRequired; i++ {
				err = matrixThrottler.Wait(ctx, tc.elementsPerRequestRequired)
				if err != nil {
					break
				}
			}
			testutils.MustMatch(t, tc.hasErr, err != nil)
		})
	}
}

func TestGoogleMaps_GetDistanceSource(t *testing.T) {
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
			s := GoogleMapsService{
				DistanceSourceID: tc.DistanceSourceID,
			}

			testutils.MustMatch(t, tc.DistanceSourceID, s.GetDistanceSourceID())
		})
	}
}

func newTestInfluxRecorder(ctx context.Context) (*monitoring.InfluxRecorder, *httptest.Server, error) {
	influxServer := testutils.MockInfluxServer()

	influxRecorder, err := monitoring.NewInfluxRecorder(
		ctx,
		&monitoring.InfluxEnv{
			URL:          influxServer.URL,
			DatabaseName: "test",
		},
		"testPrefix",
		zap.NewNop().Sugar(),
	)

	return influxRecorder, influxServer, err
}

func mustMarshal(v any) []byte {
	buf, _ := json.Marshal(v)
	return buf
}

func mustProtoMarshal(v protoreflect.ProtoMessage) []byte {
	buf, _ := protojson.Marshal(v)
	return buf
}

type mockRoutesGRPCServer struct {
	grpc.ClientStream

	i     int
	elems []*routingpb.RouteMatrixElement

	ComputeRoutesResp *routingpb.ComputeRoutesResponse
}

func (c *mockRoutesGRPCServer) ComputeRoutes(ctx context.Context, in *routingpb.ComputeRoutesRequest, opts ...grpc.CallOption) (*routingpb.ComputeRoutesResponse, error) {
	return c.ComputeRoutesResp, nil
}
func (c *mockRoutesGRPCServer) ComputeRouteMatrix(ctx context.Context, in *routingpb.ComputeRouteMatrixRequest, opts ...grpc.CallOption) (routingpb.Routes_ComputeRouteMatrixClient, error) {
	return c, nil
}
func (c *mockRoutesGRPCServer) Recv() (*routingpb.RouteMatrixElement, error) {
	var e *routingpb.RouteMatrixElement
	var err error
	if c.i < len(c.elems) {
		e = c.elems[c.i]
	} else {
		err = io.EOF
	}

	c.i++

	return e, err
}

func TestRoutesAPIClients_DistanceMatrix(t *testing.T) {
	ctx := context.Background()

	tcs := []struct {
		Desc     string
		Req      *DistanceMatrixRequest
		RespJSON *httpRoutesAPIRespJSON

		Want   DistanceMatrix
		HasErr bool
	}{
		{
			Desc: "base case",
			Req: &DistanceMatrixRequest{
				Origins: latLngList{
					LatLng{1, 2},
				},
				Destinations: latLngList{
					LatLng{3, 4},
				},
			},
			RespJSON: &httpRoutesAPIRespJSON{
				elems: []*routingpb.RouteMatrixElement{
					{
						OriginIndex:      proto.Int32(0),
						DestinationIndex: proto.Int32(0),
						DistanceMeters:   123,
						Duration: &durationpb.Duration{
							Seconds: 456,
						},
						Condition: routingpb.RouteMatrixElementCondition_ROUTE_EXISTS,
					},
				},
			},
			Want: DistanceMatrix{
				LatLng{1, 2}: map[LatLng]Distance{
					{3, 4}: {
						LengthMeters: 123,
						Duration:     456 * time.Second,
					},
				},
			},
		},
		{
			Desc: "bad condition",
			Req: &DistanceMatrixRequest{
				Origins: latLngList{
					LatLng{1, 2},
				},
				Destinations: latLngList{
					LatLng{3, 4},
				},
			},
			RespJSON: &httpRoutesAPIRespJSON{
				elems: []*routingpb.RouteMatrixElement{
					{
						OriginIndex:      proto.Int32(0),
						DestinationIndex: proto.Int32(0),
						DistanceMeters:   123,
						Duration: &durationpb.Duration{
							Seconds: 456,
						},
						Condition: routingpb.RouteMatrixElementCondition_ROUTE_NOT_FOUND,
					},
				},
			},
			HasErr: true,
		},
		{
			Desc: "bad status",
			Req: &DistanceMatrixRequest{
				Origins: latLngList{
					LatLng{1, 2},
				},
				Destinations: latLngList{
					LatLng{3, 4},
				},
			},
			RespJSON: &httpRoutesAPIRespJSON{
				elems: []*routingpb.RouteMatrixElement{
					{
						OriginIndex:      proto.Int32(0),
						DestinationIndex: proto.Int32(0),
						DistanceMeters:   123,
						Duration: &durationpb.Duration{
							Seconds: 456,
						},
						Status: &status.Status{
							Code: int32(code.Code_ABORTED),
						},
						Condition: routingpb.RouteMatrixElementCondition_ROUTE_EXISTS,
					},
				},
			},
			HasErr: true,
		},
		{
			Desc: "bad origin index",
			Req: &DistanceMatrixRequest{
				Origins: latLngList{
					LatLng{1, 2},
				},
				Destinations: latLngList{
					LatLng{3, 4},
				},
			},
			RespJSON: &httpRoutesAPIRespJSON{
				elems: []*routingpb.RouteMatrixElement{
					{
						OriginIndex:      proto.Int32(1),
						DestinationIndex: proto.Int32(0),
						Condition:        routingpb.RouteMatrixElementCondition_ROUTE_EXISTS,
					},
				},
			},

			HasErr: true,
		},
		{
			Desc: "bad destination index",
			Req: &DistanceMatrixRequest{
				Origins: latLngList{
					LatLng{1, 2},
				},
				Destinations: latLngList{
					LatLng{3, 4},
				},
			},
			RespJSON: &httpRoutesAPIRespJSON{
				elems: []*routingpb.RouteMatrixElement{
					{
						OriginIndex:      proto.Int32(0),
						DestinationIndex: proto.Int32(1),
						Condition:        routingpb.RouteMatrixElementCondition_ROUTE_EXISTS,
					},
				},
			},

			HasErr: true,
		},
	}

	apiKeyPicker := NewAPIKeyPicker(nil, nil)
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write(mustMarshal(tc.RespJSON))
			}))

			c := &HTTPRoutesAPIClient{
				matrixURL: s.URL,
				apiKeys:   apiKeyPicker,
			}
			m, err := c.DistanceMatrix(ctx, tc.Req)
			if tc.HasErr != (err != nil) {
				t.Fatal(tc, err)
			}

			testutils.MustMatch(t, tc.Want, m)

			rc := &mockRoutesGRPCServer{
				elems: tc.RespJSON.elems,
			}
			grpcClient := &GRPCRoutesAPIClient{
				client:  rc,
				APIKeys: apiKeyPicker,
			}
			m, err = grpcClient.DistanceMatrix(ctx, tc.Req)
			if tc.HasErr != (err != nil) {
				t.Fatal(tc, err)
			}

			testutils.MustMatch(t, tc.Want, m)
		})
	}
}

// https://developers.google.com/maps/documentation/routes/reference/rpc/google.maps.routing.v2#google.maps.routing.v2.ComputeRoutesResponse
type computeRoutesRespPolyline struct {
	EncodedPolyline string `json:"encoded_polyline"`
}
type computeRoutesRespRoute struct {
	DistanceMeters int32                     `json:"distance_meters"`
	Duration       string                    `json:"duration"`
	Polyline       computeRoutesRespPolyline `json:"polyline"`
}
type computeRoutesResp struct {
	Routes []computeRoutesRespRoute `json:"routes"`
}

func TestRoutesAPIClient_Directions(t *testing.T) {
	numPoints := 10
	points := make([]maps.LatLng, 0, numPoints)
	latLngs := make([]LatLng, 0, numPoints)
	for i := 0; i < numPoints; i++ {
		points = append(points, maps.LatLng{Lat: float64(i), Lng: float64(i)})
		latLngs = append(latLngs, NewLatLng(float64(i), float64(i)))
	}

	httpServer := httptest.NewServer(http.HandlerFunc(func(writer http.ResponseWriter, req *http.Request) {
		writer.Write(mustMarshal(
			computeRoutesResp{
				Routes: []computeRoutesRespRoute{
					{
						Duration:       "100s",
						DistanceMeters: 123,
						Polyline: computeRoutesRespPolyline{
							EncodedPolyline: maps.Encode(points),
						},
					},
				},
			},
		))
	}))
	apiKeyPicker := NewAPIKeyPicker(nil, nil)
	client := &HTTPRoutesAPIClient{
		apiKeys:  apiKeyPicker,
		routeURL: httpServer.URL,
	}

	req := generateDirectionsRequest(numPoints)
	got, err := client.Directions(context.Background(), &req)
	if err != nil {
		t.Fatal(err)
	}
	want := []*Route{
		{
			Distance: Distance{
				Duration:     100 * time.Second,
				LengthMeters: 123,
			},
			Polyline: RoutePolyline(latLngs),
			Legs:     Legs{},
		},
	}
	testutils.MustMatch(t, got, want)
}

func TestGRPCRoutesAPIClient_Directions(t *testing.T) {
	numPoints := 10
	points := make([]maps.LatLng, 0, numPoints)
	latLngs := make([]LatLng, 0, numPoints)
	for i := 0; i < numPoints; i++ {
		points = append(points, maps.LatLng{Lat: float64(i), Lng: float64(i)})
		latLngs = append(latLngs, NewLatLng(float64(i), float64(i)))
	}

	rc := &mockRoutesGRPCServer{
		ComputeRoutesResp: &routingpb.ComputeRoutesResponse{
			Routes: []*routingpb.Route{
				{
					Duration:       durationpb.New(100 * time.Second),
					DistanceMeters: 123,
					Polyline: &routingpb.Polyline{
						PolylineType: &routingpb.Polyline_EncodedPolyline{
							EncodedPolyline: maps.Encode(points),
						},
					},
				},
			},
		},
	}
	apiKeyPicker := NewAPIKeyPicker(nil, nil)
	grpcClient := GRPCRoutesAPIClient{
		client:  rc,
		APIKeys: apiKeyPicker,
	}

	req := generateDirectionsRequest(numPoints)
	got, err := grpcClient.Directions(context.Background(), &req)
	if err != nil {
		t.Fatal(err)
	}
	want := []*Route{
		{
			Distance: Distance{
				Duration:     100 * time.Second,
				LengthMeters: 123,
			},
			Polyline: RoutePolyline(latLngs),
			Legs:     Legs{},
		},
	}
	testutils.MustMatch(t, got, want)
}

func TestPathDistanceMatrix(t *testing.T) {
	ctx := context.Background()

	tcs := []struct {
		Desc string
		Req  *PathDistanceMatrixRequest
		Resp *routingpb.ComputeRoutesResponse

		Want   DistanceMatrix
		HasErr bool
	}{
		{
			Desc: "base case",
			Req: &PathDistanceMatrixRequest{
				Path: latLngList{{1, 2}, {3, 4}},
			},
			Resp: &routingpb.ComputeRoutesResponse{
				Routes: []*routingpb.Route{
					{
						Legs: []*routingpb.RouteLeg{
							{
								DistanceMeters: *proto.Int32(123),
								Duration:       durationpb.New(456 * time.Second),
								StaticDuration: durationpb.New(789 * time.Second),
							},
						},
					},
				},
			},
			Want: DistanceMatrix{
				{1, 2}: map[LatLng]Distance{
					{3, 4}: {
						LengthMeters: 123,
						Duration:     456 * time.Second,
					},
				},
			},
		},
		{
			Desc: "zeros for diagonals",
			Req: &PathDistanceMatrixRequest{
				Path: latLngList{{1, 2}, {1, 2}, {3, 4}},
			},
			Resp: &routingpb.ComputeRoutesResponse{
				Routes: []*routingpb.Route{
					{
						Legs: []*routingpb.RouteLeg{
							{
								DistanceMeters: *proto.Int32(123),
								Duration:       durationpb.New(456 * time.Second),
								StaticDuration: durationpb.New(789 * time.Second),
							},
							{
								DistanceMeters: *proto.Int32(123),
								Duration:       durationpb.New(456 * time.Second),
								StaticDuration: durationpb.New(789 * time.Second),
							},
						},
					},
				},
			},
			Want: DistanceMatrix{
				{1, 2}: map[LatLng]Distance{
					{1, 2}: {
						LengthMeters: 0,
						Duration:     0,
					},
					{3, 4}: {
						LengthMeters: 123,
						Duration:     456 * time.Second,
					},
				},
			},
		},
		{
			Desc: "no route",
			Req: &PathDistanceMatrixRequest{
				Path: latLngList{{1, 2}, {3, 4}},
			},
			Resp: &routingpb.ComputeRoutesResponse{
				Routes: nil,
			},
			HasErr: true,
		},
		{
			Desc: "wrong number of legs",
			Req: &PathDistanceMatrixRequest{
				Path: latLngList{{1, 2}, {3, 4}},
			},
			Resp: &routingpb.ComputeRoutesResponse{
				Routes: []*routingpb.Route{
					{
						Legs: []*routingpb.RouteLeg{
							{
								DistanceMeters: *proto.Int32(123),
								Duration:       durationpb.New(456 * time.Second),
								StaticDuration: durationpb.New(789 * time.Second),
							},
							{
								DistanceMeters: *proto.Int32(123),
								Duration:       durationpb.New(456 * time.Second),
								StaticDuration: durationpb.New(789 * time.Second),
							},
						},
					},
				},
			},
			HasErr: true,
		},
	}

	apiKeys := NewAPIKeyPicker(nil, nil)
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			s := httptest.NewServer(http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
				w.Write(mustProtoMarshal(tc.Resp))
			}))

			c := &HTTPRoutesAPIClient{
				routeURL: s.URL,
				apiKeys:  apiKeys,
			}
			m, err := c.PathDistanceMatrix(ctx, tc.Req)
			if tc.HasErr != (err != nil) {
				t.Fatal(tc, err)
			}

			testutils.MustMatch(t, tc.Want, m)

			rc := &mockRoutesGRPCServer{
				ComputeRoutesResp: tc.Resp,
			}
			grpcClient := &GRPCRoutesAPIClient{
				client:  rc,
				APIKeys: apiKeys,
			}
			m, err = grpcClient.PathDistanceMatrix(ctx, tc.Req)
			if tc.HasErr != (err != nil) {
				t.Fatal(tc, err)
			}

			testutils.MustMatch(t, tc.Want, m)

			var gmapsV1Legs []*maps.Leg
			if len(tc.Resp.Routes) == 1 {
				for _, leg := range tc.Resp.Routes[0].Legs {
					gmapsV1Legs = append(gmapsV1Legs, &maps.Leg{
						Distance: maps.Distance{
							Meters: int(leg.DistanceMeters),
						},
						Duration: leg.GetDuration().AsDuration(),
					})
				}
			}

			gc := &GoogleMapsService{
				Limits: GoogleMapsLimits{
					maxRouteWaypoints: 10,
				},
				RoutesAPIClient: &RoutesAPIAdapter{
					Client: &MockMapsClient{
						Routes: []maps.Route{
							{
								Legs: gmapsV1Legs,
							},
						},
					},
				},
			}
			m, err = gc.PathDistanceMatrix(ctx, tc.Req)
			if tc.HasErr != (err != nil) {
				t.Fatal(tc, err)
			}
			testutils.MustMatch(t, tc.Want, m)
		})
	}
}

func TestUnmarshal_httpRoutesAPIRespJSON(t *testing.T) {
	buf := []byte(`[{
		"originIndex": 1,
		"destinationIndex": 1,
		"status": {},
		"duration": "0s",
		"condition": "ROUTE_EXISTS"
	}
	,
	{
		"originIndex": 1,
		"destinationIndex": 2,
		"status": {},
		"distanceMeters": 9113,
		"duration": "822s",
		"condition": "ROUTE_EXISTS"
	}
	,
	{
		"originIndex": 2,
		"destinationIndex": 0,
		"status": {},
		"distanceMeters": 31344,
		"duration": "2006s",
		"condition": "ROUTE_EXISTS"
	}
	,
	{
		"originIndex": 0,
		"destinationIndex": 2,
		"status": {},
		"distanceMeters": 31052,
		"duration": "1486s",
		"condition": "ROUTE_EXISTS"
	}
	,
	{
		"originIndex": 0,
		"destinationIndex": 1,
		"status": {},
		"distanceMeters": 29301,
		"duration": "2353s",
		"condition": "ROUTE_EXISTS"
	}
	,
	{
		"originIndex": 2,
		"destinationIndex": 2,
		"status": {},
		"duration": "0s",
		"condition": "ROUTE_EXISTS"
	}
	,
	{
		"originIndex": 0,
		"destinationIndex": 0,
		"status": {},
		"duration": "0s",
		"condition": "ROUTE_EXISTS"
	}
	,
	{
		"originIndex": 2,
		"destinationIndex": 1,
		"status": {},
		"distanceMeters": 8989,
		"duration": "912s",
		"condition": "ROUTE_EXISTS"
	}
	,
	{
		"originIndex": 1,
		"destinationIndex": 0,
		"status": {},
		"distanceMeters": 29012,
		"duration": "2539s",
		"condition": "ROUTE_EXISTS"
	}
	]`)

	var d httpRoutesAPIRespJSON
	err := json.Unmarshal(buf, &d)
	if err != nil {
		t.Fatal(err)
	}

	expected := []*routingpb.RouteMatrixElement{
		{
			OriginIndex:      proto.Int32(1),
			DestinationIndex: proto.Int32(1),
			Status:           &status.Status{},
			Duration:         durationpb.New(0),
			Condition:        routingpb.RouteMatrixElementCondition_ROUTE_EXISTS,
		},
		{
			OriginIndex:      proto.Int32(1),
			DestinationIndex: proto.Int32(2),
			Status:           &status.Status{},
			Duration:         durationpb.New(822 * time.Second),
			DistanceMeters:   9113,
			Condition:        routingpb.RouteMatrixElementCondition_ROUTE_EXISTS,
		},
		{
			OriginIndex:      proto.Int32(2),
			DestinationIndex: proto.Int32(0),
			Status:           &status.Status{},
			Duration:         durationpb.New(2006 * time.Second),
			DistanceMeters:   31344,
			Condition:        routingpb.RouteMatrixElementCondition_ROUTE_EXISTS,
		},
		{
			OriginIndex:      proto.Int32(0),
			DestinationIndex: proto.Int32(2),
			Status:           &status.Status{},
			Duration:         durationpb.New(1486 * time.Second),
			DistanceMeters:   31052,
			Condition:        routingpb.RouteMatrixElementCondition_ROUTE_EXISTS,
		},
		{
			OriginIndex:      proto.Int32(0),
			DestinationIndex: proto.Int32(1),
			Status:           &status.Status{},
			Duration:         durationpb.New(2353 * time.Second),
			DistanceMeters:   29301,
			Condition:        routingpb.RouteMatrixElementCondition_ROUTE_EXISTS,
		},
		{
			OriginIndex:      proto.Int32(2),
			DestinationIndex: proto.Int32(2),
			Status:           &status.Status{},
			Duration:         durationpb.New(0),
			Condition:        routingpb.RouteMatrixElementCondition_ROUTE_EXISTS,
		},
		{
			OriginIndex:      proto.Int32(0),
			DestinationIndex: proto.Int32(0),
			Status:           &status.Status{},
			Duration:         durationpb.New(0),
			Condition:        routingpb.RouteMatrixElementCondition_ROUTE_EXISTS,
		},
		{
			OriginIndex:      proto.Int32(2),
			DestinationIndex: proto.Int32(1),
			Status:           &status.Status{},
			Duration:         durationpb.New(912 * time.Second),
			DistanceMeters:   8989,
			Condition:        routingpb.RouteMatrixElementCondition_ROUTE_EXISTS,
		},
		{
			OriginIndex:      proto.Int32(1),
			DestinationIndex: proto.Int32(0),
			Status:           &status.Status{},
			Duration:         durationpb.New(2539 * time.Second),
			DistanceMeters:   29012,
			Condition:        routingpb.RouteMatrixElementCondition_ROUTE_EXISTS,
		},
	}

	// TODO: Make into testutils.MustMatchProtoList generic function if we have many usages of proto lists comparisons.
	testutils.MustMatch(t, len(expected), len(d.elems))
	for i, elem := range expected {
		testutils.MustMatchProto(t, elem, d.elems[i])
	}
}

func TestPathDistanceMatrixRequest_ComputeRoutesRequest(t *testing.T) {
	dmr := &PathDistanceMatrixRequest{
		Path: latLngList{},
	}

	testutils.MustMatch(t, &routingpb.ComputeRoutesRequest{
		Units:      routingpb.Units_METRIC,
		TravelMode: routingpb.RouteTravelMode_DRIVE,
	}, dmr.ComputeRoutesRequest())

	dmr = &PathDistanceMatrixRequest{
		Path: latLngList{
			NewLatLng(1, 2),
			NewLatLng(3, 4),
			NewLatLng(5, 6),
			NewLatLng(7, 8),
		},
		RouteModifiers: &routingpb.RouteModifiers{
			AvoidTolls: true,
		},
		RoutingPreference: routingpb.RoutingPreference_TRAFFIC_AWARE_OPTIMAL,
	}

	testutils.MustMatch(t, &routingpb.ComputeRoutesRequest{
		Origin: &routingpb.Waypoint{
			LocationType: &routingpb.Waypoint_Location{
				Location: &routingpb.Location{
					LatLng: &latlng.LatLng{
						Latitude:  1,
						Longitude: 2,
					},
				},
			},
		},
		Intermediates: []*routingpb.Waypoint{
			{
				LocationType: &routingpb.Waypoint_Location{
					Location: &routingpb.Location{
						LatLng: &latlng.LatLng{
							Latitude:  3,
							Longitude: 4,
						},
					},
				},
				VehicleStopover: true,
			},
			{
				LocationType: &routingpb.Waypoint_Location{
					Location: &routingpb.Location{
						LatLng: &latlng.LatLng{
							Latitude:  5,
							Longitude: 6,
						},
					},
				},
				VehicleStopover: true,
			},
		},
		Destination: &routingpb.Waypoint{
			LocationType: &routingpb.Waypoint_Location{
				Location: &routingpb.Location{
					LatLng: &latlng.LatLng{
						Latitude:  7,
						Longitude: 8,
					},
				},
			},
		},

		Units:             routingpb.Units_METRIC,
		TravelMode:        routingpb.RouteTravelMode_DRIVE,
		RoutingPreference: routingpb.RoutingPreference_TRAFFIC_AWARE_OPTIMAL,
		RouteModifiers: &routingpb.RouteModifiers{
			AvoidTolls: true,
		},
	}, dmr.ComputeRoutesRequest())
}

func TestAPIKeyPicker(t *testing.T) {
	tcs := []struct {
		Desc  string
		Keys  []string
		Calls int

		ExpectedSet []string
	}{
		{
			Desc:  "base case, single key",
			Keys:  []string{"1"},
			Calls: 10,

			ExpectedSet: []string{"1"},
		},
		{
			Desc:  "no keys, always empty",
			Keys:  []string{},
			Calls: 10,

			ExpectedSet: []string{""},
		},
		{
			Desc:  "2 keys, has all elements",
			Keys:  []string{"1", "2"},
			Calls: 10,

			ExpectedSet: []string{"1", "2"},
		},
		{
			Desc:  "3 keys, has all elements",
			Keys:  []string{"1", "2", "3"},
			Calls: 10,

			ExpectedSet: []string{"1", "2", "3"},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			fixedSeedRand := rand.New(rand.NewSource(0))
			p := NewAPIKeyPicker(tc.Keys, fixedSeedRand)

			set := collections.NewLinkedSet[string](tc.Calls)
			for i := 0; i < tc.Calls; i++ {
				set.Add(p.nextAPIKey())
			}

			expected := collections.NewLinkedSet[string](len(tc.ExpectedSet))
			expected.Add(tc.ExpectedSet...)

			testutils.MustMatch(t, expected.Size(), set.Size())
			testutils.MustMatch(t, true, expected.Has(set.Elems()...))
		})
	}
}

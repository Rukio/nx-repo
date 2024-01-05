package logistics

import (
	"bytes"
	"context"
	"crypto/tls"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"log"
	"math"
	"math/rand"
	"net/http"
	"sync"
	"time"

	"cloud.google.com/go/maps/routing/apiv2/routingpb"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"google.golang.org/genproto/googleapis/rpc/code"
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials"
	"google.golang.org/grpc/metadata"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/reflect/protoreflect"

	"golang.org/x/sync/errgroup"
	"golang.org/x/time/rate"
	"googlemaps.github.io/maps"
)

const (
	routesAPIGRPCAddr       = "routes.googleapis.com:443"
	routesAPIMatrixHTTPAddr = "https://routes.googleapis.com/distanceMatrix/v2:computeRouteMatrix"
	routesAPIRouteHTTPAddr  = "https://routes.googleapis.com/directions/v2:computeRoutes"

	distanceMatrixFieldMask     = "originIndex,destinationIndex,duration,distanceMeters,status,condition"
	pathDistanceMatrixFieldMask = "routes.legs.startLocation,routes.legs.endLocation,routes.legs.distanceMeters,routes.legs.duration,routes.legs.staticDuration"
	directionsFieldMask         = "routes.distanceMeters,routes.duration,routes.polyline.encodedPolyline,routes.legs.distanceMeters,routes.legs.duration"

	googleAPIKeyHeader    = "X-Goog-Api-Key"
	googleFieldmaskHeader = "X-Goog-Fieldmask"
)

var (
	ErrGoogleMapsMatrixRequestRateLimitExceeded  = errors.New("google maps matrix request rate limit exceeded")
	ErrGoogleMapsMatrixElementsRateLimitExceeded = errors.New("google maps matrix elements rate limit exceeded")
	ErrGoogleMapsRouteRequestRateLimitExceeded   = errors.New("google maps route request rate limit exceeded")
	ErrGoogleMapsRouteElementsRateLimitExceeded  = errors.New("google maps route elements rate limit exceeded")
)

type MapsClient interface {
	Directions(context.Context, *maps.DirectionsRequest) ([]maps.Route, []maps.GeocodedWaypoint, error)
	DistanceMatrix(context.Context, *maps.DistanceMatrixRequest) (*maps.DistanceMatrixResponse, error)
}

type MapsRoutesAPIClient interface {
	Directions(context.Context, *DirectionsRequest) ([]*Route, error)
	DistanceMatrix(context.Context, *DistanceMatrixRequest) (DistanceMatrix, error)
}

type PathDistanceMatrixClient interface {
	PathDistanceMatrix(context.Context, *PathDistanceMatrixRequest) (DistanceMatrix, error)
}

type PathDistanceMatrixRequest struct {
	Path latLngList

	RouteModifiers    *routingpb.RouteModifiers
	RoutingPreference routingpb.RoutingPreference
}

func (r *PathDistanceMatrixRequest) ComputeRoutesRequest() *routingpb.ComputeRoutesRequest {
	return &routingpb.ComputeRoutesRequest{
		Origin:                   r.Path.FirstWaypoint(),
		Destination:              r.Path.LastWaypoint(),
		Intermediates:            r.Path.IntermediateWaypoints(),
		TravelMode:               routingpb.RouteTravelMode_DRIVE,
		ComputeAlternativeRoutes: false,
		RouteModifiers:           r.RouteModifiers,
		RoutingPreference:        r.RoutingPreference,
		Units:                    routingpb.Units_METRIC,
	}
}

// APIKeyPicker is a source of Google Maps API keys.
type APIKeyPicker struct {
	keys          []string
	randKeySource *rand.Rand
	mx            sync.RWMutex

	numKeys int
}

func NewAPIKeyPicker(keys []string, randKeySource *rand.Rand) *APIKeyPicker {
	return &APIKeyPicker{
		keys:          keys,
		randKeySource: randKeySource,
		numKeys:       len(keys),
	}
}

func (kp *APIKeyPicker) nextAPIKey() string {
	if kp.numKeys == 0 {
		return ""
	}

	kp.mx.RLock()
	defer kp.mx.RUnlock()
	idx := kp.randKeySource.Intn(kp.numKeys)
	return kp.keys[idx]
}

type GoogleMapsService struct {
	Client                   MapsClient
	RoutesAPIClient          MapsRoutesAPIClient
	PathDistanceMatrixClient PathDistanceMatrixClient
	DistanceSourceID         int64

	Limits          GoogleMapsLimits
	MatrixThrottler *Throttler
	RouteThrottler  *Throttler
	ScopedMetrics   monitoring.Scope
}

// https://developers.google.com/maps/documentation/directions/usage-and-billing
type GoogleMapsLimits struct {
	maxRouteWaypoints      int
	maxDistanceMatrixElems int

	routeModifiers    *routingpb.RouteModifiers
	routingPreference routingpb.RoutingPreference
}

type Throttler struct {
	RequestsRateLimiter *rate.Limiter
	ElementsRateLimiter *rate.Limiter

	errs ThrottlerErrors
}

type ThrottlerErrors struct {
	reqErr  error
	elemErr error
}

var (
	MatrixThrottlerErrors = ThrottlerErrors{
		reqErr:  ErrGoogleMapsMatrixRequestRateLimitExceeded,
		elemErr: ErrGoogleMapsMatrixElementsRateLimitExceeded,
	}
	RouteThrottlerErrors = ThrottlerErrors{
		reqErr:  ErrGoogleMapsRouteRequestRateLimitExceeded,
		elemErr: ErrGoogleMapsRouteElementsRateLimitExceeded,
	}
)

// Wait blocks until limiters permits a request with n elements
// to happen.
// n can be zero if no element is required. In that case it
// only uses the request rate limiter.
// It returns an error if the Context is
// canceled, or the expected wait time exceeds the Context's Deadline.
func (t *Throttler) Wait(ctx context.Context, elems int) error {
	if err := t.RequestsRateLimiter.Wait(ctx); err != nil {
		return t.errs.reqErr
	}

	if err := t.ElementsRateLimiter.WaitN(ctx, elems); err != nil {
		return t.errs.elemErr
	}

	return nil
}

func NewThrottler(requestsPerSec, elementsPerSec int, limits GoogleMapsLimits, errs ThrottlerErrors) *Throttler {
	requestRateLimiter := unlimitedThrottler
	elementsRateLimiter := unlimitedThrottler

	if requestsPerSec > 0 {
		requestRateLimiter = rate.NewLimiter(rate.Limit(requestsPerSec), requestsPerSec)
	}

	if elementsPerSec > 0 {
		elementsRateLimiter = rate.NewLimiter(rate.Limit(elementsPerSec), limits.maxDistanceMatrixElems)
	}

	return &Throttler{
		RequestsRateLimiter: requestRateLimiter,
		ElementsRateLimiter: elementsRateLimiter,

		errs: errs,
	}
}

var (
	unlimitedThrottler = rate.NewLimiter(rate.Inf, 0)

	GoogleMapsAdvancedAPILimits = GoogleMapsLimits{
		maxRouteWaypoints: 27,
		// https://developers.google.com/maps/documentation/distance-matrix/usage-and-billing#other-usage-limits
		maxDistanceMatrixElems: 100,
	}
	GoogleMapsStandardAPILimits = GoogleMapsLimits{
		maxRouteWaypoints:      12,
		maxDistanceMatrixElems: 10,
	}
	GoogleMapsRoutesAPITrafficAwareLimits = GoogleMapsLimits{
		maxRouteWaypoints: 27,
		// https://developers.google.com/maps/documentation/routes/migrate-routes
		routingPreference: routingpb.RoutingPreference_TRAFFIC_AWARE,
		routeModifiers: &routingpb.RouteModifiers{
			AvoidFerries: true,
		},
		maxDistanceMatrixElems: 625,
	}
	GoogleMapsRoutesAPITrafficAwareOptimalLimits = GoogleMapsLimits{
		maxRouteWaypoints: 27,
		// https://developers.google.com/maps/documentation/routes/migrate-routes
		routingPreference: routingpb.RoutingPreference_TRAFFIC_AWARE_OPTIMAL,
		routeModifiers: &routingpb.RouteModifiers{
			AvoidFerries: true,
		},
		maxDistanceMatrixElems: 100,
	}
)

const (
	googleMapsOKStatus = "OK"
)

type DirectionsRequest struct {
	Origin        LatLng
	Destination   LatLng
	Intermediates latLngList
}

func (r *DirectionsRequest) DirectionsAPIRequest() *maps.DirectionsRequest {
	return &maps.DirectionsRequest{
		Origin:      r.Origin.GoogleMapsCoordinate(),
		Destination: r.Destination.GoogleMapsCoordinate(),
		Waypoints:   r.Intermediates.GoogleMapsCoordinates(),
		Units:       maps.UnitsMetric,
	}
}

func (r *DirectionsRequest) ComputeRoutesRequest() *routingpb.ComputeRoutesRequest {
	return &routingpb.ComputeRoutesRequest{
		Origin:                   r.Origin.GoogleMapsRoutesWaypoint(),
		Destination:              r.Destination.GoogleMapsRoutesWaypoint(),
		Intermediates:            r.Intermediates.GoogleMapsRoutesWaypoints(),
		TravelMode:               routingpb.RouteTravelMode_DRIVE,
		ComputeAlternativeRoutes: false,
		Units:                    routingpb.Units_METRIC,
	}
}

func (s *GoogleMapsService) RouteReq(latLngs ...LatLng) (*DirectionsRequest, error) {
	if len(latLngs) < 2 {
		return nil, errors.New("not enough latlngs")
	}

	if len(latLngs) > s.Limits.maxRouteWaypoints {
		return nil, fmt.Errorf("too many latlngs: %d vs %d", len(latLngs), s.Limits.maxRouteWaypoints)
	}

	origin := latLngs[0]
	destination := latLngs[len(latLngs)-1]
	var waypoints []LatLng
	if len(latLngs) > 2 {
		waypoints = latLngs[1 : len(latLngs)-1]
	}

	req := DirectionsRequest{
		Origin:        origin,
		Destination:   destination,
		Intermediates: waypoints,
	}

	return &req, nil
}

func (s *GoogleMapsService) PathDistanceMatrix(ctx context.Context, dmr *PathDistanceMatrixRequest) (DistanceMatrix, error) {
	latLngs := dmr.Path
	req, err := s.RouteReq(latLngs...)
	if err != nil {
		return nil, err
	}

	routes, err := s.RoutesAPIClient.Directions(ctx, req)
	if err != nil {
		return nil, err
	}

	if len(routes) == 0 {
		return nil, errors.New("no routes")
	}

	route := routes[0]
	legs := route.Legs
	if len(legs) != len(latLngs)-1 {
		return nil, fmt.Errorf("unexpected number of legs %d for latlngs %d", len(legs), len(latLngs))
	}

	m := make(DistanceMatrix, len(latLngs))
	for _, ll := range latLngs[:len(latLngs)-1] {
		m[ll] = make(map[LatLng]Distance)
	}

	for i, leg := range legs {
		m[latLngs[i]][latLngs[i+1]] = Distance{
			Duration:     leg.Duration,
			LengthMeters: leg.LengthMeters,
		}
	}

	return m.withEnforceDiagonalDistancesAreZero(), nil
}

func (s *GoogleMapsService) GetRoute(ctx context.Context, mapsTags monitoring.Tags, latLngs ...LatLng) (*Route, error) {
	startTime := time.Now()
	var returnErr error

	defer SendMonitoring(&SendMonitoringParams{
		Scope: s.ScopedMetrics.With("", mapsTags, monitoring.Fields{
			numElementsField: len(latLngs) - 1,
		}),
		StartTime:       startTime,
		MeasurementName: getRouteMeasurementName,
		ErrorPtr:        &returnErr,
	})

	req, err := s.RouteReq(latLngs...)
	if err != nil {
		returnErr = err
		return nil, err
	}

	routes, err := s.RoutesAPIClient.Directions(ctx, req)
	if err != nil {
		returnErr = err
		return nil, err
	}

	if len(routes) == 0 {
		returnErr = errors.New("no routes")
		return nil, returnErr
	}

	return routes[0], nil
}

func min(x int, y int) int {
	if x >= y {
		return y
	}
	return x
}

func (s *GoogleMapsService) DistanceMatrixRequests(origins, destinations []LatLng) []*TiledRequest {
	// We tile the origin-destination matrix with as-large-as-possible square tiles.
	// This is not optimal in the case of an imperfect tiling (i.e. we will have some requests
	// that are smaller than others on the edge), but the default 100 is a perfect square.
	tileStride := int(math.Sqrt(float64(s.Limits.maxDistanceMatrixElems)))

	var requests []*TiledRequest
	for i := 0; i < len(origins); i += tileStride {
		for j := 0; j < len(destinations); j += tileStride {
			requests = append(requests, &TiledRequest{
				Req: &DistanceMatrixRequest{
					Origins:      latLngList(origins[i:min(i+tileStride, len(origins))]),
					Destinations: latLngList(destinations[j:min(j+tileStride, len(destinations))]),

					RouteModifiers:    s.Limits.routeModifiers,
					RoutingPreference: s.Limits.routingPreference,
				},
				Tile: MatrixTile{IOffset: i, JOffset: j},
			})
		}
	}

	return requests
}

// MatrixTile collects offsets from an original LatLng slice for breaking up large matrices into tiles
// to make batched requests to google maps.
type MatrixTile struct {
	IOffset int
	JOffset int
}

// TiledRequest associates a gmaps request with data to address properly into the original LatLng slice.
type TiledRequest struct {
	Req  *DistanceMatrixRequest
	Tile MatrixTile
}

// TiledResponse associates a gmaps response with data to address properly into the original LatLng slice.
type TiledResponse struct {
	Resp DistanceMatrix
	Tile MatrixTile
}

func (s *GoogleMapsService) PathDistanceMatrixReqs(latLngs ...LatLng) []*PathDistanceMatrixRequest {
	if len(latLngs) <= 1 {
		return nil
	}

	stride := s.Limits.maxRouteWaypoints
	reqs := make([]*PathDistanceMatrixRequest, 0, len(latLngs)/(stride-1)+1)
	for i := 0; i < len(latLngs); i += stride - 1 {
		end := min(i+stride, len(latLngs))
		if end == i+1 {
			break
		}

		reqs = append(reqs, &PathDistanceMatrixRequest{
			Path:              latLngs[i:end],
			RouteModifiers:    s.Limits.routeModifiers,
			RoutingPreference: s.Limits.routingPreference,
		})
	}

	return reqs
}

func (s *GoogleMapsService) GetPathDistanceMatrix(ctx context.Context, mapsTags monitoring.Tags, latLngs ...LatLng) (DistanceMatrix, error) {
	startTime := time.Now()

	reqs := s.PathDistanceMatrixReqs(latLngs...)
	if len(reqs) == 0 {
		return DistanceMatrix{}, nil
	}
	respDMs := make([]DistanceMatrix, len(reqs))

	var returnErr error
	tags := mapsTags.Clone()
	tags[distanceMatrixTypeTag] = distanceMatrixTypeTagPath
	defer SendMonitoring(&SendMonitoringParams{
		Scope: s.ScopedMetrics.With("", tags, monitoring.Fields{
			numRequestsField: len(reqs),
			numElementsField: len(latLngs) - 1,
		}),
		StartTime:       startTime,
		MeasurementName: distanceMatrixMeasurementName,
		ErrorPtr:        &returnErr,
	})

	eg, ctx := errgroup.WithContext(ctx)
	for i, req := range reqs {
		i, req := i, req
		eg.Go(func() error {
			elems := len(req.Path) - 1
			if err := s.RouteThrottler.Wait(ctx, elems); err != nil {
				return err
			}

			m, err := s.PathDistanceMatrixClient.PathDistanceMatrix(ctx, req)
			if err != nil {
				return err
			}

			respDMs[i] = m
			return nil
		})
	}

	if err := eg.Wait(); err != nil {
		returnErr = err
		return nil, returnErr
	}

	return DistanceMatrixList(respDMs).Merge().withEnforceDiagonalDistancesAreZero(), nil
}

func (s *GoogleMapsService) GetDistanceMatrix(ctx context.Context, mapsTags monitoring.Tags, origins, destinations []LatLng) (DistanceMatrix, error) {
	startTime := time.Now()
	reqs := s.DistanceMatrixRequests(origins, destinations)
	resps := make([]*TiledResponse, len(reqs))

	var returnErr error
	tags := mapsTags.Clone()
	tags[distanceMatrixTypeTag] = distanceMatrixTypeTagRect
	defer SendMonitoring(&SendMonitoringParams{
		Scope: s.ScopedMetrics.With("", tags, monitoring.Fields{
			numRequestsField: len(reqs),
			numElementsField: len(origins) * len(destinations),
		}),
		StartTime:       startTime,
		MeasurementName: distanceMatrixMeasurementName,
		ErrorPtr:        &returnErr,
	})

	eg, ctx := errgroup.WithContext(ctx)
	for i, req := range reqs {
		i, req := i, req
		eg.Go(func() error {
			// TODO(LOG-2065): Protect against cascading errors under rate limit exhaustion be ensuring
			// that we save the partial healthy distances to the DB in that case.
			if err := s.MatrixThrottler.Wait(ctx, req.Req.Size()); err != nil {
				return err
			}
			resp, err := s.RoutesAPIClient.DistanceMatrix(ctx, req.Req)
			if err != nil {
				return err
			}
			resps[i] = &TiledResponse{
				Resp: resp,
				Tile: req.Tile,
			}
			return nil
		})
	}
	if err := eg.Wait(); err != nil {
		returnErr = err
		return nil, returnErr
	}

	matrix := make(DistanceMatrix, len(origins))
	for _, ll := range origins {
		matrix[ll] = make(map[LatLng]Distance, len(destinations))
	}
	for _, resp := range resps {
		for fromLL, submatrix := range resp.Resp {
			for toLL, distance := range submatrix {
				matrix[fromLL][toLL] = distance
			}
		}
	}

	return matrix.withEnforceDiagonalDistancesAreZero(), nil
}

func (s *GoogleMapsService) IsHealthy(ctx context.Context) bool {
	lls := []LatLng{NewLatLng(39.770813989795684, -104.96943862054104)}
	_, err := s.GetDistanceMatrix(ctx, nil, lls, lls)
	return err == nil
}

func (s *GoogleMapsService) GetDistanceSourceID() int64 {
	return s.DistanceSourceID
}

type RoutesAPIAdapter struct {
	Client MapsClient
}

func (a *RoutesAPIAdapter) Directions(ctx context.Context, req *DirectionsRequest) ([]*Route, error) {
	response, _, err := a.Client.Directions(ctx, req.DirectionsAPIRequest())
	if err != nil {
		return nil, err
	}
	routes := make([]*Route, 0, len(response))
	for _, r := range response {
		var distance Distance
		legs := make(Legs, 0, len(r.Legs))
		for _, mapsLeg := range r.Legs {
			leg := &Distance{
				Duration:     mapsLeg.Duration,
				LengthMeters: int64(mapsLeg.Distance.Meters),
			}
			distance.LengthMeters += leg.LengthMeters
			distance.Duration += leg.Duration
			legs = append(legs, leg)
		}

		points, err := r.OverviewPolyline.Decode()
		if err != nil {
			return nil, err
		}

		poly := make(RoutePolyline, len(points))
		for i, p := range points {
			poly[i] = NewLatLng(p.Lat, p.Lng)
		}

		routes = append(routes, &Route{Distance: distance, Polyline: poly, Legs: legs})
	}
	return routes, nil
}

func (a *RoutesAPIAdapter) DistanceMatrix(ctx context.Context, dmr *DistanceMatrixRequest) (DistanceMatrix, error) {
	resp, err := a.Client.DistanceMatrix(ctx, dmr.MapsDistanceMatrixRequest())
	if err != nil {
		return nil, err
	}

	m := make(DistanceMatrix, len(dmr.Origins))
	for i := 0; i < len(dmr.Origins); i++ {
		m[dmr.Origins[i]] = make(map[LatLng]Distance, len(dmr.Destinations))
	}
	for i, row := range resp.Rows {
		for j, elem := range row.Elements {
			if elem.Status != googleMapsOKStatus {
				return nil, fmt.Errorf(
					"could not get some distances (from: %s, to: %s): status: %v", dmr.Origins[i], dmr.Destinations[j], elem.Status)
			}

			m[dmr.Origins[i]][dmr.Destinations[j]] = Distance{
				Duration:     elem.Duration,
				LengthMeters: int64(elem.Distance.Meters),
			}
		}
	}

	return m, nil
}

type HTTPRoutesAPIClient struct {
	apiKeys   *APIKeyPicker
	matrixURL string
	routeURL  string
}

func NewHTTPRoutesAPIClient(apiKeys *APIKeyPicker) *HTTPRoutesAPIClient {
	return &HTTPRoutesAPIClient{
		apiKeys:   apiKeys,
		matrixURL: routesAPIMatrixHTTPAddr,
		routeURL:  routesAPIRouteHTTPAddr,
	}
}

// https://github.com/googleapis/googleapis/blob/master/google/maps/routing/v2/routes_service.proto
type httpRoutesAPIRespJSON struct {
	elems []*routingpb.RouteMatrixElement
}

func (r *httpRoutesAPIRespJSON) UnmarshalJSON(data []byte) error {
	var d []json.RawMessage
	err := json.Unmarshal(data, &d)

	var result []*routingpb.RouteMatrixElement
	for _, elemData := range d {
		var elem routingpb.RouteMatrixElement
		err = protojson.Unmarshal(elemData, &elem)
		if err != nil {
			return err
		}

		result = append(result, &elem)
	}

	r.elems = result

	return err
}

func (r *httpRoutesAPIRespJSON) MarshalJSON() ([]byte, error) {
	d := make([]json.RawMessage, len(r.elems))
	for i, elem := range r.elems {
		buf, err := protojson.Marshal(elem)
		if err != nil {
			return nil, err
		}

		d[i] = buf
	}

	return json.Marshal(d)
}

func (c *HTTPRoutesAPIClient) Do(ctx context.Context, url string, req protoreflect.ProtoMessage, fieldMask string) ([]byte, error) {
	body := bytes.NewReader([]byte(protojson.Format(req)))
	r, err := http.NewRequestWithContext(ctx, http.MethodPost, url, body)
	if err != nil {
		return nil, err
	}

	r.Header.Add("Content-Type", "application/json")
	r.Header.Add(googleFieldmaskHeader, fieldMask)
	r.Header.Add(googleAPIKeyHeader, c.apiKeys.nextAPIKey())

	resp, err := http.DefaultClient.Do(r)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	return io.ReadAll(resp.Body)
}

func routesFromPBRoute(pbRoutes []*routingpb.Route) ([]*Route, error) {
	routes := make([]*Route, 0, len(pbRoutes))
	for _, route := range pbRoutes {
		points, err := maps.DecodePolyline(route.Polyline.GetEncodedPolyline())
		if err != nil {
			return nil, err
		}
		poly := make(RoutePolyline, len(points))
		for i, p := range points {
			poly[i] = NewLatLng(p.Lat, p.Lng)
		}

		legs := make(Legs, 0, len(route.Legs))
		for _, mapsLeg := range route.Legs {
			duration := time.Duration(mapsLeg.GetDuration().GetSeconds() * int64(time.Second))
			legs = append(legs, &Distance{
				Duration:     duration,
				LengthMeters: int64(mapsLeg.GetDistanceMeters()),
			})
		}

		routes = append(routes, &Route{
			Polyline: poly,
			Distance: Distance{
				Duration:     time.Duration(route.GetDuration().GetSeconds() * int64(time.Second)),
				LengthMeters: int64(route.GetDistanceMeters()),
			},
			Legs: legs,
		})
	}
	return routes, nil
}

func (c *HTTPRoutesAPIClient) Directions(ctx context.Context, req *DirectionsRequest) ([]*Route, error) {
	buf, err := c.Do(ctx, c.routeURL, req.ComputeRoutesRequest(), directionsFieldMask)
	if err != nil {
		return nil, err
	}
	var routesResponse routingpb.ComputeRoutesResponse
	err = protojson.Unmarshal(buf, &routesResponse)
	if err != nil {
		return nil, err
	}
	return routesFromPBRoute(routesResponse.GetRoutes())
}

func (c *HTTPRoutesAPIClient) PathDistanceMatrix(ctx context.Context, dmr *PathDistanceMatrixRequest) (DistanceMatrix, error) {
	buf, err := c.Do(ctx, c.routeURL, dmr.ComputeRoutesRequest(), pathDistanceMatrixFieldMask)
	if err != nil {
		return nil, err
	}

	var rr routingpb.ComputeRoutesResponse
	err = protojson.Unmarshal(buf, &rr)
	if err != nil {
		return nil, err
	}

	return routeRespToDistanceMatrix(&rr, dmr.Path)
}

func (c *HTTPRoutesAPIClient) DistanceMatrix(ctx context.Context, dmr *DistanceMatrixRequest) (DistanceMatrix, error) {
	buf, err := c.Do(ctx, c.matrixURL, dmr.ComputeRouteMatrixRequest(), distanceMatrixFieldMask)
	if err != nil {
		return nil, err
	}

	var respJSON httpRoutesAPIRespJSON
	err = json.Unmarshal(buf, &respJSON)
	if err != nil {
		return nil, err
	}

	m := DistanceMatrix{}
	for _, ll := range dmr.Origins {
		m[ll] = make(map[LatLng]Distance, len(dmr.Destinations))
	}
	for _, elem := range respJSON.elems {
		err = addMatrixElem(m, dmr, elem)
		if err != nil {
			return nil, err
		}
	}

	return m.withEnforceDiagonalDistancesAreZero(), nil
}

// GRPCRoutesAPIClient is the GRPC version of the MapsRoutesAPIClient.
// The client needs to be `Start`ed before any requests, and `Cleanup`ed before exit.
type GRPCRoutesAPIClient struct {
	APIKeys *APIKeyPicker
	conn    *grpc.ClientConn
	client  routingpb.RoutesClient
}

func (c *GRPCRoutesAPIClient) Start(dialOptions ...grpc.DialOption) error {
	config := tls.Config{}
	dialOptions = append(dialOptions, grpc.WithTransportCredentials(credentials.NewTLS(&config)))
	conn, err := grpc.Dial(routesAPIGRPCAddr, dialOptions...)
	if err != nil {
		log.Fatalf("Failed to connect: %v", err)
		return err
	}

	c.conn = conn
	c.client = routingpb.NewRoutesClient(conn)
	return nil
}

func (c *GRPCRoutesAPIClient) Cleanup() {
	c.conn.Close()
}

func (c *GRPCRoutesAPIClient) PathDistanceMatrix(ctx context.Context, dmr *PathDistanceMatrixRequest) (DistanceMatrix, error) {
	ctx = metadata.AppendToOutgoingContext(ctx, googleAPIKeyHeader, c.APIKeys.nextAPIKey())
	ctx = metadata.AppendToOutgoingContext(ctx, googleFieldmaskHeader, pathDistanceMatrixFieldMask)
	resp, err := c.client.ComputeRoutes(ctx, dmr.ComputeRoutesRequest())
	if err != nil {
		return nil, err
	}

	return routeRespToDistanceMatrix(resp, dmr.Path)
}

func (c *GRPCRoutesAPIClient) Directions(ctx context.Context, req *DirectionsRequest) ([]*Route, error) {
	ctx = metadata.AppendToOutgoingContext(ctx, googleAPIKeyHeader, c.APIKeys.nextAPIKey())
	ctx = metadata.AppendToOutgoingContext(ctx, googleFieldmaskHeader, directionsFieldMask)

	routes, err := c.client.ComputeRoutes(ctx, req.ComputeRoutesRequest())
	if err != nil {
		return nil, err
	}
	return routesFromPBRoute(routes.GetRoutes())
}

func (c *GRPCRoutesAPIClient) DistanceMatrix(ctx context.Context, dmr *DistanceMatrixRequest) (DistanceMatrix, error) {
	ctx = metadata.AppendToOutgoingContext(ctx, googleAPIKeyHeader, c.APIKeys.nextAPIKey())
	ctx = metadata.AppendToOutgoingContext(ctx, googleFieldmaskHeader, distanceMatrixFieldMask)

	stream, err := c.client.ComputeRouteMatrix(ctx, dmr.ComputeRouteMatrixRequest())
	if err != nil {
		return nil, err
	}

	m := DistanceMatrix{}
	for _, ll := range dmr.Origins {
		m[ll] = make(map[LatLng]Distance, len(dmr.Destinations))
	}
	for {
		elem, err := stream.Recv()
		if err != nil {
			if errors.Is(err, io.EOF) {
				break
			}

			return nil, err
		}

		err = addMatrixElem(m, dmr, elem)
		if err != nil {
			return nil, err
		}
	}

	return m.withEnforceDiagonalDistancesAreZero(), nil
}

func addMatrixElem(m DistanceMatrix, dmr *DistanceMatrixRequest, elem *routingpb.RouteMatrixElement) error {
	if code.Code(elem.Status.GetCode()) != code.Code_OK || elem.Condition != routingpb.RouteMatrixElementCondition_ROUTE_EXISTS {
		return fmt.Errorf("bad status (%v) or condition (%v)", elem.Status.GetCode(), elem.Condition)
	}

	i := int(elem.GetOriginIndex())
	if i >= len(dmr.Origins) {
		return fmt.Errorf("unknown origin index %d for origins: %v", i, dmr.Origins)
	}
	oll := dmr.Origins[i]
	j := int(elem.GetDestinationIndex())
	if j >= len(dmr.Destinations) {
		return fmt.Errorf("unknown destination index %d for destinations: %v", j, dmr.Destinations)
	}
	dll := dmr.Destinations[j]
	m[oll][dll] = Distance{
		Duration:     elem.Duration.AsDuration(),
		LengthMeters: int64(elem.DistanceMeters),
	}

	return nil
}

func routeRespToDistanceMatrix(resp *routingpb.ComputeRoutesResponse, path []LatLng) (DistanceMatrix, error) {
	routes := resp.GetRoutes()
	if len(routes) < 1 {
		return nil, fmt.Errorf("not enough routes: %d: resp %v", len(routes), resp)
	}
	route := routes[0]
	legs := route.GetLegs()
	if len(legs) != len(path)-1 {
		return nil, fmt.Errorf("not right number of legs in path: %v", legs)
	}

	m := DistanceMatrix{}
	for _, ll := range path[:len(path)-1] {
		m[ll] = make(map[LatLng]Distance, 1)
	}
	for i, leg := range legs {
		m[path[i]][path[i+1]] = Distance{
			Duration:     leg.Duration.AsDuration(),
			LengthMeters: int64(leg.DistanceMeters),
		}
	}

	return m.withEnforceDiagonalDistancesAreZero(), nil
}

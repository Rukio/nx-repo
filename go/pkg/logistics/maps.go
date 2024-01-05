package logistics

import (
	"context"
	"fmt"
	"time"

	"cloud.google.com/go/maps/routing/apiv2/routingpb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer/optimizersettings"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"google.golang.org/genproto/googleapis/type/latlng"
	"googlemaps.github.io/maps"
)

const (
	E6 = 1e6
)

type Route struct {
	Polyline RoutePolyline
	Distance Distance
	Legs     Legs
}

type Legs []*Distance

const (
	distanceMatrixMeasurementName = "get_distance_matrix"
	getRouteMeasurementName       = "get_route"

	statusTag        = "status"
	statusTagSuccess = "OK"
	statusTagError   = "error"

	distanceMatrixTypeTag     = "type"
	distanceMatrixTypeTagPath = "path"
	distanceMatrixTypeTagRect = "rect"

	numRequestsField = "requests"
	numElementsField = "elements"
	durationMSField  = "duration_ms"
	errorField       = "error"
)

// MapServicePicker allows for regional routing to different underlying maps services.
// Must be initialized with NewMapServicePicker.
type MapServicePicker struct {
	osrm        MapService
	defaultMaps MapService

	otherMapServices map[int64][]MapService

	settingsService optimizersettings.Service
}

// NewMapServicePicker returns a MapServicePicker. If defaultMaps is nil, then all calls get routed to OSRM.
// SettingsService is used to resolve routing by region.
func NewMapServicePicker(osrm MapService, defaultMaps MapService, settingsService optimizersettings.Service) *MapServicePicker {
	allServices := map[int64]MapService{}
	if osrm != nil {
		allServices[osrm.GetDistanceSourceID()] = osrm
	}
	if defaultMaps != nil {
		allServices[defaultMaps.GetDistanceSourceID()] = defaultMaps
	}

	otherServices := map[int64][]MapService{}
	for sourceID := range allServices {
		for otherSourceID, service := range allServices {
			if otherSourceID != sourceID {
				otherServices[sourceID] = append(otherServices[sourceID], service)
			}
		}
	}

	return &MapServicePicker{
		osrm:             osrm,
		defaultMaps:      defaultMaps,
		settingsService:  settingsService,
		otherMapServices: otherServices,
	}
}

func (p *MapServicePicker) MapServiceForRegion(ctx context.Context, serviceRegionID int64) (MapService, error) {
	settings, err := p.settingsService.ServiceRegionSettings(ctx, serviceRegionID)
	if err != nil {
		return nil, fmt.Errorf("MapServicePicker error resolving settings for region(%d): %w", serviceRegionID, err)
	}
	if p.defaultMaps != nil && !settings.UseOSRMMapService {
		return p.defaultMaps, nil
	}
	return p.osrm, nil
}

func (p *MapServicePicker) OtherMapServicesForRegion(ctx context.Context, serviceRegionID int64) ([]MapService, error) {
	s, err := p.MapServiceForRegion(ctx, serviceRegionID)
	if err != nil {
		return nil, err
	}

	return p.otherMapServices[s.GetDistanceSourceID()], nil
}

func (p *MapServicePicker) RealTimeTrafficMapService(ctx context.Context, serviceRegionID int64) (MapService, error) {
	settings, err := p.settingsService.ServiceRegionSettings(ctx, serviceRegionID)
	if err != nil {
		return nil, fmt.Errorf("MapServicePicker error resolving settings for region(%d): %w", serviceRegionID, err)
	}
	if settings.UseGoogleMapsForRealTimeTraffic {
		return p.defaultMaps, nil
	}
	return p.MapServiceForRegion(ctx, serviceRegionID)
}

type MapService interface {
	GetDistanceMatrix(ctx context.Context, tags monitoring.Tags, origins, destinations []LatLng) (DistanceMatrix, error)
	GetPathDistanceMatrix(ctx context.Context, tags monitoring.Tags, path ...LatLng) (DistanceMatrix, error)
	GetRoute(context.Context, monitoring.Tags, ...LatLng) (*Route, error)
	GetDistanceSourceID() int64

	IsHealthy(context.Context) bool
}

type NearestWaypointMapService interface {
	GetNearestWaypoint(ctx context.Context, latLng LatLng) (*LatLng, error)
}

type Distance struct {
	Duration     time.Duration
	LengthMeters int64
}

// TODO: Move to googlemaps.go.
type DistanceMatrixRequest struct {
	Origins      latLngList
	Destinations latLngList

	RouteModifiers    *routingpb.RouteModifiers
	RoutingPreference routingpb.RoutingPreference
}

func (r *DistanceMatrixRequest) ComputeRouteMatrixRequest() *routingpb.ComputeRouteMatrixRequest {
	return &routingpb.ComputeRouteMatrixRequest{
		Origins:           r.Origins.RouteMatrixOrigins(r.RouteModifiers),
		Destinations:      r.Destinations.RouteMatrixDestinations(),
		TravelMode:        routingpb.RouteTravelMode_DRIVE,
		RoutingPreference: r.RoutingPreference,
	}
}

// Size returns the number of elements in the request.
func (r *DistanceMatrixRequest) Size() int {
	return len(r.Origins) * len(r.Destinations)
}

func (r *DistanceMatrixRequest) MapsDistanceMatrixRequest() *maps.DistanceMatrixRequest {
	return &maps.DistanceMatrixRequest{
		Origins:      r.Origins.GoogleMapsCoordinates(),
		Destinations: r.Destinations.GoogleMapsCoordinates(),
		Units:        maps.UnitsMetric,
	}
}

type DistanceMatrix map[LatLng]map[LatLng]Distance

func (m DistanceMatrix) withEnforceDiagonalDistancesAreZero() DistanceMatrix {
	if m == nil {
		return nil
	}
	for origin, distances := range m {
		for destination := range distances {
			if origin == destination {
				m[origin][destination] = Distance{Duration: 0, LengthMeters: 0}
			}
		}
	}
	return m
}

type DistanceMatrixList []DistanceMatrix

func (dml DistanceMatrixList) Merge() DistanceMatrix {
	m := DistanceMatrix{}

	for _, dm := range dml {
		for fromLL, toLLs := range dm {
			mToLLs, ok := m[fromLL]
			if !ok {
				mToLLs = make(map[LatLng]Distance)
				m[fromLL] = mToLLs
			}
			for toLL, distance := range toLLs {
				mToLLs[toLL] = distance
			}
		}
	}

	return m
}

type LatLng struct {
	LatE6 int32 `json:"latitude_e6"`
	LngE6 int32 `json:"longitude_e6"`
}

func NewLatLng(latitude, longitude float64) LatLng {
	return LatLng{
		LatE6: int32(latitude * E6),
		LngE6: int32(longitude * E6),
	}
}

func (ll LatLng) OSRMCoordinate() string {
	return fmt.Sprintf("%f,%f", ll.Longitude(), ll.Latitude())
}
func (ll LatLng) GoogleMapsCoordinate() string {
	return fmt.Sprintf("%f,%f", ll.Latitude(), ll.Longitude())
}
func (ll LatLng) GoogleMapsRoutesWaypoint() *routingpb.Waypoint {
	return &routingpb.Waypoint{
		LocationType: &routingpb.Waypoint_Location{
			Location: &routingpb.Location{
				LatLng: &latlng.LatLng{
					Latitude:  ll.Latitude(),
					Longitude: ll.Longitude(),
				},
			},
		},
	}
}

func (ll LatLng) Latitude() float64 {
	return float64(ll.LatE6) / E6
}
func (ll LatLng) Longitude() float64 {
	return float64(ll.LngE6) / E6
}

func (ll LatLng) String() string {
	return fmt.Sprintf("(%f,%f)", ll.Latitude(), ll.Longitude())
}

type RoutePolyline []LatLng

type latLngList []LatLng

func (lls latLngList) GoogleMapsCoordinates() []string {
	ss := make([]string, len(lls))
	for i, latLng := range lls {
		ss[i] = latLng.GoogleMapsCoordinate()
	}

	return ss
}

func (lls latLngList) OSRMCoordinates() []string {
	ss := make([]string, len(lls))
	for i, latLng := range lls {
		ss[i] = latLng.OSRMCoordinate()
	}

	return ss
}

func (lls latLngList) RouteMatrixOrigins(routeModifiers *routingpb.RouteModifiers) []*routingpb.RouteMatrixOrigin {
	ss := make([]*routingpb.RouteMatrixOrigin, len(lls))
	for i, latLng := range lls {
		ss[i] = &routingpb.RouteMatrixOrigin{
			Waypoint:       latLng.GoogleMapsRoutesWaypoint(),
			RouteModifiers: routeModifiers,
		}
	}

	return ss
}

func (lls latLngList) RouteMatrixDestinations() []*routingpb.RouteMatrixDestination {
	ss := make([]*routingpb.RouteMatrixDestination, len(lls))
	for i, latLng := range lls {
		ss[i] = &routingpb.RouteMatrixDestination{
			Waypoint: latLng.GoogleMapsRoutesWaypoint(),
		}
	}

	return ss
}

func (lls latLngList) FirstWaypoint() *routingpb.Waypoint {
	if len(lls) == 0 {
		return nil
	}

	return lls[0].GoogleMapsRoutesWaypoint()
}

func (lls latLngList) LastWaypoint() *routingpb.Waypoint {
	if len(lls) == 0 {
		return nil
	}

	return lls[len(lls)-1].GoogleMapsRoutesWaypoint()
}

func (lls latLngList) IntermediateWaypoints() []*routingpb.Waypoint {
	if len(lls) <= 2 {
		return nil
	}

	return lls[1 : len(lls)-1].GoogleMapsRoutesWaypoints()
}

func (lls latLngList) GoogleMapsRoutesWaypoints() []*routingpb.Waypoint {
	if len(lls) == 0 {
		return nil
	}
	wps := make([]*routingpb.Waypoint, len(lls))
	for i, latLng := range lls {
		wps[i] = latLng.GoogleMapsRoutesWaypoint()
		wps[i].VehicleStopover = true
	}

	return wps
}

type SendMonitoringParams struct {
	Scope           monitoring.Scope
	StartTime       time.Time
	MeasurementName string
	ErrorPtr        *error
}

func SendMonitoring(params *SendMonitoringParams) {
	status := statusTagSuccess
	var errorValue string
	err := *(params.ErrorPtr)
	if err != nil {
		status = statusTagError
		errorValue = err.Error()
	}

	params.Scope.WritePoint(
		params.MeasurementName,
		monitoring.Tags{
			statusTag: status,
		},
		monitoring.Fields{
			durationMSField: time.Since(params.StartTime).Milliseconds(),
			errorField:      errorValue,
		},
	)
}

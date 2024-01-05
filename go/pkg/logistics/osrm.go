package logistics

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"strconv"
	"strings"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/monitoring"
)

const (
	osrmOKCode = "Ok"
)

var (
	errBadOSRMResponseCode = errors.New("bad OSRM response code")
)

type OSRMService struct {
	Addr             string
	HTTPClient       *http.Client
	DistanceSourceID int64
	ScopedMetrics    monitoring.Scope
}

func NewOSRMService(addr string, distanceSourceID int64, scope monitoring.Scope) *OSRMService {
	return &OSRMService{
		Addr:             addr,
		HTTPClient:       http.DefaultClient,
		DistanceSourceID: distanceSourceID,
		ScopedMetrics:    scope,
	}
}

// indexesStr returns a string with [start,end) for OSRM sources/destinations query param.
func (s *OSRMService) indexesStr(start, end int) string {
	ss := make([]string, end-start)
	for i := start; i < end; i++ {
		ss[i-start] = strconv.Itoa(i)
	}

	return strings.Join(ss, ";")
}

func (s *OSRMService) DistanceMatrixURL(origins, destinations []LatLng) string {
	coords := latLngList(append(origins, destinations...)).OSRMCoordinates()

	uri := fmt.Sprintf("%s/table/v1/driving/%s?annotations=distance,duration&skip_waypoints=true&sources=%s&destinations=%s",
		s.Addr,
		strings.Join(coords, ";"),
		s.indexesStr(0, len(origins)),
		s.indexesStr(len(origins), len(origins)+len(destinations)))

	return uri
}

func (s *OSRMService) RouteURL(latLngs ...LatLng) string {
	coords := latLngList(latLngs).OSRMCoordinates()
	uri := fmt.Sprintf("%s/route/v1/driving/%s?geometries=geojson", s.Addr, strings.Join(coords, ";"))

	return uri
}

func (s *OSRMService) NearestWaypointURL(latLng LatLng) string {
	uri := fmt.Sprintf("%s/nearest/v1/driving/%s?number=%d", s.Addr, latLng.OSRMCoordinate(), 1)

	return uri
}

type osrmTableResp struct {
	Code          string
	DurationsSec  [][]float64 `json:"durations"`
	LengthsMeters [][]float64 `json:"distances"`
}

func (s *OSRMService) getWithContext(ctx context.Context, url string) (*http.Response, error) {
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, url, nil)
	if err != nil {
		return nil, err
	}
	return s.HTTPClient.Do(req)
}

func (s *OSRMService) GetDistanceMatrix(ctx context.Context, mapsTags monitoring.Tags, origins, destinations []LatLng) (DistanceMatrix, error) {
	startTime := time.Now()
	if len(origins) == 0 || len(destinations) == 0 {
		return DistanceMatrix{}, nil
	}
	if len(origins) == 1 && len(destinations) == 1 && origins[0] == destinations[0] {
		return DistanceMatrix{
			origins[0]: map[LatLng]Distance{origins[0]: {}},
		}, nil
	}

	var returnErr error
	tags := mapsTags.Clone()
	tags[distanceMatrixTypeTag] = distanceMatrixTypeTagRect
	defer SendMonitoring(&SendMonitoringParams{
		Scope: s.ScopedMetrics.With("", tags, monitoring.Fields{
			numRequestsField: 1,
			numElementsField: len(origins) * len(destinations),
		}),
		StartTime:       startTime,
		MeasurementName: distanceMatrixMeasurementName,
		ErrorPtr:        &returnErr,
	})

	resp, err := s.getWithContext(ctx, s.DistanceMatrixURL(origins, destinations))
	if err != nil {
		returnErr = err
		return nil, returnErr
	}
	defer resp.Body.Close()

	var osrmTable osrmTableResp
	err = json.NewDecoder(resp.Body).Decode(&osrmTable)
	if err != nil {
		returnErr = err
		return nil, returnErr
	}

	if osrmTable.Code != osrmOKCode {
		returnErr = errBadOSRMResponseCode
		return nil, returnErr
	}

	matrix := make(DistanceMatrix, len(origins))
	for i, fromLL := range origins {
		toLatLngMap := make(map[LatLng]Distance, len(destinations))
		for j, toLL := range destinations {
			toLatLngMap[toLL] = Distance{
				Duration:     time.Duration(osrmTable.DurationsSec[i][j]) * time.Second,
				LengthMeters: int64(osrmTable.LengthsMeters[i][j]),
			}
		}
		matrix[fromLL] = toLatLngMap
	}

	return matrix.withEnforceDiagonalDistancesAreZero(), nil
}

type osrmRouteLeg struct {
	DistanceMeters float64 `json:"distance"`
	DurationSec    float64 `json:"duration"`
}

type osrmRoute struct {
	Geometry struct {
		LonLats [][]float64 `json:"coordinates"`
	}
	DistanceMeters float64 `json:"distance"`
	DurationSec    float64 `json:"duration"`
	Legs           []osrmRouteLeg
}

type osrmRouteResp struct {
	Code   string
	Routes []osrmRoute
}

func (s *OSRMService) GetRoute(ctx context.Context, mapsTags monitoring.Tags, latLngs ...LatLng) (*Route, error) {
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

	resp, err := s.getWithContext(ctx, s.RouteURL(latLngs...))
	if err != nil {
		returnErr = err
		return nil, err
	}
	defer resp.Body.Close()

	var osrmRoute osrmRouteResp
	err = json.NewDecoder(resp.Body).Decode(&osrmRoute)
	if err != nil {
		returnErr = err
		return nil, err
	}

	if osrmRoute.Code != osrmOKCode {
		return nil, errBadOSRMResponseCode
	}

	if len(osrmRoute.Routes) == 0 {
		returnErr = errors.New("no routes")
		return nil, returnErr
	}

	route := osrmRoute.Routes[0]
	var polyline RoutePolyline
	for _, lonLat := range route.Geometry.LonLats {
		if len(lonLat) != 2 {
			returnErr = errors.New("cannot parse coordinates")
			return nil, returnErr
		}

		polyline = append(polyline, NewLatLng(lonLat[1], lonLat[0]))
	}

	return &Route{
		Polyline: polyline,
		Distance: Distance{
			Duration:     time.Duration(route.DurationSec) * time.Second,
			LengthMeters: int64(route.DistanceMeters),
		},
	}, nil
}

func (s *OSRMService) GetPathDistanceMatrix(ctx context.Context, mapsTags monitoring.Tags, latLngs ...LatLng) (DistanceMatrix, error) {
	startTime := time.Now()

	if len(latLngs) <= 1 {
		return DistanceMatrix{}, nil
	}

	var returnErr error
	tags := mapsTags.Clone()
	tags[distanceMatrixTypeTag] = distanceMatrixTypeTagPath
	defer SendMonitoring(&SendMonitoringParams{
		Scope: s.ScopedMetrics.With("", tags, monitoring.Fields{
			numRequestsField: 1,
			numElementsField: len(latLngs) - 1,
		}),
		StartTime:       startTime,
		MeasurementName: distanceMatrixMeasurementName,
		ErrorPtr:        &returnErr,
	})

	resp, err := s.getWithContext(ctx, s.RouteURL(latLngs...))
	if err != nil {
		returnErr = err
		return nil, returnErr
	}
	defer resp.Body.Close()

	var osrmRoute osrmRouteResp
	err = json.NewDecoder(resp.Body).Decode(&osrmRoute)
	if err != nil {
		returnErr = err
		return nil, returnErr
	}

	if osrmRoute.Code != osrmOKCode {
		returnErr = errBadOSRMResponseCode
		return nil, returnErr
	}

	if len(osrmRoute.Routes) == 0 {
		returnErr = errors.New("no routes")
		return nil, returnErr
	}
	route := osrmRoute.Routes[0]

	legs := route.Legs
	if len(legs) != len(latLngs)-1 {
		returnErr = errors.New("unexpected number of legs")
		return nil, returnErr
	}

	m := make(DistanceMatrix, len(latLngs))
	for _, ll := range latLngs {
		m[ll] = make(map[LatLng]Distance)
	}
	for i, leg := range legs {
		m[latLngs[i]][latLngs[i+1]] = Distance{
			Duration:     time.Duration(leg.DurationSec) * time.Second,
			LengthMeters: int64(leg.DistanceMeters),
		}
	}

	return m.withEnforceDiagonalDistancesAreZero(), nil
}

type osrmNearestWaypointResp struct {
	Code      string
	Waypoints []struct {
		LonLat []float64 `json:"location"`
		Name   string
	}
}

func (s *OSRMService) GetNearestWaypoint(ctx context.Context, latLng LatLng) (*LatLng, error) {
	resp, err := s.getWithContext(ctx, s.NearestWaypointURL(latLng))
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	var osrmNearest osrmNearestWaypointResp
	err = json.NewDecoder(resp.Body).Decode(&osrmNearest)
	if err != nil {
		return nil, err
	}

	if osrmNearest.Code != osrmOKCode {
		return nil, errBadOSRMResponseCode
	}

	if len(osrmNearest.Waypoints) == 0 {
		return nil, errors.New("no waypoints")
	}

	waypoint := osrmNearest.Waypoints[0]
	waypointLatLng := NewLatLng(waypoint.LonLat[1], waypoint.LonLat[0])

	return &waypointLatLng, nil
}

func (s *OSRMService) IsHealthy(ctx context.Context) bool {
	uri := s.RouteURL(NewLatLng(39.561763218406, -105.16138700281643), NewLatLng(39.98671787980217, -104.7431061560565))
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, uri, nil)
	if err != nil {
		return false
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return false
	}
	defer resp.Body.Close()
	return resp.StatusCode == http.StatusOK
}

func (s *OSRMService) GetDistanceSourceID() int64 {
	return s.DistanceSourceID
}

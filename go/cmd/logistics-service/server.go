package main

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"strconv"

	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"

	"google.golang.org/grpc"
	"google.golang.org/grpc/connectivity"
	"google.golang.org/protobuf/encoding/protojson"
)

type Server struct {
	Optimizer                 *grpc.ClientConn
	MapService                logistics.MapService
	NearestWaypointMapService logistics.NearestWaypointMapService

	GRPCServer *GRPCServer

	LogisticsDB *logisticsdb.LogisticsDB

	GoogleMapsHealthChecker HealthChecker
	OSRMHealthChecker       HealthChecker
}

// TODO: Move this generic handler to a shared package once fleshed out.
func (s *Server) version(w http.ResponseWriter, r *http.Request) {
	buf, err := json.Marshal(map[string]any{
		"version": buildinfo.Version,
	})
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Write(buf)
}

func (s *Server) optimizerRun(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	idStr := query.Get("id")
	var err error
	if idStr == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
	}

	resp, err := s.GRPCServer.GetOptimizerRunDiagnostics(r.Context(), &logisticspb.GetOptimizerRunDiagnosticsRequest{
		OptimizerRunId: int64(id),
	})
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	marshaler := protojson.MarshalOptions{
		Multiline:     true,
		Indent:        "  ",
		UseProtoNames: true,
	}
	buf, err := marshaler.Marshal(resp)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set(contentTypeHeader, jsonContentType)
	w.Write(buf)
}

func (s *Server) careRequestCheckFeasibility(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	idStr := query.Get("id")
	var err error
	if idStr == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
	}

	resp, err := s.GRPCServer.GetCheckFeasibilityCareRequestHistory(r.Context(), &logisticspb.GetCheckFeasibilityCareRequestHistoryRequest{
		CareRequestId: int64(id),
	})
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	marshaler := protojson.MarshalOptions{
		Multiline:     true,
		Indent:        "  ",
		UseProtoNames: true,
	}
	buf, err := marshaler.Marshal(resp)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set(contentTypeHeader, jsonContentType)
	w.Write(buf)
}

func (s *Server) market(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	idStr := query.Get("id")
	var err error
	if idStr == "" {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	id, err := strconv.Atoi(idStr)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
	}

	resp, err := s.GRPCServer.GetMarketDiagnostics(r.Context(), &logisticspb.GetMarketDiagnosticsRequest{
		MarketId: int64(id),
	})
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	marshaler := protojson.MarshalOptions{
		Multiline:     true,
		Indent:        "  ",
		UseProtoNames: true,
	}
	buf, err := marshaler.Marshal(resp)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set(contentTypeHeader, jsonContentType)
	w.Write(buf)
}

func (s *Server) updateMarketFeasibilityCheckSettings(w http.ResponseWriter, r *http.Request) {
	defer r.Body.Close()
	buf, err := io.ReadAll(r.Body)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
		return
	}

	var req logisticspb.UpdateMarketFeasibilityCheckSettingsRequest
	err = protojson.Unmarshal(buf, &req)
	if err != nil {
		w.WriteHeader(http.StatusBadRequest)
		w.Write([]byte(err.Error()))
		return
	}

	_, err = s.GRPCServer.UpdateMarketFeasibilityCheckSettings(r.Context(), &req)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte(err.Error()))
	}
}

func (s *Server) healthCheck(w http.ResponseWriter, r *http.Request) {
	ctx := r.Context()
	status := healthCheckStatus{
		DB:        s.LogisticsDB.IsHealthy(ctx),
		Maps:      s.MapService.IsHealthy(ctx),
		OSRM:      s.OSRMHealthChecker.IsHealthy(ctx),
		Optimizer: s.optimizerIsHealthy(),
	}

	status.Diagnostics.Version = buildinfo.Version

	if s.GoogleMapsHealthChecker != nil {
		status.Diagnostics.GoogleMaps = s.GoogleMapsHealthChecker.IsHealthy(ctx)
	}
	if s.OSRMHealthChecker != nil {
		status.Diagnostics.OSRM = s.OSRMHealthChecker.IsHealthy(ctx)
	}

	buf, err := json.MarshalIndent(status, "", "  ")
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	httpStatus := http.StatusOK
	if !status.IsHealthy() {
		httpStatus = http.StatusServiceUnavailable
	}

	w.WriteHeader(httpStatus)
	w.Write(buf)
}

func (s *Server) optimizerIsHealthy() bool {
	return s.Optimizer != nil && s.Optimizer.GetState() != connectivity.Shutdown
}

type HealthChecker interface {
	IsHealthy(context.Context) bool
}

type healthCheckStatus struct {
	DB        bool `json:"db"`
	Maps      bool `json:"maps"`
	OSRM      bool `json:"osrm"`
	Optimizer bool `json:"optimizer"`

	// Only meant to give diagnostic status of these services, but not affect overall IsHealthy.
	Diagnostics struct {
		GoogleMaps bool   `json:"googlemaps"`
		OSRM       bool   `json:"osrm"`
		Version    string `json:"version"`
	} `json:"diagnostics"`
}

func (s healthCheckStatus) IsHealthy() bool {
	return s.DB && s.Maps && s.Optimizer
}

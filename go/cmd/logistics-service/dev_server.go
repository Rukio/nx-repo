package main

import (
	"crypto/sha1"
	"encoding/base64"
	"encoding/json"
	"io"
	"log"
	"math/rand"
	"net/http"
	"net/url"
	"strconv"
	"sync"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/demo"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/logistics/optimizer"
	"google.golang.org/protobuf/encoding/protojson"
	"google.golang.org/protobuf/proto"
)

var (
	cityBounds = map[string]Bounds{
		"vegas": {
			SouthWestCorner: logistics.NewLatLng(35.998416, -115.297696),
			NorthEastCorner: logistics.NewLatLng(36.279023, -115.079317),
		},
		"denver": {
			SouthWestCorner: logistics.NewLatLng(39.561763218406, -105.16138700281643),
			NorthEastCorner: logistics.NewLatLng(39.98671787980217, -104.7431061560565),
		},
		"tokyo": {
			SouthWestCorner: logistics.NewLatLng(35.62238847649132, 139.60805745733322),
			NorthEastCorner: logistics.NewLatLng(35.84282411616502, 139.834420692877),
		},
		"seatac": {
			SouthWestCorner: logistics.NewLatLng(46.98286171247081, -122.99343270849585),
			NorthEastCorner: logistics.NewLatLng(48.07294329276645, -121.86396431437564),
		},
		"sfbay": {
			SouthWestCorner: logistics.NewLatLng(36.88481024530851, -122.66372466970272),
			NorthEastCorner: logistics.NewLatLng(38.934567506513126, -120.97444362391387),
		},
		"la": {
			SouthWestCorner: logistics.NewLatLng(33.55206688969294, -118.58738939306902),
			NorthEastCorner: logistics.NewLatLng(34.29355051546901, -117.09380973294012),
		},
		"dc": {
			SouthWestCorner: logistics.NewLatLng(38.66439572719239, -77.374638940966),
			NorthEastCorner: logistics.NewLatLng(39.481157565537465, -76.39952556683262),
		},
		"col": {
			SouthWestCorner: logistics.NewLatLng(39.8799339991594, -83.17743665910152),
			NorthEastCorner: logistics.NewLatLng(40.15287771166165, -82.81212381653911),
		},
	}
)

const (
	vrpStatusPollIntervalInfeasible = 750 * time.Millisecond
	vrpStatusPollIntervalFeasible   = 500 * time.Millisecond

	contentTypeHeader = "Content-Type"
	jsonContentType   = "application/json"
)

type Bounds struct {
	SouthWestCorner logistics.LatLng
	NorthEastCorner logistics.LatLng
}

func getCityBounds(query url.Values) Bounds {
	city := query.Get("city")
	bounds, ok := cityBounds[city]
	if !ok {
		bounds = cityBounds["vegas"]
	}

	return bounds
}

type DevServer struct {
	*Server

	vrpRespCacheMx sync.RWMutex
	vrpRespCache   map[string]*optimizer.WrappedSolveVRPResp
}

func NewDevServer(s *Server) *DevServer {
	return &DevServer{
		Server:       s,
		vrpRespCache: map[string]*optimizer.WrappedSolveVRPResp{},
	}
}

func (s *DevServer) exampleVRPBounds(w http.ResponseWriter, r *http.Request) {
	bounds := getCityBounds(r.URL.Query())
	buf, _ := json.Marshal([]logistics.LatLng{bounds.SouthWestCorner, bounds.NorthEastCorner})

	w.Header().Set("Content-Type", jsonContentType)
	w.Write(buf)
}

func (s *DevServer) exampleVRP(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()

	shiftTeamCount := 1
	shiftTeamsStr := query.Get("shift_teams")
	var err error
	if shiftTeamsStr != "" {
		shiftTeamCount, err = strconv.Atoi(shiftTeamsStr)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
	}
	visitCount := 5
	visitCountStr := query.Get("visits")
	if visitCountStr != "" {
		visitCount, err = strconv.Atoi(visitCountStr)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
	}
	terminationMs := 1000
	terminationMsStr := query.Get("vrp_termination_ms")
	if terminationMsStr != "" {
		terminationMs, err = strconv.Atoi(terminationMsStr)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
	}
	randSeed := 0
	randSeedStr := query.Get("vrp_rand_seed")
	if randSeedStr != "" {
		randSeed, err = strconv.Atoi(randSeedStr)
		if err != nil {
			w.WriteHeader(http.StatusBadRequest)
			w.Write([]byte(err.Error()))
			return
		}
	}

	bounds := getCityBounds(query)
	desc, err := demo.GenVRPDescription(r.Context(), demo.DescriptionConfig{
		ShiftTeamCount:             shiftTeamCount,
		ShiftDuration:              10 * time.Hour,
		VisitCount:                 visitCount,
		VisitArrivalWindowDuration: 2 * time.Hour,
		VisitServiceDuration:       45 * time.Minute,

		SouthWestCorner: bounds.SouthWestCorner,
		NorthEastCorner: bounds.NorthEastCorner,

		MapService: demo.VRPMapService{
			MapService:                s.MapService,
			NearestWaypointMapService: s.NearestWaypointMapService,
		},
	}, rand.New(rand.NewSource(int64(randSeed))))
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	vrpReq := &optimizerpb.SolveVRPRequest{
		Config: &optimizerpb.VRPConfig{
			TerminationDurationMs:                  proto.Int64(int64(terminationMs)),
			UnimprovedScoreTerminationDurationMs:   proto.Int64(500),
			IncludeIntermediateInfeasibleSolutions: proto.Bool(true),
			TerminationType:                        optimizerpb.VRPConfig_TERMINATION_TYPE_BEST_FOR_TIME.Enum(),
			ConstraintConfig:                       optimizer.DefaultConstraintConfig.ToProto(),
			IncludeIntermediateSolutions:           proto.Bool(false),
		},
		Problem: &optimizerpb.VRPProblem{Description: desc},
	}

	marshaler := protojson.MarshalOptions{
		Multiline:     true,
		Indent:        "  ",
		UseProtoNames: true,
	}
	buf, err := marshaler.Marshal(vrpReq)
	if err != nil {
		w.WriteHeader(http.StatusInternalServerError)
		return
	}

	w.Header().Set(contentTypeHeader, jsonContentType)
	w.Write(buf)
}

type vrpStatusJSON struct {
	Response *optimizer.WrappedSolveVRPResp `json:"response"`

	Token      string `json:"token"`
	NextPollMS int    `json:"next_poll_ms"`
}

func (s *DevServer) solveVRPStatus(w http.ResponseWriter, r *http.Request) {
	query := r.URL.Query()
	token := query.Get("token")

	s.vrpRespCacheMx.RLock()
	resp, ok := s.vrpRespCache[token]
	s.vrpRespCacheMx.RUnlock()

	if !ok {
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	var nextPollInterval time.Duration
	status := *resp.Response.Status
	switch status {
	case optimizerpb.SolveVRPResponse_STATUS_INTERMEDIATE_FEASIBLE_SOLUTION:
		nextPollInterval = vrpStatusPollIntervalFeasible
	case optimizerpb.SolveVRPResponse_STATUS_INTERMEDIATE_INFEASIBLE_SOLUTION:
		nextPollInterval = vrpStatusPollIntervalInfeasible
	}

	w.Header().Set(contentTypeHeader, jsonContentType)
	buf, _ := json.MarshalIndent(vrpStatusJSON{
		Response:   resp,
		Token:      token,
		NextPollMS: int(nextPollInterval.Milliseconds()),
	}, "", "  ")
	w.Write(buf)
}

func (s *DevServer) solveVRP(w http.ResponseWriter, r *http.Request) {
	log.Println("solveVRP")

	defer r.Body.Close()

	var req optimizerpb.SolveVRPRequest

	protobuf, err := io.ReadAll(r.Body)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}
	err = protojson.Unmarshal(protobuf, &req)
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	if s.Optimizer == nil {
		w.WriteHeader(http.StatusInternalServerError)
		w.Write([]byte("no optimizer"))
		return
	}

	vrpSolver := optimizer.VRPSolver{
		OptimizerServiceClient: optimizerpb.NewOptimizerServiceClient(s.Optimizer),
		SolveVRPLogisticsDB:    s.LogisticsDB,
		RouteProvider:          s.MapService,
	}

	respChan, err := vrpSolver.SolveVRP(r.Context(), &optimizer.SolveVRPParams{
		SolveVRPRequest: &req,
		OptimizerRun: &logisticssql.OptimizerRun{
			ServiceVersion: buildinfo.Version,
		},
		OptimizerRunType: logisticsdb.ServiceRegionScheduleRunType,
		WriteToDatabase:  true,
	})
	if err != nil {
		log.Println(err)
		w.WriteHeader(http.StatusBadRequest)
		return
	}

	token := vrpProblemHash(&req)

	var wg sync.WaitGroup
	wg.Add(1)

	var firstResp *optimizer.WrappedSolveVRPResp
	go func() {
		for resp := range respChan {
			if firstResp == nil {
				firstResp = resp
				wg.Done()
			}

			s.vrpRespCacheMx.Lock()
			s.vrpRespCache[token] = resp
			s.vrpRespCacheMx.Unlock()
		}
	}()

	wg.Wait()

	w.Header().Set(contentTypeHeader, jsonContentType)
	buf, _ := json.MarshalIndent(vrpStatusJSON{
		Response:   firstResp,
		NextPollMS: int(vrpStatusPollIntervalInfeasible.Milliseconds()),
		Token:      token,
	}, "", "  ")
	w.Write(buf)
}

func vrpProblemHash(req *optimizerpb.SolveVRPRequest) string {
	buf, _ := proto.Marshal(req)

	h := sha1.New()
	h.Write(buf)
	hash := h.Sum(nil)

	return base64.RawURLEncoding.EncodeToString(hash)
}

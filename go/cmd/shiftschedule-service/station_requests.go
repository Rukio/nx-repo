package main

import (
	"context"
	"net/http"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/station"
)

type StationMarket struct {
	ID        int64  `json:"id"`
	Name      string `json:"name"`
	ShortName string `json:"short_name"`
	State     string `json:"state"`
}

type StationOnCallShiftTeam struct {
	ID                *int64    `json:"id,omitempty"`
	OnCallDoctorID    *int64    `json:"on_call_doctor_id,omitempty"`
	OnCallDoctorEmail *string   `json:"on_call_doctor_email,omitempty"`
	MarketIDs         []int64   `json:"market_ids"`
	StartTime         time.Time `json:"start_time"`
	EndTime           time.Time `json:"end_time"`
}

type StationOnCallShiftTeamRequest struct {
	StationOnCallShiftTeam *StationOnCallShiftTeam `json:"on_call_shift_team"`
}

func (s *GRPCServer) fetchStationMarkets(ctx context.Context) ([]StationMarket, error) {
	var stationMarkets []StationMarket
	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method:   http.MethodGet,
		Path:     "/api/markets",
		RespData: &stationMarkets,
	})
	if err != nil {
		return nil, err
	}
	return stationMarkets, nil
}

func (s *GRPCServer) createStationOnCallShiftTeam(ctx context.Context, req *StationOnCallShiftTeamRequest) (*StationOnCallShiftTeam, error) {
	var stationOnCallShiftTeam StationOnCallShiftTeam
	err := s.StationClient.Request(ctx, &station.RequestConfig{
		Method:   http.MethodPost,
		Path:     "/api/on_call_shift_teams",
		RespData: &stationOnCallShiftTeam,
		ReqBody:  req,
	})
	if err != nil {
		return nil, err
	}
	return &stationOnCallShiftTeam, nil
}

package providernotifications

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"

	"github.com/*company-data-covered*/services/go/pkg/station"
)

type StationMarket struct {
	ID           int64  `json:"id"`
	Name         string `json:"name"`
	ShortName    string `json:"short_name"`
	State        string `json:"state"`
	TimeZoneName string `json:"tz_name"`
}

type StationShiftTeam struct {
	ID        int64      `json:"id"`
	MarketID  *int64     `json:"market_id,omitempty"`
	StartTime string     `json:"start_time"`
	EndTime   string     `json:"end_time"`
	Car       StationCar `json:"car"`
}

type StationCar struct {
	ID    *int64  `json:"id,omitempty"`
	Phone *string `json:"phone,omitempty"`
}

type StationClient struct {
	StationHTTPClient *station.Client
}

func (sc *StationClient) FetchStationMarkets(ctx context.Context) ([]StationMarket, error) {
	var stationMarkets []StationMarket
	err := sc.StationHTTPClient.Request(ctx, &station.RequestConfig{
		Method:   http.MethodGet,
		Path:     "/api/markets",
		RespData: &stationMarkets,
	})
	if err != nil {
		return nil, err
	}
	return stationMarkets, nil
}

func (sc *StationClient) FetchStationShiftTeam(ctx context.Context, shiftTeamID int64) (*StationShiftTeam, error) {
	var stationShiftTeam StationShiftTeam
	err := sc.StationHTTPClient.Request(ctx, &station.RequestConfig{
		Method:   http.MethodGet,
		Path:     fmt.Sprintf("api/shift_teams/%d", shiftTeamID),
		RespData: &stationShiftTeam,
	})
	if err != nil {
		return nil, err
	}
	return &stationShiftTeam, nil
}

func (sc *StationClient) FetchStationShiftTeamsByIDs(ctx context.Context, shiftTeamIDs []int64) ([]StationShiftTeam, error) {
	if len(shiftTeamIDs) == 0 {
		return []StationShiftTeam{}, nil
	}

	queryParams := url.Values{}
	var shiftTeamIDsString []string
	for _, shiftTeamID := range shiftTeamIDs {
		shiftTeamIDsString = append(shiftTeamIDsString, strconv.FormatInt(shiftTeamID, 10))
	}
	shiftTeamIDsQueryString := strings.Join(shiftTeamIDsString, ",")
	queryParams.Add("ids", shiftTeamIDsQueryString)

	var stationShiftTeams []StationShiftTeam
	err := sc.StationHTTPClient.Request(ctx, &station.RequestConfig{
		Method:      http.MethodGet,
		Path:        "api/shift_teams",
		RespData:    &stationShiftTeams,
		QueryParams: queryParams,
	})
	if err != nil {
		return nil, err
	}
	return stationShiftTeams, nil
}

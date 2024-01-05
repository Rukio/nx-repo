package main

import (
	"context"
	"encoding/json"
	"io"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	shiftschedulepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_schedule"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

func TestNewGRPCServer(t *testing.T) {
	token := mockAuthValuer{}
	type args struct {
		stationClient    *station.Client
		shiftAdminClient *ShiftAdminClient
		logger           *zap.SugaredLogger
	}
	tcs := []struct {
		desc string
		args args
		want *GRPCServer
	}{
		{
			desc: "should instantiate a GRPCServer with provided args",
			args: args{
				stationClient:    &station.Client{AuthToken: token},
				shiftAdminClient: &ShiftAdminClient{},
				logger:           zap.NewNop().Sugar(),
			},
			want: &GRPCServer{
				StationClient:    &station.Client{AuthToken: token},
				ShiftAdminClient: &ShiftAdminClient{},
				Logger:           zap.NewNop().Sugar(),
			},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			got := NewGRPCServer(tc.args.stationClient, tc.args.shiftAdminClient, zap.NewNop().Sugar())
			testutils.MustMatch(t, tc.want, got, "GRPCServer doesn't match")
		})
	}
}

func TestSyncStationOnCallShiftsFromShiftAdmin(t *testing.T) {
	loc, err := time.LoadLocation("America/Denver")
	if err != nil {
		t.Fatal(err)
	}
	startTime, err := time.ParseInLocation(scheduledShiftTimeLayout, "12/27/2022 16:00", loc)
	if err != nil {
		t.Fatal(err)
	}
	endTime, err := time.ParseInLocation(scheduledShiftTimeLayout, "12/28/2022 01:00", loc)
	if err != nil {
		t.Fatal(err)
	}
	tomorrowDate := time.Now().AddDate(0, 0, 1).Format(dateLayout)
	goodStationMarketsResponse := []StationMarket{
		{
			ID:        1,
			Name:      "Denver",
			ShortName: "DEN",
			State:     "CO",
		},
		{
			ID:        2,
			Name:      "Colorado Springs",
			ShortName: "COS",
			State:     "CO",
		},
		{
			ID:        3,
			Name:      "Las Vegas",
			ShortName: "LAS",
			State:     "NV",
		},
	}
	goodStationCreateShiftResponse := StationOnCallShiftTeam{
		ID:             proto.Int64(1),
		OnCallDoctorID: proto.Int64(1),
		MarketIDs:      []int64{1, 2},
		StartTime:      startTime.UTC(),
		EndTime:        endTime.UTC(),
	}
	goodShiftAdminScheduledShift := ShiftAdminScheduledShift{
		ScheduledShiftID: 1,
		GroupID:          *shiftAdminVirtualGroupID,
		UserID:           123,
		EmployeeID:       "1",
		FirstName:        "John",
		LastName:         "Doe",
		ShiftName:        "Colorado Virtual Doctor",
		ShiftShortName:   "CO PM",
		ShiftStart:       "12/27/2022 16:00",
		ShiftEnd:         "12/28/2022 01:00",
	}
	goodShiftAdminGroupsResponse := []ShiftAdminGroup{
		{
			GroupID:   *shiftAdminVirtualGroupID,
			Name:      "Virtual Doctor",
			ShortName: "Virtual Doc",
			TimeZone:  "America/Denver",
			IsActive:  1,
		},
		{
			GroupID:   24,
			Name:      "Richmond, VA - DHMT",
			ShortName: "Richmond, VA - DHMT",
			TimeZone:  "America/New_York",
			IsActive:  1,
		},
	}
	goodShiftAdminUsersResponse := []ShiftAdminUser{
		{
			UserID:     123,
			EmployeeID: "1",
			FirstName:  "John",
			LastName:   "Doe",
			Email:      "John.Doe@dispatch.com",
		},
	}
	goodOnCallShiftTeamBody := StationOnCallShiftTeam{
		OnCallDoctorEmail: proto.String("John.Doe@dispatch.com"),
		MarketIDs:         []int64{1, 2},
		StartTime:         startTime,
		EndTime:           endTime,
	}
	tcs := []struct {
		desc string

		args *shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest

		stationHTTPStatus       map[string]int
		stationHTTPResponse     map[string]any
		wantOnCallShiftTeamBody *StationOnCallShiftTeam

		shiftAdminHTTPStatus      map[string]int
		shiftAdminHTTPResponse    map[string]any
		wantShiftAdminRequestBody *FetchShiftAdminScheduledShiftsRequest

		want           *shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminResponse
		wantStatusCode codes.Code
	}{
		{
			desc: "should work successfully",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{},

			stationHTTPStatus:       map[string]int{"GET /api/markets": http.StatusOK, "POST /api/on_call_shift_teams": http.StatusOK},
			stationHTTPResponse:     map[string]any{"GET /api/markets": goodStationMarketsResponse, "POST /api/on_call_shift_teams": goodStationCreateShiftResponse},
			wantOnCallShiftTeamBody: &goodOnCallShiftTeamBody,

			shiftAdminHTTPStatus: map[string]int{"POST /vdh/org_groups": http.StatusOK, "POST /vdh/org_scheduled_shifts": http.StatusOK, "POST /vdh/org_users": http.StatusOK},
			shiftAdminHTTPResponse: map[string]any{
				"POST /vdh/org_groups": goodShiftAdminGroupsResponse,
				"POST /vdh/org_scheduled_shifts": []ShiftAdminScheduledShift{
					goodShiftAdminScheduledShift,
				},
				"POST /vdh/org_users": goodShiftAdminUsersResponse,
			},
			wantShiftAdminRequestBody: &FetchShiftAdminScheduledShiftsRequest{
				StartDate: tomorrowDate,
				EndDate:   tomorrowDate,
				GroupID:   *shiftAdminVirtualGroupID,
				Sort:      "shift_id:ASC",
			},

			want:           &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminResponse{},
			wantStatusCode: codes.OK,
		},
		{
			desc: "should work successfully with specified interval in the request",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{StartDate: &common.Date{Year: 2023, Month: 1, Day: 1}, EndDate: &common.Date{Year: 2023, Month: 1, Day: 5}},

			stationHTTPStatus:       map[string]int{"GET /api/markets": http.StatusOK, "POST /api/on_call_shift_teams": http.StatusOK},
			stationHTTPResponse:     map[string]any{"GET /api/markets": goodStationMarketsResponse, "POST /api/on_call_shift_teams": goodStationCreateShiftResponse},
			wantOnCallShiftTeamBody: &goodOnCallShiftTeamBody,

			shiftAdminHTTPStatus: map[string]int{"POST /vdh/org_groups": http.StatusOK, "POST /vdh/org_scheduled_shifts": http.StatusOK, "POST /vdh/org_users": http.StatusOK},
			shiftAdminHTTPResponse: map[string]any{
				"POST /vdh/org_groups": goodShiftAdminGroupsResponse,
				"POST /vdh/org_scheduled_shifts": []ShiftAdminScheduledShift{
					goodShiftAdminScheduledShift,
				},
				"POST /vdh/org_users": goodShiftAdminUsersResponse,
			},
			wantShiftAdminRequestBody: &FetchShiftAdminScheduledShiftsRequest{
				StartDate: "2023-01-01",
				EndDate:   "2023-01-05",
				GroupID:   *shiftAdminVirtualGroupID,
				Sort:      "shift_id:ASC",
			},

			want:           &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminResponse{},
			wantStatusCode: codes.OK,
		},
		{
			desc: "should create on_call_shift in special market when specified in scheduled shift",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{},

			stationHTTPStatus:   map[string]int{"GET /api/markets": http.StatusOK, "POST /api/on_call_shift_teams": http.StatusOK},
			stationHTTPResponse: map[string]any{"GET /api/markets": goodStationMarketsResponse, "POST /api/on_call_shift_teams": goodStationCreateShiftResponse},
			wantOnCallShiftTeamBody: &StationOnCallShiftTeam{
				OnCallDoctorEmail: proto.String("John.Doe@dispatch.com"),
				MarketIDs:         []int64{2},
				StartTime:         startTime,
				EndTime:           endTime,
			},

			shiftAdminHTTPStatus: map[string]int{"POST /vdh/org_groups": http.StatusOK, "POST /vdh/org_scheduled_shifts": http.StatusOK, "POST /vdh/org_users": http.StatusOK},
			shiftAdminHTTPResponse: map[string]any{
				"POST /vdh/org_groups": goodShiftAdminGroupsResponse,
				"POST /vdh/org_scheduled_shifts": []ShiftAdminScheduledShift{
					{
						ScheduledShiftID: 1,
						GroupID:          *shiftAdminVirtualGroupID,
						UserID:           123,
						EmployeeID:       "1",
						FirstName:        "John",
						LastName:         "Doe",
						ShiftName:        "Colorado Virtual Doctor",
						ShiftShortName:   "CO COS PM",
						ShiftStart:       "12/27/2022 16:00",
						ShiftEnd:         "12/28/2022 01:00",
					},
				},
				"POST /vdh/org_users": goodShiftAdminUsersResponse,
			},
			wantShiftAdminRequestBody: &FetchShiftAdminScheduledShiftsRequest{
				StartDate: tomorrowDate,
				EndDate:   tomorrowDate,
				GroupID:   *shiftAdminVirtualGroupID,
				Sort:      "shift_id:ASC",
			},

			want:           &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminResponse{},
			wantStatusCode: codes.OK,
		},
		{
			desc: "should return error when StartDate argument provided without EndDate",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{StartDate: &common.Date{Year: 2023, Month: 1, Day: 1}},

			wantStatusCode: codes.InvalidArgument,
		},
		{
			desc: "should return error when EndDate argument provided without StartDate",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{EndDate: &common.Date{Year: 2023, Month: 1, Day: 5}},

			wantStatusCode: codes.InvalidArgument,
		},
		{
			desc: "should return error when unable to get station markets",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{},

			stationHTTPStatus: map[string]int{"GET /api/markets": http.StatusInternalServerError},

			wantStatusCode: codes.Internal,
		},
		{
			desc: "should return error when unable to get groups from shiftAdmin api",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{},

			stationHTTPStatus:    map[string]int{"GET /api/markets": http.StatusOK},
			stationHTTPResponse:  map[string]any{"GET /api/markets": goodStationMarketsResponse},
			shiftAdminHTTPStatus: map[string]int{"POST /vdh/org_groups": http.StatusInternalServerError},

			wantStatusCode: codes.Internal,
		},
		{
			desc: "should return error when unable to get scheduled shifts from shiftAdmin api",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{},

			stationHTTPStatus:      map[string]int{"GET /api/markets": http.StatusOK},
			stationHTTPResponse:    map[string]any{"GET /api/markets": goodStationMarketsResponse},
			shiftAdminHTTPStatus:   map[string]int{"POST /vdh/org_groups": http.StatusOK, "POST /vdh/org_scheduled_shifts": http.StatusInternalServerError},
			shiftAdminHTTPResponse: map[string]any{"POST /vdh/org_groups": goodShiftAdminGroupsResponse},

			wantStatusCode: codes.Internal,
		},
		{
			desc: "should return error when unable to get users from shiftAdmin api",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{},

			stationHTTPStatus:    map[string]int{"GET /api/markets": http.StatusOK},
			stationHTTPResponse:  map[string]any{"GET /api/markets": goodStationMarketsResponse},
			shiftAdminHTTPStatus: map[string]int{"POST /vdh/org_groups": http.StatusOK, "POST /vdh/org_scheduled_shifts": http.StatusOK, "POST /vdh/org_users": http.StatusInternalServerError},
			shiftAdminHTTPResponse: map[string]any{
				"POST /vdh/org_groups": goodShiftAdminGroupsResponse,
				"POST /vdh/org_scheduled_shifts": []ShiftAdminScheduledShift{
					goodShiftAdminScheduledShift,
				},
			},

			wantStatusCode: codes.Internal,
		},
		{
			desc: "should skip scheduled shift when can't find shift admin user by id",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{},

			stationHTTPStatus:       map[string]int{"GET /api/markets": http.StatusOK, "POST /api/on_call_shift_teams": http.StatusOK},
			stationHTTPResponse:     map[string]any{"GET /api/markets": goodStationMarketsResponse, "POST /api/on_call_shift_teams": goodStationCreateShiftResponse},
			wantOnCallShiftTeamBody: &goodOnCallShiftTeamBody,

			shiftAdminHTTPStatus: map[string]int{"POST /vdh/org_groups": http.StatusOK, "POST /vdh/org_scheduled_shifts": http.StatusOK, "POST /vdh/org_users": http.StatusOK},
			shiftAdminHTTPResponse: map[string]any{
				"POST /vdh/org_groups": goodShiftAdminGroupsResponse,
				"POST /vdh/org_scheduled_shifts": []ShiftAdminScheduledShift{
					goodShiftAdminScheduledShift,
					{
						ScheduledShiftID: 1,
						GroupID:          *shiftAdminVirtualGroupID,
						UserID:           125,
						EmployeeID:       "1",
						FirstName:        "John",
						LastName:         "Doe",
						ShiftName:        "Colorado Virtual Doctor",
						ShiftShortName:   "CO PM",
						ShiftStart:       "12/27/2022 16:00",
						ShiftEnd:         "12/28/2022 01:00",
					},
				},
				"POST /vdh/org_users": goodShiftAdminUsersResponse,
			},
			want:           &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminResponse{},
			wantStatusCode: codes.OK,
		},
		{
			desc: "should skip scheduled shift on parsing shift_start error",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{},

			stationHTTPStatus:       map[string]int{"GET /api/markets": http.StatusOK, "POST /api/on_call_shift_teams": http.StatusOK},
			stationHTTPResponse:     map[string]any{"GET /api/markets": goodStationMarketsResponse, "POST /api/on_call_shift_teams": goodStationCreateShiftResponse},
			wantOnCallShiftTeamBody: &goodOnCallShiftTeamBody,

			shiftAdminHTTPStatus: map[string]int{"POST /vdh/org_groups": http.StatusOK, "POST /vdh/org_scheduled_shifts": http.StatusOK, "POST /vdh/org_users": http.StatusOK},
			shiftAdminHTTPResponse: map[string]any{
				"POST /vdh/org_groups": goodShiftAdminGroupsResponse,
				"POST /vdh/org_scheduled_shifts": []ShiftAdminScheduledShift{
					goodShiftAdminScheduledShift,
					{
						ScheduledShiftID: 1,
						GroupID:          *shiftAdminVirtualGroupID,
						UserID:           123,
						EmployeeID:       "1",
						FirstName:        "John",
						LastName:         "Doe",
						ShiftName:        "Colorado Virtual Doctor",
						ShiftShortName:   "CO PM",
						ShiftStart:       "12272022 16:00",
						ShiftEnd:         "12/28/2022 01:00",
					},
				},
				"POST /vdh/org_users": goodShiftAdminUsersResponse,
			},
			want:           &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminResponse{},
			wantStatusCode: codes.OK,
		},
		{
			desc: "should skip scheduled shift on parsing shift_end error",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{},

			stationHTTPStatus:       map[string]int{"GET /api/markets": http.StatusOK, "POST /api/on_call_shift_teams": http.StatusOK},
			stationHTTPResponse:     map[string]any{"GET /api/markets": goodStationMarketsResponse, "POST /api/on_call_shift_teams": goodStationCreateShiftResponse},
			wantOnCallShiftTeamBody: &goodOnCallShiftTeamBody,

			shiftAdminHTTPStatus: map[string]int{"POST /vdh/org_groups": http.StatusOK, "POST /vdh/org_scheduled_shifts": http.StatusOK, "POST /vdh/org_users": http.StatusOK},
			shiftAdminHTTPResponse: map[string]any{
				"POST /vdh/org_groups": goodShiftAdminGroupsResponse,
				"POST /vdh/org_scheduled_shifts": []ShiftAdminScheduledShift{
					goodShiftAdminScheduledShift,
					{
						ScheduledShiftID: 1,
						GroupID:          *shiftAdminVirtualGroupID,
						UserID:           123,
						EmployeeID:       "1",
						FirstName:        "John",
						LastName:         "Doe",
						ShiftName:        "Colorado Virtual Doctor",
						ShiftShortName:   "CO PM",
						ShiftStart:       "12/27/2022 16:00",
						ShiftEnd:         "12282022 01:00",
					},
				},
				"POST /vdh/org_users": goodShiftAdminUsersResponse,
			},
			want:           &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminResponse{},
			wantStatusCode: codes.OK,
		},
		{
			desc: "should skip scheduled shift on parsing state error",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{},

			stationHTTPStatus:       map[string]int{"GET /api/markets": http.StatusOK, "POST /api/on_call_shift_teams": http.StatusOK},
			stationHTTPResponse:     map[string]any{"GET /api/markets": goodStationMarketsResponse, "POST /api/on_call_shift_teams": goodStationCreateShiftResponse},
			wantOnCallShiftTeamBody: &goodOnCallShiftTeamBody,

			shiftAdminHTTPStatus: map[string]int{"POST /vdh/org_groups": http.StatusOK, "POST /vdh/org_scheduled_shifts": http.StatusOK, "POST /vdh/org_users": http.StatusOK},
			shiftAdminHTTPResponse: map[string]any{
				"POST /vdh/org_groups": goodShiftAdminGroupsResponse,
				"POST /vdh/org_scheduled_shifts": []ShiftAdminScheduledShift{
					goodShiftAdminScheduledShift,
					{
						ScheduledShiftID: 1,
						GroupID:          *shiftAdminVirtualGroupID,
						UserID:           123,
						EmployeeID:       "1",
						FirstName:        "John",
						LastName:         "Doe",
						ShiftName:        "Colorado Virtual Doctor",
						ShiftShortName:   "",
						ShiftStart:       "12/27/2022 16:00",
						ShiftEnd:         "12/28/2022 01:00",
					},
				},
				"POST /vdh/org_users": goodShiftAdminUsersResponse,
			},
			want:           &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminResponse{},
			wantStatusCode: codes.OK,
		},
		{
			desc: "should skip scheduled shift on searching station market error",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{},

			stationHTTPStatus:       map[string]int{"GET /api/markets": http.StatusOK, "POST /api/on_call_shift_teams": http.StatusOK},
			stationHTTPResponse:     map[string]any{"GET /api/markets": goodStationMarketsResponse, "POST /api/on_call_shift_teams": goodStationCreateShiftResponse},
			wantOnCallShiftTeamBody: &goodOnCallShiftTeamBody,

			shiftAdminHTTPStatus: map[string]int{"POST /vdh/org_groups": http.StatusOK, "POST /vdh/org_scheduled_shifts": http.StatusOK, "POST /vdh/org_users": http.StatusOK},
			shiftAdminHTTPResponse: map[string]any{
				"POST /vdh/org_groups": goodShiftAdminGroupsResponse,
				"POST /vdh/org_scheduled_shifts": []ShiftAdminScheduledShift{
					goodShiftAdminScheduledShift,
					{
						ScheduledShiftID: 1,
						GroupID:          *shiftAdminVirtualGroupID,
						UserID:           123,
						EmployeeID:       "1",
						FirstName:        "John",
						LastName:         "Doe",
						ShiftName:        "New York Virtual Doctor",
						ShiftShortName:   "NY PM",
						ShiftStart:       "12/27/2022 16:00",
						ShiftEnd:         "12/28/2022 01:00",
					},
				},
				"POST /vdh/org_users": goodShiftAdminUsersResponse,
			},
			want:           &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminResponse{},
			wantStatusCode: codes.OK,
		},
		{
			desc: "should skip scheduled shifts on station create on_call_shift_team request error",

			args: &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{},

			stationHTTPStatus:       map[string]int{"GET /api/markets": http.StatusOK, "POST /api/on_call_shift_teams": http.StatusConflict},
			stationHTTPResponse:     map[string]any{"GET /api/markets": goodStationMarketsResponse, "POST /api/on_call_shift_teams": nil},
			wantOnCallShiftTeamBody: &goodOnCallShiftTeamBody,

			shiftAdminHTTPStatus: map[string]int{"POST /vdh/org_groups": http.StatusOK, "POST /vdh/org_scheduled_shifts": http.StatusOK, "POST /vdh/org_users": http.StatusOK},
			shiftAdminHTTPResponse: map[string]any{
				"POST /vdh/org_groups": goodShiftAdminGroupsResponse,
				"POST /vdh/org_scheduled_shifts": []ShiftAdminScheduledShift{
					goodShiftAdminScheduledShift,
				},
				"POST /vdh/org_users": goodShiftAdminUsersResponse,
			},
			want:           &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminResponse{},
			wantStatusCode: codes.OK,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus[req.Method+" "+req.RequestURI])
					if req.Method == http.MethodPost && tc.wantOnCallShiftTeamBody != nil {
						defer req.Body.Close()
						body, err := io.ReadAll(req.Body)
						if err != nil {
							t.Fatalf("Failed to read body: %s", err)
						}
						var reqBody StationOnCallShiftTeamRequest
						err = json.Unmarshal(body, &reqBody)
						if err != nil {
							t.Fatalf("Failed to unmarshal json into given struct: %s", err)
						}
						testutils.MustMatch(t, tc.wantOnCallShiftTeamBody, reqBody.StationOnCallShiftTeam)
					}
					if tc.stationHTTPResponse != nil {
						resp, err := json.Marshal(tc.stationHTTPResponse[req.Method+" "+req.RequestURI])
						if err != nil {
							t.Fatalf("Failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer stationServer.Close()

			shiftAdminServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.shiftAdminHTTPStatus[req.Method+" "+req.RequestURI])
					if tc.wantShiftAdminRequestBody != nil && req.RequestURI == "/vdh/org_scheduled_shifts" {
						defer req.Body.Close()
						body, err := io.ReadAll(req.Body)
						if err != nil {
							t.Fatalf("Failed to read body: %s", err)
						}
						var reqBody FetchShiftAdminScheduledShiftsRequest
						err = json.Unmarshal(body, &reqBody)
						if err != nil {
							t.Fatalf("Failed to unmarshal json into given struct: %s", err)
						}
						testutils.MustMatch(t, tc.wantShiftAdminRequestBody, &reqBody)
					}
					if tc.shiftAdminHTTPResponse != nil {
						resp, err := json.Marshal(tc.shiftAdminHTTPResponse[req.Method+" "+req.RequestURI])
						if err != nil {
							t.Fatalf("Failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer shiftAdminServer.Close()

			grpcServer := NewGRPCServer(&station.Client{
				AuthToken:  mockAuthValuer{},
				StationURL: stationServer.URL,
				HTTPClient: stationServer.Client(),
			}, &ShiftAdminClient{
				UserName:      "user",
				Password:      "password",
				HTTPClient:    shiftAdminServer.Client(),
				ShiftAdminURL: shiftAdminServer.URL,
			}, zap.NewNop().Sugar())

			resp, err := grpcServer.SyncStationOnCallShiftsFromShiftAdmin(context.Background(), tc.args)

			testutils.MustMatch(t, tc.wantStatusCode, status.Code(err))
			testutils.MustMatch(t, tc.want, resp, "wrong result")
		})
	}
}

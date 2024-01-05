package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/station"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

func TestSyncOnCallShiftsJob(t *testing.T) {
	startTime, err := time.Parse(scheduledShiftTimeLayout, "12/27/2022 16:00")
	if err != nil {
		t.Fatal(err)
	}
	endTime, err := time.Parse(scheduledShiftTimeLayout, "12/28/2022 01:00")
	if err != nil {
		t.Fatal(err)
	}
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
		StartTime:      startTime,
		EndTime:        endTime,
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
	tcs := []struct {
		desc string

		stationHTTPStatus   map[string]int
		stationHTTPResponse map[string]any

		shiftAdminHTTPStatus   int
		shiftAdminHTTPResponse []ShiftAdminScheduledShift

		wantError bool
	}{
		{
			desc: "should work successfully",

			stationHTTPStatus:   map[string]int{"GET": http.StatusOK, "POST": http.StatusOK},
			stationHTTPResponse: map[string]any{"GET": goodStationMarketsResponse, "POST": goodStationCreateShiftResponse},

			shiftAdminHTTPStatus: http.StatusOK,
			shiftAdminHTTPResponse: []ShiftAdminScheduledShift{
				goodShiftAdminScheduledShift,
			},

			wantError: false,
		},
		{
			desc: "should return error when SyncStationOnCallShiftsFromShiftAdmin fails",

			stationHTTPStatus:    map[string]int{"GET": http.StatusInternalServerError},
			shiftAdminHTTPStatus: http.StatusOK,

			wantError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus[req.Method])
					if tc.stationHTTPResponse != nil {
						resp, err := json.Marshal(tc.stationHTTPResponse[req.Method])
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
					rw.WriteHeader(tc.shiftAdminHTTPStatus)
					if tc.shiftAdminHTTPResponse != nil {
						resp, err := json.Marshal(tc.shiftAdminHTTPResponse)
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

			err := grpcServer.SyncOnCallShiftsJob()
			if (err != nil) != tc.wantError {
				t.Fatalf("SyncOnCallShiftsJob() error = %v, wantError = %v", err, tc.wantError)
			}
		})
	}
}

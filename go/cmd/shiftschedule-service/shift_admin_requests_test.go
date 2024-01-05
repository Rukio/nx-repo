package main

import (
	"context"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestFetchScheduledShifts(t *testing.T) {
	goodResponse := []ShiftAdminScheduledShift{
		{
			ScheduledShiftID: 1,
			GroupID:          *shiftAdminVirtualGroupID,
			UserID:           123,
			EmployeeID:       "1",
			FirstName:        "John",
			LastName:         "Doe",
			ShiftName:        "Nevada Virtual Doctor",
			ShiftShortName:   "NV PM",
			ShiftStart:       "12/27/2022 16:00",
			ShiftEnd:         "12/28/2022 01:00",
		},
	}

	tcs := []struct {
		desc                 string
		shiftAdminHTTPStatus int
		shiftAdminResponse   any
		context              context.Context

		wantError      bool
		wantStatusCode codes.Code
		wantResponse   []ShiftAdminScheduledShift
	}{
		{
			desc:                 "should work successfully",
			shiftAdminHTTPStatus: http.StatusOK,
			shiftAdminResponse:   goodResponse,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse,
		},
		{
			desc:                 "should return error when unable to marshal response body",
			shiftAdminHTTPStatus: http.StatusOK,
			shiftAdminResponse: ShiftAdminScheduledShift{
				ScheduledShiftID: 1,
				GroupID:          *shiftAdminVirtualGroupID,
				UserID:           123,
				EmployeeID:       "1",
				FirstName:        "John",
				LastName:         "Doe",
				ShiftName:        "Nevada Virtual Doctor",
				ShiftShortName:   "NV PM",
				ShiftStart:       "12/27/2022 16:00",
				ShiftEnd:         "12/28/2022 01:00",
			},

			wantError:      true,
			wantStatusCode: codes.Internal,
		},
		{
			desc:                 "should return error when missing auth",
			shiftAdminHTTPStatus: http.StatusBadRequest,

			wantError:      true,
			wantStatusCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			shiftAdminServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.shiftAdminHTTPStatus)

					if tc.shiftAdminResponse != nil {
						resp, err := json.Marshal(tc.shiftAdminResponse)
						if err != nil {
							t.Fatalf("Failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer shiftAdminServer.Close()

			s := &GRPCServer{
				ShiftAdminClient: &ShiftAdminClient{
					UserName:      "user",
					Password:      "password",
					HTTPClient:    shiftAdminServer.Client(),
					ShiftAdminURL: shiftAdminServer.URL,
				},
			}

			shiftAdminResponse, err := s.fetchScheduledShifts(context.Background(), &FetchShiftAdminScheduledShiftsRequest{StartDate: "2022-12-27", EndDate: "2022-12-27", GroupID: *shiftAdminVirtualGroupID, Sort: "shift_id:DESC"})
			if (err != nil) != tc.wantError {
				t.Fatalf("fetchScheduledShifts() error = %v, wantError = %v", err, tc.wantError)
			}
			testutils.MustMatch(t, tc.wantStatusCode, status.Code(err))

			testutils.MustMatch(t, tc.wantResponse, shiftAdminResponse)
		})
	}
}

func TestFetchGroups(t *testing.T) {
	goodResponse := []ShiftAdminGroup{
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

	tcs := []struct {
		desc                 string
		shiftAdminHTTPStatus int
		shiftAdminResponse   any
		context              context.Context

		wantError      bool
		wantStatusCode codes.Code
		wantResponse   []ShiftAdminGroup
	}{
		{
			desc:                 "should work successfully",
			shiftAdminHTTPStatus: http.StatusOK,
			shiftAdminResponse:   goodResponse,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse,
		},
		{
			desc:                 "should return error when unable to marshal response body",
			shiftAdminHTTPStatus: http.StatusOK,
			shiftAdminResponse: ShiftAdminGroup{
				GroupID:   *shiftAdminVirtualGroupID,
				Name:      "Virtual Doctor",
				ShortName: "Virtual Doc",
				TimeZone:  "America/Denver",
				IsActive:  1,
			},

			wantError:      true,
			wantStatusCode: codes.Internal,
		},
		{
			desc:                 "should return error when missing auth",
			shiftAdminHTTPStatus: http.StatusBadRequest,

			wantError:      true,
			wantStatusCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			shiftAdminServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.shiftAdminHTTPStatus)

					if tc.shiftAdminResponse != nil {
						resp, err := json.Marshal(tc.shiftAdminResponse)
						if err != nil {
							t.Fatalf("Failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer shiftAdminServer.Close()

			s := &GRPCServer{
				ShiftAdminClient: &ShiftAdminClient{
					UserName:      "user",
					Password:      "password",
					HTTPClient:    shiftAdminServer.Client(),
					ShiftAdminURL: shiftAdminServer.URL,
				},
			}

			shiftAdminResponse, err := s.fetchGroups(context.Background())
			if (err != nil) != tc.wantError {
				t.Fatalf("fetchGroups() error = %v, wantError = %v", err, tc.wantError)
			}
			testutils.MustMatch(t, tc.wantStatusCode, status.Code(err))

			testutils.MustMatch(t, tc.wantResponse, shiftAdminResponse)
		})
	}
}

func TestFetchUsers(t *testing.T) {
	goodResponse := []ShiftAdminUser{
		{
			UserID:     123,
			EmployeeID: "1",
			FirstName:  "John",
			LastName:   "Doe",
			Email:      "John.Doe@dispatch.com",
		},
	}

	tcs := []struct {
		desc                 string
		shiftAdminHTTPStatus int
		shiftAdminResponse   any
		context              context.Context

		wantError      bool
		wantStatusCode codes.Code
		wantResponse   []ShiftAdminUser
	}{
		{
			desc:                 "should work successfully",
			shiftAdminHTTPStatus: http.StatusOK,
			shiftAdminResponse:   goodResponse,

			wantStatusCode: codes.OK,
			wantResponse:   goodResponse,
		},
		{
			desc:                 "should return error when unable to marshal response body",
			shiftAdminHTTPStatus: http.StatusOK,
			shiftAdminResponse: ShiftAdminUser{
				UserID:     123,
				EmployeeID: "1",
				FirstName:  "John",
				LastName:   "Doe",
				Email:      "John.Doe@dispatch.com",
			},

			wantError:      true,
			wantStatusCode: codes.Internal,
		},
		{
			desc:                 "should return error when missing auth",
			shiftAdminHTTPStatus: http.StatusBadRequest,

			wantError:      true,
			wantStatusCode: codes.InvalidArgument,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			shiftAdminServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.shiftAdminHTTPStatus)

					if tc.shiftAdminResponse != nil {
						resp, err := json.Marshal(tc.shiftAdminResponse)
						if err != nil {
							t.Fatalf("Failed to marshal json: %s", err)
						}
						rw.Write(resp)
					}
				},
			))
			defer shiftAdminServer.Close()

			s := &GRPCServer{
				ShiftAdminClient: &ShiftAdminClient{
					UserName:      "user",
					Password:      "password",
					HTTPClient:    shiftAdminServer.Client(),
					ShiftAdminURL: shiftAdminServer.URL,
				},
			}

			shiftAdminResponse, err := s.fetchUsers(context.Background(), &FetchShiftAdminUsersRequest{GroupID: *shiftAdminVirtualGroupID})
			if (err != nil) != tc.wantError {
				t.Fatalf("fetchGroups() error = %v, wantError = %v", err, tc.wantError)
			}
			testutils.MustMatch(t, tc.wantStatusCode, status.Code(err))

			testutils.MustMatch(t, tc.wantResponse, shiftAdminResponse)
		})
	}
}

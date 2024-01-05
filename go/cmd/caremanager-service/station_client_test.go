package main

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"net/http/httptest"
	"net/url"
	"strconv"
	"testing"
	"time"

	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"

	addresspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/address"
	caremanagerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/caremanager"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	marketpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/market"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	userpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/user"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

type MockMarketServiceClient struct {
	GetMarketResult                   *marketpb.GetMarketResponse
	GetAuthenticatedUserMarketsResult *marketpb.GetAuthenticatedUserMarketsResponse
	GetMarketErr                      error
	GetAuthenticatedUserMarketsErr    error
}

func (c *MockMarketServiceClient) GetMarket(ctx context.Context, in *marketpb.GetMarketRequest, opts ...grpc.CallOption) (*marketpb.GetMarketResponse, error) {
	return c.GetMarketResult, c.GetMarketErr
}

func (c *MockMarketServiceClient) GetAuthenticatedUserMarkets(ctx context.Context, in *marketpb.GetAuthenticatedUserMarketsRequest, opts ...grpc.CallOption) (*marketpb.GetAuthenticatedUserMarketsResponse, error) {
	return c.GetAuthenticatedUserMarketsResult, c.GetAuthenticatedUserMarketsErr
}

type MockUserServiceClient struct {
	GetUserByIDResult               *userpb.GetUserByIDResponse
	GetUsersByIDResult              *userpb.GetUsersByIDResponse
	GetAuthenticatedUsersResult     *userpb.GetAuthenticatedUserResponse
	GetAuthenticatedUserRolesResult *userpb.GetAuthenticatedUserRolesResponse
	SearchUsersResult               *userpb.SearchUsersResponse
	GetUserByIDErr                  error
	GetUsersByIDErr                 error
	GetAuthenticatedUserErr         error
	GetAuthenticatedUserRolesErr    error
	SearchUsersErr                  error
}

func (c *MockUserServiceClient) GetUserByID(ctx context.Context, in *userpb.GetUserByIDRequest, opts ...grpc.CallOption) (*userpb.GetUserByIDResponse, error) {
	return c.GetUserByIDResult, c.GetUserByIDErr
}

func (c *MockUserServiceClient) GetUsersByID(ctx context.Context, in *userpb.GetUsersByIDRequest, opts ...grpc.CallOption) (*userpb.GetUsersByIDResponse, error) {
	return c.GetUsersByIDResult, c.GetUsersByIDErr
}

func (c *MockUserServiceClient) GetAuthenticatedUser(ctx context.Context, in *userpb.GetAuthenticatedUserRequest, opts ...grpc.CallOption) (*userpb.GetAuthenticatedUserResponse, error) {
	return c.GetAuthenticatedUsersResult, c.GetAuthenticatedUserErr
}

func (c *MockUserServiceClient) GetAuthenticatedUserRoles(ctx context.Context, in *userpb.GetAuthenticatedUserRolesRequest, opts ...grpc.CallOption) (*userpb.GetAuthenticatedUserRolesResponse, error) {
	return c.GetAuthenticatedUserRolesResult, c.GetAuthenticatedUserRolesErr
}

func (c *MockUserServiceClient) SearchUsers(ctx context.Context, in *userpb.SearchUsersRequest, opts ...grpc.CallOption) (*userpb.SearchUsersResponse, error) {
	return c.SearchUsersResult, c.SearchUsersErr
}

type MockAddressServiceClient struct {
	GetAddressesByIDResult *addresspb.GetAddressesByIDResponse
	GetAddressesByIDErr    error
}

func (c *MockAddressServiceClient) GetAddressesByID(ctx context.Context, in *addresspb.GetAddressesByIDRequest, opts ...grpc.CallOption) (*addresspb.GetAddressesByIDResponse, error) {
	return c.GetAddressesByIDResult, c.GetAddressesByIDErr
}

type MockShiftTeamServiceClient struct {
	shiftteampb.ShiftTeamServiceClient
	GetShiftTeamResult           *shiftteampb.GetShiftTeamResponse
	GetShiftTeamErr              error
	ListSoloDHMTShiftTeamsResult *shiftteampb.ListSoloDHMTShiftTeamsResponse
	ListSoloDHMTShiftTeamsErr    error
	ListCarsByIDsResult          *shiftteampb.ListCarsByIDsResponse
	ListCarsByIDsErr             error
}

func (c *MockShiftTeamServiceClient) GetShiftTeam(ctx context.Context, in *shiftteampb.GetShiftTeamRequest, opts ...grpc.CallOption) (*shiftteampb.GetShiftTeamResponse, error) {
	return c.GetShiftTeamResult, c.GetShiftTeamErr
}

func (c *MockShiftTeamServiceClient) ListSoloDHMTShiftTeams(ctx context.Context, in *shiftteampb.ListSoloDHMTShiftTeamsRequest, opts ...grpc.CallOption) (*shiftteampb.ListSoloDHMTShiftTeamsResponse, error) {
	return c.ListSoloDHMTShiftTeamsResult, c.ListSoloDHMTShiftTeamsErr
}

func (c *MockShiftTeamServiceClient) ListCarsByIDs(ctx context.Context, in *shiftteampb.ListCarsByIDsRequest, opts ...grpc.CallOption) (*shiftteampb.ListCarsByIDsResponse, error) {
	return c.ListCarsByIDsResult, c.ListCarsByIDsErr
}

type MockEpisodeServiceClient struct {
	episodepb.EpisodeServiceClient

	GetVisitResult                     *episodepb.GetVisitResponse
	GetVisitPossibleServiceLinesResult *episodepb.GetVisitPossibleServiceLinesResponse
	ListVisitsResult                   *episodepb.ListVisitsResponse
	DuplicateVisitResult               *episodepb.DuplicateVisitResponse
	UpsertVisitETARangeResult          *episodepb.UpsertVisitETARangeResponse
	SearchVisitsResult                 *episodepb.SearchVisitsResponse
	AssignVirtualAPPToVisitResult      *episodepb.AssignVirtualAPPToVisitResponse
	UnassignVirtualAPPFromVisitResult  *episodepb.UnassignVirtualAPPFromVisitResponse

	GetVisitErr                     error
	DuplicateVisitErr               error
	GetVisitPossibleServiceLinesErr error
	ListVisitsErr                   error
	UpsertVisitETARangeErr          error
	SearchVisitsErr                 error
	AssignVirtualAPPToVisitErr      error
	UnassignVirtualAPPFromVisitErr  error
}

func (c *MockEpisodeServiceClient) GetVisit(
	ctx context.Context,
	in *episodepb.GetVisitRequest,
	opts ...grpc.CallOption,
) (*episodepb.GetVisitResponse, error) {
	return c.GetVisitResult, c.GetVisitErr
}

func (c *MockEpisodeServiceClient) GetVisitPossibleServiceLines(
	ctx context.Context,
	in *episodepb.GetVisitPossibleServiceLinesRequest,
	opts ...grpc.CallOption,
) (*episodepb.GetVisitPossibleServiceLinesResponse, error) {
	return c.GetVisitPossibleServiceLinesResult, c.GetVisitPossibleServiceLinesErr
}

func (c *MockEpisodeServiceClient) ListVisits(
	ctx context.Context,
	in *episodepb.ListVisitsRequest,
	opts ...grpc.CallOption,
) (*episodepb.ListVisitsResponse, error) {
	return c.ListVisitsResult, c.ListVisitsErr
}

func (c *MockEpisodeServiceClient) DuplicateVisit(
	ctx context.Context,
	in *episodepb.DuplicateVisitRequest,
	opts ...grpc.CallOption,
) (*episodepb.DuplicateVisitResponse, error) {
	return c.DuplicateVisitResult, c.DuplicateVisitErr
}

func (c *MockEpisodeServiceClient) UpsertVisitETARange(
	ctx context.Context,
	in *episodepb.UpsertVisitETARangeRequest,
	opts ...grpc.CallOption,
) (*episodepb.UpsertVisitETARangeResponse, error) {
	return c.UpsertVisitETARangeResult, c.UpsertVisitETARangeErr
}

func (c *MockEpisodeServiceClient) SearchVisits(
	ctx context.Context,
	in *episodepb.SearchVisitsRequest,
	opts ...grpc.CallOption,
) (*episodepb.SearchVisitsResponse, error) {
	return c.SearchVisitsResult, c.SearchVisitsErr
}

func (c *MockEpisodeServiceClient) AssignVirtualAPPToVisit(
	ctx context.Context,
	in *episodepb.AssignVirtualAPPToVisitRequest,
	opts ...grpc.CallOption,
) (*episodepb.AssignVirtualAPPToVisitResponse, error) {
	return c.AssignVirtualAPPToVisitResult, c.AssignVirtualAPPToVisitErr
}

func (c *MockEpisodeServiceClient) UnassignVirtualAPPFromVisit(
	ctx context.Context,
	in *episodepb.UnassignVirtualAPPFromVisitRequest,
	opts ...grpc.CallOption,
) (*episodepb.UnassignVirtualAPPFromVisitResponse, error) {
	return c.UnassignVirtualAPPFromVisitResult, c.UnassignVirtualAPPFromVisitErr
}

type stationClientParameters struct {
	stationURL       string
	httpClient       *http.Client
	marketService    *MockMarketServiceClient
	userService      *MockUserServiceClient
	addressService   *MockAddressServiceClient
	episodeService   *MockEpisodeServiceClient
	shiftTeamService *MockShiftTeamServiceClient
}

func getStationClient(params *stationClientParameters) *StationClient {
	return NewStationClient(NewStationClientParams{
		AuthEnabled:      true,
		StationURL:       params.stationURL,
		HTTPClient:       params.httpClient,
		MarketService:    params.marketService,
		UserService:      params.userService,
		AddressService:   params.addressService,
		EpisodeService:   params.episodeService,
		ShiftTeamService: params.shiftTeamService,
	})
}

func getContextWithAuth() context.Context {
	return metadata.NewIncomingContext(
		context.Background(),
		metadata.Pairs("authorization", "Bearer faketoken"),
	)
}

func TestNewClient(t *testing.T) {
	mockStationURL := "stationurl"
	client := NewStationClient(NewStationClientParams{
		AuthEnabled: true,
		StationURL:  mockStationURL,
	})

	if client.stationHTTPClient.StationURL != mockStationURL {
		t.Fatalf("station url was not set properly: %s", client.stationHTTPClient.StationURL)
	}
}

func TestStationClientGetAuthenticatedUserMarkets(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()
	)

	testCases := []struct {
		Name    string
		Context context.Context
		Markets []*marketpb.Market

		ExpectedResult []*caremanagerpb.Market
		ExpectedError  bool
	}{
		{
			Name:    "works",
			Context: ctxWithAuth,
			Markets: []*marketpb.Market{
				{
					Id:   1,
					Name: proto.String("a market"),
					ScheduleDays: []*commonpb.ScheduleDay{
						{
							DayOfWeek: 1,
							OpenTime: &commonpb.TimeOfDay{
								Hours: 8,
							},
							CloseTime: &commonpb.TimeOfDay{
								Hours: 22,
							},
						},
					},
					ShortName:        proto.String("a"),
					IanaTimeZoneName: proto.String("a"),
				},
				{
					Id:   2,
					Name: proto.String("another market"),
					ScheduleDays: []*commonpb.ScheduleDay{
						{
							DayOfWeek: 2,
							OpenTime: &commonpb.TimeOfDay{
								Hours: 10,
							},
							CloseTime: &commonpb.TimeOfDay{
								Hours: 20,
							},
						},
					},
					ShortName:        proto.String("a"),
					IanaTimeZoneName: proto.String("a"),
				},
			},

			ExpectedResult: []*caremanagerpb.Market{
				{
					Id:   1,
					Name: "a market",
					ScheduleDays: []*commonpb.ScheduleDay{
						{
							DayOfWeek: 1,
							OpenTime: &commonpb.TimeOfDay{
								Hours: 8,
							},
							CloseTime: &commonpb.TimeOfDay{
								Hours: 22,
							},
						},
					},
					ShortName: "a",
					TzName:    "a",
				},
				{
					Id:   2,
					Name: "another market",
					ScheduleDays: []*commonpb.ScheduleDay{
						{
							DayOfWeek: 2,
							OpenTime: &commonpb.TimeOfDay{
								Hours: 10,
							},
							CloseTime: &commonpb.TimeOfDay{
								Hours: 20,
							},
						},
					},
					ShortName: "a",
					TzName:    "a",
				},
			},
			ExpectedError: false,
		},
		{
			Name:    "fails if station returns an error",
			Context: ctxWithAuth,
			Markets: nil,

			ExpectedError: true,
		},
		{
			Name:    "fails due to missing auth",
			Context: ctxWithoutAuth,
			Markets: nil,

			ExpectedError: true,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			var err error
			if testCase.ExpectedError {
				err = errors.New("an error occurred")
			}

			stationClient := getStationClient(
				&stationClientParameters{
					marketService: &MockMarketServiceClient{
						GetAuthenticatedUserMarketsErr: err,
						GetAuthenticatedUserMarketsResult: &marketpb.GetAuthenticatedUserMarketsResponse{
							Markets: testCase.Markets,
						},
					}},
			)

			markets, err := stationClient.GetAuthenticatedUserMarkets(testCase.Context)

			if err != nil && !testCase.ExpectedError {
				t.Fatalf("unexpected error occurred: %s", err)
			}

			testutils.MustMatch(t, testCase.ExpectedResult, markets, "Markets don't match")
		})
	}
}

func TestStationClientGetAuthenticatedUser(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()
	)

	testCases := []struct {
		Name    string
		Context context.Context
		User    *userpb.User

		ExpectedResult *caremanagerpb.User
		ExpectedError  bool
	}{
		{
			Name:    "works",
			Context: ctxWithAuth,
			User: &userpb.User{
				Id:        1,
				FirstName: "User",
				LastName:  "McUser",
				Email:     "user@email.com",
				JobTitle:  proto.String("RN"),
			},

			ExpectedResult: &caremanagerpb.User{
				Id:        1,
				FirstName: *proto.String("User"),
				LastName:  *proto.String("McUser"),
				Email:     *proto.String("user@email.com"),
				JobTitle:  proto.String("RN"),
			},
			ExpectedError: false,
		},
		{
			Name:    "fails if station returns an error",
			Context: ctxWithAuth,
			User:    nil,

			ExpectedError: true,
		},
		{
			Name:    "fails due to missing auth",
			Context: ctxWithoutAuth,
			User:    nil,

			ExpectedError: true,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			var err error
			if testCase.ExpectedError {
				err = errors.New("an error occurred")
			}

			stationClient := getStationClient(
				&stationClientParameters{
					userService: &MockUserServiceClient{
						GetAuthenticatedUserErr: err,
						GetAuthenticatedUsersResult: &userpb.GetAuthenticatedUserResponse{
							User: testCase.User,
						},
					}},
			)

			user, err := stationClient.GetAuthenticatedUser(testCase.Context)

			if err != nil && !testCase.ExpectedError {
				t.Fatalf("unexpected error occurred: %s", err)
			}

			testutils.MustMatch(t, testCase.ExpectedResult, user, "User does not match")
		})
	}
}

func TestStationClientGetUserByID(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()
	)

	testCases := []struct {
		Name    string
		Context context.Context
		User    *userpb.User

		ExpectedResult *caremanagerpb.User
		ExpectedError  bool
	}{
		{
			Name:    "works",
			Context: ctxWithAuth,
			User: &userpb.User{
				Id:        1,
				FirstName: "User",
				LastName:  "McUser",
				Email:     "user@email.com",
				JobTitle:  proto.String("RN"),
			},

			ExpectedResult: &caremanagerpb.User{
				Id:        1,
				FirstName: *proto.String("User"),
				LastName:  *proto.String("McUser"),
				Email:     *proto.String("user@email.com"),
				JobTitle:  proto.String("RN"),
			},
			ExpectedError: false,
		},
		{
			Name:    "fails if station returns an error",
			Context: ctxWithAuth,
			User:    nil,

			ExpectedError: true,
		},
		{
			Name:    "fails due to missing auth",
			Context: ctxWithoutAuth,
			User:    nil,

			ExpectedError: true,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			var err error
			if testCase.ExpectedError {
				err = errors.New("an error occurred")
			}

			stationClient := getStationClient(
				&stationClientParameters{
					userService: &MockUserServiceClient{
						GetUserByIDErr: err,
						GetUserByIDResult: &userpb.GetUserByIDResponse{
							User: testCase.User,
						},
					}},
			)

			user, err := stationClient.GetUserByID(testCase.Context, 1)

			if err != nil && !testCase.ExpectedError {
				t.Fatalf("unexpected error occurred: %s", err)
			}

			testutils.MustMatch(t, testCase.ExpectedResult, user, "User does not match")
		})
	}
}

func TestStationClientGetUsersById(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()
	)

	tcs := []struct {
		Name        string
		Context     context.Context
		UserService *MockUserServiceClient
		InputIds    []int64

		ExpectedError    bool
		ExpectedResponse []*caremanagerpb.User
	}{
		{
			Name:    "works",
			Context: ctxWithAuth,
			UserService: &MockUserServiceClient{
				GetUsersByIDResult: &userpb.GetUsersByIDResponse{
					Users: []*userpb.User{{Id: 0}, {Id: 1}},
				},
			},
			InputIds: []int64{0, 1},

			ExpectedResponse: []*caremanagerpb.User{{Id: 0}, {Id: 1}},
		},
		{
			Name:    "fails if station returns an error",
			Context: ctxWithAuth,
			UserService: &MockUserServiceClient{
				GetUsersByIDErr: errors.New("error"),
			},

			ExpectedError: true,
		},
		{
			Name:    "fails due to missing authentication",
			Context: ctxWithoutAuth,

			ExpectedError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					userService: tc.UserService,
				},
			)

			output, err := stationClient.GetUsersByID(tc.Context, tc.InputIds)

			if err != nil && !tc.ExpectedError {
				t.Fatalf("unexpected error occurred: %s", err)
			}

			testutils.MustMatch(t, tc.ExpectedResponse, output, "Users don't match")
		})
	}
}

func TestStationClientGetAddressesById(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()
	)

	mockID1 := time.Now().UnixNano()
	mockID2 := mockID1 + 1

	tcs := []struct {
		Name           string
		Context        context.Context
		AddressService *MockAddressServiceClient
		InputIds       []int64

		ExpectedError    bool
		ExpectedResponse []*caremanagerpb.Address
	}{
		{
			Name:    "it should work",
			Context: ctxWithAuth,
			AddressService: &MockAddressServiceClient{
				GetAddressesByIDResult: &addresspb.GetAddressesByIDResponse{
					Addresses: []*addresspb.Address{{Id: mockID1}, {Id: mockID2}},
				},
			},
			InputIds: []int64{0, 1},

			ExpectedResponse: []*caremanagerpb.Address{{Id: mockID1}, {Id: mockID2}},
		},
		{
			Name:    "it should fail when station returns an error",
			Context: ctxWithAuth,
			AddressService: &MockAddressServiceClient{
				GetAddressesByIDErr: errors.New("error"),
			},

			ExpectedError: true,
		},
		{
			Name:    "it should fail due to missing authentication",
			Context: ctxWithoutAuth,

			ExpectedError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					addressService: tc.AddressService,
				},
			)

			output, err := stationClient.GetAddressesByID(tc.Context, tc.InputIds)

			if err != nil && !tc.ExpectedError {
				t.Fatalf("unexpected error occurred: %s", err)
			}

			testutils.MustMatch(t, tc.ExpectedResponse, output, "Addresses don't match")
		})
	}
}

func TestStationClientUpdateCareRequestStatus(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()
	)

	mockID := time.Now().UnixNano()
	mockShiftTeamID := int64(123456)

	tcs := []struct {
		Name          string
		Context       context.Context
		CareRequestID int64
		Status        string
		ShiftTeamID   *int64

		ExpectedRequestBody   []uint8
		ExpectedServerError   bool
		ExpectedResponseError error
	}{
		{
			Name:          "should use the right request parameters",
			Context:       ctxWithAuth,
			CareRequestID: mockID,
			Status:        "on_route",

			ExpectedRequestBody:   []uint8("request_status=on_route"),
			ExpectedServerError:   false,
			ExpectedResponseError: nil,
		},
		{
			Name:          "should work with the archived status",
			Context:       ctxWithAuth,
			CareRequestID: mockID,
			Status:        "archived",

			ExpectedRequestBody:   []uint8("comment=The+scheduling+process+has+been+canceled+in+CareManager&request_status=archived"),
			ExpectedServerError:   false,
			ExpectedResponseError: nil,
		},
		{
			Name:          "should use shift team id when available",
			Context:       ctxWithAuth,
			CareRequestID: mockID,
			Status:        "committed",
			ShiftTeamID:   &mockShiftTeamID,

			ExpectedRequestBody:   []uint8("meta_data%5Bshift_team_id%5D=123456&request_status=committed"),
			ExpectedServerError:   false,
			ExpectedResponseError: nil,
		},
		{
			Name:          "should return errors",
			Context:       ctxWithAuth,
			CareRequestID: mockID,
			Status:        "wrong_status",

			ExpectedRequestBody:   []uint8("request_status=wrong_status"),
			ExpectedServerError:   true,
			ExpectedResponseError: status.Error(codes.InvalidArgument, "HTTP request had error response 422: unprocessable entity"),
		},
		{
			Name:          "should fail due to missing authentication",
			Context:       ctxWithoutAuth,
			CareRequestID: mockID,
			Status:        "complete",

			ExpectedRequestBody:   []uint8("request_status=complete"),
			ExpectedServerError:   false,
			ExpectedResponseError: status.Error(codes.Unauthenticated, `failed to obtain auth token from context: missing "Authorization" header`),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Name, func(t *testing.T) {
			testServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
				body, _ := io.ReadAll(r.Body)
				testutils.MustMatch(t, tc.ExpectedRequestBody, body, "The request body does not match")
				testutils.MustMatch(t, "PATCH", r.Method, "The request method does not match.")
				testutils.MustMatch(t, fmt.Sprintf("/api/care_requests/%v/update_status", mockID), r.URL.Path, "The request path does not match")

				if tc.ExpectedResponseError != nil {
					rw.WriteHeader(http.StatusUnprocessableEntity)
					rw.Write([]byte("unprocessable entity"))
				} else {
					rw.WriteHeader(http.StatusOK)
				}
			}))
			defer testServer.Close()

			stationClient := getStationClient(
				&stationClientParameters{
					stationURL: testServer.URL,
					httpClient: http.DefaultClient,
				},
			)

			err := stationClient.UpdateCareRequestStatus(tc.Context, tc.CareRequestID, tc.Status, tc.ShiftTeamID)

			testutils.MustMatch(t, tc.ExpectedResponseError, err, "Expected response error for care request update status doesn't match")
		})
	}
}

func TestStationClientUpdateServiceLine(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()

		acuteCareServiceLineID    = "1"
		bridgeCareServiceLineID   = "2"
		advancedCareServiceLineID = "9"
	)

	mockAssignmentDate := time.Now().Format("2006-01-02")
	mockCareRequestID := time.Now().UnixNano()

	tcs := []struct {
		name           string
		context        context.Context
		careRequestID  int64
		serviceLineID  string
		assignmentDate *string

		wantRequestBody   []uint8
		wantServerError   bool
		wantResponseError error
	}{
		{
			name:           "should use AcuteCare service line ID",
			context:        ctxWithAuth,
			careRequestID:  mockCareRequestID,
			serviceLineID:  acuteCareServiceLineID,
			assignmentDate: &mockAssignmentDate,

			wantRequestBody: []uint8(
				fmt.Sprintf(
					"care_request[assignment_date]=%v&care_request[service_line_id]=%v",
					mockAssignmentDate,
					acuteCareServiceLineID,
				),
			),
			wantServerError:   false,
			wantResponseError: nil,
		},
		{
			name:           "should use BridgeCare service line ID",
			context:        ctxWithAuth,
			careRequestID:  mockCareRequestID,
			serviceLineID:  bridgeCareServiceLineID,
			assignmentDate: &mockAssignmentDate,

			wantRequestBody: []uint8(
				fmt.Sprintf(
					"care_request[assignment_date]=%v&care_request[service_line_id]=%v",
					mockAssignmentDate,
					bridgeCareServiceLineID,
				),
			),
			wantServerError:   false,
			wantResponseError: nil,
		},
		{
			name:           "should use AdvancedCare service line ID",
			context:        ctxWithAuth,
			careRequestID:  mockCareRequestID,
			serviceLineID:  advancedCareServiceLineID,
			assignmentDate: &mockAssignmentDate,

			wantRequestBody: []uint8(
				fmt.Sprintf(
					"care_request[assignment_date]=%v&care_request[service_line_id]=%v",
					mockAssignmentDate,
					advancedCareServiceLineID,
				),
			),
			wantServerError:   false,
			wantResponseError: nil,
		},
		{
			name:           "should fail without a service line ID",
			context:        ctxWithAuth,
			careRequestID:  mockCareRequestID,
			assignmentDate: &mockAssignmentDate,

			wantRequestBody: []uint8(
				fmt.Sprintf(
					"care_request[assignment_date]=%v",
					mockAssignmentDate,
				),
			),
			wantServerError:   true,
			wantResponseError: status.Error(codes.InvalidArgument, "service line ID cannot be empty"),
		},
		{
			name:          "should work without an assignmentDate",
			context:       ctxWithAuth,
			careRequestID: mockCareRequestID,
			serviceLineID: acuteCareServiceLineID,

			wantRequestBody: []uint8(
				fmt.Sprintf(
					"care_request[service_line_id]=%v",
					acuteCareServiceLineID,
				),
			),
			wantServerError:   false,
			wantResponseError: nil,
		},
		{
			name:           "should fail due to missing authentication",
			context:        ctxWithoutAuth,
			careRequestID:  mockCareRequestID,
			serviceLineID:  advancedCareServiceLineID,
			assignmentDate: &mockAssignmentDate,

			wantRequestBody: []uint8(
				fmt.Sprintf(
					"care_request[assignment_date]=%v&care_request[service_line_id]=%v",
					mockAssignmentDate,
					advancedCareServiceLineID,
				),
			),
			wantServerError: false,
			wantResponseError: status.Error(
				codes.Unauthenticated,
				`failed to obtain auth token from context: missing "Authorization" header`,
			),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					body, _ := io.ReadAll(r.Body)
					formatedBody, _ := url.Parse(string(body))
					testutils.MustMatch(
						t,
						tc.wantRequestBody,
						[]uint8(formatedBody.Path),
						"The request body does not match",
					)
					testutils.MustMatch(
						t,
						http.MethodPatch,
						r.Method,
						"The request method does not match.",
					)
					testutils.MustMatch(
						t,
						fmt.Sprintf(
							"/api/care_requests/%v",
							mockCareRequestID,
						),
						r.URL.Path,
						"The request path does not match",
					)

					if tc.wantResponseError != nil {
						rw.WriteHeader(http.StatusUnprocessableEntity)
						rw.Write([]byte("unprocessable entity"))
					} else {
						rw.WriteHeader(http.StatusOK)
					}
				}))
			defer testServer.Close()

			stationClient := getStationClient(
				&stationClientParameters{
					stationURL: testServer.URL,
					httpClient: http.DefaultClient,
				},
			)

			err := stationClient.UpdateServiceLine(
				tc.context,
				tc.careRequestID,
				tc.serviceLineID,
				tc.assignmentDate,
			)

			testutils.MustMatch(
				t,
				tc.wantResponseError,
				err,
				"Expected response error for update service line doesn't match",
			)
		})
	}
}

func TestStationClientDuplicateCareRequest(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()
	)

	mockedCareRequestID := time.Now().Unix()

	testCases := []struct {
		name               string
		context            context.Context
		episodeService     *MockEpisodeServiceClient
		inputCareRequestID int64

		wantError    bool
		wantResponse *commonpb.CareRequestInfo
	}{
		{
			name:    "should work with a valid visit",
			context: ctxWithAuth,
			episodeService: &MockEpisodeServiceClient{
				DuplicateVisitResult: &episodepb.DuplicateVisitResponse{
					CareRequest: &commonpb.CareRequestInfo{
						Id: mockedCareRequestID + 1,
					},
				},
			},
			inputCareRequestID: mockedCareRequestID,

			wantError: false,
			wantResponse: &commonpb.CareRequestInfo{
				Id: mockedCareRequestID + 1,
			},
		},
		{
			name:    "should fail due episode service fails",
			context: ctxWithAuth,
			episodeService: &MockEpisodeServiceClient{
				DuplicateVisitErr: status.Error(codes.Internal, "something went wrong"),
			},
			inputCareRequestID: mockedCareRequestID,

			wantError: true,
		},
		{
			name:    "it should fail due to missing authentication",
			context: ctxWithoutAuth,

			wantError: true,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					episodeService: testCase.episodeService,
				},
			)

			response, err := stationClient.DuplicateCareRequest(
				testCase.context,
				testCase.inputCareRequestID,
			)

			if err != nil && !testCase.wantError {
				t.Fatalf("unexpected error occurred: %s", err)
			}

			testutils.MustMatch(
				t,
				testCase.wantResponse,
				response,
			)
		})
	}
}

func TestStationClientGetPossibleServiceLines(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()
	)

	mockedCareRequestID := time.Now().Unix()

	testCases := []struct {
		name               string
		context            context.Context
		episodeService     *MockEpisodeServiceClient
		inputCareRequestID int64

		wantError    bool
		wantResponse []*episodepb.ServiceLine
	}{
		{
			name:    "should work with a valid care request id",
			context: ctxWithAuth,
			episodeService: &MockEpisodeServiceClient{
				GetVisitPossibleServiceLinesResult: &episodepb.GetVisitPossibleServiceLinesResponse{
					ServiceLines: []*episodepb.ServiceLine{
						{
							Id:   9,
							Name: "Advanced Care",
						},
					},
				},
			},
			inputCareRequestID: mockedCareRequestID,

			wantError: false,
			wantResponse: []*episodepb.ServiceLine{
				{
					Id:   9,
					Name: "Advanced Care",
				},
			},
		},
		{
			name:    "should fail due episode service fails",
			context: ctxWithAuth,
			episodeService: &MockEpisodeServiceClient{
				GetVisitPossibleServiceLinesErr: status.Error(codes.Internal, "something went wrong"),
			},
			inputCareRequestID: mockedCareRequestID,

			wantError: true,
		},
		{
			name:    "it should fail due to missing authentication",
			context: ctxWithoutAuth,

			wantError: true,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					episodeService: testCase.episodeService,
				},
			)

			response, err := stationClient.GetPossibleServiceLines(
				testCase.context,
				testCase.inputCareRequestID,
			)

			if err != nil && !testCase.wantError {
				t.Fatalf("unexpected error occurred: %s", err)
			}

			testutils.MustMatch(
				t,
				testCase.wantResponse,
				response,
			)
		})
	}
}

func TestStationCheckAvailability(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()
	)

	tcs := []struct {
		name        string
		context     context.Context
		inputParams checkAvailabilityParams

		wantResponse *AvailabilityResponse

		wantRequestBody   string
		wantServerError   bool
		wantResponseError error
	}{
		{
			name: "it should return available for if there is availability in a day",
			inputParams: checkAvailabilityParams{
				CareRequestID: 1,
				MarketID:      100,
				Date:          "02-28-2000",
				Latitude:      "36.1462673",
				Longitude:     "-115.1829873",
			},
			context: ctxWithAuth,

			wantResponse: &AvailabilityResponse{
				Availability: availabilityStatusAvailable,
			},
			wantServerError:   false,
			wantResponseError: nil,
		},
		{
			name: "it should return unavailable there not is availability",
			inputParams: checkAvailabilityParams{
				CareRequestID: 30,
				MarketID:      300,
				Date:          "02-28-2000",
				Latitude:      "36.1462673",
				Longitude:     "-115.1829873",
			},
			context: ctxWithAuth,

			wantResponse: &AvailabilityResponse{
				Availability: availabilityStatusUnavailable,
			},
			wantServerError:   false,
			wantResponseError: nil,
		},
		{
			name: "it should return limited_availability there if a limited availability",
			inputParams: checkAvailabilityParams{
				CareRequestID: 259,
				MarketID:      169,
				Date:          "02-28-2000",
				Latitude:      "36.1462673",
				Longitude:     "-115.1829873",
			},
			context: ctxWithAuth,

			wantResponse: &AvailabilityResponse{
				Availability: availabilityStatuslimitedAvailability,
			},
			wantServerError:   false,
			wantResponseError: nil,
		},
		{
			name:    "it should work with start and end times",
			context: ctxWithAuth,
			inputParams: checkAvailabilityParams{
				CareRequestID:     259,
				MarketID:          169,
				StartTimestampSec: 1687528800,
				EndTimestampSec:   1687559400,
				Latitude:          "36.1462673",
				Longitude:         "-115.1829873",
			},
			wantResponse: &AvailabilityResponse{
				Availability: availabilityStatuslimitedAvailability,
			},
		},

		{
			name:    "should fail due to missing authentication",
			context: ctxWithoutAuth,

			wantResponseError: status.Error(
				codes.Unauthenticated,
				`failed to obtain auth token from context: missing "Authorization" header`,
			),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					body, _ := io.ReadAll(r.Body)

					unserializedBody := checkAvailabilityParams{}
					err := json.Unmarshal(body, &unserializedBody)
					if err != nil {
						t.Fatal(err)
					}
					testutils.MustMatch(t, tc.inputParams, unserializedBody)
					testutils.MustMatch(t, http.MethodPost, r.Method)
					testutils.MustMatch(t, "/api/markets/check_availability", r.URL.Path)

					if tc.wantResponseError != nil {
						rw.WriteHeader(http.StatusUnprocessableEntity)
						rw.Write([]byte("unprocessable entity"))
					} else {
						rw.WriteHeader(http.StatusOK)
						serializedResponse, _ := json.Marshal(tc.wantResponse)
						rw.Write(serializedResponse)
					}
				}))
			defer testServer.Close()

			stationClient := getStationClient(
				&stationClientParameters{
					stationURL: testServer.URL,
					httpClient: http.DefaultClient,
				},
			)

			response, err := stationClient.CheckAvailability(
				tc.context,
				tc.inputParams,
			)

			testutils.MustMatch(t, tc.wantResponseError, err)
			testutils.MustMatch(t, tc.wantResponse, response)
		})
	}
}

func TestStationClientGetCareRequest(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()
	)

	testCases := []struct {
		name           string
		context        context.Context
		episodeService *MockEpisodeServiceClient

		inputCareRequestID int64

		wantResponse *commonpb.CareRequestInfo
		wantError    error
	}{
		{
			name:    "should get a care request",
			context: ctxWithAuth,
			episodeService: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &commonpb.CareRequestInfo{
						Id: 1,
					},
				},
			},

			wantResponse: &commonpb.CareRequestInfo{
				Id: 1,
			},

			wantError: nil,
		},
		{
			name:    "should fail due episode service fails",
			context: ctxWithAuth,
			episodeService: &MockEpisodeServiceClient{
				GetVisitErr: status.Error(codes.Internal, "something went wrong"),
			},

			wantError: status.Error(codes.Internal, "something went wrong"),
		},
		{
			name:    "it should fail due to missing authentication",
			context: ctxWithoutAuth,

			wantError: errors.New(`missing "Authorization" header`),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					episodeService: testCase.episodeService,
				},
			)

			response, err := stationClient.GetCareRequest(
				testCase.context,
				testCase.inputCareRequestID,
			)

			testutils.MustMatch(t, testCase.wantError, err)
			testutils.MustMatch(t, testCase.wantResponse, response)
		})
	}
}

func TestStationClientUpsertCareRequestETARange(t *testing.T) {
	var (
		ctxWithAuth    = getContextWithAuth()
		ctxWithoutAuth = context.Background()
	)

	testCases := []struct {
		name           string
		context        context.Context
		episodeService *MockEpisodeServiceClient

		params upsertCareRequestETARangeParams

		wantError error
	}{
		{
			name:    "should work with a valid request",
			context: ctxWithAuth,
			episodeService: &MockEpisodeServiceClient{
				UpsertVisitETARangeResult: &episodepb.UpsertVisitETARangeResponse{},
			},

			params: upsertCareRequestETARangeParams{
				CareRequestID:       1,
				CareRequestStatusID: 100,
				ArrivalTimeWindow: &commonpb.TimeWindow{
					StartDatetime: &commonpb.DateTime{
						Year:  2023,
						Month: 1,
						Day:   24,
						TimeOffset: &commonpb.DateTime_TimeZone{
							TimeZone: &commonpb.TimeZone{
								Id: "America/New_York",
							},
						},
					},
					EndDatetime: &commonpb.DateTime{
						Year:  2023,
						Month: 6,
						Day:   24,
						TimeOffset: &commonpb.DateTime_TimeZone{
							TimeZone: &commonpb.TimeZone{
								Id: "America/New_York",
							},
						},
					},
				},
			},

			wantError: nil,
		},
		{
			name:    "should fail due episode service fails",
			context: ctxWithAuth,
			episodeService: &MockEpisodeServiceClient{
				UpsertVisitETARangeErr: status.Error(codes.Internal, "something went wrong"),
			},

			wantError: status.Error(codes.Internal, "something went wrong"),
		},
		{
			name:    "it should fail due to missing authentication",
			context: ctxWithoutAuth,

			wantError: errors.New(`missing "Authorization" header`),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					episodeService: testCase.episodeService,
				},
			)

			err := stationClient.UpsertCareRequestETARange(
				testCase.context,
				testCase.params,
			)

			testutils.MustMatch(
				t,
				testCase.wantError,
				err,
			)
		})
	}
}

func TestStationClientIsAdvancedCareAvailableForCareRequest(t *testing.T) {
	mockedCareRequestID := time.Now().Unix()

	testCases := []struct {
		name               string
		episodeService     *MockEpisodeServiceClient
		inputCareRequestID int64

		wantResponse bool
		wantError    error
	}{
		{
			name:               "should work if there Advanced Care is available",
			inputCareRequestID: mockedCareRequestID,

			episodeService: &MockEpisodeServiceClient{
				GetVisitPossibleServiceLinesResult: &episodepb.GetVisitPossibleServiceLinesResponse{
					ServiceLines: []*episodepb.ServiceLine{
						{
							Id:   9,
							Name: serviceLineAdvancedCare,
						},
						{
							Id:   1,
							Name: "Another Service Line",
						},
					},
				},
			},

			wantResponse: true,
		},
		{
			name:               "should work if there Advanced Care is not available",
			inputCareRequestID: mockedCareRequestID,

			episodeService: &MockEpisodeServiceClient{
				GetVisitPossibleServiceLinesResult: &episodepb.GetVisitPossibleServiceLinesResponse{
					ServiceLines: []*episodepb.ServiceLine{
						{
							Id:   1,
							Name: "Another Service Line",
						},
					},
				},
			},

			wantResponse: false,
		},
		{
			name:               "should fail there is an error with the episode service",
			inputCareRequestID: mockedCareRequestID,

			episodeService: &MockEpisodeServiceClient{
				GetVisitPossibleServiceLinesErr: status.Error(codes.Internal, "something went wrong"),
			},

			wantResponse: false,
			wantError:    status.Error(codes.Internal, "something went wrong"),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					episodeService: testCase.episodeService,
				},
			)

			response, err := stationClient.IsAdvancedCareAvailableForCareRequest(
				getContextWithAuth(),
				testCase.inputCareRequestID,
			)

			testutils.MustMatch(t, testCase.wantError, err)
			testutils.MustMatch(t, testCase.wantResponse, response)
		})
	}
}

func TestStationClientSearchUsers(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	ctxWithoutAuth := context.Background()

	tcs := []struct {
		name        string
		context     context.Context
		userService *MockUserServiceClient
		request     *userpb.SearchUsersRequest

		wantError         error
		wantUsersResponse []*caremanagerpb.User
		wantCountResponse int64
	}{
		{
			name:    "should work with a valid search term",
			context: ctxWithAuth,
			request: &userpb.SearchUsersRequest{
				SearchTerm: "test.email@test.com",
			},
			userService: &MockUserServiceClient{
				SearchUsersResult: &userpb.SearchUsersResponse{
					Users:      []*userpb.User{{Id: 0}, {Id: 1}},
					TotalCount: 10,
				},
			},

			wantUsersResponse: []*caremanagerpb.User{{Id: 0}, {Id: 1}},
			wantCountResponse: 10,
		},
		{
			name:      "should fail due missing auth",
			context:   ctxWithoutAuth,
			wantError: errors.New(`missing "Authorization" header`),
		},
		{
			name:    "should fail when user service fails",
			context: ctxWithAuth,
			request: &userpb.SearchUsersRequest{
				SearchTerm: "",
			},
			userService: &MockUserServiceClient{
				SearchUsersErr: errors.New("something went wrong"),
			},

			wantError: errors.New("something went wrong"),
		},
	}

	for _, testCase := range tcs {
		t.Run(testCase.name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					userService: testCase.userService,
				},
			)

			users, count, err := stationClient.SearchUsers(
				testCase.context,
				testCase.request,
			)

			testutils.MustMatch(t, testCase.wantError, err)
			testutils.MustMatch(t, testCase.wantUsersResponse, users)
			testutils.MustMatch(t, testCase.wantCountResponse, count)
		})
	}
}

func TestStationCreateEHRAppointment(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	ctxWithoutAuth := context.Background()

	tcs := []struct {
		name            string
		context         context.Context
		request         createEHRAppointmentParams
		stationResponse stationCreateEHRAppointmentResponse
		stationError    error

		wantError error
		want      *string
	}{
		{
			name:    "should work with a valid payload",
			context: ctxWithAuth,
			request: createEHRAppointmentParams{
				CareRequestID:             1,
				AppointmentType:           "some type",
				AppointmentStartTime:      "10:00:00",
				AppointmentDate:           "08-25-2023",
				AppointmentPlaceOfService: "Home",
			},
			stationResponse: stationCreateEHRAppointmentResponse{
				AppointmentID: "1",
			},

			want: proto.String("1"),
		},
		{
			name: "should fail due missing auth",
			request: createEHRAppointmentParams{
				CareRequestID:             1,
				AppointmentType:           "some type",
				AppointmentStartTime:      "10:00:00",
				AppointmentDate:           "08-25-2023",
				AppointmentPlaceOfService: "Home",
			},
			context: ctxWithoutAuth,

			wantError: status.Error(codes.Unauthenticated, "failed to obtain auth token from context: missing \"Authorization\" header"),
		},
		{
			name:    "should fail when station fails",
			context: ctxWithAuth,
			request: createEHRAppointmentParams{
				CareRequestID:             1,
				AppointmentType:           "some type",
				AppointmentStartTime:      "10:00:00",
				AppointmentDate:           "08-25-2023",
				AppointmentPlaceOfService: "Home",
			},
			stationError: errors.New("something went wrong"),

			wantError: status.Error(codes.Internal, "HTTP request had error response 500: something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if tc.stationError != nil {
						rw.WriteHeader(http.StatusInternalServerError)
						rw.Write([]byte(tc.stationError.Error()))
					} else {
						rw.WriteHeader(http.StatusOK)
						serializedResponse, _ := json.Marshal(tc.stationResponse)
						rw.Write(serializedResponse)
					}
				}))
			defer testServer.Close()

			stationClient := getStationClient(
				&stationClientParameters{
					stationURL: testServer.URL,
					httpClient: http.DefaultClient,
				},
			)

			appointmentID, err := stationClient.CreateEHRAppointment(
				tc.context,
				tc.request,
			)

			testutils.MustMatch(t, tc.wantError, err)
			testutils.MustMatch(t, tc.want, appointmentID)
		})
	}
}

func TestStationUpdateEHRAppointment(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	ctxWithoutAuth := context.Background()

	tcs := []struct {
		name            string
		context         context.Context
		request         updateEHRAppointmentParams
		stationResponse stationUpdateEHRAppointmentResponse
		stationError    error

		wantError error
		want      *string
	}{
		{
			name:    "should work with a valid payload",
			context: ctxWithAuth,
			request: updateEHRAppointmentParams{
				CareRequestID:             1,
				AppointmentType:           "some type",
				AppointmentPlaceOfService: "Home",
			},
			stationResponse: stationUpdateEHRAppointmentResponse{
				AppointmentID: "1",
			},

			want: proto.String("1"),
		},
		{
			name: "should fail due missing auth",
			request: updateEHRAppointmentParams{
				CareRequestID:             1,
				AppointmentType:           "some type",
				AppointmentPlaceOfService: "Home",
			},
			context: ctxWithoutAuth,

			wantError: status.Error(codes.Unauthenticated, "failed to obtain auth token from context: missing \"Authorization\" header"),
		},
		{
			name:    "should fail when station fails",
			context: ctxWithAuth,
			request: updateEHRAppointmentParams{
				CareRequestID:             1,
				AppointmentType:           "some type",
				AppointmentPlaceOfService: "Home",
			},
			stationError: errors.New("something went wrong"),

			wantError: status.Error(codes.Internal, "HTTP request had error response 500: something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if tc.stationError != nil {
						rw.WriteHeader(http.StatusInternalServerError)
						rw.Write([]byte(tc.stationError.Error()))
					} else {
						rw.WriteHeader(http.StatusOK)
						serializedResponse, _ := json.Marshal(tc.stationResponse)
						rw.Write(serializedResponse)
					}
				}))
			defer testServer.Close()

			stationClient := getStationClient(
				&stationClientParameters{
					stationURL: testServer.URL,
					httpClient: http.DefaultClient,
				},
			)

			appointmentID, err := stationClient.UpdateEHRAppointment(
				tc.context,
				tc.request,
			)

			testutils.MustMatch(t, tc.wantError, err)
			testutils.MustMatch(t, tc.want, appointmentID)
		})
	}
}

func TestStationAssignVirtualAPP(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	ctxWithoutAuth := context.Background()

	tcs := []struct {
		name           string
		episodeService *MockEpisodeServiceClient
		context        context.Context
		careRequestID  int64

		wantError error
	}{
		{
			name:          "should work with a valid care request ID",
			context:       ctxWithAuth,
			careRequestID: 1,
			episodeService: &MockEpisodeServiceClient{
				AssignVirtualAPPToVisitResult: &episodepb.AssignVirtualAPPToVisitResponse{},
			},
		},
		{
			name:          "should fail due missing auth",
			context:       ctxWithoutAuth,
			careRequestID: 1,
			episodeService: &MockEpisodeServiceClient{
				AssignVirtualAPPToVisitResult: &episodepb.AssignVirtualAPPToVisitResponse{},
			},

			wantError: errors.New("missing \"Authorization\" header"),
		},
		{
			name:          "should fail when station fails",
			context:       ctxWithAuth,
			careRequestID: 1,
			episodeService: &MockEpisodeServiceClient{
				AssignVirtualAPPToVisitErr: status.Error(codes.Internal, "something went wrong"),
			},

			wantError: status.Error(codes.Internal, "something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					episodeService: tc.episodeService,
				},
			)

			err := stationClient.AssignVirtualAPP(
				tc.context,
				tc.careRequestID,
			)

			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

func TestStationUnassignVirtualAPP(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	ctxWithoutAuth := context.Background()

	tcs := []struct {
		name           string
		context        context.Context
		careRequestID  int64
		episodeService *MockEpisodeServiceClient

		wantError error
	}{
		{
			name:          "should work with a valid care request ID",
			context:       ctxWithAuth,
			careRequestID: 1,
			episodeService: &MockEpisodeServiceClient{
				UnassignVirtualAPPFromVisitResult: &episodepb.UnassignVirtualAPPFromVisitResponse{},
			},
		},
		{
			name:          "should fail due missing auth",
			context:       ctxWithoutAuth,
			careRequestID: 1,
			episodeService: &MockEpisodeServiceClient{
				UnassignVirtualAPPFromVisitResult: &episodepb.UnassignVirtualAPPFromVisitResponse{},
			},

			wantError: errors.New("missing \"Authorization\" header"),
		},
		{
			name:          "should fail when station fails",
			context:       ctxWithAuth,
			careRequestID: 1,
			episodeService: &MockEpisodeServiceClient{
				UnassignVirtualAPPFromVisitErr: status.Error(codes.Internal, "something went wrong"),
			},

			wantError: status.Error(codes.Internal, "something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					episodeService: tc.episodeService,
				},
			)

			err := stationClient.UnassignVirtualAPP(
				tc.context,
				tc.careRequestID,
			)

			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

func TestStationCreateNote(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	ctxWithoutAuth := context.Background()
	now := time.Now()

	tcs := []struct {
		name            string
		context         context.Context
		request         createNoteParams
		stationResponse StationNote
		stationError    error

		wantError error
		want      *StationNote
	}{
		{
			name:    "should work with a valid payload",
			context: ctxWithAuth,
			request: createNoteParams{
				CareRequestID: 1,
				Details:       "some note",
			},
			stationResponse: StationNote{
				ID:              1,
				Details:         "some note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
			},

			want: &StationNote{
				ID:              1,
				Details:         "some note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
			},
		},
		{
			name: "should fail due missing auth",
			request: createNoteParams{
				CareRequestID: 1,
				Details:       "some note",
			},
			context: ctxWithoutAuth,

			wantError: status.Error(codes.Unauthenticated, "failed to obtain auth token from context: missing \"Authorization\" header"),
		},
		{
			name:    "should fail when station fails",
			context: ctxWithAuth,
			request: createNoteParams{
				CareRequestID: 1,
				Details:       "some note",
			},
			stationError: errors.New("something went wrong"),

			wantError: status.Error(codes.Internal, "HTTP request had error response 500: something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if tc.stationError != nil {
						rw.WriteHeader(http.StatusInternalServerError)
						rw.Write([]byte(tc.stationError.Error()))
					} else {
						rw.WriteHeader(http.StatusOK)
						serializedResponse, _ := json.Marshal(tc.stationResponse)
						rw.Write(serializedResponse)
					}
				}))
			defer testServer.Close()

			stationClient := getStationClient(
				&stationClientParameters{
					stationURL: testServer.URL,
					httpClient: http.DefaultClient,
				},
			)

			note, err := stationClient.CreateNote(
				tc.context,
				tc.request,
			)

			testutils.MustMatch(t, tc.wantError, err)
			testutils.MustMatch(t, tc.want, note)
		})
	}
}

func TestStationUpdateNote(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	ctxWithoutAuth := context.Background()
	now := time.Now()

	tcs := []struct {
		name            string
		context         context.Context
		request         updateNoteParams
		stationResponse []StationNote
		stationError    error

		wantError error
		want      *StationNote
	}{
		{
			name:    "should work with a valid payload",
			context: ctxWithAuth,
			request: updateNoteParams{
				CareRequestID: 1,
				NoteID:        1,
				Details:       proto.String("edited note"),
				Pinned:        proto.Bool(true),
			},
			stationResponse: []StationNote{{
				ID:              1,
				Details:         "edited note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
				Pinned:          true,
			}},

			want: &StationNote{
				ID:              1,
				Details:         "edited note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
				Pinned:          true,
			},
		},
		{
			name:    "should work with a minimal payload",
			context: ctxWithAuth,
			request: updateNoteParams{
				CareRequestID: 1,
				NoteID:        1,
			},
			stationResponse: []StationNote{{
				ID:              1,
				Details:         "some note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
				Pinned:          false,
			}},

			want: &StationNote{
				ID:              1,
				Details:         "some note",
				NoteKind:        "regular",
				CreatedByUserID: proto.Int64(1),
				CreatedAt:       now,
				UpdatedAt:       now,
				Pinned:          false,
			},
		},
		{
			name: "should fail due missing auth",
			request: updateNoteParams{
				CareRequestID: 1,
				NoteID:        1,
				Details:       proto.String("edited note"),
				Pinned:        proto.Bool(true),
			},
			context: ctxWithoutAuth,

			wantError: status.Error(codes.Unauthenticated, "failed to obtain auth token from context: missing \"Authorization\" header"),
		},
		{
			name:    "should fail when station fails",
			context: ctxWithAuth,
			request: updateNoteParams{
				CareRequestID: 1,
				NoteID:        1,
				Details:       proto.String("edited note"),
				Pinned:        proto.Bool(true),
			},
			stationError: errors.New("something went wrong"),

			wantError: status.Error(codes.Internal, "HTTP request had error response 500: something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if tc.stationError != nil {
						rw.WriteHeader(http.StatusInternalServerError)
						rw.Write([]byte(tc.stationError.Error()))
					} else {
						rw.WriteHeader(http.StatusOK)
						serializedResponse, _ := json.Marshal(tc.stationResponse)
						rw.Write(serializedResponse)
					}
				}))
			defer testServer.Close()

			stationClient := getStationClient(
				&stationClientParameters{
					stationURL: testServer.URL,
					httpClient: http.DefaultClient,
				},
			)

			note, err := stationClient.UpdateNote(
				tc.context,
				tc.request,
			)

			testutils.MustMatch(t, tc.wantError, err)
			testutils.MustMatch(t, tc.want, note)
		})
	}
}

func TestStationDeleteNote(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	ctxWithoutAuth := context.Background()

	tcs := []struct {
		name         string
		context      context.Context
		request      deleteNoteParams
		stationError error

		wantError error
	}{
		{
			name:    "should work with a valid payload",
			context: ctxWithAuth,
			request: deleteNoteParams{
				CareRequestID: 1,
				NoteID:        1,
			},
		},
		{
			name: "should fail due missing auth",
			request: deleteNoteParams{
				CareRequestID: 1,
				NoteID:        1,
			},
			context: ctxWithoutAuth,

			wantError: status.Error(codes.Unauthenticated, "failed to obtain auth token from context: missing \"Authorization\" header"),
		},
		{
			name:    "should fail when station fails",
			context: ctxWithAuth,
			request: deleteNoteParams{
				CareRequestID: 1,
				NoteID:        1,
			},
			stationError: errors.New("something went wrong"),

			wantError: status.Error(codes.Internal, "HTTP request had error response 500: something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.name, func(t *testing.T) {
			testServer := httptest.NewServer(
				http.HandlerFunc(func(rw http.ResponseWriter, r *http.Request) {
					if tc.stationError != nil {
						rw.WriteHeader(http.StatusInternalServerError)
						rw.Write([]byte(tc.stationError.Error()))
					} else {
						rw.WriteHeader(http.StatusOK)
					}
				}))
			defer testServer.Close()

			stationClient := getStationClient(
				&stationClientParameters{
					stationURL: testServer.URL,
					httpClient: http.DefaultClient,
				},
			)

			err := stationClient.DeleteNote(
				tc.context,
				tc.request,
			)

			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

func TestListSoloDHMTShiftTeams(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	ctxWithoutAuth := context.Background()

	tcs := []struct {
		name             string
		context          context.Context
		shiftTeamService *MockShiftTeamServiceClient
		marketIDs        []int64

		wantError         error
		wantUsersResponse []*shiftteampb.ShiftTeam
	}{
		{
			name:      "should work with a valid search term",
			context:   ctxWithAuth,
			marketIDs: []int64{1},
			shiftTeamService: &MockShiftTeamServiceClient{
				ListSoloDHMTShiftTeamsResult: &shiftteampb.ListSoloDHMTShiftTeamsResponse{
					ShiftTeams: []*shiftteampb.ShiftTeam{{Id: 1}},
				},
			},

			wantUsersResponse: []*shiftteampb.ShiftTeam{{Id: 1}},
		},
		{
			name:      "should fail due missing auth",
			context:   ctxWithoutAuth,
			wantError: errors.New(`missing "Authorization" header`),
		},
		{
			name:      "should fail when user service fails",
			context:   ctxWithAuth,
			marketIDs: []int64{1},
			shiftTeamService: &MockShiftTeamServiceClient{
				ListSoloDHMTShiftTeamsErr: errors.New("something went wrong"),
			},

			wantError: errors.New("something went wrong"),
		},
	}

	for _, testCase := range tcs {
		t.Run(testCase.name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					shiftTeamService: testCase.shiftTeamService,
				},
			)

			shiftTeams, err := stationClient.ListSoloDHMTShiftTeams(testCase.context, testCase.marketIDs)

			testutils.MustMatch(t, testCase.wantError, err)
			testutils.MustMatch(t, testCase.wantUsersResponse, shiftTeams)
		})
	}
}

func TestGetCareRequestDetails(t *testing.T) {
	mockCareRequestID := time.Now().Unix()
	ctxWithAuth := getContextWithAuth()
	mockSex := commonpb.Sex_SEX_MALE
	mockChiefComplaint := "Ultra OUCH"
	mockMemberIDs := []int64{1, 2, 3}
	mockCarName := "CLA01"
	mockPatientID := mockCareRequestID + 1
	ctxWithoutAuth := context.Background()

	tcs := []struct {
		name           string
		context        context.Context
		episodeService *MockEpisodeServiceClient
		request        *episodepb.GetVisitRequest

		want      *GetCareRequestDetailsResult
		wantError error
	}{

		{
			name:    "returns the CareRequest details",
			context: ctxWithAuth,
			request: &episodepb.GetVisitRequest{
				CareRequestId: mockCareRequestID,
			},
			episodeService: &MockEpisodeServiceClient{
				GetVisitResult: &episodepb.GetVisitResponse{
					CareRequest: &commonpb.CareRequestInfo{
						Id:             mockCareRequestID,
						ChiefComplaint: &mockChiefComplaint,
						ShiftTeam: &commonpb.ShiftTeam{
							MemberIds: mockMemberIDs,
							BaseLocation: &commonpb.BaseLocation{
								Name: mockCarName,
							},
						},
						Patient: &commonpb.Patient{
							Id: proto.String(
								strconv.FormatInt(mockPatientID, 10),
							),
							Name: &commonpb.Name{
								GivenName:  proto.String("James"),
								FamilyName: proto.String("Cameron"),
							},
							PrimaryIdentifier: &commonpb.PatientRecordIdentifier{
								RecordId: strconv.FormatInt(mockCareRequestID, 10),
							},
							DateOfBirth: &commonpb.Date{
								Year:  int32(2023),
								Month: int32(1),
								Day:   int32(1),
							},
							Sex: &mockSex,
						},

						VisitsInLast_90Days: proto.Int64(1),
					},
				},
			},

			want: &GetCareRequestDetailsResult{
				careRequest: &caremanagerpb.StationCareRequest{
					Id:              mockCareRequestID,
					ChiefComplaint:  mockChiefComplaint,
					CarName:         &mockCarName,
					ProviderUserIds: mockMemberIDs,
				},

				patient: &caremanagerpb.StationPatient{
					Id:                  mockPatientID,
					FirstName:           proto.String("James"),
					LastName:            proto.String("Cameron"),
					EhrId:               strconv.Itoa(int(mockCareRequestID)),
					DateOfBirth:         "2023-01-01",
					Sex:                 proto.String("SEX_MALE"),
					VisitsInPast_90Days: 1,
				},
			},
		},

		{
			name:    "should fail when episode service fails",
			context: ctxWithAuth,
			request: &episodepb.GetVisitRequest{
				CareRequestId: mockCareRequestID,
			},

			episodeService: &MockEpisodeServiceClient{
				GetVisitErr: errors.New("Something went wrong"),
			},

			wantError: errors.New("Something went wrong"),
		},

		{
			name:    "should fail due invalid auth",
			context: ctxWithoutAuth,
			request: &episodepb.GetVisitRequest{
				CareRequestId: mockCareRequestID,
			},

			wantError: errors.New(`missing "Authorization" header`),
		},
	}

	for _, testCase := range tcs {
		t.Run(testCase.name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					episodeService: testCase.episodeService,
				},
			)

			response, err := stationClient.GetCareRequestDetails(
				testCase.context,
				testCase.request,
			)

			testutils.MustMatch(t, testCase.want, response)
			testutils.MustMatch(t, testCase.wantError, err)
		})
	}
}

func TestSearchCareRequests(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	ctxWithoutAuth := context.Background()
	mockID := time.Now().Unix()
	mockChiefComplaint := "test chief complaint"
	mockPatientName := "test patient name"

	testCases := []struct {
		name           string
		context        context.Context
		episodeService *MockEpisodeServiceClient
		req            SearchCareRequestsParams

		want      SearchCareRequestsResults
		wantError error
	}{
		{
			name:    "should work with a input params",
			context: ctxWithAuth,
			req: SearchCareRequestsParams{
				CareRequestIDs: []int64{mockID, mockID + 1},
				SearchTerm:     &mockChiefComplaint,
			},

			episodeService: &MockEpisodeServiceClient{
				SearchVisitsResult: &episodepb.SearchVisitsResponse{
					CareRequests: []*commonpb.CareRequestInfo{
						{
							Id:             mockID,
							ChiefComplaint: &mockChiefComplaint,
							Patient: &commonpb.Patient{
								Id: proto.String(strconv.FormatInt(mockID, 10)),
								Name: &commonpb.Name{
									GivenName: &mockPatientName,
								},
							},
						},
						{
							Id:             mockID + 1,
							ChiefComplaint: &mockChiefComplaint,
							Patient: &commonpb.Patient{
								Id: proto.String(strconv.FormatInt(mockID, 10)),
								Name: &commonpb.Name{
									GivenName: &mockPatientName,
								},
							},
						},
					},
				},
			},

			want: SearchCareRequestsResults{
				{
					StationCareRequest: &caremanagerpb.StationCareRequestListElement{
						Id:             mockID,
						ChiefComplaint: mockChiefComplaint,
					},
					StationPatient: &caremanagerpb.StationPatientListElement{
						Id:        mockID,
						FirstName: &mockPatientName,
					},
				},
				{
					StationCareRequest: &caremanagerpb.StationCareRequestListElement{
						Id:             mockID + 1,
						ChiefComplaint: mockChiefComplaint,
					},
					StationPatient: &caremanagerpb.StationPatientListElement{
						Id:        mockID,
						FirstName: &mockPatientName,
					},
				},
			},
		},
		{
			name:    "should fail if the episode service fails",
			context: ctxWithAuth,
			req: SearchCareRequestsParams{
				CareRequestIDs: []int64{mockID, mockID + 1},
				SearchTerm:     &mockChiefComplaint,
			},

			episodeService: &MockEpisodeServiceClient{
				SearchVisitsErr: errors.New("something went wrong"),
			},

			wantError: errors.New("something went wrong"),
		},
		{
			name:    "should fail due invalid authentication",
			context: ctxWithoutAuth,
			req: SearchCareRequestsParams{
				CareRequestIDs: []int64{mockID, mockID + 1},
				SearchTerm:     &mockChiefComplaint,
			},

			wantError: errors.New(`missing "Authorization" header`),
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					episodeService: testCase.episodeService,
				},
			)

			response, err := stationClient.SearchCareRequests(
				testCase.context,
				testCase.req,
			)

			testutils.MustMatch(t, testCase.want, response)
			testutils.MustMatch(t, testCase.wantError, err)
		})
	}
}

func TestStationListCarsByIDs(t *testing.T) {
	ctxWithAuth := getContextWithAuth()
	ctxWithoutAuth := context.Background()

	tcs := []struct {
		name             string
		context          context.Context
		shiftTeamService *MockShiftTeamServiceClient
		carIDs           []int64

		wantError         error
		wantUsersResponse []*commonpb.Car
	}{
		{
			name:    "should work with a valid search term",
			context: ctxWithAuth,
			carIDs:  []int64{1},
			shiftTeamService: &MockShiftTeamServiceClient{
				ListCarsByIDsResult: &shiftteampb.ListCarsByIDsResponse{
					Cars: []*commonpb.Car{{Id: 1}},
				},
			},

			wantUsersResponse: []*commonpb.Car{{Id: 1}},
		},
		{
			name:      "should fail due missing auth",
			context:   ctxWithoutAuth,
			wantError: errors.New(`missing "Authorization" header`),
		},
		{
			name:    "should fail when user service fails",
			context: ctxWithAuth,
			carIDs:  []int64{1},
			shiftTeamService: &MockShiftTeamServiceClient{
				ListCarsByIDsErr: errors.New("something went wrong"),
			},

			wantError: errors.New("something went wrong"),
		},
	}

	for _, testCase := range tcs {
		t.Run(testCase.name, func(t *testing.T) {
			stationClient := getStationClient(
				&stationClientParameters{
					shiftTeamService: testCase.shiftTeamService,
				},
			)

			shiftTeams, err := stationClient.ListCarsByIDs(testCase.context, testCase.carIDs)

			testutils.MustMatch(t, testCase.wantError, err)
			testutils.MustMatch(t, testCase.wantUsersResponse, shiftTeams)
		})
	}
}

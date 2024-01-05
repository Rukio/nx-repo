package main

import (
	"context"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/metadata"
	"google.golang.org/grpc/status"

	addresspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/address"
	caremanagerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/caremanager"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	marketpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/market"
	shiftteampb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_team"
	userpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/user"
	"github.com/*company-data-covered*/services/go/pkg/httpclient"
	"github.com/*company-data-covered*/services/go/pkg/station"
)

type NewStationClientParams struct {
	AuthEnabled bool
	StationURL  string
	HTTPClient  *http.Client

	MarketService    marketpb.MarketServiceClient
	UserService      userpb.UserServiceClient
	AddressService   addresspb.AddressServiceClient
	ShiftTeamService shiftteampb.ShiftTeamServiceClient
	EpisodeService   episodepb.EpisodeServiceClient
}

type StationClient struct {
	stationHTTPClient station.Client

	marketService    marketpb.MarketServiceClient
	userService      userpb.UserServiceClient
	addressService   addresspb.AddressServiceClient
	shiftTeamService shiftteampb.ShiftTeamServiceClient
	episodeService   episodepb.EpisodeServiceClient
}

type GetCareRequestDetailsResult struct {
	careRequest *caremanagerpb.StationCareRequest
	patient     *caremanagerpb.StationPatient
}

type checkAvailabilityParams struct {
	CareRequestID     int64  `json:"care_request_id"`
	MarketID          int64  `json:"market_id"`
	Latitude          string `json:"latitude"`
	Longitude         string `json:"longitude"`
	StartTimestampSec int64  `json:"start_timestamp_sec,omitempty"`
	EndTimestampSec   int64  `json:"end_timestamp_sec,omitempty"`
	Date              string `json:"date,omitempty"` // mm-dd-yyyy
}

type upsertCareRequestETARangeParams struct {
	CareRequestID       int64
	CareRequestStatusID int64
	ArrivalTimeWindow   *common.TimeWindow
}

type AvailabilityResponse struct {
	Availability string `json:"availability"`
}

type createEHRAppointmentParams struct {
	CareRequestID             int64
	AppointmentType           string
	AppointmentPlaceOfService string
	AppointmentDate           string
	AppointmentStartTime      string
}

type stationCreateEHRAppointmentResponse struct {
	AppointmentID string `json:"ehr_id"`
}

type updateEHRAppointmentParams struct {
	CareRequestID             int64
	AppointmentType           string
	AppointmentPlaceOfService string
}

type stationUpdateEHRAppointmentResponse struct {
	AppointmentID string `json:"appointmentid"`
}

type createNoteParams struct {
	CareRequestID int64
	Details       string
}

type updateNoteParams struct {
	CareRequestID int64
	NoteID        int64
	Details       *string
	Pinned        *bool
}

type StationNote struct {
	ID              int64     `json:"id"`
	Details         string    `json:"note"`
	NoteKind        string    `json:"note_type"`
	CreatedByUserID *int64    `json:"user_id"`
	CreatedAt       time.Time `json:"created_at"`
	UpdatedAt       time.Time `json:"updated_at"`
	Pinned          bool      `json:"featured"`
}

type deleteNoteParams struct {
	CareRequestID int64
	NoteID        int64
}

type SearchCareRequestsParams struct {
	CareRequestIDs []int64
	SearchTerm     *string
}

type SearchCareRequestsResult struct {
	StationCareRequest *caremanagerpb.StationCareRequestListElement
	StationPatient     *caremanagerpb.StationPatientListElement
}

type SearchCareRequestsResults []SearchCareRequestsResult

const (
	availabilityStatuslimitedAvailability                       = "limited_availability"
	availabilityStatusLimitedAvailabilityNearingCapacity        = "limited_availability_nearing_capacity"
	availabilityStatusLimitedAvailabilityServiceDurationLimited = "limited_availability_service_duration_limited"
	availabilityStatusLimitedAvailabilityLocationLimited        = "limited_availability_location_limited"
	availabilityStatusMarketClosingSoon                         = "unavailable_market_closing_soon"
	availabilityStatusUnavailable                               = "unavailable"
	availabilityStatusAvailable                                 = "available"

	serviceLineAdvancedCare = "Advanced Care"

	careRequestStatusAccepted = "accepted"
	careRequestStatusArchived = "archived"

	advancedCareServiceLineID = 9

	resolveVisitComment = "The scheduling process has been canceled in CareManager"
)

func NewStationClient(params NewStationClientParams) *StationClient {
	client := new(StationClient)

	client.marketService = params.MarketService
	client.userService = params.UserService
	client.addressService = params.AddressService
	client.shiftTeamService = params.ShiftTeamService
	client.episodeService = params.EpisodeService

	if params.HTTPClient != nil {
		client.stationHTTPClient = station.Client{
			HTTPClient:   params.HTTPClient,
			StationURL:   params.StationURL,
			AuthDisabled: !params.AuthEnabled,
		}
	} else {
		client.stationHTTPClient = station.Client{
			HTTPClient:   &http.Client{},
			StationURL:   params.StationURL,
			AuthDisabled: !params.AuthEnabled,
		}
	}

	return client
}

func (sc *StationClient) getOutgoingContextWithAuth(context context.Context) (context.Context, error) {
	authToken, err := sc.stationHTTPClient.GetAuthorizationTokenFromContext(context)
	if err != nil {
		return nil, err
	}

	return metadata.NewOutgoingContext(context, metadata.Pairs("authorization", authToken)), nil
}

func (sc *StationClient) GetHealthCheck(ctx context.Context, check string) error {
	err := sc.stationHTTPClient.Request(ctx, &station.RequestConfig{
		Method: http.MethodGet,
		Path:   fmt.Sprintf("/health-check/%s.json", check),
	})
	return err
}

func (sc *StationClient) GetMarket(ctx context.Context, marketID int64) (*caremanagerpb.Market, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	marketResponse, err := sc.marketService.GetMarket(outgoingContext, &marketpb.GetMarketRequest{MarketId: marketID})
	if err != nil || marketResponse == nil {
		return nil, status.Errorf(codes.NotFound, "market not found, market_id: %d, error: %s", marketID, err)
	}
	market := marketResponse.Market

	return &caremanagerpb.Market{
		Id:        market.Id,
		Name:      *market.Name,
		ShortName: *market.ShortName,
		TzName:    *market.IanaTimeZoneName,
	}, nil
}

func (sc *StationClient) GetAuthenticatedUserMarkets(ctx context.Context) ([]*caremanagerpb.Market, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	response, err := sc.marketService.GetAuthenticatedUserMarkets(
		outgoingContext,
		&marketpb.GetAuthenticatedUserMarketsRequest{},
	)
	if err != nil {
		return nil, err
	}

	markets := []*caremanagerpb.Market{}
	for _, m := range response.Markets {
		markets = append(markets, &caremanagerpb.Market{
			Id:           m.Id,
			Name:         *m.Name,
			ScheduleDays: m.ScheduleDays,
			ShortName:    *m.ShortName,
			TzName:       *m.IanaTimeZoneName,
		})
	}

	return markets, nil
}

func (sc *StationClient) GetAuthenticatedUser(ctx context.Context) (*caremanagerpb.User, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	response, err := sc.userService.GetAuthenticatedUser(
		outgoingContext,
		&userpb.GetAuthenticatedUserRequest{},
	)
	if err != nil {
		return nil, err
	}

	return UserProtoFromStationUserProto(response.User), nil
}

func (sc *StationClient) GetUsersByID(ctx context.Context, ids []int64) ([]*caremanagerpb.User, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	response, err := sc.userService.GetUsersByID(
		outgoingContext,
		&userpb.GetUsersByIDRequest{UserIds: ids},
	)
	if err != nil {
		return nil, err
	}

	users := make([]*caremanagerpb.User, len(response.Users))
	for i, user := range response.Users {
		users[i] = UserProtoFromStationUserProto(user)
	}

	return users, nil
}

func (sc *StationClient) SearchUsers(
	ctx context.Context,
	req *userpb.SearchUsersRequest,
) ([]*caremanagerpb.User, int64, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, 0, err
	}

	response, err := sc.userService.SearchUsers(outgoingContext, req)
	if err != nil {
		return nil, 0, err
	}

	users := make([]*caremanagerpb.User, len(response.Users))
	for i, user := range response.Users {
		users[i] = UserProtoFromStationUserProto(user)
	}

	return users, response.TotalCount, nil
}

func (sc *StationClient) GetUserByID(ctx context.Context, id int64) (*caremanagerpb.User, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	response, err := sc.userService.GetUserByID(
		outgoingContext,
		&userpb.GetUserByIDRequest{UserId: id},
	)
	if err != nil {
		return nil, err
	}

	return UserProtoFromStationUserProto(response.User), nil
}

func (sc *StationClient) GetAddressesByID(ctx context.Context, ids []int64) ([]*caremanagerpb.Address, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	response, err := sc.addressService.GetAddressesByID(
		outgoingContext,
		&addresspb.GetAddressesByIDRequest{AddressIds: ids},
	)
	if err != nil {
		return nil, err
	}

	addresses := make([]*caremanagerpb.Address, len(response.Addresses))
	for i, address := range response.Addresses {
		addresses[i] = &caremanagerpb.Address{
			Id:                address.Id,
			CreatedAt:         address.CreatedAt,
			UpdatedAt:         address.UpdatedAt,
			StreetAddress_1:   address.StreetAddress_1,
			StreetAddress_2:   address.StreetAddress_2,
			City:              address.City,
			State:             address.State,
			Zipcode:           address.Zipcode,
			Latitude:          address.Latitude,
			Longitude:         address.Longitude,
			AdditionalDetails: address.AdditionalDetails,
		}
	}

	return addresses, nil
}

func (sc *StationClient) UpdateCareRequestStatus(
	ctx context.Context,
	careRequestID int64,
	status string,
	shiftTeamID *int64,
) error {
	requestPath := fmt.Sprintf("/api/care_requests/%v/update_status", careRequestID)
	requestBody := url.Values{
		"request_status": []string{status},
	}

	if status == careRequestStatusArchived {
		// TODO(CO-1570): replace the following message with the comment captured from the frontend.
		requestBody.Set("comment", resolveVisitComment)
	}

	if shiftTeamID != nil {
		requestBody.Set("meta_data[shift_team_id]", strconv.FormatInt(*shiftTeamID, 10))
	}

	return sc.stationHTTPClient.Request(ctx, &station.RequestConfig{
		ContentType: httpclient.ContentTypeFormURLEncoded,
		ForwardAuth: true,
		Method:      http.MethodPatch,
		Path:        requestPath,
		ReqBody:     requestBody,
	})
}

func (sc *StationClient) GetShiftTeamMemberIds(ctx context.Context, id int64) ([]int64, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	response, err := sc.shiftTeamService.GetShiftTeam(outgoingContext, &shiftteampb.GetShiftTeamRequest{Id: id})
	if err != nil {
		return nil, err
	}

	return response.ShiftTeam.MemberIds, nil
}

func (sc *StationClient) UpdateServiceLine(
	ctx context.Context,
	careRequestID int64,
	serviceLineID string,
	assignmentDate *string,
) error {
	requestPath := fmt.Sprintf("/api/care_requests/%d", careRequestID)
	requestBody := url.Values{}

	if serviceLineID == "" {
		return status.Error(codes.InvalidArgument, "service line ID cannot be empty")
	}

	requestBody.Set("care_request[service_line_id]", serviceLineID)

	if assignmentDate != nil {
		requestBody.Set("care_request[assignment_date]", *assignmentDate)
	}

	return sc.stationHTTPClient.Request(ctx, &station.RequestConfig{
		ContentType: httpclient.ContentTypeFormURLEncoded,
		ForwardAuth: true,
		Method:      http.MethodPatch,
		Path:        requestPath,
		ReqBody:     requestBody,
	})
}

func (sc *StationClient) DuplicateCareRequest(ctx context.Context, careRequestID int64) (*common.CareRequestInfo, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	response, err := sc.episodeService.DuplicateVisit(outgoingContext, &episodepb.DuplicateVisitRequest{
		CareRequestId: careRequestID,
	})
	if err != nil {
		return nil, err
	}

	return response.CareRequest, nil
}

func (sc *StationClient) GetPossibleServiceLines(ctx context.Context, careRequestID int64) ([]*episodepb.ServiceLine, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	response, err := sc.episodeService.GetVisitPossibleServiceLines(outgoingContext, &episodepb.GetVisitPossibleServiceLinesRequest{
		CareRequestId: careRequestID,
	})
	if err != nil {
		return nil, err
	}

	return response.ServiceLines, nil
}

func (sc *StationClient) CheckAvailability(ctx context.Context, params checkAvailabilityParams) (*AvailabilityResponse, error) {
	requestPath := "/api/markets/check_availability"

	response := &AvailabilityResponse{}

	err := sc.stationHTTPClient.Request(ctx, &station.RequestConfig{
		ForwardAuth: true,
		Method:      http.MethodPost,
		Path:        requestPath,
		ReqBody:     params,
		RespData:    response,
	})
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (sc *StationClient) GetCareRequest(ctx context.Context, careRequestID int64) (*common.CareRequestInfo, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	response, err := sc.episodeService.GetVisit(outgoingContext, &episodepb.GetVisitRequest{
		CareRequestId: careRequestID,
	})
	if err != nil {
		return nil, err
	}

	return response.CareRequest, nil
}

func (sc *StationClient) UpsertCareRequestETARange(ctx context.Context, params upsertCareRequestETARangeParams) error {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return err
	}

	_, err = sc.episodeService.UpsertVisitETARange(outgoingContext, &episodepb.UpsertVisitETARangeRequest{
		CareRequestId:       params.CareRequestID,
		CareRequestStatusId: params.CareRequestStatusID,
		ArrivalTimeWindow:   params.ArrivalTimeWindow,
	})

	return err
}

func (sc *StationClient) IsAdvancedCareAvailableForCareRequest(ctx context.Context, careRequestID int64) (bool, error) {
	serviceLines, err := sc.GetPossibleServiceLines(ctx, careRequestID)
	if err != nil {
		return false, err
	}

	for _, serviceLine := range serviceLines {
		if serviceLine.Name == serviceLineAdvancedCare {
			return true, nil
		}
	}

	return false, nil
}

func (sc *StationClient) CreateEHRAppointment(ctx context.Context, params createEHRAppointmentParams) (*string, error) {
	requestPath := "/api/ehrs/appointments"
	requestBody := url.Values{
		"care_request_id":               []string{strconv.FormatInt(params.CareRequestID, 10)},
		"appointment[department]":       []string{params.AppointmentPlaceOfService},
		"appointment[appointment_type]": []string{params.AppointmentType},
		"appointment[date]":             []string{params.AppointmentDate},
		"appointment[start_time]":       []string{params.AppointmentStartTime},
	}

	var response = &stationCreateEHRAppointmentResponse{}

	err := sc.stationHTTPClient.Request(ctx, &station.RequestConfig{
		ContentType: httpclient.ContentTypeFormURLEncoded,
		ForwardAuth: true,
		Method:      http.MethodPost,
		Path:        requestPath,
		ReqBody:     requestBody,
		RespData:    &response,
	})
	if err != nil {
		return nil, err
	}

	return &response.AppointmentID, nil
}

func (sc *StationClient) UpdateEHRAppointment(ctx context.Context, params updateEHRAppointmentParams) (*string, error) {
	requestPath := "/api/ehrs/appointments"
	requestBody := url.Values{
		"care_request_id":               []string{strconv.FormatInt(params.CareRequestID, 10)},
		"appointment[department]":       []string{params.AppointmentPlaceOfService},
		"appointment[appointment_type]": []string{params.AppointmentType},
	}

	var response = &stationUpdateEHRAppointmentResponse{}

	err := sc.stationHTTPClient.Request(ctx, &station.RequestConfig{
		ContentType: httpclient.ContentTypeFormURLEncoded,
		ForwardAuth: true,
		Method:      http.MethodPut,
		Path:        requestPath,
		ReqBody:     requestBody,
		RespData:    &response,
	})
	if err != nil {
		return nil, err
	}

	return &response.AppointmentID, nil
}

func (sc *StationClient) AssignVirtualAPP(ctx context.Context, careRequestID int64) error {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return err
	}

	_, err = sc.episodeService.AssignVirtualAPPToVisit(outgoingContext, &episodepb.AssignVirtualAPPToVisitRequest{CareRequestId: careRequestID})

	return err
}

func (sc *StationClient) UnassignVirtualAPP(ctx context.Context, careRequestID int64) error {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return err
	}

	_, err = sc.episodeService.UnassignVirtualAPPFromVisit(outgoingContext, &episodepb.UnassignVirtualAPPFromVisitRequest{CareRequestId: careRequestID})

	return err
}

func (sc *StationClient) CreateNote(ctx context.Context, params createNoteParams) (*StationNote, error) {
	requestPath := fmt.Sprintf("/api/care_requests/%d/notes", params.CareRequestID)
	requestBody := url.Values{
		"note[note]": []string{params.Details},
	}

	var response = &StationNote{}

	err := sc.stationHTTPClient.Request(ctx, &station.RequestConfig{
		ContentType: httpclient.ContentTypeFormURLEncoded,
		ForwardAuth: true,
		Method:      http.MethodPost,
		Path:        requestPath,
		ReqBody:     requestBody,
		RespData:    &response,
	})
	if err != nil {
		return nil, err
	}

	return response, nil
}

func (sc *StationClient) UpdateNote(ctx context.Context, params updateNoteParams) (*StationNote, error) {
	requestPath := fmt.Sprintf("/api/care_requests/%d/notes/%d", params.CareRequestID, params.NoteID)
	requestBody := url.Values{}
	if params.Details != nil {
		requestBody.Set("note[note]", *params.Details)
	}
	if params.Pinned != nil {
		requestBody.Set("note[featured]", strconv.FormatBool(*params.Pinned))
	}

	var notes []StationNote

	err := sc.stationHTTPClient.Request(ctx, &station.RequestConfig{
		ContentType: httpclient.ContentTypeFormURLEncoded,
		ForwardAuth: true,
		Method:      http.MethodPatch,
		Path:        requestPath,
		ReqBody:     requestBody,
		RespData:    &notes,
	})
	if err != nil {
		return nil, err
	}

	var response StationNote
	for _, note := range notes {
		if note.ID == params.NoteID {
			response = note
		}
	}

	return &response, nil
}

func (sc *StationClient) DeleteNote(ctx context.Context, params deleteNoteParams) error {
	requestPath := fmt.Sprintf("/api/care_requests/%d/notes/%d", params.CareRequestID, params.NoteID)

	return sc.stationHTTPClient.Request(ctx, &station.RequestConfig{
		ContentType: httpclient.ContentTypeFormURLEncoded,
		ForwardAuth: true,
		Method:      http.MethodDelete,
		Path:        requestPath,
	})
}

func (sc *StationClient) ListSoloDHMTShiftTeams(ctx context.Context, marketIDs []int64) ([]*shiftteampb.ShiftTeam, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	response, err := sc.shiftTeamService.ListSoloDHMTShiftTeams(outgoingContext, &shiftteampb.ListSoloDHMTShiftTeamsRequest{MarketIds: marketIDs})
	if err != nil {
		return nil, err
	}

	return response.GetShiftTeams(), nil
}

func (sc *StationClient) GetCareRequestDetails(
	ctx context.Context,
	req *episodepb.GetVisitRequest,
) (*GetCareRequestDetailsResult, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	visitResponse, err := sc.episodeService.GetVisit(outgoingContext, req)
	if err != nil {
		return nil, err
	}

	return &GetCareRequestDetailsResult{
		careRequest: StationCareRequestFromStationVisitResponse(visitResponse),
		patient:     StationPatientFromStationVisitResponse(visitResponse),
	}, nil
}

func (sc *StationClient) SearchCareRequests(
	ctx context.Context,
	params SearchCareRequestsParams,
) (SearchCareRequestsResults, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	visits, err := sc.episodeService.SearchVisits(
		outgoingContext,
		SearchVisitRequestFromSearchCareRequestsParams(params),
	)
	if err != nil {
		return nil, err
	}

	results := make(SearchCareRequestsResults, len(visits.CareRequests))

	for i, careRequest := range visits.CareRequests {
		results[i] = SearchCareRequestsResult{
			StationCareRequest: StationCareRequestListElementFromCareRequest(careRequest),
			StationPatient:     StationPatientListElementFromCareRequest(careRequest),
		}
	}

	return results, nil
}

func (sc *StationClient) ListCarsByIDs(ctx context.Context, carIDs []int64) ([]*common.Car, error) {
	outgoingContext, err := sc.getOutgoingContextWithAuth(ctx)
	if err != nil {
		return nil, err
	}

	response, err := sc.shiftTeamService.ListCarsByIDs(outgoingContext, &shiftteampb.ListCarsByIDsRequest{CarIds: carIDs})
	if err != nil {
		return nil, err
	}

	return response.GetCars(), nil
}

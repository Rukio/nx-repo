package providernotifications

import (
	"context"
	"encoding/json"
	"errors"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

const timezone = "America/Denver"

func getServiceDate(t *testing.T, dateTime time.Time, addDays int) *commonpb.Date {
	loc, err := time.LoadLocation(timezone)
	if err != nil {
		t.Fatal(err)
	}
	dateTimeTZ := dateTime.In(loc)
	addedDays := dateTimeTZ.AddDate(0, 0, addDays)

	return protoconv.TimeToProtoDate(&addedDays)
}

func TestSendScheduleChangedNotificationsToProviders(t *testing.T) {
	provider, err := providers.NewStatsigProvider(providers.StatsigProviderConfig{
		SDKKey:         "dummy",
		DefaultUserKey: "dummy",
		LocalMode:      true,
	})
	if err != nil {
		t.Fatal(err)
	}
	provider.Start()
	now := time.Now()
	todayDate := getServiceDate(t, now, 0)
	tomorrowDate := getServiceDate(t, now, 1)

	goodStationMarketsResponse := []StationMarket{
		{
			ID:           1,
			Name:         "Denver",
			ShortName:    "DEN",
			State:        "CO",
			TimeZoneName: timezone,
		},
	}
	goodStationShiftTeamsResponse := []StationShiftTeam{
		{
			ID:        1,
			MarketID:  proto.Int64(1),
			StartTime: now.Add(-time.Hour * 1).Format(time.RFC3339),
			EndTime:   now.Add(time.Hour * 1).Format(time.RFC3339),
			Car:       StationCar{ID: proto.Int64(1), Phone: proto.String("phone number")},
		},
	}
	goodServiceRegionSchedulesResponse := map[int64]*logisticspb.GetServiceRegionScheduleResponse{
		1: {
			DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
				{Meta: &logisticspb.ScheduleMetadata{ServiceDate: todayDate}, Schedules: []*logisticspb.ShiftTeamSchedule{
					{
						ShiftTeamId: 1,
						Route: &logisticspb.ShiftTeamRoute{
							Stops: []*logisticspb.ShiftTeamRouteStop{
								{Stop: &logisticspb.ShiftTeamRouteStop_Visit{
									Visit: &logisticspb.ShiftTeamVisit{
										CareRequestId: proto.Int64(1),
										Status:        logisticspb.ShiftTeamVisit_STATUS_UNCOMMITTED.Enum(),
									},
								}},
							},
						},
					},
				}},
				{Meta: &logisticspb.ScheduleMetadata{ServiceDate: tomorrowDate}},
			},
		},
	}
	defaultEnabledMarkets := []string{
		"DEN",
	}
	defaultNotificationCooldownMinutes := int64(30)
	breakStartTime := now.Add(-1 * time.Minute).Unix()
	breakDuration := int64(180)

	tcs := []struct {
		desc                                        string
		stationHTTPStatus                           map[string]int
		stationHTTPResponse                         map[string]any
		mockLogisticsServiceClient                  *MockLogisticsServiceClient
		mockTwilioClient                            *MockTwilioClient
		previousShiftTeamsUncommittedCareRequestIDs map[int64]int64
		shiftTeamsOnCooldown                        map[int64]time.Time
		careRequestIDsAlreadyNotifiedAbout          map[int64]int64
		disableNotifications                        bool
		enabledMarketsConfig                        []string

		wantSMSWasSentTimes                        int
		wantError                                  error
		wantNewShiftTeamsUncommittedCareRequestIDs map[int64]int64
	}{
		{
			desc: "should update previous shift schedules",
			stationHTTPStatus: map[string]int{
				"GET /api/markets":           http.StatusOK,
				"GET /api/shift_teams?ids=1": http.StatusOK,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets":           goodStationMarketsResponse,
				"GET /api/shift_teams?ids=1": goodStationShiftTeamsResponse,
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: goodServiceRegionSchedulesResponse,
				GetServiceRegionScheduleErr:    map[int64]error{},
			},
			mockTwilioClient: &MockTwilioClient{},
			previousShiftTeamsUncommittedCareRequestIDs: map[int64]int64{},

			wantSMSWasSentTimes:                        0,
			wantNewShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
		},
		{
			desc: "should send sms when prev and current schedules are equal, have uncommitted status and haven't ongoing statuses",
			stationHTTPStatus: map[string]int{
				"GET /api/markets":           http.StatusOK,
				"GET /api/shift_teams?ids=1": http.StatusOK,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets":           goodStationMarketsResponse,
				"GET /api/shift_teams?ids=1": goodStationShiftTeamsResponse,
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: goodServiceRegionSchedulesResponse,
				GetServiceRegionScheduleErr:    map[int64]error{},
			},
			mockTwilioClient: &MockTwilioClient{},
			previousShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},

			wantSMSWasSentTimes:                        1,
			wantNewShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
		},
		{
			desc: "should skip processing if shift team is on break",
			stationHTTPStatus: map[string]int{
				"GET /api/markets":           http.StatusOK,
				"GET /api/shift_teams?ids=1": http.StatusOK,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets":           goodStationMarketsResponse,
				"GET /api/shift_teams?ids=1": goodStationShiftTeamsResponse,
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: map[int64]*logisticspb.GetServiceRegionScheduleResponse{
					1: {
						DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
							{Meta: &logisticspb.ScheduleMetadata{ServiceDate: todayDate}, Schedules: []*logisticspb.ShiftTeamSchedule{
								{
									ShiftTeamId: 1,
									Route: &logisticspb.ShiftTeamRoute{
										Stops: []*logisticspb.ShiftTeamRouteStop{
											{Stop: &logisticspb.ShiftTeamRouteStop_Visit{
												Visit: &logisticspb.ShiftTeamVisit{
													CareRequestId: proto.Int64(1),
													Status:        logisticspb.ShiftTeamVisit_STATUS_UNCOMMITTED.Enum(),
												},
											}},
											{Stop: &logisticspb.ShiftTeamRouteStop_RestBreak{
												RestBreak: &logisticspb.ShiftTeamRestBreak{
													StartTimestampSec: &breakStartTime,
													DurationSec:       &breakDuration,
												},
											}},
										},
									},
								},
							}},
						},
					},
				},
				GetServiceRegionScheduleErr: map[int64]error{},
			},
			mockTwilioClient: &MockTwilioClient{},
			previousShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},

			wantSMSWasSentTimes:                        0,
			wantNewShiftTeamsUncommittedCareRequestIDs: map[int64]int64{},
		},
		{
			desc: "should skip processing when provider was notified within notification cooldown",
			stationHTTPStatus: map[string]int{
				"GET /api/markets":           http.StatusOK,
				"GET /api/shift_teams?ids=1": http.StatusOK,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets":           goodStationMarketsResponse,
				"GET /api/shift_teams?ids=1": goodStationShiftTeamsResponse,
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: goodServiceRegionSchedulesResponse,
				GetServiceRegionScheduleErr:    map[int64]error{},
			},
			mockTwilioClient: &MockTwilioClient{},
			previousShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
			shiftTeamsOnCooldown:                        map[int64]time.Time{1: now.Add(-time.Duration(defaultNotificationCooldownMinutes) / 2 * time.Minute)},

			wantSMSWasSentTimes:                        0,
			wantNewShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
		},
		{
			desc: "should send sms when last sent is not within notification cooldown",
			stationHTTPStatus: map[string]int{
				"GET /api/markets":           http.StatusOK,
				"GET /api/shift_teams?ids=1": http.StatusOK,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets":           goodStationMarketsResponse,
				"GET /api/shift_teams?ids=1": goodStationShiftTeamsResponse,
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: goodServiceRegionSchedulesResponse,
				GetServiceRegionScheduleErr:    map[int64]error{},
			},
			mockTwilioClient: &MockTwilioClient{},
			previousShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
			shiftTeamsOnCooldown:                        map[int64]time.Time{1: now.Add(-time.Duration(defaultNotificationCooldownMinutes+5) * time.Minute)},

			wantSMSWasSentTimes:                        1,
			wantNewShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
		},
		{
			desc: "should skip processing when provider was already notified about this care request",
			stationHTTPStatus: map[string]int{
				"GET /api/markets":           http.StatusOK,
				"GET /api/shift_teams?ids=1": http.StatusOK,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets":           goodStationMarketsResponse,
				"GET /api/shift_teams?ids=1": goodStationShiftTeamsResponse,
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: goodServiceRegionSchedulesResponse,
				GetServiceRegionScheduleErr:    map[int64]error{},
			},
			mockTwilioClient: &MockTwilioClient{},
			previousShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
			careRequestIDsAlreadyNotifiedAbout:          map[int64]int64{1: 1},

			wantSMSWasSentTimes:                        0,
			wantNewShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
		},
		{
			desc:                 "should skip processing when provider notifications flag disabled",
			disableNotifications: true,
			mockTwilioClient:     &MockTwilioClient{},

			wantSMSWasSentTimes: 0,
			wantError:           nil,
		},
		{
			desc: "should skip processing market schedules when market is not present in the statsig config",
			stationHTTPStatus: map[string]int{
				"GET /api/markets":           http.StatusOK,
				"GET /api/shift_teams?ids=1": http.StatusOK,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets":           goodStationMarketsResponse,
				"GET /api/shift_teams?ids=1": goodStationShiftTeamsResponse,
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: goodServiceRegionSchedulesResponse,
				GetServiceRegionScheduleErr:    map[int64]error{},
			},
			mockTwilioClient: &MockTwilioClient{},
			previousShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
			enabledMarketsConfig:                        []string{"ATL"},

			wantSMSWasSentTimes:                        0,
			wantNewShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
		},
		{
			desc: "should not send SMS if shift team has ongoing shift",
			stationHTTPStatus: map[string]int{
				"GET /api/markets":           http.StatusOK,
				"GET /api/shift_teams?ids=1": http.StatusOK,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets":           goodStationMarketsResponse,
				"GET /api/shift_teams?ids=1": goodStationShiftTeamsResponse,
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: map[int64]*logisticspb.GetServiceRegionScheduleResponse{
					1: {
						DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
							{Meta: &logisticspb.ScheduleMetadata{ServiceDate: todayDate}, Schedules: []*logisticspb.ShiftTeamSchedule{
								{
									ShiftTeamId: 1,
									Route: &logisticspb.ShiftTeamRoute{
										Stops: []*logisticspb.ShiftTeamRouteStop{
											{Stop: &logisticspb.ShiftTeamRouteStop_Visit{
												Visit: &logisticspb.ShiftTeamVisit{
													CareRequestId: proto.Int64(1),
													Status:        logisticspb.ShiftTeamVisit_STATUS_UNCOMMITTED.Enum(),
												},
											}},
											{Stop: &logisticspb.ShiftTeamRouteStop_Visit{
												Visit: &logisticspb.ShiftTeamVisit{
													CareRequestId: proto.Int64(1),
													Status:        logisticspb.ShiftTeamVisit_STATUS_ON_SCENE.Enum(),
												},
											}},
										},
									},
								},
							}},
							{Meta: &logisticspb.ScheduleMetadata{ServiceDate: tomorrowDate}},
						},
					},
				},
				GetServiceRegionScheduleErr: map[int64]error{},
			},
			mockTwilioClient: &MockTwilioClient{},
			previousShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},

			wantSMSWasSentTimes:                        0,
			wantNewShiftTeamsUncommittedCareRequestIDs: map[int64]int64{},
		},
		{
			desc: "should not send SMS if can not parse start date",
			stationHTTPStatus: map[string]int{
				"GET /api/markets":           http.StatusOK,
				"GET /api/shift_teams?ids=1": http.StatusOK,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets": goodStationMarketsResponse,
				"GET /api/shift_teams?ids=1": []StationShiftTeam{
					{
						ID:        1,
						MarketID:  proto.Int64(1),
						StartTime: "",
						EndTime:   now.Add(time.Hour * 1).Format(time.RFC3339),
						Car:       StationCar{ID: proto.Int64(1), Phone: proto.String("phone number")},
					},
				},
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: goodServiceRegionSchedulesResponse,
				GetServiceRegionScheduleErr:    map[int64]error{},
			},
			mockTwilioClient: &MockTwilioClient{},
			previousShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},

			wantSMSWasSentTimes:                        0,
			wantNewShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
		},
		{
			desc: "should not send SMS if can not parse end date",
			stationHTTPStatus: map[string]int{
				"GET /api/markets":           http.StatusOK,
				"GET /api/shift_teams?ids=1": http.StatusOK,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets": goodStationMarketsResponse,
				"GET /api/shift_teams?ids=1": []StationShiftTeam{
					{
						ID:        1,
						MarketID:  proto.Int64(1),
						StartTime: now.Add(-time.Hour * 1).Format(time.RFC3339),
						EndTime:   "",
						Car:       StationCar{ID: proto.Int64(1), Phone: proto.String("phone number")},
					},
				},
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: goodServiceRegionSchedulesResponse,
				GetServiceRegionScheduleErr:    map[int64]error{},
			},
			mockTwilioClient: &MockTwilioClient{},
			previousShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},

			wantSMSWasSentTimes:                        0,
			wantNewShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
		},
		{
			desc: "should not send SMS if shift team is not on shift",
			stationHTTPStatus: map[string]int{
				"GET /api/markets":           http.StatusOK,
				"GET /api/shift_teams?ids=1": http.StatusOK,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets": goodStationMarketsResponse,
				"GET /api/shift_teams?ids=1": []StationShiftTeam{
					{
						ID:        1,
						MarketID:  proto.Int64(1),
						StartTime: now.Add(time.Hour * 1).Format(time.RFC3339),
						EndTime:   now.Add(time.Hour * 2).Format(time.RFC3339),
						Car:       StationCar{ID: proto.Int64(1), Phone: proto.String("phone number")},
					},
				},
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: goodServiceRegionSchedulesResponse,
				GetServiceRegionScheduleErr:    map[int64]error{},
			},
			mockTwilioClient: &MockTwilioClient{},
			previousShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},

			wantSMSWasSentTimes:                        0,
			wantNewShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
		},
		{
			desc: "should not send SMS if there is no phone number",
			stationHTTPStatus: map[string]int{
				"GET /api/markets":           http.StatusOK,
				"GET /api/shift_teams?ids=1": http.StatusOK,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets": goodStationMarketsResponse,
				"GET /api/shift_teams?ids=1": []StationShiftTeam{
					{
						ID:        1,
						MarketID:  proto.Int64(1),
						StartTime: now.Add(-time.Hour * 1).Format(time.RFC3339),
						EndTime:   now.Add(time.Hour * 1).Format(time.RFC3339),
						Car:       StationCar{ID: proto.Int64(1)},
					},
				},
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: goodServiceRegionSchedulesResponse,
				GetServiceRegionScheduleErr:    map[int64]error{},
			},
			mockTwilioClient: &MockTwilioClient{},
			previousShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},

			wantSMSWasSentTimes:                        0,
			wantNewShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
		},
		{
			desc: "should not send SMS if there is wrong phone number",
			stationHTTPStatus: map[string]int{
				"GET /api/markets":           http.StatusOK,
				"GET /api/shift_teams?ids=1": http.StatusOK,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets": goodStationMarketsResponse,
				"GET /api/shift_teams?ids=1": []StationShiftTeam{
					{
						ID:        1,
						MarketID:  proto.Int64(1),
						StartTime: now.Add(-time.Hour * 1).Format(time.RFC3339),
						EndTime:   now.Add(time.Hour * 1).Format(time.RFC3339),
						Car:       StationCar{ID: proto.Int64(1), Phone: proto.String("wrong number")},
					},
				},
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: goodServiceRegionSchedulesResponse,
				GetServiceRegionScheduleErr:    map[int64]error{},
			},
			mockTwilioClient: &MockTwilioClient{SendSMSErr: errors.New("wrong number format")},
			previousShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},

			wantSMSWasSentTimes:                        0,
			wantNewShiftTeamsUncommittedCareRequestIDs: map[int64]int64{1: 1},
		},
		{
			desc:              "should return error when unable to get station markets",
			stationHTTPStatus: map[string]int{"GET /api/markets": http.StatusInternalServerError},
			mockTwilioClient:  &MockTwilioClient{},

			wantSMSWasSentTimes: 0,
			wantError:           status.Error(codes.Internal, "HTTP request had error response 500: "),
		},
		{
			desc: "should return error: wrong station markets response",
			stationHTTPStatus: map[string]int{
				"GET /api/markets": http.StatusInternalServerError,
			},
			stationHTTPResponse: map[string]any{
				"GET /api/markets": nil,
			},
			mockTwilioClient: &MockTwilioClient{},

			wantError: status.Error(codes.Internal, "HTTP request had error response 500: null"),
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			enabledMarkets := defaultEnabledMarkets
			if tc.enabledMarketsConfig != nil {
				enabledMarkets = tc.enabledMarketsConfig
			}
			err = provider.OverrideStruct(providerNotificationsSettingsStatsigKey, &settings{
				EnabledMarkets:              enabledMarkets,
				NotificationCooldownMinutes: defaultNotificationCooldownMinutes,
			})
			if err != nil {
				t.Fatal(err)
			}
			provider.OverrideGate(providerNotificationsStatsigFlag, !tc.disableNotifications)
			stationServer := httptest.NewServer(http.HandlerFunc(
				func(rw http.ResponseWriter, req *http.Request) {
					rw.WriteHeader(tc.stationHTTPStatus[req.Method+" "+req.RequestURI])
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

			logger := zap.NewNop().Sugar()
			cronService := NewCronService(
				NewCronServiceParams{
					StationClient: &StationClient{
						StationHTTPClient: &station.Client{
							AuthToken:  mockAuthValuer{},
							StationURL: stationServer.URL,
							HTTPClient: stationServer.Client(),
						},
					},
					LogisticsService: tc.mockLogisticsServiceClient,
					TwilioClient:     tc.mockTwilioClient,
					StatsigProvider:  provider,
					Logger:           logger,
				},
			)
			cronService.MarketsState = map[int64]*MarketData{1: {
				PreviousShiftTeamsUncommittedCareRequestIDs: tc.previousShiftTeamsUncommittedCareRequestIDs,
				ShiftTeamsOnCooldown:                        tc.shiftTeamsOnCooldown,
				CareRequestIDsAlreadyNotifiedAbout:          tc.careRequestIDsAlreadyNotifiedAbout,
			}}

			err := cronService.SendScheduleChangedNotificationsToProviders(context.Background())

			testutils.MustMatch(t, tc.wantError, err)
			testutils.MustMatch(t, tc.wantSMSWasSentTimes, tc.mockTwilioClient.SMSWasSentTimes)
			testutils.MustMatch(t, tc.wantNewShiftTeamsUncommittedCareRequestIDs, cronService.MarketsState[1].PreviousShiftTeamsUncommittedCareRequestIDs)
		})
	}
}

func TestMarketSchedulesForToday(t *testing.T) {
	now := time.Now()
	todayDate := getServiceDate(t, now, 0)
	tomorrowDate := getServiceDate(t, now, 1)
	market := StationMarket{
		ID:           1,
		Name:         "Denver",
		ShortName:    "DEN",
		State:        "CO",
		TimeZoneName: timezone,
	}
	tcs := []struct {
		desc                       string
		market                     StationMarket
		mockLogisticsServiceClient *MockLogisticsServiceClient

		want []*logisticspb.ShiftTeamSchedule
	}{
		{
			desc:   "should return schedule for today",
			market: market,
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: map[int64]*logisticspb.GetServiceRegionScheduleResponse{
					1: {
						DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
							{
								Meta:      &logisticspb.ScheduleMetadata{ServiceDate: todayDate},
								Schedules: []*logisticspb.ShiftTeamSchedule{{ShiftTeamId: 1}},
							},
						},
					},
				},
				GetServiceRegionScheduleErr: map[int64]error{},
			},

			want: []*logisticspb.ShiftTeamSchedule{{ShiftTeamId: 1}},
		},
		{
			desc:   "should return schedule for today (empty Meta)",
			market: market,
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: map[int64]*logisticspb.GetServiceRegionScheduleResponse{
					1: {
						DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
							{
								ServiceDate: todayDate,
								Schedules:   []*logisticspb.ShiftTeamSchedule{{ShiftTeamId: 1}},
							},
						},
					},
				},
				GetServiceRegionScheduleErr: map[int64]error{},
			},

			want: []*logisticspb.ShiftTeamSchedule{{ShiftTeamId: 1}},
		},
		{
			desc: "incorrect timezone - should return empty array",
			market: StationMarket{
				ID:           1,
				Name:         "Denver",
				ShortName:    "DEN",
				State:        "CO",
				TimeZoneName: "wrong time zone",
			},
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: map[int64]*logisticspb.GetServiceRegionScheduleResponse{
					1: {
						DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
							{
								Meta:      &logisticspb.ScheduleMetadata{ServiceDate: todayDate},
								Schedules: []*logisticspb.ShiftTeamSchedule{{ShiftTeamId: 1}},
							},
						},
					},
				},
				GetServiceRegionScheduleErr: map[int64]error{},
			},

			want: []*logisticspb.ShiftTeamSchedule{},
		},
		{
			desc:   "schedule does not exist for today - should return empty array",
			market: market,
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleResult: map[int64]*logisticspb.GetServiceRegionScheduleResponse{
					1: {
						DateSchedules: []*logisticspb.ServiceRegionDateSchedule{
							{
								Meta:      &logisticspb.ScheduleMetadata{ServiceDate: tomorrowDate},
								Schedules: []*logisticspb.ShiftTeamSchedule{{ShiftTeamId: 1}},
							},
						},
					},
				},
				GetServiceRegionScheduleErr: map[int64]error{},
			},

			want: []*logisticspb.ShiftTeamSchedule{},
		},
		{
			desc:   "should return empty array because of error",
			market: market,
			mockLogisticsServiceClient: &MockLogisticsServiceClient{
				GetServiceRegionScheduleErr: map[int64]error{1: errors.New("error")},
			},

			want: []*logisticspb.ShiftTeamSchedule{},
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			logger := zap.NewNop().Sugar()
			cronService := NewCronService(
				NewCronServiceParams{
					LogisticsService: tc.mockLogisticsServiceClient,
					Logger:           logger,
				},
			)
			got := cronService.marketSchedulesForToday(context.Background(), tc.market)

			testutils.MustMatch(t, tc.want, got)
		})
	}
}

func TestIdentifyShiftsToNotify(t *testing.T) {
	testCases := []struct {
		desc     string
		previous map[int64]int64
		current  map[int64]int64

		want []int64
	}{
		{
			desc: "should return shift team with changed schedule",
			previous: map[int64]int64{
				1: 123,
				2: 456,
			},
			current: map[int64]int64{
				1: 123,
				2: 789,
			},

			want: []int64{1},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.desc, func(t *testing.T) {
			response := identifyShiftsToNotify(tc.previous, map[int64]time.Time{}, map[int64]int64{}, tc.current)
			testutils.MustMatch(t, tc.want, response)
		})
	}
}

func TestShiftTeamsNotifiedWithinNotificationCooldown(t *testing.T) {
	now := time.Now()
	defaultNotificationCooldownMinutes := int64(30)
	settings := settings{NotificationCooldownMinutes: defaultNotificationCooldownMinutes}

	testCases := []struct {
		desc     string
		previous map[int64]time.Time

		want map[int64]time.Time
	}{
		{
			desc: "should return the shifts when half of cooldown passed",
			previous: map[int64]time.Time{
				1: now.Add(-time.Duration(defaultNotificationCooldownMinutes/2) * time.Minute),
			},

			want: map[int64]time.Time{
				1: now.Add(-time.Duration(defaultNotificationCooldownMinutes/2) * time.Minute),
			},
		},
		{
			desc: "should return 0 shifts when cooldown passed",
			previous: map[int64]time.Time{
				1: now.Add(-time.Duration(defaultNotificationCooldownMinutes+1) * time.Minute),
			},

			want: map[int64]time.Time{},
		},
	}

	for _, tc := range testCases {
		t.Run(tc.desc, func(t *testing.T) {
			response := shiftTeamsNotifiedWithinNotificationCooldown(tc.previous, now, settings)
			testutils.MustMatch(t, tc.want, response)
		})
	}
}

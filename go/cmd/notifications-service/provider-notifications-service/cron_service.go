package providernotifications

import (
	"context"
	"sync"
	"time"

	"github.com/*company-data-covered*/services/go/cmd/notifications-service/twilio-service"
	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"go.uber.org/zap"
	"golang.org/x/exp/slices"
	"google.golang.org/protobuf/proto"
)

const (
	newPatientOnScheduleMessageTemplate     = "Please check Dashboard - there is a new patient on your schedule"
	providerNotificationsStatsigFlag        = "provider_notifications_shift_schedule"
	providerNotificationsSettingsStatsigKey = "provider_notifications_shift_schedule_settings"
)

var (
	ongoingStatuses = []logisticspb.ShiftTeamVisit_Status{
		logisticspb.ShiftTeamVisit_STATUS_COMMITTED,
		logisticspb.ShiftTeamVisit_STATUS_EN_ROUTE,
		logisticspb.ShiftTeamVisit_STATUS_ON_SCENE,
	}
	uncommittedStatuses = []logisticspb.ShiftTeamVisit_Status{
		logisticspb.ShiftTeamVisit_STATUS_UNCOMMITTED,
	}
)

type CronService struct {
	Logger           *zap.SugaredLogger
	StationClient    *StationClient
	LogisticsService logisticspb.LogisticsServiceClient
	TwilioClient     twilio.Client
	MarketsState     map[int64]*MarketData
	StatsigProvider  *providers.StatsigProvider

	mx sync.RWMutex
}

type MarketData struct {
	PreviousShiftTeamsUncommittedCareRequestIDs map[int64]int64
	ShiftTeamsOnCooldown                        map[int64]time.Time
	CareRequestIDsAlreadyNotifiedAbout          map[int64]int64
}

type NewCronServiceParams struct {
	StationClient    *StationClient
	LogisticsService logisticspb.LogisticsServiceClient
	TwilioClient     twilio.Client
	StatsigProvider  *providers.StatsigProvider
	Logger           *zap.SugaredLogger
}

func NewCronService(params NewCronServiceParams) *CronService {
	return &CronService{
		StationClient:    params.StationClient,
		LogisticsService: params.LogisticsService,
		TwilioClient:     params.TwilioClient,
		StatsigProvider:  params.StatsigProvider,
		Logger:           params.Logger,
		MarketsState:     map[int64]*MarketData{},
	}
}

func (cs *CronService) createMapOfShiftsWithUncommittedCareRequests(schedules []*logisticspb.ShiftTeamSchedule, now time.Time) map[int64]int64 {
	shiftTeamsUncommittedCareRequestIDs := make(map[int64]int64)
	for _, schedule := range schedules {
		hasUncommitted := false
		hasOngoing := false
		isOnRestBreak := false
		uncommittedCRID := int64(0)
		for _, routeStop := range schedule.GetRoute().GetStops() {
			if visit := routeStop.GetVisit(); visit != nil {
				visitStatus := visit.GetStatus()
				if slices.Contains(ongoingStatuses, visitStatus) {
					hasOngoing = true
					break
				}
				if !hasUncommitted && slices.Contains(uncommittedStatuses, visitStatus) {
					hasUncommitted = true
					uncommittedCRID = visit.GetCareRequestId()
				}
			}
			if restBreak := routeStop.GetRestBreak(); restBreak != nil {
				startTimestampSec := restBreak.GetStartTimestampSec()
				duration := restBreak.GetDurationSec()

				breakStartTime := time.Unix(startTimestampSec, 0)
				breakEndTime := time.Unix(startTimestampSec+duration, 0)

				if now.UTC().After(breakStartTime) && now.UTC().Before(breakEndTime) {
					cs.Logger.Debugw("shift team is currently on a rest break", "shiftTeamID", schedule.GetShiftTeamId())
					isOnRestBreak = true
					break
				}
			}
		}
		if !hasOngoing && !isOnRestBreak && hasUncommitted {
			shiftTeamsUncommittedCareRequestIDs[schedule.GetShiftTeamId()] = uncommittedCRID
		}
	}
	return shiftTeamsUncommittedCareRequestIDs
}

func identifyShiftsToNotify(previousShiftTeamsUncommittedCareRequestIDs map[int64]int64, shiftTeamsOnCooldown map[int64]time.Time, careRequestIDsAlreadyNotifiedAbout map[int64]int64, shiftTeamsUncommittedCareRequestIDs map[int64]int64) []int64 {
	results := []int64{}
	for shiftTeamID, careRequestID := range shiftTeamsUncommittedCareRequestIDs {
		prevCareRequestID, ok := previousShiftTeamsUncommittedCareRequestIDs[shiftTeamID]
		if !ok || prevCareRequestID != careRequestID {
			continue
		}
		notifiedCareRequestID, ok := careRequestIDsAlreadyNotifiedAbout[shiftTeamID]
		if ok && notifiedCareRequestID == careRequestID {
			continue
		}
		if _, ok := shiftTeamsOnCooldown[shiftTeamID]; ok {
			continue
		}

		results = append(results, shiftTeamID)
	}
	return results
}

func shiftTeamsNotifiedWithinNotificationCooldown(previousShiftTeamsOnCooldown map[int64]time.Time, now time.Time, settings settings) map[int64]time.Time {
	shiftTeamsOnCooldown := make(map[int64]time.Time)
	if previousShiftTeamsOnCooldown == nil {
		return shiftTeamsOnCooldown
	}

	for shiftTeamID, notifiedAt := range previousShiftTeamsOnCooldown {
		if settings.IsWithinNotificationCooldown(notifiedAt, now) {
			shiftTeamsOnCooldown[shiftTeamID] = notifiedAt
		}
	}
	return shiftTeamsOnCooldown
}

func lastCareRequestsShiftTeamsWereNotifiedAbout(previousCareRequestIDsAlreadyNotifiedAbout map[int64]int64, shiftSchedules map[int64]int64) map[int64]int64 {
	careRequestIDsAlreadyNotifiedAbout := make(map[int64]int64)
	if previousCareRequestIDsAlreadyNotifiedAbout == nil {
		return careRequestIDsAlreadyNotifiedAbout
	}

	for shiftTeamID := range shiftSchedules {
		if careRequestID, ok := previousCareRequestIDsAlreadyNotifiedAbout[shiftTeamID]; ok {
			careRequestIDsAlreadyNotifiedAbout[shiftTeamID] = careRequestID
		}
	}
	return careRequestIDsAlreadyNotifiedAbout
}

func (cs *CronService) SendScheduleChangedNotificationsToProviders(ctx context.Context) error {
	if !cs.StatsigProvider.Bool(providerNotificationsStatsigFlag, false) {
		return nil
	}

	var providerNotificationsSettings settings
	err := cs.StatsigProvider.Struct(providerNotificationsSettingsStatsigKey, &providerNotificationsSettings)
	if err != nil {
		cs.Logger.Errorw("statsig error getting provider notifications shift schedule settings", err)
		return err
	}

	markets, err := cs.StationClient.FetchStationMarkets(ctx)
	if err != nil {
		cs.Logger.Errorw("station error getting markets", err)
		return err
	}

	wg := sync.WaitGroup{}
	wg.Add(len(markets))
	for _, market := range markets {
		currentMarket := market
		go func() {
			defer wg.Done()

			loggerWithMarketName := cs.Logger.With("market", currentMarket.ShortName)

			time.Sleep(providerNotificationsSettings.NextJitterInterval())

			if !providerNotificationsSettings.HasMarketShortName(currentMarket.ShortName) {
				return
			}

			cs.mx.RLock()
			marketState, ok := cs.MarketsState[currentMarket.ID]
			cs.mx.RUnlock()

			if !ok {
				marketState = &MarketData{}
				cs.mx.Lock()
				cs.MarketsState[currentMarket.ID] = marketState
				cs.mx.Unlock()
			}

			now := time.Now()
			shiftTeamsOnCooldown := shiftTeamsNotifiedWithinNotificationCooldown(marketState.ShiftTeamsOnCooldown, now, providerNotificationsSettings)

			schedules := cs.marketSchedulesForToday(ctx, currentMarket)
			loggerWithMarketName.Debugw("market schedules for today", "schedules", schedules)

			shiftTeamsUncommittedCareRequestIDs := cs.createMapOfShiftsWithUncommittedCareRequests(schedules, now)
			loggerWithMarketName.Debugw("map of shifts with uncommitted care requests", "shiftTeamsUncommittedCareRequestIDs", shiftTeamsUncommittedCareRequestIDs)

			careRequestIDsAlreadyNotifiedAbout := lastCareRequestsShiftTeamsWereNotifiedAbout(marketState.CareRequestIDsAlreadyNotifiedAbout, shiftTeamsUncommittedCareRequestIDs)
			loggerWithMarketName.Debugw("map of previous care requests shift teams were notified about", "careRequestIDsAlreadyNotifiedAbout", careRequestIDsAlreadyNotifiedAbout)

			shiftTeamsToNotifyIDs := identifyShiftsToNotify(marketState.PreviousShiftTeamsUncommittedCareRequestIDs, shiftTeamsOnCooldown, careRequestIDsAlreadyNotifiedAbout, shiftTeamsUncommittedCareRequestIDs)
			loggerWithMarketName.Debugw("shifts with the same suggested care request more than 5 minutes", "shiftTeamsToNotifyIDs", shiftTeamsToNotifyIDs)

			marketState.PreviousShiftTeamsUncommittedCareRequestIDs = shiftTeamsUncommittedCareRequestIDs

			shiftTeams, err := cs.StationClient.FetchStationShiftTeamsByIDs(ctx, shiftTeamsToNotifyIDs)
			if err != nil {
				cs.Logger.Errorw("station getting shift teams error", err)
				return
			}

			for _, shiftTeam := range shiftTeams {
				careRequestID := shiftTeamsUncommittedCareRequestIDs[shiftTeam.ID]
				shiftTeamStartTime, err := time.Parse(time.RFC3339, shiftTeam.StartTime)
				if err != nil {
					loggerWithMarketName.Errorw("shift teams error: can not parse start time", "shiftTeamID", shiftTeam.ID, "careRequestID", careRequestID, err)
					continue
				}
				shiftTeamEndTime, err := time.Parse(time.RFC3339, shiftTeam.EndTime)
				if err != nil {
					loggerWithMarketName.Errorw("shift teams error: can not parse end time", "shiftTeamID", shiftTeam.ID, "careRequestID", careRequestID, err)
					continue
				}

				if !(now.UTC().After(shiftTeamStartTime) && now.UTC().Before(shiftTeamEndTime)) {
					loggerWithMarketName.Debugw("now is not shift team's working time", "shiftTeamID", shiftTeam.ID, "careRequestID", careRequestID)
					continue
				}

				if shiftTeam.Car.Phone == nil {
					loggerWithMarketName.Errorw("shift team's car doesn't have a phone number", "shiftTeamID", shiftTeam.ID, "careRequestID", careRequestID)
					continue
				}

				resp, err := cs.TwilioClient.CreateMessage(*shiftTeam.Car.Phone, newPatientOnScheduleMessageTemplate)
				if err != nil {
					loggerWithMarketName.Errorw("could not send SMS", "shiftTeamID", shiftTeam.ID, "careRequestID", careRequestID, err)
					continue
				}
				shiftTeamsOnCooldown[shiftTeam.ID] = now
				careRequestIDsAlreadyNotifiedAbout[shiftTeam.ID] = careRequestID
				loggerWithMarketName.Debugw("SMS was sent", "shiftTeamID", shiftTeam.ID, "careRequestID", careRequestID, "message SID", resp.Sid)
			}
			marketState.ShiftTeamsOnCooldown = shiftTeamsOnCooldown
			marketState.CareRequestIDsAlreadyNotifiedAbout = careRequestIDsAlreadyNotifiedAbout
		}()
	}
	wg.Wait()
	return nil
}

func (cs *CronService) marketSchedulesForToday(ctx context.Context, market StationMarket) []*logisticspb.ShiftTeamSchedule {
	loggerWithMarketName := cs.Logger.With("market", market.ShortName)
	tzLoc, err := time.LoadLocation(market.TimeZoneName)
	if err != nil {
		loggerWithMarketName.Errorw("error getting time zone", "time zone name", market.TimeZoneName, err)
		return []*logisticspb.ShiftTeamSchedule{}
	}
	marketSchedule, err := cs.LogisticsService.GetServiceRegionSchedule(ctx, &logisticspb.GetServiceRegionScheduleRequest{
		MarketId: proto.Int64(market.ID),
	})
	if err != nil {
		loggerWithMarketName.Errorw("error getting service region schedule", "market", market.ShortName, err)
		return []*logisticspb.ShiftTeamSchedule{}
	}
	nowMarketTZ := time.Now().In(tzLoc)
	todayDate := protoconv.TimeToProtoDate(&nowMarketTZ)
	for _, dateSchedule := range marketSchedule.GetDateSchedules() {
		serviceDate := dateSchedule.GetMeta().GetServiceDate()
		if serviceDate == nil {
			serviceDate = dateSchedule.GetServiceDate()
		}
		if proto.Equal(todayDate, serviceDate) {
			return dateSchedule.GetSchedules()
		}
	}
	loggerWithMarketName.Errorw("can't find today schedule for market", "date", todayDate, err)
	return []*logisticspb.ShiftTeamSchedule{}
}

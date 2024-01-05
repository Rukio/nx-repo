package main

import (
	"context"
	"regexp"
	"time"

	shiftschedulepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_schedule"
	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type GRPCServer struct {
	shiftschedulepb.UnimplementedShiftScheduleServiceServer
	StationClient    *station.Client
	ShiftAdminClient *ShiftAdminClient
	Logger           *zap.SugaredLogger
}

const (
	dateLayout               = "2006-01-02"
	scheduledShiftTimeLayout = "1/2/2006 15:04"
)

var (
	splitByWordRegex = regexp.MustCompile(`[A-Z]+`)
)

func NewGRPCServer(stationClient *station.Client, shiftAdminClient *ShiftAdminClient, logger *zap.SugaredLogger) *GRPCServer {
	return &GRPCServer{
		StationClient:    stationClient,
		ShiftAdminClient: shiftAdminClient,
		Logger:           logger,
	}
}

type ScheduledShiftGroupKey struct {
	UserID     int64
	ShiftStart string
	ShiftEnd   string
}

func (s *GRPCServer) SyncStationOnCallShiftsFromShiftAdmin(ctx context.Context, req *shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest) (*shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminResponse, error) {
	var startDate, endDate string
	reqStartDate := req.GetStartDate()
	reqEndDate := req.GetEndDate()
	switch {
	case reqStartDate != nil && reqEndDate != nil:
		startDate = *protoconv.ProtoDateToString(reqStartDate, dateLayout)
		endDate = *protoconv.ProtoDateToString(reqEndDate, dateLayout)
	case reqStartDate != nil || reqEndDate != nil:
		return nil, status.Error(codes.InvalidArgument, "if an interval is selected, then both values StartDate and EndDate should be specified")
	default:
		startDate = time.Now().AddDate(0, 0, 1).Format(dateLayout)
		endDate = time.Now().AddDate(0, 0, 1).Format(dateLayout)
	}

	stationMarkets, err := s.fetchStationMarkets(ctx)
	if err != nil {
		return nil, err
	}
	marketIDsByState := make(map[string][]int64, len(stationMarkets))
	marketIDsByShortName := make(map[string][]int64, len(stationMarkets))
	for _, market := range stationMarkets {
		marketIDsByState[market.State] = append(marketIDsByState[market.State], market.ID)
		marketIDsByShortName[market.ShortName] = append(marketIDsByShortName[market.ShortName], market.ID)
	}

	shiftAdminGroups, err := s.fetchGroups(ctx)
	if err != nil {
		return nil, err
	}
	var timeZone string
	for _, group := range shiftAdminGroups {
		if group.GroupID == *shiftAdminVirtualGroupID {
			timeZone = group.TimeZone
			break
		}
	}
	groupTZ, err := time.LoadLocation(timeZone)
	if err != nil {
		return nil, err
	}

	shiftAdminScheduledShifts, err := s.fetchScheduledShifts(ctx, &FetchShiftAdminScheduledShiftsRequest{StartDate: startDate, EndDate: endDate, GroupID: *shiftAdminVirtualGroupID, Sort: "shift_id:ASC"})
	if err != nil {
		return nil, err
	}
	scheduledShiftGroups := make(map[ScheduledShiftGroupKey][]ShiftAdminScheduledShift, len(shiftAdminScheduledShifts))
	for _, scheduledShift := range shiftAdminScheduledShifts {
		scheduledShiftKey := ScheduledShiftGroupKey{UserID: scheduledShift.UserID, ShiftStart: scheduledShift.ShiftStart, ShiftEnd: scheduledShift.ShiftEnd}
		scheduledShiftGroups[scheduledShiftKey] = append(scheduledShiftGroups[scheduledShiftKey], scheduledShift)
	}

	shiftAdminUsers, err := s.fetchUsers(ctx, &FetchShiftAdminUsersRequest{GroupID: *shiftAdminVirtualGroupID})
	if err != nil {
		return nil, err
	}
	shiftAdminUsersByID := make(map[int64]ShiftAdminUser, len(shiftAdminUsers))
	for _, user := range shiftAdminUsers {
		shiftAdminUsersByID[user.UserID] = user
	}

	for groupKey, scheduledShifts := range scheduledShiftGroups {
		shiftAdminUser, ok := shiftAdminUsersByID[groupKey.UserID]
		if !ok {
			s.Logger.Errorw("Can't find shift admin user", "scheduled_shifts", scheduledShifts)
			continue
		}

		startTime, err := time.ParseInLocation(scheduledShiftTimeLayout, groupKey.ShiftStart, groupTZ)
		if err != nil {
			s.Logger.Errorw("Can't parse shift_start", "scheduled_shifts", scheduledShifts, zap.Error(err))
			continue
		}

		endTime, err := time.ParseInLocation(scheduledShiftTimeLayout, groupKey.ShiftEnd, groupTZ)
		if err != nil {
			s.Logger.Errorw("Can't parse shift_end", "scheduled_shifts", scheduledShifts, zap.Error(err))
			continue
		}

		onCallShiftMarketIDs := make([]int64, 0)
		for _, scheduledShift := range scheduledShifts {
			foundWords := splitByWordRegex.FindAllString(scheduledShift.ShiftShortName, -1)
			if len(foundWords) == 0 {
				s.Logger.Errorw("Can't parse shift_short_name", "scheduled_shifts", []ShiftAdminScheduledShift{scheduledShift})
				continue
			}
			if len(foundWords) > 1 {
				foundMarketIDsByShortName := marketIDsByShortName[foundWords[1]]
				if len(foundMarketIDsByShortName) > 0 {
					onCallShiftMarketIDs = append(onCallShiftMarketIDs, foundMarketIDsByShortName...)
					continue
				}
			}
			state := foundWords[0]
			foundMarketIDs := marketIDsByState[state]
			if len(foundMarketIDs) == 0 {
				s.Logger.Errorw("Can't find station markets", "state", state, "scheduled_shifts", []ShiftAdminScheduledShift{scheduledShift})
				continue
			}
			onCallShiftMarketIDs = append(onCallShiftMarketIDs, foundMarketIDs...)
		}
		_, err = s.createStationOnCallShiftTeam(ctx, &StationOnCallShiftTeamRequest{&StationOnCallShiftTeam{OnCallDoctorEmail: &shiftAdminUser.Email, StartTime: startTime, EndTime: endTime, MarketIDs: onCallShiftMarketIDs}})
		if err != nil {
			s.Logger.Errorw("Can't create on_call_shift_team in station", "scheduled_shifts", scheduledShifts, zap.Error(err))
			continue
		}
	}
	return &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminResponse{}, nil
}

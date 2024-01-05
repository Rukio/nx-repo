package main

import (
	"context"
	"net/http"
)

type ShiftAdminScheduledShift struct {
	ScheduledShiftID int64  `json:"scheduled_shift_id"`
	GroupID          int64  `json:"group_id"`
	UserID           int64  `json:"user_id"`
	EmployeeID       string `json:"employee_id"`
	FirstName        string `json:"first_name"`
	LastName         string `json:"last_name"`
	ShiftName        string `json:"shift_name"`
	ShiftShortName   string `json:"shift_short_name"`
	ShiftStart       string `json:"shift_start"`
	ShiftEnd         string `json:"shift_end"`
}

type ShiftAdminGroup struct {
	GroupID   int64  `json:"group_id"`
	Name      string `json:"name"`
	ShortName string `json:"short_name"`
	TimeZone  string `json:"time_zone"`
	IsActive  int    `json:"is_active"`
}

type ShiftAdminUser struct {
	UserID     int64  `json:"user_id"`
	EmployeeID string `json:"employee_id"`
	FirstName  string `json:"first_name"`
	LastName   string `json:"last_name"`
	Email      string `json:"email"`
}

type FetchShiftAdminScheduledShiftsRequest struct {
	StartDate string `json:"start_date"`
	EndDate   string `json:"end_date"`
	GroupID   int64  `json:"group_id"`
	Sort      string `json:"sort"`
}

type FetchShiftAdminUsersRequest struct {
	GroupID int64 `json:"group_id"`
}

func (s *GRPCServer) fetchScheduledShifts(ctx context.Context, req *FetchShiftAdminScheduledShiftsRequest) ([]ShiftAdminScheduledShift, error) {
	var scheduledShifts []ShiftAdminScheduledShift
	err := s.ShiftAdminClient.Request(ctx, &ShiftAdminRequestConfig{
		Method:   http.MethodPost,
		Path:     "/vdh/org_scheduled_shifts",
		RespData: &scheduledShifts,
		ReqBody:  req,
	})
	if err != nil {
		return nil, err
	}
	return scheduledShifts, nil
}

func (s *GRPCServer) fetchGroups(ctx context.Context) ([]ShiftAdminGroup, error) {
	var groups []ShiftAdminGroup
	err := s.ShiftAdminClient.Request(ctx, &ShiftAdminRequestConfig{
		Method:   http.MethodPost,
		Path:     "/vdh/org_groups",
		RespData: &groups,
	})
	if err != nil {
		return nil, err
	}
	return groups, nil
}

func (s *GRPCServer) fetchUsers(ctx context.Context, req *FetchShiftAdminUsersRequest) ([]ShiftAdminUser, error) {
	var users []ShiftAdminUser
	err := s.ShiftAdminClient.Request(ctx, &ShiftAdminRequestConfig{
		Method:   http.MethodPost,
		Path:     "/vdh/org_users",
		RespData: &users,
		ReqBody:  req,
	})
	if err != nil {
		return nil, err
	}
	return users, nil
}

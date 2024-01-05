package main

import (
	"context"

	shiftschedulepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_schedule"
)

// SyncOnCallShiftsJob TODO: PE-1894 - add FF check to prevent the job from being called.
func (s *GRPCServer) SyncOnCallShiftsJob() error {
	_, err := s.SyncStationOnCallShiftsFromShiftAdmin(context.Background(), &shiftschedulepb.SyncStationOnCallShiftsFromShiftAdminRequest{})
	return err
}

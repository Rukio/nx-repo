package main

import (
	"context"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/buildinfo"

	shiftschedulepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/shift_schedule"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestCheck(t *testing.T) {
	version := buildinfo.Version
	tcs := []struct {
		desc string
		want *shiftschedulepb.CheckResponse
	}{
		{
			desc: "should return healthcheck status",
			want: &shiftschedulepb.CheckResponse{
				Status: []*shiftschedulepb.ServiceStatus{
					{
						Service: serviceName,
						Status:  shiftschedulepb.ServingStatus_SERVING_STATUS_SERVING,
					},
				},
				Version: version,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			healthService := &HealthCheckServer{}

			got, err := healthService.Check(context.Background(), &shiftschedulepb.CheckRequest{})

			if err != nil {
				t.Fatalf("received unexpected error: %s", err)
			}

			testutils.MustMatch(t, tc.want, got)
		})
	}
}

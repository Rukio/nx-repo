package optimizer

import (
	"context"
	"testing"
	"time"

	optimizerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/optimizer"
	logisticssql "github.com/*company-data-covered*/services/go/pkg/generated/sql/logistics"
	"github.com/*company-data-covered*/services/go/pkg/logistics/logisticsdb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"
)

type mockScheduleResultWriter struct {
	writeScheduleForVRPSolution func(ctx context.Context, params *logisticsdb.WriteScheduleForVRPSolutionParams) (*logisticssql.Schedule, error)
	addOptimizerRunError        func(ctx context.Context, params logisticssql.AddOptimizerRunErrorParams) error
}

func (s mockScheduleResultWriter) WriteScheduleForVRPSolution(ctx context.Context, params *logisticsdb.WriteScheduleForVRPSolutionParams) (*logisticssql.Schedule, error) {
	return s.writeScheduleForVRPSolution(ctx, params)
}

func (s mockScheduleResultWriter) AddOptimizerRunError(ctx context.Context, params logisticssql.AddOptimizerRunErrorParams) error {
	return s.addOptimizerRunError(ctx, params)
}

func TestResultCollector_shouldCallScheduleResultWriter(t *testing.T) {
	called := make(chan struct{}, 1)

	wantSolution := &optimizerpb.VRPSolution{
		Score: &optimizerpb.VRPScore{
			HardScore:             proto.Int64(1000),
			UnassignedVisitsScore: proto.Int64(2000),
			SoftScore:             proto.Int64(3000),
		},
		Description: &optimizerpb.VRPDescription{},
	}
	wantRun := &logisticssql.OptimizerRun{
		ServiceRegionID: time.Now().UnixNano(),
		ServiceDate:     time.Date(2022, time.January, 13, 0, 0, 0, 0, time.UTC),
	}

	collector := &ResultCollector{
		ctx:       context.Background(),
		writeChan: make(chan *optimizerpb.SolveVRPResponse, writeChanSize),
		run:       wantRun,
		ScheduleResultWriter: mockScheduleResultWriter{writeScheduleForVRPSolution: func(ctx context.Context, params *logisticsdb.WriteScheduleForVRPSolutionParams) (*logisticssql.Schedule, error) {
			called <- struct{}{}

			testutils.MustMatch(t, wantSolution, params.Solution)

			if params.ServiceRegionID != wantRun.ServiceRegionID {
				t.Fatal("service region id doesn't match")
			}

			if params.OptimizerRunID != wantRun.ID {
				t.Fatal("run id doesn't match")
			}

			return nil, nil
		}},
	}

	collector.Start()
	defer collector.Close()

	collector.AddResult(&optimizerpb.SolveVRPResponse{
		Solution: wantSolution,
	})

	select {
	case <-called:
	case <-time.After(100 * time.Millisecond):
		t.Fatal("expected ScheduleResultWriter to be called")
	}
}

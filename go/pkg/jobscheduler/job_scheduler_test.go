package jobscheduler

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
)

const (
	testJobName = "testjob"
)

type mockServer struct {
	jobExecCounter  int
	jobReturnsError bool
}

func (m *mockServer) mockJobFunc() error {
	m.jobExecCounter++
	if m.jobReturnsError {
		return errors.New("job error")
	}
	return nil
}

func TestAddFunc(t *testing.T) {
	tcs := []struct {
		desc           string
		mockServer     *mockServer
		cronExpression string

		wantError bool
	}{
		{
			desc:           "should add job successfully",
			mockServer:     &mockServer{},
			cronExpression: "* * * * *",

			wantError: false,
		},
		{
			desc:           "should add job with seconds cron field successfully",
			mockServer:     &mockServer{},
			cronExpression: "* * * * * *",

			wantError: false,
		},
		{
			desc:           "should return error on invalid cron expression",
			mockServer:     &mockServer{},
			cronExpression: "______",

			wantError: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			scheduler := NewJobScheduler(zap.NewNop().Sugar())
			err := scheduler.AddFunc(tc.cronExpression, testJobName, tc.mockServer.mockJobFunc)
			if (err != nil) != tc.wantError {
				t.Fatalf("AddFunc() error = %v, wantError = %v", err, tc.wantError)
			}
		})
	}
}

func TestStart(t *testing.T) {
	tcs := []struct {
		desc                string
		mockServer          *mockServer
		testDuration        time.Duration
		cronExpression      string
		cancelAfterDuration time.Duration

		wantExecCount         int
		wantErrorMessageInLog string
	}{
		{
			desc:           "should call job function",
			mockServer:     &mockServer{},
			testDuration:   1 * time.Second,
			cronExpression: "* * * * * *",

			wantExecCount: 1,
		},
		{
			desc:           "should call job function repeatedly",
			mockServer:     &mockServer{},
			testDuration:   3 * time.Second,
			cronExpression: "* * * * * *",

			wantExecCount: 3,
		},
		{
			desc:                "should not call job function after cancelling context",
			mockServer:          &mockServer{},
			testDuration:        3 * time.Second,
			cronExpression:      "* * * * * *",
			cancelAfterDuration: 2 * time.Second,

			wantExecCount: 2,
		},
		{
			desc:           "should log error when job fails",
			mockServer:     &mockServer{jobReturnsError: true},
			testDuration:   1 * time.Second,
			cronExpression: "* * * * * *",

			wantExecCount:         1,
			wantErrorMessageInLog: "JobScheduler error running job",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			core, recordedLogs := observer.New(zapcore.ErrorLevel)
			testLogger := zap.New(core)
			zap.ReplaceGlobals(testLogger)
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			scheduler := NewJobScheduler(testLogger.Sugar())
			err := scheduler.AddFunc(tc.cronExpression, testJobName, tc.mockServer.mockJobFunc)
			if err != nil {
				t.Fatal(err)
			}
			waitForNearestMidSecond()
			scheduler.Start(ctx)
			if tc.cancelAfterDuration > 0 {
				cancelAfterDuration := tc.cancelAfterDuration
				go func() {
					time.Sleep(cancelAfterDuration)
					cancel()
				}()
			}
			time.Sleep(tc.testDuration)

			testutils.MustMatch(t, tc.wantExecCount, tc.mockServer.jobExecCounter, "unexpected job exec count")
			if tc.wantErrorMessageInLog != "" {
				hasErrorMessage := false
				for _, entry := range recordedLogs.All() {
					if entry.Message == tc.wantErrorMessageInLog && entry.Context[0].Key == jobNameKey && entry.Context[0].String == testJobName {
						hasErrorMessage = true
						break
					}
				}
				if !hasErrorMessage {
					t.Fatalf("want wantErrorMessageInLog: %s, but not found", tc.wantErrorMessageInLog)
				}
			}
		})
	}
}

func waitForNearestMidSecond() {
	now := time.Now()
	delay := 500*time.Millisecond - time.Duration(now.Nanosecond())
	if delay < 0 {
		delay += time.Second
	}
	time.Sleep(delay)
}

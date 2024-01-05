package main

import (
	"context"
	"errors"
	"sync/atomic"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/eventstreaming"
	"github.com/*company-data-covered*/services/go/pkg/featureflags/providers"
	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	auditpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/audit"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/redisclient"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/bsm/redislock"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

type mockProducer struct {
	eventstreaming.MessageProducer
	messageErr error
}

func (m mockProducer) SendMessage(message *eventstreaming.ProducerMessage) error {
	if m.messageErr != nil {
		return m.messageErr
	}
	return nil
}

type MockAuditServiceClient struct{}

func (c *MockAuditServiceClient) CreateAuditEvent(_ context.Context, _ *auditpb.CreateAuditEventRequest, _ ...grpc.CallOption) (*auditpb.CreateAuditEventResponse, error) {
	return nil, nil
}

func (m mockProducer) Close() error {
	return nil
}

type mockConsumerGroup struct {
	PauseChan  chan bool
	ResumeChan chan bool
	StartChan  chan bool
	StopChan   chan bool
	Cancel     context.CancelFunc
	messageErr error
}

func (cg mockConsumerGroup) Error() chan error {
	return nil
}

func (cg mockConsumerGroup) Start(ctx context.Context) {
	cg.StartChan <- true
}

func (cg mockConsumerGroup) Stop() error {
	cg.StopChan <- true

	if cg.messageErr != nil {
		return cg.messageErr
	}
	return nil
}

func (cg mockConsumerGroup) Pause() {
	cg.PauseChan <- true
}

func (cg mockConsumerGroup) Resume() {
	cg.ResumeChan <- true
}

func TestInitializeError(t *testing.T) {
	tests := []struct {
		name                                      string
		checkPatientsSubscriptionStatusResponse   *athenapb.CheckPatientsSubscriptionStatusResponse
		checkPatientsSubscriptionStatusErr        error
		checkLabResultsSubscriptionStatusResponse *athenapb.CheckLabResultsSubscriptionStatusResponse
		checkLabResultsSubscriptionStatusErr      error

		wantCode codes.Code
	}{
		{
			name: "Base Case",

			wantCode: codes.OK,
		},
		{
			name:                               "Patient subscription initialization failed",
			checkPatientsSubscriptionStatusErr: status.Error(codes.Internal, "failed lol"),

			wantCode: codes.Internal,
		},
		{
			name:                               "LabResult subscription initialization failed",
			checkPatientsSubscriptionStatusErr: status.Error(codes.Internal, "failed lol"),

			wantCode: codes.Internal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			c := &AthenaClientMock{
				CheckPatientsSubscriptionStatusHandler: func(ctx context.Context, req *athenapb.CheckPatientsSubscriptionStatusRequest) (*athenapb.CheckPatientsSubscriptionStatusResponse, error) {
					return tt.checkPatientsSubscriptionStatusResponse, tt.checkPatientsSubscriptionStatusErr
				},
				CheckLabResultsSubscriptionStatusHandler: func(ctx context.Context, req *athenapb.CheckLabResultsSubscriptionStatusRequest) (*athenapb.CheckLabResultsSubscriptionStatusResponse, error) {
					return tt.checkLabResultsSubscriptionStatusResponse, tt.checkLabResultsSubscriptionStatusErr
				},
			}

			statsigProvider, err := providers.NewStatsigProvider(providers.StatsigProviderConfig{SDKKey: "dummy", LocalMode: true, DefaultUserKey: "UserID"})
			if err != nil {
				t.Fatal("Could not set up statsig provider in local mode")
			}
			statsigProvider.Start()
			statsigProvider.OverrideGate(subscribeToAthenaPatientLabResultsStatsigName, true)
			statsigProvider.OverrideGate(subscribeToAthenaPatientsStatsigName, true)

			listener := &Listener{
				AthenaClient:    c,
				Logger:          zap.NewNop().Sugar(),
				StatsigProvider: statsigProvider,
			}
			err = listener.Initialize(context.Background())
			testutils.MustMatch(t, tt.wantCode, status.Convert(err).Code())
		})
	}
}

func TestInitializeLabResultsSubscription(t *testing.T) {
	tests := []struct {
		name                       string
		subscriptionStatusResponse *athenapb.CheckLabResultsSubscriptionStatusResponse
		subscriptionStatusError    error
		subscribeError             error

		wantCode codes.Code
	}{
		{
			name:                       "Base Case",
			subscriptionStatusResponse: &athenapb.CheckLabResultsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_ACTIVE},

			wantCode: codes.OK,
		},
		{
			name:                       "Inactive",
			subscriptionStatusResponse: &athenapb.CheckLabResultsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_INACTIVE},

			wantCode: codes.OK,
		},
		{
			name:                       "Partial",
			subscriptionStatusResponse: &athenapb.CheckLabResultsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_PARTIAL},

			wantCode: codes.OK,
		},
		{
			name:                    "Check Status Error",
			subscriptionStatusError: status.Error(codes.Internal, "boom"),

			wantCode: codes.Internal,
		},
		{
			name:                       "Subscribe not called when Active",
			subscriptionStatusResponse: &athenapb.CheckLabResultsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_ACTIVE},
			subscribeError:             status.Error(codes.Internal, "boom"),

			wantCode: codes.OK,
		},
		{
			name:                       "Subscribe error when inactive returns error",
			subscriptionStatusResponse: &athenapb.CheckLabResultsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_INACTIVE},
			subscribeError:             status.Error(codes.Internal, "boom"),

			wantCode: codes.Internal,
		},
		{
			name:                       "Subscribe error when partial returns error",
			subscriptionStatusResponse: &athenapb.CheckLabResultsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_PARTIAL},
			subscribeError:             status.Error(codes.Internal, "boom"),

			wantCode: codes.Internal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			statsigProvider, err := providers.NewStatsigProvider(providers.StatsigProviderConfig{SDKKey: "dummy", LocalMode: true, DefaultUserKey: "UserID"})
			if err != nil {
				t.Fatal("Could not set up statsig provider in local mode")
			}
			statsigProvider.Start()
			statsigProvider.OverrideGate(subscribeToAthenaPatientLabResultsStatsigName, true)
			statsigProvider.OverrideGate(subscribeToAthenaPatientsStatsigName, true)

			listener := &Listener{
				Logger:          zap.NewNop().Sugar(),
				StatsigProvider: statsigProvider,
				AthenaClient: &AthenaClientMock{
					CheckLabResultsSubscriptionStatusHandler: func(ctx context.Context, req *athenapb.CheckLabResultsSubscriptionStatusRequest) (*athenapb.CheckLabResultsSubscriptionStatusResponse, error) {
						return tt.subscriptionStatusResponse, tt.subscriptionStatusError
					},
					SubscribeLabResultEventsHandler: func(ctx context.Context, req *athenapb.SubscribeLabResultEventsRequest) (*athenapb.SubscribeLabResultEventsResponse, error) {
						return nil, tt.subscribeError
					},
				},
			}
			err = listener.InitializeLabResultsSubscription(context.Background())
			testutils.MustMatch(t, tt.wantCode, status.Convert(err).Code())
		})
	}
}

func TestInitializePatientsSubscription(t *testing.T) {
	tests := []struct {
		name                       string
		subscriptionStatusResponse *athenapb.CheckPatientsSubscriptionStatusResponse
		subscriptionStatusError    error
		subscribeError             error

		wantCode codes.Code
	}{
		{
			name:                       "Base Case",
			subscriptionStatusResponse: &athenapb.CheckPatientsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_ACTIVE},

			wantCode: codes.OK,
		},
		{
			name:                       "Inactive",
			subscriptionStatusResponse: &athenapb.CheckPatientsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_INACTIVE},

			wantCode: codes.OK,
		},
		{
			name:                       "Partial",
			subscriptionStatusResponse: &athenapb.CheckPatientsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_PARTIAL},

			wantCode: codes.OK,
		},
		{
			name:                    "Check Status Error",
			subscriptionStatusError: status.Error(codes.Internal, "boom"),

			wantCode: codes.Internal,
		},
		{
			name:                       "Subscribe not called when Active",
			subscriptionStatusResponse: &athenapb.CheckPatientsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_ACTIVE},
			subscribeError:             status.Error(codes.Internal, "boom"),

			wantCode: codes.OK,
		},
		{
			name:                       "Subscribe error when inactive returns error",
			subscriptionStatusResponse: &athenapb.CheckPatientsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_INACTIVE},
			subscribeError:             status.Error(codes.Internal, "boom"),

			wantCode: codes.Internal,
		},
		{
			name:                       "Subscribe error when partial returns error",
			subscriptionStatusResponse: &athenapb.CheckPatientsSubscriptionStatusResponse{Status: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_PARTIAL},
			subscribeError:             status.Error(codes.Internal, "boom"),

			wantCode: codes.Internal,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			statsigProvider, err := providers.NewStatsigProvider(providers.StatsigProviderConfig{SDKKey: "dummy", LocalMode: true, DefaultUserKey: "UserID"})
			if err != nil {
				t.Fatal("Could not set up statsig provider in local mode")
			}
			statsigProvider.Start()
			statsigProvider.OverrideGate(subscribeToAthenaPatientLabResultsStatsigName, true)
			statsigProvider.OverrideGate(subscribeToAthenaPatientsStatsigName, true)

			listener := &Listener{
				Logger:          zap.NewNop().Sugar(),
				StatsigProvider: statsigProvider,
				AthenaClient: &AthenaClientMock{
					CheckPatientsSubscriptionStatusHandler: func(ctx context.Context, req *athenapb.CheckPatientsSubscriptionStatusRequest) (*athenapb.CheckPatientsSubscriptionStatusResponse, error) {
						return tt.subscriptionStatusResponse, tt.subscriptionStatusError
					},
					SubscribePatientEventsHandler: func(ctx context.Context, req *athenapb.SubscribePatientEventsRequest) (*athenapb.SubscribePatientEventsResponse, error) {
						return nil, tt.subscribeError
					},
				},
			}
			err = listener.InitializePatientsSubscription(context.Background())
			testutils.MustMatch(t, tt.wantCode, status.Convert(err).Code())
		})
	}
}

func TestStartPollingWithCancel(t *testing.T) {
	pollInterval := time.Millisecond

	baseCtx, baseCancel := context.WithCancel(context.Background())
	multiCtx, multiCancel := context.WithCancel(context.Background())
	preCtx, preCancel := context.WithCancel(context.Background())
	preCancel()
	tests := []struct {
		name   string
		ctx    context.Context
		cancel context.CancelFunc
		flag   bool

		wantNumCalls uint32
	}{
		{
			name:   "Base Case",
			ctx:    baseCtx,
			cancel: baseCancel,
			flag:   true,

			wantNumCalls: 1,
		},
		{
			name:   "Multiple calls",
			ctx:    multiCtx,
			cancel: multiCancel,
			flag:   true,

			wantNumCalls: 10,
		},
		{
			name:   "Canceled before start",
			ctx:    preCtx,
			cancel: preCancel,
			flag:   true,

			wantNumCalls: 1,
		},
		{
			name:   "Statsig flag off",
			ctx:    preCtx,
			cancel: preCancel,
			flag:   false,

			wantNumCalls: 0,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var numCalls uint32
			done := make(chan bool, 1)
			noOpPoller := func(ctx context.Context) error {
				atomic.AddUint32(&numCalls, 1)
				if numCalls >= tt.wantNumCalls {
					tt.cancel()
					done <- true
				}
				return nil
			}

			statsigProvider, err := providers.NewStatsigProvider(providers.StatsigProviderConfig{SDKKey: "dummy", LocalMode: true, DefaultUserKey: "UserID"})
			if err != nil {
				t.Fatal("Could not set up statsig provider in local mode")
			}
			statsigProvider.Start()
			statsigProvider.OverrideGate("exampleflag", tt.flag)
			if !tt.flag {
				done <- true
			}

			listener := &Listener{
				Logger:          zap.NewNop().Sugar(),
				StatsigProvider: statsigProvider,
				PollInterval:    &pollInterval,
			}
			listener.StartPolling(tt.ctx, "exampleflag", noOpPoller)

			// Wait for channel message, but time out with readable error if it never returns.
			select {
			case <-done:
				// Do nothing, and exit out of select.
			case <-time.After(5 * time.Second):
				// If we wanted some calls but got none, fail test.
				if tt.wantNumCalls != 0 {
					t.Error("Timed out waiting for channel")
				}
			}

			if numCalls < tt.wantNumCalls {
				t.Error("Not as many calls as expected")
			}
		})
	}
}

func TestPollForPatients(t *testing.T) {
	exampleErr := errors.New("i exploded, wow")
	tests := []struct {
		name                   string
		redisClient            MockRedis
		listChangedPatientsErr error

		wantErr error
	}{
		{
			name: "Base Case",
			redisClient: MockRedis{
				mockGetMap: map[string]string{"changed_patients_dirty_bit": "false"},
			},
		},
		{
			name: "Failed to obtain redis lock",
			redisClient: MockRedis{
				setErrorMap: map[string]error{"patients_listener_lock": errors.New("failed to obtain redis lock")},
			},

			wantErr: errors.New("failed to obtain redis lock"),
		},
		{
			name: "Nil dirty bit acts like false dirty bit",
			redisClient: MockRedis{
				getError: redisclient.Nil,
			},
		},
		{
			name: "Already dirty",
			redisClient: MockRedis{
				mockGetMap: map[string]string{
					"changed_patients_dirty_bit":      "true",
					"changed_patients_last_processed": "1679360893",
				},
			},
		},
		{
			name: "Get changed_patients_dirty_bit error",
			redisClient: MockRedis{
				getError: exampleErr,
			},

			wantErr: exampleErr,
		},
		{
			name: "Redis error while backfilling",
			redisClient: MockRedis{
				mockGetMap: map[string]string{"changed_patients_dirty_bit": "true"},
				getError:   exampleErr,
			},

			wantErr: exampleErr,
		},
		{
			name: "Redis error while setting changed_patients_dirty_bit",
			redisClient: MockRedis{
				mockGetMap:  map[string]string{"changed_patients_dirty_bit": "false"},
				setErrorMap: map[string]error{"changed_patients_dirty_bit": errors.New("uh oh dirty bit")},
			},

			wantErr: errors.New("uh oh dirty bit"),
		},
		{
			name: "Redis error while setting changed_patients_last_processed",
			redisClient: MockRedis{
				mockGetMap:  map[string]string{"changed_patients_dirty_bit": "false"},
				setErrorMap: map[string]error{"changed_patients_last_processed": errors.New("uh oh last processed")},
			},

			wantErr: errors.New("uh oh last processed"),
		},
		{
			name: "ListChangedLabResults error",
			redisClient: MockRedis{
				mockGetMap: map[string]string{"changed_patients_dirty_bit": "false"},
			},
			listChangedPatientsErr: status.Error(codes.DeadlineExceeded, "uh oh too long"),

			wantErr: status.Error(codes.DeadlineExceeded, "uh oh too long"),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var auditClient auditpb.AuditServiceClient = &MockAuditServiceClient{}
			redisClient := &redisclient.Client{
				Client:      tt.redisClient,
				Source:      "test",
				AuditClient: nil,
			}
			listener := &Listener{
				Logger: zap.NewNop().Sugar(),
				DataDogRecorder: &monitoring.DataDogRecorder{
					Client: &monitoring.MockStatsDClient{},
				},
				RedisClient: &redisclient.Client{
					Client:      tt.redisClient,
					Source:      "test",
					AuditClient: &auditClient,
				},
				Locker:     redislock.New(redisClient.Client),
				LockExpiry: *redisLockExpiry,
				AthenaClient: &AthenaClientMock{
					ListChangedPatientsHandler: func(ctx context.Context, req *athenapb.ListChangedPatientsRequest) (*athenapb.ListChangedPatientsResponse, error) {
						return nil, tt.listChangedPatientsErr
					},
				},
			}
			err := listener.PollForPatients(context.Background())
			testutils.MustMatch(t, tt.wantErr, err)
		})
	}
}

func TestPollForLabResults(t *testing.T) {
	exampleErr := errors.New("i exploded, wow")
	tests := []struct {
		name                     string
		redisClient              MockRedis
		listChangedLabResultsErr error

		wantErr error
	}{
		{
			name: "Base Case",
			redisClient: MockRedis{
				mockGetMap: map[string]string{"changed_lab_results_dirty_bit": "false"},
			},
		},
		{
			name: "Failed to obtain redis lock",
			redisClient: MockRedis{
				setErrorMap: map[string]error{"lab_results_listener_lock": errors.New("failed to obtain redis lock")},
			},

			wantErr: errors.New("failed to obtain redis lock"),
		},
		{
			name: "Nil dirty bit acts like false dirty bit",
			redisClient: MockRedis{
				getError: redisclient.Nil,
			},
		},
		{
			name: "Already dirty",
			redisClient: MockRedis{
				mockGetMap: map[string]string{
					"changed_lab_results_dirty_bit":      "true",
					"changed_lab_results_last_processed": "1679360893",
				},
			},
		},
		{
			name: "Get changed_lab_results_dirty_bit error",
			redisClient: MockRedis{
				getError: exampleErr,
			},

			wantErr: exampleErr,
		},
		{
			name: "Redis error while backfilling",
			redisClient: MockRedis{
				mockGetMap: map[string]string{"changed_lab_results_dirty_bit": "true"},
				getError:   exampleErr,
			},

			wantErr: exampleErr,
		},
		{
			name: "Redis error while setting changed_lab_results_dirty_bit",
			redisClient: MockRedis{
				mockGetMap:  map[string]string{"changed_lab_results_dirty_bit": "false"},
				setErrorMap: map[string]error{"changed_lab_results_dirty_bit": errors.New("uh oh dirty bit")},
			},

			wantErr: errors.New("uh oh dirty bit"),
		},
		{
			name: "Redis error while setting changed_lab_results_last_processed",
			redisClient: MockRedis{
				mockGetMap:  map[string]string{"changed_lab_results_dirty_bit": "false"},
				setErrorMap: map[string]error{"changed_lab_results_last_processed": errors.New("uh oh last processed")},
			},

			wantErr: errors.New("uh oh last processed"),
		},
		{
			name: "ListChangedLabResults error",
			redisClient: MockRedis{
				mockGetMap: map[string]string{"changed_lab_results_dirty_bit": "false"},
			},
			listChangedLabResultsErr: status.Error(codes.DeadlineExceeded, "uh oh too long"),

			wantErr: status.Error(codes.DeadlineExceeded, "uh oh too long"),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var auditClient auditpb.AuditServiceClient = &MockAuditServiceClient{}
			redisClient := &redisclient.Client{
				Client:      tt.redisClient,
				Source:      "test",
				AuditClient: nil,
			}
			listener := &Listener{
				Logger: zap.NewNop().Sugar(),
				DataDogRecorder: &monitoring.DataDogRecorder{
					Client: &monitoring.MockStatsDClient{},
				},
				RedisClient: &redisclient.Client{
					Client:      tt.redisClient,
					Source:      "test",
					AuditClient: &auditClient,
				},
				Locker:     redislock.New(redisClient.Client),
				LockExpiry: *redisLockExpiry,
				AthenaClient: &AthenaClientMock{
					ListChangedLabResultsHandler: func(ctx context.Context, req *athenapb.ListChangedLabResultsRequest) (*athenapb.ListChangedLabResultsResponse, error) {
						return nil, tt.listChangedLabResultsErr
					},
				},
			}
			err := listener.PollForLabResults(context.Background())
			testutils.MustMatch(t, tt.wantErr, err)
		})
	}
}

func TestSendLabResultsToKafka(t *testing.T) {
	tests := []struct {
		name         string
		mockProducer mockProducer
		results      []*athenapb.ListChangedLabResultsResult

		wantCount int
	}{
		{
			name: "Base Case",

			results: []*athenapb.ListChangedLabResultsResult{
				{LabResultId: proto.String("1")},
				{LabResultId: proto.String("2")},
			},
			mockProducer: mockProducer{},

			wantCount: 2,
		},
		{
			name: "Producer error does not error but does not increment count",
			results: []*athenapb.ListChangedLabResultsResult{
				{LabResultId: proto.String("1")},
				{LabResultId: proto.String("2")},
			},
			mockProducer: mockProducer{messageErr: errors.New("oh no message no send")},

			wantCount: 0,
		},
		{
			name:         "Nil result",
			results:      []*athenapb.ListChangedLabResultsResult{},
			mockProducer: mockProducer{},

			wantCount: 0,
		},
		{
			name:         "Results of size 0",
			results:      []*athenapb.ListChangedLabResultsResult{},
			mockProducer: mockProducer{},

			wantCount: 0,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			mockDatadogClient := monitoring.MockStatsDClient{}
			listener := &Listener{
				Logger:   zap.NewNop().Sugar(),
				Producer: tt.mockProducer,
				DataDogRecorder: &monitoring.DataDogRecorder{
					Client: &mockDatadogClient,
				},
			}
			count := listener.sendLabResultsToKafka(tt.results)
			testutils.MustMatch(t, tt.wantCount, count)
		})
	}
}

func TestGetAllPatients(t *testing.T) {
	tests := []struct {
		name                        string
		mockProducer                mockProducer
		firstRequest                *athenapb.ListChangedPatientsRequest
		listChangedPatientsResponse []*athenapb.ListChangedPatientsResponse
		listChangedPatientsErr      error

		wantRequests []*athenapb.ListChangedPatientsRequest
		wantResults  []*athenapb.ListChangedPatientsResult
		wantErr      error
	}{
		{
			name: "Base Case",
			firstRequest: &athenapb.ListChangedPatientsRequest{
				ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
				ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
				Limit:                      proto.Int32(2),
				LeaveUnprocessed:           proto.Bool(false),
			},
			listChangedPatientsResponse: []*athenapb.ListChangedPatientsResponse{
				{
					Results: []*athenapb.ListChangedPatientsResult{
						{PatientId: proto.String("1")},
						{PatientId: proto.String("2")},
					},
				},
				{
					Results: []*athenapb.ListChangedPatientsResult{
						{PatientId: proto.String("3")},
					},
				},
			},
			mockProducer: mockProducer{},

			wantRequests: []*athenapb.ListChangedPatientsRequest{
				{
					ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
					ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
					Limit:                      proto.Int32(2),
					LeaveUnprocessed:           proto.Bool(false),
				},
				{
					ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
					ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
					Limit:                      proto.Int32(2),
					Offset:                     proto.Int32(2),
					LeaveUnprocessed:           proto.Bool(false),
				},
			},
			wantResults: []*athenapb.ListChangedPatientsResult{
				{PatientId: proto.String("1")},
				{PatientId: proto.String("2")},
				{PatientId: proto.String("3")},
			},
		},
		{
			name: "Less than limit",
			firstRequest: &athenapb.ListChangedPatientsRequest{
				ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
				ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
				Limit:                      proto.Int32(2),
			},
			listChangedPatientsResponse: []*athenapb.ListChangedPatientsResponse{
				{
					Results: []*athenapb.ListChangedPatientsResult{
						{PatientId: proto.String("1")},
					},
				},
			},
			mockProducer: mockProducer{},

			wantRequests: []*athenapb.ListChangedPatientsRequest{
				{
					ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
					ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
					Limit:                      proto.Int32(2),
				},
			},
			wantResults: []*athenapb.ListChangedPatientsResult{
				{PatientId: proto.String("1")},
			},
		},
		{
			name: "With error",
			firstRequest: &athenapb.ListChangedPatientsRequest{
				ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
				ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
				Limit:                      proto.Int32(2),
			},
			listChangedPatientsResponse: []*athenapb.ListChangedPatientsResponse{{Results: nil}},
			listChangedPatientsErr:      status.Error(codes.Internal, "bleh"),
			mockProducer:                mockProducer{},

			wantRequests: []*athenapb.ListChangedPatientsRequest{
				{
					ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
					ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
					Limit:                      proto.Int32(2),
				},
			},
			wantErr: status.Error(codes.Internal, "bleh"),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			listener := &Listener{
				Logger: zap.NewNop().Sugar(),
				AthenaClient: &AthenaClientMock{
					ListChangedPatientsHandler: func(ctx context.Context, req *athenapb.ListChangedPatientsRequest) (*athenapb.ListChangedPatientsResponse, error) {
						page := int(req.GetOffset() / req.GetLimit())
						testutils.MustMatch(t, tt.wantRequests[page], req)
						return tt.listChangedPatientsResponse[page], tt.listChangedPatientsErr
					},
				},
				Producer: tt.mockProducer,
			}
			results, err := listener.getAllPatients(context.Background(), tt.firstRequest)
			testutils.MustMatch(t, tt.wantResults, results)
			testutils.MustMatch(t, tt.wantErr, err)
		})
	}
}

func TestGetAllLabResults(t *testing.T) {
	tests := []struct {
		name                          string
		mockProducer                  mockProducer
		firstRequest                  *athenapb.ListChangedLabResultsRequest
		listChangedLabResultsResponse []*athenapb.ListChangedLabResultsResponse
		listChangedLabResultsErr      error

		wantRequests []*athenapb.ListChangedLabResultsRequest
		wantResults  []*athenapb.ListChangedLabResultsResult
		wantErr      error
	}{
		{
			name: "Base Case",
			firstRequest: &athenapb.ListChangedLabResultsRequest{
				ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
				ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
				Limit:                      proto.Int32(2),
				LeaveUnprocessed:           proto.Bool(false),
			},
			listChangedLabResultsResponse: []*athenapb.ListChangedLabResultsResponse{
				{
					Results: []*athenapb.ListChangedLabResultsResult{
						{LabResultId: proto.String("1")},
						{LabResultId: proto.String("2")},
					},
				},
				{
					Results: []*athenapb.ListChangedLabResultsResult{
						{LabResultId: proto.String("3")},
					},
				},
			},
			mockProducer: mockProducer{},

			wantRequests: []*athenapb.ListChangedLabResultsRequest{
				{
					ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
					ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
					Limit:                      proto.Int32(2),
					LeaveUnprocessed:           proto.Bool(false),
				},
				{
					ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
					ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
					Limit:                      proto.Int32(2),
					Offset:                     proto.Int32(2),
					LeaveUnprocessed:           proto.Bool(false),
				},
			},
			wantResults: []*athenapb.ListChangedLabResultsResult{
				{LabResultId: proto.String("1")},
				{LabResultId: proto.String("2")},
				{LabResultId: proto.String("3")},
			},
		},
		{
			name: "Less than limit",
			firstRequest: &athenapb.ListChangedLabResultsRequest{
				ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
				ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
				Limit:                      proto.Int32(2),
			},
			listChangedLabResultsResponse: []*athenapb.ListChangedLabResultsResponse{
				{
					Results: []*athenapb.ListChangedLabResultsResult{
						{LabResultId: proto.String("1")},
					},
				},
			},
			mockProducer: mockProducer{},

			wantRequests: []*athenapb.ListChangedLabResultsRequest{
				{
					ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
					ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
					Limit:                      proto.Int32(2),
				},
			},
			wantResults: []*athenapb.ListChangedLabResultsResult{
				{LabResultId: proto.String("1")},
			},
		},
		{
			name: "With error",
			firstRequest: &athenapb.ListChangedLabResultsRequest{
				ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
				ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
				Limit:                      proto.Int32(2),
			},
			listChangedLabResultsResponse: []*athenapb.ListChangedLabResultsResponse{{Results: nil}},
			listChangedLabResultsErr:      status.Error(codes.Internal, "bleh"),
			mockProducer:                  mockProducer{},

			wantRequests: []*athenapb.ListChangedLabResultsRequest{
				{
					ShowProcessedStartDatetime: proto.String("01/02/2023 01:02:03"),
					ShowProcessedEndDatetime:   proto.String("01/02/2023 02:03:04"),
					Limit:                      proto.Int32(2),
				},
			},
			wantErr: status.Error(codes.Internal, "bleh"),
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			listener := &Listener{
				Logger: zap.NewNop().Sugar(),
				AthenaClient: &AthenaClientMock{
					ListChangedLabResultsHandler: func(ctx context.Context, req *athenapb.ListChangedLabResultsRequest) (*athenapb.ListChangedLabResultsResponse, error) {
						page := int(req.GetOffset() / req.GetLimit())
						testutils.MustMatch(t, tt.wantRequests[page], req)
						return tt.listChangedLabResultsResponse[page], tt.listChangedLabResultsErr
					},
				},
				Producer: tt.mockProducer,
			}
			results, err := listener.getAllLabResults(context.Background(), tt.firstRequest)
			testutils.MustMatch(t, tt.wantResults, results)
			testutils.MustMatch(t, tt.wantErr, err)
		})
	}
}

func TestStartConsumer(t *testing.T) {
	pollInterval := time.Millisecond

	ctx, cancel := context.WithCancel(context.Background())
	cancel()

	tests := []struct {
		name   string
		ctx    context.Context
		cancel context.CancelFunc
	}{
		{
			name:   "base - starts consumer",
			ctx:    ctx,
			cancel: cancel,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			statsigProvider, err := providers.NewStatsigProvider(providers.StatsigProviderConfig{SDKKey: "dummy", LocalMode: true, DefaultUserKey: "UserID"})
			if err != nil {
				t.Fatal("Could not set up statsig provider in local mode")
			}
			statsigProvider.Start()

			var wasStarted bool
			consumerGroup := mockConsumerGroup{
				StartChan: make(chan bool, 1),
				StopChan:  make(chan bool, 1),
				Cancel:    tt.cancel,
			}
			listener := &Listener{
				Logger:          zap.NewNop().Sugar(),
				StatsigProvider: statsigProvider,
				PollInterval:    &pollInterval,
				ConsumerGroup:   consumerGroup,
			}
			listener.Start(tt.ctx)
			time.Sleep(time.Second)

			if <-consumerGroup.StartChan {
				wasStarted = true
			}

			testutils.MustMatch(t, true, wasStarted, "start does not match")
		})
	}
}

func TestConsumeKafkaMessages(t *testing.T) {
	pollInterval := time.Millisecond
	baseCtx, baseCancel := context.WithCancel(context.Background())
	preCtx, preCancel := context.WithCancel(context.Background())
	preCancel()

	tests := []struct {
		name       string
		ctx        context.Context
		cancel     context.CancelFunc
		flag       bool
		wantPause  bool
		wantResume bool
		wantStop   bool
	}{
		{
			name:       "base case",
			ctx:        baseCtx,
			cancel:     baseCancel,
			flag:       true,
			wantResume: true,
			wantPause:  false,
		},
		{
			name:       "flag is off",
			ctx:        baseCtx,
			cancel:     baseCancel,
			flag:       false,
			wantResume: false,
			wantPause:  true,
		},
		{
			name:     "cancelled before start",
			ctx:      preCtx,
			cancel:   preCancel,
			wantStop: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			consumerGroup := mockConsumerGroup{
				PauseChan:  make(chan bool, 1),
				ResumeChan: make(chan bool, 1),
				StartChan:  make(chan bool, 1),
				StopChan:   make(chan bool, 1),
				Cancel:     tt.cancel,
			}
			var wasResumed bool
			var wasPaused bool
			var wasStopped bool
			statsigProvider, err := providers.NewStatsigProvider(providers.StatsigProviderConfig{SDKKey: "dummy", LocalMode: true, DefaultUserKey: "UserID"})
			if err != nil {
				t.Fatal("Could not set up statsig provider in local mode")
			}
			statsigProvider.Start()
			statsigProvider.OverrideGate(appendAthenaPatientLabResultsStatsigName, tt.flag)
			listener := &Listener{
				Logger:          zap.NewNop().Sugar(),
				ConsumerGroup:   &consumerGroup,
				PollInterval:    &pollInterval,
				StatsigProvider: statsigProvider,
			}
			consumerGroup.Start(tt.ctx)
			listener.consumeKafkaMessages(tt.ctx, consumerGroup, appendAthenaPatientLabResultsStatsigName)

			time.Sleep(2 * time.Second)

			if tt.wantPause || tt.wantResume {
				select {
				case <-consumerGroup.PauseChan:
					wasPaused = true
				case <-consumerGroup.ResumeChan:
					wasResumed = true
				case <-tt.ctx.Done():
				}
				testutils.MustMatch(t, tt.wantPause, wasPaused, "pause does not match")
				testutils.MustMatch(t, tt.wantResume, wasResumed, "resume does not match")
			} else {
				if <-consumerGroup.StopChan {
					wasStopped = true
				}
				testutils.MustMatch(t, tt.wantStop, wasStopped, "stop does not match")
			}
		})
	}
}

func TestBackfillLabResultsIfDirty(t *testing.T) {
	tests := []struct {
		name                          string
		redisClient                   MockRedis
		mockProducer                  mockProducer
		listChangedLabResultsResponse []*athenapb.ListChangedLabResultsResponse
		listChangedLabResultsErr      error

		wantRequest *athenapb.ListChangedLabResultsRequest
		wantErr     bool
	}{
		{
			name: "success - base case",
			redisClient: MockRedis{
				mockGetMap: map[string]string{
					"changed_lab_results_dirty_bit":      "true",
					"changed_lab_results_last_processed": "1111111000",
				},
			},
			listChangedLabResultsResponse: []*athenapb.ListChangedLabResultsResponse{
				{
					Results: []*athenapb.ListChangedLabResultsResult{
						{LabResultId: proto.String("1")},
						{LabResultId: proto.String("2")},
					},
				},
			},
			mockProducer: mockProducer{},
			wantRequest: &athenapb.ListChangedLabResultsRequest{
				ShowProcessedStartDatetime: proto.String("03/17/2005 20:56:40"),
				ShowProcessedEndDatetime:   proto.String("03/17/2005 20:58:31"),
				Limit:                      proto.Int32(1500),
				LeaveUnprocessed:           proto.Bool(false),
			},
		},
		{
			name:         "failure - nil redis client",
			redisClient:  MockRedis{},
			mockProducer: mockProducer{},
			wantErr:      true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			var auditClient auditpb.AuditServiceClient = &MockAuditServiceClient{}
			redisClient := &redisclient.Client{
				Client:      tt.redisClient,
				Source:      "test",
				AuditClient: nil,
			}
			listener := &Listener{
				Logger: zap.NewNop().Sugar(),
				DataDogRecorder: &monitoring.DataDogRecorder{
					Client: &monitoring.MockStatsDClient{},
				},
				RedisClient: &redisclient.Client{
					Client:      tt.redisClient,
					Source:      "test",
					AuditClient: &auditClient,
				},
				Locker:     redislock.New(redisClient.Client),
				LockExpiry: *redisLockExpiry,
				AthenaClient: &AthenaClientMock{
					ListChangedLabResultsHandler: func(ctx context.Context, req *athenapb.ListChangedLabResultsRequest) (*athenapb.ListChangedLabResultsResponse, error) {
						page := int(req.GetOffset() / req.GetLimit())
						testutils.MustMatch(t, tt.wantRequest, req)
						return tt.listChangedLabResultsResponse[page], tt.listChangedLabResultsErr
					},
				},
				Producer: tt.mockProducer,
			}
			err := listener.backfillLabResultsIfDirty(context.Background(), 1111111111)
			testutils.MustMatch(t, tt.wantErr, err != nil)
		})
	}
}

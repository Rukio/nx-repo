package monitoring

import (
	"errors"
	"net/http"
	"net/http/httptest"
	"net/url"
	"testing"

	"github.com/DataDog/datadog-go/v5/statsd"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
)

var dataDogValidConfig = &DataDogConfig{
	Env:         "test",
	APMUrl:      "someAPMUrl",
	AppVersion:  "test",
	ServiceName: "test",
	StatsDUrl:   "127.0.0.1:8125",
}

var dataDogInvalidConfig = &DataDogConfig{
	Env:         "",
	APMUrl:      "",
	AppVersion:  "",
	ServiceName: "",
	StatsDUrl:   "",
}

func getTestStatsDClient(client *MockStatsDClient) statsd.ClientInterface {
	var testStatsDClient statsd.ClientInterface
	if client != nil {
		var statsDClient statsd.ClientInterface = client
		testStatsDClient = statsDClient
	}
	return testStatsDClient
}

func TestDataDogConfig(t *testing.T) {
	tcs := []struct {
		Desc          string
		DataDogConfig *DataDogConfig
		want          bool
	}{
		{
			Desc:          "Valid config",
			DataDogConfig: dataDogValidConfig,
			want:          true,
		},
		{
			Desc:          "Invalid config",
			DataDogConfig: dataDogInvalidConfig,
			want:          false,
		},
	}

	for _, tc := range tcs {
		isConfigValid := tc.DataDogConfig.IsAPMValid()
		testutils.MustMatch(t, tc.want, isConfigValid)
	}
}

func TestDataDogBaseConfigValidate(t *testing.T) {
	tcs := []struct {
		description   string
		dataDogConfig *DataDogConfig

		wantError bool
	}{
		{
			description: "invalid: missing AppVersion",
			dataDogConfig: &DataDogConfig{
				AppVersion:  "",
				Env:         "Anything",
				ServiceName: "Anything",
			},
			wantError: true,
		},
		{
			description: "invalid: missing Env",
			dataDogConfig: &DataDogConfig{
				AppVersion:  "Anything",
				Env:         "",
				ServiceName: "Anything",
			},
			wantError: true,
		},
		{
			description: "invalid: missing ServiceName",
			dataDogConfig: &DataDogConfig{
				AppVersion:  "Anything",
				Env:         "Anything",
				ServiceName: "",
			},
			wantError: true,
		},
		{
			description: "valid",
			dataDogConfig: &DataDogConfig{
				AppVersion:  "Anything",
				Env:         "Anything",
				ServiceName: "Anything",
			},
			wantError: false,
		},
	}

	for _, tc := range tcs {
		err := tc.dataDogConfig.validateBaseConfig()
		if (err != nil) != tc.wantError {
			t.Fatalf("failed, wanted error: %t, got error: %s", tc.wantError, err)
		}
	}
}

func TestDataDogStatsDConfigValidate(t *testing.T) {
	tcs := []struct {
		description   string
		dataDogConfig *DataDogConfig

		wantError bool
	}{
		{
			description: "invalid: missing AppVersion in base config",
			dataDogConfig: &DataDogConfig{
				AppVersion:  "",
				Env:         "Anything",
				ServiceName: "Anything",
			},
			wantError: true,
		},
		{
			description: "invalid: missing StatsD url",
			dataDogConfig: &DataDogConfig{
				AppVersion:  "Anything",
				Env:         "Anything",
				ServiceName: "Anything",
			},
			wantError: true,
		},
		{
			description: "valid",
			dataDogConfig: &DataDogConfig{
				AppVersion:  "Anything",
				Env:         "Anything",
				ServiceName: "Anything",
				StatsDUrl:   "Anything",
			},
			wantError: false,
		},
	}

	for _, tc := range tcs {
		err := tc.dataDogConfig.ValidateStatsD()
		if (err != nil) != tc.wantError {
			t.Fatalf("failed, wanted error: %t, got error: %s", tc.wantError, err)
		}
	}
}

func TestDataDogApmConfigValidate(t *testing.T) {
	tcs := []struct {
		description   string
		dataDogConfig *DataDogConfig

		wantError bool
	}{
		{
			description: "invalid: missing AppVersion in base config",
			dataDogConfig: &DataDogConfig{
				AppVersion:  "",
				Env:         "Anything",
				ServiceName: "Anything",
			},
			wantError: true,
		},
		{
			description: "invalid: missing APM url",
			dataDogConfig: &DataDogConfig{
				AppVersion:  "Anything",
				Env:         "Anything",
				ServiceName: "Anything",
			},
			wantError: true,
		},
		{
			description: "valid",
			dataDogConfig: &DataDogConfig{
				AppVersion:  "Anything",
				Env:         "Anything",
				ServiceName: "Anything",
				APMUrl:      "Anything",
			},
			wantError: false,
		},
	}

	for _, tc := range tcs {
		err := tc.dataDogConfig.ValidateAPM()
		if (err != nil) != tc.wantError {
			t.Fatalf("failed, wanted error: %t, got error: %s", tc.wantError, err)
		}
	}
}

func TestSetupTracing(t *testing.T) {
	ddConfig := &DataDogConfig{
		Env:            "test",
		APMUrl:         "test-url",
		AppVersion:     "test",
		ServiceName:    "service-name",
		StatsDUrl:      "127.0.0.1:8125",
		EnableProfiler: true,
	}

	tcs := []struct {
		Desc   string
		Config *DataDogConfig
	}{
		{
			Desc:   "base case",
			Config: ddConfig,
		},
		{
			Desc: "invalid APM",
			Config: &DataDogConfig{
				Env:            "test",
				AppVersion:     "test",
				ServiceName:    "service-name",
				StatsDUrl:      "127.0.0.1:8125",
				EnableProfiler: true,
			},
		},
		{
			Desc: "disabled profiler",
			Config: &DataDogConfig{
				Env:            "test",
				APMUrl:         "test-url",
				AppVersion:     "test",
				ServiceName:    "service-name",
				StatsDUrl:      "127.0.0.1:8125",
				EnableProfiler: false,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			datadogRecorder, _ := NewDataDogRecorder(tc.Config, zap.NewNop().Sugar())
			err := datadogRecorder.SetupTracing()
			if err != nil {
				t.Fatal(err)
			}
		})
	}
}

func TestHTTPResourceNamer(t *testing.T) {
	tcs := []struct {
		Desc string
		req  *http.Request

		want string
	}{
		{
			Desc: "Base case",
			req: &http.Request{
				Method: "post",
				URL:    &url.URL{Path: "/v1/patients/1337"},
			},

			want: "post_/v1/patients/1337",
		},
		{
			Desc: "GET",
			req: &http.Request{
				Method: "get",
				URL:    &url.URL{Path: "/v1/patients"},
			},

			want: "get_/v1/patients",
		},
	}

	for _, tc := range tcs {
		testutils.MustMatch(t, tc.want, HTTPResourceNamer(tc.req))
	}
}

func TestTracingDialOptions(t *testing.T) {
	dialOptions := TracingDialOptions("test")
	expectedSize := 2
	testutils.MustMatch(t, expectedSize, len(dialOptions), "sie of dials options doens't match")
}

func TestDataDogRecorder(t *testing.T) {
	badResponseDataDogServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
		rw.WriteHeader(http.StatusOK)
	}))
	defer badResponseDataDogServer.Close()

	badDataDogHost := "BAD ADDRESS"

	tcs := []struct {
		Desc          string
		DataDogConfig *DataDogConfig

		HasErr bool
		IsNil  bool
	}{
		{
			Desc:          "Base case",
			DataDogConfig: dataDogValidConfig,

			HasErr: false,
			IsNil:  false,
		},
		{
			Desc: "Invalid host",
			DataDogConfig: &DataDogConfig{
				Env:         "test",
				APMUrl:      "someAPMUrl",
				AppVersion:  "test",
				ServiceName: "test",
				StatsDUrl:   badDataDogHost,
			},

			HasErr: true,
			IsNil:  true,
		},
		{
			Desc:          "Missing StatsDURL does not error and has nil DataDogRecorder",
			DataDogConfig: dataDogInvalidConfig,

			HasErr: false,
			IsNil:  true,
		},
		{
			Desc: "Ping to server fails due to bad response",
			DataDogConfig: &DataDogConfig{
				Env:         "test",
				APMUrl:      "someAPMUrl",
				AppVersion:  "test",
				ServiceName: "test",
				StatsDUrl:   badResponseDataDogServer.URL,
			},

			HasErr: true,
			IsNil:  true,
		},
		{
			Desc: "Ping to server fails due to unreachable server",
			DataDogConfig: &DataDogConfig{
				Env:         "test",
				APMUrl:      "someAPMUrl",
				AppVersion:  "test",
				ServiceName: "test",
				StatsDUrl:   badDataDogHost,
			},

			HasErr: true,
			IsNil:  true,
		},
	}

	for _, tc := range tcs {
		dataDogRecorder, err := NewDataDogRecorder(tc.DataDogConfig, zap.NewNop().Sugar())
		if (dataDogRecorder == nil) != tc.IsNil {
			t.Errorf("Expected dataDogRecorder nilness (%t) to equal tc.IsNil (%t)", dataDogRecorder == nil, tc.IsNil)
		}
		if (err != nil) != tc.HasErr {
			t.Errorf("Expected err '%s' nilness (%t) to equal tc.HasErr (%t)", err, err != nil, tc.HasErr)
		}
	}
}

func TestDataDogRecorder_Count(t *testing.T) {
	tests := []struct {
		name       string
		count      int64
		config     *DataDogConfig
		tags       Tags
		mockStatsD *MockStatsDClient
	}{
		{
			name:       "Base case",
			count:      1,
			config:     &DataDogConfig{ServiceName: "testservice"},
			tags:       Tags{"some": "tag"},
			mockStatsD: &MockStatsDClient{},
		},
		{
			name:       "0 count",
			count:      0,
			config:     &DataDogConfig{ServiceName: "testservice"},
			tags:       Tags{"some": "tag"},
			mockStatsD: &MockStatsDClient{},
		},
		{
			name:       "Multiple count",
			count:      4,
			config:     &DataDogConfig{ServiceName: "testservice"},
			tags:       Tags{"some": "tag"},
			mockStatsD: &MockStatsDClient{},
		},
		{
			name:       "Empty tags",
			count:      1,
			config:     &DataDogConfig{ServiceName: "testservice"},
			tags:       Tags{},
			mockStatsD: &MockStatsDClient{},
		},
		{
			name:       "Error",
			count:      0,
			config:     &DataDogConfig{ServiceName: "testservice"},
			tags:       Tags{"some": "tag"},
			mockStatsD: &MockStatsDClient{CountErr: errors.New("whee")},
		},
		{
			name:       "Nil config",
			count:      1,
			tags:       Tags{"some": "tag"},
			mockStatsD: &MockStatsDClient{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := &DataDogRecorder{
				Client: tt.mockStatsD,
				config: tt.config,
				logger: zap.NewNop().Sugar(),
			}
			recorder.Count("name", tt.count, tt.tags)
			testutils.MustMatch(t, tt.count, tt.mockStatsD.NumCount)
		})
	}
}

func TestDataDogRecorder_Gauge(t *testing.T) {
	tests := []struct {
		name       string
		gauge      float64
		config     *DataDogConfig
		tags       Tags
		mockStatsD *MockStatsDClient
	}{
		{
			name:       "Base case",
			gauge:      1.4,
			config:     &DataDogConfig{ServiceName: "testservice"},
			tags:       Tags{"some": "tag"},
			mockStatsD: &MockStatsDClient{},
		},
		{
			name:       "0 gauge",
			gauge:      0,
			config:     &DataDogConfig{ServiceName: "testservice"},
			tags:       Tags{"some": "tag"},
			mockStatsD: &MockStatsDClient{},
		},
		{
			name:       "Empty tags",
			gauge:      1,
			config:     &DataDogConfig{ServiceName: "testservice"},
			tags:       Tags{},
			mockStatsD: &MockStatsDClient{},
		},
		{
			name:       "Error",
			gauge:      0,
			config:     &DataDogConfig{ServiceName: "testservice"},
			tags:       Tags{"some": "tag"},
			mockStatsD: &MockStatsDClient{GaugeErr: errors.New("failed to send value")},
		},
		{
			name:       "Nil config",
			gauge:      1,
			tags:       Tags{"some": "tag"},
			mockStatsD: &MockStatsDClient{},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			recorder := &DataDogRecorder{
				Client: tt.mockStatsD,
				config: tt.config,
				logger: zap.NewNop().Sugar(),
			}
			recorder.Gauge("name", tt.gauge, tt.tags)
			testutils.MustMatch(t, tt.gauge, tt.mockStatsD.NumGauge)
		})
	}
}

func TestSendStatsDServiceCheck(t *testing.T) {
	tests := []struct {
		name       string
		count      int64
		status     healthpb.HealthCheckResponse_ServingStatus
		mockStatsD *MockStatsDClient
	}{
		{
			name:       "Base case",
			count:      1,
			status:     healthpb.HealthCheckResponse_SERVING,
			mockStatsD: &MockStatsDClient{},
		},
		{
			name:       "Unknown status",
			count:      1,
			status:     healthpb.HealthCheckResponse_UNKNOWN,
			mockStatsD: &MockStatsDClient{},
		},
		{
			name:       "Error",
			count:      1,
			status:     healthpb.HealthCheckResponse_SERVING,
			mockStatsD: &MockStatsDClient{CountErr: errors.New("oh no broken")},
		},
		{
			name: "Nil client",
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			statsDClient := getTestStatsDClient(tt.mockStatsD)
			recorder := &DataDogRecorder{
				Client: statsDClient,
				logger: zap.NewNop().Sugar(),
			}

			recorder.SendStatsDServiceCheck(tt.status, "test")
			if tt.mockStatsD != nil {
				testutils.MustMatch(t, tt.count, tt.mockStatsD.NumCount)
			}
		})
	}
}

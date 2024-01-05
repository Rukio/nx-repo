package monitoring

import (
	"context"
	"errors"
	"io"
	"net/http"
	"net/http/httptest"
	"strings"
	"sync"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
	client "github.com/influxdata/influxdb1-client/v2"
	"go.uber.org/zap"
	"go.uber.org/zap/zapcore"
	"go.uber.org/zap/zaptest/observer"
)

func TestInfluxWritePoint(t *testing.T) {
	tcs := []struct {
		Desc              string
		Measurement       string
		Tags              map[string]string
		Fields            map[string]any
		BatchPointsConfig client.BatchPointsConfig
		HTTPStatusCode    int

		HasErr            bool
		WantWriteContains []string
	}{
		{
			Desc:              "Base case",
			Measurement:       "TestMeasurement",
			Tags:              map[string]string{"tag": "testTag"},
			Fields:            map[string]any{"grpc_code": "OK"},
			BatchPointsConfig: client.BatchPointsConfig{Database: "TestDBName"},
			HTTPStatusCode:    http.StatusOK,

			WantWriteContains: []string{"TestMeasurement", "tag=testTag", "grpc_code=\"OK\""},
		},
		{
			Desc:              "Int field value",
			Measurement:       "TestMeasurement2",
			Tags:              map[string]string{"tag2": "otherTag"},
			Fields:            map[string]any{"arbitraryField": 1234},
			BatchPointsConfig: client.BatchPointsConfig{Database: "TestDBName"},
			HTTPStatusCode:    http.StatusOK,

			WantWriteContains: []string{"TestMeasurement2", "tag2=otherTag", "arbitraryField=1234"},
		},
		{
			Desc:              "Bad batch points config",
			Measurement:       "TestMeasurement",
			Tags:              map[string]string{"tag": "testTag"},
			Fields:            map[string]any{"grpc_code": "OK"},
			BatchPointsConfig: client.BatchPointsConfig{Database: "TestDBName", Precision: "lolwtf i dont exist"},
			HTTPStatusCode:    http.StatusOK,

			HasErr:            true,
			WantWriteContains: nil,
		},
		{
			Desc:              "No fields",
			Measurement:       "TestMeasurement",
			Tags:              map[string]string{"tag": "testTag"},
			Fields:            map[string]any{},
			BatchPointsConfig: client.BatchPointsConfig{Database: "TestDBName"},
			HTTPStatusCode:    http.StatusOK,

			HasErr:            true,
			WantWriteContains: nil,
		},
		{
			Desc:              "Write failure",
			Measurement:       "TestMeasurement",
			Tags:              map[string]string{"tag": "testTag"},
			Fields:            map[string]any{"grpc_code": "OK"},
			BatchPointsConfig: client.BatchPointsConfig{Database: ""},
			HTTPStatusCode:    http.StatusServiceUnavailable,

			HasErr:            true,
			WantWriteContains: nil,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			influxServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
				switch {
				case strings.HasPrefix(req.RequestURI, "/ping"):
					rw.WriteHeader(http.StatusNoContent)
				case strings.HasPrefix(req.RequestURI, "/query") && strings.Contains(req.RequestURI, "CREATE+DATABASE"):
					rw.Header().Add("Content-Type", "application/json")
					rw.Write([]byte("{}"))
				default:
					if tc.HTTPStatusCode != http.StatusOK {
						rw.WriteHeader(tc.HTTPStatusCode)
					}
					body, err := io.ReadAll(req.Body)
					defer req.Body.Close()
					if err != nil {
						t.Fatalf("Failed to read body: %s", err)
					}

					if len(body) == 0 {
						t.Fatalf("Body was empty")
					}

					for _, s := range tc.WantWriteContains {
						if !strings.Contains(string(body), s) {
							t.Fatalf("Wanted influx api call containing %s, got %s", s, string(body))
						}
					}
				}
			}))
			defer influxServer.Close()

			core, recordedLogs := observer.New(zapcore.ErrorLevel)
			testLogger := zap.New(core)
			zap.ReplaceGlobals(testLogger)

			maxBatchWait := 200 * time.Millisecond

			influxRecorder, err := NewInfluxRecorder(context.Background(),
				&InfluxEnv{
					URL:          influxServer.URL,
					DatabaseName: "TestDBName",
					MaxBatchSize: 100,
					MaxBatchWait: maxBatchWait,
				},
				"TestService", testLogger.Sugar())
			if err != nil {
				t.Fatal("failed to initialize influx recorder", err)
			}

			influxRecorder.batchPointsConfig = tc.BatchPointsConfig

			scope := influxRecorder.With("Test", tc.Tags, tc.Fields)
			scope.WritePoint(tc.Measurement, nil, nil)

			time.Sleep(2 * maxBatchWait)

			hasErrLog := false
			for _, entry := range recordedLogs.All() {
				if entry.Level == zapcore.ErrorLevel {
					hasErrLog = true
				}
			}
			if tc.HasErr != hasErrLog {
				t.Errorf("want HasErr %t, but got %t", tc.HasErr, hasErrLog)
			}
		})
	}
}

func TestInfluxWritePointBatching(t *testing.T) {
	checkDelay := 200 * time.Millisecond
	longWait := 1 * time.Second
	shortWait := 100 * time.Millisecond

	tcs := []struct {
		desc               string
		maxBatchSize       int
		sendPoints         int
		delayBetweenPoints time.Duration
		maxBatchWait       time.Duration
		maxContextWait     time.Duration

		wantBatches []int
	}{
		{
			desc:         "one batch",
			maxBatchSize: 3,
			sendPoints:   3,
			maxBatchWait: longWait,

			wantBatches: []int{3},
		},
		{
			desc:         "multiple batches, full limit",
			maxBatchSize: 3,
			sendPoints:   12,
			maxBatchWait: longWait,

			wantBatches: []int{3, 3, 3, 3},
		},
		{
			desc:               "multiple batches, not full last batch",
			maxBatchSize:       3,
			sendPoints:         11,
			delayBetweenPoints: time.Millisecond,
			maxBatchWait:       shortWait,

			wantBatches: []int{3, 3, 3, 2},
		},
		{
			desc:               "first batch expires before reaching max size",
			maxBatchSize:       3,
			sendPoints:         3,
			delayBetweenPoints: 100 * time.Millisecond,
			maxBatchWait:       150 * time.Millisecond,

			wantBatches: []int{2, 1},
		},
		{
			desc:               "no more batches after context timeout",
			maxBatchSize:       3,
			sendPoints:         10,
			delayBetweenPoints: 50 * time.Millisecond,
			maxBatchWait:       longWait,
			maxContextWait:     150 * time.Millisecond,

			wantBatches: []int{3, 1},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			influxClient := &mockBatchClient{}

			maxContextWait := tc.maxContextWait
			if maxContextWait == 0 {
				maxContextWait = time.Second
			}
			ctx, cancel := context.WithTimeout(context.Background(), maxContextWait)
			defer cancel()

			influxRecorder := InfluxRecorder{
				client:       influxClient,
				maxBatchSize: tc.maxBatchSize,
				maxBatchWait: tc.maxBatchWait,
				logger:       zap.NewNop().Sugar(),
				pointChan:    make(chan *client.Point),
			}

			go influxRecorder.startBatcher(ctx)

			scope := influxRecorder.With("Test", nil, nil)
			for i := 0; i < tc.sendPoints; i++ {
				scope.WritePoint("measure", nil, Fields{"field": "value"})
				time.Sleep(tc.delayBetweenPoints)
			}

			time.Sleep(checkDelay)

			testutils.MustMatch(t, tc.wantBatches, influxClient.Batches())
		})
	}
}

func TestNewInfluxRecorder(t *testing.T) {
	influxServer := testutils.MockInfluxServer()
	defer influxServer.Close()

	badResponseInfluxServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
		rw.WriteHeader(http.StatusOK)
	}))
	defer badResponseInfluxServer.Close()

	badInfluxURL := "http://localhost:0"

	tcs := []struct {
		Desc      string
		InfluxEnv InfluxEnv

		HasErr bool
		IsNil  bool
	}{
		{
			Desc: "Base case",
			InfluxEnv: InfluxEnv{
				URL:             influxServer.URL,
				DatabaseName:    "Test",
				Username:        "Username",
				Password:        "Password",
				RetentionPolicy: "autogen",
				MaxBatchSize:    1,
				MaxBatchWait:    time.Millisecond,
			},

			HasErr: false,
			IsNil:  false,
		},
		{
			Desc: "URL without valid schema",
			InfluxEnv: InfluxEnv{
				URL:          "hppt://example.com",
				DatabaseName: "Test",
			},

			HasErr: true,
			IsNil:  true,
		},
		{
			Desc: "Missing username does not error",
			InfluxEnv: InfluxEnv{
				URL:             influxServer.URL,
				DatabaseName:    "Test",
				Password:        "Password",
				RetentionPolicy: "autogen",
				MaxBatchSize:    1,
				MaxBatchWait:    time.Millisecond,
			},

			HasErr: false,
			IsNil:  false,
		},
		{
			Desc: "Missing password does not error",
			InfluxEnv: InfluxEnv{
				URL:             influxServer.URL,
				DatabaseName:    "Test",
				Username:        "Username",
				RetentionPolicy: "autogen",
			},

			HasErr: false,
			IsNil:  false,
		},
		{
			Desc: "Missing retention policy does not error",
			InfluxEnv: InfluxEnv{
				URL:          influxServer.URL,
				DatabaseName: "Test",
				Username:     "Username",
				Password:     "Password",
			},

			HasErr: false,
			IsNil:  false,
		},
		{
			Desc: "Missing URL does not error and has nil InfluxRecorder",
			InfluxEnv: InfluxEnv{
				DatabaseName:    "Test",
				Username:        "Username",
				Password:        "Password",
				RetentionPolicy: "autogen",
			},

			HasErr: false,
			IsNil:  true,
		},
		{
			Desc: "Missing DB name does error and has nil InfluxRecorder",
			InfluxEnv: InfluxEnv{
				URL:             influxServer.URL,
				Username:        "Username",
				Password:        "Password",
				RetentionPolicy: "autogen",
			},

			HasErr: true,
			IsNil:  true,
		},
		{
			Desc: "Ping to server fails due to bad response",
			InfluxEnv: InfluxEnv{
				URL:             badResponseInfluxServer.URL,
				DatabaseName:    "Test",
				Username:        "Username",
				Password:        "Password",
				RetentionPolicy: "autogen",
			},

			HasErr: true,
			IsNil:  true,
		},
		{
			Desc: "Ping to server fails due to unreachable server",
			InfluxEnv: InfluxEnv{
				URL:             badInfluxURL,
				DatabaseName:    "Test",
				Username:        "Username",
				Password:        "Password",
				RetentionPolicy: "autogen",
			},

			HasErr: true,
			IsNil:  true,
		},
	}

	for _, tc := range tcs {
		serviceName := "TestService"
		influxRecorder, err := NewInfluxRecorder(context.Background(), &tc.InfluxEnv, serviceName, zap.NewNop().Sugar())
		if (influxRecorder == nil) != tc.IsNil {
			t.Errorf("Expected influxRecorder nilness (%t) to equal tc.IsNil (%t)", influxRecorder == nil, tc.IsNil)
		}
		if (err != nil) != tc.HasErr {
			t.Errorf("Expected err '%s' nilness (%t) to equal tc.HasErr (%t)", err, err != nil, tc.HasErr)
		}
	}
}

func TestNewInfluxRecorderServerError(t *testing.T) {
	tcs := []struct {
		Desc             string
		PingStatus       int
		CreateDBStatus   int
		CreateDBResponse []byte

		HasErr bool
	}{
		{
			Desc:             "Base case",
			PingStatus:       http.StatusNoContent,
			CreateDBResponse: []byte("{}"),
			HasErr:           false,
		},
		{
			Desc:           "Ping error",
			PingStatus:     http.StatusForbidden,
			CreateDBStatus: http.StatusOK,
			HasErr:         true,
		},
		{
			Desc:           "CreateDBResponse error",
			PingStatus:     http.StatusNoContent,
			CreateDBStatus: http.StatusForbidden,
			HasErr:         true,
		},
	}

	for _, tc := range tcs {
		influxServer := httptest.NewServer(http.HandlerFunc(func(rw http.ResponseWriter, req *http.Request) {
			switch {
			case strings.HasPrefix(req.RequestURI, "/ping"):
				rw.WriteHeader(tc.PingStatus)
			case strings.HasPrefix(req.RequestURI, "/query") && strings.Contains(req.RequestURI, "CREATE+DATABASE"):
				rw.Header().Add("Content-Type", "application/json")
				if len(tc.CreateDBResponse) > 0 {
					rw.Write(tc.CreateDBResponse)
				} else {
					rw.WriteHeader(tc.CreateDBStatus)
				}
			default:
				rw.WriteHeader(http.StatusOK)
			}
		}))
		defer influxServer.Close()

		_, err := NewInfluxRecorder(context.Background(),
			&InfluxEnv{
				URL:          influxServer.URL,
				DatabaseName: "TestDBName",
				MaxBatchSize: 100,
				MaxBatchWait: time.Millisecond},
			"ExampleService",
			zap.NewNop().Sugar())
		if (err != nil) != tc.HasErr {
			t.Errorf("Expected err '%s' nilness (%t) to equal tc.HasErr (%t)", err, err != nil, tc.HasErr)
		}
	}
}

func TestMetricsContext(t *testing.T) {
	tcs := []struct {
		Desc        string
		StartTags   Tags
		StartFields Fields
		AddTags     Tags
		AddFields   Fields
		WithTags    Tags
		WithFields  Fields

		ExpectedTags       Tags
		ExpectedFields     Fields
		ExpectedWithTags   Tags
		ExpectedWithFields Fields
	}{
		{
			Desc: "empty",

			ExpectedTags:   Tags{},
			ExpectedFields: Fields{},
		},
		{
			Desc: "start tags/fields only",
			StartTags: Tags{
				"t1": "1",
			},
			StartFields: Fields{
				"f1":   1,
				"fnil": nil,
			},

			ExpectedTags: Tags{
				"t1": "1",
			},
			ExpectedFields: Fields{
				"f1": 1,
			},
		},
		{
			Desc: "add tags/fields only",
			AddTags: Tags{
				"t1": "1",
			},
			AddFields: Fields{
				"f1":   1,
				"fnil": nil,
			},

			ExpectedTags: Tags{
				"t1": "1",
			},
			ExpectedFields: Fields{
				"f1": 1,
			},
		},
		{
			Desc: "start and add tags/fields",
			StartTags: Tags{
				"t1": "1",
			},
			StartFields: Fields{
				"f1": 1,
			},
			AddTags: Tags{
				"t2": "2",
			},
			AddFields: Fields{
				"f2":   2,
				"fnil": nil,
			},

			ExpectedTags: Tags{
				"t1": "1",
				"t2": "2",
			},
			ExpectedFields: Fields{
				"f1": 1,
				"f2": 2,
			},
		},
		{
			Desc: "overwrite tags/fields",
			StartTags: Tags{
				"t1": "1",
			},
			StartFields: Fields{
				"f1": 1,
			},
			AddTags: Tags{
				"t1": "2",
			},
			AddFields: Fields{
				"f1": 2,
			},

			ExpectedTags: Tags{
				"t1": "2",
			},
			ExpectedFields: Fields{
				"f1": 2,
			},
		},
		{
			Desc: "overwrite fields with nil deletes it",
			StartFields: Fields{
				"f1": 1,
			},
			AddFields: Fields{
				"f1": nil,
			},

			ExpectedTags:   Tags{},
			ExpectedFields: Fields{},
		},
		{
			Desc: "with tags/fields does not permanently lose tags/fields state",
			StartTags: Tags{
				"t1": "1",
			},
			StartFields: Fields{
				"f1":   1,
				"fnil": nil,
			},
			WithTags: Tags{
				"t1": "3",
				"t2": "2",
			},
			WithFields: Fields{
				"f1":    3,
				"f2":    2,
				"fnil2": nil,
			},

			ExpectedTags: Tags{
				"t1": "1",
			},
			ExpectedFields: Fields{
				"f1": 1,
			},
			ExpectedWithTags: Tags{
				"t1": "3",
				"t2": "2",
			},
			ExpectedWithFields: Fields{
				"f1": 3,
				"f2": 2,
			},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			mc := newMetricsContext()
			ctx := context.WithValue(context.Background(), grpcMetricsContextKey{}, mc)

			AddGRPCTags(ctx, tc.StartTags)
			AddGRPCFields(ctx, tc.StartFields)

			AddGRPCTags(ctx, tc.AddTags)
			AddGRPCFields(ctx, tc.AddFields)

			if tc.WithTags != nil {
				testutils.MustMatch(t, tc.ExpectedWithTags, mc.WithTags(tc.WithTags), "tags don't match")
			}
			if tc.WithFields != nil {
				testutils.MustMatch(t, tc.ExpectedWithFields, mc.WithFields(tc.WithFields), "fields don't match")
			}

			testutils.MustMatch(t, tc.ExpectedTags, mc.Tags(), "tags don't match")
			testutils.MustMatch(t, tc.ExpectedFields, mc.Fields(), "fields don't match")
		})
	}
}

func TestScope(t *testing.T) {
	startPrefix := "start"
	r := &InfluxRecorder{
		seriesPrefix: startPrefix,
	}

	s1Prefix := "scope1"
	s1Tags := Tags{
		"t1": "1",
	}
	s1Fields := Fields{
		"f1": 1,
	}
	s1 := r.With(s1Prefix, s1Tags, s1Fields)
	testutils.MustMatch(t, startPrefix+prefixDelimiter+s1Prefix, s1.prefix, "wrong prefix")
	testutils.MustMatch(t, s1Tags, s1.mc.Tags(), "tags don't match")
	testutils.MustMatch(t, s1Fields, s1.mc.Fields(), "fields don't match")
	testutils.MustMatch(t, r, s1.r, "missing recorder")

	s2Prefix := "scope2"
	s2 := s1.With(s2Prefix, Tags{
		"t2": "2",
	}, Fields{
		"f2": 2,
	}).(*InfluxScope)
	testutils.MustMatch(t, startPrefix+prefixDelimiter+s1Prefix+prefixDelimiter+s2Prefix, s2.prefix, "wrong prefix")
	testutils.MustMatch(t, Tags{
		"t1": "1",
		"t2": "2",
	}, s2.mc.Tags(), "tags don't match")
	testutils.MustMatch(t, Fields{
		"f1": 1,
		"f2": 2,
	}, s2.mc.Fields(), "fields don't match")
	testutils.MustMatch(t, r, s2.r, "missing recorder")
}

func Test_newPrefix(t *testing.T) {
	tests := []struct {
		Desc      string
		OldPrefix string
		Prefix    string

		ExpectedPrefix string
	}{
		{
			Desc: "empty",
		},
		{
			Desc:           "only oldPrefix",
			OldPrefix:      "old",
			ExpectedPrefix: "old",
		},
		{
			Desc:           "only new prefix",
			Prefix:         "new",
			ExpectedPrefix: "new",
		},
		{
			Desc:           "both old and new prefix",
			OldPrefix:      "old",
			Prefix:         "new",
			ExpectedPrefix: "old" + prefixDelimiter + "new",
		},
	}
	for _, tt := range tests {
		t.Run(tt.Desc, func(t *testing.T) {
			testutils.MustMatch(t, tt.ExpectedPrefix, newPrefix(tt.OldPrefix, tt.Prefix))
		})
	}
}

var errUnimplemented = errors.New("unimplemented")

type mockBatchClient struct {
	batches []int

	mx sync.RWMutex
}

func (c *mockBatchClient) Batches() []int {
	c.mx.RLock()
	defer c.mx.RUnlock()

	return c.batches
}

func (c *mockBatchClient) Ping(timeout time.Duration) (time.Duration, string, error) {
	return 0, "", errUnimplemented
}

func (c *mockBatchClient) Write(bp client.BatchPoints) error {
	c.mx.Lock()
	defer c.mx.Unlock()
	c.batches = append(c.batches, len(bp.Points()))
	return nil
}

func (c *mockBatchClient) Query(q client.Query) (*client.Response, error) {
	return nil, errUnimplemented
}

func (c *mockBatchClient) QueryAsChunk(q client.Query) (*client.ChunkedResponse, error) {
	return nil, errUnimplemented
}

func (c *mockBatchClient) Close() error {
	return errUnimplemented
}

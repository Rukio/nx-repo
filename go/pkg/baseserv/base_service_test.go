package baseserv_test

import (
	"context"
	"errors"
	"fmt"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	"github.com/*company-data-covered*/services/go/pkg/baseserv"
	"github.com/*company-data-covered*/services/go/pkg/eventstreaming"
	examplepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/example"
	"github.com/*company-data-covered*/services/go/pkg/monitoring"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/credentials/insecure"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/reflect/protoreflect"
)

type FakeAuthEnv struct {
	valid bool
	token *auth.Token
	err   error
}

func (f FakeAuthEnv) Valid() bool {
	return f.valid
}

func (f FakeAuthEnv) FetchToken(context.Context) (*auth.Token, error) {
	return f.token, f.err
}

func TestNewServer(t *testing.T) {
	serviceName := "ExampleService"
	serviceDesc := examplepb.File_example_service_proto.Services().ByName(
		protoreflect.Name(serviceName))

	grpcAddr := "localhost:0"
	badGRPCAddr := "localhost:-1"

	grpcAuthConfig := auth.Config{
		AuthorizationDisabled: false,
		IssuerURL:             "some url",
		Audience:              "some audience",
	}
	badGRPCAuthConfig := auth.Config{}

	policyAuthorizerEnabled := func() bool { return true }
	grpcPolicyAuthorizerConfig := &auth.GRPCPolicyAuthorizerConfig{
		Enabled: policyAuthorizerEnabled,
	}
	badGrpcPolicyAuthorizerConfig := &auth.GRPCPolicyAuthorizerConfig{}

	loggerOpts := baselogger.LoggerOptions{
		ServiceName:  serviceName,
		UseDevConfig: false,
	}

	influxServer := testutils.MockInfluxServer()
	defer influxServer.Close()

	influxEnv := &monitoring.InfluxEnv{
		URL:             influxServer.URL,
		Username:        "",
		Password:        "",
		DatabaseName:    "def",
		RetentionPolicy: "",
	}

	ddConfig := &monitoring.DataDogConfig{
		Env:            "test",
		APMUrl:         "test-url",
		AppVersion:     "test",
		ServiceName:    "service-name",
		StatsDUrl:      "127.0.0.1:8125",
		EnableProfiler: true,
	}

	tcs := []struct {
		Desc   string
		Params baseserv.NewServerParams

		HasErr     bool
		HasInflux  bool
		HasDatadog bool
	}{
		{
			Desc: "base case",
			Params: baseserv.NewServerParams{
				ServerName:                 serviceName,
				GRPCServiceDescriptors:     []protoreflect.ServiceDescriptor{serviceDesc},
				GRPCAddr:                   grpcAddr,
				GRPCAuthConfig:             grpcAuthConfig,
				LoggerOptions:              loggerOpts,
				InfluxEnv:                  influxEnv,
				DataDogConfig:              ddConfig,
				GRPCPolicyAuthorizerConfig: grpcPolicyAuthorizerConfig,
			},

			HasErr:     false,
			HasInflux:  true,
			HasDatadog: true,
		},
		{
			Desc: "base case with multi-audience allowed",
			Params: baseserv.NewServerParams{
				ServerName:             serviceName,
				GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{serviceDesc},
				GRPCAddr:               grpcAddr,
				GRPCAuthConfig: auth.Config{
					AuthorizationDisabled:  false,
					IssuerURL:              "some url",
					Audience:               "some audience",
					AllowMultipleAudiences: true,
				},
				LoggerOptions: loggerOpts,
				InfluxEnv:     influxEnv,
				DataDogConfig: ddConfig,
			},

			HasErr:     false,
			HasInflux:  true,
			HasDatadog: true,
		},
		{
			Desc: "no grpc server name fails",
			Params: baseserv.NewServerParams{
				ServerName:             "",
				GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{serviceDesc},
				GRPCAddr:               grpcAddr,
				GRPCAuthConfig:         grpcAuthConfig,
				LoggerOptions:          loggerOpts,
				InfluxEnv:              influxEnv,
				DataDogConfig:          ddConfig,
			},

			HasErr: true,
		},
		{
			Desc: "no grpc service descriptor fails",
			Params: baseserv.NewServerParams{
				GRPCServiceDescriptors: nil,
				GRPCAddr:               grpcAddr,
				GRPCAuthConfig:         grpcAuthConfig,
				LoggerOptions:          loggerOpts,
				InfluxEnv:              nil,
				DataDogConfig:          nil,
			},

			HasErr: true,
		},
		{
			Desc: "bad grpc address fails",
			Params: baseserv.NewServerParams{
				ServerName:             serviceName,
				GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{serviceDesc},
				GRPCAddr:               badGRPCAddr,
				GRPCAuthConfig:         grpcAuthConfig,
				LoggerOptions:          loggerOpts,
				InfluxEnv:              nil,
				DataDogConfig:          nil,
			},

			HasErr: true,
		},
		{
			Desc: "no influx options works",
			Params: baseserv.NewServerParams{
				ServerName:             serviceName,
				GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{serviceDesc},
				GRPCAddr:               grpcAddr,
				GRPCAuthConfig:         grpcAuthConfig,
				LoggerOptions:          loggerOpts,
				InfluxEnv:              nil,
			},

			HasErr:    false,
			HasInflux: false,
		},
		{
			Desc: "no datadog options works",
			Params: baseserv.NewServerParams{
				ServerName:             serviceName,
				GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{serviceDesc},
				GRPCAddr:               grpcAddr,
				GRPCAuthConfig:         grpcAuthConfig,
				LoggerOptions:          loggerOpts,
				DataDogConfig:          nil,
			},

			HasErr:     false,
			HasDatadog: false,
		},
		{
			Desc: "bad auth options fails",
			Params: baseserv.NewServerParams{
				ServerName:             serviceName,
				GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{serviceDesc},
				GRPCAddr:               grpcAddr,
				GRPCAuthConfig:         badGRPCAuthConfig,
				LoggerOptions:          loggerOpts,
				InfluxEnv:              influxEnv,
				DataDogConfig:          ddConfig,
			},

			HasErr: true,
		},
		{
			Desc: "data dog config works",
			Params: baseserv.NewServerParams{
				ServerName:             serviceName,
				GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{serviceDesc},
				GRPCAddr:               grpcAddr,
				GRPCAuthConfig:         grpcAuthConfig,
				LoggerOptions:          loggerOpts,
				InfluxEnv:              influxEnv,
				DataDogConfig:          ddConfig,
			},

			HasErr:     false,
			HasInflux:  true,
			HasDatadog: true,
		},
		{
			Desc: "custom logger works",
			Params: baseserv.NewServerParams{
				ServerName:             serviceName,
				GRPCServiceDescriptors: []protoreflect.ServiceDescriptor{serviceDesc},
				GRPCAddr:               grpcAddr,
				GRPCAuthConfig:         grpcAuthConfig,
				Logger:                 zap.NewNop().Sugar(),
				InfluxEnv:              nil,
				DataDogConfig:          nil,
			},

			HasErr: false,
		},
		{
			Desc: "bad grpc policy authorizer options fails",
			Params: baseserv.NewServerParams{
				ServerName:                 serviceName,
				GRPCServiceDescriptors:     []protoreflect.ServiceDescriptor{serviceDesc},
				GRPCAddr:                   grpcAddr,
				GRPCAuthConfig:             grpcAuthConfig,
				GRPCPolicyAuthorizerConfig: badGrpcPolicyAuthorizerConfig,
			},

			HasErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			server, err := baseserv.NewServer(tc.Params)
			if (err != nil) != tc.HasErr {
				t.Fatal(err)
			}
			if tc.HasErr {
				return
			}
			defer server.Cleanup()

			if (server.InfluxRecorder() != nil) != tc.HasInflux {
				t.Fatal(server.InfluxRecorder(), tc.HasInflux)
			}

			if (server.DataDogRecorder() != nil) != tc.HasDatadog {
				t.Fatal(server.DataDogRecorder(), tc.HasDatadog)
			}

			go func() {
				err := server.ServeGRPC(func(grpcServer *grpc.Server) {
					examplepb.RegisterExampleServiceServer(grpcServer, examplepb.UnimplementedExampleServiceServer{})
				})
				if err != nil {
					// can't Fatal outside of the main test goroutine, otherwise we would ;)
					fmt.Println(err)
				}
			}()

			if server.Logger() == nil {
				t.Fatal("missing logger")
			}

			grpcServerConn, err := grpc.Dial(server.GRPCAddr().String(), grpc.WithTransportCredentials(insecure.NewCredentials()))
			if err != nil {
				t.Fatal(err)
			}

			client := examplepb.NewExampleServiceClient(grpcServerConn)
			_, err = client.GetVersion(context.Background(), &examplepb.GetVersionRequest{})
			if err != nil {
				s, ok := status.FromError(err)
				if !ok || s.Code() != codes.Unauthenticated {
					t.Fatal(err)
				}
			}
		})
	}
}

func TestDefaulEnvDataDogConfig(t *testing.T) {
	tcs := []struct {
		Desc        string
		ServiceName string
	}{
		{
			Desc:        "base case",
			ServiceName: "test-name",
		},
	}

	for _, tc := range tcs {
		t.Setenv("DATADOG_DISABLED", "false")
		options := baseserv.DefaultEnvDataDogConfig(tc.ServiceName)
		testutils.MustMatch(t, tc.ServiceName, options.ServiceName, "service name not matching on options")
	}
}

func TestDefaultEventstreamingConsumerConfig(t *testing.T) {
	t.Setenv("KAFKA_VERSION", "2.0.0")
	t.Setenv("KAFKA_LOGGING_VERBOSE", "true")
	t.Setenv("KAFKA_CONSUMER_GROUP", "test-group-1")
	t.Setenv("KAFKA_BROKERS", "localhost:9999")
	t.Setenv("KAFKA_ASSIGNMENT_STRATEGY", "sticky")
	t.Setenv("KAFKA_OLDEST_OFFSET", "false")

	config := baseserv.DefaultEventStreamingConsumerConfig()
	testutils.MustMatch(t, "2.0.0", config.KafkaVersion)
	testutils.MustMatch(t, true, config.VerboseLogging)
	testutils.MustMatch(t, "test-group-1", config.Consumer.GroupID)
	testutils.MustMatch(t, []string{"localhost:9999"}, config.Brokers)
	testutils.MustMatch(t, eventstreaming.AssignmentStrategy(eventstreaming.StickyAssignment), config.Consumer.AssignmentStrategy)
	testutils.MustMatch(t, false, config.Consumer.ConsumeFromOldest)
}

func TestDefaultEventstreamingProducerConfig(t *testing.T) {
	t.Setenv("KAFKA_VERSION", "2.0.0")
	t.Setenv("KAFKA_LOGGING_VERBOSE", "true")
	t.Setenv("KAFKA_BROKERS", "localhost:9999")

	config := baseserv.DefaultEventStreamingProducerConfig()
	testutils.MustMatch(t, "2.0.0", config.KafkaVersion)
	testutils.MustMatch(t, true, config.VerboseLogging)
	testutils.MustMatch(t, []string{"localhost:9999"}, config.Brokers)
}

func TestCreateAuthedGRPCConnection(t *testing.T) {
	fakeAddr := "testaddr"

	tcs := []struct {
		Desc string
		Env  FakeAuthEnv

		WantPanic bool
	}{
		{
			Desc: "Base Case",
			Env:  FakeAuthEnv{valid: true},

			WantPanic: false,
		},
		{
			Desc: "Invalid auth env",
			Env:  FakeAuthEnv{valid: false},

			WantPanic: true,
		},
		{
			Desc: "Cannot fetch token",
			Env:  FakeAuthEnv{err: errors.New("i aint real")},

			WantPanic: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			if tc.WantPanic {
				defer func() {
					if r := recover(); r == nil {
						t.Errorf("The code did not panic")
					}
				}()
			}

			_, closeConn := baseserv.CreateAuthedGRPCConnection(context.Background(),
				baseserv.GRPCConnParams{
					Name:                 "testname",
					Address:              &fakeAddr,
					DialTimeout:          10 * time.Second,
					Logger:               zap.NewNop().Sugar(),
					Env:                  tc.Env,
					RefreshTokenInterval: 10 * time.Second,
				},
			)
			defer closeConn()
		})
	}
}

func TestCreateGRPCConnection(t *testing.T) {
	exampleAddr := "exampleAddr:0000"
	emptyAddr := ""
	var nilAddr string
	tcs := []struct {
		Desc string
		Addr *string

		WantNilResp bool
	}{
		{
			Desc: "Base Case",
			Addr: &exampleAddr,

			WantNilResp: false,
		},
		{
			Desc: "empty addr",
			Addr: &emptyAddr,

			WantNilResp: true,
		},
		{
			Desc: "nil addr",
			Addr: &nilAddr,

			WantNilResp: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			opts := []grpc.DialOption{grpc.WithTransportCredentials(insecure.NewCredentials())}
			conn, closeConn := baseserv.CreateGRPCConnection(context.Background(), "testname", tc.Addr, opts, 10*time.Second, zap.NewNop().Sugar())
			if tc.WantNilResp {
				if conn != nil {
					t.Fatalf("Want nil response, got: %+v", conn)
				}
			} else {
				closeConn()
			}
		})
	}
}

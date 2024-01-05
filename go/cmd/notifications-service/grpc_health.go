package main

import (
	"context"
	"errors"
	"fmt"
	"net/http"

	"github.com/*company-data-covered*/services/go/cmd/notifications-service/slack-service"
	"github.com/*company-data-covered*/services/go/pkg/httpclient"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	healthpb "google.golang.org/grpc/health/grpc_health_v1"
	"google.golang.org/grpc/metadata"
)

const (
	twilioRESTAPIComponentName   = "REST API"
	serviceUnavailableHTTPStatus = "503"
)

var twilioOutageStatuses = map[string]bool{
	"degraded_performance": true,
	"partial_outage":       true,
	"major_outage":         true,
	"under_maintenance":    true,
}

type HealthGRPCService struct {
	healthpb.UnimplementedHealthServer
	SlackClient           slack.Client
	TwilioStatCheckClient *TwilioStatCheckClient
	Logger                *zap.SugaredLogger
}

type TwilioStatCheckClient struct {
	TwilioStatCheckURL string
}

type twilioComponent struct {
	ID     string `json:"id"`
	Name   string `json:"name"`
	Status string `json:"status"`
}

type twilioComponentsResponse struct {
	Components []twilioComponent `json:"components"`
}

func (s *HealthGRPCService) twilioHealthCheck(ctx context.Context) error {
	if s.TwilioStatCheckClient.TwilioStatCheckURL == "" {
		return nil
	}

	var response twilioComponentsResponse
	err := httpclient.Do(ctx, &httpclient.Request{
		Method:   http.MethodGet,
		URL:      s.TwilioStatCheckClient.TwilioStatCheckURL,
		Response: &response,
	})
	if err != nil {
		return err
	}

	for _, c := range response.Components {
		if c.Name == twilioRESTAPIComponentName {
			if twilioOutageStatuses[c.Status] {
				return fmt.Errorf("%s status: %s", twilioRESTAPIComponentName, c.Status)
			}
			return nil
		}
	}

	return errors.New("could not find Twilio REST API component")
}

func (s *HealthGRPCService) getStatus(ctx context.Context) healthpb.HealthCheckResponse_ServingStatus {
	status := healthpb.HealthCheckResponse_SERVING

	err := s.SlackClient.AuthTest()
	if err != nil {
		s.Logger.Errorw("Slack is not healthy", zap.Error(err))
		status = healthpb.HealthCheckResponse_NOT_SERVING
	}

	err = s.twilioHealthCheck(ctx)
	if err != nil {
		s.Logger.Errorw("Twilio is not healthy", zap.Error(err))
		status = healthpb.HealthCheckResponse_NOT_SERVING
	}

	return status
}

func (s *HealthGRPCService) Check(ctx context.Context, req *healthpb.HealthCheckRequest) (*healthpb.HealthCheckResponse, error) {
	status := s.getStatus(ctx)

	if status != healthpb.HealthCheckResponse_SERVING {
		err := grpc.SetHeader(ctx, metadata.Pairs("x-http-code", serviceUnavailableHTTPStatus))
		if err != nil {
			s.Logger.Errorw("Failed to set response HTTP header", zap.Error(err))
		}
	}
	return &healthpb.HealthCheckResponse{
		Status: status,
	}, nil
}

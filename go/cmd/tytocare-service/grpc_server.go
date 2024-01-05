package main

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"

	"go.uber.org/zap"

	"github.com/*company-data-covered*/services/go/pkg/apistatus"
	"github.com/*company-data-covered*/services/go/pkg/auth"
	"github.com/*company-data-covered*/services/go/pkg/buildinfo"
	tytocarepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/tytocare"
	"golang.org/x/exp/slices"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/peer"
	"google.golang.org/grpc/status"
)

type GRPCServer struct {
	tytocarepb.UnimplementedTytoCareServiceServer
	TytoCareAuthToken auth.FixedToken
	TytoCareBaseURL   string
	Client            *http.Client
	Logger            *zap.SugaredLogger
}

func validateIPAddress(s string) error {
	if net.ParseIP(s) == nil {
		return errors.New("invalid IP provided")
	}

	return nil
}

func (s *GRPCServer) logAndReturnError(code codes.Code, message string) error {
	if message == "" {
		message = "something went wrong!"
	}

	s.Logger.Errorf("[Tytocare error]: %s", message)
	return status.Errorf(code, message)
}

func (s *GRPCServer) executeTytoCareRequest(ctx context.Context, method string, path string, body any, allowedResponseCodes []int, responseInterface any) error {
	url := fmt.Sprintf("%s%s", s.TytoCareBaseURL, path)

	req, err := http.NewRequestWithContext(ctx, method, url, nil)
	if err != nil {
		return s.logAndReturnError(codes.Internal, fmt.Sprintf("failed to create HTTP request to TytoCare API: %s", err))
	}
	if body != nil {
		jsonBody, err := json.Marshal(body)
		if err != nil {
			return s.logAndReturnError(codes.Internal, fmt.Sprintf("failed to marshal json into TytoCareRequest struct: %s", err))
		}

		req, err = http.NewRequestWithContext(ctx, method, url, bytes.NewBuffer(jsonBody))
		if err != nil {
			return s.logAndReturnError(codes.Internal, fmt.Sprintf("failed to create HTTP request to TytoCare API with body: %s", err))
		}
		req.Header.Add("Content-Type", "application/json")
	}

	req.Header.Add("Authorization", s.TytoCareAuthToken.AuthorizationValue())

	resp, err := s.Client.Do(req)
	if err != nil {
		return s.logAndReturnError(codes.Unavailable, fmt.Sprintf("failed to execute HTTP request: %s", err))
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return s.logAndReturnError(codes.Internal, fmt.Sprintf("failed to read HTTP response: %s", err))
	}

	var isAllowedResponse = slices.Contains(allowedResponseCodes, resp.StatusCode)
	if !isAllowedResponse {
		var grpcStatus codes.Code
		if resp.StatusCode == http.StatusConflict {
			grpcStatus = codes.AlreadyExists
		} else {
			grpcStatus, err = apistatus.HTTPStatusToGRPC(resp.StatusCode)
		}
		if err != nil {
			return s.logAndReturnError(codes.Unknown, fmt.Sprintf("Failed to convert HTTP status, %d, to gRPC status %s", resp.StatusCode, err))
		}
		return s.logAndReturnError(grpcStatus, fmt.Sprintf("HTTP request had error response status code %d: %s", resp.StatusCode, responseBody))
	}

	if responseInterface != nil {
		err = json.Unmarshal(responseBody, responseInterface)
		if err != nil {
			return s.logAndReturnError(codes.Internal, fmt.Sprintf("failed to unmarshal json into given struct: %s", err))
		}
	}

	return nil
}

func (s *GRPCServer) CreatePatient(ctx context.Context, r *tytocarepb.CreatePatientRequest) (*tytocarepb.CreatePatientResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultHTTPTimeout)
	defer cancel()

	tytoCarePatient, err := ProtoToTytoCarePatient(r)
	if err != nil {
		return nil, s.logAndReturnError(codes.InvalidArgument, fmt.Sprintf("failed to convert proto into TytoCarePatient: %s", err))
	}

	allowedResponseCodes := []int{http.StatusCreated, http.StatusConflict}
	path := "/v1/integration/patients"
	err = s.executeTytoCareRequest(ctx, http.MethodPost, path, tytoCarePatient, allowedResponseCodes, nil)
	if err != nil {
		return nil, err
	}

	return &tytocarepb.CreatePatientResponse{}, nil
}

func (s *GRPCServer) CreateVisit(ctx context.Context, r *tytocarepb.CreateVisitRequest) (*tytocarepb.CreateVisitResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultHTTPTimeout)
	defer cancel()

	tytoCareVisit, err := ProtoToTytoCareCreateVisit(r)
	if err != nil {
		return nil, s.logAndReturnError(codes.InvalidArgument, fmt.Sprintf("failed to convert proto into TytoCareCreateVisit: %s", err))
	}

	var tytoResponse TytoCareCreateVisitResponse
	allowedResponseCodes := []int{http.StatusCreated}
	path := "/v1/integration/visits"
	err = s.executeTytoCareRequest(ctx, http.MethodPost, path, tytoCareVisit, allowedResponseCodes, &tytoResponse)
	if err != nil {
		return nil, err
	}

	protoResponse, err := TytoCareCreateVisitToProto(&tytoResponse, r.VisitId)
	if err != nil {
		return nil, s.logAndReturnError(codes.Internal, fmt.Sprintf("failed to convert TytoCareCreateVisit into proto: %s", err))
	}

	return protoResponse, nil
}

func (s *GRPCServer) ActivateVisit(ctx context.Context, r *tytocarepb.ActivateVisitRequest) (*tytocarepb.ActivateVisitResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultHTTPTimeout)
	defer cancel()

	if r.VirtualAppRemoteAddress == "" {
		p, ok := peer.FromContext(ctx)
		if !ok {
			return nil, s.logAndReturnError(codes.Internal, "cannot retrieve peer from context")
		}
		host, _, err := net.SplitHostPort(p.Addr.String())
		if err != nil {
			host = p.Addr.String()
		}
		err = validateIPAddress(host)
		if err != nil {
			return nil, s.logAndReturnError(codes.Internal, fmt.Sprintf("host parse from peer is not a valid IP address: %s", err))
		}
		r.VirtualAppRemoteAddress = host
	} else if err := validateIPAddress(r.VirtualAppRemoteAddress); err != nil {
		return nil, s.logAndReturnError(codes.InvalidArgument, fmt.Sprintf("error parsing provided remote address: %s", err))
	}

	tytoCareVisit, err := ProtoToTytoCareActivateVisit(r)
	if err != nil {
		return nil, s.logAndReturnError(codes.InvalidArgument, fmt.Sprintf("failed to convert proto into TytoCareActivateVisit: %s", err))
	}

	path := fmt.Sprintf("/v1/integration/visits/%s/status", *tytoCareVisit.Identifier)
	var tytoResponse TytoCareActivateVisitResponse
	allowedResponseCodes := []int{http.StatusOK}
	err = s.executeTytoCareRequest(ctx, http.MethodPut, path, tytoCareVisit, allowedResponseCodes, &tytoResponse)
	if err != nil {
		return nil, err
	}

	protoResponse, err := TytoCareActivateVisitToProto(&tytoResponse)
	if err != nil {
		return nil, s.logAndReturnError(codes.Internal, fmt.Sprintf("failed to convert TytoCareActivateVisit into proto: %s", err))
	}

	return protoResponse, nil
}

func (s *GRPCServer) AssignClinicianToVisit(ctx context.Context, r *tytocarepb.AssignClinicianToVisitRequest) (*tytocarepb.AssignClinicianToVisitResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultHTTPTimeout)
	defer cancel()

	tytoCareVisit, err := ProtoToTytoCareAssignClinicianToVisit(r)
	if err != nil {
		return nil, s.logAndReturnError(codes.InvalidArgument, fmt.Sprintf("failed to convert proto into TytoCareUpdateVisit: %s", err))
	}

	path := fmt.Sprintf("/v1/integration/visits/%s", *tytoCareVisit.Identifier)
	allowedResponseCodes := []int{http.StatusOK}
	err = s.executeTytoCareRequest(ctx, http.MethodPut, path, tytoCareVisit, allowedResponseCodes, nil)
	if err != nil {
		return nil, err
	}

	return &tytocarepb.AssignClinicianToVisitResponse{}, nil
}

func (s *GRPCServer) HealthCheck(ctx context.Context, _ *tytocarepb.HealthCheckRequest) (*tytocarepb.HealthCheckResponse, error) {
	_, cancel := context.WithTimeout(ctx, *defaultGRPCTimeout)
	defer cancel()

	return &tytocarepb.HealthCheckResponse{
		Version: buildinfo.Version,
	}, nil
}

func (s *GRPCServer) GenerateDeepLink(ctx context.Context, r *tytocarepb.GenerateDeepLinkRequest) (*tytocarepb.GenerateDeepLinkResponse, error) {
	ctx, cancel := context.WithTimeout(ctx, *defaultHTTPTimeout)
	defer cancel()

	tytoCareGenerateDeepLink, err := ProtoToTytoCareGenerateDeepLinkReq(r)
	if err != nil {
		return nil, s.logAndReturnError(codes.InvalidArgument, fmt.Sprintf("failed to convert proto into TytoCareGenerateDeepLink: %s", err))
	}

	var tytoResponse TytoCareGenerateDeepLinkResponse
	path := "/v1/integration/deepLinks"
	allowedResponseCodes := []int{http.StatusCreated}
	err = s.executeTytoCareRequest(ctx, http.MethodPost, path, tytoCareGenerateDeepLink, allowedResponseCodes, &tytoResponse)
	if err != nil {
		return nil, err
	}

	protoResponse, err := TytoCareGenerateDeepLinkToProtoResp(&tytoResponse)
	if err != nil {
		return nil, s.logAndReturnError(codes.Internal, fmt.Sprintf("failed to convert TytoCareGenerateDeepLink into proto: %s", err))
	}

	return protoResponse, nil
}

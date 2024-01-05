package main

import (
	"context"

	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type AthenaClientMock struct {
	athenapb.AthenaServiceClient
	CheckLabResultsSubscriptionStatusHandler func(ctx context.Context, req *athenapb.CheckLabResultsSubscriptionStatusRequest) (*athenapb.CheckLabResultsSubscriptionStatusResponse, error)
	SubscribeLabResultEventsHandler          func(ctx context.Context, req *athenapb.SubscribeLabResultEventsRequest) (*athenapb.SubscribeLabResultEventsResponse, error)
	CheckPatientsSubscriptionStatusHandler   func(ctx context.Context, req *athenapb.CheckPatientsSubscriptionStatusRequest) (*athenapb.CheckPatientsSubscriptionStatusResponse, error)
	SubscribePatientEventsHandler            func(ctx context.Context, req *athenapb.SubscribePatientEventsRequest) (*athenapb.SubscribePatientEventsResponse, error)
	ListChangedPatientsHandler               func(ctx context.Context, req *athenapb.ListChangedPatientsRequest) (*athenapb.ListChangedPatientsResponse, error)
	ListChangedLabResultsHandler             func(ctx context.Context, req *athenapb.ListChangedLabResultsRequest) (*athenapb.ListChangedLabResultsResponse, error)
	GetPatientLabResultDocumentHandler       func(ctx context.Context, req *athenapb.GetPatientLabResultDocumentRequest, opts ...grpc.CallOption) (*athenapb.GetPatientLabResultDocumentResponse, error)
	UpdatePatientDiscussionNotesHandler      func(ctx context.Context, req *athenapb.UpdatePatientDiscussionNotesRequest, opts ...grpc.CallOption) (*athenapb.UpdatePatientDiscussionNotesResponse, error)
	GetPatientGoalsHandler                   func(ctx context.Context, req *athenapb.GetPatientGoalsRequest, opts ...grpc.CallOption) (*athenapb.GetPatientGoalsResponse, error)
	GetPatientOrderHandler                   func(ctx context.Context, req *athenapb.GetPatientOrderRequest, opts ...grpc.CallOption) (*athenapb.GetPatientOrderResponse, error)
}

func (mock *AthenaClientMock) CheckLabResultsSubscriptionStatus(
	ctx context.Context, req *athenapb.CheckLabResultsSubscriptionStatusRequest, opts ...grpc.CallOption) (*athenapb.CheckLabResultsSubscriptionStatusResponse, error) {
	if mock.CheckLabResultsSubscriptionStatusHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock CheckLabResultsSubscriptionStatus not defined")
	}
	return mock.CheckLabResultsSubscriptionStatusHandler(ctx, req)
}

func (mock *AthenaClientMock) SubscribeLabResultEvents(ctx context.Context, req *athenapb.SubscribeLabResultEventsRequest, opts ...grpc.CallOption) (*athenapb.SubscribeLabResultEventsResponse, error) {
	if mock.SubscribeLabResultEventsHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock SubscribeLabResultEvents not defined")
	}
	return mock.SubscribeLabResultEventsHandler(ctx, req)
}

func (mock *AthenaClientMock) CheckPatientsSubscriptionStatus(ctx context.Context, req *athenapb.CheckPatientsSubscriptionStatusRequest, opts ...grpc.CallOption) (*athenapb.CheckPatientsSubscriptionStatusResponse, error) {
	if mock.CheckPatientsSubscriptionStatusHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock CheckPatientsSubscriptionStatus not defined")
	}
	return mock.CheckPatientsSubscriptionStatusHandler(ctx, req)
}

func (mock *AthenaClientMock) SubscribePatientEvents(ctx context.Context, req *athenapb.SubscribePatientEventsRequest, opts ...grpc.CallOption) (*athenapb.SubscribePatientEventsResponse, error) {
	if mock.SubscribePatientEventsHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock SubscribePatientEvents not defined")
	}
	return mock.SubscribePatientEventsHandler(ctx, req)
}

func (mock *AthenaClientMock) ListChangedPatients(ctx context.Context, req *athenapb.ListChangedPatientsRequest, opts ...grpc.CallOption) (*athenapb.ListChangedPatientsResponse, error) {
	if mock.ListChangedPatientsHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock ListChangedPatients not defined")
	}
	return mock.ListChangedPatientsHandler(ctx, req)
}

func (mock *AthenaClientMock) ListChangedLabResults(ctx context.Context, req *athenapb.ListChangedLabResultsRequest, opts ...grpc.CallOption) (*athenapb.ListChangedLabResultsResponse, error) {
	if mock.ListChangedLabResultsHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock ListChangedLabResults not defined")
	}
	return mock.ListChangedLabResultsHandler(ctx, req)
}

func (mock *AthenaClientMock) GetPatientLabResultDocument(ctx context.Context, in *athenapb.GetPatientLabResultDocumentRequest, opts ...grpc.CallOption) (*athenapb.GetPatientLabResultDocumentResponse, error) {
	if mock.GetPatientLabResultDocumentHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetPatientLabResultDocument not defined")
	}
	return mock.GetPatientLabResultDocumentHandler(ctx, in, opts...)
}

func (mock *AthenaClientMock) UpdatePatientDiscussionNotes(ctx context.Context, in *athenapb.UpdatePatientDiscussionNotesRequest, opts ...grpc.CallOption) (*athenapb.UpdatePatientDiscussionNotesResponse, error) {
	if mock.UpdatePatientDiscussionNotesHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock UpdatePatientDiscussionNotes not defined")
	}
	return mock.UpdatePatientDiscussionNotesHandler(ctx, in, opts...)
}

func (mock *AthenaClientMock) GetPatientGoals(ctx context.Context, in *athenapb.GetPatientGoalsRequest, opts ...grpc.CallOption) (*athenapb.GetPatientGoalsResponse, error) {
	if mock.GetPatientGoalsHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetPatientGoals not defined")
	}
	return mock.GetPatientGoalsHandler(ctx, in, opts...)
}

func (mock *AthenaClientMock) GetPatientOrder(ctx context.Context, in *athenapb.GetPatientOrderRequest, opts ...grpc.CallOption) (*athenapb.GetPatientOrderResponse, error) {
	if mock.GetPatientOrderHandler == nil {
		return nil, status.Error(codes.Unimplemented, "mock GetPatientOrder not defined")
	}
	return mock.GetPatientOrderHandler(ctx, in, opts...)
}

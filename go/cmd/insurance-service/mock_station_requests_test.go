package main

import (
	"context"

	insuranceplanpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance_plan"
	payergrouppb "github.com/*company-data-covered*/services/go/pkg/generated/proto/payer_group"
	statepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/state"
	"google.golang.org/grpc"
)

type MockPayerGroupServiceClient struct {
	ListPayerGroupsResult *payergrouppb.ListPayerGroupsResponse
	ListPayerGroupsErr    error
}

func (c *MockPayerGroupServiceClient) ListPayerGroups(ctx context.Context, in *payergrouppb.ListPayerGroupsRequest, opts ...grpc.CallOption) (*payergrouppb.ListPayerGroupsResponse, error) {
	return c.ListPayerGroupsResult, c.ListPayerGroupsErr
}

type MockStateServiceClient struct {
	ListStatesResult *statepb.ListStatesResponse
	ListStatesErr    error
}

func (c *MockStateServiceClient) ListStates(ctx context.Context, in *statepb.ListStatesRequest, opts ...grpc.CallOption) (*statepb.ListStatesResponse, error) {
	return c.ListStatesResult, c.ListStatesErr
}

type MockInsurancePlanServiceClient struct {
	CreateInsurancePlanResult                 *insuranceplanpb.CreateInsurancePlanResponse
	CreateInsurancePlanErr                    error
	UpdateInsurancePlanResult                 *insuranceplanpb.UpdateInsurancePlanResponse
	UpdateInsurancePlanErr                    error
	GetInsurancePlanResult                    *insuranceplanpb.GetInsurancePlanResponse
	GetInsurancePlanErr                       error
	UpsertInsurancePlanCreditCardPolicyResult *insuranceplanpb.UpsertInsurancePlanCreditCardPolicyResponse
	UpsertInsurancePlanCreditCardPolicyErr    error
	ListInsurancePlanCreditCardPolicyResult   *insuranceplanpb.ListInsurancePlanCreditCardPolicyResponse
	ListInsurancePlanCreditCardPolicyErr      error
}

func (c *MockInsurancePlanServiceClient) CreateInsurancePlan(ctx context.Context, in *insuranceplanpb.CreateInsurancePlanRequest, opts ...grpc.CallOption) (*insuranceplanpb.CreateInsurancePlanResponse, error) {
	return c.CreateInsurancePlanResult, c.CreateInsurancePlanErr
}

func (c *MockInsurancePlanServiceClient) UpdateInsurancePlan(ctx context.Context, in *insuranceplanpb.UpdateInsurancePlanRequest, opts ...grpc.CallOption) (*insuranceplanpb.UpdateInsurancePlanResponse, error) {
	return c.UpdateInsurancePlanResult, c.UpdateInsurancePlanErr
}

func (c *MockInsurancePlanServiceClient) GetInsurancePlan(ctx context.Context, in *insuranceplanpb.GetInsurancePlanRequest, opts ...grpc.CallOption) (*insuranceplanpb.GetInsurancePlanResponse, error) {
	return c.GetInsurancePlanResult, c.GetInsurancePlanErr
}

func (c *MockInsurancePlanServiceClient) UpsertInsurancePlanCreditCardPolicy(ctx context.Context, in *insuranceplanpb.UpsertInsurancePlanCreditCardPolicyRequest, opts ...grpc.CallOption) (*insuranceplanpb.UpsertInsurancePlanCreditCardPolicyResponse, error) {
	return c.UpsertInsurancePlanCreditCardPolicyResult, c.UpsertInsurancePlanCreditCardPolicyErr
}

func (c *MockInsurancePlanServiceClient) ListInsurancePlanCreditCardPolicy(ctx context.Context, in *insuranceplanpb.ListInsurancePlanCreditCardPolicyRequest, opts ...grpc.CallOption) (*insuranceplanpb.ListInsurancePlanCreditCardPolicyResponse, error) {
	return c.ListInsurancePlanCreditCardPolicyResult, c.ListInsurancePlanCreditCardPolicyErr
}

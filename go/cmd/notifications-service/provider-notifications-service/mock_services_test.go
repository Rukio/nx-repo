package providernotifications

import (
	"context"

	logisticspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/logistics"
	api "github.com/twilio/twilio-go/rest/api/v2010"
	"google.golang.org/grpc"
)

type MockLogisticsServiceClient struct {
	logisticspb.LogisticsServiceClient
	GetServiceRegionScheduleResult map[int64]*logisticspb.GetServiceRegionScheduleResponse
	GetServiceRegionScheduleErr    map[int64]error
}

func (c *MockLogisticsServiceClient) GetServiceRegionSchedule(ctx context.Context, in *logisticspb.GetServiceRegionScheduleRequest, opts ...grpc.CallOption) (*logisticspb.GetServiceRegionScheduleResponse, error) {
	marketID := in.GetMarketId()
	return c.GetServiceRegionScheduleResult[marketID], c.GetServiceRegionScheduleErr[marketID]
}

type MockTwilioClient struct {
	Response        *api.ApiV2010Message
	SendSMSErr      error
	SMSWasSentTimes int
}

func (c *MockTwilioClient) CreateMessage(phoneNumber string, message string) (*api.ApiV2010Message, error) {
	if c.SendSMSErr == nil {
		c.SMSWasSentTimes++
	}
	return &api.ApiV2010Message{}, c.SendSMSErr
}

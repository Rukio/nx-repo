package grpc

import (
	"context"
	"strconv"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	fsruntime "github.com/aws/aws-sdk-go-v2/service/sagemakerfeaturestoreruntime"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const (
	defaultPartnerScore = 0
)

func (s *Server) GetPartnerPriorityForCareRequest(
	ctx context.Context,
	req *partnerpb.GetPartnerPriorityForCareRequestRequest,
) (*partnerpb.GetPartnerPriorityForCareRequestResponse, error) {
	if req.ChannelItemId == 0 {
		return nil, status.Errorf(codes.InvalidArgument, "channel item id must be greater than 0")
	}

	partnerScore := int64(defaultPartnerScore)

	if s.FeatureStoreClient != nil {
		recordIdentifier := strconv.FormatInt(req.ChannelItemId, 10)
		featureNames := []string{s.FeatureName}

		featureValues, err := s.FeatureStoreClient.GetRecord(ctx, &fsruntime.GetRecordInput{
			FeatureGroupName:              &s.FeatureGroupName,
			FeatureNames:                  featureNames,
			RecordIdentifierValueAsString: &recordIdentifier,
		})
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error getting record from feature store %v", err)
		}

		if len(featureValues) == 0 {
			return nil, status.Errorf(codes.NotFound, "missing partner score for partner %v", req.ChannelItemId)
		}

		partnerScore, err = strconv.ParseInt(*featureValues[0].ValueAsString, 10, 64)
		if err != nil {
			return nil, status.Errorf(codes.Internal, "error converting value from feature store %v", err)
		}
	}

	return &partnerpb.GetPartnerPriorityForCareRequestResponse{
		PartnerScore: partnerScore,
	}, nil
}

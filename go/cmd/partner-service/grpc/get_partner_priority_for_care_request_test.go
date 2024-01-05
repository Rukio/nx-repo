package grpc

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/aws/featurestore"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	fsruntime "github.com/aws/aws-sdk-go-v2/service/sagemakerfeaturestoreruntime"
	fstypes "github.com/aws/aws-sdk-go-v2/service/sagemakerfeaturestoreruntime/types"
	"go.uber.org/zap"
)

func buildClientWithValue(value string) *featurestore.Client {
	featureValues := []fstypes.FeatureValue{
		{
			ValueAsString: &value,
		},
	}

	mockFeatureStore := &mockFeatureStore{
		GetRecordResp: &fsruntime.GetRecordOutput{
			Record: featureValues,
		},
	}

	featureStoreClient, _ := featurestore.NewClient(featurestore.ClientParams{
		FeatureStore: mockFeatureStore,
	})

	return featureStoreClient
}

func TestGetPartnerPriorityForCareRequest(t *testing.T) {
	ctx := context.Background()

	fakeID := time.Now().UnixNano()
	validRequest := &partnerpb.GetPartnerPriorityForCareRequestRequest{
		ChannelItemId: fakeID,
	}

	logger := zap.NewNop().Sugar()

	featureStoreClientWithError, _ := featurestore.NewClient(featurestore.ClientParams{
		FeatureStore: &mockFeatureStore{
			GetRecordErr: errors.New(""),
		},
	})

	featureStoreClientWithNoRecords, _ := featurestore.NewClient(featurestore.ClientParams{
		FeatureStore: &mockFeatureStore{
			GetRecordResp: &fsruntime.GetRecordOutput{
				Record: []fstypes.FeatureValue{},
			},
		},
	})

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.GetPartnerPriorityForCareRequestRequest

		wantErr      bool
		wantResponse *partnerpb.GetPartnerPriorityForCareRequestResponse
	}{
		{
			name: "valid request returns response",
			server: &Server{
				DBService: &mockDBService{},
				Logger:    logger,
			},
			request: validRequest,

			wantResponse: &partnerpb.GetPartnerPriorityForCareRequestResponse{
				PartnerScore: 0,
			},
		},
		{
			name: "returns value from record",
			server: &Server{
				DBService:          &mockDBService{},
				Logger:             logger,
				FeatureStoreClient: buildClientWithValue("25"),
			},
			request: validRequest,

			wantResponse: &partnerpb.GetPartnerPriorityForCareRequestResponse{
				PartnerScore: 25,
			},
		},
		{
			name: "error is returned if channel item id is invalid",
			server: &Server{
				DBService:          &mockDBService{},
				Logger:             logger,
				FeatureStoreClient: featureStoreClientWithError,
			},
			request: &partnerpb.GetPartnerPriorityForCareRequestRequest{},

			wantErr: true,
		},
		{
			name: "error is returned if GetRecord returns an error",
			server: &Server{
				DBService:          &mockDBService{},
				Logger:             logger,
				FeatureStoreClient: featureStoreClientWithError,
			},
			request: validRequest,

			wantErr: true,
		},
		{
			name: "error is returned if there is no record",
			server: &Server{
				DBService:          &mockDBService{},
				Logger:             logger,
				FeatureStoreClient: featureStoreClientWithNoRecords,
			},
			request: validRequest,

			wantErr: true,
		},
		{
			name: "error is score can't be converted to int",
			server: &Server{
				DBService:          &mockDBService{},
				Logger:             logger,
				FeatureStoreClient: buildClientWithValue("INVALID"),
			},
			request: validRequest,

			wantErr: true,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.GetPartnerPriorityForCareRequest(ctx, test.request)

			testutils.MustMatch(t, err != nil, test.wantErr)
			testutils.MustMatch(t, response, test.wantResponse)
		})
	}
}

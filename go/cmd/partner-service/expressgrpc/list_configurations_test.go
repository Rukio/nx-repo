package expressgrpc

import (
	"context"
	"testing"
	"time"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

func TestListConfigurations(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()
	partnerConfigurations := []*partnersql.SearchPartnerConfigurationsRow{
		{
			ID:          baseID,
			DisplayName: "ab-test",
		},
		{
			ID:             baseID + 1,
			DisplayName:    "bc-test",
			IsRedoxEnabled: true,
		},
		{
			ID:             baseID + 2,
			DisplayName:    "cd-test",
			IsRedoxEnabled: true,
		},
		{
			ID:          baseID + 3,
			DisplayName: "de-test",
		},
		{
			ID:          baseID + 4,
			DisplayName: "ef-test",
		},
	}
	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.ListConfigurationsRequest

		wantResponse *partnerpb.ListConfigurationsResponse
		wantErr      error
	}{
		{
			name: "successfully list partner configurations with default page number and size",
			server: &Server{
				DBService: &mockDBService{
					countPartnerConfigurationsResp:  int64(len(partnerConfigurations)),
					searchPartnerConfigurationsResp: partnerConfigurations,
				},
				Logger: logger,
			},
			request: &partnerpb.ListConfigurationsRequest{},

			wantResponse: &partnerpb.ListConfigurationsResponse{
				TotalPages:            1,
				PageNumber:            1,
				PartnerConfigurations: getProtoPartnerConfigurationsForTest(partnerConfigurations),
			},
		},
		{
			name: "successfully list partner configurations with custom page number and size",
			server: &Server{
				DBService: &mockDBService{
					countPartnerConfigurationsResp:  int64(len(partnerConfigurations)),
					searchPartnerConfigurationsResp: partnerConfigurations[2:4],
				},
				Logger: logger,
			},
			request: &partnerpb.ListConfigurationsRequest{
				PageNumber: proto.Int64(2),
				PageSize:   proto.Int64(2),
			},

			wantResponse: &partnerpb.ListConfigurationsResponse{
				TotalPages:            3,
				PageNumber:            2,
				PartnerConfigurations: getProtoPartnerConfigurationsForTest(partnerConfigurations[2:4]),
			},
		},
		{
			name: "successfully list partner configurations with name filter",
			server: &Server{
				DBService: &mockDBService{
					countPartnerConfigurationsResp:  int64(len(partnerConfigurations[1:3])),
					searchPartnerConfigurationsResp: partnerConfigurations[1:3],
				},
				Logger: logger,
			},
			request: &partnerpb.ListConfigurationsRequest{
				PageSize: proto.Int64(1),
				Name:     proto.String("c"),
			},

			wantResponse: &partnerpb.ListConfigurationsResponse{
				TotalPages:            2,
				PageNumber:            1,
				PartnerConfigurations: getProtoPartnerConfigurationsForTest(partnerConfigurations[1:3]),
			},
		},
		{
			name: "fails when invalid page number is provided",
			server: &Server{
				DBService: &mockDBService{},
				Logger:    logger,
			},
			request: &partnerpb.ListConfigurationsRequest{
				PageNumber: proto.Int64(0),
			},

			wantErr: status.Error(codes.InvalidArgument, "page number must be greater than 0"),
		},
		{
			name: "fails when invalid page size is provided",
			server: &Server{
				DBService: &mockDBService{},
				Logger:    logger,
			},
			request: &partnerpb.ListConfigurationsRequest{
				PageSize: proto.Int64(0),
			},

			wantErr: status.Error(codes.InvalidArgument, "page size must be greater than 0"),
		},
		{
			name: "fails when CountPartnerConfigurations returns an error",
			server: &Server{
				DBService: &mockDBService{
					countPartnerConfigurationsErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: &partnerpb.ListConfigurationsRequest{},

			wantErr: status.Errorf(codes.Internal, "CountPartnerConfigurations error: %v", pgx.ErrTxClosed),
		},
		{
			name: "fails when SearchPartnerConfigurations returns an error",
			server: &Server{
				DBService: &mockDBService{
					countPartnerConfigurationsResp: int64(len(partnerConfigurations)),
					searchPartnerConfigurationsErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: &partnerpb.ListConfigurationsRequest{},

			wantErr: status.Errorf(codes.Internal, "SearchPartnerConfigurations error: %v", pgx.ErrTxClosed),
		},
		{
			name: "successfully returns empty partner configurations list when no partner configurations are found",
			server: &Server{
				DBService: &mockDBService{},
				Logger:    logger,
			},
			request: &partnerpb.ListConfigurationsRequest{},

			wantResponse: &partnerpb.ListConfigurationsResponse{
				TotalPages:            0,
				PageNumber:            1,
				PartnerConfigurations: []*partnerpb.PartnerConfiguration{},
			},
		},
		{
			name: "successfully returns empty partner configurations list when the page number is greater than the total number of pages",
			server: &Server{
				DBService: &mockDBService{
					countPartnerConfigurationsResp: int64(len(partnerConfigurations)),
				},
				Logger: logger,
			},
			request: &partnerpb.ListConfigurationsRequest{
				PageNumber: proto.Int64(2),
			},

			wantResponse: &partnerpb.ListConfigurationsResponse{
				TotalPages:            1,
				PageNumber:            2,
				PartnerConfigurations: []*partnerpb.PartnerConfiguration{},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.ListConfigurations(ctx, test.request)

			testutils.MustMatch(t, test.wantResponse, response)
			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}

func getProtoPartnerConfigurationsForTest(testPartnerConfigurations []*partnersql.SearchPartnerConfigurationsRow) []*partnerpb.PartnerConfiguration {
	partnerConfigurationsResponse := make([]*partnerpb.PartnerConfiguration, len(testPartnerConfigurations))
	for i, partnerConfiguration := range testPartnerConfigurations {
		partnerConfigurationsResponse[i] = partnerdb.ProtoPartnerConfigurationFromSearchPartnerConfigurationsRow(partnerConfiguration)
	}
	return partnerConfigurationsResponse
}

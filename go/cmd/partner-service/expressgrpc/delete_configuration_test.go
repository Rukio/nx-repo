package expressgrpc

import (
	"context"
	"testing"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"google.golang.org/protobuf/proto"
)

func TestDeletePartnerConfiguration(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()

	notFoundError := status.Errorf(codes.NotFound, "Partner Configuration with id %d not found", baseID+1)
	miscError := status.Errorf(codes.Internal, "DeletePartnerConfiguration error: %v", pgx.ErrTxClosed)

	partnerConfig := partnersql.PartnerConfiguration{
		ID:          baseID,
		ExpressID:   sqltypes.ToValidNullString("test-id"),
		DisplayName: "test",
	}
	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.DeleteConfigurationRequest

		wantResponse *partnerpb.DeleteConfigurationResponse
		wantError    error
	}{
		{
			name: "should successfully delete an existing partner configuration",
			server: &Server{
				DBService: &mockDBService{
					deletePartnerConfigurationResp: partnerConfig,
				},
				Logger: logger,
			},
			request: &partnerpb.DeleteConfigurationRequest{
				Id: baseID,
			},

			wantResponse: &partnerpb.DeleteConfigurationResponse{
				PartnerConfiguration: &partnerpb.PartnerConfiguration{
					Id:                         &partnerConfig.ID,
					ExpressId:                  &partnerConfig.ExpressID.String,
					DisplayName:                partnerConfig.DisplayName,
					SsoEnabled:                 proto.Bool(false),
					RedoxEnabled:               proto.Bool(false),
					RiskStratBypassEnabled:     proto.Bool(false),
					ViewAllCareRequestsEnabled: proto.Bool(false),
				},
			},
		},
		{
			name: "error deleting a partner configuration that doesn't exist",
			server: &Server{
				DBService: &mockDBService{
					deletePartnerConfigurationErr: pgx.ErrNoRows,
				},
				Logger: logger,
			},
			request: &partnerpb.DeleteConfigurationRequest{
				Id: baseID + 1,
			},

			wantError: notFoundError,
		},
		{
			name: "error while deleting a partner configuration",
			server: &Server{
				DBService: &mockDBService{
					deletePartnerConfigurationErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: &partnerpb.DeleteConfigurationRequest{
				Id: baseID,
			},

			wantError: miscError,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.DeletePartnerConfiguration(ctx, test.request)

			testutils.MustMatch(t, test.wantError, err)
			testutils.MustMatchFn(".CreatedAt", ".UpdatedAt", ".DeletedAt")(t, test.wantResponse, response)
		})
	}
}

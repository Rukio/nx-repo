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
)

func TestDeleteMarket(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()

	partnerConfigMarketID := baseID
	validRequest := &partnerpb.DeleteMarketRequest{
		Id: partnerConfigMarketID,
	}
	deletedMarket := partnerdb.PartnerConfigurationMarket{
		PartnerConfigurationMarket: &partnersql.PartnerConfigurationMarket{
			ID:                     partnerConfigMarketID,
			PartnerConfigurationID: baseID + 2,
		},
		Market: &partnersql.Market{
			DisplayName:     "Market name",
			StationMarketID: baseID + 3,
		},
	}

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.DeleteMarketRequest

		want    *partnerpb.DeleteMarketResponse
		wantErr error
	}{
		{
			name: "successfully delete market",
			server: &Server{
				DBService: &mockDBService{
					deleteMarketResp: deletedMarket,
				},
				Logger: logger,
			},
			request: validRequest,

			want: &partnerpb.DeleteMarketResponse{
				Market: &partnerpb.Market{
					Id:                     &deletedMarket.PartnerConfigurationMarket.ID,
					PartnerConfigurationId: deletedMarket.PartnerConfigurationMarket.PartnerConfigurationID,
					StationMarketId:        deletedMarket.Market.StationMarketID,
					DisplayName:            deletedMarket.Market.DisplayName,
				},
			},
		},
		{
			name: "fails when DeleteMarket returns an error",
			server: &Server{
				DBService: &mockDBService{
					deleteMarketErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "DeleteMarket error: %v", pgx.ErrTxClosed),
		},
		{
			name: "fails when DeleteMarket returns no rows",
			server: &Server{
				DBService: &mockDBService{
					deleteMarketErr: pgx.ErrNoRows,
				},
			},
			request: validRequest,
			wantErr: status.Errorf(codes.NotFound, "Partner configuration market with id %d does not exist", partnerConfigMarketID),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.DeleteMarket(ctx, test.request)

			testutils.MustMatch(t, test.want, response)
			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}

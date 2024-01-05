package expressgrpc

import (
	"context"
	"testing"
	"time"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

func TestGetMarket(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()
	partnerConfigMarketID := baseID
	partnerConfigID := baseID + 1
	partnerConfigMarketWithServiceLines := []*partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDRow{
		{
			MarketID:                      partnerConfigMarketID,
			StationMarketID:               baseID + 1,
			PartnerConfigurationID:        partnerConfigID,
			MarketDisplayName:             "Market name",
			ServiceLineID:                 baseID + 2,
			ServiceLineShortName:          "acute_care",
			ServiceLineDisplayName:        "Acute Care",
			GenesysEmail:                  "foo@example.com",
			AllowBypassRiskStratification: true,
		},
	}
	validRequest := &partnerpb.GetMarketRequest{
		Id: partnerConfigMarketID,
	}

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.GetMarketRequest

		want    *partnerpb.GetMarketResponse
		wantErr error
	}{
		{
			name: "successfully get market",
			server: &Server{
				DBService: &mockDBService{
					getMarketsAndServiceLinesByIDOrPartnerConfigIDResp: partnerConfigMarketWithServiceLines,
				},
				Logger: logger,
			},
			request: validRequest,

			want: &partnerpb.GetMarketResponse{
				Market: &partnerpb.Market{
					Id:                     &partnerConfigMarketID,
					PartnerConfigurationId: partnerConfigID,
					StationMarketId:        baseID + 1,
					DisplayName:            "Market name",
					ServiceLines: []*partnerpb.ServiceLine{
						{
							Id:                            baseID + 2,
							ShortName:                     proto.String("acute_care"),
							DisplayName:                   proto.String("Acute Care"),
							GenesysEmail:                  proto.String("foo@example.com"),
							AllowBypassRiskStratification: proto.Bool(true),
						},
					},
				},
			},
		},
		{
			name: "fails when GetMarketsAndServiceLinesByIDOrPartnerConfigID returns an error",
			server: &Server{
				DBService: &mockDBService{
					getMarketsAndServiceLinesByIDOrPartnerConfigIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "GetMarketsAndServiceLinesByIDOrPartnerConfigID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "fails when partner configuration market is not found",
			server: &Server{
				DBService: &mockDBService{
					getMarketsAndServiceLinesByIDOrPartnerConfigIDResp: nil,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.NotFound, "Partner configuration market with id %d does not exist", validRequest.Id),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.GetMarket(ctx, test.request)

			testutils.MustMatch(t, test.want, response)
			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}

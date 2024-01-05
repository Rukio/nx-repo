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
)

func TestListMarkets(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()

	partnerConfigID := baseID + 2
	validRequest := &partnerpb.ListMarketsRequest{PartnerConfigurationId: partnerConfigID}
	marketsAndServiceLines := []*partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDRow{
		{
			MarketID:                      baseID,
			StationMarketID:               baseID + 1,
			MarketDisplayName:             "Test Market",
			PartnerConfigurationID:        partnerConfigID,
			ServiceLineID:                 baseID + 3,
			ServiceLineShortName:          "Test-Service-Line",
			ServiceLineDisplayName:        "Test Service Line",
			GenesysEmail:                  "test@t3st.com",
			AllowBypassRiskStratification: true,
		},
	}

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.ListMarketsRequest

		want    *partnerpb.ListMarketsResponse
		wantErr error
	}{
		{
			name: "successfully lists markets",
			server: &Server{
				DBService: &mockDBService{
					getMarketsAndServiceLinesByIDOrPartnerConfigIDResp: marketsAndServiceLines,
				},
				Logger: logger,
			},
			request: validRequest,

			want: &partnerpb.ListMarketsResponse{
				Markets: []*partnerpb.Market{
					{
						Id:                     &marketsAndServiceLines[0].MarketID,
						PartnerConfigurationId: partnerConfigID,
						StationMarketId:        marketsAndServiceLines[0].StationMarketID,
						DisplayName:            marketsAndServiceLines[0].MarketDisplayName,
						ServiceLines: []*partnerpb.ServiceLine{
							{
								Id:                            marketsAndServiceLines[0].ServiceLineID,
								ShortName:                     &marketsAndServiceLines[0].ServiceLineShortName,
								DisplayName:                   &marketsAndServiceLines[0].ServiceLineDisplayName,
								GenesysEmail:                  &marketsAndServiceLines[0].GenesysEmail,
								AllowBypassRiskStratification: &marketsAndServiceLines[0].AllowBypassRiskStratification,
							},
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
			name: "successfully returns empty market list when no markets are found",
			server: &Server{
				DBService: &mockDBService{
					getMarketsAndServiceLinesByIDOrPartnerConfigIDResp: []*partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDRow{},
				},
				Logger: logger,
			},
			request: validRequest,

			want: &partnerpb.ListMarketsResponse{
				Markets: []*partnerpb.Market{},
			},
		},
		{
			name: "successfully returns empty market list when GetMarketsAndServiceLinesByIDOrPartnerConfigID returns nil",
			server: &Server{
				DBService: &mockDBService{
					getMarketsAndServiceLinesByIDOrPartnerConfigIDResp: nil,
				},
				Logger: logger,
			},
			request: validRequest,

			want: &partnerpb.ListMarketsResponse{
				Markets: []*partnerpb.Market{},
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.ListMarkets(ctx, test.request)

			testutils.MustMatch(t, test.want, response)
			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}

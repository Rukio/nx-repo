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
)

func TestListServiceLines(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()

	serviceLine := &partnersql.ServiceLine{
		ID:          baseID,
		DisplayName: "Acute",
	}

	tests := []struct {
		name      string
		dBService DBService
		req       *partnerpb.ListServiceLinesRequest

		want    *partnerpb.ListServiceLinesResponse
		wantErr bool
	}{
		{
			name: "success",
			dBService: &mockDBService{
				getMarketByStationMarketIDResp: partnersql.Market{
					ID:          baseID,
					DisplayName: "Denver",
				},
				getServiceLinesByExpressIDAndMarketIDResp: []*partnersql.ServiceLine{
					serviceLine,
				},
			},
			req: &partnerpb.ListServiceLinesRequest{
				MarketId:  10,
				PartnerId: "20",
			},

			want: &partnerpb.ListServiceLinesResponse{
				ServiceLines: []*partnerpb.ServiceLine{
					partnerdb.ProtoServiceLineFromServiceLine(serviceLine),
				},
			},
			wantErr: false,
		},
		{
			name: "error, market not found",
			dBService: &mockDBService{
				getMarketByStationMarketIDErr: pgx.ErrNoRows,
			},
			req: &partnerpb.ListServiceLinesRequest{
				MarketId:  10,
				PartnerId: "20",
			},

			wantErr: true,
		},
		{
			name: "error, market query error",
			dBService: &mockDBService{
				getMarketByStationMarketIDErr: pgx.ErrTxClosed,
			},
			req: &partnerpb.ListServiceLinesRequest{
				MarketId:  10,
				PartnerId: "20",
			},

			wantErr: true,
		},
		{
			name: "error, get service lines query error",
			dBService: &mockDBService{
				getMarketByStationMarketIDResp: partnersql.Market{
					ID:          1,
					DisplayName: "Denver",
				},
				getServiceLinesByExpressIDAndMarketIDErr: pgx.ErrTxClosed,
			},
			req: &partnerpb.ListServiceLinesRequest{
				MarketId:  10,
				PartnerId: "20",
			},

			wantErr: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server, _ := NewServer(&ServerParams{
				DBService: test.dBService,
				Logger:    logger,
			})

			got, err := server.ListServiceLines(ctx, test.req)

			testutils.MustMatch(t, test.want, got)
			testutils.MustMatch(t, err != nil, test.wantErr)
		})
	}
}

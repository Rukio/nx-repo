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

func TestUpdateMarket(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()
	serviceLines := []*partnerpb.ServiceLine{{Id: baseID + 3}}
	validRequest := &partnerpb.UpdateMarketRequest{
		Id: baseID,
		Market: &partnerpb.Market{
			Id:                     &baseID,
			PartnerConfigurationId: baseID + 1,
			StationMarketId:        baseID + 2,
			DisplayName:            "Test Market",
			ServiceLines:           serviceLines,
		},
	}

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.UpdateMarketRequest

		want    *partnerpb.UpdateMarketResponse
		wantErr error
	}{
		{
			name: "successfully updates partner configuration market",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationMarketByIDResp: partnersql.PartnerConfigurationMarket{},
					updatePartnerConfigurationMarketServiceLinesResp: map[int64]*partnersql.ServiceLine{
						serviceLines[0].Id: {ID: serviceLines[0].Id},
					},
				},
				Logger: logger,
			},
			request: validRequest,

			want: &partnerpb.UpdateMarketResponse{
				Market: validRequest.Market,
			},
		},
		{
			name:    "return error when market is missing",
			server:  &Server{},
			request: &partnerpb.UpdateMarketRequest{},

			wantErr: status.Error(codes.InvalidArgument, "market is required"),
		},
		{
			name: "return error when partner configuration market is not found",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationMarketByIDErr: pgx.ErrNoRows,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.NotFound, "PartnerConfigurationMarket with id %d not found", validRequest.Id),
		},
		{
			name: "return error when GetPartnerConfigurationMarketByID returns an error",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationMarketByIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "GetPartnerConfigurationMarketByID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "return error when UpdatePartnerConfigurationMarketServiceLines returns an error",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationMarketByIDResp:           partnersql.PartnerConfigurationMarket{},
					updatePartnerConfigurationMarketServiceLinesErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "UpdatePartnerConfigurationMarketServiceLines error: %v", pgx.ErrTxClosed),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.UpdateMarket(ctx, test.request)

			testutils.MustMatch(t, test.want, response)
			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}

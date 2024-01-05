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

func TestCreateMarket(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()

	serviceLine := &partnersql.ServiceLine{
		ID:                            baseID,
		ShortName:                     "test-service-line",
		DisplayName:                   "Test Service Line",
		GenesysEmail:                  "test@tst.com",
		AllowBypassRiskStratification: true,
	}
	validRequest := &partnerpb.CreateMarketRequest{
		Market: &partnerpb.Market{
			PartnerConfigurationId: baseID,
			StationMarketId:        baseID,
			DisplayName:            "Test Market",
			ServiceLines: []*partnerpb.ServiceLine{
				{Id: serviceLine.ID},
			},
		},
	}
	market := partnersql.Market{
		ID:              baseID,
		DisplayName:     validRequest.Market.DisplayName,
		StationMarketID: validRequest.Market.StationMarketId,
	}
	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.CreateMarketRequest

		wantResponse *partnerpb.CreateMarketResponse
		wantErr      error
	}{
		{
			name: "successfully creates partner configuration market with missing market",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDResp: partnersql.GetPartnerConfigurationByIDRow{},
					getMarketByStationMarketIDErr:   pgx.ErrNoRows,
					addMarketResp:                   market,
					getPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDErr: pgx.ErrNoRows,
					createPartnerConfigMarketAndServiceLinesServiceLineResp: map[int64]*partnersql.ServiceLine{
						validRequest.Market.ServiceLines[0].Id: serviceLine,
					},
				},
				Logger: logger,
			},
			request: validRequest,

			wantResponse: &partnerpb.CreateMarketResponse{
				Market: &partnerpb.Market{
					Id:                     &market.ID,
					PartnerConfigurationId: validRequest.Market.PartnerConfigurationId,
					StationMarketId:        validRequest.Market.StationMarketId,
					DisplayName:            validRequest.Market.DisplayName,
					ServiceLines: []*partnerpb.ServiceLine{
						partnerdb.ProtoServiceLineFromServiceLine(serviceLine),
					},
				},
			},
		},
		{
			name: "successfully creates partner configuration market with existing market",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDResp:                                     partnersql.GetPartnerConfigurationByIDRow{},
					getMarketByStationMarketIDResp:                                      market,
					getPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDErr: pgx.ErrNoRows,
					createPartnerConfigMarketAndServiceLinesServiceLineResp: map[int64]*partnersql.ServiceLine{
						validRequest.Market.ServiceLines[0].Id: serviceLine,
					},
				},
				Logger: logger,
			},
			request: validRequest,

			wantResponse: &partnerpb.CreateMarketResponse{
				Market: &partnerpb.Market{
					Id:                     &market.ID,
					PartnerConfigurationId: validRequest.Market.PartnerConfigurationId,
					StationMarketId:        validRequest.Market.StationMarketId,
					DisplayName:            validRequest.Market.DisplayName,
					ServiceLines: []*partnerpb.ServiceLine{
						partnerdb.ProtoServiceLineFromServiceLine(serviceLine),
					},
				},
			},
		},
		{
			name: "fails when market is missing in request",
			server: &Server{
				Logger: logger,
			},
			request: &partnerpb.CreateMarketRequest{},

			wantErr: status.Error(codes.InvalidArgument, "Market is required"),
		},
		{
			name: "fails when PartnerConfigurationId does not exist",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDErr: pgx.ErrNoRows,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.NotFound, "PartnerConfiguration with id %d not found", validRequest.Market.PartnerConfigurationId),
		},
		{
			name: "fails when GetPartnerConfigurationByID returns an error",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "GetPartnerConfigurationByID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "fails when GetMarketByStationMarketID returns an error",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDResp: partnersql.GetPartnerConfigurationByIDRow{},
					getMarketByStationMarketIDErr:   pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "GetMarketByStationMarketID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "fails when AddMarket returns an error",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDResp: partnersql.GetPartnerConfigurationByIDRow{},
					getMarketByStationMarketIDErr:   pgx.ErrNoRows,
					addMarketErr:                    pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "AddMarket error: %v", pgx.ErrTxClosed),
		},
		{
			name: "fails when partner configuration market already exists",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDResp:                                      partnersql.GetPartnerConfigurationByIDRow{},
					getMarketByStationMarketIDResp:                                       market,
					getPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDResp: partnersql.PartnerConfigurationMarket{},
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.AlreadyExists, "PartnerConfigurationMarket with PartnerConfigurationID %d and MarketID %d already exists", validRequest.Market.PartnerConfigurationId, market.ID),
		},
		{
			name: "fails when GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketID returns an error",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDResp:                                     partnersql.GetPartnerConfigurationByIDRow{},
					getMarketByStationMarketIDResp:                                      market,
					getPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "fails when CreatePartnerConfigurationMarketAndServiceLines returns an error",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDResp:                                     partnersql.GetPartnerConfigurationByIDRow{},
					getMarketByStationMarketIDResp:                                      market,
					getPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDErr: pgx.ErrNoRows,
					createPartnerConfigMarketAndServiceLinesErr:                         pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,

			wantErr: status.Errorf(codes.Internal, "CreatePartnerConfigurationMarketAndServiceLines error: %v", pgx.ErrTxClosed),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.CreateMarket(ctx, test.request)

			testutils.MustMatch(t, test.wantResponse, response)
			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}

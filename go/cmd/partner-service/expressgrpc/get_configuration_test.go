package expressgrpc

import (
	"context"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
	"google.golang.org/protobuf/proto"
)

func TestGetConfiguration(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()

	expressID := "963c2c41-1501-41b1-b40d-0a5429d98944"
	displayName := "Test Config"
	getConfigurationRequestWithID := &partnerpb.GetConfigurationRequest{
		PartnerConfigurationId: "1",
	}

	getConfigurationRequestWithExpressID := &partnerpb.GetConfigurationRequest{
		PartnerConfigurationId: "a-b-c-d",
	}

	partnerConfigurationResp := partnersql.GetPartnerConfigurationByIDRow{
		ID:                           baseID,
		ExpressID:                    sqltypes.ToValidNullString(expressID),
		DisplayName:                  displayName,
		IsSsoEnabled:                 true,
		IsRedoxEnabled:               true,
		IsRiskStratBypassEnabled:     true,
		IsViewAllCareRequestsEnabled: true,
	}

	markets := []*partnerpb.Market{
		{
			Id:                     &baseID,
			PartnerConfigurationId: baseID,
			StationMarketId:        baseID + 1,
			DisplayName:            "Test Market",
			ServiceLines: []*partnerpb.ServiceLine{
				{
					Id:                            baseID + 2,
					ShortName:                     proto.String("Test Service Line"),
					DisplayName:                   proto.String("Test Service Line"),
					GenesysEmail:                  proto.String(""),
					AllowBypassRiskStratification: proto.Bool(false),
				},
			},
		},
	}

	marketsResp := []*partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDRow{
		{
			MarketID:               baseID,
			StationMarketID:        baseID + 1,
			PartnerConfigurationID: baseID,
			MarketDisplayName:      "Test Market",
			ServiceLineID:          baseID + 2,
			ServiceLineShortName:   "Test Service Line",
			ServiceLineDisplayName: "Test Service Line",
		},
	}

	popHealthChannelItemsResp := []int64{baseID + 3}

	emailDomainsResp := []*partnersql.EmailDomain{
		{DomainDescription: "test@t3st.com"},
	}

	sourcesResp := []*partnersql.GetPartnerConfigurationSourcesByPartnerConfigurationIDRow{
		{
			ID:                        baseID + 4,
			PartnerID:                 baseID + 5,
			PartnerConfigurationID:    baseID,
			CallbackNumberCountryCode: sqltypes.ToValidNullInt32(1),
			CallbackNumber:            "1234567890",
			DefaultCallbackOptionSlug: "patient",
			AddressLineOne:            sqltypes.ToValidNullString("Main St 1"),
			City:                      sqltypes.ToValidNullString("Denver"),
			StateCode:                 sqltypes.ToValidNullString("CO"),
			ZipCode:                   sqltypes.ToValidNullString("80211"),
		},
	}

	sources := []*partnerpb.Source{
		{
			Id:                     &sourcesResp[0].ID,
			PartnerId:              sourcesResp[0].PartnerID,
			PartnerConfigurationId: sourcesResp[0].PartnerConfigurationID,
			CallbackNumber: &common.PhoneNumber{
				CountryCode: sqltypes.ToProtoInt32(sourcesResp[0].CallbackNumberCountryCode),
				PhoneNumber: &sourcesResp[0].CallbackNumber,
			},
			DefaultVisitAddress: &common.Address{
				AddressLineOne: sqltypes.ToProtoString(sourcesResp[0].AddressLineOne),
				City:           sqltypes.ToProtoString(sourcesResp[0].City),
				State:          sqltypes.ToProtoString(sourcesResp[0].StateCode),
				ZipCode:        sqltypes.ToProtoString(sourcesResp[0].ZipCode),
			},
			DefaultCallbackOption: partnerpb.CallbackOption_CALLBACK_OPTION_PATIENT,
		},
	}

	partnerConfigurationProto := &partnerpb.PartnerConfiguration{
		ExpressId:                  &expressID,
		DisplayName:                displayName,
		SsoEnabled:                 &partnerConfigurationResp.IsSsoEnabled,
		RedoxEnabled:               &partnerConfigurationResp.IsRedoxEnabled,
		RiskStratBypassEnabled:     &partnerConfigurationResp.IsRiskStratBypassEnabled,
		ViewAllCareRequestsEnabled: &partnerConfigurationResp.IsViewAllCareRequestsEnabled,
		AcceptedDomains:            []string{emailDomainsResp[0].DomainDescription},
		PophealthChannelItemIds:    popHealthChannelItemsResp,
		Markets:                    markets,
		Sources:                    sources,
	}

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.GetConfigurationRequest

		wantResponse *partnerpb.GetConfigurationResponse
		wantErr      error
	}{
		{
			name: "get partner configuration using partner service id",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDResp:                            partnerConfigurationResp,
					getEmailDomainsByPartnerConfigurationIDResp:                emailDomainsResp,
					getMarketsAndServiceLinesByIDOrPartnerConfigIDResp:         marketsResp,
					getPophealthChannelItemsByPartnerConfigurationIDResp:       popHealthChannelItemsResp,
					getPartnerConfigurationSourcesByPartnerConfigurationIDResp: sourcesResp,
				},
				Logger: logger,
			},
			request: getConfigurationRequestWithID,

			wantResponse: &partnerpb.GetConfigurationResponse{
				PartnerConfiguration: partnerConfigurationProto,
			},
		},
		{
			name: "get partner service using express id",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDResp: partnerConfigurationResp,
					getPartnerConfigurationByExpressIDResp: partnersql.PartnerConfiguration{
						ID:        baseID,
						ExpressID: sqltypes.ToValidNullString(expressID),
					},
					getEmailDomainsByPartnerConfigurationIDResp:                emailDomainsResp,
					getMarketsAndServiceLinesByIDOrPartnerConfigIDResp:         marketsResp,
					getPophealthChannelItemsByPartnerConfigurationIDResp:       popHealthChannelItemsResp,
					getPartnerConfigurationSourcesByPartnerConfigurationIDResp: sourcesResp,
				},
				Logger: logger,
			},
			request: getConfigurationRequestWithExpressID,

			wantResponse: &partnerpb.GetConfigurationResponse{
				PartnerConfiguration: partnerConfigurationProto,
			},
		},
		{
			name: "partner configuration id is empty string",
			server: &Server{
				Logger: logger,
			},
			request: &partnerpb.GetConfigurationRequest{},

			wantErr: status.Error(codes.InvalidArgument, "PartnerConfiguration ID is required"),
		},
		{
			name: "GetPartnerConfigurationByExpressID returns not found",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByExpressIDErr: pgx.ErrNoRows,
				},
				Logger: logger,
			},
			request: getConfigurationRequestWithExpressID,

			wantErr: status.Errorf(codes.NotFound, "GetPartnerConfigurationByExpressID error: configuration with Express ID %v was not found", getConfigurationRequestWithExpressID.PartnerConfigurationId),
		},
		{
			name: "GetPartnerConfigurationByExpressID fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByExpressIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: getConfigurationRequestWithExpressID,

			wantErr: status.Errorf(codes.Internal, "GetPartnerConfigurationByExpressID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "GetPartnerConfigurationByID returns not found",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDErr: pgx.ErrNoRows,
				},
				Logger: logger,
			},
			request: getConfigurationRequestWithID,

			wantErr: status.Errorf(codes.NotFound, "GetPartnerConfigurationByID error: configuration with ID %v was not found", getConfigurationRequestWithID.PartnerConfigurationId),
		},
		{
			name: "GetPartnerConfigurationByID fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: getConfigurationRequestWithID,

			wantErr: status.Errorf(codes.Internal, "GetPartnerConfigurationByID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "GetMarketsAndServiceLinesByIDOrPartnerConfigID fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDResp:                   partnersql.GetPartnerConfigurationByIDRow{ID: baseID},
					getMarketsAndServiceLinesByIDOrPartnerConfigIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: getConfigurationRequestWithID,

			wantErr: status.Errorf(codes.Internal, "GetMarketsAndServiceLinesByIDOrPartnerConfigID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "GetEmailDomainsByPartnerConfigurationID fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDResp:            partnerConfigurationResp,
					getEmailDomainsByPartnerConfigurationIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: getConfigurationRequestWithID,

			wantErr: status.Errorf(codes.Internal, "GetEmailDomainsByPartnerConfigurationID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "GetPophealthChannelItemsByPartnerConfigurationID fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDResp:                     partnerConfigurationResp,
					getPophealthChannelItemsByPartnerConfigurationIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: getConfigurationRequestWithID,

			wantErr: status.Errorf(codes.Internal, "GetPophealthChannelItemsByPartnerConfigurationID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "GetPartnerConfigurationSourcesByPartnerConfigurationID fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByIDResp:                           partnerConfigurationResp,
					getPartnerConfigurationSourcesByPartnerConfigurationIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: getConfigurationRequestWithID,

			wantErr: status.Errorf(codes.Internal, "GetPartnerConfigurationSourcesByPartnerConfigurationID error: %v", pgx.ErrTxClosed),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.GetConfiguration(ctx, test.request)

			testutils.MustMatchFn(".Id", ".CreatedAt", ".UpdatedAt")(
				t,
				test.wantResponse,
				response,
				"Unexpected response",
			)
			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}

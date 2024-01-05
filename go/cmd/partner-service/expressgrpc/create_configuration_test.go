package expressgrpc

import (
	"context"
	"strconv"
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
)

func TestCreateConfiguration(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()
	expressID := strconv.FormatInt(baseID, 10)
	insertConfigurationRequest := &partnerpb.CreateConfigurationRequest{
		PartnerConfiguration: &partnerpb.PartnerConfiguration{},
	}
	insertConfigurationRequestWithExpressID := &partnerpb.CreateConfigurationRequest{
		PartnerConfiguration: &partnerpb.PartnerConfiguration{ExpressId: &expressID},
	}
	upsertConfigurationResponse := partnersql.GetPartnerConfigurationByIDRow{
		ID:          baseID,
		DisplayName: "test",
		PhoneNumber: sqltypes.ToValidNullString("1234567890"),
	}
	upsertConfigurationResponseWithExpressID := partnersql.GetPartnerConfigurationByIDRow{
		ID:          baseID + 1,
		ExpressID:   sqltypes.ToValidNullString("abc123"),
		DisplayName: "test1",
		PhoneNumber: sqltypes.ToValidNullString("1234567891"),
	}

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.CreateConfigurationRequest

		wantResponse *partnerpb.CreateConfigurationResponse
		wantErr      error
	}{
		{
			name: "successfully insert new partner configuration",
			server: &Server{
				DBService: &mockDBService{
					upsertPartnerConfigurationResp: upsertConfigurationResponse,
				},
				Logger: logger,
			},
			request: insertConfigurationRequest,

			wantResponse: &partnerpb.CreateConfigurationResponse{
				PartnerConfiguration: &partnerpb.PartnerConfiguration{
					Id:          &upsertConfigurationResponse.ID,
					DisplayName: upsertConfigurationResponse.DisplayName,
					PhoneNumber: &common.PhoneNumber{
						PhoneNumber: sqltypes.ToProtoString(upsertConfigurationResponse.PhoneNumber),
					},
					SsoEnabled:                 &upsertConfigurationResponse.IsSsoEnabled,
					RedoxEnabled:               &upsertConfigurationResponse.IsRedoxEnabled,
					RiskStratBypassEnabled:     &upsertConfigurationResponse.IsRiskStratBypassEnabled,
					ViewAllCareRequestsEnabled: &upsertConfigurationResponse.IsViewAllCareRequestsEnabled,
					AcceptedDomains:            []string{},
					Markets:                    []*partnerpb.Market{},
					Sources:                    []*partnerpb.Source{},
				},
			},
		},
		{
			name: "successfully insert new partner configuration with express id",
			server: &Server{
				DBService: &mockDBService{
					upsertPartnerConfigurationResp:        upsertConfigurationResponseWithExpressID,
					getPartnerConfigurationByExpressIDErr: pgx.ErrNoRows,
				},
				Logger: logger,
			},
			request: insertConfigurationRequestWithExpressID,

			wantResponse: &partnerpb.CreateConfigurationResponse{
				PartnerConfiguration: &partnerpb.PartnerConfiguration{
					Id:          &upsertConfigurationResponseWithExpressID.ID,
					ExpressId:   sqltypes.ToProtoString(upsertConfigurationResponseWithExpressID.ExpressID),
					DisplayName: upsertConfigurationResponseWithExpressID.DisplayName,
					PhoneNumber: &common.PhoneNumber{
						PhoneNumber: sqltypes.ToProtoString(upsertConfigurationResponseWithExpressID.PhoneNumber),
					},
					SsoEnabled:                 &upsertConfigurationResponseWithExpressID.IsSsoEnabled,
					RedoxEnabled:               &upsertConfigurationResponseWithExpressID.IsRedoxEnabled,
					RiskStratBypassEnabled:     &upsertConfigurationResponseWithExpressID.IsRiskStratBypassEnabled,
					ViewAllCareRequestsEnabled: &upsertConfigurationResponseWithExpressID.IsViewAllCareRequestsEnabled,
					AcceptedDomains:            []string{},
					Markets:                    []*partnerpb.Market{},
					Sources:                    []*partnerpb.Source{},
				},
			},
		},
		{
			name: "fails when partner configuration is missing",
			server: &Server{
				Logger: logger,
			},
			request: &partnerpb.CreateConfigurationRequest{},

			wantErr: status.Error(codes.InvalidArgument, "PartnerConfiguration is required"),
		},
		{
			name: "fails when partner configuration id is not nil",
			server: &Server{
				Logger: logger,
			},
			request: &partnerpb.CreateConfigurationRequest{
				PartnerConfiguration: &partnerpb.PartnerConfiguration{Id: &baseID},
			},

			wantErr: status.Error(codes.InvalidArgument, "PartnerConfiguration ID must be nil"),
		},
		{
			name: "fails when express id is duplicated",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByExpressIDResp: partnersql.PartnerConfiguration{},
				},
				Logger: logger,
			},
			request: insertConfigurationRequestWithExpressID,

			wantErr: status.Errorf(codes.InvalidArgument, "PartnerConfiguration with ExpressID %v already exists", *insertConfigurationRequestWithExpressID.PartnerConfiguration.ExpressId),
		},
		{
			name: "fails when GetPartnerConfigurationByExpressID return an error",
			server: &Server{
				DBService: &mockDBService{
					getPartnerConfigurationByExpressIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: insertConfigurationRequestWithExpressID,

			wantErr: status.Errorf(codes.Internal, "GetPartnerConfigurationByExpressID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "fails when UpsertPartnerConfiguration returns an error",
			server: &Server{
				DBService: &mockDBService{
					upsertPartnerConfigurationErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: insertConfigurationRequest,

			wantErr: status.Errorf(codes.Internal, "UpsertPartnerConfiguration error: %v", pgx.ErrTxClosed),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.CreateConfiguration(ctx, test.request)

			testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, test.wantResponse, response)
			testutils.MustMatch(t, test.wantErr, err)
		})
	}
}

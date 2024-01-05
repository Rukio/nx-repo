package grpc

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
	"google.golang.org/protobuf/types/known/timestamppb"
)

func TestUpsertPartner(t *testing.T) {
	context := context.Background()
	validRequest := &partnerpb.UpsertPartnerRequest{
		Partner: &partnerpb.Partner{
			StationIdentifiers: &partnerpb.StationIdentifiers{},
			PartnerCategory:    partnerpb.PartnerCategory_PARTNER_CATEGORY_UNSPECIFIED,
			Location: &partnerpb.Location{
				Address: &common.Address{
					AddressLineOne: proto.String("123 Main St"),
				},
				GeoLocation: &common.Location{
					LatitudeE6:  int32(12300),
					LongitudeE6: int32(45600),
				},
			},
			PhoneNumber: &common.PhoneNumber{
				PhoneNumber: proto.String("1234567890"),
			},
		},
	}
	validRequestWithPackageIDs := &partnerpb.UpsertPartnerRequest{
		Partner: &partnerpb.Partner{
			StationIdentifiers: &partnerpb.StationIdentifiers{},
			PartnerCategory:    partnerpb.PartnerCategory_PARTNER_CATEGORY_UNSPECIFIED,
			InsurancePackages: []*partnerpb.InsurancePackage{
				{PackageId: 2},
				{PackageId: 4},
			},
		},
	}
	validRequestWithEmrIDs := &partnerpb.UpsertPartnerRequest{
		Partner: &partnerpb.Partner{
			StationIdentifiers: &partnerpb.StationIdentifiers{},
			PartnerCategory:    partnerpb.PartnerCategory_PARTNER_CATEGORY_UNSPECIFIED,
			EmrProviders: []*partnerpb.EmrProvider{
				{EmrProviderId: 2},
				{EmrProviderId: 4},
			},
		},
	}
	nilAddressRequest := &partnerpb.UpsertPartnerRequest{
		Partner: &partnerpb.Partner{
			StationIdentifiers: &partnerpb.StationIdentifiers{},
			PartnerCategory:    partnerpb.PartnerCategory_PARTNER_CATEGORY_UNSPECIFIED,
			Location: &partnerpb.Location{
				GeoLocation: &common.Location{},
			},
		},
	}
	nilGeoLocationRequest := &partnerpb.UpsertPartnerRequest{
		Partner: &partnerpb.Partner{
			StationIdentifiers: &partnerpb.StationIdentifiers{},
			PartnerCategory:    partnerpb.PartnerCategory_PARTNER_CATEGORY_UNSPECIFIED,
			Location: &partnerpb.Location{
				Address: &common.Address{},
			},
		},
	}
	deactivatedRequest := &partnerpb.UpsertPartnerRequest{
		Partner: &partnerpb.Partner{
			StationIdentifiers: &partnerpb.StationIdentifiers{},
			PartnerCategory:    partnerpb.PartnerCategory_PARTNER_CATEGORY_UNSPECIFIED,
			DeactivatedAt: &timestamppb.Timestamp{
				Seconds: timestamppb.Now().Seconds,
			},
		},
	}
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.UpsertPartnerRequest

		wantResponse *partnerpb.UpsertPartnerResponse
		wantErr      error
	}{
		{
			name: "valid request for new partner returns response with partner id",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDErr: pgx.ErrNoRows,
					addPartnerResp:                      partnersql.Partner{ID: baseID + 1},
					addLocationResp:                     sqltypes.ToValidNullInt64(baseID + 1),
				},
				Logger: logger,
			},
			request:      validRequest,
			wantResponse: &partnerpb.UpsertPartnerResponse{PartnerId: baseID + 1},
		},
		{
			name: "valid request for existing partner returns response with partner id",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDResp: partnersql.Partner{
						ID:         baseID + 2,
						LocationID: sqltypes.ToValidNullInt64(baseID + 2),
					},
				},
				Logger: logger,
			},
			request:      validRequest,
			wantResponse: &partnerpb.UpsertPartnerResponse{PartnerId: baseID + 2},
		},
		{
			name: "valid request with nil address",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDResp: partnersql.Partner{
						ID:         baseID + 3,
						LocationID: sqltypes.ToValidNullInt64(baseID + 3),
					},
				},
				Logger: logger,
			},
			request:      nilAddressRequest,
			wantResponse: &partnerpb.UpsertPartnerResponse{PartnerId: baseID + 3},
		},
		{
			name: "valid request with nil geo location",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDResp: partnersql.Partner{
						ID:         baseID + 4,
						LocationID: sqltypes.ToValidNullInt64(baseID + 4),
					},
				},
				Logger: logger,
			},
			request:      nilGeoLocationRequest,
			wantResponse: &partnerpb.UpsertPartnerResponse{PartnerId: baseID + 4},
		},
		{
			name: "valid request with deactivated at",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDResp: partnersql.Partner{ID: baseID + 5},
				},
				Logger: logger,
			},
			request:      deactivatedRequest,
			wantResponse: &partnerpb.UpsertPartnerResponse{PartnerId: baseID + 5},
		},
		{
			name: "valid request with package ids",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDResp: partnersql.Partner{ID: baseID + 7},
				},
				Logger: logger,
			},
			request:      validRequestWithPackageIDs,
			wantResponse: &partnerpb.UpsertPartnerResponse{PartnerId: baseID + 7},
		},
		{
			name: "valid request with emr provider ids",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDResp: partnersql.Partner{ID: baseID + 8},
				},
				Logger: logger,
			},
			request:      validRequestWithEmrIDs,
			wantResponse: &partnerpb.UpsertPartnerResponse{PartnerId: baseID + 8},
		},
		{
			name: "partner is invalid",
			server: &Server{
				DBService: &mockDBService{},
			},
			request: &partnerpb.UpsertPartnerRequest{},
			wantErr: status.Error(codes.InvalidArgument, "Partner is required"),
		},
		{
			name: "error is returned if call to add location fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDErr: pgx.ErrNoRows,
					addLocationErr:                      pgx.ErrTxClosed,
				},
			},
			request: validRequest,
			wantErr: status.Errorf(codes.Internal, "AddLocation error: %v", pgx.ErrTxClosed),
		},
		{
			name: "category is invalid",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDErr: pgx.ErrNoRows,
					addLocationResp:                     sqltypes.ToValidNullInt64(baseID + 1),
				},
			},
			request: &partnerpb.UpsertPartnerRequest{
				Partner: &partnerpb.Partner{
					StationIdentifiers: &partnerpb.StationIdentifiers{},
					PartnerCategory:    99,
				},
			},
			wantErr: status.Errorf(codes.InvalidArgument, "PartnerCategoryShortName could not be found: %v", 99),
		},
		{
			name: "error is returned if call to find partner fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,
			wantErr: status.Errorf(codes.Internal, "GetPartnerByStationChannelItemID error: %v", pgx.ErrTxClosed),
		},
		{
			name: "error is returned if call to create partner fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDErr: pgx.ErrNoRows,
					addLocationResp:                     sqltypes.ToValidNullInt64(baseID + 1),
					addPartnerErr:                       pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,
			wantErr: status.Errorf(codes.Internal, "AddPartner error: %v", pgx.ErrTxClosed),
		},
		{
			name: "error is returned if call to update partner fails",
			server: &Server{
				DBService: &mockDBService{
					updatePartnerErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: validRequest,
			wantErr: status.Errorf(codes.Internal, "UpdatePartner error: %v", pgx.ErrTxClosed),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			gotResponse, gotErr := test.server.UpsertPartner(context, test.request)

			testutils.MustMatch(t, test.wantResponse, gotResponse)
			testutils.MustMatch(t, test.wantErr, gotErr)
		})
	}
}

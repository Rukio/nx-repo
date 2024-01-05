package expressgrpc

import (
	"context"
	"testing"
	"time"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
)

func TestSearchPartners(t *testing.T) {
	context := context.Background()
	logger := zap.NewNop().Sugar()
	currentTime := time.Now()
	zeroMaxResultCount := int32(0)
	customMaxResultCount := int32(15)
	partnerID1 := int64(1)
	partnerID2 := int64(2)
	partners := []*partnersql.SearchPartnersByNameRow{
		{
			ID:                       partnerID1,
			StationChannelItemID:     2,
			StationChannelID:         sqltypes.ToValidNullInt64(3),
			DisplayName:              "Test Name",
			PhoneCountryCode:         sqltypes.ToValidNullInt32(1),
			PhoneNumber:              sqltypes.ToValidNullString("3037234584"),
			PhoneExtension:           sqltypes.ToValidNullString("12"),
			Email:                    sqltypes.ToValidNullString("test@test.com"),
			AddressLineOne:           sqltypes.ToValidNullString("Address 1"),
			AddressLineTwo:           sqltypes.ToValidNullString("Address 2"),
			City:                     sqltypes.ToValidNullString("Denver"),
			StateCode:                sqltypes.ToValidNullString("COL"),
			ZipCode:                  sqltypes.ToValidNullString("12345"),
			LatitudeE6:               sqltypes.ToValidNullInt32(1000000),
			LongitudeE6:              sqltypes.ToValidNullInt32(2000000),
			UpdatedAt:                currentTime,
			CreatedAt:                currentTime,
			PartnerCategoryShortName: sqltypes.ToValidNullString("health_system"),
		},
		{
			ID:                       partnerID2,
			StationChannelItemID:     3,
			StationChannelID:         sqltypes.ToValidNullInt64(4),
			DisplayName:              "Test Name 2",
			PhoneCountryCode:         sqltypes.ToValidNullInt32(1),
			PhoneNumber:              sqltypes.ToValidNullString("3037234111"),
			PhoneExtension:           sqltypes.ToValidNullString("13"),
			Email:                    sqltypes.ToValidNullString("test1@test.com"),
			AddressLineOne:           sqltypes.ToValidNullString("Address 3"),
			AddressLineTwo:           sqltypes.ToValidNullString("Address 4"),
			City:                     sqltypes.ToValidNullString("Denver"),
			StateCode:                sqltypes.ToValidNullString("COL"),
			ZipCode:                  sqltypes.ToValidNullString("45678"),
			LatitudeE6:               sqltypes.ToValidNullInt32(3000000),
			LongitudeE6:              sqltypes.ToValidNullInt32(4000000),
			UpdatedAt:                currentTime,
			CreatedAt:                currentTime,
			PartnerCategoryShortName: sqltypes.ToValidNullString("injury_finance"),
		},
	}
	protoPartners := []*partnerpb.Partner{
		{
			Id:              &partnerID1,
			Name:            partners[0].DisplayName,
			PartnerCategory: partnerdb.ShortNameToPartnerCategoryEnum[partners[0].PartnerCategoryShortName.String],
			PhoneNumber: &commonpb.PhoneNumber{
				CountryCode: sqltypes.ToProtoInt32(partners[0].PhoneCountryCode),
				PhoneNumber: sqltypes.ToProtoString(partners[0].PhoneNumber),
				Extension:   sqltypes.ToProtoString(partners[0].PhoneExtension),
			},
			Email: sqltypes.ToProtoString(partners[0].Email),
			Location: &partnerpb.Location{
				Address: &commonpb.Address{
					AddressLineOne: sqltypes.ToProtoString(partners[0].AddressLineOne),
					AddressLineTwo: sqltypes.ToProtoString(partners[0].AddressLineTwo),
					City:           sqltypes.ToProtoString(partners[0].City),
					State:          sqltypes.ToProtoString(partners[0].StateCode),
					ZipCode:        sqltypes.ToProtoString(partners[0].ZipCode),
				},
				GeoLocation: &commonpb.Location{
					LatitudeE6:  partners[0].LatitudeE6.Int32,
					LongitudeE6: partners[0].LongitudeE6.Int32,
				},
			},
			StationIdentifiers: &partnerpb.StationIdentifiers{
				ChannelItemId: partners[0].StationChannelItemID,
				ChannelId:     sqltypes.ToProtoInt64(partners[0].StationChannelID),
			},
			DeactivatedAt: sqltypes.ToProtoTimestamp(partners[0].DeactivatedAt),
			CreatedAt:     sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partners[0].CreatedAt)),
			UpdatedAt:     sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partners[0].UpdatedAt)),
		},
		{
			Id:              &partnerID2,
			Name:            partners[1].DisplayName,
			PartnerCategory: partnerdb.ShortNameToPartnerCategoryEnum[partners[1].PartnerCategoryShortName.String],
			PhoneNumber: &commonpb.PhoneNumber{
				CountryCode: sqltypes.ToProtoInt32(partners[1].PhoneCountryCode),
				PhoneNumber: sqltypes.ToProtoString(partners[1].PhoneNumber),
				Extension:   sqltypes.ToProtoString(partners[1].PhoneExtension),
			},
			Email: sqltypes.ToProtoString(partners[1].Email),
			Location: &partnerpb.Location{
				Address: &commonpb.Address{
					AddressLineOne: sqltypes.ToProtoString(partners[1].AddressLineOne),
					AddressLineTwo: sqltypes.ToProtoString(partners[1].AddressLineTwo),
					City:           sqltypes.ToProtoString(partners[1].City),
					State:          sqltypes.ToProtoString(partners[1].StateCode),
					ZipCode:        sqltypes.ToProtoString(partners[1].ZipCode),
				},
				GeoLocation: &commonpb.Location{
					LatitudeE6:  partners[1].LatitudeE6.Int32,
					LongitudeE6: partners[1].LongitudeE6.Int32,
				},
			},
			StationIdentifiers: &partnerpb.StationIdentifiers{
				ChannelItemId: partners[1].StationChannelItemID,
				ChannelId:     sqltypes.ToProtoInt64(partners[1].StationChannelID),
			},
			DeactivatedAt: sqltypes.ToProtoTimestamp(partners[1].DeactivatedAt),
			CreatedAt:     sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partners[1].CreatedAt)),
			UpdatedAt:     sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partners[1].UpdatedAt)),
		},
	}

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.ExpressServiceSearchPartnersRequest

		expectedResponse *partnerpb.ExpressServiceSearchPartnersResponse
		hasError         bool
	}{
		{
			name: "successful response with nil max result count",
			server: &Server{
				DBService: &mockDBService{
					searchPartnersByNameResp: partners,
				},
				Logger: logger,
			},
			request: &partnerpb.ExpressServiceSearchPartnersRequest{
				Name: "tes",
			},

			expectedResponse: &partnerpb.ExpressServiceSearchPartnersResponse{
				Partners: protoPartners,
			},
		},
		{
			name: "successful response with 0 max result count",
			server: &Server{
				DBService: &mockDBService{
					searchPartnersByNameResp: partners,
				},
				Logger: logger,
			},
			request: &partnerpb.ExpressServiceSearchPartnersRequest{
				Name:           "tes",
				MaxResultCount: &zeroMaxResultCount,
			},

			expectedResponse: &partnerpb.ExpressServiceSearchPartnersResponse{
				Partners: protoPartners,
			},
		},
		{
			name: "successful response with valid max result count",
			server: &Server{
				DBService: &mockDBService{
					searchPartnersByNameResp: partners,
				},
				Logger: logger,
			},
			request: &partnerpb.ExpressServiceSearchPartnersRequest{
				Name:           "tes",
				MaxResultCount: &customMaxResultCount,
			},

			expectedResponse: &partnerpb.ExpressServiceSearchPartnersResponse{
				Partners: protoPartners,
			},
		},
		{
			name: "successful response when no partners found",
			server: &Server{
				DBService: &mockDBService{
					searchPartnersByNameResp: []*partnersql.SearchPartnersByNameRow{},
				},
				Logger: logger,
			},
			request: &partnerpb.ExpressServiceSearchPartnersRequest{
				Name: "tes",
			},

			expectedResponse: &partnerpb.ExpressServiceSearchPartnersResponse{
				Partners: []*partnerpb.Partner{},
			},
		},
		{
			name: "error searching partners by name",
			server: &Server{
				DBService: &mockDBService{
					searchPartnersByNameErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: &partnerpb.ExpressServiceSearchPartnersRequest{
				Name: "tes",
			},

			hasError: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.SearchPartners(context, test.request)
			if (err != nil) != test.hasError {
				t.Errorf("err is %t, but expected err to be %t", err != nil, test.hasError)
			}
			if !test.hasError {
				testutils.MustMatch(t, test.expectedResponse, response)
			}
		})
	}
}

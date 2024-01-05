package partnerdb

import (
	"database/sql"
	"errors"
	"strconv"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/protoconv"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"google.golang.org/protobuf/proto"

	"github.com/*company-data-covered*/services/go/pkg/sqltypes"

	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
)

func TestProtoPartnerFromGetPartnerByIDRow(t *testing.T) {
	currentTime := time.Now()
	partnerID := int64(1)
	partner := &partnersql.GetPartnerByIDRow{
		ID:                       partnerID,
		DisplayName:              "Test Name",
		PartnerCategoryShortName: sqltypes.ToValidNullString("home_health"),
		PhoneCountryCode:         sqltypes.ToValidNullInt32(1),
		PhoneNumber:              sqltypes.ToValidNullString("3037283987"),
		PhoneExtension:           sqltypes.ToValidNullString("12"),
		Email:                    sqltypes.ToValidNullString("test@test.com"),
		AddressLineOne:           sqltypes.ToValidNullString("Ln West 123"),
		AddressLineTwo:           sqltypes.ToValidNullString("Ln South 456"),
		City:                     sqltypes.ToValidNullString("Denver"),
		StateCode:                sqltypes.ToValidNullString("COL"),
		ZipCode:                  sqltypes.ToValidNullString("12345"),
		LatitudeE6:               sqltypes.ToValidNullInt32(1736474),
		LongitudeE6:              sqltypes.ToValidNullInt32(3332673),
		StationChannelItemID:     2,
		StationChannelID:         sqltypes.ToValidNullInt64(123),
		CreatedAt:                currentTime,
		UpdatedAt:                currentTime,
	}
	nilPartnerCategory := &partnersql.GetPartnerByIDRow{
		ID:                   partnerID,
		DisplayName:          "Test Name",
		PhoneCountryCode:     sqltypes.ToValidNullInt32(1),
		PhoneNumber:          sqltypes.ToValidNullString("3037283987"),
		PhoneExtension:       sqltypes.ToValidNullString("12"),
		Email:                sqltypes.ToValidNullString("test@test.com"),
		AddressLineOne:       sqltypes.ToValidNullString("Ln West 123"),
		AddressLineTwo:       sqltypes.ToValidNullString("Ln South 456"),
		City:                 sqltypes.ToValidNullString("Denver"),
		StateCode:            sqltypes.ToValidNullString("COL"),
		ZipCode:              sqltypes.ToValidNullString("12345"),
		LatitudeE6:           sqltypes.ToValidNullInt32(1736474),
		LongitudeE6:          sqltypes.ToValidNullInt32(3332673),
		StationChannelItemID: 2,
		StationChannelID:     sqltypes.ToValidNullInt64(123),
		CreatedAt:            currentTime,
		UpdatedAt:            currentTime,
	}
	nilPartnerGeoLocation := &partnersql.GetPartnerByIDRow{
		ID:                       partnerID,
		DisplayName:              "Test Name",
		PartnerCategoryShortName: sqltypes.ToValidNullString("home_health"),
		PhoneCountryCode:         sqltypes.ToValidNullInt32(1),
		PhoneNumber:              sqltypes.ToValidNullString("3037283987"),
		PhoneExtension:           sqltypes.ToValidNullString("12"),
		Email:                    sqltypes.ToValidNullString("test@test.com"),
		AddressLineOne:           sqltypes.ToValidNullString("Ln West 123"),
		AddressLineTwo:           sqltypes.ToValidNullString("Ln South 456"),
		City:                     sqltypes.ToValidNullString("Denver"),
		StateCode:                sqltypes.ToValidNullString("COL"),
		ZipCode:                  sqltypes.ToValidNullString("12345"),
		StationChannelItemID:     2,
		StationChannelID:         sqltypes.ToValidNullInt64(123),
		CreatedAt:                currentTime,
		UpdatedAt:                currentTime,
	}
	phoneNumber := commonpb.PhoneNumber{
		CountryCode: sqltypes.ToProtoInt32(partner.PhoneCountryCode),
		PhoneNumber: sqltypes.ToProtoString(partner.PhoneNumber),
		Extension:   sqltypes.ToProtoString(partner.PhoneExtension),
	}
	address := commonpb.Address{
		AddressLineOne: sqltypes.ToProtoString(partner.AddressLineOne),
		AddressLineTwo: sqltypes.ToProtoString(partner.AddressLineTwo),
		City:           sqltypes.ToProtoString(partner.City),
		State:          sqltypes.ToProtoString(partner.StateCode),
		ZipCode:        sqltypes.ToProtoString(partner.ZipCode),
	}
	geoLocation := commonpb.Location{
		LatitudeE6:  partner.LatitudeE6.Int32,
		LongitudeE6: partner.LongitudeE6.Int32,
	}
	stationIdentifiers := partnerpb.StationIdentifiers{
		ChannelItemId: partner.StationChannelItemID,
		ChannelId:     sqltypes.ToProtoInt64(partner.StationChannelID),
	}
	tests := []struct {
		name  string
		input *partnersql.GetPartnerByIDRow

		expectedOutput *partnerpb.Partner
	}{
		{
			name:  "all valid fields",
			input: partner,

			expectedOutput: &partnerpb.Partner{
				Id:              &partnerID,
				Name:            partner.DisplayName,
				PartnerCategory: ShortNameToPartnerCategoryEnum[partner.PartnerCategoryShortName.String],
				PhoneNumber:     &phoneNumber,
				Email:           sqltypes.ToProtoString(partner.Email),
				Location: &partnerpb.Location{
					Address:     &address,
					GeoLocation: &geoLocation,
				},
				StationIdentifiers: &stationIdentifiers,
				DeactivatedAt:      sqltypes.ToProtoTimestamp(partner.DeactivatedAt),
				CreatedAt:          sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partner.CreatedAt)),
				UpdatedAt:          sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partner.UpdatedAt)),
			},
		},
		{
			name:  "nil partner category short name",
			input: nilPartnerCategory,

			expectedOutput: &partnerpb.Partner{
				Id:              &partnerID,
				Name:            partner.DisplayName,
				PartnerCategory: partnerpb.PartnerCategory_PARTNER_CATEGORY_UNSPECIFIED,
				PhoneNumber:     &phoneNumber,
				Email:           sqltypes.ToProtoString(partner.Email),
				Location: &partnerpb.Location{
					Address:     &address,
					GeoLocation: &geoLocation,
				},
				StationIdentifiers: &stationIdentifiers,
				DeactivatedAt:      sqltypes.ToProtoTimestamp(partner.DeactivatedAt),
				CreatedAt:          sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partner.CreatedAt)),
				UpdatedAt:          sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partner.UpdatedAt)),
			},
		},
		{
			name:  "nil latitude and longitude",
			input: nilPartnerGeoLocation,

			expectedOutput: &partnerpb.Partner{
				Id:              &partnerID,
				Name:            partner.DisplayName,
				PartnerCategory: ShortNameToPartnerCategoryEnum[partner.PartnerCategoryShortName.String],
				PhoneNumber:     &phoneNumber,
				Email:           sqltypes.ToProtoString(partner.Email),
				Location: &partnerpb.Location{
					Address:     &address,
					GeoLocation: &commonpb.Location{},
				},
				StationIdentifiers: &stationIdentifiers,
				DeactivatedAt:      sqltypes.ToProtoTimestamp(partner.DeactivatedAt),
				CreatedAt:          sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partner.CreatedAt)),
				UpdatedAt:          sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partner.UpdatedAt)),
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response := ProtoPartnerFromGetPartnerByIDRow(test.input)
			testutils.MustMatchProto(t, test.expectedOutput, response)
		})
	}
}

func TestProtoPartnerFromSearchPartnersByNameRow(t *testing.T) {
	currentTime := time.Now()
	partnerID := int64(1)
	partner := &partnersql.SearchPartnersByNameRow{
		ID:                       partnerID,
		DisplayName:              "Test Name",
		PartnerCategoryShortName: sqltypes.ToValidNullString("home_health"),
		PhoneCountryCode:         sqltypes.ToValidNullInt32(1),
		PhoneNumber:              sqltypes.ToValidNullString("3037283987"),
		PhoneExtension:           sqltypes.ToValidNullString("12"),
		Email:                    sqltypes.ToValidNullString("test@test.com"),
		AddressLineOne:           sqltypes.ToValidNullString("Ln West 123"),
		AddressLineTwo:           sqltypes.ToValidNullString("Ln South 456"),
		City:                     sqltypes.ToValidNullString("Denver"),
		StateCode:                sqltypes.ToValidNullString("COL"),
		ZipCode:                  sqltypes.ToValidNullString("12345"),
		LatitudeE6:               sqltypes.ToValidNullInt32(1736474),
		LongitudeE6:              sqltypes.ToValidNullInt32(3332673),
		StationChannelItemID:     2,
		StationChannelID:         sqltypes.ToValidNullInt64(123),
		CreatedAt:                currentTime,
		UpdatedAt:                currentTime,
	}
	tests := []struct {
		name           string
		input          *partnersql.SearchPartnersByNameRow
		expectedOutput *partnerpb.Partner
	}{
		{
			name:  "all valid fields",
			input: partner,
			expectedOutput: &partnerpb.Partner{
				Id:              &partnerID,
				Name:            partner.DisplayName,
				PartnerCategory: ShortNameToPartnerCategoryEnum[partner.PartnerCategoryShortName.String],
				PhoneNumber: &commonpb.PhoneNumber{
					CountryCode: sqltypes.ToProtoInt32(partner.PhoneCountryCode),
					PhoneNumber: sqltypes.ToProtoString(partner.PhoneNumber),
					Extension:   sqltypes.ToProtoString(partner.PhoneExtension),
				},
				Email: sqltypes.ToProtoString(partner.Email),
				Location: &partnerpb.Location{
					Address: &commonpb.Address{
						AddressLineOne: sqltypes.ToProtoString(partner.AddressLineOne),
						AddressLineTwo: sqltypes.ToProtoString(partner.AddressLineTwo),
						City:           sqltypes.ToProtoString(partner.City),
						State:          sqltypes.ToProtoString(partner.StateCode),
						ZipCode:        sqltypes.ToProtoString(partner.ZipCode),
					},
					GeoLocation: &commonpb.Location{
						LatitudeE6:  partner.LatitudeE6.Int32,
						LongitudeE6: partner.LongitudeE6.Int32,
					},
				},
				StationIdentifiers: &partnerpb.StationIdentifiers{
					ChannelItemId: partner.StationChannelItemID,
					ChannelId:     sqltypes.ToProtoInt64(partner.StationChannelID),
				},
				DeactivatedAt: sqltypes.ToProtoTimestamp(partner.DeactivatedAt),
				CreatedAt:     sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partner.CreatedAt)),
				UpdatedAt:     sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partner.UpdatedAt)),
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response := ProtoPartnerFromSearchPartnersByNameRow(test.input)
			testutils.MustMatchProto(t, test.expectedOutput, response)
		})
	}
}

func TestProtoPhoneNumberToPartnerConfigurationPhoneNumber(t *testing.T) {
	tests := []struct {
		name  string
		input *commonpb.PhoneNumber

		expectedOutput sql.NullString
		expectedErr    error
	}{
		{
			name:  "when phone is nil",
			input: nil,

			expectedOutput: sql.NullString{},
		},
		{
			name:  "when phone number is nil",
			input: &commonpb.PhoneNumber{},

			expectedOutput: sql.NullString{},
		},
		{
			name: "with valid phone number",
			input: &commonpb.PhoneNumber{
				PhoneNumber: proto.String("5555555555"),
			},

			expectedOutput: sqltypes.ToValidNullString("5555555555"),
		},
		{
			name: "when phone number does not have 10 digits",
			input: &commonpb.PhoneNumber{
				PhoneNumber: proto.String("123456789"),
			},

			expectedErr: errors.New("phone number must be 10 digits"),
		},
		{
			name: "when phone number contains letters",
			input: &commonpb.PhoneNumber{
				PhoneNumber: proto.String("12a4567890"),
			},

			expectedErr: errors.New("phone number must be 10 digits"),
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := ProtoPhoneNumberToPartnerConfigurationPhoneNumber(test.input)
			testutils.MustMatch(t, test.expectedOutput, response)
			testutils.MustMatch(t, test.expectedErr, err)
		})
	}
}

func TestProtoPartnerConfigurationFromSearchPartnerConfigurationsRow(t *testing.T) {
	baseID := time.Now().UnixNano()
	partnerConfigWithoutProperties := &partnersql.SearchPartnerConfigurationsRow{
		ID:                           baseID,
		ExpressID:                    sqltypes.ToValidNullString("express_id"),
		DisplayName:                  "test_name",
		PhoneNumber:                  sqltypes.ToValidNullString("1234567890"),
		IsRedoxEnabled:               true,
		IsRiskStratBypassEnabled:     true,
		IsSsoEnabled:                 true,
		IsViewAllCareRequestsEnabled: true,
		UpdatedAt:                    time.Now(),
		CreatedAt:                    time.Now(),
	}
	partnerConfigWithSsoProperties := &partnersql.SearchPartnerConfigurationsRow{
		ID:                           baseID,
		ExpressID:                    sqltypes.ToValidNullString("express_id"),
		DisplayName:                  "test_name",
		PhoneNumber:                  sqltypes.ToValidNullString("1234567890"),
		IsRedoxEnabled:               true,
		IsRiskStratBypassEnabled:     true,
		IsSsoEnabled:                 true,
		IsViewAllCareRequestsEnabled: true,
		UpdatedAt:                    time.Now(),
		CreatedAt:                    time.Now(),
		ConnectionName:               sqltypes.ToValidNullString("connection_name"),
		LogoutUrl:                    sqltypes.ToValidNullString("logout_url"),
		EnforceRolePresence:          sql.NullBool{Bool: true, Valid: true},
	}
	partnerConfigWithRedoxProperties := &partnersql.SearchPartnerConfigurationsRow{
		ID:                           baseID,
		ExpressID:                    sqltypes.ToValidNullString("express_id"),
		DisplayName:                  "test_name",
		PhoneNumber:                  sqltypes.ToValidNullString("1234567890"),
		IsRedoxEnabled:               true,
		IsRiskStratBypassEnabled:     true,
		IsSsoEnabled:                 true,
		IsViewAllCareRequestsEnabled: true,
		UpdatedAt:                    time.Now(),
		CreatedAt:                    time.Now(),
		SourceID:                     sqltypes.ToValidNullString("source_id"),
		DestinationID:                sqltypes.ToValidNullString("destination_id"),
		ClinicalSummaryDestinationID: sqltypes.ToValidNullString("clinical_summary_destination_id"),
		CancellationID:               sqltypes.ToValidNullString("cancellation_id"),
		IsClinicalSummaryEnabled:     sql.NullBool{Bool: true, Valid: true},
	}
	tests := []struct {
		name  string
		input *partnersql.SearchPartnerConfigurationsRow

		expectedOutput *partnerpb.PartnerConfiguration
	}{
		{
			name:  "partner configuration without properties",
			input: partnerConfigWithoutProperties,

			expectedOutput: &partnerpb.PartnerConfiguration{
				Id:          &partnerConfigWithoutProperties.ID,
				ExpressId:   &partnerConfigWithoutProperties.ExpressID.String,
				DisplayName: partnerConfigWithoutProperties.DisplayName,
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumber: &partnerConfigWithoutProperties.PhoneNumber.String,
				},
				SsoEnabled:                 &partnerConfigWithoutProperties.IsSsoEnabled,
				RedoxEnabled:               &partnerConfigWithoutProperties.IsRedoxEnabled,
				RiskStratBypassEnabled:     &partnerConfigWithoutProperties.IsRiskStratBypassEnabled,
				ViewAllCareRequestsEnabled: &partnerConfigWithoutProperties.IsViewAllCareRequestsEnabled,
				CreatedAt:                  protoconv.TimeToProtoTimestamp(&partnerConfigWithoutProperties.CreatedAt),
				UpdatedAt:                  protoconv.TimeToProtoTimestamp(&partnerConfigWithoutProperties.UpdatedAt),
			},
		},
		{
			name:  "partner configuration with sso properties",
			input: partnerConfigWithSsoProperties,

			expectedOutput: &partnerpb.PartnerConfiguration{
				Id:          &partnerConfigWithSsoProperties.ID,
				ExpressId:   &partnerConfigWithSsoProperties.ExpressID.String,
				DisplayName: partnerConfigWithSsoProperties.DisplayName,
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumber: &partnerConfigWithSsoProperties.PhoneNumber.String,
				},
				SsoEnabled:                 &partnerConfigWithSsoProperties.IsSsoEnabled,
				RedoxEnabled:               &partnerConfigWithSsoProperties.IsRedoxEnabled,
				RiskStratBypassEnabled:     &partnerConfigWithSsoProperties.IsRiskStratBypassEnabled,
				ViewAllCareRequestsEnabled: &partnerConfigWithSsoProperties.IsViewAllCareRequestsEnabled,
				SsoProperties: &partnerpb.SSOProperties{
					ConnectionName:      partnerConfigWithSsoProperties.ConnectionName.String,
					LogoutUrl:           &partnerConfigWithSsoProperties.LogoutUrl.String,
					EnforceRolePresence: &partnerConfigWithSsoProperties.EnforceRolePresence.Bool,
				},
				CreatedAt: protoconv.TimeToProtoTimestamp(&partnerConfigWithSsoProperties.CreatedAt),
				UpdatedAt: protoconv.TimeToProtoTimestamp(&partnerConfigWithSsoProperties.UpdatedAt),
			},
		},
		{
			name:  "partner configuration with redox properties",
			input: partnerConfigWithRedoxProperties,

			expectedOutput: &partnerpb.PartnerConfiguration{
				Id:          &partnerConfigWithRedoxProperties.ID,
				ExpressId:   &partnerConfigWithRedoxProperties.ExpressID.String,
				DisplayName: partnerConfigWithRedoxProperties.DisplayName,
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumber: &partnerConfigWithRedoxProperties.PhoneNumber.String,
				},
				SsoEnabled:                 &partnerConfigWithRedoxProperties.IsSsoEnabled,
				RedoxEnabled:               &partnerConfigWithRedoxProperties.IsRedoxEnabled,
				RiskStratBypassEnabled:     &partnerConfigWithRedoxProperties.IsRiskStratBypassEnabled,
				ViewAllCareRequestsEnabled: &partnerConfigWithRedoxProperties.IsViewAllCareRequestsEnabled,
				RedoxProperties: &partnerpb.RedoxProperties{
					SourceId:                     partnerConfigWithRedoxProperties.SourceID.String,
					DestinationId:                partnerConfigWithRedoxProperties.DestinationID.String,
					ClinicalSummaryDestinationId: &partnerConfigWithRedoxProperties.ClinicalSummaryDestinationID.String,
					CancellationId:               &partnerConfigWithRedoxProperties.CancellationID.String,
					ClinicalNotesEnabled:         partnerConfigWithRedoxProperties.IsClinicalSummaryEnabled.Bool,
				},
				CreatedAt: protoconv.TimeToProtoTimestamp(&partnerConfigWithRedoxProperties.CreatedAt),
				UpdatedAt: protoconv.TimeToProtoTimestamp(&partnerConfigWithRedoxProperties.UpdatedAt),
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response := ProtoPartnerConfigurationFromSearchPartnerConfigurationsRow(test.input)
			testutils.MustMatch(t, test.expectedOutput, response)
		})
	}
}

func TestProtoPartnerConfigurationFromGetPartnerConfigurationByIDRow(t *testing.T) {
	currentTime := time.Now()
	baseID := time.Now().UnixNano()

	partnerConfiguration := &partnersql.GetPartnerConfigurationByIDRow{
		ID:                           baseID,
		ExpressID:                    sqltypes.ToValidNullString("Test Express ID"),
		DisplayName:                  "Test Name",
		IsSsoEnabled:                 true,
		IsRedoxEnabled:               true,
		IsRiskStratBypassEnabled:     true,
		IsViewAllCareRequestsEnabled: true,
		ConnectionName:               sqltypes.ToValidNullString("Test Connection"),
		LogoutUrl:                    sqltypes.ToValidNullString("http://logmeout.com"),
		EnforceRolePresence:          sql.NullBool{Bool: true, Valid: true},
		SourceID:                     sqltypes.ToValidNullString("Source ID"),
		DestinationID:                sqltypes.ToValidNullString("Dest ID"),
		ClinicalSummaryDestinationID: sqltypes.ToValidNullString("CS ID"),
		CancellationID:               sqltypes.ToValidNullString("Cancellation ID"),
		IsClinicalSummaryEnabled:     sql.NullBool{Bool: true, Valid: true},
		CreatedAt:                    currentTime,
		UpdatedAt:                    currentTime,
	}

	markets := []*partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDRow{
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

	emailDomains := []*partnersql.EmailDomain{
		{DomainDescription: "test_domain@t3st.com"},
	}

	popHealthChannelItems := []int64{baseID + 3}

	sources := []*partnersql.GetPartnerConfigurationSourcesByPartnerConfigurationIDRow{
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

	tests := []struct {
		name                          string
		partnerConfiguration          *partnersql.GetPartnerConfigurationByIDRow
		partnerConfigurationRelations PartnerConfigurationRelations
		expectedOutput                *partnerpb.PartnerConfiguration
	}{
		{
			name:                 "all valid fields",
			partnerConfiguration: partnerConfiguration,
			partnerConfigurationRelations: PartnerConfigurationRelations{
				EmailDomains:            emailDomains,
				Markets:                 markets,
				PopHealthChannelItemIDs: popHealthChannelItems,
				Sources:                 sources,
			},
			expectedOutput: &partnerpb.PartnerConfiguration{
				Id:                         &partnerConfiguration.ID,
				ExpressId:                  sqltypes.ToProtoString(partnerConfiguration.ExpressID),
				DisplayName:                partnerConfiguration.DisplayName,
				SsoEnabled:                 &partnerConfiguration.IsSsoEnabled,
				RedoxEnabled:               &partnerConfiguration.IsRedoxEnabled,
				RiskStratBypassEnabled:     &partnerConfiguration.IsRiskStratBypassEnabled,
				ViewAllCareRequestsEnabled: &partnerConfiguration.IsViewAllCareRequestsEnabled,
				AcceptedDomains:            []string{emailDomains[0].DomainDescription},
				SsoProperties: &partnerpb.SSOProperties{
					ConnectionName:      partnerConfiguration.ConnectionName.String,
					LogoutUrl:           sqltypes.ToProtoString(partnerConfiguration.LogoutUrl),
					EnforceRolePresence: sqltypes.ToProtoBool(partnerConfiguration.EnforceRolePresence),
				},
				RedoxProperties: &partnerpb.RedoxProperties{
					SourceId:                     partnerConfiguration.SourceID.String,
					DestinationId:                partnerConfiguration.DestinationID.String,
					ClinicalSummaryDestinationId: sqltypes.ToProtoString(partnerConfiguration.ClinicalSummaryDestinationID),
					CancellationId:               sqltypes.ToProtoString(partnerConfiguration.CancellationID),
					ClinicalNotesEnabled:         partnerConfiguration.IsClinicalSummaryEnabled.Bool,
				},
				PophealthChannelItemIds: popHealthChannelItems,
				DeletedAt:               sqltypes.ToProtoTimestamp(partnerConfiguration.DeletedAt),
				CreatedAt:               sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partnerConfiguration.CreatedAt)),
				UpdatedAt:               sqltypes.ToProtoTimestamp(sqltypes.ToValidNullTime(partnerConfiguration.UpdatedAt)),
				Markets: []*partnerpb.Market{
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
				},
				Sources: []*partnerpb.Source{
					{
						Id:                     &sources[0].ID,
						PartnerId:              sources[0].PartnerID,
						PartnerConfigurationId: sources[0].PartnerConfigurationID,
						CallbackNumber: &commonpb.PhoneNumber{
							CountryCode: sqltypes.ToProtoInt32(sources[0].CallbackNumberCountryCode),
							PhoneNumber: &sources[0].CallbackNumber,
						},
						DefaultVisitAddress: &commonpb.Address{
							AddressLineOne: sqltypes.ToProtoString(sources[0].AddressLineOne),
							City:           sqltypes.ToProtoString(sources[0].City),
							State:          sqltypes.ToProtoString(sources[0].StateCode),
							ZipCode:        sqltypes.ToProtoString(sources[0].ZipCode),
						},
						DefaultCallbackOption: partnerpb.CallbackOption_CALLBACK_OPTION_PATIENT,
					},
				},
			},
		},
		{
			name:                 "when partner configuration is nil",
			partnerConfiguration: nil,

			expectedOutput: nil,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response := ProtoPartnerConfigurationFromGetPartnerConfigurationByIDRow(test.partnerConfiguration, test.partnerConfigurationRelations)
			testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, test.expectedOutput, response)
		})
	}
}

func TestProtoServiceLineFromServiceLine(t *testing.T) {
	serviceLine := &partnersql.ServiceLine{
		ID:                            1,
		DisplayName:                   "Test Service Line",
		ShortName:                     "TSL",
		GenesysEmail:                  "tst@fjs.ckf",
		AllowBypassRiskStratification: true,
	}

	testutils.MustMatch(t, &partnerpb.ServiceLine{
		Id:                            serviceLine.ID,
		ShortName:                     &serviceLine.ShortName,
		DisplayName:                   &serviceLine.DisplayName,
		GenesysEmail:                  &serviceLine.GenesysEmail,
		AllowBypassRiskStratification: &serviceLine.AllowBypassRiskStratification,
	}, ProtoServiceLineFromServiceLine(serviceLine))
}

func TestProtoServiceLinesFromServiceLinesMap(t *testing.T) {
	serviceLinesMap := map[int64]*partnersql.ServiceLine{
		1: {
			ID:                            1,
			DisplayName:                   "Test Service Line1",
			ShortName:                     "TSL1",
			GenesysEmail:                  "tst1@fjs.ckf",
			AllowBypassRiskStratification: true,
		},
		2: {
			ID:                            2,
			DisplayName:                   "Test Service Line2",
			ShortName:                     "TSL2",
			GenesysEmail:                  "tst2@fjs.ckf",
			AllowBypassRiskStratification: false,
		},
	}

	resp := ProtoServiceLinesFromServiceLinesMap(serviceLinesMap)
	for _, serviceLine := range resp {
		testutils.MustMatch(t, &partnerpb.ServiceLine{
			Id:                            serviceLinesMap[serviceLine.Id].ID,
			ShortName:                     &serviceLinesMap[serviceLine.Id].ShortName,
			DisplayName:                   &serviceLinesMap[serviceLine.Id].DisplayName,
			GenesysEmail:                  &serviceLinesMap[serviceLine.Id].GenesysEmail,
			AllowBypassRiskStratification: &serviceLinesMap[serviceLine.Id].AllowBypassRiskStratification,
		}, serviceLine)
	}
}

func TestProtoInsuranceRecordFromInsuranceNetwork(t *testing.T) {
	insuranceNetwork := &insurancepb.InsuranceNetwork{
		InsurancePayerGroupId: 1,
		InsurancePayerName:    "Test Insurance Network",
		PackageId:             2,
		InsurancePlanId:       3,
	}

	testutils.MustMatch(t, &patientspb.InsuranceRecord{
		Priority: patientspb.InsurancePriority_INSURANCE_PRIORITY_PRIMARY,
		GroupId:  proto.String(strconv.FormatInt(insuranceNetwork.InsurancePayerGroupId, 10)),
		PrimaryInsuranceHolder: &patientspb.PrimaryInsuranceHolder{
			PatientRelationToSubscriber: patientspb.PatientRelationToSubscriber_PATIENT_RELATION_TO_SUBSCRIBER_PATIENT.Enum(),
		},
		CompanyName:     proto.String(insuranceNetwork.InsurancePayerName),
		PackageId:       proto.String(strconv.FormatInt(insuranceNetwork.PackageId, 10)),
		InsurancePlanId: proto.Int64(insuranceNetwork.InsurancePlanId),
	}, ProtoInsuranceRecordFromInsuranceNetwork(insuranceNetwork))
}

func TestAddLocationParamsFromProtoLocation(t *testing.T) {
	addLocationParams := partnersql.AddLocationParams{
		AddressLineOne: sqltypes.ToValidNullString("Main St 1"),
		AddressLineTwo: sqltypes.ToValidNullString("Main St 2"),
		City:           sqltypes.ToValidNullString("Denver"),
		StateCode:      sqltypes.ToValidNullString("CO"),
		ZipCode:        sqltypes.ToValidNullString("14412"),
		LatitudeE6:     sqltypes.ToValidNullInt32(1423445),
		LongitudeE6:    sqltypes.ToValidNullInt32(1412322),
	}

	testutils.MustMatch(t, addLocationParams, AddLocationParamsFromProtoLocation(&partnerpb.Location{
		Address: &commonpb.Address{
			AddressLineOne: proto.String(addLocationParams.AddressLineOne.String),
			AddressLineTwo: proto.String(addLocationParams.AddressLineTwo.String),
			City:           proto.String(addLocationParams.City.String),
			State:          proto.String(addLocationParams.StateCode.String),
			ZipCode:        proto.String(addLocationParams.ZipCode.String),
		},
		GeoLocation: &commonpb.Location{
			LatitudeE6:  addLocationParams.LatitudeE6.Int32,
			LongitudeE6: addLocationParams.LongitudeE6.Int32,
		},
	}))
	testutils.MustMatch(t, partnersql.AddLocationParams{}, AddLocationParamsFromProtoLocation(nil))
}

func TestProtoMarketsFromMarketsAndServiceLines(t *testing.T) {
	baseID := time.Now().UnixNano()
	partnerConfigID := baseID + 2
	marketAndServiceLines := []*partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDRow{
		{
			MarketID:               baseID,
			StationMarketID:        baseID + 1,
			MarketDisplayName:      "Test Market 1",
			PartnerConfigurationID: partnerConfigID,
			ServiceLineID:          baseID + 3,
			ServiceLineShortName:   "Test-Service-Line-1",
			ServiceLineDisplayName: "Test Service Line 1",
			GenesysEmail:           "gen1@t3st.com",
		},
		{
			MarketID:               baseID,
			StationMarketID:        baseID + 1,
			MarketDisplayName:      "Test Market 1",
			PartnerConfigurationID: partnerConfigID,
			ServiceLineID:          baseID + 4,
			ServiceLineShortName:   "Test-Service-Line-2",
			ServiceLineDisplayName: "Test Service Line 2",
			GenesysEmail:           "gen2@t3st.com",
		},
		{
			MarketID:               baseID + 1,
			StationMarketID:        baseID + 2,
			MarketDisplayName:      "Test Market 2",
			PartnerConfigurationID: partnerConfigID,
			ServiceLineID:          baseID + 5,
			ServiceLineShortName:   "Test-Service-Line-3",
			ServiceLineDisplayName: "Test Service Line 3",
			GenesysEmail:           "gen3@t3st.com",
		},
	}
	expectedMarketsMap := map[int64]*partnerpb.Market{
		baseID: {
			Id:                     &baseID,
			PartnerConfigurationId: partnerConfigID,
			StationMarketId:        baseID + 1,
			DisplayName:            "Test Market 1",
			ServiceLines: []*partnerpb.ServiceLine{
				{
					Id:                            baseID + 3,
					ShortName:                     proto.String("Test-Service-Line-1"),
					DisplayName:                   proto.String("Test Service Line 1"),
					GenesysEmail:                  proto.String("gen1@t3st.com"),
					AllowBypassRiskStratification: proto.Bool(false),
				},
				{
					Id:                            baseID + 4,
					ShortName:                     proto.String("Test-Service-Line-2"),
					DisplayName:                   proto.String("Test Service Line 2"),
					GenesysEmail:                  proto.String("gen2@t3st.com"),
					AllowBypassRiskStratification: proto.Bool(false),
				},
			},
		},
		baseID + 1: {
			Id:                     proto.Int64(baseID + 1),
			PartnerConfigurationId: partnerConfigID,
			StationMarketId:        baseID + 2,
			DisplayName:            "Test Market 2",
			ServiceLines: []*partnerpb.ServiceLine{
				{
					Id:                            baseID + 5,
					ShortName:                     proto.String("Test-Service-Line-3"),
					DisplayName:                   proto.String("Test Service Line 3"),
					GenesysEmail:                  proto.String("gen3@t3st.com"),
					AllowBypassRiskStratification: proto.Bool(false),
				},
			},
		},
	}

	gotMarkets := ProtoMarketsFromMarketsAndServiceLines(marketAndServiceLines)
	for _, market := range gotMarkets {
		testutils.MustMatch(t, expectedMarketsMap[*market.Id], market)
	}
}

func TestProtoPartnerConfigurationFromPartnerConfiguration(t *testing.T) {
	baseID := time.Now().UnixNano()
	partnerConfiguration := &partnersql.PartnerConfiguration{
		ID:                           baseID,
		ExpressID:                    sqltypes.ToValidNullString("Test Express ID"),
		DisplayName:                  "Test Name",
		PhoneNumber:                  sqltypes.ToValidNullString("1234567890"),
		IsRedoxEnabled:               true,
		IsRiskStratBypassEnabled:     true,
		IsSsoEnabled:                 true,
		IsViewAllCareRequestsEnabled: true,
	}
	testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, &partnerpb.PartnerConfiguration{
		Id:                         proto.Int64(partnerConfiguration.ID),
		ExpressId:                  sqltypes.ToProtoString(partnerConfiguration.ExpressID),
		DisplayName:                partnerConfiguration.DisplayName,
		PhoneNumber:                partnerConfigurationPhoneNumberToProtoPhoneNumber(partnerConfiguration.PhoneNumber),
		SsoEnabled:                 proto.Bool(partnerConfiguration.IsSsoEnabled),
		RedoxEnabled:               proto.Bool(partnerConfiguration.IsRedoxEnabled),
		RiskStratBypassEnabled:     proto.Bool(partnerConfiguration.IsRiskStratBypassEnabled),
		ViewAllCareRequestsEnabled: proto.Bool(partnerConfiguration.IsViewAllCareRequestsEnabled),
	}, ProtoPartnerConfigurationFromPartnerConfiguration(partnerConfiguration))
}

func TestProtoMarketFromPartnerDBPartnerConfigurationMarket(t *testing.T) {
	baseID := time.Now().UnixNano()
	partnerConfigMarket := &PartnerConfigurationMarket{
		PartnerConfigurationMarket: &partnersql.PartnerConfigurationMarket{
			ID:                     baseID,
			PartnerConfigurationID: baseID + 1,
		},
		Market: &partnersql.Market{
			DisplayName:     "Test Market",
			StationMarketID: baseID + 2,
		},
	}

	testutils.MustMatch(t, &partnerpb.Market{
		Id:                     &partnerConfigMarket.PartnerConfigurationMarket.ID,
		PartnerConfigurationId: partnerConfigMarket.PartnerConfigurationMarket.PartnerConfigurationID,
		StationMarketId:        partnerConfigMarket.Market.StationMarketID,
		DisplayName:            partnerConfigMarket.Market.DisplayName,
	}, ProtoMarketFromPartnerDBPartnerConfigurationMarket(partnerConfigMarket))
}

func TestProtoSourceFromGetPartnerConfigSource(t *testing.T) {
	baseID := time.Now().UnixNano()
	source := &partnersql.GetPartnerConfigurationSourcesByPartnerConfigurationIDRow{
		ID:                        baseID,
		PartnerID:                 baseID + 1,
		PartnerConfigurationID:    baseID + 2,
		CallbackNumberCountryCode: sqltypes.ToValidNullInt32(1),
		CallbackNumber:            "1234567890",
		DefaultCallbackOptionSlug: "patient",
		AddressLineOne:            sqltypes.ToValidNullString("Main St 1"),
		City:                      sqltypes.ToValidNullString("Denver"),
		StateCode:                 sqltypes.ToValidNullString("CO"),
		ZipCode:                   sqltypes.ToValidNullString("80211"),
	}

	tests := []struct {
		name  string
		input *partnersql.GetPartnerConfigurationSourcesByPartnerConfigurationIDRow

		want *partnerpb.Source
	}{
		{
			name:  "when source is nil",
			input: nil,

			want: nil,
		},
		{
			name:  "success - base case",
			input: source,

			want: &partnerpb.Source{
				Id:                     &source.ID,
				PartnerId:              source.PartnerID,
				PartnerConfigurationId: source.PartnerConfigurationID,
				CallbackNumber: &commonpb.PhoneNumber{
					CountryCode: sqltypes.ToProtoInt32(source.CallbackNumberCountryCode),
					PhoneNumber: &source.CallbackNumber,
				},
				DefaultVisitAddress: &commonpb.Address{
					AddressLineOne: sqltypes.ToProtoString(source.AddressLineOne),
					City:           sqltypes.ToProtoString(source.City),
					State:          sqltypes.ToProtoString(source.StateCode),
					ZipCode:        sqltypes.ToProtoString(source.ZipCode),
				},
				DefaultCallbackOption: partnerpb.CallbackOption_CALLBACK_OPTION_PATIENT,
			},
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			got := ProtoSourceFromGetPartnerConfigSource(test.input)

			testutils.MustMatchFn(".CreatedAt", ".UpdatedAt")(t, test.want, got)
		})
	}
}

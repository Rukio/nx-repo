package googlemapsclient

import (
	"context"
	"errors"
	"testing"

	"cloud.google.com/go/maps/addressvalidation/apiv1/addressvalidationpb"
	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"go.uber.org/zap"
	"google.golang.org/genproto/googleapis/type/latlng"
	"google.golang.org/genproto/googleapis/type/postaladdress"
	"google.golang.org/protobuf/proto"
)

func TestValidateAddress(t *testing.T) {
	validCommonAddress := &common.Address{
		AddressLineOne: proto.String("1600 Amphitheatre Parkway"),
		AddressLineTwo: proto.String("Building 43"),
		City:           proto.String("Mountain View"),
		State:          proto.String("CA"),
		ZipCode:        proto.String("94043-1351"),
	}
	invalidCityStateAddress := &common.Address{
		City:    proto.String("Mountain View"),
		State:   proto.String("CA"),
		ZipCode: proto.String("94043"),
	}
	validMispelledCommonAddress := &common.Address{
		AddressLineOne: proto.String("1600 Amphitheater Prakway"),
		AddressLineTwo: proto.String("Building 43"),
		City:           proto.String("Montain View"),
		State:          proto.String("CA"),
		ZipCode:        proto.String("94043-1351"),
	}
	validCommonAddressWithShortZip := &common.Address{
		AddressLineOne: proto.String("1600 Amphitheatre Parkway"),
		AddressLineTwo: proto.String("Building 43"),
		City:           proto.String("Mountain View"),
		State:          proto.String("CA"),
		ZipCode:        proto.String("94043"),
	}

	validAddrValidationAddress := &addressvalidationpb.Address{
		FormattedAddress: "1600 Amphitheatre Parkway, Mountain View, CA 94043-1351, USA",
		PostalAddress: &postaladdress.PostalAddress{
			AddressLines:       []string{"1600 Amphitheatre Parkway", "Building 43"},
			Locality:           "Mountain View",
			AdministrativeArea: "CA",
			PostalCode:         "94043-1351",
			RegionCode:         "US",
			LanguageCode:       "en",
		},
	}
	validUspsDataAddress := &addressvalidationpb.UspsData{
		StandardizedAddress: &addressvalidationpb.UspsAddress{
			FirstAddressLine:        "1600 Amphitheatre Parkway",
			SecondAddressLine:       "Building 43",
			City:                    "Mountain View",
			State:                   "CA",
			ZipCode:                 "94043",
			ZipCodeExtension:        "1351",
			CityStateZipAddressLine: "Mountain View CA 94043-1351",
		},
	}
	validExpectedRequest := &addressvalidationpb.ValidateAddressRequest{
		Address: &postaladdress.PostalAddress{
			AddressLines:       []string{"1600 Amphitheatre Parkway", "Building 43"},
			Locality:           "Mountain View",
			AdministrativeArea: "CA",
			PostalCode:         "94043-1351",
			RegionCode:         "US",
			LanguageCode:       "en",
		},
	}

	validGeocode := &addressvalidationpb.Geocode{
		Location: &latlng.LatLng{
			Latitude:  37.4224109,
			Longitude: -122.0841688,
		},
	}
	validLoc := &common.Location{
		LatitudeE6:  37422410,
		LongitudeE6: -122084168,
	}
	responseID := "asdf-fdsa-asdf-fdsa"

	testCases := []struct {
		Desc           string
		Request        *ValidateAddressRequest
		MockGRPCResult *addressvalidationpb.ValidateAddressResponse
		MockGRPCErr    error

		ExpectedGRPCRequest *addressvalidationpb.ValidateAddressRequest
		ExpectedResponse    *ValidateAddressResponse
		ExpectedErr         error
	}{
		{
			Desc: "usps data exists",
			Request: &ValidateAddressRequest{
				Address: validCommonAddress,
			},
			MockGRPCResult: &addressvalidationpb.ValidateAddressResponse{
				Result: &addressvalidationpb.ValidationResult{
					UspsData: validUspsDataAddress,
					Verdict: &addressvalidationpb.Verdict{
						AddressComplete:       true,
						InputGranularity:      addressvalidationpb.Verdict_SUB_PREMISE,
						ValidationGranularity: addressvalidationpb.Verdict_PREMISE,
						GeocodeGranularity:    addressvalidationpb.Verdict_SUB_PREMISE,
					},
					Geocode: validGeocode,
				},
				ResponseId: responseID,
			},
			ExpectedGRPCRequest: validExpectedRequest,
			ExpectedResponse: &ValidateAddressResponse{
				Address:                    validCommonAddress,
				Geocodeable:                true,
				IsComplete:                 true,
				GoogleValidationResponseID: responseID,
				Location:                   validLoc,
			},
		},
		{
			Desc: "usps data is empty but google postal address exists",
			Request: &ValidateAddressRequest{
				Address: validCommonAddress,
			},
			MockGRPCResult: &addressvalidationpb.ValidateAddressResponse{
				Result: &addressvalidationpb.ValidationResult{
					Address: validAddrValidationAddress,
					Verdict: &addressvalidationpb.Verdict{
						AddressComplete:       true,
						InputGranularity:      addressvalidationpb.Verdict_SUB_PREMISE,
						ValidationGranularity: addressvalidationpb.Verdict_PREMISE,
						GeocodeGranularity:    addressvalidationpb.Verdict_SUB_PREMISE,
					},
					Geocode: validGeocode,
				},
				ResponseId: responseID,
			},
			ExpectedGRPCRequest: &addressvalidationpb.ValidateAddressRequest{
				Address: &postaladdress.PostalAddress{
					AddressLines:       []string{"1600 Amphitheatre Parkway", "Building 43"},
					Locality:           "Mountain View",
					AdministrativeArea: "CA",
					PostalCode:         "94043-1351",
					RegionCode:         "US",
					LanguageCode:       "en",
				},
			},
			ExpectedResponse: &ValidateAddressResponse{
				Address:                    validCommonAddress,
				Geocodeable:                true,
				IsComplete:                 true,
				GoogleValidationResponseID: responseID,
				Location:                   validLoc,
			},
		},
		{
			Desc:    "addressComplete is false",
			Request: &ValidateAddressRequest{Address: invalidCityStateAddress},
			MockGRPCResult: &addressvalidationpb.ValidateAddressResponse{
				Result: &addressvalidationpb.ValidationResult{
					UspsData: &addressvalidationpb.UspsData{
						StandardizedAddress: &addressvalidationpb.UspsAddress{
							City:                    "Mountain View",
							State:                   "CA",
							ZipCode:                 "94043",
							CityStateZipAddressLine: "Mountain View CA 94043",
						},
					},
					Verdict: &addressvalidationpb.Verdict{
						AddressComplete:       false,
						InputGranularity:      addressvalidationpb.Verdict_OTHER,
						ValidationGranularity: addressvalidationpb.Verdict_OTHER,
						GeocodeGranularity:    addressvalidationpb.Verdict_OTHER,
					},
					Geocode: validGeocode,
				},
				ResponseId: responseID,
			},
			ExpectedGRPCRequest: &addressvalidationpb.ValidateAddressRequest{
				Address: &postaladdress.PostalAddress{
					AddressLines:       []string{""},
					Locality:           "Mountain View",
					AdministrativeArea: "CA",
					PostalCode:         "94043",
					RegionCode:         "US",
					LanguageCode:       "en",
				},
			},
			ExpectedResponse: &ValidateAddressResponse{
				Address:                    invalidCityStateAddress,
				Geocodeable:                false,
				IsComplete:                 false,
				GoogleValidationResponseID: responseID,
				Location:                   validLoc,
				Reasons:                    []string{unconfirmedGeocodeComponentsReason},
			},
		},
		{
			Desc:    "has spelling errors but is still usable",
			Request: &ValidateAddressRequest{Address: validMispelledCommonAddress},
			MockGRPCResult: &addressvalidationpb.ValidateAddressResponse{
				Result: &addressvalidationpb.ValidationResult{
					UspsData: validUspsDataAddress,
					Verdict: &addressvalidationpb.Verdict{
						AddressComplete:       true,
						InputGranularity:      addressvalidationpb.Verdict_SUB_PREMISE,
						ValidationGranularity: addressvalidationpb.Verdict_PREMISE,
						GeocodeGranularity:    addressvalidationpb.Verdict_SUB_PREMISE,
					},
					Geocode: validGeocode,
				},
				ResponseId: responseID,
			},
			ExpectedGRPCRequest: &addressvalidationpb.ValidateAddressRequest{
				Address: &postaladdress.PostalAddress{
					AddressLines:       []string{"1600 Amphitheater Prakway", "Building 43"},
					Locality:           "Montain View",
					AdministrativeArea: "CA",
					PostalCode:         "94043-1351",
					RegionCode:         "US",
					LanguageCode:       "en",
				},
			},
			ExpectedResponse: &ValidateAddressResponse{
				Address:                    validCommonAddress,
				Geocodeable:                true,
				IsComplete:                 true,
				GoogleValidationResponseID: responseID,
				Location:                   validLoc,
			},
		},
		{
			Desc:    "has inferred components",
			Request: &ValidateAddressRequest{Address: validCommonAddressWithShortZip},
			MockGRPCResult: &addressvalidationpb.ValidateAddressResponse{
				Result: &addressvalidationpb.ValidationResult{
					UspsData: validUspsDataAddress,
					Verdict: &addressvalidationpb.Verdict{
						AddressComplete:       true,
						HasInferredComponents: true,
						InputGranularity:      addressvalidationpb.Verdict_SUB_PREMISE,
						ValidationGranularity: addressvalidationpb.Verdict_PREMISE,
						GeocodeGranularity:    addressvalidationpb.Verdict_SUB_PREMISE,
					},
					Geocode: validGeocode,
				},
				ResponseId: responseID,
			},
			ExpectedGRPCRequest: &addressvalidationpb.ValidateAddressRequest{
				Address: &postaladdress.PostalAddress{
					AddressLines:       []string{"1600 Amphitheatre Parkway", "Building 43"},
					Locality:           "Mountain View",
					AdministrativeArea: "CA",
					PostalCode:         "94043",
					RegionCode:         "US",
					LanguageCode:       "en",
				},
			},
			ExpectedResponse: &ValidateAddressResponse{
				Address:                    validCommonAddress,
				Geocodeable:                true,
				IsComplete:                 true,
				GoogleValidationResponseID: responseID,
				Location:                   validLoc,
			},
		},
		{
			Desc: "has replaced components",
			Request: &ValidateAddressRequest{Address: &common.Address{
				AddressLineOne: proto.String("1600 Amphitheatre Parkway"),
				AddressLineTwo: proto.String("Building 43"),
				City:           proto.String("Mountain View"),
				State:          proto.String("CA"),
				ZipCode:        proto.String("55555"),
			}},
			MockGRPCResult: &addressvalidationpb.ValidateAddressResponse{
				Result: &addressvalidationpb.ValidationResult{
					UspsData: validUspsDataAddress,
					Verdict: &addressvalidationpb.Verdict{
						AddressComplete:       true,
						HasReplacedComponents: true,
						InputGranularity:      addressvalidationpb.Verdict_PREMISE,
						ValidationGranularity: addressvalidationpb.Verdict_PREMISE,
						GeocodeGranularity:    addressvalidationpb.Verdict_PREMISE,
					},
					Geocode: validGeocode,
				},
				ResponseId: responseID,
			},
			ExpectedGRPCRequest: &addressvalidationpb.ValidateAddressRequest{
				Address: &postaladdress.PostalAddress{
					AddressLines:       []string{"1600 Amphitheatre Parkway", "Building 43"},
					Locality:           "Mountain View",
					AdministrativeArea: "CA",
					PostalCode:         "55555",
					RegionCode:         "US",
					LanguageCode:       "en",
				},
			},
			ExpectedResponse: &ValidateAddressResponse{
				Address:                    validCommonAddress,
				Geocodeable:                true,
				IsComplete:                 true,
				GoogleValidationResponseID: responseID,
				Location:                   validLoc,
			},
		},
		{
			Desc: "geocode granularity is ROUTE",
			Request: &ValidateAddressRequest{
				Address: validCommonAddress,
			},
			MockGRPCResult: &addressvalidationpb.ValidateAddressResponse{
				Result: &addressvalidationpb.ValidationResult{
					UspsData: validUspsDataAddress,
					Verdict: &addressvalidationpb.Verdict{
						AddressComplete:          false,
						HasUnconfirmedComponents: true,
						InputGranularity:         addressvalidationpb.Verdict_SUB_PREMISE,
						ValidationGranularity:    addressvalidationpb.Verdict_SUB_PREMISE,
						GeocodeGranularity:       addressvalidationpb.Verdict_ROUTE,
					},
					Geocode: validGeocode,
				},
				ResponseId: responseID,
			},
			ExpectedGRPCRequest: validExpectedRequest,
			ExpectedResponse: &ValidateAddressResponse{
				Address:                    validCommonAddress,
				Geocodeable:                false,
				IsComplete:                 false,
				GoogleValidationResponseID: responseID,
				Location:                   validLoc,
				Reasons:                    []string{unconfirmedGeocodeComponentsReason},
			},
		},
		{
			Desc: "geocode granularity is BLOCK",
			Request: &ValidateAddressRequest{
				Address: validCommonAddress,
			},
			MockGRPCResult: &addressvalidationpb.ValidateAddressResponse{
				Result: &addressvalidationpb.ValidationResult{
					UspsData: validUspsDataAddress,
					Verdict: &addressvalidationpb.Verdict{
						AddressComplete:          false,
						HasUnconfirmedComponents: true,
						InputGranularity:         addressvalidationpb.Verdict_SUB_PREMISE,
						ValidationGranularity:    addressvalidationpb.Verdict_SUB_PREMISE,
						GeocodeGranularity:       addressvalidationpb.Verdict_BLOCK,
					},
					Geocode: validGeocode,
				},
				ResponseId: responseID,
			},
			ExpectedGRPCRequest: validExpectedRequest,
			ExpectedResponse: &ValidateAddressResponse{
				Address:                    validCommonAddress,
				Geocodeable:                false,
				IsComplete:                 false,
				GoogleValidationResponseID: responseID,
				Location:                   validLoc,
				Reasons:                    []string{unconfirmedGeocodeComponentsReason},
			},
		},
		{
			Desc: "geocode granularity is OTHER",
			Request: &ValidateAddressRequest{
				Address: validCommonAddress,
			},
			MockGRPCResult: &addressvalidationpb.ValidateAddressResponse{
				Result: &addressvalidationpb.ValidationResult{
					UspsData: validUspsDataAddress,
					Verdict: &addressvalidationpb.Verdict{
						AddressComplete:       false,
						InputGranularity:      addressvalidationpb.Verdict_SUB_PREMISE,
						ValidationGranularity: addressvalidationpb.Verdict_PREMISE,
						GeocodeGranularity:    addressvalidationpb.Verdict_OTHER,
					},
					Geocode: validGeocode,
				},
				ResponseId: responseID,
			},
			ExpectedGRPCRequest: validExpectedRequest,
			ExpectedResponse: &ValidateAddressResponse{
				Address:                    validCommonAddress,
				Geocodeable:                false,
				IsComplete:                 false,
				GoogleValidationResponseID: responseID,
				Location:                   validLoc,
				Reasons:                    []string{unconfirmedGeocodeComponentsReason},
			},
		},
		{
			Desc: "request includes responseID",
			Request: &ValidateAddressRequest{
				Address:                            validCommonAddress,
				PreviousGoogleValidationResponseID: &responseID,
			},
			MockGRPCResult: &addressvalidationpb.ValidateAddressResponse{
				Result: &addressvalidationpb.ValidationResult{
					UspsData: validUspsDataAddress,
					Verdict: &addressvalidationpb.Verdict{
						AddressComplete:       true,
						InputGranularity:      addressvalidationpb.Verdict_SUB_PREMISE,
						ValidationGranularity: addressvalidationpb.Verdict_PREMISE,
						GeocodeGranularity:    addressvalidationpb.Verdict_SUB_PREMISE,
					},
					Geocode: validGeocode,
				},
				ResponseId: responseID,
			},
			ExpectedGRPCRequest: &addressvalidationpb.ValidateAddressRequest{
				Address: &postaladdress.PostalAddress{
					AddressLines:       []string{"1600 Amphitheatre Parkway", "Building 43"},
					Locality:           "Mountain View",
					AdministrativeArea: "CA",
					PostalCode:         "94043-1351",
					RegionCode:         "US",
					LanguageCode:       "en",
				},
				PreviousResponseId: responseID,
			},
			ExpectedResponse: &ValidateAddressResponse{
				Address:                    validCommonAddress,
				Geocodeable:                true,
				IsComplete:                 true,
				GoogleValidationResponseID: responseID,
				Location:                   validLoc,
			},
		},
		{
			Desc: "address validation errors",
			Request: &ValidateAddressRequest{
				Address: validCommonAddress,
			},
			MockGRPCErr:         errors.New("your address is on the moon"),
			ExpectedGRPCRequest: validExpectedRequest,
			ExpectedErr:         errValidateAddressError,
		},
		{
			Desc:        "nil req",
			Request:     nil,
			ExpectedErr: errValidateAddressNil,
		},
		{
			Desc: "nil verdict",
			Request: &ValidateAddressRequest{
				Address: validCommonAddress,
			},
			MockGRPCResult: &addressvalidationpb.ValidateAddressResponse{
				Result: &addressvalidationpb.ValidationResult{
					UspsData: validUspsDataAddress,
					Geocode:  validGeocode,
				},
				ResponseId: responseID,
			},
			ExpectedGRPCRequest: validExpectedRequest,
			ExpectedErr:         errNoVerdict,
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Desc, func(t *testing.T) {
			client := MockAddressValidationClient{
				t:                      t,
				ValidateAddressRequest: testCase.ExpectedGRPCRequest,
				ValidateAddressResult:  testCase.MockGRPCResult,
				ValidateAddressErr:     testCase.MockGRPCErr,
			}

			avc := AddressValidationGRPCClient{
				client: client,
				logger: zap.NewNop().Sugar(),
			}
			resp, err := avc.ValidateAddress(context.Background(), testCase.Request)
			if !errors.Is(err, testCase.ExpectedErr) {
				t.Fatalf("Unexpected error. want: %s, got %s", testCase.ExpectedErr, err)
			}
			testutils.MustMatchFn(".Address", ".Location")(t, testCase.ExpectedResponse, resp)
			if testCase.ExpectedResponse != nil {
				testutils.MustMatchProto(t, testCase.ExpectedResponse.Address, resp.Address)
				testutils.MustMatchProto(t, testCase.ExpectedResponse.Location, resp.Location)
			}
		})
	}
}

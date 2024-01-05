package grpc

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strconv"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

func TestUpdateCareRequestSourcePartner(t *testing.T) {
	context := context.Background()

	sourceRequest := &partnerpb.UpdateCareRequestPartnersRequest{
		Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_SOURCE.Enum(),
		CareRequest: &partnerpb.CareRequest{
			Id:            1,
			ChannelItemId: 1,
		},
	}
	unimplementedRequest := &partnerpb.UpdateCareRequestPartnersRequest{
		Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_UNSPECIFIED.Enum(),
		CareRequest: &partnerpb.CareRequest{
			Id:            1,
			ChannelItemId: 1,
		},
	}
	logger := zap.NewNop().Sugar()

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.UpdateCareRequestPartnersRequest

		hasError         bool
		expectedResponse *partnerpb.UpdateCareRequestPartnersResponse
	}{
		{
			name: "valid request returns response with partner id",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow{},
					getPartnerByStationChannelItemIDResp:             partnersql.Partner{ID: 1},
				},
				Logger: logger,
			},
			request: sourceRequest,

			hasError: false,
			expectedResponse: &partnerpb.UpdateCareRequestPartnersResponse{
				CareRequestPartners: []*partnerpb.CareRequestPartner{
					{
						Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_SOURCE,
						Id:     1,
					},
				},
			},
		},
		{
			name: "valid request with existing care request partner returns response with partner id",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow{
						{
							CareRequestPartnerOriginSlug: sourceSlug,
							PartnerID:                    1,
						},
					},
					getPartnerByStationChannelItemIDResp: partnersql.Partner{ID: 2},
				},
				Logger: logger,
			},
			request: sourceRequest,

			hasError: false,
			expectedResponse: &partnerpb.UpdateCareRequestPartnersResponse{
				CareRequestPartners: []*partnerpb.CareRequestPartner{
					{
						Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_SOURCE,
						Id:     2,
					},
				},
			},
		},
		{
			name: "has error if GetPartnerByStationChannelItemID returns a deactivated partner",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow{
						{
							CareRequestPartnerOriginSlug: sourceSlug,
							PartnerID:                    1,
						},
					},
					getPartnerByStationChannelItemIDResp: partnersql.Partner{
						ID:            2,
						DeactivatedAt: sqltypes.ToValidNullTime(time.Now()),
					},
				},
				Logger: logger,
			},
			request: sourceRequest,

			hasError: true,
		},
		{
			name: "has error if GetPartnerByStationChannelItemID fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnerByStationChannelItemIDErr: pgx.ErrNoRows,
				},
				Logger: logger,
			},
			request: sourceRequest,

			hasError:         true,
			expectedResponse: nil,
		},
		{
			name: "has error if GetCareRequestPartnersByStationCareRequestID fails",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: sourceRequest,

			hasError:         true,
			expectedResponse: nil,
		},
		{
			name: "has error if AddCareRequestPartner fails",
			server: &Server{
				DBService: &mockDBService{
					addCareRequestPartnerErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: sourceRequest,

			hasError:         true,
			expectedResponse: nil,
		},
		{
			name: "has error if DeleteCareRequestPartner fails",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow{
						{
							CareRequestPartnerOriginSlug: sourceSlug,
							PartnerID:                    1,
						},
					},
					deleteCareRequestPartnerErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: sourceRequest,

			hasError:         true,
			expectedResponse: nil,
		},
		{
			name: "has error if origin is unimplemented",
			server: &Server{
				DBService: &mockDBService{},
				Logger:    logger,
			},
			request: unimplementedRequest,

			hasError:         true,
			expectedResponse: nil,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.UpdateCareRequestPartners(context, test.request)

			if (err != nil) != test.hasError {
				t.Fatal(err)
			}

			if !test.hasError {
				testutils.MustMatch(t, response, test.expectedResponse)
			}
		})
	}
}

func TestUpdateCareRequestLocationPartners(t *testing.T) {
	context := context.Background()
	baseID := time.Now().UnixNano()

	locationRequest := &partnerpb.UpdateCareRequestPartnersRequest{
		Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_LOCATION.Enum(),
		CareRequest: &partnerpb.CareRequest{
			Id: baseID,
			Location: &partnerpb.Location{
				GeoLocation: &common.Location{
					LatitudeE6:  250,
					LongitudeE6: 500,
				},
			},
		},
	}
	logger := zap.NewNop().Sugar()

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.UpdateCareRequestPartnersRequest

		expectedError    error
		expectedResponse *partnerpb.UpdateCareRequestPartnersResponse
	}{
		{
			name: "valid request returns response with partner id",
			server: &Server{
				DBService: &mockDBService{
					searchPartnersByLatLngResp: []*partnersql.SearchPartnersByLatLngRow{{ID: baseID}},
				},
				Logger: logger,
			},
			request: locationRequest,

			expectedError: nil,
			expectedResponse: &partnerpb.UpdateCareRequestPartnersResponse{
				CareRequestPartners: []*partnerpb.CareRequestPartner{
					{
						Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_LOCATION,
						Id:     baseID,
					},
				},
			},
		},
		{
			name: "does not fail if there are no matches",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow{},
					searchPartnersByLatLngResp:                       []*partnersql.SearchPartnersByLatLngRow{},
				},
				Logger: logger,
			},
			request: locationRequest,

			expectedError: nil,
			expectedResponse: &partnerpb.UpdateCareRequestPartnersResponse{
				CareRequestPartners: []*partnerpb.CareRequestPartner{},
			},
		},
		{
			name: "valid request with existing care request partner returns response with partner id",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow{
						{
							CareRequestPartnerOriginSlug: sourceSlug,
							PartnerID:                    baseID + 2,
						},
						{
							CareRequestPartnerOriginSlug: locationSlug,
							PartnerID:                    baseID + 1,
						},
					},
					searchPartnersByLatLngResp: []*partnersql.SearchPartnersByLatLngRow{{ID: baseID + 1}},
				},
				Logger: logger,
			},
			request: locationRequest,

			expectedError: nil,
			expectedResponse: &partnerpb.UpdateCareRequestPartnersResponse{
				CareRequestPartners: []*partnerpb.CareRequestPartner{
					{
						Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_LOCATION,
						Id:     baseID + 1,
					},
				},
			},
		},
		{
			name: "has error if geo location is missing",
			server: &Server{
				DBService: &mockDBService{},
				Logger:    logger,
			},
			request: &partnerpb.UpdateCareRequestPartnersRequest{
				Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_LOCATION.Enum(),
				CareRequest: &partnerpb.CareRequest{
					Id: baseID,
					Location: &partnerpb.Location{
						GeoLocation: nil,
					},
				},
			},

			expectedError:    status.Errorf(codes.InvalidArgument, "updateLocationPartners requires a lat and lng"),
			expectedResponse: nil,
		},
		{
			name: "has error if lat is missing",
			server: &Server{
				DBService: &mockDBService{},
				Logger:    logger,
			},
			request: &partnerpb.UpdateCareRequestPartnersRequest{
				Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_LOCATION.Enum(),
				CareRequest: &partnerpb.CareRequest{
					Id: baseID,
					Location: &partnerpb.Location{
						GeoLocation: &common.Location{
							LatitudeE6: 250,
						},
					},
				},
			},

			expectedError:    status.Errorf(codes.InvalidArgument, "updateLocationPartners requires a lat and lng"),
			expectedResponse: nil,
		},
		{
			name: "has error if lng is missing",
			server: &Server{
				DBService: &mockDBService{},
				Logger:    logger,
			},
			request: &partnerpb.UpdateCareRequestPartnersRequest{
				Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_LOCATION.Enum(),
				CareRequest: &partnerpb.CareRequest{
					Id: baseID,
					Location: &partnerpb.Location{
						GeoLocation: &common.Location{
							LongitudeE6: 500,
						},
					},
				},
			},

			expectedError:    status.Errorf(codes.InvalidArgument, "updateLocationPartners requires a lat and lng"),
			expectedResponse: nil,
		},
		{
			name: "has error if SearchPartnersByLatLng fails",
			server: &Server{
				DBService: &mockDBService{
					searchPartnersByLatLngErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: locationRequest,

			expectedError:    status.Errorf(codes.Internal, "SearchPartnersByLatLng error: %v", pgx.ErrTxClosed),
			expectedResponse: nil,
		},
		{
			name: "has error if AddCareRequestPartner fails",
			server: &Server{
				DBService: &mockDBService{
					searchPartnersByLatLngResp: []*partnersql.SearchPartnersByLatLngRow{{ID: baseID}},
					addCareRequestPartnerErr:   pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: locationRequest,

			expectedError:    status.Errorf(codes.Internal, "AddCareRequestPartner error: %v", pgx.ErrTxClosed),
			expectedResponse: nil,
		},
		{
			name: "has error if DeleteCareRequestPartner fails",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow{
						{
							CareRequestPartnerOriginSlug: locationSlug,
							PartnerID:                    baseID,
						},
					},
					deleteCareRequestPartnerErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: locationRequest,

			expectedError:    status.Errorf(codes.Internal, "DeleteCareRequestPartner error: %v", pgx.ErrTxClosed),
			expectedResponse: nil,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.UpdateCareRequestPartners(context, test.request)

			testutils.MustMatch(t, test.expectedError, err)
			testutils.MustMatch(t, test.expectedResponse, response)
		})
	}
}

func TestUpdateCareRequestPopHealthPartners(t *testing.T) {
	ctx := context.Background()
	baseID := time.Now().UnixNano()
	patientFirstName := "Lucas"
	patientLastName := "Lincoln"
	popHealthRequest := &partnerpb.UpdateCareRequestPartnersRequest{
		Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_POP_HEALTH.Enum(),
		CareRequest: &partnerpb.CareRequest{
			Id: baseID,
			Patient: &partnerpb.Patient{
				Id: baseID + 1,
				Name: &common.Name{
					GivenName:  &patientFirstName,
					FamilyName: &patientLastName,
				},
				DateOfBirth: &common.Date{
					Year:  1941,
					Month: 5,
					Day:   18,
				},
			},
		},
	}
	invalidPopHealthRequest := &partnerpb.UpdateCareRequestPartnersRequest{
		Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_POP_HEALTH.Enum(),
		CareRequest: &partnerpb.CareRequest{
			Id: baseID,
			Patient: &partnerpb.Patient{
				Id: baseID + 1,
			},
		},
	}
	logger := zap.NewNop().Sugar()
	partnerID1 := baseID + 1
	partnerID2 := baseID + 2
	partnerID3 := baseID + 3
	partners := []*partnersql.Partner{
		{
			ID: partnerID1,
		},
		{
			ID: partnerID2,
		},
		{
			ID: partnerID3,
		},
	}
	patients := []*pophealthpb.Patient{
		{
			Id:            strconv.FormatInt(baseID+1, 10),
			ChannelItemId: baseID + 1,
		},
		{
			Id:            strconv.FormatInt(baseID+2, 10),
			ChannelItemId: baseID + 2,
		},
		{
			Id:            strconv.FormatInt(baseID+3, 10),
			ChannelItemId: baseID + 3,
		},
	}
	careRequestPartners := []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow{
		{
			ID:                           baseID + 1,
			PartnerID:                    partnerID1,
			CareRequestPartnerOriginSlug: sourceSlug,
		},
		{
			ID:                           baseID + 2,
			PartnerID:                    partnerID2,
			CareRequestPartnerOriginSlug: popHealthSlug,
		},
		{
			ID:                           baseID + 3,
			PartnerID:                    baseID + 4,
			CareRequestPartnerOriginSlug: popHealthSlug,
		},
	}

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.UpdateCareRequestPartnersRequest

		expectedError    error
		expectedResponse *partnerpb.UpdateCareRequestPartnersResponse
	}{
		{
			name: "valid request returns response with partner id",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: careRequestPartners,
					getPartnersByStationChannelItemIDListResp:        partners,
				},
				Logger: logger,
				PopHealthSearchPatientClient: &mockPopHealthSearchPatientClient{
					response: &pophealthpb.SearchPatientResponse{
						Patient: patients,
					},
				},
			},
			request: popHealthRequest,

			expectedResponse: &partnerpb.UpdateCareRequestPartnersResponse{
				CareRequestPartners: []*partnerpb.CareRequestPartner{
					{
						Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_POP_HEALTH,
						Id:     partnerID1,
					},
					{
						Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_POP_HEALTH,
						Id:     partnerID2,
					},
					{
						Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_POP_HEALTH,
						Id:     partnerID3,
					},
				},
			},
		},
		{
			name: "valid request returns response with partner id when there are deactivated partners",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: careRequestPartners,
					getPartnersByStationChannelItemIDListResp:        partners[:2],
				},
				Logger: logger,
				PopHealthSearchPatientClient: &mockPopHealthSearchPatientClient{
					response: &pophealthpb.SearchPatientResponse{
						Patient: patients,
					},
				},
			},
			request: popHealthRequest,

			expectedResponse: &partnerpb.UpdateCareRequestPartnersResponse{
				CareRequestPartners: []*partnerpb.CareRequestPartner{
					{
						Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_POP_HEALTH,
						Id:     partnerID1,
					},
					{
						Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_POP_HEALTH,
						Id:     partnerID2,
					},
				},
			},
		},
		{
			name: "does not fail if there are no matches",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: careRequestPartners,
					getPartnersByStationChannelItemIDListResp:        []*partnersql.Partner{},
				},
				Logger: logger,
				PopHealthSearchPatientClient: &mockPopHealthSearchPatientClient{
					response: &pophealthpb.SearchPatientResponse{
						Patient: []*pophealthpb.Patient{},
					},
				},
			},
			request: popHealthRequest,

			expectedResponse: &partnerpb.UpdateCareRequestPartnersResponse{
				CareRequestPartners: []*partnerpb.CareRequestPartner{},
			},
		},
		{
			name: "has error if request doesn't have required parameters",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: careRequestPartners,
				},
				Logger: logger,
			},
			request: invalidPopHealthRequest,

			expectedError: status.Errorf(codes.InvalidArgument, "updatePopHealthPartner requires a patient with name and dob"),
		},
		{
			name: "has error if SearchPatient fails",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: careRequestPartners,
				},
				Logger: logger,
				PopHealthSearchPatientClient: &mockPopHealthSearchPatientClient{
					err: errors.New("test error"),
				},
			},
			request: popHealthRequest,

			expectedError: status.Errorf(codes.Internal, "SearchPatient error: %v", errors.New("test error")),
		},
		{
			name: "has error if GetPartnersByStationChannelItemIDList fails",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: careRequestPartners,
					getPartnersByStationChannelItemIDListErr:         pgx.ErrTxClosed,
				},
				Logger: logger,
				PopHealthSearchPatientClient: &mockPopHealthSearchPatientClient{
					response: &pophealthpb.SearchPatientResponse{
						Patient: patients,
					},
				},
			},
			request: popHealthRequest,

			expectedError: status.Errorf(codes.Internal, "GetPartnersByStationChannelItemIDList error: %v", pgx.ErrTxClosed),
		},
		{
			name: "has error if DeleteCareRequestPartner fails",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: careRequestPartners,
					getPartnersByStationChannelItemIDListResp:        partners,
					deleteCareRequestPartnerErr:                      pgx.ErrTxClosed,
				},
				Logger: logger,
				PopHealthSearchPatientClient: &mockPopHealthSearchPatientClient{
					response: &pophealthpb.SearchPatientResponse{
						Patient: patients,
					},
				},
			},
			request: popHealthRequest,

			expectedError: status.Errorf(codes.Internal, "DeleteCareRequestPartner error: %v", pgx.ErrTxClosed),
		},
		{
			name: "has error if AddCareRequestPartner fails",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: careRequestPartners,
					getPartnersByStationChannelItemIDListResp:        partners,
					addCareRequestPartnerErr:                         pgx.ErrTxClosed,
				},
				Logger: logger,
				PopHealthSearchPatientClient: &mockPopHealthSearchPatientClient{
					response: &pophealthpb.SearchPatientResponse{
						Patient: patients,
					},
				},
			},
			request: popHealthRequest,

			expectedError: status.Errorf(codes.Internal, "AddCareRequestPartner error: %v", pgx.ErrTxClosed),
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.UpdateCareRequestPartners(ctx, test.request)

			testutils.MustMatch(t, test.expectedError, err)
			if test.expectedError == nil {
				sort.Sort(byID(response.CareRequestPartners))
			}
			testutils.MustMatchProto(t, test.expectedResponse, response)
		})
	}
}

func TestUpdateInsurancePartners(t *testing.T) {
	context := context.Background()
	baseID := time.Now().UnixNano()

	insurancePackagesRequest := &partnerpb.UpdateCareRequestPartnersRequest{
		Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_INSURANCE.Enum(),
		CareRequest: &partnerpb.CareRequest{
			Id:            baseID,
			ChannelItemId: baseID,
			InsurancePackages: []*partnerpb.InsurancePackage{
				{PackageId: baseID},
			},
		},
	}

	logger := zap.NewNop().Sugar()

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.UpdateCareRequestPartnersRequest

		expectedError    error
		expectedResponse *partnerpb.UpdateCareRequestPartnersResponse
	}{
		{
			name: "valid request returns response with partner id",
			server: &Server{
				DBService: &mockDBService{
					getPartnersByInsurancePackagesResp: []*partnersql.Partner{{ID: baseID}},
				},
				Logger: logger,
			},
			request: insurancePackagesRequest,

			expectedError: nil,
			expectedResponse: &partnerpb.UpdateCareRequestPartnersResponse{
				CareRequestPartners: []*partnerpb.CareRequestPartner{
					{
						Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_INSURANCE,
						Id:     baseID,
					},
				},
			},
		},
		{
			name: "has error if GetPartnersByInsurancePackages fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnersByInsurancePackagesErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: insurancePackagesRequest,

			expectedError:    status.Errorf(codes.Internal, "GetPartnersByInsurancePackages error: %v", pgx.ErrTxClosed),
			expectedResponse: nil,
		},
		{
			name: "has error if AddCareRequestPartner fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnersByInsurancePackagesResp: []*partnersql.Partner{{ID: baseID}},
					addCareRequestPartnerErr:           pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: insurancePackagesRequest,

			expectedError:    status.Errorf(codes.Internal, "AddCareRequestPartner error: %v", pgx.ErrTxClosed),
			expectedResponse: nil,
		},
		{
			name: "has error if DeleteCareRequestPartner fails",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow{
						{
							CareRequestPartnerOriginSlug: insuranceSlug,
							PartnerID:                    baseID,
						},
					},
					deleteCareRequestPartnerErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: insurancePackagesRequest,

			expectedError:    status.Errorf(codes.Internal, "DeleteCareRequestPartner error: %v", pgx.ErrTxClosed),
			expectedResponse: nil,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.UpdateCareRequestPartners(context, test.request)

			testutils.MustMatch(t, err, test.expectedError)
			testutils.MustMatch(t, response, test.expectedResponse)
		})
	}
}

func TestUpdateProviderNetworkPartners(t *testing.T) {
	context := context.Background()
	baseID := time.Now().UnixNano()
	partnerID := baseID + 1
	providerNetworkNameTpl := "Network %d"

	providerNetworkRequest := &partnerpb.UpdateCareRequestPartnersRequest{
		Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_PROVIDER_NETWORK.Enum(),
		CareRequest: &partnerpb.CareRequest{
			Id:            1,
			ChannelItemId: 1,
			ProviderNetworks: []*partnerpb.ProviderNetwork{
				{Name: fmt.Sprintf(providerNetworkNameTpl, baseID+1),
					ChannelItemId: 1},
			},
		},
	}

	logger := zap.NewNop().Sugar()

	tests := []struct {
		name    string
		server  *Server
		request *partnerpb.UpdateCareRequestPartnersRequest

		expectedError    error
		expectedResponse *partnerpb.UpdateCareRequestPartnersResponse
	}{
		{
			name: "valid request returns response with partner id",
			server: &Server{
				DBService: &mockDBService{
					getPartnersByStationChannelItemIDListResp: []*partnersql.Partner{{ID: partnerID}},
				},
				Logger: logger,
			},
			request: providerNetworkRequest,

			expectedError: nil,
			expectedResponse: &partnerpb.UpdateCareRequestPartnersResponse{
				CareRequestPartners: []*partnerpb.CareRequestPartner{
					{
						Origin: partnerpb.CareRequestPartnerOrigin_CARE_REQUEST_PARTNER_ORIGIN_PROVIDER_NETWORK,
						Id:     partnerID,
					},
				},
			},
		},
		{
			name: "has error if AddCareRequestPartner fails",
			server: &Server{
				DBService: &mockDBService{
					getPartnersByStationChannelItemIDListResp: []*partnersql.Partner{{ID: partnerID}},
					addCareRequestPartnerErr:                  pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: providerNetworkRequest,

			expectedError:    status.Errorf(codes.Internal, "AddCareRequestPartner error: %v", pgx.ErrTxClosed),
			expectedResponse: nil,
		},
		{
			name: "has error if GetPartnersByStationChannelItemIDList fails",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow{
						{
							CareRequestPartnerOriginSlug: providerNetworkSlug,
							PartnerID:                    baseID,
						},
					},
					getPartnersByStationChannelItemIDListErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: providerNetworkRequest,

			expectedError:    status.Errorf(codes.Internal, "GetPartnersByStationChannelItemIDList error: %v", pgx.ErrTxClosed),
			expectedResponse: nil,
		},
		{
			name: "has error if DeleteCareRequestPartner fails",
			server: &Server{
				DBService: &mockDBService{
					getCareRequestPartnersByStationCareRequestIDResp: []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow{
						{
							CareRequestPartnerOriginSlug: providerNetworkSlug,
							PartnerID:                    baseID,
						},
					},
					deleteCareRequestPartnerErr: pgx.ErrTxClosed,
				},
				Logger: logger,
			},
			request: providerNetworkRequest,

			expectedError:    status.Errorf(codes.Internal, "DeleteCareRequestPartner error: %v", pgx.ErrTxClosed),
			expectedResponse: nil,
		},
	}

	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			response, err := test.server.UpdateCareRequestPartners(context, test.request)

			testutils.MustMatch(t, err, test.expectedError)
			testutils.MustMatch(t, response, test.expectedResponse)
		})
	}
}

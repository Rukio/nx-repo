package main

import (
	"context"
	"errors"
	"testing"
	"time"

	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"

	"github.com/*company-data-covered*/services/go/pkg/baselogger"
	modalitypb "github.com/*company-data-covered*/services/go/pkg/generated/proto/modality"
	modalitysql "github.com/*company-data-covered*/services/go/pkg/generated/sql/modality"
	"github.com/*company-data-covered*/services/go/pkg/modality/modalitydb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

type TestModalityDB struct {
	TestDBError                             error
	getNetworkServiceLinesByNetworkIDResult []int64
	getCareRequestEligibleModalitiesResult  []*modalitydb.Modality
	findEligibleNetworksResult              []int64
	findEligibleNetworksError               error
}

func (t TestModalityDB) GetEligibleMarketsByModalityType(ctx context.Context, modalityType string) ([]int64, error) {
	values := make([]int64, 1)
	return values, nil
}

func (t TestModalityDB) GetModalities(context.Context) ([]*modalitydb.Modality, error) {
	values := make([]*modalitydb.Modality, 5)
	for i := range values {
		values[i] = &modalitydb.Modality{}
	}
	return values, t.TestDBError
}

func (t TestModalityDB) GetModalityConfigsByServiceLineID(ctx context.Context, serviceLineID int64) ([]*modalitydb.ModalityConfig, error) {
	values := make([]*modalitydb.ModalityConfig, 5)
	for i := range values {
		values[i] = &modalitydb.ModalityConfig{}
	}
	return values, t.TestDBError
}

func (t TestModalityDB) GetMarketModalityConfigsByServiceLineID(ctx context.Context, serviceLineID int64) ([]*modalitydb.MarketModalityConfig, error) {
	values := make([]*modalitydb.MarketModalityConfig, 5)
	for i := range values {
		values[i] = &modalitydb.MarketModalityConfig{}
	}
	return values, t.TestDBError
}

func (t TestModalityDB) GetNetworkModalityConfigsByNetworkID(ctx context.Context, networkID int64) ([]*modalitydb.NetworkModalityConfig, error) {
	values := make([]*modalitydb.NetworkModalityConfig, 5)
	for i := range values {
		values[i] = &modalitydb.NetworkModalityConfig{}
	}
	return values, t.TestDBError
}

func (t TestModalityDB) GetNetworkModalityConfigs(ctx context.Context, params modalitysql.GetNetworkModalityConfigurationsParams) ([]*modalitydb.NetworkModalityConfig, error) {
	values := make([]*modalitydb.NetworkModalityConfig, 5)
	for i := range values {
		values[i] = &modalitydb.NetworkModalityConfig{}
	}
	return values, t.TestDBError
}

func (t TestModalityDB) CalculateModalities(ctx context.Context, params modalitysql.CalculateModalitiesParams) ([]*modalitydb.Modality, error) {
	values := make([]*modalitydb.Modality, 5)
	for i := range values {
		values[i] = &modalitydb.Modality{}
	}
	return values, t.TestDBError
}

func (t TestModalityDB) UpdateModalityConfigs(ctx context.Context, params modalitydb.UpdateModalityConfigsParams) ([]*modalitydb.ModalityConfig, error) {
	values := make([]*modalitydb.ModalityConfig, 5)
	for i := range values {
		values[i] = &modalitydb.ModalityConfig{}
	}
	return values, t.TestDBError
}

func (t TestModalityDB) UpdateMarketModalityConfigs(ctx context.Context, params modalitydb.UpdateMarketModalityConfigsParams) ([]*modalitydb.MarketModalityConfig, error) {
	values := make([]*modalitydb.MarketModalityConfig, 5)
	for i := range values {
		values[i] = &modalitydb.MarketModalityConfig{}
	}
	return values, t.TestDBError
}

func (t TestModalityDB) UpdateNetworkModalityConfigs(ctx context.Context, params modalitydb.UpdateNetworkModalityConfigsParams) ([]*modalitydb.NetworkModalityConfig, error) {
	values := make([]*modalitydb.NetworkModalityConfig, 5)
	for i := range values {
		values[i] = &modalitydb.NetworkModalityConfig{}
	}
	return values, t.TestDBError
}

func (t TestModalityDB) GetNetworkServiceLinesByNetworkID(ctx context.Context, networkID int64) ([]int64, error) {
	return t.getNetworkServiceLinesByNetworkIDResult, t.TestDBError
}

func (t TestModalityDB) GetCareRequestEligibleModalities(ctx context.Context, params modalitysql.GetCareRequestEligibleModalitiesParams) ([]*modalitydb.Modality, error) {
	return t.getCareRequestEligibleModalitiesResult, t.TestDBError
}

func (t TestModalityDB) FindEligibleNetworks(ctx context.Context, params modalitysql.FindEligibleNetworksParams) ([]int64, error) {
	return t.findEligibleNetworksResult, t.findEligibleNetworksError
}

func (t TestModalityDB) InsertCalculateModalitiesLog(ctx context.Context, params modalitysql.InsertCalculateModalitiesLogParams) error {
	return nil
}

func (t TestModalityDB) IsHealthy(context.Context) bool {
	return true
}

func setup(db ModalityDB) (*ModalityGRPCServer, context.Context) {
	return &ModalityGRPCServer{
		ModalityDB: db,
		Logger:     baselogger.NewSugaredLogger(baselogger.LoggerOptions{}),
	}, context.Background()
}

func TestGetConfigs(t *testing.T) {
	tcs := []struct {
		Desc                      string
		GetModalityConfigsRequest *modalitypb.GetModalityConfigsRequest
		WantError                 bool

		WantGRPCCode codes.Code
	}{
		{
			Desc:                      "should successfully get configs",
			GetModalityConfigsRequest: &modalitypb.GetModalityConfigsRequest{ServiceLineId: 1},

			WantGRPCCode: codes.OK,
		},
		{
			Desc:                      "should return error from DB method",
			GetModalityConfigsRequest: &modalitypb.GetModalityConfigsRequest{ServiceLineId: 1},
			WantError:                 true,

			WantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var err error
			if tc.WantError {
				err = errors.New("an error occurred")
			}

			s, ctx := setup(TestModalityDB{
				TestDBError: err,
			})

			_, err = s.GetModalityConfigs(ctx, tc.GetModalityConfigsRequest)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, respStatus.Code(), tc.WantGRPCCode, "wrong response status")
		})
	}
}

func TestGetMarketModalityConfigs(t *testing.T) {
	tcs := []struct {
		Desc                            string
		GetMarketModalityConfigsRequest *modalitypb.GetMarketModalityConfigsRequest
		WantError                       bool

		WantGRPCCode codes.Code
	}{
		{
			Desc:                            "should successfully get market configs",
			GetMarketModalityConfigsRequest: &modalitypb.GetMarketModalityConfigsRequest{ServiceLineId: 1},

			WantGRPCCode: codes.OK,
		},
		{
			Desc:                            "should return error from DB method",
			GetMarketModalityConfigsRequest: &modalitypb.GetMarketModalityConfigsRequest{ServiceLineId: 1},
			WantError:                       true,

			WantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var err error
			if tc.WantError {
				err = errors.New("an error occurred")
			}

			s, ctx := setup(TestModalityDB{
				TestDBError: err,
			})

			_, err = s.GetMarketModalityConfigs(ctx, tc.GetMarketModalityConfigsRequest)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, respStatus.Code(), tc.WantGRPCCode, "wrong response status")
		})
	}
}

func TestGetNetworkModalityConfigs(t *testing.T) {
	baseID := time.Now().UnixNano()
	serviceLineID := baseID + 1
	networkID := baseID + 2

	tcs := []struct {
		desc  string
		input *modalitypb.GetNetworkModalityConfigsRequest
		dbErr error

		wantCode  codes.Code
		wantError error
	}{
		{
			desc:  "success - return network modality configs with all params passed",
			input: &modalitypb.GetNetworkModalityConfigsRequest{NetworkId: &networkID, ServiceLineId: &serviceLineID},

			wantCode: codes.OK,
		},
		{
			desc:  "success - return network modality configs with network id",
			input: &modalitypb.GetNetworkModalityConfigsRequest{NetworkId: &networkID},

			wantCode: codes.OK,
		},
		{
			desc:  "success - return network modality configs with service line id",
			input: &modalitypb.GetNetworkModalityConfigsRequest{ServiceLineId: &serviceLineID},

			wantCode: codes.OK,
		},
		{
			desc:  "failure - received DB error",
			input: &modalitypb.GetNetworkModalityConfigsRequest{NetworkId: &networkID},
			dbErr: errors.New("something went wrong"),

			wantCode:  codes.Internal,
			wantError: status.Error(codes.Internal, "something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			s, ctx := setup(TestModalityDB{
				TestDBError: tc.dbErr,
			})

			_, err := s.GetNetworkModalityConfigs(ctx, tc.input)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, respStatus.Code(), tc.wantCode)
			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

func TestGetModalities(t *testing.T) {
	tcs := []struct {
		Desc                 string
		GetModalitiesRequest *modalitypb.GetModalitiesRequest
		WantError            bool

		WantGRPCCode codes.Code
	}{
		{
			Desc:                 "should successfully calculate modalities",
			GetModalitiesRequest: &modalitypb.GetModalitiesRequest{},

			WantGRPCCode: codes.OK,
		},
		{
			Desc:                 "should return error from DB method",
			GetModalitiesRequest: &modalitypb.GetModalitiesRequest{},
			WantError:            true,

			WantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var err error
			if tc.WantError {
				err = errors.New("an error occurred")
			}

			s, ctx := setup(TestModalityDB{
				TestDBError: err,
			})

			_, err = s.GetModalities(ctx, tc.GetModalitiesRequest)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, respStatus.Code(), tc.WantGRPCCode, "wrong response status")
		})
	}
}

func TestCalculateModalities(t *testing.T) {
	tcs := []struct {
		Desc                       string
		CalculateModalitiesRequest *modalitypb.CalculateModalitiesRequest
		WantError                  bool

		WantGRPCCode codes.Code
	}{
		{
			Desc:                       "should successfully calculate modalities",
			CalculateModalitiesRequest: &modalitypb.CalculateModalitiesRequest{},

			WantGRPCCode: codes.OK,
		},
		{
			Desc:                       "should return error from DB method",
			CalculateModalitiesRequest: &modalitypb.CalculateModalitiesRequest{},
			WantError:                  true,

			WantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var err error
			if tc.WantError {
				err = errors.New("an error occurred")
			}

			s, ctx := setup(TestModalityDB{
				TestDBError: err,
			})

			_, err = s.CalculateModalities(ctx, tc.CalculateModalitiesRequest)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, respStatus.Code(), tc.WantGRPCCode, "wrong response status")
		})
	}
}

func TestUpdateModalityConfigs(t *testing.T) {
	request := modalitypb.UpdateModalityConfigsRequest{
		ServiceLineId: 1,
		Configs:       []*modalitypb.ModalityConfig{{MarketId: 1, ServiceLineId: 1, InsurancePlanId: 1, ModalityId: 1}},
	}

	tcs := []struct {
		Desc      string
		Request   *modalitypb.UpdateModalityConfigsRequest
		WantError bool

		WantGRPCCode codes.Code
	}{
		{
			Desc:    "should successfully update modalities",
			Request: &request,

			WantGRPCCode: codes.OK,
		},
		{
			Desc:      "should return error from DB method",
			Request:   &request,
			WantError: true,

			WantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var err error
			if tc.WantError {
				err = errors.New("an error occurred")
			}

			s, ctx := setup(TestModalityDB{
				TestDBError: err,
			})

			_, err = s.UpdateModalityConfigs(ctx, tc.Request)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, respStatus.Code(), tc.WantGRPCCode, "wrong response status")
		})
	}
}

func TestUpdateMarketModalityConfigs(t *testing.T) {
	request := modalitypb.UpdateMarketModalityConfigsRequest{
		ServiceLineId: 1,
		Configs:       []*modalitypb.MarketModalityConfig{{MarketId: 1, ServiceLineId: 1, ModalityId: 1}},
	}

	tcs := []struct {
		Desc      string
		Request   *modalitypb.UpdateMarketModalityConfigsRequest
		WantError bool

		WantGRPCCode codes.Code
	}{
		{
			Desc:    "should successfully update market modalities",
			Request: &request,

			WantGRPCCode: codes.OK,
		},
		{
			Desc:      "should return error from DB method",
			Request:   &request,
			WantError: true,

			WantGRPCCode: codes.Internal,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var err error
			if tc.WantError {
				err = errors.New("an error occurred")
			}

			s, ctx := setup(TestModalityDB{
				TestDBError: err,
			})

			_, err = s.UpdateMarketModalityConfigs(ctx, tc.Request)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, respStatus.Code(), tc.WantGRPCCode, "wrong response status")
		})
	}
}

func TestUpdateNetworkModalityConfigs(t *testing.T) {
	baseID := time.Now().UnixNano()
	baseNetworkID := baseID + 1
	baseBillingCityID := baseID + 2
	baseModalityID := baseID + 3
	baseServiceLineID := baseID + 4
	invalidNetworkID := int64(0)

	tcs := []struct {
		desc  string
		input *modalitypb.UpdateNetworkModalityConfigsRequest
		dbErr error

		wantCode  codes.Code
		wantError error
	}{
		{
			desc: "success - updates network modality configs",
			input: &modalitypb.UpdateNetworkModalityConfigsRequest{
				NetworkId: baseNetworkID,
				Configs: []*modalitypb.NetworkModalityConfig{
					{
						NetworkId:     baseNetworkID,
						BillingCityId: baseBillingCityID,
						ServiceLineId: baseServiceLineID,
						ModalityId:    baseModalityID,
					},
				},
			},

			wantCode: codes.OK,
		},
		{
			desc: "failure - invalid network id param",
			input: &modalitypb.UpdateNetworkModalityConfigsRequest{
				NetworkId: invalidNetworkID,
				Configs:   []*modalitypb.NetworkModalityConfig{},
			},

			wantCode:  codes.InvalidArgument,
			wantError: status.Error(codes.InvalidArgument, "network id should be grater than 0"),
		},
		{
			desc: "failure - received DB error",
			input: &modalitypb.UpdateNetworkModalityConfigsRequest{
				NetworkId: baseID,
				Configs:   []*modalitypb.NetworkModalityConfig{},
			},
			dbErr: errors.New("something went wrong"),

			wantCode:  codes.Internal,
			wantError: status.Error(codes.Internal, "something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			s, ctx := setup(TestModalityDB{
				TestDBError: tc.dbErr,
			})

			_, err := s.UpdateNetworkModalityConfigs(ctx, tc.input)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, respStatus.Code(), tc.wantCode)
			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

func TestGetEligibleMarketsByModality(t *testing.T) {
	request := modalitypb.GetEligibleMarketsByModalityRequest{
		ModalityType: "in_person",
	}

	tcs := []struct {
		Desc      string
		Request   *modalitypb.GetEligibleMarketsByModalityRequest
		WantError bool

		WantGRPCCode codes.Code
	}{
		{
			Desc:    "should successfully calculate modalities",
			Request: &request,

			WantGRPCCode: codes.OK,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			var err error
			if tc.WantError {
				err = errors.New("an error occurred")
			}

			s, ctx := setup(TestModalityDB{
				TestDBError: err,
			})

			_, err = s.GetEligibleMarketsByModality(ctx, tc.Request)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, respStatus.Code(), tc.WantGRPCCode, "wrong response status")
		})
	}
}

func TestGetNetworkServiceLines(t *testing.T) {
	baseID := time.Now().UnixNano()
	serviceLineIds := []int64{baseID}

	tcs := []struct {
		desc       string
		input      *modalitypb.GetNetworkServiceLinesRequest
		dbResponse []int64
		dbError    error

		wantCode     codes.Code
		wantResponse *modalitypb.GetNetworkServiceLinesResponse
		wantError    error
	}{
		{
			desc:       "success - returns network service line ids",
			input:      &modalitypb.GetNetworkServiceLinesRequest{NetworkId: baseID},
			dbResponse: serviceLineIds,

			wantCode:     codes.OK,
			wantResponse: &modalitypb.GetNetworkServiceLinesResponse{ServiceLineIds: serviceLineIds},
		},
		{
			desc:  "failure - invalid network id param",
			input: &modalitypb.GetNetworkServiceLinesRequest{NetworkId: int64(0)},

			wantCode:  codes.InvalidArgument,
			wantError: status.Error(codes.InvalidArgument, "network id should be greater than 0"),
		},
		{
			desc:    "failure - received DB error",
			input:   &modalitypb.GetNetworkServiceLinesRequest{NetworkId: baseID},
			dbError: errors.New("something went wrong"),

			wantCode:  codes.Internal,
			wantError: status.Error(codes.Internal, "something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			s, ctx := setup(TestModalityDB{
				TestDBError:                             tc.dbError,
				getNetworkServiceLinesByNetworkIDResult: tc.dbResponse,
			})

			res, err := s.GetNetworkServiceLines(ctx, tc.input)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, respStatus.Code(), tc.wantCode)
			testutils.MustMatch(t, res, tc.wantResponse)
			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

func TestListCareRequestEligibleModalities(t *testing.T) {
	baseID := time.Now().UnixNano()
	serviceLineID := baseID + 1
	networkID := baseID + 2
	marketID := baseID + 3
	billingCityID := baseID + 4
	modalityID := baseID + 5
	modalityName := "In Person"
	modalityType := "in_person"

	tcs := []struct {
		desc       string
		input      *modalitypb.ListCareRequestEligibleModalitiesRequest
		dbResponse []*modalitydb.Modality
		dbError    error

		wantCode     codes.Code
		wantResponse *modalitypb.ListCareRequestEligibleModalitiesResponse
		wantError    error
	}{
		{
			desc: "success - returns list of modalities",
			input: &modalitypb.ListCareRequestEligibleModalitiesRequest{
				NetworkId:     networkID,
				ServiceLineId: serviceLineID,
				MarketId:      marketID,
				BillingCityId: billingCityID,
			},
			dbResponse: []*modalitydb.Modality{
				{
					ID:           modalityID,
					DisplayName:  modalityName,
					ModalityType: modalityType,
				},
			},

			wantCode: codes.OK,
			wantResponse: &modalitypb.ListCareRequestEligibleModalitiesResponse{
				Modalities: []*modalitypb.Modality{
					{
						Id:          modalityID,
						DisplayName: modalityName,
						Type:        modalityType,
					},
				},
			},
		},
		{
			desc: "success - returns empty response from db",
			input: &modalitypb.ListCareRequestEligibleModalitiesRequest{
				NetworkId:     networkID,
				ServiceLineId: serviceLineID,
				MarketId:      marketID,
				BillingCityId: billingCityID,
			},

			wantCode: codes.OK,
			wantResponse: &modalitypb.ListCareRequestEligibleModalitiesResponse{
				Modalities: []*modalitypb.Modality{},
			},
		},
		{
			desc: "failure - error from db",
			input: &modalitypb.ListCareRequestEligibleModalitiesRequest{
				NetworkId:     networkID,
				ServiceLineId: serviceLineID,
				MarketId:      marketID,
				BillingCityId: billingCityID,
			},
			dbError: errors.New("something went wrong"),

			wantCode:  codes.Internal,
			wantError: status.Error(codes.Internal, "something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			s, ctx := setup(TestModalityDB{
				TestDBError:                            tc.dbError,
				getCareRequestEligibleModalitiesResult: tc.dbResponse,
			})

			res, err := s.ListCareRequestEligibleModalities(ctx, tc.input)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, respStatus.Code(), tc.wantCode)
			testutils.MustMatch(t, res, tc.wantResponse)
			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

func TestListEligibleNetworks(t *testing.T) {
	baseID := time.Now().UnixNano()
	billingCityID := baseID + 1
	serviceLineID := baseID + 2
	serviceLineIDWithNoResults := baseID + 3
	networkID := baseID + 4

	tcs := []struct {
		description string
		input       *modalitypb.ListEligibleNetworksRequest
		dbResponse  []int64
		dbError     error

		wantCode     codes.Code
		wantResponse *modalitypb.ListEligibleNetworksResponse
		wantError    error
	}{
		{
			description: "success - returns insurance network ids for given billing city",
			input: &modalitypb.ListEligibleNetworksRequest{
				BillingCityId: &billingCityID,
			},
			dbResponse: []int64{networkID},

			wantCode:     codes.OK,
			wantResponse: &modalitypb.ListEligibleNetworksResponse{NetworkIds: []int64{networkID}},
		},
		{
			description: "success - returns insurance network ids for given service line",
			input: &modalitypb.ListEligibleNetworksRequest{
				ServiceLineId: &serviceLineID,
			},
			dbResponse: []int64{networkID},

			wantCode:     codes.OK,
			wantResponse: &modalitypb.ListEligibleNetworksResponse{NetworkIds: []int64{networkID}},
		},
		{
			description: "success - returns insurance network ids for given billing city and service line",
			input: &modalitypb.ListEligibleNetworksRequest{
				BillingCityId: &billingCityID,
				ServiceLineId: &serviceLineID,
			},
			dbResponse: []int64{networkID},

			wantCode:     codes.OK,
			wantResponse: &modalitypb.ListEligibleNetworksResponse{NetworkIds: []int64{networkID}},
		},
		{
			description: "success - returns all insurance network ids",
			input:       &modalitypb.ListEligibleNetworksRequest{},
			dbResponse:  []int64{networkID},

			wantCode:     codes.OK,
			wantResponse: &modalitypb.ListEligibleNetworksResponse{NetworkIds: []int64{networkID}},
		},
		{
			description: "success - returns empty result for search",
			input: &modalitypb.ListEligibleNetworksRequest{
				ServiceLineId: &serviceLineIDWithNoResults,
			},
			dbResponse: []int64{},

			wantCode:     codes.OK,
			wantResponse: &modalitypb.ListEligibleNetworksResponse{NetworkIds: []int64{}},
		},
		{
			description: "failure - received DB error",
			input: &modalitypb.ListEligibleNetworksRequest{
				BillingCityId: &billingCityID,
				ServiceLineId: &serviceLineID,
			},
			dbError: errors.New("something went wrong"),

			wantCode:  codes.Internal,
			wantError: status.Error(codes.Internal, "something went wrong"),
		},
	}

	for _, tc := range tcs {
		t.Run(tc.description, func(t *testing.T) {
			s, ctx := setup(TestModalityDB{
				findEligibleNetworksError:  tc.dbError,
				findEligibleNetworksResult: tc.dbResponse,
			})

			res, err := s.ListEligibleNetworks(ctx, tc.input)

			respStatus, ok := status.FromError(err)
			if !ok {
				t.Fatal(err)
			}

			testutils.MustMatch(t, tc.wantCode, respStatus.Code())
			testutils.MustMatch(t, tc.wantResponse, res)
			testutils.MustMatch(t, tc.wantError, err)
		})
	}
}

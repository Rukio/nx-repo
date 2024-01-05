package expressgrpc

import (
	"context"
	"errors"
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/protobuf/proto"
)

type mockDBService struct {
	addMarketResp                                                         partnersql.Market
	addMarketErr                                                          error
	addPartnerConfigurationSourceResp                                     *partnersql.PartnerConfigurationSource
	addPartnerConfigurationSourceErr                                      error
	countPartnerConfigurationsResp                                        int64
	countPartnerConfigurationsErr                                         error
	createPartnerConfigMarketAndServiceLinesMarketResp                    partnersql.PartnerConfigurationMarket
	createPartnerConfigMarketAndServiceLinesServiceLineResp               map[int64]*partnersql.ServiceLine
	createPartnerConfigMarketAndServiceLinesErr                           error
	deleteMarketResp                                                      partnerdb.PartnerConfigurationMarket
	deleteMarketErr                                                       error
	deletePartnerConfigurationResp                                        partnersql.PartnerConfiguration
	deletePartnerConfigurationErr                                         error
	getEmailDomainsByPartnerConfigurationIDResp                           []*partnersql.EmailDomain
	getEmailDomainsByPartnerConfigurationIDErr                            error
	getMarketByStationMarketIDResp                                        partnersql.Market
	getMarketByStationMarketIDErr                                         error
	getMarketsAndServiceLinesByIDOrPartnerConfigIDResp                    []*partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDRow
	getMarketsAndServiceLinesByIDOrPartnerConfigIDErr                     error
	getPartnerByIDResp                                                    *partnersql.GetPartnerByIDRow
	getPartnerByIDErr                                                     error
	getPartnerConfigurationByExpressIDResp                                partnersql.PartnerConfiguration
	getPartnerConfigurationByExpressIDErr                                 error
	getPartnerConfigurationByIDResp                                       partnersql.GetPartnerConfigurationByIDRow
	getPartnerConfigurationByIDErr                                        error
	getPartnerConfigurationMarketByIDResp                                 partnersql.PartnerConfigurationMarket
	getPartnerConfigurationMarketByIDErr                                  error
	getPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDResp  partnersql.PartnerConfigurationMarket
	getPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDErr   error
	getPartnerConfigurationSourceByIDResp                                 partnersql.GetPartnerConfigurationSourceByIDRow
	getPartnerConfigurationSourceByIDErr                                  error
	getPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationIDResp *partnersql.PartnerConfigurationSource
	getPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationIDErr  error
	getPartnerConfigurationSourcesByPartnerConfigurationIDResp            []*partnersql.GetPartnerConfigurationSourcesByPartnerConfigurationIDRow
	getPartnerConfigurationSourcesByPartnerConfigurationIDErr             error
	getPophealthChannelItemsByPartnerConfigurationIDResp                  []int64
	getPophealthChannelItemsByPartnerConfigurationIDErr                   error
	getServiceLinesByExpressIDAndMarketIDResp                             []*partnersql.ServiceLine
	getServiceLinesByExpressIDAndMarketIDErr                              error
	searchPartnerConfigurationsResp                                       []*partnersql.SearchPartnerConfigurationsRow
	searchPartnerConfigurationsErr                                        error
	searchPartnersByNameResp                                              []*partnersql.SearchPartnersByNameRow
	searchPartnersByNameErr                                               error
	updatePartnerConfigurationMarketServiceLinesResp                      map[int64]*partnersql.ServiceLine
	updatePartnerConfigurationMarketServiceLinesErr                       error
	upsertPartnerConfigurationResp                                        partnersql.GetPartnerConfigurationByIDRow
	upsertPartnerConfigurationErr                                         error
}

func (m *mockDBService) AddMarket(context.Context, partnersql.AddMarketParams) (*partnersql.Market, error) {
	return &m.addMarketResp, m.addMarketErr
}

func (m *mockDBService) AddPartnerConfigurationSource(context.Context, *partnerpb.Location, partnersql.AddPartnerConfigurationSourceParams) (*partnersql.PartnerConfigurationSource, error) {
	return m.addPartnerConfigurationSourceResp, m.addPartnerConfigurationSourceErr
}

func (m *mockDBService) CountPartnerConfigurations(context.Context, partnersql.CountPartnerConfigurationsParams) (int64, error) {
	return m.countPartnerConfigurationsResp, m.countPartnerConfigurationsErr
}

func (m *mockDBService) CreatePartnerConfigurationMarketAndServiceLines(context.Context, *partnerpb.Market) (*partnersql.PartnerConfigurationMarket, map[int64]*partnersql.ServiceLine, error) {
	return &m.createPartnerConfigMarketAndServiceLinesMarketResp, m.createPartnerConfigMarketAndServiceLinesServiceLineResp, m.createPartnerConfigMarketAndServiceLinesErr
}

func (m *mockDBService) DeleteMarket(context.Context, int64) (*partnerdb.PartnerConfigurationMarket, error) {
	return &m.deleteMarketResp, m.deleteMarketErr
}

func (m *mockDBService) DeletePartnerConfiguration(context.Context, int64) (*partnersql.PartnerConfiguration, error) {
	return &m.deletePartnerConfigurationResp, m.deletePartnerConfigurationErr
}

func (m *mockDBService) GetEmailDomainsByPartnerConfigurationID(context.Context, int64) ([]*partnersql.EmailDomain, error) {
	return m.getEmailDomainsByPartnerConfigurationIDResp, m.getEmailDomainsByPartnerConfigurationIDErr
}

func (m *mockDBService) GetMarketByStationMarketID(context.Context, int64) (*partnersql.Market, error) {
	return &m.getMarketByStationMarketIDResp, m.getMarketByStationMarketIDErr
}

func (m *mockDBService) GetMarketsAndServiceLinesByIDOrPartnerConfigID(context.Context, partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDParams) ([]*partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDRow, error) {
	return m.getMarketsAndServiceLinesByIDOrPartnerConfigIDResp, m.getMarketsAndServiceLinesByIDOrPartnerConfigIDErr
}

func (m *mockDBService) GetPartnerByID(context.Context, int64) (*partnersql.GetPartnerByIDRow, error) {
	return m.getPartnerByIDResp, m.getPartnerByIDErr
}

func (m *mockDBService) GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketID(
	context.Context, partnersql.GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDParams) (*partnersql.PartnerConfigurationMarket, error) {
	return &m.getPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDResp, m.getPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDErr
}

func (m *mockDBService) GetPartnerConfigurationByExpressID(context.Context, string) (*partnersql.PartnerConfiguration, error) {
	return &m.getPartnerConfigurationByExpressIDResp, m.getPartnerConfigurationByExpressIDErr
}

func (m *mockDBService) GetPartnerConfigurationByID(context.Context, int64) (*partnersql.GetPartnerConfigurationByIDRow, error) {
	return &m.getPartnerConfigurationByIDResp, m.getPartnerConfigurationByIDErr
}

func (m *mockDBService) GetPartnerConfigurationMarketByID(context.Context, int64) (*partnersql.PartnerConfigurationMarket, error) {
	return &m.getPartnerConfigurationMarketByIDResp, m.getPartnerConfigurationMarketByIDErr
}

func (m *mockDBService) GetPartnerConfigurationSourceByID(context.Context, int64) (*partnersql.GetPartnerConfigurationSourceByIDRow, error) {
	return &m.getPartnerConfigurationSourceByIDResp, m.getPartnerConfigurationSourceByIDErr
}

func (m *mockDBService) GetPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationID(context.Context, partnersql.GetPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationIDParams) (*partnersql.PartnerConfigurationSource, error) {
	return m.getPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationIDResp, m.getPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationIDErr
}

func (m *mockDBService) GetPartnerConfigurationSourcesByPartnerConfigurationID(context.Context, int64) ([]*partnersql.GetPartnerConfigurationSourcesByPartnerConfigurationIDRow, error) {
	return m.getPartnerConfigurationSourcesByPartnerConfigurationIDResp, m.getPartnerConfigurationSourcesByPartnerConfigurationIDErr
}

func (m *mockDBService) GetPophealthChannelItemsByPartnerConfigurationID(context.Context, int64) ([]int64, error) {
	return m.getPophealthChannelItemsByPartnerConfigurationIDResp, m.getPophealthChannelItemsByPartnerConfigurationIDErr
}

func (m *mockPatientsService) GetPatient(context.Context, *patientspb.GetPatientRequest, ...grpc.CallOption) (*patientspb.GetPatientResponse, error) {
	return m.getPatientResp, m.getPatientRespErr
}

func (m *mockDBService) GetServiceLinesByExpressIDAndMarketID(context.Context, partnersql.GetServiceLinesByExpressIDAndMarketIDParams) ([]*partnersql.ServiceLine, error) {
	return m.getServiceLinesByExpressIDAndMarketIDResp, m.getServiceLinesByExpressIDAndMarketIDErr
}

func (m *mockDBService) SearchPartnerConfigurations(context.Context, partnersql.SearchPartnerConfigurationsParams) ([]*partnersql.SearchPartnerConfigurationsRow, error) {
	return m.searchPartnerConfigurationsResp, m.searchPartnerConfigurationsErr
}

func (m *mockDBService) SearchPartnersByName(context.Context, partnersql.SearchPartnersByNameParams) ([]*partnersql.SearchPartnersByNameRow, error) {
	return m.searchPartnersByNameResp, m.searchPartnersByNameErr
}

func (m *mockDBService) UpdatePartnerConfigurationMarketServiceLines(context.Context, *partnersql.PartnerConfigurationMarket, []*partnerpb.ServiceLine) (map[int64]*partnersql.ServiceLine, error) {
	return m.updatePartnerConfigurationMarketServiceLinesResp, m.updatePartnerConfigurationMarketServiceLinesErr
}

func (m *mockDBService) UpsertPartnerConfiguration(context.Context, *partnerpb.PartnerConfiguration) (*partnersql.GetPartnerConfigurationByIDRow, error) {
	return &m.upsertPartnerConfigurationResp, m.upsertPartnerConfigurationErr
}

type mockPatientsService struct {
	getPatientResp    *patientspb.GetPatientResponse
	getPatientRespErr error
}

func TestNewServer(t *testing.T) {
	tests := []struct {
		name string

		want    *Server
		wantErr bool
	}{
		{
			name: "returns server",

			want:    &Server{},
			wantErr: false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server, err := NewServer(&ServerParams{})

			testutils.MustMatch(t, server, test.want)
			testutils.MustMatch(t, err != nil, test.wantErr)
		})
	}
}

func TestSerializePolicyResource(t *testing.T) {
	ctx := context.Background()
	logger := zap.NewNop().Sugar()
	baseID := time.Now().UnixNano()

	expressID := "963c2c41-1501-41b1-b40d-0a5429d98944"
	partnerConfigurationID := baseID
	partnerConfigurationResp := partnersql.GetPartnerConfigurationByIDRow{
		ID:        partnerConfigurationID,
		ExpressID: sqltypes.ToValidNullString(expressID),
	}
	partnerConfigMarket := partnersql.PartnerConfigurationMarket{
		PartnerConfigurationID: partnerConfigurationID,
	}

	tests := []struct {
		name            string
		patientsService mockPatientsService
		dBService       mockDBService
		req             any

		want    *policyData
		wantErr bool
	}{
		{
			name: "unexpected request",

			wantErr: true,
		},
		{
			name: "GetPatientRequest - patient is not found",
			patientsService: mockPatientsService{
				getPatientRespErr: errors.New("service error"),
			},
			req: &partnerpb.GetPatientRequest{},

			wantErr: true,
		},
		{
			name: "GetPatientRequest - success",
			patientsService: mockPatientsService{
				getPatientResp: &patientspb.GetPatientResponse{
					Patient: &common.Patient{
						PartnerId: proto.String("1-2-3"),
					},
				},
			},
			req: &partnerpb.GetPatientRequest{
				PatientId: "10",
			},

			want: &policyData{
				PartnerID: proto.String("1-2-3"),
			},
			wantErr: false,
		},
		{
			name: "GetConfigurationRequest - configuration is not found",
			dBService: mockDBService{
				getPartnerConfigurationByIDErr: errors.New("service error"),
			},
			req: &partnerpb.GetConfigurationRequest{
				PartnerConfigurationId: "10",
			},

			wantErr: true,
		},
		{
			name: "GetConfigurationRequest - success",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnerConfigurationResp,
			},
			req: &partnerpb.GetConfigurationRequest{
				PartnerConfigurationId: "10",
			},

			want: &policyData{
				PartnerID: proto.String(expressID),
			},
			wantErr: false,
		},
		{
			name: "GetConfigurationRequest - success with Express ID",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnerConfigurationResp,
			},
			req: &partnerpb.GetConfigurationRequest{
				PartnerConfigurationId: expressID,
			},

			want: &policyData{
				PartnerID: proto.String(expressID),
			},
			wantErr: false,
		},
		{
			name: "GetConfigurationRequest - ExpressID is invalid",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnersql.GetPartnerConfigurationByIDRow{
					ID: baseID,
				},
			},
			req: &partnerpb.GetConfigurationRequest{
				PartnerConfigurationId: "10",
			},

			wantErr: true,
		},
		{
			name: "ListServiceLinesRequest",
			req: &partnerpb.ListServiceLinesRequest{
				PartnerId: expressID,
			},

			want: &policyData{
				PartnerID: proto.String(expressID),
			},
		},
		{
			name: "UpdateMarketRequest - success",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnerConfigurationResp,
			},
			req: &partnerpb.UpdateMarketRequest{
				Id: baseID,
				Market: &partnerpb.Market{
					PartnerConfigurationId: partnerConfigurationID,
				},
			},

			want: &policyData{
				PartnerID: proto.String(expressID),
			},
		},
		{
			name: "UpdateMarketRequest - fails when market is missing",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnerConfigurationResp,
			},
			req: &partnerpb.UpdateMarketRequest{
				Id: baseID,
			},

			wantErr: true,
		},
		{
			name: "UpdateMarketRequest - fails when configuration is not found",
			dBService: mockDBService{
				getPartnerConfigurationByIDErr: errors.New("service error"),
			},
			req: &partnerpb.UpdateMarketRequest{
				Id: baseID,
				Market: &partnerpb.Market{
					PartnerConfigurationId: partnerConfigurationID,
				},
			},

			wantErr: true,
		},
		{
			name: "UpdateMarketRequest - fails when ExpressID is invalid",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnersql.GetPartnerConfigurationByIDRow{
					ID: baseID,
				},
			},
			req: &partnerpb.UpdateMarketRequest{
				Id: baseID,
				Market: &partnerpb.Market{
					PartnerConfigurationId: partnerConfigurationID,
				},
			},

			wantErr: true,
		},
		{
			name: "ListMarketsRequest - success",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnerConfigurationResp,
			},
			req: &partnerpb.ListMarketsRequest{
				PartnerConfigurationId: partnerConfigurationID,
			},

			want: &policyData{
				PartnerID: proto.String(expressID),
			},
		},
		{
			name: "ListMarketsRequest - fails when configuration is not found",
			dBService: mockDBService{
				getPartnerConfigurationByIDErr: errors.New("service error"),
			},
			req: &partnerpb.ListMarketsRequest{
				PartnerConfigurationId: partnerConfigurationID,
			},

			wantErr: true,
		},
		{
			name: "ListMarketsRequest - fails when ExpressID is invalid",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnersql.GetPartnerConfigurationByIDRow{
					ID: baseID,
				},
			},
			req: &partnerpb.ListMarketsRequest{
				PartnerConfigurationId: partnerConfigurationID,
			},

			wantErr: true,
		},
		{
			name: "CreateMarketRequest - success",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnerConfigurationResp,
			},
			req: &partnerpb.CreateMarketRequest{
				Market: &partnerpb.Market{
					PartnerConfigurationId: partnerConfigurationID,
				},
			},

			want: &policyData{
				PartnerID: proto.String(expressID),
			},
		},
		{
			name: "CreateMarketRequest - fails when market is missing",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnerConfigurationResp,
			},
			req: &partnerpb.CreateMarketRequest{},

			wantErr: true,
		},
		{
			name: "CreateMarketRequest - fails when configuration is not found",
			dBService: mockDBService{
				getPartnerConfigurationByIDErr: errors.New("service error"),
			},
			req: &partnerpb.CreateMarketRequest{
				Market: &partnerpb.Market{
					PartnerConfigurationId: partnerConfigurationID,
				},
			},

			wantErr: true,
		},
		{
			name: "CreateMarketRequest - fails when ExpressID is invalid",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnersql.GetPartnerConfigurationByIDRow{
					ID: baseID,
				},
			},
			req: &partnerpb.CreateMarketRequest{
				Market: &partnerpb.Market{
					PartnerConfigurationId: partnerConfigurationID,
				},
			},

			wantErr: true,
		},
		{
			name: "GetMarketRequest - success",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp:       partnerConfigurationResp,
				getPartnerConfigurationMarketByIDResp: partnerConfigMarket,
			},
			req: &partnerpb.GetMarketRequest{
				Id: baseID,
			},

			want: &policyData{
				PartnerID: proto.String(expressID),
			},
		},
		{
			name: "GetMarketRequest - fails when GetPartnerConfigurationMarketByID returns no rows",
			dBService: mockDBService{
				getPartnerConfigurationMarketByIDErr: pgx.ErrNoRows,
			},
			req: &partnerpb.GetMarketRequest{
				Id: baseID,
			},

			wantErr: true,
		},
		{
			name: "GetMarketRequest - fails when GetPartnerConfigurationMarketByID returns an error",
			dBService: mockDBService{
				getPartnerConfigurationMarketByIDErr: pgx.ErrTxClosed,
			},
			req: &partnerpb.GetMarketRequest{
				Id: baseID,
			},

			wantErr: true,
		},
		{
			name: "GetMarketRequest - fails when GetPartnerConfigurationByID returns no rows",
			dBService: mockDBService{
				getPartnerConfigurationMarketByIDResp: partnerConfigMarket,
				getPartnerConfigurationByIDErr:        pgx.ErrNoRows,
			},
			req: &partnerpb.GetMarketRequest{
				Id: baseID,
			},

			wantErr: true,
		},
		{
			name: "GetMarketRequest - fails when GetPartnerConfigurationByID returns an error",
			dBService: mockDBService{
				getPartnerConfigurationMarketByIDResp: partnerConfigMarket,
				getPartnerConfigurationByIDErr:        pgx.ErrTxClosed,
			},
			req: &partnerpb.GetMarketRequest{
				Id: baseID,
			},

			wantErr: true,
		},
		{
			name: "GetMarketRequest - fails when ExpressID is invalid",
			dBService: mockDBService{
				getPartnerConfigurationMarketByIDResp: partnerConfigMarket,
				getPartnerConfigurationByIDResp: partnersql.GetPartnerConfigurationByIDRow{
					ID: baseID,
				},
			},
			req: &partnerpb.GetMarketRequest{
				Id: baseID,
			},

			wantErr: true,
		},
		{
			name: "DeleteConfigurationRequest - success",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnerConfigurationResp,
			},
			req: &partnerpb.DeleteConfigurationRequest{
				Id: partnerConfigurationID,
			},

			want: &policyData{
				PartnerID: proto.String(expressID),
			},
		},
		{
			name: "DeleteConfigurationRequest - fails when configuration is not found",
			dBService: mockDBService{
				getPartnerConfigurationByIDErr: errors.New("service error"),
			},
			req: &partnerpb.DeleteConfigurationRequest{
				Id: partnerConfigurationID,
			},

			wantErr: true,
		},
		{
			name: "DeleteConfigurationRequest - fails when ExpressID is invalid",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnersql.GetPartnerConfigurationByIDRow{
					ID: baseID,
				},
			},
			req: &partnerpb.DeleteConfigurationRequest{
				Id: partnerConfigurationID,
			},

			wantErr: true,
		},
		{
			name: "DeleteMarketRequest - success",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp:       partnerConfigurationResp,
				getPartnerConfigurationMarketByIDResp: partnerConfigMarket,
			},
			req: &partnerpb.DeleteMarketRequest{
				Id: baseID,
			},

			want: &policyData{
				PartnerID: proto.String(expressID),
			},
		},
		{
			name: "DeleteMarketRequest - fails when GetPartnerConfigurationMarketByID returns no rows",
			dBService: mockDBService{
				getPartnerConfigurationMarketByIDErr: pgx.ErrNoRows,
			},
			req: &partnerpb.DeleteMarketRequest{
				Id: baseID,
			},

			wantErr: true,
		},
		{
			name: "DeleteMarketRequest - fails when GetPartnerConfigurationMarketByID returns an error",
			dBService: mockDBService{
				getPartnerConfigurationMarketByIDErr: pgx.ErrTxClosed,
			},
			req: &partnerpb.DeleteMarketRequest{
				Id: baseID,
			},

			wantErr: true,
		},
		{
			name: "DeleteMarketRequest - fails when GetPartnerConfigurationByID returns no rows",
			dBService: mockDBService{
				getPartnerConfigurationMarketByIDResp: partnerConfigMarket,
				getPartnerConfigurationByIDErr:        pgx.ErrNoRows,
			},
			req: &partnerpb.DeleteMarketRequest{
				Id: baseID,
			},

			wantErr: true,
		},
		{
			name: "DeleteMarketRequest - fails when GetPartnerConfigurationByID returns an error",
			dBService: mockDBService{
				getPartnerConfigurationMarketByIDResp: partnerConfigMarket,
				getPartnerConfigurationByIDErr:        pgx.ErrTxClosed,
			},
			req: &partnerpb.DeleteMarketRequest{
				Id: baseID,
			},

			wantErr: true,
		},
		{
			name: "DeleteMarketRequest - fails when ExpressID is invalid",
			dBService: mockDBService{
				getPartnerConfigurationMarketByIDResp: partnerConfigMarket,
				getPartnerConfigurationByIDResp: partnersql.GetPartnerConfigurationByIDRow{
					ID: baseID,
				},
			},
			req: &partnerpb.DeleteMarketRequest{
				Id: baseID,
			},

			wantErr: true,
		},
		{
			name:      "ListConfigurationsRequest - success",
			dBService: mockDBService{},
			req:       &partnerpb.ListConfigurationsRequest{},

			want: &policyData{},
		},
		{
			name:      "CreateConfigurationRequest - success",
			dBService: mockDBService{},
			req: &partnerpb.CreateConfigurationRequest{
				PartnerConfiguration: &partnerpb.PartnerConfiguration{ExpressId: &expressID},
			},

			want: &policyData{},
		},
		{
			name:      "ExpressServiceSearchPartnersRequest - success",
			dBService: mockDBService{},
			req:       &partnerpb.ExpressServiceSearchPartnersRequest{},

			want: &policyData{},
		},
		{
			name: "CreateConfigurationSourceRequest - success",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnerConfigurationResp,
			},
			req: &partnerpb.CreateConfigurationSourceRequest{
				Source: &partnerpb.Source{PartnerConfigurationId: partnerConfigurationID},
			},

			want: &policyData{
				PartnerID: proto.String(expressID),
			},
		},
		{
			name: "CreateConfigurationSourceRequest - fails when getExpressIDFromPartnerConfigurationID fails",
			dBService: mockDBService{
				getPartnerConfigurationByIDErr: pgx.ErrTxClosed,
			},
			req: &partnerpb.CreateConfigurationSourceRequest{},

			wantErr: true,
		},
		{
			name: "CreateConfigurationSourceRequest - fails when Source is invalid",
			req:  &partnerpb.CreateConfigurationSourceRequest{},

			wantErr: true,
		},
		{
			name: "GetConfigurationSourceRequest - success",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnerConfigurationResp,
			},
			req: &partnerpb.GetConfigurationSourceRequest{},

			want: &policyData{
				PartnerID: &expressID,
			},
		},
		{
			name: "GetConfigurationSourceRequest - fails when configuration source was not found",
			dBService: mockDBService{
				getPartnerConfigurationSourceByIDErr: pgx.ErrNoRows,
			},
			req: &partnerpb.GetConfigurationSourceRequest{},

			wantErr: true,
		},
		{
			name: "GetConfigurationSourceRequest - fails when GetPartnerConfigurationSourceByID fails",
			dBService: mockDBService{
				getPartnerConfigurationSourceByIDErr: pgx.ErrTxClosed,
			},
			req: &partnerpb.GetConfigurationSourceRequest{},

			wantErr: true,
		},
		{
			name: "GetConfigurationSourceRequest - fails when GetPartnerConfigurationByID fails",
			dBService: mockDBService{
				getPartnerConfigurationByIDErr: pgx.ErrTxClosed,
			},
			req: &partnerpb.GetConfigurationSourceRequest{},

			wantErr: true,
		},
		{
			name: "ListConfigurationSourcesRequest - success",
			dBService: mockDBService{
				getPartnerConfigurationByIDResp: partnerConfigurationResp,
			},
			req: &partnerpb.ListConfigurationSourcesRequest{},

			want: &policyData{
				PartnerID: proto.String(expressID),
			},
		},
		{
			name: "ListConfigurationSourcesRequest - fails when GetPartnerConfigurationByID fails",
			dBService: mockDBService{
				getPartnerConfigurationByIDErr: pgx.ErrTxClosed,
			},
			req: &partnerpb.ListConfigurationSourcesRequest{},

			wantErr: true,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			server, _ := NewServer(&ServerParams{
				PatientsClient: &test.patientsService,
				DBService:      &test.dBService,
				Logger:         logger,
			})

			data, err := server.SerializePolicyResource(ctx, test.req)

			if test.want != nil {
				testutils.MustMatch(t, data, *test.want)
			} else {
				testutils.MustMatch(t, data, nil)
			}

			testutils.MustMatch(t, err != nil, test.wantErr)
		})
	}
}

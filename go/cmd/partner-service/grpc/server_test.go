package grpc

import (
	"context"
	"database/sql"
	"errors"
	"testing"

	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/aws/aws-sdk-go-v2/aws"
	fsruntime "github.com/aws/aws-sdk-go-v2/service/sagemakerfeaturestoreruntime"
	"google.golang.org/grpc"
)

type mockDBService struct {
	addCareRequestPartner                            partnersql.CareRequestPartner
	addCareRequestPartnerErr                         error
	addLocationResp                                  sql.NullInt64
	addLocationErr                                   error
	addPartnerResp                                   partnersql.Partner
	addPartnerErr                                    error
	addPartnerAssociationBackfillResp                partnersql.CareRequestPartnerBackfill
	addPartnerAssociationBackfillErr                 error
	completePartnerAssociationBackfillByIDResp       partnersql.CareRequestPartnerBackfill
	completePartnerAssociationBackfillByIDErr        error
	deleteCareRequestPartnerResp                     partnersql.CareRequestPartner
	deleteCareRequestPartnerErr                      error
	getCareRequestPartnersByStationCareRequestIDResp []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow
	getCareRequestPartnersByStationCareRequestIDErr  error
	getInProgressBackfillByPartnerAndTypeResp        partnersql.CareRequestPartnerBackfill
	getInProgressBackfillByPartnerAndTypeErr         error
	getInsuranceByCareRequestAndOriginSourceResp     partnersql.Partner
	getInsuranceByCareRequestAndOriginPopHealthResp  partnersql.Partner
	getInsuranceByCareRequestAndOriginSourceErr      error
	getInsuranceByCareRequestAndOriginPopHealthErr   error
	getPartnerByIDResp                               partnersql.GetPartnerByIDRow
	getPartnerByIDErr                                error
	getPartnerByStationChannelItemIDResp             partnersql.Partner
	getPartnerByStationChannelItemIDErr              error
	getPartnerConfigurationByExpressIDResp           partnersql.PartnerConfiguration
	getPartnerConfigurationByExpressIDErr            error
	getPartnerConfigurationByIDResp                  partnersql.GetPartnerConfigurationByIDRow
	getPartnerConfigurationByIDErr                   error
	getPartnersByInsurancePackagesResp               []*partnersql.Partner
	getPartnersByInsurancePackagesErr                error
	getPartnersByStationChannelItemIDListResp        []*partnersql.Partner
	getPartnersByStationChannelItemIDListErr         error
	getPendingBackfillsResp                          []*partnersql.CareRequestPartnerBackfill
	getPendingBackfillsErr                           error
	getSourceCareRequestPartnerByCareRequestIDResp   partnersql.CareRequestPartner
	getSourceCareRequestPartnerByCareRequestIDErr    error
	searchPartnersByLatLngResp                       []*partnersql.SearchPartnersByLatLngRow
	searchPartnersByLatLngErr                        error
	searchPartnersByNameResp                         []*partnersql.SearchPartnersByNameRow
	searchPartnersByNameErr                          error
	updatePartnerErr                                 error
	updatePartnerAssociationBackfillByIDResp         partnersql.CareRequestPartnerBackfill
	updatePartnerAssociationBackfillByIDErr          error
}

func (m *mockDBService) AddCareRequestPartner(context.Context, partnersql.AddCareRequestPartnerParams) (*partnersql.CareRequestPartner, error) {
	return &m.addCareRequestPartner, m.addCareRequestPartnerErr
}

func (m *mockDBService) AddLocation(context.Context, *partnerpb.Location) (sql.NullInt64, error) {
	return m.addLocationResp, m.addLocationErr
}

func (m *mockDBService) AddPartner(context.Context, partnersql.AddPartnerParams) (*partnersql.Partner, error) {
	return &m.addPartnerResp, m.addPartnerErr
}

func (m *mockDBService) AddPartnerAssociationBackfill(context.Context, partnersql.AddPartnerAssociationBackfillParams) (*partnersql.CareRequestPartnerBackfill, error) {
	return &m.addPartnerAssociationBackfillResp, m.addPartnerAssociationBackfillErr
}

func (m *mockDBService) CompletePartnerAssociationBackfillByID(context.Context, partnersql.CompletePartnerAssociationBackfillByIDParams) (*partnersql.CareRequestPartnerBackfill, error) {
	return &m.completePartnerAssociationBackfillByIDResp, m.completePartnerAssociationBackfillByIDErr
}

func (m *mockDBService) DeleteCareRequestPartner(context.Context, int64) (*partnersql.CareRequestPartner, error) {
	return &m.deleteCareRequestPartnerResp, m.deleteCareRequestPartnerErr
}

func (m *mockDBService) GetCareRequestPartnersByStationCareRequestID(context.Context, int64) ([]*partnersql.GetCareRequestPartnersByStationCareRequestIDRow, error) {
	return m.getCareRequestPartnersByStationCareRequestIDResp, m.getCareRequestPartnersByStationCareRequestIDErr
}

func (m *mockDBService) GetInProgressBackfillByPartnerAndType(context.Context, partnersql.GetInProgressBackfillByPartnerAndTypeParams) (*partnersql.CareRequestPartnerBackfill, error) {
	return &m.getInProgressBackfillByPartnerAndTypeResp, m.getInProgressBackfillByPartnerAndTypeErr
}

func (m *mockDBService) GetInsuranceByCareRequestAndOrigin(ctx context.Context, params partnersql.GetInsuranceByCareRequestAndOriginParams) (*partnersql.Partner, error) {
	if params.CareRequestPartnerOriginSlug == sourceSlug {
		return &m.getInsuranceByCareRequestAndOriginSourceResp, m.getInsuranceByCareRequestAndOriginSourceErr
	}
	return &m.getInsuranceByCareRequestAndOriginPopHealthResp, m.getInsuranceByCareRequestAndOriginPopHealthErr
}

func (m *mockDBService) GetPartnerByID(context.Context, int64) (*partnersql.GetPartnerByIDRow, error) {
	return &m.getPartnerByIDResp, m.getPartnerByIDErr
}

func (m *mockDBService) GetPartnerByStationChannelItemID(context.Context, int64) (*partnersql.Partner, error) {
	return &m.getPartnerByStationChannelItemIDResp, m.getPartnerByStationChannelItemIDErr
}

func (m *mockDBService) GetPartnerConfigurationByExpressID(context.Context, string) (*partnersql.PartnerConfiguration, error) {
	return &m.getPartnerConfigurationByExpressIDResp, m.getPartnerConfigurationByExpressIDErr
}

func (m *mockDBService) GetPartnerConfigurationByID(context.Context, int64) (*partnersql.GetPartnerConfigurationByIDRow, error) {
	return &m.getPartnerConfigurationByIDResp, m.getPartnerConfigurationByIDErr
}

func (m *mockDBService) GetPartnersByInsurancePackages(context.Context, []int64) ([]*partnersql.Partner, error) {
	return m.getPartnersByInsurancePackagesResp, m.getPartnersByInsurancePackagesErr
}

func (m *mockDBService) GetPartnersByStationChannelItemIDList(context.Context, []int64) ([]*partnersql.Partner, error) {
	return m.getPartnersByStationChannelItemIDListResp, m.getPartnersByStationChannelItemIDListErr
}

func (m *mockDBService) GetPendingBackfills(context.Context) ([]*partnersql.CareRequestPartnerBackfill, error) {
	return m.getPendingBackfillsResp, m.getPendingBackfillsErr
}

func (m *mockDBService) GetSourceCareRequestPartnerByCareRequestID(context.Context, int64) (*partnersql.CareRequestPartner, error) {
	return &m.getSourceCareRequestPartnerByCareRequestIDResp, m.getSourceCareRequestPartnerByCareRequestIDErr
}

func (m *mockDBService) SearchPartnersByLatLng(context.Context, partnersql.SearchPartnersByLatLngParams) ([]*partnersql.SearchPartnersByLatLngRow, error) {
	return m.searchPartnersByLatLngResp, m.searchPartnersByLatLngErr
}

func (m *mockDBService) SearchPartnersByName(context.Context, partnersql.SearchPartnersByNameParams) ([]*partnersql.SearchPartnersByNameRow, error) {
	return m.searchPartnersByNameResp, m.searchPartnersByNameErr
}

func (m *mockDBService) UpdatePartner(context.Context, partnersql.UpdatePartnerParams, *partnerdb.PartnerRelations) error {
	return m.updatePartnerErr
}

func (m *mockDBService) UpdatePartnerAssociationBackfillByID(context.Context, partnersql.UpdatePartnerAssociationBackfillByIDParams) (*partnersql.CareRequestPartnerBackfill, error) {
	return &m.updatePartnerAssociationBackfillByIDResp, m.updatePartnerAssociationBackfillByIDErr
}

type mockPopHealthSearchPatientClient struct {
	response *pophealthpb.SearchPatientResponse
	err      error
}

func (m *mockPopHealthSearchPatientClient) SearchPatient(context.Context, *pophealthpb.SearchPatientRequest, ...grpc.CallOption) (*pophealthpb.SearchPatientResponse, error) {
	return m.response, m.err
}

type mockInsuranceClient struct {
	response insurancepb.SearchInsuranceNetworksResponse
	err      error
}

func (m *mockInsuranceClient) SearchInsuranceNetworks(context.Context, *insurancepb.SearchInsuranceNetworksRequest, ...grpc.CallOption) (*insurancepb.SearchInsuranceNetworksResponse, error) {
	return &m.response, m.err
}

type mockPopHealthBackfillClient struct {
	updateBackfillFileStatusResp pophealthpb.UpdateBackfillFileStatusResponse
	updateBackfillFileStatusErr  error
}

func (m *mockPopHealthBackfillClient) UpdateBackfillFileStatus(context.Context, *pophealthpb.UpdateBackfillFileStatusRequest, ...grpc.CallOption) (*pophealthpb.UpdateBackfillFileStatusResponse, error) {
	return &m.updateBackfillFileStatusResp, m.updateBackfillFileStatusErr
}

type mockEpisodeClient struct {
	episodepb.EpisodeServiceClient

	numberOfListVisitsCalls int
	listVisitsResp          []*episodepb.ListVisitsResponse
	listVisitsErr           error
}

func (m *mockEpisodeClient) GetVisit(context.Context, *episodepb.GetVisitRequest, ...grpc.CallOption) (*episodepb.GetVisitResponse, error) {
	return nil, errors.New("unimplemented")
}

func (m *mockEpisodeClient) ListVisits(context.Context, *episodepb.ListVisitsRequest, ...grpc.CallOption) (*episodepb.ListVisitsResponse, error) {
	m.numberOfListVisitsCalls--
	if m.numberOfListVisitsCalls < 0 {
		return nil, m.listVisitsErr
	}

	return m.listVisitsResp[m.numberOfListVisitsCalls], nil
}

func (m *mockEpisodeClient) DuplicateVisit(context.Context, *episodepb.DuplicateVisitRequest, ...grpc.CallOption) (*episodepb.DuplicateVisitResponse, error) {
	return nil, errors.New("unimplemented")
}

func (m *mockEpisodeClient) GetVisitPossibleServiceLines(ctx context.Context, in *episodepb.GetVisitPossibleServiceLinesRequest, opts ...grpc.CallOption) (*episodepb.GetVisitPossibleServiceLinesResponse, error) {
	return nil, errors.New("unimplemented")
}

func (m *mockEpisodeClient) UpsertVisitETARange(ctx context.Context, in *episodepb.UpsertVisitETARangeRequest, opts ...grpc.CallOption) (*episodepb.UpsertVisitETARangeResponse, error) {
	return nil, errors.New("unimplemented")
}

func (m *mockEpisodeClient) SearchVisits(ctx context.Context, in *episodepb.SearchVisitsRequest, opts ...grpc.CallOption) (*episodepb.SearchVisitsResponse, error) {
	return nil, errors.New("unimplemented")
}

// byID implements sort.Interface for []*partnerpb.CareRequestPartner for deterministic testing.
type byID []*partnerpb.CareRequestPartner

type mockFeatureStore struct {
	GetRecordResp *fsruntime.GetRecordOutput
	GetRecordErr  error
}

func (m mockFeatureStore) GetRecord(context.Context, *fsruntime.GetRecordInput, ...func(*fsruntime.Options)) (*fsruntime.GetRecordOutput, error) {
	return m.GetRecordResp, m.GetRecordErr
}

func TestNewServer(t *testing.T) {
	tests := []struct {
		name         string
		serverParams ServerParams

		wantErr bool
	}{
		{
			name:         "returns success if awsconfig is not passed in",
			serverParams: ServerParams{},

			wantErr: false,
		},
		{
			name: "with valid feature store params",
			serverParams: ServerParams{
				AwsConfig:    &aws.Config{},
				FeatureStore: &mockFeatureStore{},
			},

			wantErr: false,
		},
	}
	for _, test := range tests {
		t.Run(test.name, func(t *testing.T) {
			_, err := NewServer(&test.serverParams)

			testutils.MustMatch(t, err != nil, test.wantErr)
		})
	}
}

// Helper functions.
func (a byID) Len() int           { return len(a) }
func (a byID) Swap(i, j int)      { a[i], a[j] = a[j], a[i] }
func (a byID) Less(i, j int) bool { return a[i].Id < a[j].Id }

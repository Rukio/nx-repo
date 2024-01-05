package grpc

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/aws/featurestore"
	episodepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/episode"
	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	pophealthpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/pophealth"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/aws/aws-sdk-go-v2/aws"
	"go.uber.org/zap"
	"google.golang.org/grpc"
)

type DBService interface {
	AddCareRequestPartner(context.Context, partnersql.AddCareRequestPartnerParams) (*partnersql.CareRequestPartner, error)
	AddLocation(context.Context, *partnerpb.Location) (sql.NullInt64, error)
	AddPartner(context.Context, partnersql.AddPartnerParams) (*partnersql.Partner, error)
	AddPartnerAssociationBackfill(context.Context, partnersql.AddPartnerAssociationBackfillParams) (*partnersql.CareRequestPartnerBackfill, error)
	CompletePartnerAssociationBackfillByID(context.Context, partnersql.CompletePartnerAssociationBackfillByIDParams) (*partnersql.CareRequestPartnerBackfill, error)
	DeleteCareRequestPartner(context.Context, int64) (*partnersql.CareRequestPartner, error)
	GetCareRequestPartnersByStationCareRequestID(context.Context, int64) ([]*partnersql.GetCareRequestPartnersByStationCareRequestIDRow, error)
	GetInProgressBackfillByPartnerAndType(context.Context, partnersql.GetInProgressBackfillByPartnerAndTypeParams) (*partnersql.CareRequestPartnerBackfill, error)
	GetInsuranceByCareRequestAndOrigin(context.Context, partnersql.GetInsuranceByCareRequestAndOriginParams) (*partnersql.Partner, error)
	GetPartnerByID(context.Context, int64) (*partnersql.GetPartnerByIDRow, error)
	GetPartnerByStationChannelItemID(context.Context, int64) (*partnersql.Partner, error)
	GetPartnerConfigurationByExpressID(context.Context, string) (*partnersql.PartnerConfiguration, error)
	GetPartnerConfigurationByID(context.Context, int64) (*partnersql.GetPartnerConfigurationByIDRow, error)
	GetPartnersByInsurancePackages(context.Context, []int64) ([]*partnersql.Partner, error)
	GetPartnersByStationChannelItemIDList(context.Context, []int64) ([]*partnersql.Partner, error)
	GetPendingBackfills(context.Context) ([]*partnersql.CareRequestPartnerBackfill, error)
	GetSourceCareRequestPartnerByCareRequestID(context.Context, int64) (*partnersql.CareRequestPartner, error)
	SearchPartnersByLatLng(context.Context, partnersql.SearchPartnersByLatLngParams) ([]*partnersql.SearchPartnersByLatLngRow, error)
	SearchPartnersByName(context.Context, partnersql.SearchPartnersByNameParams) ([]*partnersql.SearchPartnersByNameRow, error)
	UpdatePartner(context.Context, partnersql.UpdatePartnerParams, *partnerdb.PartnerRelations) error
	UpdatePartnerAssociationBackfillByID(context.Context, partnersql.UpdatePartnerAssociationBackfillByIDParams) (*partnersql.CareRequestPartnerBackfill, error)
}

type BackfillFileService interface {
	UpdateBackfillFileStatus(context.Context, *pophealthpb.UpdateBackfillFileStatusRequest, ...grpc.CallOption) (*pophealthpb.UpdateBackfillFileStatusResponse, error)
}

type InsuranceService interface {
	SearchInsuranceNetworks(context.Context, *insurancepb.SearchInsuranceNetworksRequest, ...grpc.CallOption) (*insurancepb.SearchInsuranceNetworksResponse, error)
}

type BackfillBatchingParams struct {
	SleepTimeBetweenBatches time.Duration
	BatchSize               int32
}

type ServerParams struct {
	AwsConfig                    *aws.Config
	DBService                    DBService
	PopHealthSearchPatientClient pophealthpb.SearchPatientServiceClient
	PopHealthBackfillClient      BackfillFileService
	EpisodeClient                episodepb.EpisodeServiceClient
	InsuranceClient              InsuranceService
	FeatureGroupName             string
	FeatureName                  string
	FeatureStore                 featurestore.FeatureStore
	BackfillBatchingParams       BackfillBatchingParams
	Logger                       *zap.SugaredLogger
}

type Server struct {
	partnerpb.UnimplementedPartnerServiceServer

	DBService                    DBService
	Logger                       *zap.SugaredLogger
	PopHealthSearchPatientClient pophealthpb.SearchPatientServiceClient
	PopHealthBackfillClient      BackfillFileService
	EpisodeClient                episodepb.EpisodeServiceClient
	InsuranceClient              InsuranceService
	FeatureStoreClient           *featurestore.Client
	FeatureGroupName             string
	FeatureName                  string
	BackfillBatchingParams       BackfillBatchingParams
}

func NewServer(serverParams *ServerParams) (*Server, error) {
	server := &Server{
		DBService:                    serverParams.DBService,
		Logger:                       serverParams.Logger,
		PopHealthSearchPatientClient: serverParams.PopHealthSearchPatientClient,
		PopHealthBackfillClient:      serverParams.PopHealthBackfillClient,
		EpisodeClient:                serverParams.EpisodeClient,
		InsuranceClient:              serverParams.InsuranceClient,
		FeatureGroupName:             serverParams.FeatureGroupName,
		FeatureName:                  serverParams.FeatureName,
		BackfillBatchingParams:       serverParams.BackfillBatchingParams,
	}

	if serverParams.AwsConfig != nil {
		client, err := featurestore.NewClient(featurestore.ClientParams{
			AwsConfig: serverParams.AwsConfig,
		})
		if err != nil {
			return nil, err
		}

		server.FeatureStoreClient = client
	}

	return server, nil
}

func (s *Server) getPartnersMapFromPophealthPatients(ctx context.Context, patients []*pophealthpb.Patient) (map[int64]struct{}, error) {
	matchingChannelItemIds := make([]int64, len(patients))
	for i, patient := range patients {
		matchingChannelItemIds[i] = patient.GetChannelItemId()
	}

	popHealthPartners, err := s.DBService.GetPartnersByStationChannelItemIDList(ctx, matchingChannelItemIds)
	if err != nil {
		return nil, fmt.Errorf("GetPartnersByStationChannelItemIDList error: %w", err)
	}

	if len(popHealthPartners) != len(matchingChannelItemIds) {
		s.Logger.Warnw("Inactive partners found in pophealth patients",
			"numInactivePartners", len(matchingChannelItemIds)-len(popHealthPartners),
			"matchingChannelItemIds", matchingChannelItemIds,
		)
	}

	popHealthPartnerMap := make(map[int64]struct{})
	for _, popHealthPartner := range popHealthPartners {
		popHealthPartnerMap[popHealthPartner.ID] = struct{}{}
	}
	return popHealthPartnerMap, nil
}

func (s *Server) updateCareRequestPartnerAssociations(
	ctx context.Context,
	careRequestID int64,
	careRequestPartners []*partnersql.GetCareRequestPartnersByStationCareRequestIDRow,
	newPartnersMap map[int64]struct{},
	originSlug string,
) ([]*partnerpb.CareRequestPartner, error) {
	response := []*partnerpb.CareRequestPartner{}
	for _, careRequestPartner := range careRequestPartners {
		if careRequestPartner.CareRequestPartnerOriginSlug != originSlug {
			continue
		}

		if _, exists := newPartnersMap[careRequestPartner.PartnerID]; exists {
			delete(newPartnersMap, careRequestPartner.PartnerID)
			response = append(response, &partnerpb.CareRequestPartner{
				Origin: partnerdb.OriginSlugToCareRequestPartnerOrigin[originSlug],
				Id:     careRequestPartner.PartnerID,
			})
			continue
		}

		_, err := s.DBService.DeleteCareRequestPartner(ctx, careRequestPartner.ID)
		if err != nil {
			return nil, fmt.Errorf("DeleteCareRequestPartner error: %w", err)
		}
	}

	for partnerID := range newPartnersMap {
		_, err := s.DBService.AddCareRequestPartner(ctx, partnersql.AddCareRequestPartnerParams{
			StationCareRequestID:         careRequestID,
			PartnerID:                    partnerID,
			CareRequestPartnerOriginSlug: originSlug,
		})
		if err != nil {
			return nil, fmt.Errorf("AddCareRequestPartner error: %w", err)
		}

		response = append(response, &partnerpb.CareRequestPartner{
			Origin: partnerdb.OriginSlugToCareRequestPartnerOrigin[originSlug],
			Id:     partnerID,
		})
	}
	return response, nil
}

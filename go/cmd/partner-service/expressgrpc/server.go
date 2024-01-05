package expressgrpc

import (
	"context"
	"errors"
	"strconv"
	"sync"

	partnerpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/partner"
	patientspb "github.com/*company-data-covered*/services/go/pkg/generated/proto/patients"
	partnersql "github.com/*company-data-covered*/services/go/pkg/generated/sql/partner"
	"github.com/*company-data-covered*/services/go/pkg/partner/partnerdb"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"google.golang.org/grpc"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type DBService interface {
	AddMarket(context.Context, partnersql.AddMarketParams) (*partnersql.Market, error)
	AddPartnerConfigurationSource(context.Context, *partnerpb.Location, partnersql.AddPartnerConfigurationSourceParams) (*partnersql.PartnerConfigurationSource, error)
	CountPartnerConfigurations(context.Context, partnersql.CountPartnerConfigurationsParams) (int64, error)
	CreatePartnerConfigurationMarketAndServiceLines(context.Context, *partnerpb.Market) (*partnersql.PartnerConfigurationMarket, map[int64]*partnersql.ServiceLine, error)
	DeleteMarket(context.Context, int64) (*partnerdb.PartnerConfigurationMarket, error)
	DeletePartnerConfiguration(context.Context, int64) (*partnersql.PartnerConfiguration, error)
	GetEmailDomainsByPartnerConfigurationID(context.Context, int64) ([]*partnersql.EmailDomain, error)
	GetMarketByStationMarketID(context.Context, int64) (*partnersql.Market, error)
	GetMarketsAndServiceLinesByIDOrPartnerConfigID(context.Context, partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDParams) ([]*partnersql.GetMarketsAndServiceLinesByIDOrPartnerConfigIDRow, error)
	GetPartnerByID(context.Context, int64) (*partnersql.GetPartnerByIDRow, error)
	GetPartnerConfigurationByExpressID(context.Context, string) (*partnersql.PartnerConfiguration, error)
	GetPartnerConfigurationByID(context.Context, int64) (*partnersql.GetPartnerConfigurationByIDRow, error)
	GetPartnerConfigurationMarketByID(context.Context, int64) (*partnersql.PartnerConfigurationMarket, error)
	GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketID(
		context.Context, partnersql.GetPartnerConfigurationMarketByPartnerConfigurationIDAndMarketIDParams) (*partnersql.PartnerConfigurationMarket, error)
	GetPartnerConfigurationSourceByID(context.Context, int64) (*partnersql.GetPartnerConfigurationSourceByIDRow, error)
	GetPartnerConfigurationSourcesByPartnerConfigurationID(context.Context, int64) ([]*partnersql.GetPartnerConfigurationSourcesByPartnerConfigurationIDRow, error)
	GetPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationID(context.Context, partnersql.GetPartnerConfigurationSourceByPartnerIDAndPartnerConfigurationIDParams) (*partnersql.PartnerConfigurationSource, error)
	GetPophealthChannelItemsByPartnerConfigurationID(context.Context, int64) ([]int64, error)
	GetServiceLinesByExpressIDAndMarketID(context.Context, partnersql.GetServiceLinesByExpressIDAndMarketIDParams) ([]*partnersql.ServiceLine, error)
	SearchPartnerConfigurations(context.Context, partnersql.SearchPartnerConfigurationsParams) ([]*partnersql.SearchPartnerConfigurationsRow, error)
	SearchPartnersByName(context.Context, partnersql.SearchPartnersByNameParams) ([]*partnersql.SearchPartnersByNameRow, error)
	UpdatePartnerConfigurationMarketServiceLines(context.Context, *partnersql.PartnerConfigurationMarket, []*partnerpb.ServiceLine) (map[int64]*partnersql.ServiceLine, error)
	UpsertPartnerConfiguration(context.Context, *partnerpb.PartnerConfiguration) (*partnersql.GetPartnerConfigurationByIDRow, error)
}

type PatientsService interface {
	GetPatient(context.Context, *patientspb.GetPatientRequest, ...grpc.CallOption) (*patientspb.GetPatientResponse, error)
}

type ServerParams struct {
	Logger         *zap.SugaredLogger
	PatientsClient PatientsService
	DBService      DBService
}

type Server struct {
	partnerpb.UnimplementedExpressServiceServer

	Logger         *zap.SugaredLogger
	PatientsClient PatientsService
	PatientMap     sync.Map
	DBService      DBService
}

type policyData struct {
	PartnerID *string `json:"partner_id"`
}

func (s *Server) SerializePolicyResource(ctx context.Context, req any) (any, error) {
	switch request := req.(type) {
	case *partnerpb.CreateConfigurationRequest:
		return policyData{}, nil
	case *partnerpb.CreateConfigurationSourceRequest:
		return s.serializeCreateConfigurationSource(ctx, request)
	case *partnerpb.CreateMarketRequest:
		return s.serializeCreateMarket(ctx, request)
	case *partnerpb.DeleteConfigurationRequest:
		return s.serializeDeleteConfiguration(ctx, request)
	case *partnerpb.DeleteMarketRequest:
		return s.serializeDeleteMarket(ctx, request)
	case *partnerpb.ExpressServiceSearchPartnersRequest:
		return policyData{}, nil
	case *partnerpb.GetConfigurationRequest:
		return s.serializeGetConfiguration(ctx, request)
	case *partnerpb.GetConfigurationSourceRequest:
		return s.serializeGetConfigurationSource(ctx, request)
	case *partnerpb.GetMarketRequest:
		return s.serializeGetMarket(ctx, request)
	case *partnerpb.GetPatientRequest:
		return s.serializeGetPatient(ctx, request)
	case *partnerpb.ListConfigurationSourcesRequest:
		return s.serializeListConfigurationSources(ctx, request)
	case *partnerpb.ListConfigurationsRequest:
		return policyData{}, nil
	case *partnerpb.ListMarketsRequest:
		return s.serializeListMarkets(ctx, request)
	case *partnerpb.ListServiceLinesRequest:
		return s.serializeListServiceLines(ctx, request)
	case *partnerpb.UpdateMarketRequest:
		return s.serializeUpdateMarket(ctx, request)
	default:
		return nil, status.Errorf(codes.Internal, "unexpected request")
	}
}

func (s *Server) serializeCreateMarket(ctx context.Context, req *partnerpb.CreateMarketRequest) (any, error) {
	return s.getPolicyFromMarket(ctx, req.Market)
}

func (s *Server) serializeCreateConfigurationSource(ctx context.Context, req *partnerpb.CreateConfigurationSourceRequest) (any, error) {
	return s.getPolicyFromSource(ctx, req.Source)
}

func (s *Server) serializeDeleteConfiguration(ctx context.Context, req *partnerpb.DeleteConfigurationRequest) (any, error) {
	partnerID, err := s.getExpressIDFromPartnerConfigurationID(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	policyData := policyData{
		PartnerID: &partnerID,
	}
	return policyData, nil
}

func (s *Server) serializeDeleteMarket(ctx context.Context, req *partnerpb.DeleteMarketRequest) (any, error) {
	return s.getPolicyFromPartnerConfigMarketID(ctx, req.Id)
}

func (s *Server) serializeGetConfiguration(ctx context.Context, req *partnerpb.GetConfigurationRequest) (any, error) {
	partnerID := req.PartnerConfigurationId
	partnerConfigurationID, err := strconv.ParseInt(req.PartnerConfigurationId, 10, 64)
	if err == nil {
		partnerID, err = s.getExpressIDFromPartnerConfigurationID(ctx, partnerConfigurationID)
		if err != nil {
			return nil, err
		}
	}

	policyData := policyData{
		PartnerID: &partnerID,
	}
	return policyData, nil
}

func (s *Server) serializeGetConfigurationSource(ctx context.Context, req *partnerpb.GetConfigurationSourceRequest) (any, error) {
	configurationSource, err := s.DBService.GetPartnerConfigurationSourceByID(ctx, req.Id)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "PartnerConfigurationSource with ID %v was not found", req.Id)
		}
		return nil, status.Errorf(codes.Internal, "GetPartnerConfigurationSourceByID error: %v", err)
	}
	partnerID, err := s.getExpressIDFromPartnerConfigurationID(ctx, configurationSource.PartnerConfigurationID)
	if err != nil {
		return nil, err
	}
	return policyData{
		PartnerID: &partnerID,
	}, nil
}

func (s *Server) serializeGetMarket(ctx context.Context, req *partnerpb.GetMarketRequest) (any, error) {
	return s.getPolicyFromPartnerConfigMarketID(ctx, req.Id)
}

func (s *Server) serializeGetPatient(ctx context.Context, req *partnerpb.GetPatientRequest) (any, error) {
	patientID := req.PatientId
	res, err := s.PatientsClient.GetPatient(ctx, &patientspb.GetPatientRequest{
		PatientId: &patientID,
	})
	if err != nil {
		s.Logger.Errorw("GetPatient error", zap.Error(err))
		return nil, status.Errorf(codes.NotFound, "Patient with ID %v was not found", patientID)
	}

	policyData := policyData{
		PartnerID: res.Patient.PartnerId,
	}

	if res.Patient.PartnerId != nil {
		s.PatientMap.Store(patientID, res.Patient)
	}

	return policyData, nil
}

func (s *Server) serializeListConfigurationSources(ctx context.Context, req *partnerpb.ListConfigurationSourcesRequest) (any, error) {
	partnerID, err := s.getExpressIDFromPartnerConfigurationID(ctx, req.PartnerConfigurationId)
	if err != nil {
		return nil, err
	}

	return policyData{
		PartnerID: &partnerID,
	}, nil
}

func (s *Server) serializeListServiceLines(_ context.Context, req *partnerpb.ListServiceLinesRequest) (any, error) {
	return policyData{
		PartnerID: &req.PartnerId,
	}, nil
}

func (s *Server) serializeListMarkets(ctx context.Context, req *partnerpb.ListMarketsRequest) (any, error) {
	partnerID, err := s.getExpressIDFromPartnerConfigurationID(ctx, req.PartnerConfigurationId)
	if err != nil {
		return nil, err
	}

	policyData := policyData{
		PartnerID: &partnerID,
	}
	return policyData, nil
}

func (s *Server) serializeUpdateMarket(ctx context.Context, req *partnerpb.UpdateMarketRequest) (any, error) {
	return s.getPolicyFromMarket(ctx, req.Market)
}

func (s *Server) getPolicyFromMarket(ctx context.Context, market *partnerpb.Market) (any, error) {
	if market == nil {
		return nil, status.Errorf(codes.InvalidArgument, "Market is required")
	}

	partnerID, err := s.getExpressIDFromPartnerConfigurationID(ctx, market.PartnerConfigurationId)
	if err != nil {
		return nil, err
	}

	policyData := policyData{
		PartnerID: &partnerID,
	}
	return policyData, nil
}

func (s *Server) getPolicyFromSource(ctx context.Context, source *partnerpb.Source) (any, error) {
	if source == nil {
		return nil, status.Errorf(codes.InvalidArgument, "Source is required")
	}

	partnerID, err := s.getExpressIDFromPartnerConfigurationID(ctx, source.PartnerConfigurationId)
	if err != nil {
		return nil, err
	}

	return policyData{
		PartnerID: &partnerID,
	}, nil
}

func (s *Server) getPolicyFromPartnerConfigMarketID(ctx context.Context, partnerConfigMarketID int64) (any, error) {
	partnerConfigMarket, err := s.DBService.GetPartnerConfigurationMarketByID(ctx, partnerConfigMarketID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, "PartnerConfigurationMarket with ID %v was not found", partnerConfigMarketID)
		}
		return nil, status.Errorf(codes.Internal, "GetPartnerConfigurationMarketByID error: %v", err)
	}

	partnerID, err := s.getExpressIDFromPartnerConfigurationID(ctx, partnerConfigMarket.PartnerConfigurationID)
	if err != nil {
		return nil, err
	}

	policyData := policyData{
		PartnerID: &partnerID,
	}
	return policyData, nil
}

func (s *Server) getExpressIDFromPartnerConfigurationID(ctx context.Context, partnerConfigurationID int64) (string, error) {
	configuration, err := s.DBService.GetPartnerConfigurationByID(ctx, partnerConfigurationID)
	if err != nil {
		if errors.Is(err, pgx.ErrNoRows) {
			return "", status.Errorf(codes.NotFound, "PartnerConfiguration with ID %v was not found", partnerConfigurationID)
		}
		return "", status.Errorf(codes.Internal, "GetPartnerConfigurationByID error: %v", err)
	}

	if !configuration.ExpressID.Valid {
		return "", status.Error(codes.Internal, "ExpressID is invalid")
	}

	return configuration.ExpressID.String, nil
}

func NewServer(serverParams *ServerParams) (*Server, error) {
	server := &Server{
		Logger:         serverParams.Logger,
		PatientsClient: serverParams.PatientsClient,
		DBService:      serverParams.DBService,
	}

	return server, nil
}

package main

import (
	"context"
	"errors"
	"fmt"

	"github.com/*company-data-covered*/services/go/cmd/insurance-service/insurancedb"
	insurancepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance"
	insuranceplanpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/insurance_plan"
	payergrouppb "github.com/*company-data-covered*/services/go/pkg/generated/proto/payer_group"
	statepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/state"
	insurancesql "github.com/*company-data-covered*/services/go/pkg/generated/sql/insurance"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"github.com/*company-data-covered*/services/go/pkg/station"
	"github.com/jackc/pgx/v4"
	"go.uber.org/zap"
	"golang.org/x/exp/slices"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const (
	errorInsuranceNetworkNotFound  = "InsuranceNetwork with ID %d does not exist"
	errorInsurancePayerNotFound    = "InsurancePayer with ID %d does not exist"
	errorListInsurancePayers       = "failed to list InsurancePayers: %s"
	errorListInsuranceNetworks     = "failed to list InsuranceNetworks: %s"
	errorInsuranceNetworkCreate    = "failed to create InsuranceNetwork: %s"
	errorInsuranceNetworkUpdate    = "failed to update InsuranceNetwork with id %d: %s"
	errorInvalidInsuranceNetworkID = "network_id should be greater than 0"
)

// InsuranceDB demands what the grpc server needs from a DB implementation. Primarily for mocking purposes.
type InsuranceDB interface {
	CreateInsurancePayer(context.Context, insurancesql.CreateInsurancePayerParams) (*insurancesql.InsurancePayer, error)
	DeleteInsurancePayer(context.Context, int64) (*insurancesql.InsurancePayer, error)
	GetInsuranceNetwork(context.Context, int64) (*insurancesql.InsuranceNetwork, error)
	GetInsuranceNetworkByInsurancePlanID(context.Context, int64) (*insurancesql.GetInsuranceNetworkByInsurancePlanIDRow, error)
	SearchInsuranceNetworks(context.Context, insurancesql.SearchInsuranceNetworksParams) ([]*insurancesql.SearchInsuranceNetworksRow, error)
	GetInsuranceNetworkAddressByInsuranceNetworksIDs(context.Context, []int64) ([]*insurancesql.InsuranceNetworkAddress, error)
	GetInsuranceNetworkStatesByInsuranceNetworksIDs(context.Context, []int64) ([]*insurancesql.InsuranceNetworkState, error)
	GetInsurancePayer(context.Context, int64) (*insurancesql.InsurancePayer, error)
	GetInsurancePayersWithFilterAndOrder(context.Context, insurancesql.GetInsurancePayersWithFilterAndOrderParams) ([]*insurancesql.InsurancePayer, error)
	UpdateInsurancePayer(context.Context, insurancesql.UpdateInsurancePayerParams) (*insurancesql.InsurancePayer, error)
	CreateInsuranceNetwork(context.Context, insurancesql.CreateInsuranceNetworkParams, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams) (*insurancesql.InsuranceNetwork, error)
	UpdateInsuranceNetwork(context.Context, insurancesql.UpdateInsuranceNetworkParams, []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams) (*insurancesql.InsuranceNetwork, error)
	UpdateInsuranceNetworkStates(context.Context, int64, []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams) ([]*insurancesql.InsuranceNetworkState, error)
	UpdateInsuranceNetworkAppointmentTypes(context.Context, insurancedb.UpdateInsuranceNetworkAppointmentTypesParams) ([]*insurancesql.InsuranceNetworksAppointmentType, error)
	GetInsuranceNetworkAppointmentTypesByInsuranceNetworkID(ctx context.Context, params insurancesql.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkIDParams) ([]*insurancesql.InsuranceNetworksAppointmentType, error)

	IsHealthy(context.Context) bool
}

// a compile-time assertion that our assumed implementation satisfies the above interface.
var _ InsuranceDB = (*insurancedb.InsuranceDB)(nil)

type InsuranceGRPCServer struct {
	insurancepb.UnimplementedInsuranceServiceServer
	Logger               *zap.SugaredLogger
	InsuranceDB          InsuranceDB
	StationClient        *station.Client
	PayerGroupService    payergrouppb.PayerGroupServiceClient
	StateService         statepb.StateServiceClient
	InsurancePlanService insuranceplanpb.InsurancePlanServiceClient
}

func (s *InsuranceGRPCServer) CreateInsurancePayer(ctx context.Context, r *insurancepb.CreateInsurancePayerRequest) (*insurancepb.CreateInsurancePayerResponse, error) {
	createInsurancePayerParams, err := CreateInsurancePayerSQLParamsFromCreateInsurancePayerProtoRequest(r)
	if err != nil {
		s.Logger.Errorf("Failed to create InsurancePayer: %s", err)
		return nil, err
	}

	dbInsurancePayer, err := s.InsuranceDB.CreateInsurancePayer(ctx, *createInsurancePayerParams)
	if err != nil {
		s.Logger.Errorf("failed to create InsurancePayer: %s", err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	insurancePayer := InsurancePayerProtoFromInsurancePayerSQL(dbInsurancePayer)

	return &insurancepb.CreateInsurancePayerResponse{Payer: insurancePayer}, nil
}

func (s *InsuranceGRPCServer) DeleteInsurancePayer(ctx context.Context, r *insurancepb.DeleteInsurancePayerRequest) (*insurancepb.DeleteInsurancePayerResponse, error) {
	payerID := r.GetPayerId()
	if payerID <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, "payer_id should be greater than 0")
	}

	_, err := s.InsuranceDB.DeleteInsurancePayer(ctx, payerID)
	if err != nil {
		s.Logger.Errorf("failed to delete InsurancePayer with id %d: %s", payerID, err)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, fmt.Sprintf(errorInsurancePayerNotFound, payerID))
		}
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	return &insurancepb.DeleteInsurancePayerResponse{}, nil
}

func (s *InsuranceGRPCServer) GetInsuranceNetwork(ctx context.Context, r *insurancepb.GetInsuranceNetworkRequest) (*insurancepb.GetInsuranceNetworkResponse, error) {
	networkID := r.GetNetworkId()
	if networkID <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, errorInvalidInsuranceNetworkID)
	}

	dbInsuranceNetwork, err := s.InsuranceDB.GetInsuranceNetwork(ctx, networkID)
	if err != nil {
		s.Logger.Errorf("failed to get InsuranceNetwork with id %d: %s", networkID, err)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, fmt.Sprintf(errorInsuranceNetworkNotFound, networkID))
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	dbInsuranceNetworkAddresses, err := s.InsuranceDB.GetInsuranceNetworkAddressByInsuranceNetworksIDs(ctx, []int64{dbInsuranceNetwork.ID})
	if err != nil {
		s.Logger.Errorf(fmt.Sprintf(errorListInsuranceNetworks, err))

		return nil, status.Errorf(codes.Internal, err.Error())
	}

	dbInsuranceNetworkStates, err := s.InsuranceDB.GetInsuranceNetworkStatesByInsuranceNetworksIDs(ctx, []int64{dbInsuranceNetwork.ID})
	if err != nil {
		s.Logger.Errorf(fmt.Sprintf("failed to list InsuranceNetworkStates: %s", err))

		return nil, status.Errorf(codes.Internal, err.Error())
	}

	insuranceNetwork := InsuranceNetworkProtoFromInsuranceNetworkSQL(dbInsuranceNetwork, dbInsuranceNetworkAddresses)
	for _, dbInsuranceNetworkState := range dbInsuranceNetworkStates {
		insuranceNetwork.StateAbbrs = append(insuranceNetwork.StateAbbrs, dbInsuranceNetworkState.StateAbbr)
	}

	return &insurancepb.GetInsuranceNetworkResponse{Network: insuranceNetwork}, nil
}

func (s *InsuranceGRPCServer) GetInsuranceNetworkByInsurancePlanID(ctx context.Context, r *insurancepb.GetInsuranceNetworkByInsurancePlanIDRequest) (*insurancepb.GetInsuranceNetworkByInsurancePlanIDResponse, error) {
	insurancePlanID := r.GetInsurancePlanId()
	if insurancePlanID <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, "insurance_plan_id should be greater than 0")
	}

	dbInsuranceNetwork, err := s.InsuranceDB.GetInsuranceNetworkByInsurancePlanID(ctx, insurancePlanID)
	if err != nil {
		s.Logger.Warnf("failed to get InsuranceNetwork with insurance plan ID %d: %s", insurancePlanID, err)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, fmt.Sprintf("InsuranceNetwork with insurance plan ID %d does not exist", insurancePlanID))
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	dbInsuranceNetworkAddresses, err := s.InsuranceDB.GetInsuranceNetworkAddressByInsuranceNetworksIDs(ctx, []int64{dbInsuranceNetwork.ID})
	if err != nil {
		s.Logger.Errorf(fmt.Sprintf(errorListInsuranceNetworks, err))

		return nil, status.Errorf(codes.Internal, err.Error())
	}

	insuranceNetwork := InsuranceNetworkProtoFromGetInsuranceNetworkByInsurancePlanIDRowSQL(dbInsuranceNetwork, dbInsuranceNetworkAddresses)

	return &insurancepb.GetInsuranceNetworkByInsurancePlanIDResponse{Network: insuranceNetwork}, nil
}

func (s *InsuranceGRPCServer) GetInsurancePayer(ctx context.Context, r *insurancepb.GetInsurancePayerRequest) (*insurancepb.GetInsurancePayerResponse, error) {
	payerID := r.GetPayerId()
	if payerID <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, "payer_id should be greater than 0")
	}

	dbInsurancePayer, err := s.InsuranceDB.GetInsurancePayer(ctx, payerID)

	if err != nil {
		s.Logger.Errorf("failed to get InsurancePayer with id %d: %s", payerID, err)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, fmt.Sprintf(errorInsurancePayerNotFound, payerID))
		}
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	insurancePayer := InsurancePayerProtoFromInsurancePayerSQL(dbInsurancePayer)

	return &insurancepb.GetInsurancePayerResponse{Payer: insurancePayer}, nil
}

func (s *InsuranceGRPCServer) ListInsurancePayers(ctx context.Context, r *insurancepb.ListInsurancePayersRequest) (*insurancepb.ListInsurancePayersResponse, error) {
	getPayersParams := GetInsurancePayersWithFilterAndOrderSQLParamsFromListInsurancePayersProtoRequest(r)
	dbInsurancePayers, err := s.InsuranceDB.GetInsurancePayersWithFilterAndOrder(ctx, *getPayersParams)
	if err != nil {
		s.Logger.Errorf(fmt.Sprintf(errorListInsurancePayers, err))

		return nil, status.Errorf(codes.Internal, err.Error())
	}

	dbInsurancePayersLength := len(dbInsurancePayers)
	if dbInsurancePayersLength == 0 {
		return &insurancepb.ListInsurancePayersResponse{}, nil
	}

	insurancePayers := make(map[int64]*insurancepb.InsurancePayer, dbInsurancePayersLength)
	insurancePayersIds := make([]int64, dbInsurancePayersLength)

	for i, dbInsurancePayer := range dbInsurancePayers {
		insurancePayersIds[i] = dbInsurancePayer.ID
		insurancePayers[dbInsurancePayer.ID] = InsurancePayerProtoFromInsurancePayerSQL(dbInsurancePayer)
	}

	searchNetworksParams := SearchInsuranceNetworksSQLParamsFromListInsurancePayersProtoRequest(r, insurancePayersIds)
	dbInsuranceNetworks, err := s.InsuranceDB.SearchInsuranceNetworks(ctx, *searchNetworksParams)
	if err != nil {
		s.Logger.Errorf(fmt.Sprintf(errorListInsurancePayers, err))

		return nil, status.Errorf(codes.Internal, err.Error())
	}

	insuranceNetworksIds := make([]int64, len(dbInsuranceNetworks))
	for i, dbInsuranceNetwork := range dbInsuranceNetworks {
		insuranceNetworksIds[i] = dbInsuranceNetwork.ID
	}

	dbInsuranceNetworkStates, err := s.InsuranceDB.GetInsuranceNetworkStatesByInsuranceNetworksIDs(ctx, insuranceNetworksIds)
	if err != nil {
		s.Logger.Errorf(fmt.Sprintf(errorListInsurancePayers, err))

		return nil, status.Errorf(codes.Internal, err.Error())
	}

	for _, dbInsuranceNetwork := range dbInsuranceNetworks {
		payerID := dbInsuranceNetwork.InsurancePayerID
		insuranceNetwork := &insurancepb.InsurancePayer_InsuranceNetwork{
			Id:                        dbInsuranceNetwork.ID,
			Name:                      dbInsuranceNetwork.Name,
			PackageId:                 dbInsuranceNetwork.PackageID,
			InsuranceClassificationId: dbInsuranceNetwork.InsuranceClassificationID,
			InsurancePlanId:           dbInsuranceNetwork.InsurancePlanID,
		}

		insurancePayers[payerID].InsuranceNetworks = append(insurancePayers[payerID].InsuranceNetworks, insuranceNetwork)

		for _, dbInsuranceNetworkState := range dbInsuranceNetworkStates {
			if dbInsuranceNetworkState.InsuranceNetworkID == dbInsuranceNetwork.ID {
				if !slices.Contains(insurancePayers[payerID].StateAbbrs, dbInsuranceNetworkState.StateAbbr) {
					insurancePayers[payerID].StateAbbrs = append(insurancePayers[payerID].StateAbbrs, dbInsuranceNetworkState.StateAbbr)
				}
			}
		}
	}

	resultPayers := make([]*insurancepb.InsurancePayer, dbInsurancePayersLength)
	for i, insurancePayer := range dbInsurancePayers {
		resultPayers[i] = insurancePayers[insurancePayer.ID]
	}

	return &insurancepb.ListInsurancePayersResponse{
		Payers: resultPayers,
	}, nil
}

func (s *InsuranceGRPCServer) SearchInsuranceNetworks(ctx context.Context, r *insurancepb.SearchInsuranceNetworksRequest) (*insurancepb.SearchInsuranceNetworksResponse, error) {
	var eligibleNetworkIDs []int64
	if r.BillingCityId != nil {
		eligibleNetworksResp, err := s.listEligibleNetworks(ctx, StationListEligibleNetworksRequest{
			BillingCityID: r.BillingCityId,
		})
		if err != nil {
			if respStatus, ok := status.FromError(err); ok {
				return nil, status.Error(respStatus.Code(), err.Error())
			}

			return nil, status.Error(codes.Internal, err.Error())
		}

		eligibleNetworkIDs = eligibleNetworksResp
	}

	searchNetworksParams := SearchInsuranceNetworksSQLParamsFromSearchInsuranceNetworksProtoRequest(r, eligibleNetworkIDs)
	dbInsuranceNetworks, err := s.InsuranceDB.SearchInsuranceNetworks(ctx, *searchNetworksParams)
	if err != nil {
		s.Logger.Errorf(fmt.Sprintf(errorListInsuranceNetworks, err))

		return nil, status.Errorf(codes.Internal, err.Error())
	}

	dbInsuranceNetworksLength := len(dbInsuranceNetworks)
	if dbInsuranceNetworksLength == 0 {
		return &insurancepb.SearchInsuranceNetworksResponse{}, nil
	}

	insuranceNetworks := make(map[int64]*insurancepb.InsuranceNetwork, dbInsuranceNetworksLength)
	insuranceNetworksIds := make([]int64, dbInsuranceNetworksLength)
	for i, dbInsuranceNetwork := range dbInsuranceNetworks {
		insuranceNetworksIds[i] = dbInsuranceNetwork.ID
	}

	dbInsuranceNetworkAddresses, err := s.InsuranceDB.GetInsuranceNetworkAddressByInsuranceNetworksIDs(ctx, insuranceNetworksIds)
	if err != nil {
		s.Logger.Errorf(fmt.Sprintf(errorListInsuranceNetworks, err))

		return nil, status.Errorf(codes.Internal, err.Error())
	}
	addressesByNetworkID := make(map[int64][]*insurancesql.InsuranceNetworkAddress, dbInsuranceNetworksLength)

	for _, address := range dbInsuranceNetworkAddresses {
		addressesByNetworkID[address.InsuranceNetworkID] = append(addressesByNetworkID[address.InsuranceNetworkID], address)
	}

	for _, dbInsuranceNetwork := range dbInsuranceNetworks {
		insuranceNetworks[dbInsuranceNetwork.ID] = InsuranceNetworkProtoFromSearchInsuranceNetworksRowSQL(dbInsuranceNetwork, addressesByNetworkID[dbInsuranceNetwork.ID])
	}

	dbInsuranceNetworkStates, err := s.InsuranceDB.GetInsuranceNetworkStatesByInsuranceNetworksIDs(ctx, insuranceNetworksIds)
	if err != nil {
		s.Logger.Errorf(fmt.Sprintf(errorListInsuranceNetworks, err))

		return nil, status.Errorf(codes.Internal, err.Error())
	}

	for _, dbInsuranceNetworkState := range dbInsuranceNetworkStates {
		if !slices.Contains(insuranceNetworks[dbInsuranceNetworkState.InsuranceNetworkID].StateAbbrs, dbInsuranceNetworkState.StateAbbr) {
			insuranceNetworks[dbInsuranceNetworkState.InsuranceNetworkID].StateAbbrs = append(insuranceNetworks[dbInsuranceNetworkState.InsuranceNetworkID].StateAbbrs, dbInsuranceNetworkState.StateAbbr)
		}
	}

	resultNetworks := make([]*insurancepb.InsuranceNetwork, dbInsuranceNetworksLength)
	for i, insuranceNetwork := range dbInsuranceNetworks {
		resultNetworks[i] = insuranceNetworks[insuranceNetwork.ID]
	}

	return &insurancepb.SearchInsuranceNetworksResponse{
		Networks: resultNetworks,
	}, nil
}

func (s *InsuranceGRPCServer) UpdateInsurancePayer(ctx context.Context, r *insurancepb.UpdateInsurancePayerRequest) (*insurancepb.UpdateInsurancePayerResponse, error) {
	payerID := r.GetPayerId()

	updateInsurancePayerParams, err := UpdateInsurancePayerSQLParamsFromUpdateInsurancePayerProtoRequest(r)
	if err != nil {
		s.Logger.Errorf("failed to convert params for InsurancePayer with id %d: %s", payerID, err.Error())
		return nil, err
	}

	dbPayer, err := s.InsuranceDB.UpdateInsurancePayer(ctx, *updateInsurancePayerParams)

	if err != nil {
		s.Logger.Errorf("failed to update InsurancePayer with id %d: %s", payerID, err)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, fmt.Sprintf(errorInsurancePayerNotFound, payerID))
		}
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	insurancePayer := InsurancePayerProtoFromInsurancePayerSQL(dbPayer)

	return &insurancepb.UpdateInsurancePayerResponse{Payer: insurancePayer}, nil
}

func (s *InsuranceGRPCServer) ListInsuranceClassifications(ctx context.Context, r *insurancepb.ListInsuranceClassificationsRequest) (*insurancepb.ListInsuranceClassificationsResponse, error) {
	insuranceClassifications, err := s.getInsuranceClassifications(ctx)
	if err != nil {
		errMessage := fmt.Sprintf("failed to get InsuranceClassifications %s", err.Error())

		s.Logger.Error(errMessage)

		if respStatus, ok := status.FromError(err); ok {
			return nil, status.Error(respStatus.Code(), errMessage)
		}
		return nil, status.Error(codes.Internal, errMessage)
	}

	return &insurancepb.ListInsuranceClassificationsResponse{
		InsuranceClassifications: InsuranceClassificationsProtoFromStationInsuranceClassifications(insuranceClassifications),
	}, nil
}

func (s *InsuranceGRPCServer) ListModalities(ctx context.Context, r *insurancepb.ListModalitiesRequest) (*insurancepb.ListModalitiesResponse, error) {
	modalities, err := s.getModalities(ctx)
	if err != nil {
		errMessage := fmt.Sprintf("failed to get modalities %s", err.Error())

		s.Logger.Error(errMessage)

		if respStatus, ok := status.FromError(err); ok {
			return nil, status.Error(respStatus.Code(), errMessage)
		}
		return nil, status.Errorf(codes.Internal, errMessage)
	}

	return &insurancepb.ListModalitiesResponse{
		Modalities: ModalitiesListProtoFromStationModalities(modalities),
	}, nil
}

func (s *InsuranceGRPCServer) ListServiceLines(ctx context.Context, params *insurancepb.ListServiceLinesRequest) (*insurancepb.ListServiceLinesResponse, error) {
	serviceLines, err := s.getServiceLines(ctx)
	if err != nil {
		errMessage := fmt.Sprintf("failed to get service lines %s", err.Error())

		s.Logger.Error(errMessage)

		if respStatus, ok := status.FromError(err); ok {
			return nil, status.Error(respStatus.Code(), errMessage)
		}
		return nil, status.Error(codes.Internal, errMessage)
	}

	return &insurancepb.ListServiceLinesResponse{
		ServiceLines: ServiceLinesProtoFromStationServiceLines(serviceLines),
	}, nil
}

func (s *InsuranceGRPCServer) ListPayerGroups(ctx context.Context, params *insurancepb.ListPayerGroupsRequest) (*insurancepb.ListPayerGroupsResponse, error) {
	payerGroups, err := s.GetPayerGroups(ctx, []int64{})

	if err != nil {
		errorCode := codes.Internal
		if respStatus, ok := status.FromError(err); ok {
			errorCode = respStatus.Code()
		}
		return nil, status.Errorf(errorCode, "failed to get payer groups %s", err)
	}

	return &insurancepb.ListPayerGroupsResponse{
		PayerGroups: payerGroups,
	}, nil
}

func (s *InsuranceGRPCServer) ListStates(ctx context.Context, params *insurancepb.ListStatesRequest) (*insurancepb.ListStatesResponse, error) {
	states, err := s.getStates(ctx, []int64{})

	if err != nil {
		errorCode := codes.Internal
		if respStatus, ok := status.FromError(err); ok {
			errorCode = respStatus.Code()
		}
		return nil, status.Errorf(errorCode, "failed to get states: %s", err)
	}
	return &insurancepb.ListStatesResponse{
		States: states,
	}, nil
}

func (s *InsuranceGRPCServer) CreateInsuranceNetwork(ctx context.Context, r *insurancepb.CreateInsuranceNetworkRequest) (*insurancepb.CreateInsuranceNetworkResponse, error) {
	createInsurancePlanRequest, err := CreateInsurancePlanRequestFromCreateInsuranceNetworkRequest(r)
	if err != nil {
		s.Logger.Errorf(errorInsuranceNetworkCreate, err)
		return nil, err
	}

	insurancePlan, err := s.createInsurancePlan(ctx, createInsurancePlanRequest)
	if err != nil {
		errMessage := fmt.Sprintf(errorInsuranceNetworkCreate, err)

		s.Logger.Error(errMessage)

		if respStatus, ok := status.FromError(err); ok {
			return nil, status.Error(respStatus.Code(), errMessage)
		}
		return nil, status.Error(codes.Internal, errMessage)
	}

	createInsuranceNetworkParams, createInsuranceNetworkAddressesByInsuranceNetworkIDParams, err := CreateInsuranceNetworkSQLParamsFromCreateInsuranceNetworkProtoRequest(r, insurancePlan.Id)
	if err != nil {
		s.Logger.Errorf("Failed to create insurance network: %s", err)
		return nil, err
	}

	dbInsuranceNetwork, err := s.InsuranceDB.CreateInsuranceNetwork(ctx, *createInsuranceNetworkParams, createInsuranceNetworkAddressesByInsuranceNetworkIDParams)
	if err != nil {
		s.Logger.Errorf(errorInsuranceNetworkCreate, err)
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	dbInsuranceNetworkAddresses, err := s.InsuranceDB.GetInsuranceNetworkAddressByInsuranceNetworksIDs(ctx, []int64{dbInsuranceNetwork.ID})
	if err != nil {
		s.Logger.Errorf(fmt.Sprintf("failed to list InsuranceNetworkAddress: %s", err))

		return nil, status.Errorf(codes.Internal, err.Error())
	}

	insuranceNetwork := InsuranceNetworkProtoFromInsuranceNetworkSQL(dbInsuranceNetwork, dbInsuranceNetworkAddresses)

	return &insurancepb.CreateInsuranceNetworkResponse{Network: insuranceNetwork}, nil
}

func (s *InsuranceGRPCServer) UpdateInsuranceNetwork(ctx context.Context, r *insurancepb.UpdateInsuranceNetworkRequest) (*insurancepb.UpdateInsuranceNetworkResponse, error) {
	networkID := r.GetNetworkId()

	if networkID <= 0 {
		s.Logger.Error("UpdateInsuranceNetwork:", errorInvalidInsuranceNetworkID)

		return nil, status.Errorf(codes.InvalidArgument, errorInvalidInsuranceNetworkID)
	}

	updateInsurancePlanRequest, err := UpdateInsurancePlanRequestFromUpdateInsuranceNetworkRequest(r)
	if err != nil {
		return nil, err
	}
	_, err = s.updateInsurancePlan(ctx, updateInsurancePlanRequest)
	if err != nil {
		errMessage := fmt.Sprintf(errorInsuranceNetworkCreate, err)

		s.Logger.Error(errMessage)

		if respStatus, ok := status.FromError(err); ok {
			return nil, status.Error(respStatus.Code(), errMessage)
		}
		return nil, status.Error(codes.Internal, errMessage)
	}

	updateInsuranceNetworkParams, updateInsuranceNetworkAddressesByInsuranceNetworkIDParams := UpdateInsuranceNetworkSQLParamsFromUpdateInsuranceNetworkProtoRequest(r)

	dbInsuranceNetwork, err := s.InsuranceDB.UpdateInsuranceNetwork(ctx, *updateInsuranceNetworkParams, updateInsuranceNetworkAddressesByInsuranceNetworkIDParams)
	if err != nil {
		errMessage := fmt.Sprintf(errorInsuranceNetworkUpdate, networkID, err)

		s.Logger.Error(errMessage)

		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, fmt.Sprintf(errorInsuranceNetworkNotFound, networkID))
		}

		if respStatus, ok := status.FromError(err); ok {
			return nil, status.Error(respStatus.Code(), errMessage)
		}

		return nil, status.Error(codes.Internal, errMessage)
	}

	dbInsuranceNetworkAddresses, err := s.InsuranceDB.GetInsuranceNetworkAddressByInsuranceNetworksIDs(ctx, []int64{dbInsuranceNetwork.ID})
	if err != nil {
		s.Logger.Errorf(fmt.Sprintf("failed to list InsuranceNetworkAddress: %s", err))

		return nil, status.Errorf(codes.Internal, err.Error())
	}

	insuranceNetwork := InsuranceNetworkProtoFromInsuranceNetworkSQL(dbInsuranceNetwork, dbInsuranceNetworkAddresses)

	return &insurancepb.UpdateInsuranceNetworkResponse{Network: insuranceNetwork}, nil
}

func (s *InsuranceGRPCServer) UpdateInsuranceNetworkStates(ctx context.Context, r *insurancepb.UpdateInsuranceNetworkStatesRequest) (*insurancepb.UpdateInsuranceNetworkStatesResponse, error) {
	networkID := r.GetNetworkId()

	if networkID <= 0 {
		s.Logger.Error("UpdateInsuranceNetworkStates:", errorInvalidInsuranceNetworkID)

		return nil, status.Errorf(codes.InvalidArgument, errorInvalidInsuranceNetworkID)
	}

	createInsuranceNetworkStatesParams := CreateInsuranceNetworkStatesSQLParamsFromUpdateInsuranceNetworkStatesRequest(r)
	updatedStates, err := s.InsuranceDB.UpdateInsuranceNetworkStates(ctx, networkID, createInsuranceNetworkStatesParams)
	if err != nil {
		s.Logger.Errorf(fmt.Sprintf(errorListInsuranceNetworks, err))

		return nil, status.Error(codes.Internal, err.Error())
	}

	var stateAbbrs []string
	for _, state := range updatedStates {
		stateAbbrs = append(stateAbbrs, state.StateAbbr)
	}
	return &insurancepb.UpdateInsuranceNetworkStatesResponse{
		StateAbbrs: stateAbbrs,
	}, nil
}

func (s *InsuranceGRPCServer) ListInsuranceNetworkModalityConfigs(ctx context.Context, r *insurancepb.ListInsuranceNetworkModalityConfigsRequest) (*insurancepb.ListInsuranceNetworkModalityConfigsResponse, error) {
	networkID := r.GetNetworkId()

	if networkID <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, errorInvalidInsuranceNetworkID)
	}

	modalityConfigs, err := s.listNetworkModalityConfigs(ctx, networkID)
	if err != nil {
		errMessage := fmt.Sprintf("failed to get insurance network modality configs %s", err.Error())
		errCode := codes.Internal

		s.Logger.Error(errMessage)

		if respStatus, ok := status.FromError(err); ok {
			errCode = respStatus.Code()
		}
		return nil, status.Errorf(errCode, errMessage)
	}

	return &insurancepb.ListInsuranceNetworkModalityConfigsResponse{
		Configs: InsuranceNetworkModalityConfigsProtoFromStationNetworkModalityConfigs(modalityConfigs),
	}, nil
}

func (s *InsuranceGRPCServer) UpdateInsuranceNetworkModalityConfigs(ctx context.Context, r *insurancepb.UpdateInsuranceNetworkModalityConfigsRequest) (*insurancepb.UpdateInsuranceNetworkModalityConfigsResponse, error) {
	networkID := r.GetNetworkId()

	if networkID <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, errorInvalidInsuranceNetworkID)
	}

	modalityConfigs, err := s.updateNetworkModalityConfigs(ctx, StationUpdateNetworkModalityConfigsParamsFromUpdateInsuranceNetworkModalityConfigsRequest(r))
	if err != nil {
		errMessage := fmt.Sprintf("failed to update insurance network modality configs %s", err.Error())
		errCode := codes.Internal

		s.Logger.Error(errMessage)

		if respStatus, ok := status.FromError(err); ok {
			errCode = respStatus.Code()
		}
		return nil, status.Errorf(errCode, errMessage)
	}

	return &insurancepb.UpdateInsuranceNetworkModalityConfigsResponse{
		Configs: InsuranceNetworkModalityConfigsProtoFromStationNetworkModalityConfigs(modalityConfigs),
	}, nil
}

func (s *InsuranceGRPCServer) ListInsuranceNetworkServiceLines(ctx context.Context, r *insurancepb.ListInsuranceNetworkServiceLinesRequest) (*insurancepb.ListInsuranceNetworkServiceLinesResponse, error) {
	networkID := r.GetNetworkId()

	if networkID <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, errorInvalidInsuranceNetworkID)
	}

	serviceLines, err := s.listNetworkServiceLines(ctx, networkID)
	if err != nil {
		errMessage := fmt.Sprintf("failed to get service lines for InsuranceNetwork %d: %s", networkID, err.Error())
		errCode := codes.Internal

		s.Logger.Error(errMessage)

		if respStatus, ok := status.FromError(err); ok {
			errCode = respStatus.Code()
		}
		return nil, status.Error(errCode, errMessage)
	}

	return &insurancepb.ListInsuranceNetworkServiceLinesResponse{
		ServiceLines: ServiceLinesProtoFromStationServiceLines(serviceLines),
	}, nil
}

func (s *InsuranceGRPCServer) UpsertInsuranceNetworkCreditCardRules(ctx context.Context, r *insurancepb.UpsertInsuranceNetworkCreditCardRulesRequest) (*insurancepb.UpsertInsuranceNetworkCreditCardRulesResponse, error) {
	networkID := r.GetNetworkId()

	if networkID <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, errorInvalidInsuranceNetworkID)
	}

	insuranceNetwork, err := s.InsuranceDB.GetInsuranceNetwork(ctx, networkID)
	if err != nil {
		s.Logger.Error("failed to get insurance network to update insurance network credit card rules %s", err)
		if errors.Is(err, pgx.ErrNoRows) {
			return nil, status.Errorf(codes.NotFound, fmt.Sprintf(errorInsuranceNetworkNotFound, networkID))
		}
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	_, err = s.upsertInsurancePlanCreditCardPolicies(ctx, UpsertInsurancePlanCreditCardPoliciesRequestFromUpsertInsuranceNetworkCreditCardRulesRequest(r, insuranceNetwork.InsurancePlanID))
	if err != nil {
		errMessage := fmt.Sprintf("failed to update insurance network credit card rules %s", err.Error())

		s.Logger.Error(errMessage)

		if respStatus, ok := status.FromError(err); ok {
			return nil, status.Error(respStatus.Code(), errMessage)
		}
		return nil, status.Errorf(codes.Internal, errMessage)
	}

	return &insurancepb.UpsertInsuranceNetworkCreditCardRulesResponse{}, nil
}

func (s *InsuranceGRPCServer) ListInsuranceNetworkCreditCardRules(ctx context.Context, r *insurancepb.ListInsuranceNetworkCreditCardRulesRequest) (*insurancepb.ListInsuranceNetworkCreditCardRulesResponse, error) {
	networkID := r.GetNetworkId()

	if networkID <= 0 {
		return nil, status.Error(codes.InvalidArgument, errorInvalidInsuranceNetworkID)
	}

	network, err := s.InsuranceDB.GetInsuranceNetwork(ctx, networkID)
	if err != nil {
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	creditCardPolicyRules, err := s.listInsuranceCreditCardRules(ctx, network.InsurancePlanID)
	if err != nil {
		errMessage := fmt.Sprintf("failed to get insurance network credit card rules %s", err.Error())
		errCode := codes.Internal

		s.Logger.Error(errMessage)

		if respStatus, ok := status.FromError(err); ok {
			errCode = respStatus.Code()
		}

		return nil, status.Errorf(errCode, errMessage)
	}

	return ListInsurancePlanCreditCardPolicyResponseToListInsuranceNetworkServiceLinesResponse(creditCardPolicyRules), nil
}

func (s *InsuranceGRPCServer) ListAppointmentTypes(ctx context.Context, r *insurancepb.ListAppointmentTypesRequest) (*insurancepb.ListAppointmentTypesResponse, error) {
	appointmentTypes, err := s.getAppointmentTypes(ctx)
	if err != nil {
		errMessage := fmt.Sprintf("failed to get appointment types %s", err)
		errCode := codes.Internal

		s.Logger.Error(errMessage)

		if respStatus, ok := status.FromError(err); ok {
			errCode = respStatus.Code()
		}

		return nil, status.Error(errCode, errMessage)
	}

	return &insurancepb.ListAppointmentTypesResponse{
		AppointmentTypes: AppointmentTypesProtoFromStationAppointmentTypes(appointmentTypes),
	}, nil
}

func (s *InsuranceGRPCServer) ListInsuranceNetworkAppointmentTypes(ctx context.Context, r *insurancepb.ListInsuranceNetworkAppointmentTypesRequest) (*insurancepb.ListInsuranceNetworkAppointmentTypesResponse, error) {
	if r.NetworkId <= 0 {
		return nil, status.Errorf(codes.InvalidArgument, errorInvalidInsuranceNetworkID)
	}

	dbNetworkAppointmentTypes, err := s.InsuranceDB.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkID(ctx, insurancesql.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkIDParams{
		NetworkID:     r.NetworkId,
		ServiceLineID: sqltypes.ToNullInt64(r.ServiceLineId),
	})
	if err != nil {
		return nil, status.Errorf(codes.Internal, err.Error())
	}

	return &insurancepb.ListInsuranceNetworkAppointmentTypesResponse{
		AppointmentTypes: InsuranceNetworkAppointmentTypesProtoFromSQL(dbNetworkAppointmentTypes),
	}, nil
}

func (s *InsuranceGRPCServer) UpdateInsuranceNetworkAppointmentTypes(ctx context.Context, r *insurancepb.UpdateInsuranceNetworkAppointmentTypesRequest) (*insurancepb.UpdateInsuranceNetworkAppointmentTypesResponse, error) {
	if r.NetworkId <= 0 {
		return nil, status.Error(codes.InvalidArgument, errorInvalidInsuranceNetworkID)
	}

	dbInsuranceNetworkAppointmentTypes, err := s.InsuranceDB.UpdateInsuranceNetworkAppointmentTypes(ctx, insurancedb.UpdateInsuranceNetworkAppointmentTypesParams{
		NetworkID:        r.NetworkId,
		AppointmentTypes: CreateInsuranceNetworksAppointmentTypesParamsSQLFromUpdateInsuranceNetworkAppointmentTypesRequestProto(r.AppointmentTypes),
	})
	if err != nil {
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &insurancepb.UpdateInsuranceNetworkAppointmentTypesResponse{
		AppointmentTypes: InsuranceNetworkAppointmentTypesProtoFromSQL(dbInsuranceNetworkAppointmentTypes),
	}, nil
}

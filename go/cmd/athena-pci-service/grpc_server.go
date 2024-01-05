package main

import (
	"context"

	"github.com/*company-data-covered*/services/go/pkg/athena"
	athenapcipb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena_pci"
	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

const (
	validLenAthenaResponse = 1
)

var (
	errEmptyDepartmentID    = status.Error(codes.InvalidArgument, "departmentID is empty")
	errEmptyAthenaPatientID = status.Error(codes.InvalidArgument, "athenaPatientID is empty")
)

type GRPCServer struct {
	athenapcipb.UnimplementedAthenaPCIServiceServer
	AthenaClient athena.ClientAPI
	Logger       *zap.SugaredLogger
}

func (s *GRPCServer) CreatePatientPayment(ctx context.Context, req *athenapcipb.CreatePatientPaymentRequest) (*athenapcipb.CreatePatientPaymentResponse, error) {
	paymentInfo := paymentProtoToAthena(req)
	resp, err := s.AthenaClient.MakePatientPayment(ctx, req.AthenaPatientId, paymentInfo)
	if err != nil {
		return nil, err
	}

	respLen := len(resp)
	if respLen < validLenAthenaResponse {
		return nil, status.Error(codes.Internal, "received empty response from Athena API")
	} else if respLen > validLenAthenaResponse {
		s.Logger.Errorw("received multiple payment responses from Athena", "patientID", req.AthenaPatientId)
	}

	return paymentResponseAthenaToProto(resp[0]), nil
}

func (s *GRPCServer) GetPatientCreditCards(ctx context.Context, req *athenapcipb.GetPatientCreditCardsRequest) (*athenapcipb.GetPatientCreditCardsResponse, error) {
	athenaPatientID := req.GetAthenaPatientId()
	if athenaPatientID == "" {
		return nil, errEmptyAthenaPatientID
	}

	departmentID := req.GetDepartmentId()
	if departmentID == "" {
		return nil, errEmptyDepartmentID
	}

	patientCreditCards, err := s.AthenaClient.GetPatientCreditCardDetails(ctx, athenaPatientID, departmentID)
	if err != nil {
		return nil, err
	}

	resultProtos := make([]*athenapcipb.CreditCard, len(patientCreditCards))
	for i, result := range patientCreditCards {
		resultProtos[i] = creditCardAthenaToProto(result)
	}

	return &athenapcipb.GetPatientCreditCardsResponse{
		CreditCards: resultProtos,
	}, nil
}

func (s *GRPCServer) CreatePatientCreditCard(ctx context.Context, req *athenapcipb.CreatePatientCreditCardRequest) (*athenapcipb.CreatePatientCreditCardResponse, error) {
	athenaPatientID := req.GetAthenaPatientId()
	if athenaPatientID == "" {
		return nil, errEmptyAthenaPatientID
	}

	departmentID := req.GetDepartmentId()
	if departmentID == 0 {
		return nil, errEmptyDepartmentID
	}

	creditCardInfo := createCreditCardProtoToAthena(req)
	resp, err := s.AthenaClient.UploadPatientCreditCardDetails(ctx, req.GetAthenaPatientId(), creditCardInfo)
	if err != nil {
		return nil, err
	}

	respLen := len(resp)
	if respLen < validLenAthenaResponse {
		return nil, status.Error(codes.Internal, "received empty credit card response from Athena API")
	} else if respLen > validLenAthenaResponse {
		s.Logger.Errorw("received multiple create credit card responses from Athena", "patientID", req.AthenaPatientId)
	}

	return createCreditCardResponseAthenaToProto(resp[0]), nil
}

func (s *GRPCServer) DeletePatientCreditCard(ctx context.Context, req *athenapcipb.DeletePatientCreditCardRequest) (*athenapcipb.DeletePatientCreditCardResponse, error) {
	athenaPatientID := req.GetAthenaPatientId()
	if athenaPatientID == "" {
		return nil, errEmptyAthenaPatientID
	}

	departmentID := req.GetDepartmentId()
	if departmentID == "" {
		return nil, errEmptyDepartmentID
	}

	creditCardID := req.GetCreditCardId()
	if creditCardID == "" {
		return nil, status.Error(codes.InvalidArgument, "creditCardID is empty")
	}

	resp, err := s.AthenaClient.DeleteStoredCreditCard(ctx, athenaPatientID, creditCardID, departmentID)
	if err != nil {
		return nil, err
	}

	return &athenapcipb.DeletePatientCreditCardResponse{
		Success: resp.Success,
	}, nil
}

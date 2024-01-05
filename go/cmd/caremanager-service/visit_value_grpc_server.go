package main

import (
	"context"
	"errors"
	"time"

	visitvaluepb "github.com/*company-data-covered*/services/go/pkg/generated/proto/visit_value"
	caremanagerdb "github.com/*company-data-covered*/services/go/pkg/generated/sql/caremanager"
	"github.com/*company-data-covered*/services/go/pkg/sqltypes"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

type Clock interface {
	Now() time.Time
}

type VisitValueGRPCServer struct {
	visitvaluepb.UnimplementedVisitValueServiceServer

	CaremanagerDB *CaremanagerDB
}

func (s *VisitValueGRPCServer) GetVisitValue(ctx context.Context, req *visitvaluepb.GetVisitValueRequest) (*visitvaluepb.GetVisitValueResponse, error) {
	err := validateGetVisitValueRequest(req)
	if err != nil {
		return nil, status.Error(codes.InvalidArgument, err.Error())
	}

	visitValue, err := s.CaremanagerDB.GetLatestVisitValue(ctx, caremanagerdb.GetLatestVisitValueParams{
		PayerName:            req.GetPayerName(),
		ServiceLineShortName: sqltypes.ToValidNullString(req.GetServiceLineShortName()),
		CreatedBefore:        time.Now(),
	})
	if err != nil {
		if errors.Is(err, ErrVisitValueNotFound) {
			return nil, status.Error(codes.NotFound, err.Error())
		}
		return nil, status.Error(codes.Internal, err.Error())
	}

	return &visitvaluepb.GetVisitValueResponse{
		CompletionValueCents: visitValue.ValueCents,
	}, nil
}

func validateGetVisitValueRequest(req *visitvaluepb.GetVisitValueRequest) error {
	if req.GetPayerName() == "" {
		return errors.New("payer name is required")
	}

	if req.GetServiceLineShortName() == "" {
		return errors.New("service line short name is required")
	}

	return nil
}

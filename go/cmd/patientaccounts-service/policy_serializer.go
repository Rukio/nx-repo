package main

import (
	"context"
	"errors"

	"go.uber.org/zap"
	"google.golang.org/grpc/codes"
	"google.golang.org/grpc/status"
)

var (
	errInvalidRequestFormat = status.Error(codes.InvalidArgument, "request does not match expected format")
)

type RequestWithAccountID interface {
	GetAccountId() int64
}

type AddressRequest interface {
	GetAddressId() int64
}

type AccountPatientLinkRequest interface {
	GetAccountPatientLinkId() int64
}

type PatientAccountsPolicyResourceSerializer struct {
	DBService DBService
	Logger    *zap.SugaredLogger
}

type AccountIDRequestSerializer struct {
}

func (s *AccountIDRequestSerializer) SerializePolicyResource(ctx context.Context, r any) (any, error) {
	request, ok := r.(RequestWithAccountID)
	if !ok {
		return nil, errInvalidRequestFormat
	}

	return map[string]any{
		claimPropertyAccountIDKey: request.GetAccountId(),
	}, nil
}

type AddressRequestSerializer struct {
	PatientAccountsPolicyResourceSerializer
}

func (s *AddressRequestSerializer) SerializePolicyResource(ctx context.Context, r any) (any, error) {
	request, ok := r.(AddressRequest)
	if !ok {
		return nil, errInvalidRequestFormat
	}

	resource, err := s.DBService.GetAddress(ctx, request.GetAddressId())
	if err != nil {
		if errors.Is(err, errAccountAddressNotFound) {
			return nil, status.Error(codes.NotFound, err.Error())
		}

		s.Logger.Errorw(errFailedGetAddress.Error(), zap.Error(err))
		return nil, errFailedGetAddress
	}

	return map[string]any{
		claimPropertyAccountIDKey: resource.AccountID,
	}, nil
}

type AccountPatientLinkRequestSerializer struct {
	PatientAccountsPolicyResourceSerializer
}

func (s *AccountPatientLinkRequestSerializer) SerializePolicyResource(ctx context.Context, r any) (any, error) {
	request, ok := r.(AccountPatientLinkRequest)
	if !ok {
		return nil, errInvalidRequestFormat
	}

	resource, err := s.DBService.GetAccountPatientLink(ctx, request.GetAccountPatientLinkId())
	if err != nil {
		if errors.Is(err, errAccountPatientNotFound) {
			return nil, status.Error(codes.NotFound, err.Error())
		}

		s.Logger.Errorw(errFailedGetAccountPatient.Error(), zap.Error(err))
		return nil, errFailedGetAccountPatient
	}

	return map[string]any{
		claimPropertyAccountIDKey: resource.AccountID,
	}, nil
}

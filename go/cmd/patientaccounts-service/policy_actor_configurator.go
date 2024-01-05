package main

import (
	"context"
	"errors"

	"github.com/*company-data-covered*/services/go/pkg/auth"
	"go.uber.org/zap"
)

type PolicyActorConfigurator struct {
	dbService DBService
	logger    *zap.SugaredLogger
}

func (pac *PolicyActorConfigurator) getAccountID(ctx context.Context, identityProviderUserID string) (*int64, error) {
	if identityProviderUserID == "" {
		return nil, errInvalidTokenClaims
	}

	account, err := pac.dbService.GetAccountByAuth0ID(ctx, identityProviderUserID)
	if err != nil {
		// Requests like FindOrCreateAccountByToken are expected to be made for accounts that do not exist.
		// Let the policy determine if the request is allowed instead of throwing an error.
		if errors.Is(err, errAccountNotFound) {
			return nil, nil
		}
		pac.logger.Errorw(errFailedGetAccount.Error(), zap.Error(err))
		return nil, errFailedGetAccount
	}

	return &account.ID, nil
}

func (pac *PolicyActorConfigurator) ConfigurePolicyActor(ctx context.Context) error {
	actor, err := auth.ActorFromContext(ctx)
	if err != nil {
		return errInvalidTokenClaims
	}

	auth0ID := actor.Properties[claimPropertyIdentityProviderUserIDKey]
	if auth0ID == nil {
		return errInvalidTokenClaims
	}

	id, err := pac.getAccountID(ctx, auth0ID.(string))
	if err != nil {
		return err
	}

	actor.Properties[claimPropertyAccountIDKey] = id

	auth.ActorToContext(ctx, &actor)

	return nil
}

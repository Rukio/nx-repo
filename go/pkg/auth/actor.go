package auth

import (
	"context"
	"errors"
)

type actorContextKey struct{}

type Actor struct {
	Type       string         `json:"type"`
	Properties map[string]any `json:"properties"`
}

func actorFromCustomClaims(ctx context.Context) (*Actor, error) {
	customClaims, ok := CustomClaimsFromContext(ctx)
	if !ok {
		return nil, errors.New("policy actor not found in claims")
	}

	actor := Actor{Type: customClaims.Type, Properties: customClaims.Properties}
	return &actor, nil
}

func ActorFromContext(ctx context.Context) (Actor, error) {
	var policyActor = ctx.Value(actorContextKey{})

	var err error
	if policyActor == nil {
		policyActor, err = actorFromCustomClaims(ctx)
		if err != nil {
			return Actor{}, err
		}
		ActorToContext(ctx, policyActor.(*Actor))
	}

	return *policyActor.(*Actor), nil
}

func ActorToContext(ctx context.Context, policyActor *Actor) context.Context {
	return context.WithValue(ctx, actorContextKey{}, policyActor)
}

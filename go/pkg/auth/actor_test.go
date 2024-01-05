package auth

import (
	"context"
	"errors"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestActorFromContext(t *testing.T) {
	testCases := []struct {
		Name    string
		Context context.Context

		ExpectedError error
		ExpectedActor *Actor
	}{
		{
			Name: "uses the actor saved in the context",
			Context: context.WithValue(context.Background(), actorContextKey{}, &Actor{
				Type: "user",
				Properties: map[string]any{
					"id":    123,
					"roles": []string{"admin", "user"},
				},
			}),

			ExpectedActor: &Actor{
				Type: "user",
				Properties: map[string]any{
					"id":    123,
					"roles": []string{"admin", "user"},
				},
			},
		},
		{
			Name: "creates an actor from the claims when actor does not exist in the context",
			Context: context.WithValue(context.Background(), customClaimsContextKey{}, &CustomClaims{
				Email: "test@example.com",
				Scope: "testScope",
				Type:  "user",
				Properties: map[string]any{
					"provider_type":             "TestProviderType",
					"groups":                    []string{"testGroup", "testGroup2"},
					"identity_provider_user_id": "abc1234",
					"email":                     "test@example.com",
				},
			}),

			ExpectedActor: &Actor{
				Type: "user",
				Properties: map[string]any{
					"provider_type":             "TestProviderType",
					"groups":                    []string{"testGroup", "testGroup2"},
					"identity_provider_user_id": "abc1234",
					"email":                     "test@example.com",
				},
			},
		},
		{
			Name:    "returns ok = false and empty actor if the claims pointer in context is nil",
			Context: context.WithValue(context.Background(), customClaimsContextKey{}, nil),

			ExpectedError: errors.New("policy actor not found in claims"),
			ExpectedActor: &Actor{},
		},
		{
			Name:    "returns ok = false and empty actor if the context is empty",
			Context: context.Background(),

			ExpectedError: errors.New("policy actor not found in claims"),
			ExpectedActor: &Actor{},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			actorFromContext, err := ActorFromContext(testCase.Context)

			testutils.MustMatch(t, testCase.ExpectedError, err, "Expected different ok value")
			testutils.MustMatch(t, *testCase.ExpectedActor, actorFromContext, "Actors from context do not match")
		})
	}
}

func TestActorToContext(t *testing.T) {
	testCases := []struct {
		Name  string
		Actor *Actor
	}{
		{
			Name:  "works when receiving a nil pointer",
			Actor: nil,
		},
		{
			Name:  "works with empty claims",
			Actor: &Actor{},
		},
		{
			Name: "works with populated actor",
			Actor: &Actor{
				Type: "user",
				Properties: map[string]any{
					"provider_type":             "TestProviderType",
					"groups":                    []string{"testGroup", "testGroup2"},
					"identity_provider_user_id": "abc1234",
					"email":                     "test@example.com",
				},
			},
		},
	}

	for _, testCase := range testCases {
		t.Run(testCase.Name, func(t *testing.T) {
			ctx := context.Background()
			ctxWithActor := ActorToContext(ctx, testCase.Actor)

			actorFromContext := ctxWithActor.Value(actorContextKey{}).(*Actor)

			if testCase.Actor == nil {
				testutils.MustMatch(t, testCase.Actor, actorFromContext, "Expected to read a nil pointer from ctx")
			} else {
				testutils.MustMatch(t, *testCase.Actor, *actorFromContext, "Claims read from context do not match")
			}
		})
	}
}

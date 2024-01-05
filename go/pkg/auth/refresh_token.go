package auth

import (
	"context"
	"errors"
	"log"
	"sync"
	"time"
)

type Env interface {
	Valid() bool
	FetchToken(context.Context) (*Token, error)
}

// AutoRefreshToken is an automatically refreshing token.
type AutoRefreshToken struct {
	env             Env
	refreshInterval time.Duration
	fetchFunc       func(context.Context) (*Token, error)

	mx    sync.RWMutex
	token Valuer
}

// NewAutoRefreshToken returns a new AutoRefreshToken that refreshes periodically.
// TODO: Add option for refreshing before expiration if necessary.
func NewAutoRefreshToken(env Env, refreshInterval time.Duration) (*AutoRefreshToken, error) {
	if !env.Valid() {
		return nil, errors.New("invalid auth environment")
	}

	return &AutoRefreshToken{
		env:             env,
		refreshInterval: refreshInterval,
		fetchFunc:       env.FetchToken,
	}, nil
}

func (t *AutoRefreshToken) refresh(ctx context.Context) error {
	token, err := t.fetchFunc(ctx)
	if err != nil {
		return err
	}

	t.mx.Lock()
	t.token = token
	t.mx.Unlock()

	return nil
}

// Start refreshing token.
// An error will only be returned if the first token retrieval fails.
func (t *AutoRefreshToken) Start(ctx context.Context) error {
	err := t.refresh(ctx)
	if err != nil {
		return err
	}

	go func() {
		for {
			select {
			case <-ctx.Done():
				return

			case <-time.After(t.refreshInterval):
			}

			err := t.refresh(ctx)
			if err != nil {
				// TODO: Report refresh errors.
				log.Print("AutoRefreshToken: refresh error: ", err)
			}
		}
	}()

	return nil
}

func (t *AutoRefreshToken) AuthorizationValue() string {
	t.mx.RLock()
	defer t.mx.RUnlock()

	return t.token.AuthorizationValue()
}

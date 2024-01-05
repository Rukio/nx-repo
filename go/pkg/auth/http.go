package auth

import (
	"context"
	"net/http"
	"regexp"

	"golang.org/x/exp/slices"
)

var (
	httpAuthHeaderFormatRE = regexp.MustCompile("^Bearer (.*)$")
)

func HTTPHandler(ctx context.Context, h http.Handler, config Config) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		requestPath := r.URL.Path
		if config.AuthorizationDisabled || slices.Contains(config.HTTPAuthorizationDisabledPaths, requestPath) {
			h.ServeHTTP(w, r)
			return
		}

		// Check if authorization header is set.
		authorization := r.Header.Get("authorization")
		if len(authorization) == 0 {
			http.Error(w, "no authorization header included", http.StatusUnauthorized)
			return
		}

		// Check to see if authorization token from the authorization header is valid.
		authValueParts := httpAuthHeaderFormatRE.FindStringSubmatch(authorization)
		if len(authValueParts) != 2 {
			http.Error(w, "bad authorization header format", http.StatusUnauthorized)
			return
		}

		accessToken := authValueParts[1]

		_, err := validateToken(ctx, config, accessToken)
		if err != nil {
			http.Error(w, err.Error(), http.StatusUnauthorized)
			return
		}

		h.ServeHTTP(w, r)
	})
}

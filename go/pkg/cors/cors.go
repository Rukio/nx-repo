package cors

import (
	"net/url"
	"strings"

	"github.com/rs/cors"
)

type Config struct {
	AllowedHTTPOrigins []string
	AllowedHTTPMethods []string
	AllowedHTTPHeaders []string
}

func validateAllowedHTTPOrigins(allowedHTTPOrigins []string) error {
	for _, originURL := range allowedHTTPOrigins {
		sanitizedOriginURLPort := strings.Replace(originURL, ":*", ":1", 1)
		sanitizedOriginURL := strings.Replace(sanitizedOriginURLPort, "*", "subdomain", 1)

		_, err := url.ParseRequestURI(sanitizedOriginURL)
		if err != nil {
			return err
		}
	}

	return nil
}

func Initialize(config Config) (*cors.Cors, error) {
	err := validateAllowedHTTPOrigins(config.AllowedHTTPOrigins)
	if err != nil {
		return nil, err
	}
	return cors.New(cors.Options{
		AllowedOrigins: config.AllowedHTTPOrigins,
		AllowedHeaders: config.AllowedHTTPHeaders,
		AllowedMethods: config.AllowedHTTPMethods,
	}), nil
}

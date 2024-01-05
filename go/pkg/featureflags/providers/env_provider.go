package providers

import (
	"os"
	"strconv"
)

type EnvProvider struct {
}

func (p *EnvProvider) Shutdown() {
	// Shutdown implements FlagProvider.Shutdown trivially.
}

func (p *EnvProvider) Bool(name string, fallback bool) bool {
	value, exists := os.LookupEnv(name)
	if exists {
		if parsed, err := strconv.ParseBool(value); err == nil {
			return parsed
		}
	}

	return fallback
}

func (p *EnvProvider) Int(name string, fallback int) int {
	value, exists := os.LookupEnv(name)
	if exists {
		if parsed, err := strconv.ParseInt(value, 10, 0); err == nil {
			return int(parsed)
		}
	}

	return fallback
}

func (p *EnvProvider) Float(name string, fallback float64) float64 {
	value, exists := os.LookupEnv(name)
	if exists {
		if parsed, err := strconv.ParseFloat(value, 64); err == nil {
			return parsed
		}
	}

	return fallback
}

func (p *EnvProvider) String(name string, fallback string) string {
	value, exists := os.LookupEnv(name)
	if exists {
		return value
	}

	return fallback
}

func NewEnvProvider() *EnvProvider {
	return &EnvProvider{}
}

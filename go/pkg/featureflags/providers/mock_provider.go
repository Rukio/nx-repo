package providers

import (
	"testing"
)

func StartMockStatsigProvider(t *testing.T) *StatsigProvider {
	provider, err := NewStatsigProvider(StatsigProviderConfig{
		SDKKey:         "secret-dummy",
		DefaultUserKey: "UserID",
		LocalMode:      true,
	})
	if err != nil {
		t.Fatal(err)
	}

	provider.Start()
	return provider
}

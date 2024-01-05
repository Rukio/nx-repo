package providers

import (
	"encoding/json"
	"errors"
	"sync"

	statsig "github.com/statsig-io/go-sdk"
)

type StatsigProviderConfig struct {
	// The client SDK API key
	// Required
	SDKKey string

	// Sets the environment the client targets.
	// The tier can be one of: "production"/"development"/"staging".
	// If the tier is unset the production environment is assumed.
	// Optional
	Tier string

	// A default user used in flag value resolutions
	// Optional
	DefaultUserKey string

	// Setting LocalMode to true will cause the SDK to not hit the network
	// and only return default values. This setting is useful for dummy/test
	// environments that should not access the network.
	// Optional
	LocalMode bool
}

func (c *StatsigProviderConfig) Validate() error {
	if c.SDKKey == "" {
		return errors.New("statsig sdk key required")
	}

	return nil
}

// StatsigProvider must be initialized with NewStatsigProvider.
type StatsigProvider struct {
	clientOnce  sync.Once
	client      *statsig.Client
	defaultUser statsig.User

	config StatsigProviderConfig
}

func (p *StatsigProvider) Bool(name string, fallback bool) bool {
	if p == nil {
		return fallback
	}
	return p.client.CheckGate(p.defaultUser, name)
}

func (p *StatsigProvider) String(name string, fallback string) string {
	if p == nil {
		return fallback
	}

	value := p.client.GetExperiment(p.defaultUser, name)
	if value.Name == "" {
		// TODO(CORE-169): Instrument fallback reason in PR followup
		return fallback
	}

	return value.GetString(name, fallback)
}

func (p *StatsigProvider) Float(name string, fallback float64) float64 {
	if p == nil {
		return fallback
	}

	value := p.client.GetExperiment(p.defaultUser, name)
	if value.Name == "" {
		// TODO(CORE-169): Instrument fallback reason in PR followup
		return fallback
	}

	return value.GetNumber(name, fallback)
}

func (p *StatsigProvider) Map(name string, fallback map[string]any) map[string]any {
	if p == nil {
		return fallback
	}
	experiment := p.client.GetExperiment(p.defaultUser, name)
	if experiment.Name == "" {
		// TODO(CORE-169): Instrument fallback reason in PR followup
		return fallback
	}
	return experiment.Value
}

func (p *StatsigProvider) Struct(name string, value any) error {
	if p == nil {
		return errors.New("StatsigProvider is uninitialized")
	}
	experiment := p.client.GetExperiment(p.defaultUser, name)
	if experiment.Name == "" {
		return errors.New("flag not found")
	}

	buf, err := json.Marshal(experiment.Value)
	if err != nil {
		return err
	}

	err = json.Unmarshal(buf, &value)
	if err != nil {
		return err
	}

	return nil
}

func (p *StatsigProvider) OverrideGate(gate string, value bool) {
	p.client.OverrideGate(gate, value)
}

func (p *StatsigProvider) OverrideConfig(config string, value map[string]any) {
	p.client.OverrideConfig(config, value)
}

func (p *StatsigProvider) OverrideStruct(config string, value any) error {
	buf, err := json.Marshal(value)
	if err != nil {
		return err
	}

	var v map[string]any
	err = json.Unmarshal(buf, &v)
	if err != nil {
		return err
	}

	p.OverrideConfig(config, v)

	return nil
}

func (p *StatsigProvider) Shutdown() {
	p.client.Shutdown()
}

// Start starts the connection to Statsig.
// Must be called before using other functions, and is idempotent.
func (p *StatsigProvider) Start() {
	p.clientOnce.Do(func() {
		p.client = statsig.NewClientWithOptions(p.config.SDKKey, &statsig.Options{
			Environment: statsig.Environment{Tier: p.config.Tier},
			LocalMode:   p.config.LocalMode})
	})
}

func NewStatsigProvider(config StatsigProviderConfig) (*StatsigProvider, error) {
	if err := config.Validate(); err != nil {
		// TODO(CORE-169): Instrument missing configuraiton
		return nil, err
	}

	return &StatsigProvider{
		config:      config,
		defaultUser: statsig.User{UserID: config.DefaultUserKey},
	}, nil
}

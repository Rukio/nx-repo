package monitoring

import (
	"github.com/DataDog/datadog-go/v5/statsd"
)

type MockStatsDClient struct {
	statsd.ClientInterface

	NumCount int64
	CountErr error
	NumGauge float64
	GaugeErr error
}

func (c *MockStatsDClient) Count(name string, value int64, tags []string, rate float64) error {
	c.NumCount += value
	return c.CountErr
}

func (c *MockStatsDClient) Gauge(name string, value float64, tags []string, rate float64) error {
	c.NumGauge = value
	return c.GaugeErr
}

func (c *MockStatsDClient) ServiceCheck(sc *statsd.ServiceCheck) error {
	c.NumCount++
	return c.CountErr
}

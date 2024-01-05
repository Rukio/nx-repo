package providernotifications

import (
	"math/rand"
	"time"

	"golang.org/x/exp/slices"
)

// Provider notification cron job configs in Statsig config https://console.statsig.com/5tXuecY3jSR2n86mF3PpVA/dynamic_configs/provider_notifications_shift_schedule_settings

type settings struct {
	// PollIntervalSec parameter should not exceed SCHEDULE_CHANGED_CRON_EXPRESSION interval configured in env.
	// PollIntervalSec is used for calculating jitter interval, if PollIntervalSec = 0 goroutines for all markets will go simultaneously.
	PollIntervalSec int64 `json:"poll_interval_sec"`

	// Ratio of PollIntervalSec to randomly add as jitter. Same as PollIntervalSec, PollIntervalJitterRatio is used for calculating jitter interval,
	// if PollIntervalJitterRatio = 0 goroutines for all markets will go simultaneously.
	PollIntervalJitterRatio float64 `json:"poll_interval_jitter_ratio"`

	// EnabledMarkets is list of markets where shift teams will be notified. If EnabledMarkets array is empty, notifications will not be sent
	EnabledMarkets []string `json:"enabled_markets"`

	// NotificationCooldownMinutes defines minimal interval between notifications for same shift team and care request.
	// If NotificationCooldownMinutes = 0 there will be no cooldown period for sending notifications.
	NotificationCooldownMinutes int64 `json:"notification_cooldown_minutes"`
}

func (s settings) HasMarketShortName(name string) bool {
	return slices.Contains(s.EnabledMarkets, name)
}

func (s settings) NextJitterInterval() time.Duration {
	return time.Duration(s.nextJitterIntervalMs()) * time.Millisecond
}

func (s settings) nextJitterIntervalMs() int64 {
	if s.PollIntervalSec > 0 && s.PollIntervalJitterRatio > 0 {
		pollInterval := time.Duration(s.PollIntervalSec) * time.Second
		pollMs := pollInterval.Milliseconds()
		jitterRangeMs := int64(float64(pollMs) * s.PollIntervalJitterRatio)
		jitterIntervalMs := rand.Int63n(jitterRangeMs)

		return jitterIntervalMs
	}

	return 0
}

func (s settings) IsWithinNotificationCooldown(from time.Time, now time.Time) bool {
	return from.Add(time.Duration(s.NotificationCooldownMinutes) * time.Minute).After(now)
}

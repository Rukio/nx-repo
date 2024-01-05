package providernotifications

import (
	"testing"
	"time"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

type durationRange struct {
	min time.Duration
	max time.Duration
}

func (r durationRange) MustContain(t *testing.T, d time.Duration) {
	t.Helper()

	success := d >= r.min && d <= r.max
	if !success {
		t.Fatalf("%v not in %s[%v, %v]", d, "jitter interval", r.min, r.max)
	}
}

func TestNextJitterInterval(t *testing.T) {
	runs := 100
	tcs := []struct {
		desc        string
		pollSec     int64
		jitterRatio float64

		wantJitterInterval durationRange
	}{
		{
			desc:    "some poll interval, no jitter",
			pollSec: 1,
		},
		{
			desc:        "some poll interval, with jitter, is within jitter ratio",
			pollSec:     1,
			jitterRatio: 0.1,

			wantJitterInterval: durationRange{0, 100 * time.Millisecond},
		},
		{
			desc:        "some poll interval, larger than 1 jitter ratio, is not negative",
			pollSec:     1,
			jitterRatio: 1.1,

			wantJitterInterval: durationRange{0, 1100 * time.Millisecond},
		},
		{
			desc:    "no poll interval",
			pollSec: 0,
		},
		{
			desc:    "negative poll interval",
			pollSec: -1,
		},
		{
			desc:        "no poll interval, some jitter",
			pollSec:     0,
			jitterRatio: 0.1,
		},
		{
			desc:        "negative poll interval, some jitter",
			pollSec:     -1,
			jitterRatio: 0.1,
		},
		{
			desc:        "some poll interval, negative jitter",
			pollSec:     1,
			jitterRatio: -0.1,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			s := settings{
				PollIntervalSec:         tc.pollSec,
				PollIntervalJitterRatio: tc.jitterRatio,
			}

			for i := 0; i < runs; i++ {
				tc.wantJitterInterval.MustContain(t, s.NextJitterInterval())
			}
		})
	}
}

func TestHasMarketShortName(t *testing.T) {
	tcs := []struct {
		desc            string
		marketShortName string

		want bool
	}{
		{
			desc:            "should return true when contains market short name",
			marketShortName: "ATL",

			want: true,
		},
		{
			desc:            "should return false when does not contain market short name",
			marketShortName: "LAS",
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			s := settings{
				EnabledMarkets: []string{"ATL", "COL", "DEN"},
			}
			testutils.MustMatch(t, tc.want, s.HasMarketShortName(tc.marketShortName))
		})
	}
}

func TestIsWithinNotificationCooldown(t *testing.T) {
	now := time.Now()
	defaultNotificationCooldownMinutes := int64(30)
	settings := settings{NotificationCooldownMinutes: defaultNotificationCooldownMinutes}

	tcs := []struct {
		desc string
		from time.Time

		want bool
	}{
		{
			desc: "should return true when half of cooldown passed",
			from: now.Add(-time.Duration(defaultNotificationCooldownMinutes/2) * time.Minute),

			want: true,
		},
		{
			desc: "should return false when cooldown passed",
			from: now.Add(-time.Duration(defaultNotificationCooldownMinutes+1) * time.Minute),

			want: false,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			testutils.MustMatch(t, tc.want, settings.IsWithinNotificationCooldown(tc.from, now))
		})
	}
}

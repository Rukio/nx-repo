package main

import "time"

type MockClock time.Time

func (c MockClock) Now() time.Time {
	return time.Time(c)
}

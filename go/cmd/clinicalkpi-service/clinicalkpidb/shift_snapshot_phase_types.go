package clinicalkpidb

import "log"

type ShiftSnapshotPhaseShortName string

const (
	ShiftSnapshotPhaseTypeShortNameIdle    ShiftSnapshotPhaseShortName = "idle"
	ShiftSnapshotPhaseTypeShortNameEnRoute ShiftSnapshotPhaseShortName = "en_route"
	ShiftSnapshotPhaseTypeShortNameOnScene ShiftSnapshotPhaseShortName = "on_scene"
	ShiftSnapshotPhaseTypeShortNameOnBreak ShiftSnapshotPhaseShortName = "on_break"
)

var (
	shiftSnapshotPhaseTypeShortNameToPhaseTypeID = map[ShiftSnapshotPhaseShortName]int64{
		ShiftSnapshotPhaseTypeShortNameIdle:    1,
		ShiftSnapshotPhaseTypeShortNameEnRoute: 2,
		ShiftSnapshotPhaseTypeShortNameOnScene: 3,
		ShiftSnapshotPhaseTypeShortNameOnBreak: 4,
	}
)

// PhaseTypeID is a DB identifier for the shift snapshot phase short name. Panics if invalid.
func (s ShiftSnapshotPhaseShortName) PhaseTypeID() int64 {
	id, ok := shiftSnapshotPhaseTypeShortNameToPhaseTypeID[s]
	if !ok {
		log.Panicf("invalid ShiftSnapshotPhaseShortName: %s", s)
	}
	return id
}

func (s ShiftSnapshotPhaseShortName) String() string {
	return string(s)
}

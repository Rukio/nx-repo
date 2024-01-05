package collections

import (
	"fmt"
	"testing"

	"github.com/*company-data-covered*/services/go/pkg/testutils"
)

func TestLinkedInt64Set(t *testing.T) {
	tcs := []struct {
		Desc   string
		Adds   [][]int64
		AddSet []int64

		ExpectedElems  []int64
		ExpectedMap    map[int64]bool
		ExpectedHas    []int64
		ExpectedNotHas []int64
	}{
		{
			Desc: "Empty",

			ExpectedElems:  []int64{},
			ExpectedMap:    map[int64]bool{},
			ExpectedNotHas: []int64{1},
		},
		{
			Desc: "1 elem",
			Adds: [][]int64{{1}},

			ExpectedElems:  []int64{1},
			ExpectedMap:    map[int64]bool{1: true},
			ExpectedHas:    []int64{1},
			ExpectedNotHas: []int64{2},
		},
		{
			Desc: "2 elem",
			Adds: [][]int64{{1, 2}},

			ExpectedElems:  []int64{1, 2},
			ExpectedMap:    map[int64]bool{1: true, 2: true},
			ExpectedHas:    []int64{1, 2},
			ExpectedNotHas: []int64{3},
		},
		{
			Desc: "Repeated elem",
			Adds: [][]int64{{1, 1}},

			ExpectedElems:  []int64{1},
			ExpectedMap:    map[int64]bool{1: true},
			ExpectedHas:    []int64{1},
			ExpectedNotHas: []int64{2},
		},
		{
			Desc: "Ordered insert elem",
			Adds: [][]int64{{1, 2, 2}},

			ExpectedElems: []int64{1, 2},
			ExpectedMap:   map[int64]bool{1: true, 2: true},
			ExpectedHas:   []int64{1, 2},
		},
		{
			Desc: "Ordered insert elem, unordered",
			Adds: [][]int64{{2, 1, 2}},

			ExpectedElems: []int64{2, 1},
			ExpectedMap:   map[int64]bool{1: true, 2: true},
			ExpectedHas:   []int64{1, 2},
		},
		{
			Desc: "Multiple adds, same elem",
			Adds: [][]int64{
				{1},
				{1},
			},

			ExpectedElems:  []int64{1},
			ExpectedMap:    map[int64]bool{1: true},
			ExpectedHas:    []int64{1},
			ExpectedNotHas: []int64{2},
		},
		{
			Desc: "Multiple adds, 2 elem",
			Adds: [][]int64{
				{1, 2},
				{3, 4},
			},

			ExpectedElems:  []int64{1, 2, 3, 4},
			ExpectedMap:    map[int64]bool{1: true, 2: true, 3: true, 4: true},
			ExpectedHas:    []int64{1, 2, 3, 4},
			ExpectedNotHas: []int64{5},
		},
		{
			Desc: "Multiple adds, overlapping elems",
			Adds: [][]int64{
				{1, 2, 3},
				{1, 4},
			},

			ExpectedElems:  []int64{1, 2, 3, 4},
			ExpectedMap:    map[int64]bool{1: true, 2: true, 3: true, 4: true},
			ExpectedHas:    []int64{1, 2, 3, 4},
			ExpectedNotHas: []int64{5},
		},
		{
			Desc: "Add set",
			Adds: [][]int64{
				{1, 2, 3},
			},
			AddSet: []int64{1, 4},

			ExpectedElems:  []int64{1, 2, 3, 4},
			ExpectedMap:    map[int64]bool{1: true, 2: true, 3: true, 4: true},
			ExpectedHas:    []int64{1, 2, 3, 4},
			ExpectedNotHas: []int64{5},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			set := NewLinkedInt64Set(len(tc.Adds))

			for _, n := range tc.Adds {
				set.Add(n...)
			}

			if tc.AddSet != nil {
				s := NewLinkedInt64Set(len(tc.AddSet))
				s.Add(tc.AddSet...)
				set.AddSet(s)
			}

			testutils.MustMatch(t, tc.ExpectedElems, set.Elems(), "elems doesn't match")
			testutils.MustMatch(t, len(tc.ExpectedElems), set.Size(), "size doesn't match")

			for _, n := range tc.ExpectedHas {
				testutils.MustMatch(t, true, set.Has(n), fmt.Sprintf("set does not contain elem %d", n))
			}
			testutils.MustMatch(t, true, set.Has(tc.ExpectedHas...), "set does not contain all the Has elements")

			for _, n := range tc.ExpectedNotHas {
				testutils.MustMatch(t, false, set.Has(n), fmt.Sprintf("set contains elem %d", n))
			}
			if len(tc.ExpectedNotHas) > 0 {
				testutils.MustMatch(t, false, set.Has(tc.ExpectedNotHas...), "set should not contain all the NotHas elements")
			}

			copyElems := make([]int64, 0, set.Size())
			set.Map(func(v int64) {
				copyElems = append(copyElems, v)
			})
			testutils.MustMatch(t, tc.ExpectedElems, copyElems, "map does not work")

			clone := set.Clone()
			testutils.MustMatch(t, set.Elems(), clone.Elems())
		})
	}
}

func TestUnionSet(t *testing.T) {
	empty := LinkedInt64SetWithElems()
	tcs := []struct {
		Desc   string
		Union  UnionSet[int64]
		Has    []int64
		NotHas []int64
	}{
		{
			Desc:   "single set",
			Union:  UnionSet[int64]{LinkedInt64SetWithElems(1, 2)},
			Has:    []int64{1, 2},
			NotHas: []int64{3},
		},
		{
			Desc:   "two sets",
			Union:  UnionSet[int64]{empty, LinkedInt64SetWithElems(1, 2)},
			Has:    []int64{1, 2},
			NotHas: []int64{3},
		},
		{
			Desc:   "two sets, has elems in diff sets",
			Union:  UnionSet[int64]{LinkedInt64SetWithElems(1), LinkedInt64SetWithElems(2)},
			Has:    []int64{1, 2},
			NotHas: []int64{3},
		},
		{
			Desc:   "two sets, has elems in diff sets, some missing NotHas returns false",
			Union:  UnionSet[int64]{LinkedInt64SetWithElems(1), LinkedInt64SetWithElems(2)},
			NotHas: []int64{2, 3},
		},
		{
			Desc:   "no sets",
			Union:  UnionSet[int64]{},
			Has:    nil,
			NotHas: []int64{3},
		},
		{
			Desc:   "has empty set",
			Union:  UnionSet[int64]{empty},
			Has:    nil,
			NotHas: []int64{3},
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			testutils.MustMatch(t, true, tc.Union.Has(tc.Has...))
			testutils.MustMatch(t, false, tc.Union.Has(tc.NotHas...))
		})
	}
}

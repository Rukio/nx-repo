package collections

// NewLinkedInt64Set returns a LinkedSet for int64.
// Convenience for database IDs that are often int64s.
func NewLinkedInt64Set(capacity int) *LinkedSet[int64] {
	return NewLinkedSet[int64](capacity)
}

// LinkedInt64SetWithElems returns a LinkedSet initially filled w/ elems.
func LinkedInt64SetWithElems(elems ...int64) *LinkedSet[int64] {
	s := NewLinkedSet[int64](len(elems))
	s.Add(elems...)
	return s
}

// LinkedSet is a set of comparable values, that maintains insertion order.
// Not safe for concurrent use.
type LinkedSet[K comparable] struct {
	elems []K
	set   map[K]bool
}

func NewLinkedSet[K comparable](capacity int) *LinkedSet[K] {
	return &LinkedSet[K]{
		elems: make([]K, 0, capacity),
		set:   make(map[K]bool, capacity),
	}
}

func (s *LinkedSet[K]) Add(vs ...K) {
	for _, v := range vs {
		if !s.set[v] {
			s.elems = append(s.elems, v)
			s.set[v] = true
		}
	}
}

// Adds sets' contents directly into this set.
func (s *LinkedSet[K]) AddSet(sets ...*LinkedSet[K]) {
	for _, set := range sets {
		for _, v := range set.elems {
			if !s.set[v] {
				s.elems = append(s.elems, v)
				s.set[v] = true
			}
		}
	}
}

// Returns a copy of the set as a slice.
func (s *LinkedSet[K]) Elems() []K {
	elems := make([]K, len(s.elems))
	copy(elems, s.elems)
	return elems
}

// Returns true if set has all elems.
func (s *LinkedSet[K]) Has(elems ...K) bool {
	for _, v := range elems {
		if !s.set[v] {
			return false
		}
	}

	return true
}

func (s *LinkedSet[K]) Size() int {
	return len(s.elems)
}

func (s *LinkedSet[K]) Map(f func(v K)) {
	for _, e := range s.elems {
		f(e)
	}
}

// Returns a copy of the set.
func (s *LinkedSet[K]) Clone() *LinkedSet[K] {
	cs := NewLinkedSet[K](s.Size())
	cs.AddSet(s)
	return cs
}

type Set[K comparable] interface {
	Has(elems ...K) bool
}

// UnionSet is a union of Sets, for checking set membership.
type UnionSet[K comparable] []Set[K]

func (us UnionSet[K]) Has(elems ...K) bool {
	if len(us) == 0 && len(elems) > 0 {
		return false
	}

NextElem:
	for _, e := range elems {
		for _, s := range us {
			if s.Has(e) {
				continue NextElem
			}
		}

		return false
	}

	return true
}

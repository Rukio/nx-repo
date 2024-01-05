package dh.authz.age

# Converts a date of birth to an age in years
dob_to_age(dob) = z {
	now_ns := time.now_ns()
	dob_ns := time.parse_rfc3339_ns(dob)
	age_ns := time.diff(now_ns, dob_ns)
	z := age_ns[0]
}

# Determines whether a given date of birth is older than a certain age
older_than(dob, age) {
	dob_to_age(dob) > age
}

# Determines whether a given date of birth is younger than a certain age
younger_than(dob, age) {
	dob_to_age(dob) < age
}

adult {
	older_than(input.dob, 17)
}

minor {
	younger_than(input.dob, 18)
}

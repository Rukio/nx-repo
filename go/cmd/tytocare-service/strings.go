package main

func StringIsNilOrEmpty(value *string) bool {
	if value == nil || *value == "" {
		return true
	}
	return false
}

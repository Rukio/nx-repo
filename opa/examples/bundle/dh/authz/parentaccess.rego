package example.dh.authz.parentaccess

import future.keywords.in

# Determines whether a parent can access a minor's care request in a givne location
# for a given diagnosis
parent_can_access_care_request(age, location, diagnosis) {
	age < agelimit(location)
	not location in data.example.diagnoses.restricted_states
	not diagnosis in data.example.diagnoses.sensitive
}

# Given a location what is the access age limit
agelimit(location) = limit {
    limit := data.example.agelimits[location]
}

allow {
	parent_can_access_care_request(input.age, input.location, input.diagnosis)
}

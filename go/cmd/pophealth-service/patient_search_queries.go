package main

import (
	"encoding/json"
	"strconv"
	"strings"
)

var wordBoundaryFn = func(r rune) bool {
	return r == ' ' || r == '-'
}

type PatientSearchParams struct {
	PatientName      string
	PatientFirstName string
	PatientLastName  string
	DOB              string
	SSN              string
	ChannelItemIDs   []int64
	MarketIDs        []int64
}

func (psp *PatientSearchParams) SanitizeParams() {
	psp.PatientName = removeQuotes(psp.PatientName)
	psp.PatientFirstName = removeQuotes(psp.PatientFirstName)
	psp.PatientLastName = removeQuotes(psp.PatientLastName)
	psp.SSN = strings.TrimSpace(strings.ReplaceAll(psp.SSN, "-", ""))
}

func removeQuotes(s string) string {
	return strings.TrimSpace(strings.ReplaceAll(s, `"`, ""))
}

func FirstAndLastNameSearchQuery(searchParams PatientSearchParams) string {
	var must strings.Builder
	must.WriteString("[")
	if len(searchParams.PatientFirstName) > 0 {
		must.WriteString(getWordsFilter("first_name", strings.ToLower(searchParams.PatientFirstName)) + ",")
	}
	if len(searchParams.PatientLastName) > 0 {
		must.WriteString(getWordsFilter("last_name", strings.ToLower(searchParams.PatientLastName)) + ",")
	}
	if len(searchParams.MarketIDs) > 0 {
		must.WriteString(getMarketIDFilter(searchParams.MarketIDs) + ",")
	}
	if len(searchParams.ChannelItemIDs) > 0 {
		must.WriteString(getChannelItemFilter(searchParams.ChannelItemIDs) + ",")
	}

	return getBoolQuery(must.String()[:must.Len()-1] + "]")
}

func NameSearchQuery(searchParams PatientSearchParams) string {
	var must strings.Builder
	must.WriteString(`[{"query_string": {"query": "` +
		queryStringByName(searchParams.PatientName) +
		`"}}`)

	if len(searchParams.MarketIDs) > 0 {
		must.WriteString("," + getMarketIDFilter(searchParams.MarketIDs))
	}

	if len(searchParams.ChannelItemIDs) > 0 {
		must.WriteString("," + getChannelItemFilter(searchParams.ChannelItemIDs))
	}
	must.WriteString("]")

	return getBoolQuery(must.String())
}

func EligibilitySearchQuery(searchParams PatientSearchParams) string {
	var must strings.Builder
	must.WriteString(`[{"term": {"first_name": "` + strings.ToLower(searchParams.PatientFirstName) +
		`"}}, {"term": {"last_name": "` + strings.ToLower(searchParams.PatientLastName) + `"}}, `)
	dobTerm := `{"match": {"dob": "` + searchParams.DOB + `"}}`
	if searchParams.SSN != "" {
		ssnTerm := `{"term": {"ssn": "` + searchParams.SSN + `"}}`
		must.WriteString(getShouldQuery(dobTerm, ssnTerm))
	} else {
		must.WriteString(dobTerm)
	}
	if len(searchParams.ChannelItemIDs) > 0 {
		must.WriteString(", " + getChannelItemFilter(searchParams.ChannelItemIDs))
	}
	must.WriteString("]")
	return getBoolQuery(must.String())
}

func getMarketIDFilter(marketIDs []int64) string {
	jsonMarketIDs, _ := json.Marshal(marketIDs)
	return `{"terms": {"market_id": ` + string(jsonMarketIDs) + `}}`
}

func getChannelItemFilter(channelItemIDs []int64) string {
	terms := make([]string, len(channelItemIDs))
	for i, channelItemID := range channelItemIDs {
		terms[i] = `{"term": {"channel_item_id": ` + strconv.FormatInt(channelItemID, 10) + "}}"
	}
	return getShouldQuery(terms...)
}

func getWordsFilter(field, value string) string {
	var filter strings.Builder
	words := strings.FieldsFunc(value, wordBoundaryFn)
	for _, word := range words {
		filter.WriteString(getWildCardFilter(field, word) + ",")
	}
	return filter.String()[:filter.Len()-1]
}

func getWildCardFilter(field, value string) string {
	return `{"wildcard": {"` + field + `": "` + value + `*"}}`
}

func getBoolQuery(must string) string {
	return `"bool": {"must": ` + must + "}"
}

func getShouldQuery(terms ...string) string {
	if len(terms) == 0 {
		return ""
	}
	var should strings.Builder
	should.WriteString(`{"bool": {"should": [`)
	for _, term := range terms {
		should.WriteString(term + ",")
	}
	return should.String()[:should.Len()-1] + "]}}"
}

func queryStringByName(name string) string {
	terms := strings.Split(strings.ToLower(name), " ")
	for i := range terms {
		terms[i] += "*"
	}
	queryString := strings.Join(terms, " OR ")
	return "first_name:(" + queryString + ") OR last_name:(" + queryString + ")"
}

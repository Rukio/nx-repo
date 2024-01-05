package secrets

// Secret encapsulates a secret value managing its access and presentation.
type Secret struct {
	value string
}

func NewSecret(value string) *Secret {
	return &Secret{value: value}
}

func (s Secret) Value() string {
	return s.value
}

// String prevents accidental leakage of the secret value in cases where default type to string
// conversion may occur such as in logs.
func (s Secret) String() string {
	return "Secret: <value not displayed>"
}

package converters

import (
	"testing"

	athenapb "github.com/*company-data-covered*/services/go/pkg/generated/proto/athena"
	commonpb "github.com/*company-data-covered*/services/go/pkg/generated/proto/common"
	"github.com/*company-data-covered*/services/go/pkg/testutils"
	"github.com/nyaruka/phonenumbers"
	"google.golang.org/protobuf/proto"
)

var (
	careTeamMemberID                 = proto.String("1")
	careTeamMemberClinicalProviderID = proto.String("2")
	careTeamMemberFacilityID         = proto.String("3")
	careTeamMemberProviderID         = proto.String("4")
	careTeamMemberAnsisSpecialty     = proto.String("Anesthesiology")
	careTeamMemberName               = proto.String("Bryan Ferguson Rudolph MD")
	careTeamMemberFirstName          = proto.String("Bryan")
	careTeamMemberLastName           = proto.String("Rudolph")
	careTeamMemberMiddleName         = proto.String("Ferguson")
	careTeamMemberPreferredName      = proto.String("The Bryan")
	careTeamMemberSuffix             = proto.String("MD")
	careTeamMemberAddress1           = proto.String("The children's hospital")
	careTeamMemberAddress2           = proto.String("3415 Bainbridge avenue 4th FL")
	careTeamMemberCity               = proto.String("Bronx")
	careTeamMemberCountry            = proto.String("US")
	careTeamMemberState              = proto.String("NY")
	careTeamMemberZip                = proto.String("10467")
	careTeamMemberFax                = proto.String("3033207823")
	careTeamMemberNPI                = proto.String("1811216948")
	careTeamMemberPhoneNumber        = proto.String("(718) 741-2450")
	recipientClassDesc               = proto.String("Primary Care Provider")
	recipientClassCode               = proto.String("5")

	validBirthSex       = commonpb.BirthSex_BIRTH_SEX_MALE
	validGenderIdentity = commonpb.GenderIdentity{
		Category:     commonpb.GenderIdentity_CATEGORY_OTHER,
		OtherDetails: proto.String("other details"),
	}

	invalidGenderIdentity = commonpb.GenderIdentity{
		Category: commonpb.GenderIdentity_Category(-27),
	}

	validPatientID = proto.String("123")
	validName      = commonpb.Name{
		GivenName:           proto.String("John"),
		FamilyName:          proto.String("Doe"),
		MiddleNameOrInitial: proto.String("Deer"),
		PreferredName:       proto.String("John"),
		Suffix:              proto.String("the third"),
	}
	validDOB = commonpb.Date{
		Year:  1949,
		Month: 04,
		Day:   30,
	}
	validSexString   = proto.String("M")
	validContactInfo = athenapb.ContactInfo{
		HomeNumber: &commonpb.PhoneNumber{
			PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
			CountryCode:     proto.Int32(1),
			PhoneNumber:     proto.String("(555) 067-6888"),
		},
		MobileNumber: &commonpb.PhoneNumber{
			PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
			CountryCode:     proto.Int32(1),
			PhoneNumber:     proto.String("(555) 067-6888"),
		},
		WorkNumber: &commonpb.PhoneNumber{
			PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK,
			CountryCode:     proto.Int32(1),
			PhoneNumber:     proto.String("(555) 067-6888"),
		},
		Email: proto.String("mail@example.com"),
		Address: &commonpb.Address{
			AddressLineOne: proto.String("123 evergreen lane"),
			AddressLineTwo: proto.String("somewhere"),
			City:           proto.String("DELBERTSIDE"),
			State:          proto.String("CO"),
			ZipCode:        proto.String("80014"),
		},
	}
	validEmergencyContact = athenapb.EmergencyContact{
		ContactName:         proto.String("John Deer Doe The Second"),
		ContactRelationship: proto.String("PARENT"),
		ContactMobilephone:  proto.String("5550676888"),
	}
	validGuarantor = athenapb.Guarantor{
		Name: &commonpb.Name{
			GivenName:  proto.String("Harry"),
			FamilyName: proto.String("Tasker"),
			Suffix:     proto.String("OBE"),
		},
		DateOfBirth: &commonpb.Date{
			Year:  1949,
			Month: 04,
			Day:   30,
		},
		ContactInfo: &athenapb.ContactInfo{
			HomeNumber: &commonpb.PhoneNumber{
				PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
				CountryCode:     proto.Int32(1),
				PhoneNumber:     proto.String("(555) 067-6888"),
			},
			Email: proto.String("mail@example.com"),
			Address: &commonpb.Address{
				AddressLineOne: proto.String("558 Toledo Springs, Damari"),
				City:           proto.String("DENVER"),
				State:          proto.String("CO"),
				ZipCode:        proto.String("80014"),
			},
		},
		SameAddressAsPatient:  proto.Bool(false),
		RelationshipToPatient: proto.String("1"),
	}
	validDepartmentID      = proto.String("123")
	validPrimaryProviderID = proto.String("321")
	validPortalAccessGiven = proto.Bool(true)

	goodPatient = athenapb.Patient{
		PatientId:         validPatientID,
		Name:              &validName,
		DateOfBirth:       &validDOB,
		Sex:               validSexString,
		ContactInfo:       &validContactInfo,
		EmergencyContact:  &validEmergencyContact,
		Guarantor:         &validGuarantor,
		DepartmentId:      validDepartmentID,
		PrimaryProviderId: validPrimaryProviderID,
		PortalAccessGiven: validPortalAccessGiven,
		BirthSex:          &validBirthSex,
	}

	patientWithGenderIdentity = athenapb.Patient{
		PatientId:         validPatientID,
		Name:              &validName,
		DateOfBirth:       &validDOB,
		Sex:               validSexString,
		ContactInfo:       &validContactInfo,
		EmergencyContact:  &validEmergencyContact,
		Guarantor:         &validGuarantor,
		DepartmentId:      validDepartmentID,
		PrimaryProviderId: validPrimaryProviderID,
		PortalAccessGiven: validPortalAccessGiven,
		GenderIdentity:    &validGenderIdentity,
	}

	patientWithInvalidGenderIdentity = athenapb.Patient{
		PatientId:         validPatientID,
		Name:              &validName,
		DateOfBirth:       &validDOB,
		Sex:               validSexString,
		ContactInfo:       &validContactInfo,
		EmergencyContact:  &validEmergencyContact,
		Guarantor:         &validGuarantor,
		DepartmentId:      validDepartmentID,
		PrimaryProviderId: validPrimaryProviderID,
		PortalAccessGiven: validPortalAccessGiven,
		GenderIdentity:    &invalidGenderIdentity,
	}
)

func Test_PatientProtoFromAthenaPatient(t *testing.T) {
	type args struct {
		patient Patient
	}
	tests := []struct {
		name    string
		args    args
		want    *athenapb.Patient
		wantErr bool
	}{
		{
			name: "Base Case",
			args: args{
				patient: Patient{
					PatientID: proto.String("123"),
					DOB:       proto.String("04/30/1949"),
					Name: &Name{
						Firstname:     proto.String("John"),
						Lastname:      proto.String("Doe"),
						Middlename:    proto.String("Deer"),
						PreferredName: proto.String("John"),
						Suffix:        proto.String("the third"),
					},
					Sex: proto.String("M"),
					ContactInfo: &ContactInfo{
						HomePhone:   proto.String("5550676888"),
						MobilePhone: proto.String("5550676888"),
						WorkPhone:   proto.String("5550676888"),
						Email:       proto.String("mail@example.com"),
					},
					Address: &Address{
						AddressLineOne: proto.String("123 evergreen lane"),
						AddressLineTwo: proto.String("somewhere"),
						City:           proto.String("DELBERTSIDE"),
						State:          proto.String("CO"),
						ZipCode:        proto.String("80014"),
					},
					EmergencyContact: &EmergencyContact{
						Name:         proto.String("John Deer Doe The Second"),
						Relationship: proto.String("PARENT"),
						MobilePhone:  proto.String("5550676888"),
					},
					Guarantor: &Guarantor{
						Firstname:             proto.String("Harry"),
						Lastname:              proto.String("Tasker"),
						Suffix:                proto.String("OBE"),
						DOB:                   proto.String("04/30/1949"),
						Phone:                 proto.String("5550676888"),
						Email:                 proto.String("mail@example.com"),
						AddressLineOne:        proto.String("558 Toledo Springs, Damari"),
						City:                  proto.String("DENVER"),
						State:                 proto.String("CO"),
						ZipCode:               proto.String("80014"),
						AddressSameAsPatient:  proto.String("false"),
						RelationshipToPatient: proto.String("1"),
					},
					DepartmentID:      proto.String("123"),
					PrimaryProviderID: proto.String("321"),
					PortalAccessGiven: proto.String("true"),
					BirthSex:          proto.String("M"),
				},
			},
			want:    &goodPatient,
			wantErr: false,
		},
		{
			name: "Fields are nullable",
			args: args{
				patient: Patient{},
			},
			want: &athenapb.Patient{},
		},
		{
			name: "PortalAccessGiven is not exactly the string `true`",
			args: args{
				patient: Patient{
					PortalAccessGiven: proto.String("t"),
				},
			},
			want: &athenapb.Patient{
				PortalAccessGiven: proto.Bool(false),
			},
		},
		{
			name: "Guarantor fields are nullable when guarantor is not null or empty",
			args: args{
				patient: Patient{
					Guarantor: &Guarantor{
						Firstname: proto.String("Garyentor"),
					},
				},
			},
			want: &athenapb.Patient{
				Guarantor: &athenapb.Guarantor{
					Name: &commonpb.Name{
						GivenName: proto.String("Garyentor"),
					},
				},
			},
		},
		{
			name: "Guarantor fields are empty when guarantor is empty but not null",
			args: args{
				patient: Patient{
					Guarantor: &Guarantor{},
				},
			},
			want: &athenapb.Patient{
				Guarantor: &athenapb.Guarantor{},
			},
		},
		{
			name: "EmergencyContact fields are nullable when EmergencyContact is not null or empty",
			args: args{
				patient: Patient{
					EmergencyContact: &EmergencyContact{
						Name: proto.String("Emmagensie"),
					},
				},
			},
			want: &athenapb.Patient{
				EmergencyContact: &athenapb.EmergencyContact{
					ContactName: proto.String("Emmagensie"),
				},
			},
		},
		{
			name: "EmergencyContact is empty when EmergencyContact is empty but not null",
			args: args{
				patient: Patient{
					EmergencyContact: &EmergencyContact{},
				},
			},
			want: &athenapb.Patient{
				EmergencyContact: &athenapb.EmergencyContact{},
			},
		},
		{
			name: "Bad DOB format",
			args: args{
				patient: Patient{
					DOB: proto.String("04-30-1949"),
				},
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Wrong value for home phone",
			args: args{
				patient: Patient{
					DOB: proto.String("04/30/1949"),
					ContactInfo: &ContactInfo{
						HomePhone: proto.String("wrong phone format"),
					},
				},
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Wrong value for mobile phone",
			args: args{
				patient: Patient{
					DOB: proto.String("04/30/1949"),
					ContactInfo: &ContactInfo{
						HomePhone:   proto.String("5550676888"),
						MobilePhone: proto.String("wrong phone format"),
					},
				},
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Wrong value for work phone",
			args: args{
				patient: Patient{
					DOB: proto.String("04/30/1949"),
					ContactInfo: &ContactInfo{
						HomePhone:   proto.String("5550676888"),
						MobilePhone: proto.String("5550676888"),
						WorkPhone:   proto.String("wrong phone format"),
					},
				},
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Wrong guarantor DOB format",
			args: args{
				patient: Patient{
					DOB: proto.String("04/30/1949"),
					ContactInfo: &ContactInfo{
						HomePhone:   proto.String("5550676888"),
						MobilePhone: proto.String("5550676888"),
						WorkPhone:   proto.String("5550676888"),
					},
					Guarantor: &Guarantor{
						DOB: proto.String("04-30-1949"),
					},
				},
			},
			want:    nil,
			wantErr: true,
		},
		{
			name: "Wrong guarantor phone",
			args: args{
				patient: Patient{
					DOB: proto.String("04/30/1949"),
					ContactInfo: &ContactInfo{
						HomePhone:   proto.String("5550676888"),
						MobilePhone: proto.String("5550676888"),
						WorkPhone:   proto.String("5550676888"),
					},
					Guarantor: &Guarantor{
						DOB:   proto.String("04/30/1949"),
						Phone: proto.String("wrong phone format"),
					},
				},
			},
			want:    nil,
			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := PatientProtoFromAthenaPatient(tt.args.patient)
			if (err != nil) != tt.wantErr {
				t.Errorf("patientProtoFromAthenaPatient() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			testutils.MustMatchProto(t, tt.want, got)
		})
	}
}

func TestCareTeamMemberToProto(t *testing.T) {
	tests := []struct {
		desc                string
		inputCareTeamMember *CareTeamMember

		wantCareTeamMember *athenapb.CareTeamMember
		hasErr             bool
	}{
		{
			desc: "success - care team member into care team member proto",
			inputCareTeamMember: &CareTeamMember{
				MemberID:           careTeamMemberID,
				ClinicalProviderID: careTeamMemberClinicalProviderID,
				FacilityID:         careTeamMemberFacilityID,
				ProviderID:         careTeamMemberProviderID,
				AnsiSpecialtyName:  careTeamMemberAnsisSpecialty,
				Name:               careTeamMemberName,
				FirstName:          careTeamMemberFirstName,
				LastName:           careTeamMemberLastName,
				MiddleName:         careTeamMemberMiddleName,
				PreferredName:      careTeamMemberPreferredName,
				Suffix:             careTeamMemberSuffix,
				Address1:           careTeamMemberAddress1,
				Address2:           careTeamMemberAddress2,
				City:               careTeamMemberCity,
				Country:            careTeamMemberCountry,
				State:              careTeamMemberState,
				Zip:                careTeamMemberZip,
				Fax:                careTeamMemberFax,
				NPI:                careTeamMemberNPI,
				PhoneNumber:        careTeamMemberPhoneNumber,
				RecipientClass: &RecipientClass{
					Description: recipientClassDesc,
					Code:        recipientClassCode,
				},
			},

			wantCareTeamMember: &athenapb.CareTeamMember{
				Address: &commonpb.Address{
					AddressLineOne: careTeamMemberAddress1,
					AddressLineTwo: careTeamMemberAddress2,
					City:           careTeamMemberCity,
					State:          careTeamMemberState,
					ZipCode:        careTeamMemberZip,
				},
				Name: &commonpb.Name{
					GivenName:           careTeamMemberFirstName,
					FamilyName:          careTeamMemberLastName,
					MiddleNameOrInitial: careTeamMemberMiddleName,
					Suffix:              careTeamMemberSuffix,
					PreferredName:       careTeamMemberPreferredName,
				},
				Phone: &commonpb.PhoneNumber{
					CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
					PhoneNumber:     careTeamMemberPhoneNumber,
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
				},
				ClinicalProviderId: careTeamMemberClinicalProviderID,
				AnsiSpecialtyName:  careTeamMemberAnsisSpecialty,
				Country:            careTeamMemberCountry,
				FacilityId:         careTeamMemberFacilityID,
				MemberId:           careTeamMemberID,
				Npi:                careTeamMemberNPI,
				ProviderId:         careTeamMemberProviderID,
				RecipientClass: &athenapb.RecipientClass{
					Description: recipientClassDesc,
					Code:        recipientClassCode,
				},
			},
		},
		{
			desc:   "failed - care team memeber is nil",
			hasErr: true,
		},
		{
			desc: "failed - wrong phone number format",
			inputCareTeamMember: &CareTeamMember{
				PhoneNumber: proto.String("1"),
			},

			hasErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			converted, err := CareTeamMemberToProto(tt.inputCareTeamMember)
			if (err != nil) != tt.hasErr {
				t.Fatalf("hasError does not match: %v, tt: %+v", err, tt)
			}

			testutils.MustMatchProto(t, tt.wantCareTeamMember, converted)
		})
	}
}

func TestProtoToEnhancedBestMatchRequest(t *testing.T) {
	email := proto.String("lukeskywalker@example.com")
	guarantorEmail := proto.String("daddyvader@example.com")
	homePhone := proto.String("555-300-1518")
	mobilePhone := proto.String("555-500-5555")
	guarantorPhone := proto.String("555-555-5555")
	firstName := "Luke"
	lastName := "Skywalker"
	dobProto := &commonpb.Date{Year: 2000, Month: 10, Day: 11}
	dob := "10/11/2000"
	zip := "43215"

	tcs := []struct {
		desc  string
		proto *athenapb.EnhancedBestMatchRequest

		want    *EnhancedBestMatchRequest
		wantErr bool
	}{
		{
			desc: "Base case",
			proto: &athenapb.EnhancedBestMatchRequest{
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: dobProto,
				HomePhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
					PhoneNumber:     homePhone,
				},
				MobilePhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					PhoneNumber:     mobilePhone,
				},
				Email: email,
			},

			want: &EnhancedBestMatchRequest{
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: dob,
				HomePhone:   homePhone,
				MobilePhone: mobilePhone,
				Email:       email,
			},
		},
		{
			desc: "All fields",
			proto: &athenapb.EnhancedBestMatchRequest{
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: dobProto,
				HomePhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
					PhoneNumber:     homePhone,
				},
				MobilePhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					PhoneNumber:     mobilePhone,
				},
				Email: email,
				GuarantorPhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					PhoneNumber:     guarantorPhone,
				},
				GuarantorEmail:    guarantorEmail,
				ZipCode:           zip,
				MinimumScore:      proto.Float32(23.5),
				DepartmentId:      proto.String("testdeptid"),
				UseSoundexSearch:  false,
				ReturnBestMatches: false,
			},

			want: &EnhancedBestMatchRequest{
				FirstName:         firstName,
				LastName:          lastName,
				DateOfBirth:       dob,
				HomePhone:         homePhone,
				MobilePhone:       mobilePhone,
				Email:             email,
				GuarantorPhone:    guarantorPhone,
				GuarantorEmail:    guarantorEmail,
				Zip:               zip,
				MinimumScore:      proto.Float32(23.5),
				DepartmentID:      proto.String("testdeptid"),
				UseSoundexSearch:  false,
				ReturnBestMatches: false,
			},
		},
		{
			desc: "Incorrect home phone number type",
			proto: &athenapb.EnhancedBestMatchRequest{
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: &commonpb.Date{Year: 2000, Month: 10, Day: 11},
				HomePhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_MOBILE,
					PhoneNumber:     homePhone,
				},
			},

			wantErr: true,
		},
		{
			desc: "Incorrect mobile phone number type",
			proto: &athenapb.EnhancedBestMatchRequest{
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: dobProto,
				MobilePhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
					PhoneNumber:     mobilePhone,
				},
			},

			wantErr: true,
		},
		{
			desc: "Only required fields",
			proto: &athenapb.EnhancedBestMatchRequest{
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: dobProto,
			},

			want: &EnhancedBestMatchRequest{
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: dob,
			},
		},
		{
			desc: "SoundexSearch and ReturnBestMatches flags are respected",
			proto: &athenapb.EnhancedBestMatchRequest{
				FirstName:         firstName,
				LastName:          lastName,
				DateOfBirth:       dobProto,
				UseSoundexSearch:  true,
				ReturnBestMatches: true,
			},

			want: &EnhancedBestMatchRequest{
				FirstName:         firstName,
				LastName:          lastName,
				DateOfBirth:       dob,
				UseSoundexSearch:  true,
				ReturnBestMatches: true,
			},
		},
		{
			desc: "Zipcode is included",
			proto: &athenapb.EnhancedBestMatchRequest{
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: dobProto,
				ZipCode:     zip,
			},

			want: &EnhancedBestMatchRequest{
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: dob,
				Zip:         zip,
			},
		},
		{
			desc: "Date of birth is nil",
			proto: &athenapb.EnhancedBestMatchRequest{
				FirstName:   firstName,
				LastName:    lastName,
				DateOfBirth: nil,
			},

			wantErr: true,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			enhancedBestMatchProto, err := ProtoToEnhancedBestMatchRequest(tc.proto)
			if err != nil && !tc.wantErr {
				t.Fatalf("unexpected error: %s", err)
			}
			testutils.MustMatch(t, tc.want, enhancedBestMatchProto)
		})
	}
}

func TestEnhancedBestMatchResultToProto(t *testing.T) {
	tcs := []struct {
		desc    string
		result  EnhancedBestMatchResult
		wantErr bool

		want *athenapb.EnhancedBestMatchResult
	}{
		{
			desc: "Base case",
			result: EnhancedBestMatchResult{
				Patient: &Patient{
					Name: &Name{
						Firstname: proto.String("Luke"),
						Lastname:  proto.String("Skywalker"),
					},
					DOB: proto.String("10/11/2000"),
				},
				Score: "23.14",
			},

			want: &athenapb.EnhancedBestMatchResult{
				Patient: &athenapb.Patient{
					Name: &commonpb.Name{
						GivenName:  proto.String("Luke"),
						FamilyName: proto.String("Skywalker"),
					},
					DateOfBirth: &commonpb.Date{Year: 2000, Month: 10, Day: 11},
				},
				ScoreString: "23.14",
			},
		},
		{
			desc: "Float Score",
			result: EnhancedBestMatchResult{
				Patient: &Patient{
					Name: &Name{
						Firstname: proto.String("Luke"),
						Lastname:  proto.String("Skywalker"),
					},
					DOB: proto.String("10/11/2000"),
				},
				Score: 23.14,
			},

			want: &athenapb.EnhancedBestMatchResult{
				Patient: &athenapb.Patient{
					Name: &commonpb.Name{
						GivenName:  proto.String("Luke"),
						FamilyName: proto.String("Skywalker"),
					},
					DateOfBirth: &commonpb.Date{Year: 2000, Month: 10, Day: 11},
				},
				ScoreString: "23.14",
			},
		},
		{
			desc: "Unrecognized Score Type",
			result: EnhancedBestMatchResult{
				Patient: &Patient{
					Name: &Name{
						Firstname: proto.String("Luke"),
						Lastname:  proto.String("Skywalker"),
					},
					DOB: proto.String("10/11/2000"),
				},
			},

			wantErr: true,
		},
		{
			desc: "Larger result data",
			result: EnhancedBestMatchResult{
				Patient: &Patient{
					PatientID: proto.String("A1234"),
					Sex:       proto.String("M"),
					Name: &Name{
						Firstname: proto.String("Luke"),
						Lastname:  proto.String("Skywalker"),
					},
					DOB: proto.String("10/11/2000"),
					Address: &Address{
						ZipCode: proto.String("43215"),
					},
					ContactInfo: &ContactInfo{
						WorkPhone: proto.String("555-555-5556"),
					},
					EmergencyContact: &EmergencyContact{
						Name:        proto.String("Leia Organa"),
						MobilePhone: proto.String("555-555-5557"),
					},
					Guarantor: &Guarantor{
						Lastname: proto.String("Kenobi"),
					},
					DepartmentID:      proto.String("2"),
					PrimaryProviderID: proto.String("504"),
					PortalAccessGiven: proto.String("true"),
				},
				Score: "23.14",
			},

			want: &athenapb.EnhancedBestMatchResult{
				Patient: &athenapb.Patient{
					PatientId: proto.String("A1234"),
					Sex:       proto.String("M"),
					Name: &commonpb.Name{
						GivenName:  proto.String("Luke"),
						FamilyName: proto.String("Skywalker"),
					},
					ContactInfo: &athenapb.ContactInfo{
						Address: &commonpb.Address{
							ZipCode: proto.String("43215"),
						},
						WorkNumber: &commonpb.PhoneNumber{
							CountryCode:     proto.Int32(1),
							PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK,
							PhoneNumber:     proto.String("(555) 555-5556"),
						},
					},
					EmergencyContact: &athenapb.EmergencyContact{
						ContactName:        proto.String("Leia Organa"),
						ContactMobilephone: proto.String("555-555-5557"),
					},
					Guarantor: &athenapb.Guarantor{
						Name: &commonpb.Name{FamilyName: proto.String("Kenobi")},
					},
					DepartmentId:      proto.String("2"),
					PrimaryProviderId: proto.String("504"),
					DateOfBirth:       &commonpb.Date{Year: 2000, Month: 10, Day: 11},
					PortalAccessGiven: proto.Bool(true),
				},
				ScoreString: "23.14",
			},
		},
		{
			desc: "Nil patient",
			result: EnhancedBestMatchResult{
				Patient: nil,
				Score:   "23.14",
			},

			wantErr: true,
		},
	}
	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			proto, err := EnhancedBestMatchResultToProto(tc.result)
			if err != nil && !tc.wantErr {
				t.Fatalf("Unexpected error received: %s", err)
			}
			testutils.MustMatchProto(t, tc.want, proto)
		})
	}
}

func Test_patientPreferredPharmacyProtoFromAthena(t *testing.T) {
	type args struct {
		patientPreferredPharmacy []Pharmacy
	}
	tests := []struct {
		name string
		args args

		want           []*athenapb.Pharmacy
		wantErrMessage string
	}{
		{
			name: "Base Case",
			args: args{
				patientPreferredPharmacy: []Pharmacy{
					{
						PharmacyType:         proto.String("RETAIL"),
						DefaultPharmacy:      proto.String("true"),
						State:                proto.String("CO"),
						City:                 proto.String("Littleton"),
						ReceiverType:         proto.String(""),
						AcceptFax:            proto.String("true"),
						ClinicalProviderID:   proto.String("10837085"),
						Zip:                  proto.String("80123"),
						PhoneNumber:          proto.String("3033213213"),
						ClinicalProviderName: proto.String("King Soopers PatientPreferredPharmacyProtoFromAthena 123123"),
						Address1:             proto.String("1234 W Belleview"),
						Address2:             proto.String("4321 W Belleview"),
						FaxNumber:            proto.String("3031231234"),
					},
				},
			},

			want: []*athenapb.Pharmacy{
				{
					PharmacyType:    proto.String("RETAIL"),
					DefaultPharmacy: proto.String("true"),
					Address: &commonpb.Address{
						AddressLineOne: proto.String("1234 W Belleview"),
						AddressLineTwo: proto.String("4321 W Belleview"),
						State:          proto.String("CO"),
						City:           proto.String("Littleton"),
						ZipCode:        proto.String("80123"),
					},
					ClinicalProvider: &athenapb.ClinicalProvider{
						Id:   proto.String("10837085"),
						Name: proto.String("King Soopers PatientPreferredPharmacyProtoFromAthena 123123"),
					},
					ReceiverType: proto.String(""),
					AcceptFax:    proto.String("true"),
					PhoneNumber: &commonpb.PhoneNumber{
						PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK,
						CountryCode:     proto.Int32(1),
						PhoneNumber:     proto.String("(303) 321-3213"),
					},
					FaxNumber: proto.String("3031231234"),
				},
			},
		},
		{
			name: "returns nil when given empty array",
			args: args{
				patientPreferredPharmacy: []Pharmacy{},
			},

			want:           nil,
			wantErrMessage: "unable to parse pharmacy phone number: could not parse phone number: the phone number supplied is not a number",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := PatientPreferredPharmaciesProtoFromAthena(tt.args.patientPreferredPharmacy)
			if err != nil {
				if tt.wantErrMessage != "" {
					testutils.MustMatch(t, tt.wantErrMessage, err.Error())
					return
				}

				t.Errorf("patientPreferredPharmaciesProtoFromAthena() error = %v, tt: %+v", err, tt)
				return
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func Test_patientDefaultPharmacyProtoFromAthena(t *testing.T) {
	type args struct {
		patientDefaultPharmacy Pharmacy
	}
	tests := []struct {
		name           string
		args           args
		want           *athenapb.Pharmacy
		wantErrMessage string
	}{
		{
			name: "Base Case",
			args: args{
				patientDefaultPharmacy: Pharmacy{
					PharmacyType:         proto.String("RETAIL"),
					DefaultPharmacy:      proto.String("true"),
					State:                proto.String("CO"),
					City:                 proto.String("Littleton"),
					ReceiverType:         proto.String(""),
					AcceptFax:            proto.String("true"),
					ClinicalProviderID:   proto.String("10837085"),
					Zip:                  proto.String("80123"),
					PhoneNumber:          proto.String("3033213213"),
					ClinicalProviderName: proto.String("King Soopers PatientPreferredPharmacyProtoFromAthena 123123"),
					Address1:             proto.String("1234 W Belleview"),
					Address2:             proto.String("4321 W Belleview"),
					FaxNumber:            proto.String("3031231234"),
				},
			},

			want: &athenapb.Pharmacy{
				PharmacyType:    proto.String("RETAIL"),
				DefaultPharmacy: proto.String("true"),
				Address: &commonpb.Address{
					AddressLineOne: proto.String("1234 W Belleview"),
					AddressLineTwo: proto.String("4321 W Belleview"),
					State:          proto.String("CO"),
					City:           proto.String("Littleton"),
					ZipCode:        proto.String("80123"),
				},
				ClinicalProvider: &athenapb.ClinicalProvider{
					Id:   proto.String("10837085"),
					Name: proto.String("King Soopers PatientPreferredPharmacyProtoFromAthena 123123"),
				},
				ReceiverType: proto.String(""),
				AcceptFax:    proto.String("true"),
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK,
					CountryCode:     proto.Int32(1),
					PhoneNumber:     proto.String("(303) 321-3213"),
				},
				FaxNumber: proto.String("3031231234"),
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := PatientDefaultPharmacyProtoFromAthena(tt.args.patientDefaultPharmacy)
			if err != nil {
				if tt.wantErrMessage != "" {
					testutils.MustMatch(t, tt.wantErrMessage, err.Error())
					return
				}

				t.Errorf("patientDefaultPharmacyProtoFromAthena() error = %v, tt: %+v", err, tt)
				return
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestProtoPharmacyFromAthena(t *testing.T) {
	type args struct {
		pharmacy Pharmacy
	}
	tests := []struct {
		name string
		args args

		want           *athenapb.Pharmacy
		wantErrMessage string
	}{
		{
			name: "Base Case",
			args: args{
				Pharmacy{
					PharmacyType:         proto.String("RETAIL"),
					DefaultPharmacy:      proto.String("true"),
					State:                proto.String("CO"),
					City:                 proto.String("Littleton"),
					ReceiverType:         proto.String(""),
					AcceptFax:            proto.String("true"),
					ClinicalProviderID:   proto.String("10837085"),
					Zip:                  proto.String("80123"),
					PhoneNumber:          proto.String("3033213213"),
					ClinicalProviderName: proto.String("King Soopers PatientPreferredPharmacyProtoFromAthena 123123"),
					Address1:             proto.String("1234 W Belleview"),
					Address2:             proto.String("4321 W Belleview"),
					FaxNumber:            proto.String("3031231234"),
				},
			},

			want: &athenapb.Pharmacy{
				PharmacyType:    proto.String("RETAIL"),
				DefaultPharmacy: proto.String("true"),
				Address: &commonpb.Address{
					AddressLineOne: proto.String("1234 W Belleview"),
					AddressLineTwo: proto.String("4321 W Belleview"),
					State:          proto.String("CO"),
					City:           proto.String("Littleton"),
					ZipCode:        proto.String("80123"),
				},
				ClinicalProvider: &athenapb.ClinicalProvider{
					Id:   proto.String("10837085"),
					Name: proto.String("King Soopers PatientPreferredPharmacyProtoFromAthena 123123"),
				},
				ReceiverType: proto.String(""),
				AcceptFax:    proto.String("true"),
				PhoneNumber: &commonpb.PhoneNumber{
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_WORK,
					CountryCode:     proto.Int32(1),
					PhoneNumber:     proto.String("(303) 321-3213"),
				},
				FaxNumber: proto.String("3031231234"),
			},
		},
		{
			name: "return an error : case unable to parse pharmacy phone number error",
			args: args{
				Pharmacy{
					PharmacyType:         proto.String("RETAIL"),
					DefaultPharmacy:      proto.String("true"),
					State:                proto.String("CO"),
					City:                 proto.String("Littleton"),
					ReceiverType:         proto.String(""),
					AcceptFax:            proto.String("true"),
					ClinicalProviderID:   proto.String("10837085"),
					Zip:                  proto.String("80123"),
					PhoneNumber:          proto.String("symbols-phone"),
					ClinicalProviderName: proto.String("King Soopers PatientPreferredPharmacyProtoFromAthena 123123"),
					Address1:             proto.String("1234 W Belleview"),
					Address2:             proto.String("4321 W Belleview"),
					FaxNumber:            proto.String("3031231234"),
				},
			},

			want:           nil,
			wantErrMessage: "unable to parse pharmacy phone number: could not parse phone number: the phone number supplied is not a number",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := protoPharmacyFromAthena(tt.args.pharmacy)
			if err != nil {
				if tt.wantErrMessage != "" {
					testutils.MustMatch(t, tt.wantErrMessage, err.Error())
					return
				}

				t.Errorf("protoPharmacyFromAthena() error = %v, tt: %+v", err, tt)
				return
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestAPIPatientFromPatientProto(t *testing.T) {
	type args struct {
		patient *athenapb.Patient
	}

	tests := []struct {
		name    string
		args    args
		want    *Patient
		wantErr bool
	}{
		{
			name: "Base Case",
			args: args{
				patient: &goodPatient,
			},
			want: &Patient{
				DOB: proto.String("04/30/1949"),
				Name: &Name{
					Firstname:     proto.String("John"),
					Lastname:      proto.String("Doe"),
					Middlename:    proto.String("Deer"),
					PreferredName: proto.String("John"),
					Suffix:        proto.String("the third"),
				},
				Sex: proto.String("M"),
				ContactInfo: &ContactInfo{
					HomePhone:   proto.String("(555) 067-6888"),
					MobilePhone: proto.String("(555) 067-6888"),
					WorkPhone:   proto.String("(555) 067-6888"),
					Email:       proto.String("mail@example.com"),
				},
				Address: &Address{
					AddressLineOne: proto.String("123 evergreen lane"),
					AddressLineTwo: proto.String("somewhere"),
					State:          proto.String("CO"),
					ZipCode:        proto.String("80014"),
					City:           proto.String("DELBERTSIDE"),
				},
				EmergencyContact: &EmergencyContact{
					Name:         proto.String("John Deer Doe The Second"),
					Relationship: proto.String("PARENT"),
					MobilePhone:  proto.String("5550676888"),
				},
				Guarantor: &Guarantor{
					Firstname:             proto.String("Harry"),
					Lastname:              proto.String("Tasker"),
					Suffix:                proto.String("OBE"),
					DOB:                   proto.String("04/30/1949"),
					Phone:                 proto.String("(555) 067-6888"),
					Email:                 proto.String("mail@example.com"),
					AddressLineOne:        proto.String("558 Toledo Springs, Damari"),
					City:                  proto.String("DENVER"),
					State:                 proto.String("CO"),
					ZipCode:               proto.String("80014"),
					AddressSameAsPatient:  proto.String("false"),
					RelationshipToPatient: proto.String("1"),
				},
				DepartmentID:      proto.String("123"),
				PrimaryProviderID: proto.String("321"),
				PortalAccessGiven: proto.String("true"),
				BirthSex:          proto.String("M"),
			},
			wantErr: false,
		},
		{
			name: "success - with gender identity",
			args: args{
				patient: &patientWithGenderIdentity,
			},

			want: &Patient{
				DOB: proto.String("04/30/1949"),
				Name: &Name{
					Firstname:     proto.String("John"),
					Lastname:      proto.String("Doe"),
					Middlename:    proto.String("Deer"),
					PreferredName: proto.String("John"),
					Suffix:        proto.String("the third"),
				},
				Sex: proto.String("M"),
				ContactInfo: &ContactInfo{
					HomePhone:   proto.String("(555) 067-6888"),
					MobilePhone: proto.String("(555) 067-6888"),
					WorkPhone:   proto.String("(555) 067-6888"),
					Email:       proto.String("mail@example.com"),
				},
				Address: &Address{
					AddressLineOne: proto.String("123 evergreen lane"),
					AddressLineTwo: proto.String("somewhere"),
					State:          proto.String("CO"),
					ZipCode:        proto.String("80014"),
					City:           proto.String("DELBERTSIDE"),
				},
				EmergencyContact: &EmergencyContact{
					Name:         proto.String("John Deer Doe The Second"),
					Relationship: proto.String("PARENT"),
					MobilePhone:  proto.String("5550676888"),
				},
				Guarantor: &Guarantor{
					Firstname:             proto.String("Harry"),
					Lastname:              proto.String("Tasker"),
					Suffix:                proto.String("OBE"),
					DOB:                   proto.String("04/30/1949"),
					Phone:                 proto.String("(555) 067-6888"),
					Email:                 proto.String("mail@example.com"),
					AddressLineOne:        proto.String("558 Toledo Springs, Damari"),
					City:                  proto.String("DENVER"),
					State:                 proto.String("CO"),
					ZipCode:               proto.String("80014"),
					AddressSameAsPatient:  proto.String("false"),
					RelationshipToPatient: proto.String("1"),
				},
				DepartmentID:        proto.String("123"),
				PrimaryProviderID:   proto.String("321"),
				PortalAccessGiven:   proto.String("true"),
				GenderIdentity:      proto.String("Additional gender category / other, please specify"),
				GenderIdentityOther: proto.String("other details"),
			},
			wantErr: false,
		},
		{
			name: "success - with invalid gender identity",
			args: args{
				patient: &patientWithInvalidGenderIdentity,
			},

			want: &Patient{
				DOB: proto.String("04/30/1949"),
				Name: &Name{
					Firstname:     proto.String("John"),
					Lastname:      proto.String("Doe"),
					Middlename:    proto.String("Deer"),
					PreferredName: proto.String("John"),
					Suffix:        proto.String("the third"),
				},
				Sex: proto.String("M"),
				ContactInfo: &ContactInfo{
					HomePhone:   proto.String("(555) 067-6888"),
					MobilePhone: proto.String("(555) 067-6888"),
					WorkPhone:   proto.String("(555) 067-6888"),
					Email:       proto.String("mail@example.com"),
				},
				Address: &Address{
					AddressLineOne: proto.String("123 evergreen lane"),
					AddressLineTwo: proto.String("somewhere"),
					State:          proto.String("CO"),
					ZipCode:        proto.String("80014"),
					City:           proto.String("DELBERTSIDE"),
				},
				EmergencyContact: &EmergencyContact{
					Name:         proto.String("John Deer Doe The Second"),
					Relationship: proto.String("PARENT"),
					MobilePhone:  proto.String("5550676888"),
				},
				Guarantor: &Guarantor{
					Firstname:             proto.String("Harry"),
					Lastname:              proto.String("Tasker"),
					Suffix:                proto.String("OBE"),
					DOB:                   proto.String("04/30/1949"),
					Phone:                 proto.String("(555) 067-6888"),
					Email:                 proto.String("mail@example.com"),
					AddressLineOne:        proto.String("558 Toledo Springs, Damari"),
					City:                  proto.String("DENVER"),
					State:                 proto.String("CO"),
					ZipCode:               proto.String("80014"),
					AddressSameAsPatient:  proto.String("false"),
					RelationshipToPatient: proto.String("1"),
				},
				DepartmentID:      proto.String("123"),
				PrimaryProviderID: proto.String("321"),
				PortalAccessGiven: proto.String("true"),
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := PatientFromPatientProto(tt.args.patient)
			if (err != nil) != tt.wantErr {
				t.Errorf("PatientFromPatientProto() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestContactInfoFromProto(t *testing.T) {
	type args struct {
		contactInfo *athenapb.ContactInfo
	}
	tests := []struct {
		name string
		args args

		wantContactInfo *ContactInfo
	}{
		{
			name: "Base case",
			args: args{
				contactInfo: goodPatient.ContactInfo,
			},
			wantContactInfo: &ContactInfo{
				HomePhone:   proto.String("(555) 067-6888"),
				MobilePhone: proto.String("(555) 067-6888"),
				WorkPhone:   proto.String("(555) 067-6888"),
				Email:       proto.String("mail@example.com"),
			},
		},
		{
			name: "returns nil if contactInfo is not set",
			args: args{
				contactInfo: nil,
			},
			wantContactInfo: nil,
		},

		{
			name: "returns nil if contactInfo.Address is the only value set",
			args: args{
				contactInfo: &athenapb.ContactInfo{
					Address: &commonpb.Address{
						AddressLineOne: proto.String("Street name"),
					},
				},
			},
			wantContactInfo: &ContactInfo{},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := contactInfoFromProto(tt.args.contactInfo)
			testutils.MustMatch(t, tt.wantContactInfo, got)
		})
	}
}

func TestAddressFromProto(t *testing.T) {
	type args struct {
		contactInfo *athenapb.ContactInfo
	}
	tests := []struct {
		name string
		args args

		wantAddress *Address
	}{
		{
			name: "Base case",
			args: args{
				contactInfo: goodPatient.ContactInfo,
			},
			wantAddress: &Address{
				AddressLineOne: proto.String("123 evergreen lane"),
				AddressLineTwo: proto.String("somewhere"),
				State:          proto.String("CO"),
				ZipCode:        proto.String("80014"),
				City:           proto.String("DELBERTSIDE"),
			},
		},
		{
			name: "Returns nil if contact info is not set",
			args: args{
				contactInfo: nil,
			},
			wantAddress: nil,
		},
		{
			name: "Returns nil if contactInfo is the only field set",
			args: args{
				contactInfo: &athenapb.ContactInfo{
					Email: proto.String("mail@example.com"),
				},
			},
			wantAddress: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := addressFromProto(tt.args.contactInfo)
			testutils.MustMatch(t, tt.wantAddress, got)
		})
	}
}

func TestEmergencyContactFromProto(t *testing.T) {
	type args struct {
		contact *athenapb.EmergencyContact
	}
	tests := []struct {
		name string
		args args

		wantEmergencyContact *EmergencyContact
	}{
		{
			name: "Base Case",
			args: args{
				contact: goodPatient.EmergencyContact,
			},
			wantEmergencyContact: &EmergencyContact{
				Name:         proto.String("John Deer Doe The Second"),
				Relationship: proto.String("PARENT"),
				MobilePhone:  proto.String("5550676888"),
			},
		},
		{
			name: "returns nil if contact is not set",
			args: args{
				contact: nil,
			},
			wantEmergencyContact: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := emergencyContactFromProto(tt.args.contact)
			testutils.MustMatch(t, tt.wantEmergencyContact, got)
		})
	}
}

func TestGuarantorFromProto(t *testing.T) {
	type args struct {
		guarantor *athenapb.Guarantor
	}
	tests := []struct {
		name string
		args args

		wantGuarantor *Guarantor
	}{
		{
			name: "Base Case",
			args: args{
				guarantor: goodPatient.Guarantor,
			},
			wantGuarantor: &Guarantor{
				Firstname:             proto.String("Harry"),
				Lastname:              proto.String("Tasker"),
				Suffix:                proto.String("OBE"),
				DOB:                   proto.String("04/30/1949"),
				Phone:                 proto.String("(555) 067-6888"),
				Email:                 proto.String("mail@example.com"),
				AddressLineOne:        proto.String("558 Toledo Springs, Damari"),
				City:                  proto.String("DENVER"),
				State:                 proto.String("CO"),
				ZipCode:               proto.String("80014"),
				AddressSameAsPatient:  proto.String("false"),
				RelationshipToPatient: proto.String("1"),
			},
		},
		{
			name: "returns nil if guarantor is nil",
			args: args{
				guarantor: nil,
			},
			wantGuarantor: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := guarantorFromProto(tt.args.guarantor)
			testutils.MustMatch(t, tt.wantGuarantor, got)
		})
	}
}

func TestPatientNameFromProto(t *testing.T) {
	type args struct {
		name *commonpb.Name
	}
	tests := []struct {
		name string
		args args

		wantName *Name
	}{
		{
			name: "Base Case",
			args: args{
				name: goodPatient.Name,
			},
			wantName: &Name{
				Firstname:     proto.String("John"),
				Lastname:      proto.String("Doe"),
				Middlename:    proto.String("Deer"),
				PreferredName: proto.String("John"),
				Suffix:        proto.String("the third"),
			},
		},
		{
			name: "returns nil if name proto is nil",
			args: args{
				name: nil,
			},
			wantName: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := patientNameFromProto(tt.args.name)
			testutils.MustMatch(t, tt.wantName, got)
		})
	}
}

func TestStructToURLValues(t *testing.T) {
	type baseCaseStruct struct {
		FirstName string `url:"given_name" json:"firstName"`
		LastName  string `url:"family_name" json:"lastName"`
	}
	type omitCaseStruct struct {
		FirstName string `url:"given_name,omitempty"`
		LastName  string `url:"family_name,omitempty"`
		Age       int    `url:"age,omitempty"`
		SSN       int    `url:"-"`
	}
	type noTaggedStruct struct {
		FirstName string
		LastName  string
	}
	type pointerValueStruct struct {
		FirstName *string `json:"firstName"`
		LastName  *string `json:"lastName"`
		NickName  string  `json:"nickName"`
	}
	type embeddedStruct struct {
		*pointerValueStruct
		PtrField      *string `json:"pointer_field"`
		Field         string  `json:"field"`
		RegularStruct struct {
			Field string
		} `json:"regular_struct"`
	}
	type args struct {
		i       any
		tagname string
	}
	tests := []struct {
		name string
		args args

		wantEncoded string
	}{
		{
			name: "Base Case",
			args: args{
				i: &baseCaseStruct{
					FirstName: "John",
					LastName:  "Doe",
				},
				tagname: "url",
			},

			wantEncoded: "family_name=Doe&given_name=John",
		},
		{
			name: "returns empty if input is nil",
			args: args{
				i:       nil,
				tagname: "json",
			},

			wantEncoded: "",
		},
		{
			name: "custom tag can be used",
			args: args{
				i: &baseCaseStruct{
					FirstName: "John",
					LastName:  "Doe",
				},
				tagname: "json",
			},

			wantEncoded: "firstName=John&lastName=Doe",
		},
		{
			name: "'-' named fields are omitted",
			args: args{
				i: &omitCaseStruct{
					FirstName: "John",
					LastName:  "Doe",
					Age:       10,
					SSN:       12345678,
				},
				tagname: "url",
			},

			wantEncoded: "age=10&family_name=Doe&given_name=John",
		},
		{
			name: "empty fields are omitted if omitempty option is present",
			args: args{
				i: &omitCaseStruct{
					FirstName: "John",
					SSN:       12345678,
				},
				tagname: "url",
			},

			wantEncoded: "given_name=John",
		},
		{
			name: "Field Name is used for structs with no tag",
			args: args{
				i: &noTaggedStruct{
					FirstName: "John",
					LastName:  "Doe",
				},
				tagname: "json",
			},

			wantEncoded: "FirstName=John&LastName=Doe",
		},
		{
			name: "pointer values must be de-referenced",
			args: args{
				i: &pointerValueStruct{
					FirstName: proto.String("John"),
					LastName:  proto.String("Doe"),
					NickName:  "nobody",
				},
				tagname: "json",
			},

			wantEncoded: "firstName=John&lastName=Doe&nickName=nobody",
		},
		{
			name: "embeded structs are evaluated and included in returned url.Values",
			args: args{
				i: &embeddedStruct{
					pointerValueStruct: &pointerValueStruct{
						FirstName: proto.String("Nick"),
						LastName:  proto.String("Young"),
						NickName:  "Young Nick",
					},
					PtrField: proto.String("value"),
					Field:    "value",
				},
				tagname: "json",
			},

			wantEncoded: "field=value&firstName=Nick&lastName=Young&nickName=Young+Nick&pointer_field=value",
		},

		{
			name: "null values should not be included in url.Values",
			args: args{
				i: &embeddedStruct{
					Field: "value",
				},
				tagname: "json",
			},

			wantEncoded: "field=value",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := StructToURLValues(tt.args.i, tt.args.tagname)
			encoded := got.Encode()
			testutils.MustMatch(t, tt.wantEncoded, encoded)
		})
	}
}

func Test_insuranceHolderFromProto(t *testing.T) {
	sex := commonpb.Sex_SEX_MALE
	relationToPatient19 := athenapb.RelationToPatient_RELATION_TO_PATIENT_FATHER
	type args struct {
		holder *athenapb.PrimaryInsuranceHolder
	}
	tests := []struct {
		name string
		args args
		want *InsuranceHolder
	}{
		{
			name: "Base Case",
			args: args{
				holder: &athenapb.PrimaryInsuranceHolder{
					Name: &commonpb.Name{
						GivenName:  proto.String("Bruce"),
						FamilyName: proto.String("Wayne"),
					},
					DateOfBirth: &commonpb.Date{
						Year:  1972,
						Month: 2,
						Day:   19,
					},
					Sex:      &sex,
					Relation: &relationToPatient19,
				},
			},
			want: &InsuranceHolder{
				InsuranceHolderName: &InsuranceHolderName{
					FirstName:  proto.String("Bruce"),
					MiddleName: nil,
					LastName:   proto.String("Wayne"),
				},
				DOB:                        proto.String("02/19/1972"),
				Sex:                        proto.String("M"),
				RelationshipToPolicyHolder: proto.String("19"),
			},
		},
		{
			name: "correctly handles nil input values",
			args: args{
				holder: &athenapb.PrimaryInsuranceHolder{
					Sex:      &sex,
					Relation: &relationToPatient19,
				},
			},
			want: &InsuranceHolder{
				Sex:                        proto.String("M"),
				RelationshipToPolicyHolder: proto.String("19"),
			},
		},
		{
			name: "returns nil if holder is nil",
			args: args{
				holder: nil,
			},
			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := insuranceHolderFromProto(tt.args.holder)
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestPatientInsuranceRecordFromInsuranceProto(t *testing.T) {
	sex := commonpb.Sex_SEX_MALE
	relationToPatient19 := athenapb.RelationToPatient_RELATION_TO_PATIENT_FATHER
	type args struct {
		insurance *athenapb.Insurance
	}
	tests := []struct {
		name string
		args args
		want *PatientInsurance
	}{
		{
			name: "Base Case",
			args: args{
				insurance: &athenapb.Insurance{
					PatientId:    proto.String("1234"),
					DepartmentId: proto.String("1423"),
					MemberId:     proto.String("4321"),
					PackageId:    proto.Int64(12345),
					GroupId:      proto.Int64(54321),
					PrimaryInsuranceHolder: &athenapb.PrimaryInsuranceHolder{
						Name: &commonpb.Name{
							GivenName:           proto.String("Bruce"),
							MiddleNameOrInitial: proto.String("Thomas"),
							FamilyName:          proto.String("Wayne"),
						},
						DateOfBirth: &commonpb.Date{
							Year:  1972,
							Month: 2,
							Day:   19,
						},
						Sex:      &sex,
						Relation: &relationToPatient19,
					},
					UpdateAppointments: proto.Bool(false),
				},
			},
			want: &PatientInsurance{
				DepartmentID:       proto.String("1423"),
				InsuranceID:        proto.String("4321"),
				InsurancePackageID: proto.String("12345"),
				PolicyNumber:       proto.String("54321"),
				UpdateAppointments: proto.String("false"),
				InsuranceHolder: &InsuranceHolder{
					InsuranceHolderName: &InsuranceHolderName{
						FirstName:  proto.String("Bruce"),
						MiddleName: proto.String("Thomas"),
						LastName:   proto.String("Wayne"),
					},
					DOB:                        proto.String("02/19/1972"),
					Sex:                        proto.String("M"),
					RelationshipToPolicyHolder: proto.String("19"),
				},
			},
		},
		{
			name: "correctly handles nil input values",
			args: args{
				insurance: &athenapb.Insurance{
					MemberId:  proto.String("4321"),
					PackageId: proto.Int64(12345),
					GroupId:   proto.Int64(54321),
					PrimaryInsuranceHolder: &athenapb.PrimaryInsuranceHolder{
						Name: &commonpb.Name{
							GivenName:           proto.String("Bruce"),
							MiddleNameOrInitial: proto.String("Thomas"),
							FamilyName:          proto.String("Wayne"),
						},
						Sex:      &sex,
						Relation: &relationToPatient19,
					},
				},
			},
			want: &PatientInsurance{
				InsuranceID:        proto.String("4321"),
				InsurancePackageID: proto.String("12345"),
				PolicyNumber:       proto.String("54321"),
				InsuranceHolder: &InsuranceHolder{
					InsuranceHolderName: &InsuranceHolderName{
						FirstName:  proto.String("Bruce"),
						MiddleName: proto.String("Thomas"),
						LastName:   proto.String("Wayne"),
					},
					Sex:                        proto.String("M"),
					RelationshipToPolicyHolder: proto.String("19"),
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := PatientInsuranceRecordFromInsuranceProto(tt.args.insurance)
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestPatientInsuranceProtoFromAthenaPatientInsurance(t *testing.T) {
	sex := commonpb.Sex_SEX_MALE
	relationToPatient19 := athenapb.RelationToPatient_RELATION_TO_PATIENT_FATHER
	type args struct {
		insuranceRecord *PatientInsurance
	}
	tests := []struct {
		name    string
		args    args
		want    *athenapb.Insurance
		wantErr bool
	}{
		{
			name: "Base Case",
			args: args{
				insuranceRecord: &PatientInsurance{
					DepartmentID:       proto.String("123"),
					InsuranceID:        proto.String("321"),
					InsurancePackageID: proto.String("234"),
					PolicyNumber:       proto.String("432"),
					InsuranceHolder: &InsuranceHolder{
						InsuranceHolderName: &InsuranceHolderName{
							FirstName:  proto.String("Bruce"),
							MiddleName: proto.String("Thomas"),
							LastName:   proto.String("Wayne"),
						},
						DOB:                        proto.String("02/19/1972"),
						Sex:                        proto.String("M"),
						RelationshipToPolicyHolder: proto.String("19"),
					},
					AthenaInsuranceID: proto.String("000001"),
				},
			},

			want: &athenapb.Insurance{
				DepartmentId: proto.String("123"),
				MemberId:     proto.String("321"),
				PackageId:    proto.Int64(234),
				GroupId:      proto.Int64(432),
				PrimaryInsuranceHolder: &athenapb.PrimaryInsuranceHolder{
					Name: &commonpb.Name{
						GivenName:           proto.String("Bruce"),
						FamilyName:          proto.String("Wayne"),
						MiddleNameOrInitial: proto.String("Thomas"),
					},
					DateOfBirth: &commonpb.Date{
						Year:  1972,
						Month: 2,
						Day:   19,
					},
					Sex:      &sex,
					Relation: &relationToPatient19,
				},
				InsuranceId: proto.String("000001"),
			},
		},
		{
			name: "Handles nil values",
			args: args{
				insuranceRecord: &PatientInsurance{
					PolicyNumber: proto.String("12345"),
				},
			},

			want: &athenapb.Insurance{
				GroupId: proto.Int64(12345),
			},
		},
		{
			name: "Returns error if InsurancePackageID is not numeric",
			args: args{
				insuranceRecord: &PatientInsurance{
					InsurancePackageID: proto.String("abcd"),
				},
			},

			wantErr: true,
		},
		{
			name: "Returns error if PolicyNumber is not numeric",
			args: args{
				insuranceRecord: &PatientInsurance{
					PolicyNumber: proto.String("abcd"),
				},
			},

			wantErr: true,
		},
		{
			name: "Returns error if insuranceHolder dob is not valid",
			args: args{
				insuranceRecord: &PatientInsurance{
					InsuranceHolder: &InsuranceHolder{
						DOB: proto.String("not a date")},
				},
			},

			wantErr: true,
		},
		{
			name: "Returns error if insuranceHolder relationship not in map",
			args: args{
				insuranceRecord: &PatientInsurance{
					InsuranceHolder: &InsuranceHolder{
						RelationshipToPolicyHolder: proto.String("123"),
					},
				},
			},

			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := PatientInsuranceProtoFromAthenaPatientInsurance(tt.args.insuranceRecord)
			if (err != nil) != tt.wantErr {
				t.Errorf("PatientInsuranceProtoFromAthenaPatientInsurance() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestAthenaRelationShipToInsuredIDToProto(t *testing.T) {
	relationship17 := athenapb.RelationToPatient_RELATION_TO_PATIENT_SIGNIFICANT_OTHER
	type args struct {
		relationshipID *string
	}
	tests := []struct {
		name    string
		args    args
		want    *athenapb.RelationToPatient
		wantErr bool
	}{
		{
			name: "Base Case",
			args: args{
				relationshipID: proto.String("17"),
			},

			want: &relationship17,
		},
		{
			name: "returns error if relationship not in enum",
			args: args{
				relationshipID: proto.String("66"),
			},

			wantErr: true,
		},
		{
			name: "returns nil for nil input",
			args: args{
				relationshipID: nil,
			},

			want: nil,
		},
		{
			name: "returns error if relationship id not a number",
			args: args{
				relationshipID: proto.String("not a number"),
			},

			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := athenaRelationShipToInsuredIDToProto(tt.args.relationshipID)
			if (err != nil) != tt.wantErr {
				t.Errorf("athenaRelationShipToInsuredIDToProto() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestAthenaGenderToProto(t *testing.T) {
	male := commonpb.Sex_SEX_MALE
	female := commonpb.Sex_SEX_FEMALE
	type args struct {
		sex *string
	}
	tests := []struct {
		name string
		args args
		want *commonpb.Sex
	}{
		{
			name: "Base case - Male",
			args: args{
				sex: proto.String("M"),
			},

			want: &male,
		},
		{
			name: "Base case - Female",
			args: args{
				sex: proto.String("F"),
			},

			want: &female,
		},
		{
			name: "returns nil for nil input",
			args: args{
				sex: nil,
			},

			want: nil,
		},
		{
			name: "returns nil for non M/F input",
			args: args{
				sex: proto.String("Other"),
			},

			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := athenaGenderToProto(tt.args.sex)
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestProtoGenderToAthenaGender(t *testing.T) {
	commonSexMale := commonpb.Sex_SEX_MALE
	commonSexFemale := commonpb.Sex_SEX_FEMALE
	commonSexUnspecified := commonpb.Sex_SEX_UNSPECIFIED
	commonSexOther := commonpb.Sex_SEX_OTHER
	type args struct {
		sex *commonpb.Sex
	}
	tests := []struct {
		name string
		args args
		want *string
	}{
		{
			name: "Base Case - Male",
			args: args{
				sex: &commonSexMale,
			},

			want: proto.String("M"),
		},
		{
			name: "Base Case - Female",
			args: args{
				sex: &commonSexFemale,
			},

			want: proto.String("F"),
		},
		{
			name: "returns nil for unspecified sex",
			args: args{
				sex: &commonSexUnspecified,
			},

			want: nil,
		},
		{
			name: "returns nil for other sex",
			args: args{
				sex: &commonSexOther,
			},

			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ProtoGenderToAthenaGender(tt.args.sex)
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestGenderIdentityProtoFromAthenaPatient(t *testing.T) {
	tests := []struct {
		name  string
		input Patient

		want *commonpb.GenderIdentity
	}{
		{
			name: "success - base case",
			input: Patient{
				GenderIdentity:      proto.String(athenaGenderIdentityMale),
				GenderIdentityOther: nil,
			},

			want: &commonpb.GenderIdentity{
				Category: commonpb.GenderIdentity_CATEGORY_MALE,
			},
		},
		{
			name: "success - unmapped gender identity returns unspecified",
			input: Patient{
				GenderIdentity:      proto.String("unmapped"),
				GenderIdentityOther: nil,
			},

			want: &commonpb.GenderIdentity{
				Category: commonpb.GenderIdentity_CATEGORY_UNSPECIFIED,
			},
		},
		{
			name: "success - nil gender identity",
			input: Patient{
				GenderIdentity:      nil,
				GenderIdentityOther: nil,
			},

			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := genderIdentityProtoFromAthenaPatient(tt.input)
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestInsuranceHolderNameProtoFromAthenaInsuranceHolderName(t *testing.T) {
	type args struct {
		name *InsuranceHolderName
	}
	tests := []struct {
		name string
		args args
		want *commonpb.Name
	}{
		{
			name: "Base Case",
			args: args{
				name: &InsuranceHolderName{
					FirstName:  proto.String("Lorem"),
					MiddleName: proto.String("Ipsum"),
					LastName:   proto.String("Dolor"),
				},
			},
			want: &commonpb.Name{
				GivenName:           proto.String("Lorem"),
				FamilyName:          proto.String("Dolor"),
				MiddleNameOrInitial: proto.String("Ipsum"),
			},
		},
		{
			name: "returns nil for nil input",
			args: args{},

			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := insuranceHolderNameProtoFromAthenaInsuranceHolderName(tt.args.name)
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestClinicalProviderToProto(t *testing.T) {
	tests := []struct {
		desc                  string
		inputClinicalProvider *ClinicalProvider

		wantClinicalProvider *athenapb.ClinicalProviderSearchResult
		hasErr               bool
	}{
		{
			desc: "success - clinical provider into clinical provider proto",
			inputClinicalProvider: &ClinicalProvider{
				ID:           proto.String("1"),
				Name:         proto.String("Health Care Center"),
				FirstName:    proto.String("Health Care"),
				LastName:     proto.String("Health Center"),
				City:         proto.String("Denver"),
				State:        proto.String("CO"),
				Address:      proto.String("3800 York St"),
				Zip:          proto.String("80205"),
				FaxNumber:    proto.String("3032961767"),
				PhoneNumber:  proto.String("3032961768"),
				PharmacyType: proto.String("RETAIL"),
				NCPDID:       proto.String("123456"),
				Distance:     proto.String("5"),
			},

			wantClinicalProvider: &athenapb.ClinicalProviderSearchResult{
				ClinicalProviderId: proto.String("1"),
				ProviderName: &commonpb.Name{
					GivenName:  proto.String("Health Care"),
					FamilyName: proto.String("Health Center"),
				},
				Address: &commonpb.Address{
					AddressLineOne: proto.String("3800 York St"),
					City:           proto.String("Denver"),
					State:          proto.String("CO"),
					ZipCode:        proto.String("80205"),
				},
				Distance: proto.Float64(5),
				FaxNumber: &commonpb.PhoneNumber{
					CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
					PhoneNumber:     proto.String("(303) 296-1767"),
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
				},
				PhoneNumber: &commonpb.PhoneNumber{
					CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
					PhoneNumber:     proto.String("(303) 296-1768"),
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
				},
				NcpdpId:          proto.String("123456"),
				PharmacyType:     proto.String("RETAIL"),
				OrganizationName: proto.String("Health Care Center"),
			},
		},
		{
			desc: "failure - clinical provider is nil",

			hasErr: true,
		},
		{
			desc: "failure - invalid fax number format",
			inputClinicalProvider: &ClinicalProvider{
				FaxNumber: proto.String("1"),
			},

			hasErr: true,
		},
		{
			desc: "failure - invalid phone number format",
			inputClinicalProvider: &ClinicalProvider{
				PhoneNumber: proto.String("1"),
			},

			hasErr: true,
		},
		{
			desc: "failure - invalid distance",
			inputClinicalProvider: &ClinicalProvider{
				FaxNumber:   proto.String("3032961767"),
				PhoneNumber: proto.String("3032961768"),
				Distance:    proto.String("abccd"),
			},

			hasErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			converted, err := ClinicalProviderToProto(tt.inputClinicalProvider)
			if (err != nil) != tt.hasErr {
				t.Fatalf("hasError does not match: %v, tt: %+v", err, tt)
			}
			testutils.MustMatchProto(t, tt.wantClinicalProvider, converted)
		})
	}
}

func TestProtoToClinicalProvider(t *testing.T) {
	tests := []struct {
		desc                  string
		inputClinicalProvider *athenapb.SearchClinicalProvidersRequest

		wantClinicalProvider *ClinicalProvider
		hasErr               bool
	}{
		{
			desc: "success - clinical provider proto into clinical provider",
			inputClinicalProvider: &athenapb.SearchClinicalProvidersRequest{
				Name:      "The children's hospital",
				FirstName: "The children",
				LastName:  "hospital",
				City:      "CO",
				State:     "Denver",
				Zip:       "80543",
				Distance:  5,
				FaxNumber: &commonpb.PhoneNumber{
					CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
					PhoneNumber:     proto.String("(303) 296-1234"),
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
				},
				PhoneNumber: &commonpb.PhoneNumber{
					CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
					PhoneNumber:     proto.String("(303) 296-1235"),
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
				},
				Npi: "987765",
				Address: &commonpb.Address{
					AddressLineOne: proto.String("3800 York St"),
				},
				OrderType: athenapb.OrderType_ORDER_TYPE_CONTACTLENSES,
			},

			wantClinicalProvider: &ClinicalProvider{
				Name:        proto.String("The children's hospital"),
				FirstName:   proto.String("The children"),
				LastName:    proto.String("hospital"),
				City:        proto.String("CO"),
				State:       proto.String("Denver"),
				Address:     proto.String("3800 York St"),
				Zip:         proto.String("80543"),
				FaxNumber:   proto.String("(303) 296-1234"),
				PhoneNumber: proto.String("(303) 296-1235"),
				NPI:         proto.String("987765"),
				Distance:    proto.String("5"),
				OrderType:   proto.String("CONTACTLENSES"),
			},
		},
		{
			desc: "failure - clinical provider is nil",

			hasErr: true,
		},
		{
			desc: "failure - invalid fax number format",
			inputClinicalProvider: &athenapb.SearchClinicalProvidersRequest{
				FaxNumber: &commonpb.PhoneNumber{
					CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
					PhoneNumber:     proto.String("1"),
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
				},
			},

			hasErr: true,
		},
		{
			desc: "failure - invalid phone number format",
			inputClinicalProvider: &athenapb.SearchClinicalProvidersRequest{
				FaxNumber: &commonpb.PhoneNumber{
					CountryCode:     proto.Int32(phonenumbers.NANPA_COUNTRY_CODE),
					PhoneNumber:     proto.String("2"),
					PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
				},
			},

			hasErr: true,
		},
	}

	for _, tt := range tests {
		t.Run(tt.desc, func(t *testing.T) {
			converted, err := ProtoToClinicalProvider(tt.inputClinicalProvider)
			if (err != nil) != tt.hasErr {
				t.Fatalf("hasError does not match: %v, tt: %+v", err, tt)
			}
			testutils.MustMatch(t, tt.wantClinicalProvider, converted)
		})
	}
}

func Test_patientLabResultsProtoFromAthena(t *testing.T) {
	tests := []struct {
		name             string
		patientLabResult []LabResult

		want           []*athenapb.LabResult
		wantErrMessage string
	}{
		{
			name: "Base Case",
			patientLabResult: []LabResult{
				{
					Priority:              proto.String("2"),
					Date:                  proto.String("08/30/2018"),
					ResultStatus:          proto.String("final"),
					PerformingLabAddress1: proto.String("1001 Cornell Pkwy"),
					IsReviewedByProvider:  *proto.String("false"),
					PerformingLabZIP:      proto.String("73108-1803"),
					PerformingLabState:    proto.String("OK"),
					PerformingLabCity:     proto.String("Oklahoma City"),
					ID:                    proto.String("356609"),
					Analytes: []Analyte{
						{
							ObservationIdentifier: proto.String("55080400"),
							ResultStatus:          proto.String("final"),
							Name:                  proto.String("TSH"),
							DateTime:              proto.String("08/30/2018 00:00:00"),
							Date:                  proto.String("08/30/2018"),
							Value:                 proto.String("tnp"),
							Description:           proto.String("Description"),
							LoInc:                 proto.String("31234"),
							Note:                  proto.String("note"),
							ID:                    proto.String("1234"),
						},
					},
					PerformingLabName: proto.String("Quest Diagnostics - Oklahoma City"),
					DateTime:          proto.String("08/30/2018 11:33:00"),
					FacilityID:        proto.String("10977989"),
					Description:       proto.String("TSH, serum or plasma"),
					AttachmentExists:  *proto.String("false"),
					LoInc:             proto.String("3016-3"),
				},
			},

			want: []*athenapb.LabResult{
				{
					Priority: proto.String("2"),
					Date: &commonpb.Date{
						Year:  2018,
						Month: 8,
						Day:   30,
					},
					ResultStatus:         proto.String("final"),
					IsReviewedByProvider: proto.Bool(false),
					PerformingLabAddress: &commonpb.Address{
						AddressLineOne: proto.String("1001 Cornell Pkwy"),
						ZipCode:        proto.String("73108-1803"),
						State:          proto.String("OK"),
						City:           proto.String("Oklahoma City"),
					},
					Analytes: []*athenapb.Analyte{
						{
							ObservationIdentifier: proto.String("55080400"),
							ResultStatus:          proto.String("final"),
							Name:                  proto.String("TSH"),
							DateTime: &commonpb.DateTime{
								Year:    2018,
								Month:   8,
								Day:     30,
								Hours:   0,
								Minutes: 0,
								Seconds: 0,
							},
							Date: &commonpb.Date{
								Year:  2018,
								Month: 8,
								Day:   30,
							},
							Value:       proto.String("tnp"),
							Description: proto.String("Description"),
							Loinc:       proto.String("31234"),
							Note:        proto.String("note"),
							Id:          proto.String("1234"),
						},
					},
					Id:                proto.String("356609"),
					PerformingLabName: proto.String("Quest Diagnostics - Oklahoma City"),
					DateTime: &commonpb.DateTime{
						Year:    2018,
						Month:   8,
						Day:     30,
						Hours:   11,
						Minutes: 33,
						Seconds: 0,
					},
					FacilityId:       proto.String("10977989"),
					Description:      proto.String("TSH, serum or plasma"),
					AttachmentExists: proto.Bool(false),
					Loinc:            proto.String("3016-3"),
				},
			},
		},
		{
			name: "Date and DateTime are nil",
			patientLabResult: []LabResult{
				{
					Priority:              proto.String("2"),
					Date:                  nil,
					ResultStatus:          proto.String("final"),
					PerformingLabAddress1: proto.String("1001 Cornell Pkwy"),
					IsReviewedByProvider:  *proto.String("false"),
					PerformingLabZIP:      proto.String("73108-1803"),
					PerformingLabState:    proto.String("OK"),
					PerformingLabCity:     proto.String("Oklahoma City"),
					ID:                    proto.String("356609"),
					Analytes: []Analyte{
						{
							ObservationIdentifier: proto.String("55080400"),
							ResultStatus:          proto.String("final"),
							Name:                  proto.String("TSH"),
							DateTime:              nil,
							Date:                  nil,
							Value:                 proto.String("tnp"),
							Description:           proto.String("Description"),
							LoInc:                 proto.String("31234"),
							Note:                  proto.String("note"),
							ID:                    proto.String("1234"),
						},
					},
					PerformingLabName: proto.String("Quest Diagnostics - Oklahoma City"),
					DateTime:          nil,
					FacilityID:        proto.String("10977989"),
					Description:       proto.String("TSH, serum or plasma"),
					AttachmentExists:  *proto.String("false"),
					LoInc:             proto.String("3016-3"),
				},
			},

			want: []*athenapb.LabResult{
				{
					Priority:             proto.String("2"),
					Date:                 nil,
					ResultStatus:         proto.String("final"),
					IsReviewedByProvider: proto.Bool(false),
					PerformingLabAddress: &commonpb.Address{
						AddressLineOne: proto.String("1001 Cornell Pkwy"),
						ZipCode:        proto.String("73108-1803"),
						State:          proto.String("OK"),
						City:           proto.String("Oklahoma City"),
					},
					Analytes: []*athenapb.Analyte{
						{
							ObservationIdentifier: proto.String("55080400"),
							ResultStatus:          proto.String("final"),
							Name:                  proto.String("TSH"),
							DateTime:              nil,
							Date:                  nil,
							Value:                 proto.String("tnp"),
							Description:           proto.String("Description"),
							Loinc:                 proto.String("31234"),
							Note:                  proto.String("note"),
							Id:                    proto.String("1234"),
						},
					},
					Id:                proto.String("356609"),
					PerformingLabName: proto.String("Quest Diagnostics - Oklahoma City"),
					DateTime:          nil,
					FacilityId:        proto.String("10977989"),
					Description:       proto.String("TSH, serum or plasma"),
					AttachmentExists:  proto.Bool(false),
					Loinc:             proto.String("3016-3"),
				},
			},
		},
		{
			name: "Date and DateTime formatted",
			patientLabResult: []LabResult{
				{
					IsReviewedByProvider: "False",
					AttachmentExists:     "False",
					Date:                 proto.String("08/30/2018"),
					DateTime:             proto.String("08/30/2018 11:33:00"),
					Analytes: []Analyte{
						{
							DateTime: proto.String("08/30/2018 00:00:00"),
							Date:     proto.String("08/30/2018"),
						},
					},
				},
			},

			want: []*athenapb.LabResult{
				{
					Date: &commonpb.Date{
						Year:  2018,
						Month: 8,
						Day:   30,
					},
					DateTime: &commonpb.DateTime{
						Year:    2018,
						Month:   8,
						Day:     30,
						Hours:   11,
						Minutes: 33,
						Seconds: 0,
					},
					Analytes: []*athenapb.Analyte{
						{
							DateTime: &commonpb.DateTime{
								Year:    2018,
								Month:   8,
								Day:     30,
								Hours:   0,
								Minutes: 0,
								Seconds: 0,
							},
							Date: &commonpb.Date{
								Year:  2018,
								Month: 8,
								Day:   30,
							},
						},
					},
					IsReviewedByProvider: proto.Bool(false),
					PerformingLabAddress: &commonpb.Address{},
					AttachmentExists:     proto.Bool(false),
				},
			},
		},
		{
			name: "Invalid IsReviewedByProvider value",
			patientLabResult: []LabResult{
				{
					IsReviewedByProvider: "Yes",
				},
			},

			want:           []*athenapb.LabResult{},
			wantErrMessage: "strconv.ParseBool: parsing \"Yes\": invalid syntax",
		},
		{
			name: "Invalid AttachmentExists value",
			patientLabResult: []LabResult{
				{
					AttachmentExists: "123",
				},
			},

			want:           []*athenapb.LabResult{},
			wantErrMessage: "strconv.ParseBool: parsing \"\": invalid syntax",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := PatientLabResultsProtoFromAthena(tt.patientLabResult)
			if err != nil {
				if tt.wantErrMessage != "" {
					testutils.MustMatch(t, tt.wantErrMessage, err.Error())
					return
				}

				t.Errorf("PatientLabResultsProtoFromAthena() error = %v, tt: %+v", err, tt)
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestAthenaRecipientClassToProto(t *testing.T) {
	tests := []struct {
		name           string
		recipientClass *RecipientClass

		want *athenapb.RecipientClass
	}{
		{
			name: "base case",
			recipientClass: &RecipientClass{
				Code:        proto.String("3"),
				Description: proto.String("PCP"),
			},

			want: &athenapb.RecipientClass{
				Code:        proto.String("3"),
				Description: proto.String("PCP"),
			},
		},
		{
			name:           "returns nil for nil input",
			recipientClass: nil,

			want: nil,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := AthenaRecipientClassToProto(tt.recipientClass)
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestSearchPatientResultToProto(t *testing.T) {
	tcs := []struct {
		desc   string
		result *SearchPatientResult

		wantErr bool
		want    *athenapb.SearchPatientsResult
	}{
		{
			desc: "Base case",
			result: &SearchPatientResult{
				FirstName:           proto.String("ABDUL"),
				CurrentDepartmentID: proto.String("2"),
				MiddleInitial:       proto.String("EFFERTZ"),
				LastName:            proto.String("SMITH"),
				State:               proto.String("CO"),
				City:                proto.String("DENVER"),
				CountryID:           proto.String("1"),
				HomePhone:           proto.String("(303) 500-1518"),
				PatientID:           proto.String("401429"),
				Sex:                 proto.String("M"),
				DOB:                 proto.String("09/25/1937"),
				Zip:                 proto.String("80210-4531"),
				CurrentDepartment:   proto.String("DEN - HOME"),
				Address1:            proto.String("1235 E EVANS AVE"),
				Address2:            proto.String("#144"),
				NameSuffix:          proto.String(""),
			},

			want: &athenapb.SearchPatientsResult{
				Patient: &athenapb.Patient{
					PatientId: proto.String("401429"),
					Name: &commonpb.Name{
						GivenName:           proto.String("ABDUL"),
						FamilyName:          proto.String("SMITH"),
						MiddleNameOrInitial: proto.String("EFFERTZ"),
						Suffix:              proto.String(""),
					},
					DateOfBirth: &commonpb.Date{Year: 1937, Month: 9, Day: 25},
					Sex:         proto.String("M"),
					ContactInfo: &athenapb.ContactInfo{
						Address: &commonpb.Address{
							AddressLineOne: proto.String("1235 E EVANS AVE"),
							AddressLineTwo: proto.String("#144"),
							City:           proto.String("DENVER"),
							State:          proto.String("CO"),
							ZipCode:        proto.String("80210-4531"),
						},
						HomeNumber: &commonpb.PhoneNumber{
							CountryCode:     proto.Int32(1),
							PhoneNumber:     proto.String("(303) 500-1518"),
							PhoneNumberType: commonpb.PhoneNumber_PHONE_NUMBER_TYPE_HOME,
						},
					},
					DepartmentId: proto.String("2"),
				},
			},
		},
		{
			desc: "Address and phone number are nil",
			result: &SearchPatientResult{
				FirstName:           proto.String("ABDUL"),
				CurrentDepartmentID: proto.String("2"),
				MiddleInitial:       proto.String("EFFERTZ"),
				LastName:            proto.String("SMITH"),
				PatientID:           proto.String("401429"),
				Sex:                 proto.String("M"),
				DOB:                 proto.String("09/25/1937"),
				CurrentDepartment:   proto.String("DEN - HOME"),
				NameSuffix:          proto.String(""),
			},

			want: &athenapb.SearchPatientsResult{
				Patient: &athenapb.Patient{
					PatientId: proto.String("401429"),
					Name: &commonpb.Name{
						GivenName:           proto.String("ABDUL"),
						FamilyName:          proto.String("SMITH"),
						MiddleNameOrInitial: proto.String("EFFERTZ"),
						Suffix:              proto.String(""),
					},
					DateOfBirth: &commonpb.Date{Year: 1937, Month: 9, Day: 25},
					Sex:         proto.String("M"),
					ContactInfo: &athenapb.ContactInfo{
						Address:    nil,
						HomeNumber: nil,
					},
					DepartmentId: proto.String("2"),
				},
			},
		},
		{
			desc:   "Nil search patient result",
			result: nil,

			wantErr: true,
		},
		{
			desc: "Bad DOB format",
			result: &SearchPatientResult{
				FirstName:         proto.String("ABDUL"),
				LastName:          proto.String("SMITH"),
				PatientID:         proto.String("401429"),
				Sex:               proto.String("M"),
				DOB:               proto.String("09-25-1937"),
				Zip:               proto.String("80210-4531"),
				CurrentDepartment: proto.String("DEN - HOME"),
				Address1:          proto.String("1235 E EVANS AVE"),
			},
			want:    nil,
			wantErr: true,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.desc, func(t *testing.T) {
			proto, err := SearchPatientResultToProto(tc.result)
			if err != nil && !tc.wantErr {
				t.Fatalf("Unexpected error received: %s", err)
			}
			testutils.MustMatchProto(t, tc.want, proto)
		})
	}
}
func TestStatusChangeSubscriptionToEnum(t *testing.T) {
	tests := []struct {
		name      string
		statusStr string

		want athenapb.StatusChangeSubscription
	}{
		{
			name:      "active",
			statusStr: "ACTIVE",

			want: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_ACTIVE,
		},
		{
			name:      "partial",
			statusStr: "PARTIAL",

			want: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_PARTIAL,
		},
		{
			name:      "inactive",
			statusStr: "INACTIVE",

			want: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_INACTIVE,
		},
		{
			name:      "unspecified",
			statusStr: "LMAO I CARE",

			want: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_UNSPECIFIED,
		},
		{
			name:      "weird capitalization",
			statusStr: "aCtIvE",

			want: athenapb.StatusChangeSubscription_STATUS_CHANGE_SUBSCRIPTION_ACTIVE,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			testutils.MustMatch(t, tt.want, StatusChangeSubscriptionToEnum(tt.statusStr))
		})
	}
}

func TestGenerateNotesFromAnalytes(t *testing.T) {
	tcs := []struct {
		Desc        string
		LabResultID string
		Analytes    []*athenapb.Analyte
		Want        string
	}{
		{
			Desc:        "Base case",
			LabResultID: "2",
			Analytes: []*athenapb.Analyte{
				{
					Name:  proto.String("K"),
					Value: proto.String("1"),
					Units: proto.String("%"),
				},
				{
					Name:  proto.String("Na"),
					Value: proto.String("2"),
					Units: proto.String("ml"),
				},
			},
			Want: `<h3 id="lab-result-id-2">Lab Results</h3><ul><li>K: 1%</li><li>Na: 2ml</li></ul>`,
		},
		{
			Desc:        "analyte with a missing field is not displayed",
			LabResultID: "2",
			Analytes: []*athenapb.Analyte{
				{
					Name:  proto.String("K"),
					Value: proto.String("1"),
					Units: proto.String("%"),
				},
				{
					Name:  proto.String("Na"),
					Value: proto.String("2"),
				},
			},
			Want: `<h3 id="lab-result-id-2">Lab Results</h3><ul><li>K: 1%</li></ul>`,
		},
	}

	for _, tc := range tcs {
		t.Run(tc.Desc, func(t *testing.T) {
			joinedAnalytes, err := GenerateNotesFromAnalytes(tc.LabResultID, tc.Analytes)
			var errString string
			if err != nil {
				errString = err.Error()
			}
			testutils.MustMatch(t, joinedAnalytes, tc.Want, errString)
		})
	}
}

func Test_patientLabResultProtoFromAthena(t *testing.T) {
	tests := []struct {
		name                     string
		patientLabResultDocument []LabResultDocument
		want                     []*athenapb.LabResultDocument
		wantErr                  bool
	}{
		{
			name: "Base Case",
			patientLabResultDocument: []LabResultDocument{
				{
					DepartmentID:        proto.String("2"),
					DocumentRoute:       proto.String("Fax"),
					DocumentSource:      proto.String("INTERFACE"),
					DocumentTypeID:      proto.String("3"),
					EncounterDate:       proto.String("08/30/2018"),
					EncounterID:         proto.String("4"),
					FacilityID:          proto.String("5"),
					IsConfidential:      proto.String("false"),
					ID:                  proto.String("6"),
					Loinc:               proto.String("7"),
					ObservationDateTime: proto.String("2018-08-30T11:33:55-05:00"),
					Observations: []Analyte{
						{
							ObservationIdentifier: proto.String("55080400"),
							ResultStatus:          proto.String("final"),
							Name:                  proto.String("TSH"),
							Value:                 proto.String("tnp"),
							Units:                 proto.String("%"),
							Description:           proto.String("Description"),
							LoInc:                 proto.String("31234"),
							Note:                  proto.String("note"),
							ID:                    proto.String("1234"),
						},
					},
					ProviderID: proto.String("8"),
					OrderID:    proto.String("9"),
				},
			},

			want: []*athenapb.LabResultDocument{
				{
					DepartmentId:   proto.String("2"),
					DocumentRoute:  proto.String("Fax"),
					DocumentSource: proto.String("INTERFACE"),
					DocumentTypeId: proto.String("3"),
					EncounterDate: &commonpb.Date{
						Year:  2018,
						Month: 8,
						Day:   30,
					},
					EncounterId:    proto.String("4"),
					FacilityId:     proto.String("5"),
					IsConfidential: proto.Bool(false),
					Id:             proto.String("6"),
					Loinc:          proto.String("7"),
					ObservationDateTime: &commonpb.DateTime{
						Year:    2018,
						Month:   8,
						Day:     30,
						Hours:   11,
						Minutes: 33,
						Seconds: 55,
					},
					Observations: []*athenapb.Analyte{
						{
							ObservationIdentifier: proto.String("55080400"),
							ResultStatus:          proto.String("final"),
							Name:                  proto.String("TSH"),
							Value:                 proto.String("tnp"),
							Units:                 proto.String("%"),
							Description:           proto.String("Description"),
							Loinc:                 proto.String("31234"),
							Note:                  proto.String("note"),
							Id:                    proto.String("1234"),
						},
					},
					ProviderId: proto.String("8"),
					OrderId:    proto.String("9"),
				},
			},
		},
		{
			name: "EncounterDate and ObservationDateTime are nil",
			patientLabResultDocument: []LabResultDocument{
				{
					DepartmentID:        proto.String("2"),
					DocumentRoute:       proto.String("Fax"),
					DocumentSource:      proto.String("INTERFACE"),
					DocumentTypeID:      proto.String("3"),
					EncounterDate:       nil,
					EncounterID:         proto.String("4"),
					FacilityID:          proto.String("5"),
					IsConfidential:      proto.String("false"),
					ID:                  proto.String("6"),
					Loinc:               proto.String("7"),
					ObservationDateTime: nil,
					Observations: []Analyte{
						{
							ObservationIdentifier: proto.String("55080400"),
							ResultStatus:          proto.String("final"),
							Name:                  proto.String("TSH"),
							Value:                 proto.String("tnp"),
							Units:                 proto.String("%"),
							Description:           proto.String("Description"),
							LoInc:                 proto.String("31234"),
							Note:                  proto.String("note"),
							ID:                    proto.String("1234"),
						},
					},
					ProviderID: proto.String("8"),
					OrderID:    proto.String("9"),
				},
			},

			want: []*athenapb.LabResultDocument{
				{
					DepartmentId:        proto.String("2"),
					DocumentRoute:       proto.String("Fax"),
					DocumentSource:      proto.String("INTERFACE"),
					DocumentTypeId:      proto.String("3"),
					EncounterDate:       nil,
					EncounterId:         proto.String("4"),
					FacilityId:          proto.String("5"),
					IsConfidential:      proto.Bool(false),
					Id:                  proto.String("6"),
					Loinc:               proto.String("7"),
					ObservationDateTime: nil,
					Observations: []*athenapb.Analyte{
						{
							ObservationIdentifier: proto.String("55080400"),
							ResultStatus:          proto.String("final"),
							Name:                  proto.String("TSH"),
							Value:                 proto.String("tnp"),
							Units:                 proto.String("%"),
							Description:           proto.String("Description"),
							Loinc:                 proto.String("31234"),
							Note:                  proto.String("note"),
							Id:                    proto.String("1234"),
						},
					},
					ProviderId: proto.String("8"),
					OrderId:    proto.String("9"),
				},
			},
		},
		{
			name: "All values empty",
			patientLabResultDocument: []LabResultDocument{
				{},
			},

			want: []*athenapb.LabResultDocument{
				{
					IsConfidential: proto.Bool(false),
					Observations:   []*athenapb.Analyte{},
				},
			},
			wantErr: true,
		},
		{
			name: "Invalid IsConfidential value",
			patientLabResultDocument: []LabResultDocument{
				{
					IsConfidential: proto.String("Yes"),
				},
			},

			want:    []*athenapb.LabResultDocument{},
			wantErr: true,
		},
		{
			name: "Observations are nil",
			patientLabResultDocument: []LabResultDocument{
				{
					DepartmentID:        proto.String("2"),
					DocumentRoute:       proto.String("Fax"),
					DocumentSource:      proto.String("INTERFACE"),
					DocumentTypeID:      proto.String("3"),
					EncounterDate:       nil,
					EncounterID:         proto.String("4"),
					FacilityID:          proto.String("5"),
					IsConfidential:      proto.String("false"),
					ID:                  proto.String("6"),
					Loinc:               proto.String("7"),
					ObservationDateTime: nil,
					Observations:        nil,
					ProviderID:          proto.String("8"),
					OrderID:             proto.String("9"),
				},
			},

			want: []*athenapb.LabResultDocument{
				{
					DepartmentId:        proto.String("2"),
					DocumentRoute:       proto.String("Fax"),
					DocumentSource:      proto.String("INTERFACE"),
					DocumentTypeId:      proto.String("3"),
					EncounterDate:       nil,
					EncounterId:         proto.String("4"),
					FacilityId:          proto.String("5"),
					IsConfidential:      proto.Bool(false),
					Id:                  proto.String("6"),
					Loinc:               proto.String("7"),
					ObservationDateTime: nil,
					Observations:        []*athenapb.Analyte{},
					ProviderId:          proto.String("8"),
					OrderId:             proto.String("9"),
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := PatientLabResultDocumentProtoFromAthena(tt.patientLabResultDocument)
			if err != nil {
				if tt.wantErr {
					testutils.MustMatch(t, tt.wantErr, err != nil)
					return
				}

				t.Errorf("PatientLabResultDocumentProtoFromAthena() error = %v, tt: %+v", err, tt)
			}
			testutils.MustMatch(t, tt.want, got)
		})
	}
}

func TestInsuranceBenefitDetailsToProto(t *testing.T) {
	tests := []struct {
		name                           string
		patientInsuranceBenefitDetails PatientInsuranceBenefitDetails

		want    *athenapb.InsuranceBenefitDetails
		wantErr bool
	}{
		{
			name: "Base case",
			patientInsuranceBenefitDetails: PatientInsuranceBenefitDetails{
				EligibilityData: proto.String("text"),
				DateOfService:   proto.String("05/26/2023"),
				LastCheckDate:   proto.String("05/26/2023"),
			},

			want: &athenapb.InsuranceBenefitDetails{
				EligibilityData: "text",
				DateOfService: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
				LastCheckDate: &commonpb.Date{
					Year:  2023,
					Month: 5,
					Day:   26,
				},
			},
		},
		{
			name: "Failed to parse date of service",

			patientInsuranceBenefitDetails: PatientInsuranceBenefitDetails{
				EligibilityData: proto.String("text"),
				DateOfService:   proto.String("invalid"),
				LastCheckDate:   proto.String("05/26/2023"),
			},

			wantErr: true,
		},
		{
			name: "Failed to parse last check date",

			patientInsuranceBenefitDetails: PatientInsuranceBenefitDetails{
				EligibilityData: proto.String("text"),
				DateOfService:   proto.String("05/26/2023"),
				LastCheckDate:   proto.String("invalid"),
			},

			wantErr: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := InsuranceBenefitDetailsToProto(tt.patientInsuranceBenefitDetails)
			if (tt.wantErr && err == nil) || (!tt.wantErr && err != nil) {
				t.Fatalf("received unexpected error: %+v", tt)
			}

			testutils.MustMatch(t, tt.want, got)
		})
	}
}

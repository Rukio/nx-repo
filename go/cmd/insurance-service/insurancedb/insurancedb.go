package insurancedb

import (
	"context"
	"errors"
	"fmt"

	"github.com/jackc/pgx/v4"

	"github.com/*company-data-covered*/services/go/pkg/basedb"
	insurancesql "github.com/*company-data-covered*/services/go/pkg/generated/sql/insurance"
)

var (
	errInvalidInsurancePlanID = errors.New("invalid attempt to get InsuranceNetwork without insurance plan id")
)

type InsuranceDB struct {
	db      basedb.DBTX
	queries *insurancesql.Queries
}

type UpdateInsuranceNetworkAppointmentTypesParams struct {
	NetworkID        int64
	AppointmentTypes insurancesql.CreateInsuranceNetworksAppointmentTypesParams
}

func NewInsuranceDB(db basedb.DBTX) *InsuranceDB {
	return &InsuranceDB{
		db:      db,
		queries: insurancesql.New(db),
	}
}

func CheckAndPrepareCreateInsuranceNetworkAddressesParams(networkID int64, addresses []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams) ([]insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams, error) {
	for i, address := range addresses {
		addresses[i].InsuranceNetworkID = networkID
		if address.Address == "" {
			return nil, fmt.Errorf("network address can not be blank")
		}
		if address.Zipcode == "" {
			return nil, fmt.Errorf("network zip code can not be blank")
		}
		if address.City == "" {
			return nil, fmt.Errorf("network city can not be blank")
		}
		if address.BillingState == "" {
			return nil, fmt.Errorf("network billing state can not be blank")
		}
	}

	return addresses, nil
}

func (idb *InsuranceDB) CreateInsurancePayer(ctx context.Context, params insurancesql.CreateInsurancePayerParams) (*insurancesql.InsurancePayer, error) {
	if params.Name == "" {
		return nil, fmt.Errorf("invalid attempt to create InsurancePayer query without name")
	}

	return idb.queries.CreateInsurancePayer(ctx, params)
}

func (idb *InsuranceDB) DeleteInsurancePayer(ctx context.Context, payerID int64) (*insurancesql.InsurancePayer, error) {
	dbPayer, err := idb.queries.DeleteInsurancePayer(ctx, payerID)

	if err != nil {
		return nil, err
	}

	return dbPayer, nil
}

func (idb *InsuranceDB) GetInsuranceNetwork(ctx context.Context, networkID int64) (*insurancesql.InsuranceNetwork, error) {
	if networkID <= 0 {
		return nil, fmt.Errorf("invalid attempt to get InsuranceNetwork without id")
	}

	return idb.queries.GetInsuranceNetwork(ctx, networkID)
}

func (idb *InsuranceDB) GetInsuranceNetworkByInsurancePlanID(ctx context.Context, insurancePlanID int64) (*insurancesql.GetInsuranceNetworkByInsurancePlanIDRow, error) {
	if insurancePlanID <= 0 {
		return nil, errInvalidInsurancePlanID
	}

	return idb.queries.GetInsuranceNetworkByInsurancePlanID(ctx, insurancePlanID)
}

func (idb *InsuranceDB) SearchInsuranceNetworks(ctx context.Context, params insurancesql.SearchInsuranceNetworksParams) ([]*insurancesql.SearchInsuranceNetworksRow, error) {
	return idb.queries.SearchInsuranceNetworks(ctx, params)
}

func (idb *InsuranceDB) GetInsuranceNetworkStatesByInsuranceNetworksIDs(ctx context.Context, networkIOs []int64) ([]*insurancesql.InsuranceNetworkState, error) {
	return idb.queries.GetInsuranceNetworkStatesByInsuranceNetworkIDs(ctx, networkIOs)
}

func (idb *InsuranceDB) GetInsuranceNetworkAddressByInsuranceNetworksIDs(ctx context.Context, networkIDs []int64) ([]*insurancesql.InsuranceNetworkAddress, error) {
	return idb.queries.GetInsuranceNetworkAddressesByInsuranceNetworkID(ctx, networkIDs)
}

func (idb *InsuranceDB) GetInsurancePayer(ctx context.Context, payerID int64) (*insurancesql.InsurancePayer, error) {
	if payerID <= 0 {
		return nil, fmt.Errorf("invalid attempt to get InsurancePayer without id")
	}

	return idb.queries.GetInsurancePayer(ctx, payerID)
}

func (idb *InsuranceDB) GetInsurancePayersWithFilterAndOrder(ctx context.Context, params insurancesql.GetInsurancePayersWithFilterAndOrderParams) ([]*insurancesql.InsurancePayer, error) {
	return idb.queries.GetInsurancePayersWithFilterAndOrder(ctx, params)
}

func (idb *InsuranceDB) UpdateInsurancePayer(ctx context.Context, params insurancesql.UpdateInsurancePayerParams) (*insurancesql.InsurancePayer, error) {
	if params.Name == "" {
		return nil, fmt.Errorf("payer.name can not be blank")
	}

	return idb.queries.UpdateInsurancePayer(ctx, params)
}

func (idb *InsuranceDB) CreateInsuranceNetwork(ctx context.Context, networkParams insurancesql.CreateInsuranceNetworkParams, addresses []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams) (*insurancesql.InsuranceNetwork, error) {
	if networkParams.Name == "" {
		return nil, fmt.Errorf("network.name can not be blank")
	}

	if networkParams.PackageID < 0 {
		return nil, fmt.Errorf("network.package_id can not be less than 0")
	}

	if networkParams.InsuranceClassificationID == 0 {
		return nil, fmt.Errorf("network.insurance_classification_id can not be blank")
	}

	if networkParams.InsurancePayerID == 0 {
		return nil, fmt.Errorf("network.insurance_payer_id can not be blank")
	}

	var result *insurancesql.InsuranceNetwork

	err := idb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		qtx := idb.queries.WithTx(tx)

		var err error

		result, err = qtx.CreateInsuranceNetwork(ctx, networkParams)
		if err != nil {
			return err
		}

		checkedAddresses, err := CheckAndPrepareCreateInsuranceNetworkAddressesParams(result.ID, addresses)
		if err != nil {
			return err
		}

		_, err = qtx.CreateInsuranceNetworkAddressesByInsuranceNetworkID(ctx, checkedAddresses)
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (idb *InsuranceDB) UpdateInsuranceNetwork(ctx context.Context, networkParams insurancesql.UpdateInsuranceNetworkParams, addresses []insurancesql.CreateInsuranceNetworkAddressesByInsuranceNetworkIDParams) (*insurancesql.InsuranceNetwork, error) {
	if networkParams.Name == "" {
		return nil, fmt.Errorf("network.name can not be blank")
	}

	if networkParams.PackageID < 0 {
		return nil, fmt.Errorf("network.package_id can not be less than 0")
	}

	if networkParams.InsuranceClassificationID == 0 {
		return nil, fmt.Errorf("network.insurance_classification_id can not be blank")
	}

	if networkParams.InsurancePayerID == 0 {
		return nil, fmt.Errorf("network.insurance_payer_id can not be blank")
	}

	var result *insurancesql.InsuranceNetwork

	err := idb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		qtx := idb.queries.WithTx(tx)
		err := qtx.DeleteInsuranceNetworkAddressesByInsuranceNetworkID(ctx, networkParams.ID)
		if err != nil {
			return err
		}

		checkedAddresses, err := CheckAndPrepareCreateInsuranceNetworkAddressesParams(networkParams.ID, addresses)
		if err != nil {
			return err
		}

		_, err = qtx.CreateInsuranceNetworkAddressesByInsuranceNetworkID(ctx, checkedAddresses)
		if err != nil {
			return err
		}

		result, err = idb.queries.UpdateInsuranceNetwork(ctx, networkParams)
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return result, nil
}

func (idb *InsuranceDB) UpdateInsuranceNetworkStates(ctx context.Context, networkID int64, params []insurancesql.CreateInsuranceNetworkStatesByInsuranceNetworkIDParams) ([]*insurancesql.InsuranceNetworkState, error) {
	if networkID <= 0 {
		return nil, fmt.Errorf("invalid attempt to get InsuranceNetwork without id")
	}

	var results []*insurancesql.InsuranceNetworkState

	err := idb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		qtx := idb.queries.WithTx(tx)
		err := qtx.DeleteInsuranceNetworkStatesByInsuranceNetworkID(ctx, networkID)
		if err != nil {
			return err
		}
		if len(params) > 0 {
			_, err = qtx.CreateInsuranceNetworkStatesByInsuranceNetworkID(ctx, params)
			if err != nil {
				return err
			}
		}

		results, err = qtx.GetInsuranceNetworkStatesByInsuranceNetworkIDs(ctx, []int64{networkID})
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return results, nil
}

func (idb *InsuranceDB) CreateInsuranceNetworksAppointmentTypes(ctx context.Context, params insurancesql.CreateInsuranceNetworksAppointmentTypesParams) ([]*insurancesql.InsuranceNetworksAppointmentType, error) {
	return idb.queries.CreateInsuranceNetworksAppointmentTypes(ctx, params)
}

func (idb *InsuranceDB) UpdateInsuranceNetworkAppointmentTypes(ctx context.Context, params UpdateInsuranceNetworkAppointmentTypesParams) ([]*insurancesql.InsuranceNetworksAppointmentType, error) {
	err := idb.db.BeginFunc(ctx, func(tx pgx.Tx) error {
		qtx := idb.queries.WithTx(tx)

		err := qtx.DeleteInsuranceNetworksAppointmentTypesByInsuranceNetworkID(ctx, params.NetworkID)
		if err != nil {
			return err
		}

		_, err = qtx.CreateInsuranceNetworksAppointmentTypes(ctx, params.AppointmentTypes)
		if err != nil {
			return err
		}

		return nil
	})
	if err != nil {
		return nil, err
	}

	return idb.queries.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkID(ctx, insurancesql.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkIDParams{
		NetworkID: params.NetworkID,
	})
}

func (idb *InsuranceDB) GetInsuranceNetworkAppointmentTypesByInsuranceNetworkID(ctx context.Context, params insurancesql.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkIDParams) ([]*insurancesql.InsuranceNetworksAppointmentType, error) {
	if params.NetworkID <= 0 {
		return nil, fmt.Errorf("network_id should be greater than 0")
	}

	return idb.queries.GetInsuranceNetworkAppointmentTypesByInsuranceNetworkID(ctx, params)
}

func (idb *InsuranceDB) DeleteInsuranceNetworksAppointmentTypesByInsuranceNetworkID(ctx context.Context, networkID int64) error {
	return idb.queries.DeleteInsuranceNetworksAppointmentTypesByInsuranceNetworkID(ctx, networkID)
}

func (idb *InsuranceDB) IsHealthy(ctx context.Context) bool {
	return idb.db.Ping(ctx) == nil
}

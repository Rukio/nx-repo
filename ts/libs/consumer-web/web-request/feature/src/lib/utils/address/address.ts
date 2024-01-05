import {
  geocodeByAddress,
  geocodeByPlaceId,
  getLatLng,
} from 'react-places-autocomplete';
import { GoogleAddress, parseAddress } from '../googleAddressParser';

export const getAddressInfo = async (
  address: string
): Promise<{
  parsedAddress: GoogleAddress;
  coordinates: { lat: number; lng: number };
}> =>
  geocodeByAddress(address).then(async (result) =>
    geocodeByPlaceId(result?.[0]?.place_id).then(async (placeInfo) => {
      const parsedAddress: GoogleAddress = parseAddress(placeInfo[0]);
      const coordinates = await getLatLng(placeInfo[0]);

      return { parsedAddress, coordinates };
    })
  );

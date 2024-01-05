import { FC, PropsWithChildren } from 'react';
import GoogleMapReact from 'google-map-react';
import { Box, makeSxStyles } from '@*company-data-covered*/design-system';
import mapStyles from './mapStyles';
import { MAP_TEST_IDS } from './testIds';

const makeStyles = () =>
  makeSxStyles({
    root: { position: 'relative', width: '100%', height: '100%' },
  });

const DEFAULT_ZOOM = 14;

const MapComponent: FC<PropsWithChildren<GoogleMapReact.Props>> = (
  mapProps
) => {
  const styles = makeStyles();

  const onGoogleApiLoaded = ({
    maps,
    map,
  }: {
    maps: typeof google.maps;
    map: google.maps.Map;
  }) => {
    if (mapProps.center) {
      return new maps.Marker({
        position: {
          lat: mapProps.center.lat,
          lng: mapProps.center.lng,
        },
        map,
      });
    }
  };

  return (
    <Box sx={styles.root} data-testid={MAP_TEST_IDS.ROOT}>
      <GoogleMapReact
        {...mapProps}
        options={{ styles: mapStyles }}
        defaultZoom={DEFAULT_ZOOM}
        yesIWantToUseGoogleMapApiInternals
        onGoogleApiLoaded={onGoogleApiLoaded}
      />
    </Box>
  );
};

export default MapComponent;

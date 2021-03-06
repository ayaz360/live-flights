import React, { useState, useRef, useEffect } from 'react';
import { Indicator1 } from '@daniel.neuweiler/react-lib-module';
import { createStyles, makeStyles, Theme, useTheme } from '@material-ui/core/styles';

import IconButton from '@material-ui/core/IconButton';
import CloseIcon from '@material-ui/icons/Close';

import { IAircraftTrack, IStateVector } from '../opensky';
import { getFormattedValue, getIcon, getRotation, getStatusText } from '../helpers';

const useStyles = makeStyles((theme: Theme) =>
  createStyles({
    overlayIndicatorRoot: {
      position: 'relative',
      minWidth: 268,
      minHeight: 84,
      height: '100%',
      backgroundColor: theme.palette.grey[500],
      borderRadius: 4,
      opacity: 0.9,
      display: 'flex',
      flexDirection: 'column',
      alignContent: 'center',
      alignItems: 'center',
      justifyContent: 'center',
      justifyItems: 'center'
    },
    overlayRoot: {
      position: 'relative',
      minWidth: 268,
      height: 'auto',
      width: 'auto',
      backgroundColor: theme.palette.grey[500],
      color: theme.palette.grey[900],
      borderRadius: 4,
      opacity: 0.9,
      padding: theme.spacing(1)
    },
    headerContainer: {
      width: '100%',
      display: 'flex',
      flexDirection: 'row',
      alignItems: 'center',
      alignContent: 'center'
    },
    headerIconContainer: {
      backgroundColor: theme.palette.primary.main,
      borderRadius: '50%',
      width: 36,
      height: 36,
      display: 'flex',
      alignItems: 'center',
      alignContent: 'center',
      justifyItems: 'center',
      justifyContent: 'center',
      textAlign: 'center'
    },
    headerIcon: {
      fill: '#fff',
      width: 24,
      height: 24
    },
    headerTextContainer: {
      marginLeft: 'auto',
      marginRight: 8,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-end',
      alignContent: 'flex-end'
    },
    headerText1: {
      fontSize: 24,
      fontWeight: 'normal'
    },
    headerText2: {
      fontSize: 16,
      fontWeight: 'normal'
    },
    headerLine: {
      width: '100%',
      height: 1,
      marginTop: 8,
      marginBottom: 16,
      backgroundColor: '#000'
    },
    textContainer: {
      width: '100%',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'flex-start',
      alignContent: 'flex-start'
    },
    textSpace: {
      height: 8,
      minHeight: 8
    },
    textDescription: {
      fontSize: 12,
      fontWeight: 800
    },
    textValue: {
      fontSize: 16,
      fontWeight: 'normal'
    }
  }),
);

interface ILocalProps {
  selectedAircraft?: IAircraftTrack;
  onRelease?: (icao24: string) => void;
}
type Props = ILocalProps;

const AircraftInfoOverlay: React.FC<Props> = (props) => {

  // External hooks
  const classes = useStyles();
  const theme = useTheme();

  // States
  const [lastPositionPastSeconds, setLastPositionPastSeconds] = useState(0);

  // Refs
  const updateIntverlIDRef = useRef(0);
  const lastPositionPastSecondsRef = useRef(lastPositionPastSeconds);
  lastPositionPastSecondsRef.current = lastPositionPastSeconds;

  // Effects
  useEffect(() => {

    // Mount

    // Unmount
    return () => {

      clearInterval(updateIntverlIDRef.current);
    }
  }, []);
  useEffect(() => {

    if (!props.selectedAircraft || !props.selectedAircraft.stateVector) {

      clearInterval(updateIntverlIDRef.current);
      return;
    }

    clearInterval(updateIntverlIDRef.current);

    const lastPositionSeconds = props.selectedAircraft.stateVector.time_position ? props.selectedAircraft.stateVector.time_position : Math.floor(Date.now() / 1000);
    setLastPositionPastSeconds(Math.floor(Date.now() / 1000) - lastPositionSeconds);

    updateIntverlIDRef.current = window.setInterval(handleUpdate, 1000);

  }, [props.selectedAircraft?.stateVector]);

  const handleUpdate = () => {

    setLastPositionPastSeconds(lastPositionPastSecondsRef.current + 1);
  };

  const renderHeader = () => {

    if (!props.selectedAircraft)
      return undefined;

    if (!props.selectedAircraft.stateVector)
      return undefined;

    const stateVector = props.selectedAircraft.stateVector;

    // Get altitude
    var altitude = stateVector.geo_altitude;
    if ((altitude === null) || (altitude < 0))
      altitude = stateVector.baro_altitude;
    if ((altitude === null) || (altitude < 0))
      altitude = 0;

    // Get vertical rate
    const verticalRate = stateVector.vertical_rate ? stateVector.vertical_rate : 0;

    // Get true track
    const trueTrack = stateVector.true_track ? stateVector.true_track : 0.0;

    const FlightIcon = getIcon(stateVector.on_ground, verticalRate, altitude);

    return (

      <React.Fragment>

        <div className={classes.headerContainer}>

          <div className={classes.headerIconContainer}>
            <FlightIcon
              className={classes.headerIcon}
              style={{
                transform: `rotate(${getRotation(trueTrack, verticalRate, altitude)}deg)`,
              }} />
          </div>

          <div className={classes.headerTextContainer}>
            <div className={classes.headerText1}>
              {stateVector.callsign ? stateVector.callsign : '?'}
            </div>
            <div className={classes.headerText2}>
              {stateVector.origin_country}
            </div>
          </div>

          <IconButton
            aria-label="close"
            onClick={() => {

              if (!props.selectedAircraft)
                return;

              if (!props.selectedAircraft.stateVector)
                return undefined;

              if (props.onRelease)
                props.onRelease(props.selectedAircraft.stateVector.icao24)
            }}>
            <CloseIcon color='error' />
          </IconButton>

        </div>

      </React.Fragment>
    );
  };

  const renderFlightData = () => {

    if (!props.selectedAircraft)
      return undefined;

    if (!props.selectedAircraft.stateVector)
      return undefined;

    const stateVector = props.selectedAircraft.stateVector;

    var options = {
      year: 'numeric', month: 'numeric', day: 'numeric',
      hour: 'numeric', minute: 'numeric', second: 'numeric'
    };

    var lastPositionTime = '?';
    if (stateVector.time_position !== null) {

      var date = new Date(stateVector.time_position * 1000);
      lastPositionTime = new Intl.DateTimeFormat('de-CH', options).format(date)
    }

    var lastContactTime = '?';
    if (stateVector.last_contact !== null) {

      var lastContactDate = new Date(stateVector.last_contact * 1000);
      lastContactTime = new Intl.DateTimeFormat('de-CH', options).format(lastContactDate)
    }

    // Get altitude
    const barometricAltitude = stateVector.baro_altitude ? stateVector.baro_altitude : 0;
    const geometricAltitude = stateVector.geo_altitude ? stateVector.geo_altitude : 0;
    var altitude = stateVector.geo_altitude;
    if ((altitude === null) || (altitude < 0))
      altitude = stateVector.baro_altitude;
    if ((altitude === null) || (altitude < 0))
      altitude = 0;

    // Get velocity
    const velocity = stateVector.velocity ? stateVector.velocity : -1;

    // Get vertical rate
    const verticalRate = stateVector.vertical_rate ? stateVector.vertical_rate : 0.0;

    // Get true track
    const trueTrack = stateVector.true_track ? stateVector.true_track : 0.0;

    return (

      <React.Fragment>

        <div className={classes.textContainer}>
          <div className={classes.textDescription}>
            {'Last contact'}
          </div>
          <div className={classes.textValue}>
            {`${lastContactTime} [${lastPositionPastSeconds.toString()}s]`}
          </div>
        </div>

        <div className={classes.textSpace} />

        <div className={classes.textContainer}>
          <div className={classes.textDescription}>
            {'Last position update'}
          </div>
          <div className={classes.textValue}>
            {`${lastPositionTime} [${lastPositionPastSeconds.toString()}s]`}
          </div>
        </div>

        <div className={classes.textSpace} />

        <div className={classes.textContainer}>
          <div className={classes.textDescription}>
            {'Barometric altitude'}
          </div>
          <div className={classes.textValue}>
            {`${getFormattedValue(barometricAltitude, 1)} m [${getFormattedValue(barometricAltitude * 3.28084, 1)} ft.]`}
          </div>
        </div>

        <div className={classes.textSpace} />

        <div className={classes.textContainer}>
          <div className={classes.textDescription}>
            {'Geometric altitude'}
          </div>
          <div className={classes.textValue}>
            {`${getFormattedValue(geometricAltitude, 1)} m [${getFormattedValue(geometricAltitude * 3.28084, 1)} ft.]`}
          </div>
        </div>

        <div className={classes.textSpace} />

        <div className={classes.textContainer}>
          <div className={classes.textDescription}>
            {'Velocity'}
          </div>
          <div className={classes.textValue}>
            {`${getFormattedValue(velocity * 3.6, 1)} km/h [${getFormattedValue(velocity, 1)} m/s]`}
          </div>
        </div>

        <div className={classes.textSpace} />

        <div className={classes.textContainer}>
          <div className={classes.textDescription}>
            {'Longitude / Latitude'}
          </div>
          <div className={classes.textValue}>
            {`${getFormattedValue(stateVector.longitude ? stateVector.longitude : -1, 3)} ?? / ${getFormattedValue(stateVector.latitude ? stateVector.latitude : -1, 3)} ??`}
          </div>
        </div>

        <div className={classes.textSpace} />

        <div className={classes.textContainer}>
          <div className={classes.textDescription}>
            {'Rotation'}
          </div>
          <div className={classes.textValue}>
            {`${getFormattedValue(trueTrack, 1)} ??`}
          </div>
        </div>

        <div className={classes.textSpace} />

        <div className={classes.textContainer}>
          <div className={classes.textDescription}>
            {'Vertical rate'}
          </div>
          <div className={classes.textValue}>
            {`${getFormattedValue(verticalRate, 1)} m/s`}
          </div>
        </div>

        <div className={classes.textSpace} />

        <div className={classes.textContainer}>
          <div className={classes.textDescription}>
            {'Status'}
          </div>
          <div className={classes.textValue}>
            {getStatusText(stateVector.on_ground, verticalRate, altitude)}
          </div>
        </div>

        <div className={classes.textSpace} />

        <div className={classes.textContainer}>
          <div className={classes.textDescription}>
            {'ICAO24'}
          </div>
          <div className={classes.textValue}>
            {stateVector.icao24}
          </div>
        </div>

        <div className={classes.textSpace} />

        <div className={classes.textContainer}>
          <div className={classes.textDescription}>
            {'Transpondercode [Squawk]'}
          </div>
          <div className={classes.textValue}>
            {stateVector.squawk ? stateVector.squawk : -1}
          </div>
        </div>

      </React.Fragment>
    );
  };

  if (!props.selectedAircraft)
    return (
      <div className={classes.overlayIndicatorRoot}>
        <Indicator1
          color={theme.palette.primary.main} />
      </div>
    );

  return (

    <div className={classes.overlayRoot}>
      {renderHeader()}
      <div className={classes.headerLine} />
      {renderFlightData()}
    </div>
  );
}

export default AircraftInfoOverlay;
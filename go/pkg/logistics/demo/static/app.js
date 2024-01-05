const colors = [
  'blue',
  'blueviolet',
  'chocolate',
  'cornflowerblue',
  'crimson',
  'forestgreen',
  'gold',
  'lawngreen',
  'limegreen',
  'maroon',
  'mediumvioletred',
  'orange',
  'slateblue',
  'tomato',
];

const solutionTextAreaSelectors = [
  '#vrp-response',
  '#vrp-response-score',
  '#vrp-response-score-explanation',
];
const allTextAreaSelectors = [
  '#vrp-json-textarea',
  ...solutionTextAreaSelectors,
];
const solutionInputSelectors = [
  '#run-solver-btn',
  ...solutionTextAreaSelectors,
];
const allInputSelectors = ['#get-vrp-btn', ...solutionInputSelectors];

const patientIcon = L.IconMaterial.icon({
  icon: 'personal_injury',
  markerColor: '#3594A433',
  outlineColor: '#000',
  outlineWidth: 1,
  iconSize: [31, 42],
});
const depotIcon = L.IconMaterial.icon({
  icon: 'warehouse',
  markerColor: '#A43546',
  outlineColor: '#0003',
  outlineWidth: 1,
  iconSize: [31, 42],
});

const e6 = 1e6;
const fromServerLatLng = ({ latitude_e6, longitude_e6 }) =>
  L.latLng(latitude_e6 / e6, longitude_e6 / e6);

const colorFromId = (id) => colors[id % colors.length];

const prettify = (data) => JSON.stringify(data, null, '  ');

const clearTextContent = (...selectors) => {
  selectors.forEach(
    (selector) => (document.querySelector(selector).value = '')
  );
};

const setDisabled = (disabled, ...selectors) => {
  selectors.forEach(
    (selector) => (document.querySelector(selector).disabled = disabled)
  );
};

const map = L.map('map');
L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

const mapLayer = L.layerGroup().addTo(map);
const locationsLayer = L.layerGroup().addTo(mapLayer);
const polylinesLayer = L.layerGroup().addTo(mapLayer);

const urlParams = new URLSearchParams(window.location.search);
const autoSolve = urlParams.get('auto_solve') != '0';

const getBounds = () => {
  fetch(`/api/example-vrp-bounds${window.location.search}`)
    .then((resp) => resp.json())
    .then((data) => {
      const bounds = data.map(fromServerLatLng);
      map.fitBounds(bounds);
    });
};

let vrpData = {};
let vrpResp = {};

const displayVrp = (data) => {
  locationsLayer.clearLayers();

  const depotLocIds = new Set(
    data.problem.description.shift_teams.map(
      ({ depot_location_id }) => depot_location_id
    )
  );
  const latLngs = data.problem.description.locations.map(fromServerLatLng);
  latLngs.forEach((ll, index) =>
    L.marker(ll, {
      icon: depotLocIds.has(data.problem.description.locations[index].id)
        ? depotIcon
        : patientIcon,
    })
      .bindPopup(
        prettify({
          id: data.problem.description.locations[index].id,
          latLng: ll,
        })
      )
      .addTo(locationsLayer)
  );

  document.querySelector('#vrp-json-textarea').value = prettify(data);

  vrpData = data;
};

const getVrp = () => {
  locationsLayer.clearLayers();
  polylinesLayer.clearLayers();
  clearTextContent(...allTextAreaSelectors);
  setDisabled(true, ...allInputSelectors);

  fetch(`/api/example-vrp${window.location.search}`)
    .then((resp) => resp.json())
    .then((data) => {
      displayVrp(data);

      if (autoSolve) {
        setTimeout(() => {
          solveVrp(data);
        }, 0);
      }
    })
    .finally(() => {
      setDisabled(false, ...allInputSelectors);
    });
};

const displaySolution = (data) => {
  polylinesLayer.clearLayers();

  const { route_polylines } = data;
  if (route_polylines) {
    route_polylines.forEach(({ shift_team_id, polyline }) => {
      const latlngPoly = polyline.map(fromServerLatLng);
      L.polyline(latlngPoly, {
        color: colorFromId(shift_team_id),
        weight: 4,
      }).addTo(polylinesLayer);
    });
  }

  vrpResp = data;
  document.querySelector('#vrp-response').value = prettify(vrpResp);
  document.querySelector('#vrp-response-score').value = prettify(
    vrpResp.response.solution.score
  );
  document.querySelector('#vrp-response-score-explanation').value =
    vrpResp.response.solution.score.debug_explanation;
};

const solveVrp = (data) => {
  polylinesLayer.clearLayers();
  clearTextContent(...solutionTextAreaSelectors);
  setDisabled(true, ...solutionInputSelectors);

  withVrpStatusResponseHandler(
    fetch('/api/solve-vrp', {
      body: JSON.stringify(data),
      method: 'POST',
    })
  );
};

const solveVrpStatus = (token) => {
  withVrpStatusResponseHandler(fetch(`/api/solve-vrp-status?token=${token}`));
};

const withVrpStatusResponseHandler = async (responsePromise) => {
  responsePromise
    .then((resp) => {
      if (resp.status != 200) {
        throw new Error(resp.statusText);
      }
      return resp.json();
    })
    .then((data) => {
      const { response, token, next_poll_ms } = data;
      displaySolution(response);

      if (token && next_poll_ms) {
        setTimeout(() => solveVrpStatus(token), next_poll_ms);
        return;
      }

      setDisabled(false, ...solutionInputSelectors);
    })
    .catch((e) => {
      console.error(e);
      setDisabled(false, ...solutionInputSelectors);
    });
};

document.querySelector('#get-vrp-btn').addEventListener('click', getVrp);

document.querySelector('#run-solver-btn').addEventListener('click', () => {
  const data = JSON.parse(document.querySelector('#vrp-json-textarea').value);

  displayVrp(data);
  solveVrp(data);
});

getBounds();
getVrp();

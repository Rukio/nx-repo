import { sendPOSTRequest } from './request';

function createCaller() {
  return cy
    .fixture('apiBody/createCaller')
    .then((callerFixture) =>
      sendPOSTRequest({
        url: 'api/callers',
        form: true,
        body: callerFixture,
      })
    )
    .then((createCallerResp) => createCallerResp.body);
}

export default createCaller;

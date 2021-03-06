var vpnUtil;

import ipc from 'ipc';
import alt from '../alt';
import log from '../stores/LogStore';
import Settings from '../utils/SettingsUtil';
import Credentials from '../utils/CredentialsUtil';

class VPNActions {

  constructor () {
    this.generateActions(
      'newIp', // called when we received a new ip
      'bytecount',
      'processStarted',
      'processKilled'
    );
  }

  connect (args) {

    // set tray in connecting state
    ipc.send('vpn.connecting');

    vpnUtil = require('../utils/VPNUtil');
    this.dispatch();

    vpnUtil.connect(args)
        .then(() => {
            log.info('VPNAction.connect() done');
            // update tray
            ipc.send('vpn.connected');
            this.actions.connected();
        })
        .catch((error) => {
            console.log(error);
            log.error('Unable to launch process');
            this.actions.disconnected();

        });
  }

  disconnect () {

    vpnUtil = require('../utils/VPNUtil');
    this.dispatch();
    vpnUtil.disconnect()
        .then(() => {

            log.info('Waiting EXITING state');

        })
        .catch((error) => {

            log.error('Unable to disconnect');
            console.log(error);

        });
  }

  checkIp () {
    var helpers = require('../utils/VPNHelpers');
    this.dispatch();
    helpers.updateIp()
        .then(() => {

            log.info('IP Updated');

        })
        .catch((error) => {

            log.error('Unable to update ip');
            console.log(error);

        });
  }

  invalidCredentials () {
    this.dispatch();
    alert("Invalid credentials")
  }

  appReady () {
    this.dispatch();
    if (Settings.get('connectLaunch') === 'true' && Credentials._config()) {
        log.info('Auto-connect on launch')
        this.actions.connect({
            username: Credentials.get().username,
            password: Credentials.get().password,
            server: Settings.get('server') || 'hub.vpn.ht'
        });
    }

  }

  // used by tray
  disconnected() {
    this.dispatch();
    ipc.send('vpn.disconnected');

    // on windows we need to stop the service
    if (process.platform == 'win32') {
        require('../utils/Util').exec(['net', 'stop', 'openvpnservice'])
    }
  }

  connected() {
    this.dispatch();
    ipc.send('vpn.connected');
  }


}

export default alt.createActions(VPNActions);

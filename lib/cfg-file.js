// Module for work with the configuration / status file
// Read and write operations are synchronous

import fs from 'fs';
let cfgFilename = '';

const module = {
  // for unit tests
  _verbose: true,
  _mute: () => { module._verbose = false; },
  // module functions
  setFilename: (filename) => { cfgFilename = filename; return module; },
  read: () => {
    module._verbose && console.log('Reading configuration file "' + cfgFilename + '".');
    let text;
    let obj;
    // read
    try {
      text = fs.readFileSync(cfgFilename);
    } catch (e) {
      if (module._verbose) {
        console.error('Cannot read configuration file "' + cfgFilename + '".');
        console.error('Aborting.');
        process.exit(1);
      } else {
        throw new Error('cannot read file');
      }
    }
    // parse
    try {
      obj = JSON.parse(text);
    } catch (e) {
      if (module._verbose) {
        console.error('Cannot parse configuration file "' + cfgFilename + '".');
        console.error('Message: ' + e.message);
        console.error('Aborting.');
        process.exit(1);
      } else {
        throw new Error('cannot parse file');
      }
    }
    // validate
    const mandatory = ['token', 'hosting', 'organisation', 'project', 'artifacts', 'script'];
    mandatory.forEach((field) => {
      if (!(field in obj)) {
        if (module._verbose) {
          console.error('Invalid configuration file "' + cfgFilename + '".');
          console.error('Mandatory field "' + field + '" is missing.');
          console.error('Aborting.');
          process.exit(1);
        } else {
          throw new Error('missing mandatory field');
        }
      }
    });
    if (!obj.ignore_branch && !obj.branch) {
      if (module._verbose) {
        console.error('Invalid configuration file "' + cfgFilename + '".');
        console.error('Either "branch" field or "ignore_branch" (true) field must be provided.');
        console.error('Aborting.');
        process.exit(1);
      } else {
        throw new Error('either "branch" field or "ignore_branch" (true) field must be provided');
      }
    }
    // extend with defaults
    const defaults = {
      cci_url: 'https://circleci.com', // CircleCI base-url, used for self-hosted installations
      order_by: 'build_num',           // field defining ordering of the builds
      interval: 60,                    // polling interval, in seconds
      directory: '/tmp',               // where to store artifacts
      last: 0,                         // last installed build number
      timeout: 45                      // request / download timeout (per single request / artifact)
    };
    const res = { ...defaults, ...obj };
    module._verbose && console.log('Configuration object:\n' + JSON.stringify(res, null, 4));
    return res;
  },
  write: (config) => {
    module._verbose && console.log('Writing configuration file "' + cfgFilename + '".');
    const newConf = {};
    for (const key in config) { if (key[0] !== '_') { newConf[key] = config[key]; } }
    const data = JSON.stringify(newConf, null, 4);
    module._verbose && console.log('New configuration data:\n' + data);
    try {
      fs.writeFileSync(cfgFilename, data + '\n');
      return true;
    } catch (e) {
      if (module._verbose) {
        console.error('Failed to write new config to "' + cfgFilename + '".');
        console.error('Reason: ' + e.message);
      }
      return false;
    }
  }
};

export default module;

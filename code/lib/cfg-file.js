// Module for work with the configuration / status file
// Read and write operations are synchronous

import fs from 'fs';
let cfgFilename = '';

const module = {
  setFilename: (filename) => { cfgFilename = filename; return module; },
  read: () => {
    console.log('Reading configuration file "' + cfgFilename + '".');
    let text;
    let obj;
    // read
    try {
      text = fs.readFileSync(cfgFilename);
    } catch (e) {
      console.error('Cannot read configuration file "' + cfgFilename + '".');
      console.error('Aborting.');
      process.exit(1);
    }
    // parse
    try {
      obj = JSON.parse(text);
    } catch (e) {
      console.error('Cannot parse configuration file "' + cfgFilename + '".');
      console.error('Message: ' + e.message);
      console.error('Aborting.');
      process.exit(1);
    }
    // validate
    const mandatory = ['token', 'project', 'branch', 'artifacts', 'script'];
    mandatory.forEach((field) => {
      if (!(field in obj)) {
        console.error('Invalid configuration file "' + cfgFilename + '".');
        console.error('Mandatory field "' + field + '" is missing.');
        console.error('Aborting.');
        process.exit(1);
      }
    });
    // extend with defaults
    const defaults = {
      organisation: 'salsita',  // CCI user name
      interval: 60,             // polling interval, in seconds
      directory: '/tmp',        // where to store artifacts
      last: 0,                  // last installed build number
      timeout: 60               // request / download timeout (per single request / artifact)
    };
    const res = { ...defaults, ...obj };
    console.log('Configuration object:\n' + JSON.stringify(res, null, 4));
    return res;
  },
  write: (config) => {
    console.log('Writing configuration file "' + cfgFilename + '".');
    const newConf = {};
    for (const key in config) { if (key[0] !== '_') { newConf[key] = config[key]; } }
    const data = JSON.stringify(newConf, null, 4);
    console.log('New configuration data:\n' + data);
    try {
      fs.writeFileSync(cfgFilename, data + '\n');
      return true;
    } catch (e) {
      console.error('Failed to write new config to "' + cfgFilename + '".');
      console.error('Reason: ' + e.message);
      return false;
    }
  }
};

export default module;

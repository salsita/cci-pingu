// Module for talking to CCI, getting the artifacts, downloading them,
// starting the action script, saving the updated config file, ...
//
// The task.run() schedules next run as needed.
// All disk operations are synchronous.

import request from 'superagent';
import fs from 'fs';
import path from 'path';
import { spawn } from 'child_process';
import orderBy from 'lodash.orderby';
import filter from 'lodash.filter';

const module = {};
let options; // set once at first run()
let config;  // re-read in each iteration
let downloadError; // stop the process in case download failed

let EXIT_CODE; // return code for '--run-once' mode

const scheduleNext = () => {
  if (config._save) {
    config.last = config._last;
    if (options.cfgFile.write(config)) {
      console.info('New configuration file revision successfully saved.');
    }
  }
  if (options['run-once']) {
    console.info('CCI-PINGU about to exit. Thanks for flying with us!');
    process.exit(EXIT_CODE);
  } else {
    setTimeout(module.run, config.interval * 1000);
    console.info('Next CCI task scheduled in ' + config.interval + ' seconds.');
  }
};

const logPrefixed = (prefix, logFn) => (data) => {
  logFn(data.toString().split('\n').slice(0, -1).map((s) => `${prefix} ${s}`).join('\n'));
};

const startScript = () => {
  const scriptFile = path.resolve(config.script);
  console.info('Executing "' + scriptFile + '".');
  try {
    const script = spawn(scriptFile, [ config._target, config._last ], { cwd: path.dirname(scriptFile) });
    script.stdout.on('data', logPrefixed('*', console.info));
    script.stderr.on('data', logPrefixed('!', console.warn));
    script.on('error', (err) => {
      console.error('Failed to start script "' + scriptFile + '".');
      console.error(JSON.stringify(err));
      console.warn('CCI task finished with failure.');
      scheduleNext();
    });
    script.on('close', (code) => {
      if (!code) { // success
        console.info('CCI task successfully finished.');
        config._save = true;
      } else { // fail
        console.error('Installation script failed with exit code (' + code + ').');
      }
      EXIT_CODE = code;
      scheduleNext();
    });
  } catch (e) { // spawn can throw exceptions on its own
    console.error('Failed to start script "' + scriptFile + '".');
    console.error(e.message);
    console.warn('CCI task finished with failure.');
    scheduleNext();
  }
};

const cciDownloadOne = () => {
  if (!config._urls.length) {
    startScript();
  } else {
    const url = config._urls.pop();
    let filename = url.split('/');
    filename = filename[filename.length - 1];
    const streamName = path.join(config._target, filename);
    const stream = fs.createWriteStream(streamName);
    console.info('Downloading "' + url + '".');
    const start = (new Date()).getTime();
    downloadError = false;
    request
      .get(url)
      .query({ 'circle-token': config.token })
      .timeout(config.timeout * 1000)
      .on('error', (err) => {
        console.error('Download failed: ' + JSON.stringify(err) + '.');
        console.warn('CCI task finished with failure.');
        downloadError = true;
        scheduleNext();
      })
      .on('end', () => {
        if (downloadError) { return; }
        let dur = (new Date()).getTime() - start;
        if (dur > 999) {
          dur = ('' + dur).split('');
          dur.splice(dur.length - 3, 0, '.');
          dur = dur.join('');
        }
        console.info('Saved as "' + streamName + '" in ' + dur + ' ms.');
        process.nextTick(cciDownloadOne);
      })
      .pipe(stream);
  }
};
const cciDownload = () => {
  // create target directory
  try {
    fs.statSync(config.directory);
  } catch (e) {
    console.error('Directory "' + config.directory + '" does not exist, cannot write there.');
    console.warn('CCI task finished with failure.');
    scheduleNext();
    return;
  }
  const basename = 'build-' + config._last;
  let dirname;
  try {
    let i = 1;
    while (true) {  // eslint-disable-line no-constant-condition
      dirname = basename + (i > 1 ? '.' + i : '');
      fs.statSync(path.join(config.directory, dirname));
      i++;
    }
  } catch (e) {
    // exception is fine
  }
  // create new dir
  config._target = path.resolve(path.join(config.directory, dirname));
  console.log('Creating artifact directory "' + config._target + '".');
  try {
    fs.mkdirSync(config._target);
  } catch (e) {
    console.error('Target directory "' + config._target + '" cannot be created.');
    console.warn('CCI task finished with failure.');
    scheduleNext();
    return;
  }

  // start the downloads
  cciDownloadOne();
};

const cciArtifactsInfoHandler = (err, res) => {
  if (err) {
    console.error(JSON.stringify(err));
    console.warn('CCI task finished with failure.');
    scheduleNext();
    return;
  }
  if (!res.ok) {
    console.error('Status: ' + res.status + ', ' + res.text);
    console.warn('CCI task finished with failure.');
    scheduleNext();
  } else { // res.ok
    console.log('Response from CCI server:\n' + JSON.stringify(res.body, null, 4));
    const prefixes = config.artifacts.map(item => {
      return { name: item, found: false };
    });
    const urls = [];
    res.body.forEach(item => {
      prefixes.forEach(prefix => {
        if (item.path.indexOf(prefix.name) !== -1) {
          urls.push(item.url);
          prefix.found = true;
        }
      });
    });
    console.log('Collected artifact URLs (to download):\n' + JSON.stringify(urls, null, 4));
    let allFound = true;
    prefixes.forEach(prefix => { if (!prefix.found) { allFound = false; } });
    if (!allFound) {
      console.error('Not all artifacts found! Missing:');
      prefixes.forEach(prefix => { if (!prefix.found) { console.error('+ ' + prefix.name); } });
      console.warn('CCI task finished with failure.');
      scheduleNext();
    } else {
      config._urls = urls;
      cciDownload();
    }
  }
};

const cciBuildInfoHandler = (err, res) => {
  if (err) {
    console.error(JSON.stringify(err));
    console.warn('CCI task finished with failure.');
    scheduleNext();
    return;
  }
  if (!res.ok) {
    console.error('Status: ' + res.status + ', ' + res.text);
    console.warn('CCI task finished with failure.');
    scheduleNext();
  } else if (!res.body || !res.body.length) {
    console.error('No successful build found!');
    console.warn('CCI task finished with failure.');
    scheduleNext();
  } else { // res.ok
    let builds = res.body;
    if (!options.install) {
      console.log('Response from CCI server:\n' + JSON.stringify(builds, null, 4));
      builds = orderBy(builds, [ config.order_by ], [ 'desc' ]);
      if (config.workflows_job_name) {
        console.log('Filtering the available successful builds on workflows job name = ' + config.workflows_job_name + '.');
        builds = filter(builds, (build) => (build.workflows && (build.workflows.job_name === config.workflows_job_name)));
        if (!builds.length) {
          console.error('No successful build with specified workflows job name found!');
          console.warn('CCI task finished with failure.');
          scheduleNext();
          return;
        }
      }
    }
    config._last = builds[0].build_num;
    !options.install && console.info('Last successful ' + config._name + ' build number: ' + config._last + '.');
    if (!options.install && (config.last === config._last)) {
      console.info('Build ' + config._last + ' already installed.');
      console.info('CCI task successfully finished.');
      EXIT_CODE = 0;
      scheduleNext();
    } else {
      if (options.install && (config.last === config._last)) {
        console.info('Build ' + config._last + ' already installed, about to install it again...');
      } else {
        console.info('Build ' + config._last + ' is not installed yet.');
      }
      const apiPath = ['/api/v1.1/project', config.hosting, config.organisation,
        config.project, config._last, 'artifacts'].join('/');
      console.log('Getting info about build ' + config._last + ' artifacts.');
      request
        .get('https://circleci.com' + apiPath)
        .query({ 'circle-token': config.token })
        .set('Accept', 'application/json')
        .timeout(config.timeout * 1000)
        .end(cciArtifactsInfoHandler);
    }
  }
};

module.run = (_options = null) => {
  EXIT_CODE = 1;   // update to 0 on final success
  if (_options) { options = _options; }
  config = options.cfgFile.read();
  if (config.ignore_branch) {
    config.branch = '<ANY>';
  }
  config._name = [config.hosting, config.organisation, config.project, config.branch].join('/');
  console.info('CCI task started.');
  if (options.install) {
    cciBuildInfoHandler(null, {
      ok: true,
      body: [ { build_num: options.install } ]
    });
    return;
  }
  const apiPath =
    config.ignore_branch
      ? ['/api/v1.1/project', config.hosting, config.organisation, config.project].join('/')
      : ['/api/v1.1/project', config.hosting, config.organisation, config.project, 'tree', config.branch].join('/');
  console.log('Getting info about last successful build of ' + config._name + '.');
  request
    .get('https://circleci.com' + apiPath)
    .query({ 'circle-token': config.token, filter: 'successful', limit: 100 })
    .set('Accept', 'application/json')
    .timeout(config.timeout * 1000)
    .end(cciBuildInfoHandler);
};

export default module;

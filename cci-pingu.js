import logger from './lib/logger';
import cmdline from './lib/cmdline';
import cfgFile from './lib/cfg-file';
import task from './lib/task';
import version from './lib/version';

const main = () => {
  const options = cmdline.options;
  logger.install(null, null, !options['no-time']);
  if (options.silent) { logger.level('error'); }
  if (options.debug)  { logger.level('log'); }

  console.info(`CCI-PINGU started (version:${version})`);
  console.log('Command line options:\n' + JSON.stringify(options, null, 4));

  const sigHandler = () => {
    console.info('SIGINT / SIGTERM received, CCI-PINGU terminating. Thanks for flying with us!');
    process.exit(0);
  };
  process.on('SIGINT', sigHandler);
  process.on('SIGTERM', sigHandler);

  options.cfgFile = cfgFile.setFilename(options.config);
  task.run(options);
};

module.exports = main; // for the runner in bin directory

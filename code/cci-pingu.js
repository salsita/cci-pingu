import logger from './lib/logger';
import cmdline from './lib/cmdline';
import cfgFile from './lib/cfg-file';
import task from './lib/task';

logger.install();
const options = cmdline.options;
if (options.silent) { logger.level('error'); }
if (options.debug)  { logger.level('log'); }

console.info('CCI-PINGU started.');
console.log('Command line options:\n' + JSON.stringify(options, null, 4));

const sigHandler = () => {
  console.info('SIGINT / SIGTERM received, CCI-PINGU terminating. See you next time!');
  process.exit(0);
};
process.on('SIGINT', sigHandler);
process.on('SIGTERM', sigHandler);

options.cfgFile = cfgFile.setFilename(options.config);
task.run(options);

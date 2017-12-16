// Module for pocessing command line options

import argv from 'argv';
import version from './version';

// command line options
argv.option([
  {
    name: 'config',
    short: 'c',
    type: 'path',
    description: 'MANDATORY: Path to configuration JSON file'
  },
  {
    name: 'debug',
    short: 'd',
    type: 'boolean',
    description: 'Log verbosely'
  },
  {
    name: 'silent',
    short: 's',
    type: 'boolean',
    description: 'Log errors only'
  },
  {
    name: 'no-time',
    type: 'boolean',
    description: 'Do NOT prefix output lines with timestamp and log-level'
  },
  {
    name: 'run-once',
    short: '1',
    type: 'boolean',
    description: 'Do NOT start as monitoring daemon'
  },
  {
    name: 'help',
    short: 'h',
    type: 'boolean',
    description: 'Print this message and exit'
  },
  {
    name: 'version',
    short: 'v',
    type: 'boolean',
    description: 'Print version and exit'
  },
  {
    name: 'install',
    short: 'i',
    type: 'int',
    description: 'Install given build, implies --run-once'
  }
]);

const args = argv.run();

// take care of help / versions
if (args.options.help) { argv.help(); process.exit(0); }
if (args.options.version) { console.log(version); process.exit(0); }

// make sure config option is set
if (!args.options.config) {
  console.error('Missing configuration JSON file option.');
  argv.help();
  process.exit(0);
}

// 'install' option implies 'run-once'
if (args.options.install) { args.options['run-once'] = true; }

export default args;

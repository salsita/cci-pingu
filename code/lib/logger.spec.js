// tested module:
import logger from './logger';
import assert from 'assert';

// mocks:
const Date = () => {
  // 2015/01/02 03:04:05.006
  return {
    getFullYear: () => 2015,
    getMonth: () => 0
  };
};

let log = [];
function logArgs(...args) { log = log.concat(args); }
const myConsole = {
  log: logArgs,
  info: logArgs,
  warn: logArgs,
  error: logArgs
};

logger._inject(myConsole);
beforeEach(() => { log = []; });

describe('Logger module', () => {
  it('# TODO add tests', () => {
    logger.install();
    const d = new Date();
    d.getMonth();
    assert.strictEqual(log.length, 0);  // info is the default log level
  });
});

/*
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

logger.install();
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

logger.install();
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

logger.uninstall();
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

logger.uninstall();
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

logger.install('log', 'my cool app name');
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

logger.uninstall();
logger.install('warn');
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

logger.uninstall();
logger.install();
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');
logger.name('app name');
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');
logger.level('warn');
console.log('LOG text');
console.info('INFO text');
console.warn('WARN text');
console.error('ERROR text');

*/

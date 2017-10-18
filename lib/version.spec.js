import assert from 'assert';
import version from './version';

describe('Version module', () => {
  it('# should export version string', () => {
    assert.equal(typeof version, 'string');
  });
});

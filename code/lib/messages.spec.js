import assert from 'assert';
import * as obj from './messages';

describe('lib/messages.js', () => {
  it('should verify all the messages', () => {
    assert.strictEqual(obj.message, 'Hello world!');
    assert.strictEqual(obj.warning, 'Something went wrong!');
  });
});

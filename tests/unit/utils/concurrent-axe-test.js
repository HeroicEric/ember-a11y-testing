/* global sinon, axe */
import { module, test } from 'ember-qunit';
import wait from 'ember-test-helpers/wait';
import { ConcurrentAxe } from 'ember-a11y-testing/utils/concurrent-axe';

function setupDOMNode() {
  const node = document.createElement('div');
  document.body.appendChild(node);
  return node;
}

module('Unit | Utils | ConcurrentAxe', {
  before() {
    this.testOptions = { test: 'test' };
    this.testCallback = function(){};
  },
  beforeEach() {
    this.subject = new ConcurrentAxe();
    this.sandbox = sinon.createSandbox();
    this.axeRunStub = this.sandbox.stub(axe, 'run');
    this.testNode = setupDOMNode();
  },
  afterEach() {
    this.sandbox.restore();
    this.axeRunStub = null;
    this.testNode.remove();
  }
});

test('util calls axe.run with the correct arguments', function(assert) {
  assert.expect(1);

  this.subject.run(this.testNode, this.testOptions, this.testCallback);

  return wait().then(() => {
    assert.ok(this.axeRunStub.calledOnceWith(this.testNode, this.testOptions, this.testCallback), 'called once with all arguments');
  });
});

test('all concurrent axe.run calls are executed', function(assert) {
  assert.expect(5);

  for (let i=0; i<3; i++) {
    this.subject.run(this.testNode, this.testOptions, this.testCallback);
  }

  assert.equal(this.subject._queue.length, 2, 'subsequent calls are placed in the queue');
  assert.ok(this.subject._timer, 'subsequent calls are scheduled for the next run loop');

  return wait().then(() => {
    assert.ok(this.axeRunStub.calledThrice, 'axe.run is called thrice');
    assert.equal(this.subject._queue.length, 0, 'queue is cleared');
    assert.notOk(this.subject._timer, 'timer is cleared');
  });
});

test('axe does not audit invalid DOM node', function(assert) {
  assert.expect(1);

  const div = document.createElement('div');

  this.subject.run(undefined, this.testOptions, this.testCallback);
  this.subject.run({}, this.testOptions, this.testCallback);
  this.subject.run(div, this.testOptions, this.testCallback);

  this.testNode.remove();
  this.subject.run(this.testNode, this.testOptions, this.testCallback);

  return wait().then(() => {
    assert.ok(this.axeRunStub.notCalled, 'axe.run is not called');
  });
});
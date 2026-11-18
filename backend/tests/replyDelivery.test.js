const test = require('node:test');
const assert = require('node:assert/strict');

const { summarizeSmsForReplies, isUndeliveredReply } = require('../services/replyDelivery');

const at = (iso) => new Date(iso).getTime();

test('each text belongs to the reply saved just before it', () => {
  const replies = [
    { id: 'first', createdAt: '2026-11-10T09:00:00.000Z' },
    { id: 'second', createdAt: '2026-11-10T09:30:00.000Z' },
  ];
  const outcomes = [
    // Queued a few seconds after each reply, as the reply route does.
    { createdAtMs: at('2026-11-10T09:00:03.000Z'), status: 'failed', reason: 'NotEnoughBalance' },
    { createdAtMs: at('2026-11-10T09:30:02.000Z'), status: 'delivered' },
  ];

  const result = summarizeSmsForReplies(replies, outcomes);
  assert.deepEqual(result.get('first'), { status: 'failed', reason: 'NotEnoughBalance' });
  assert.deepEqual(result.get('second'), { status: 'delivered', reason: null });
});

test('one reminder getting through means the patient was told', () => {
  const replies = [{ id: 'r', createdAt: '2026-11-10T09:00:00.000Z' }];
  const outcomes = [
    { createdAtMs: at('2026-11-10T09:00:01.000Z'), status: 'failed', reason: 'x' },
    { createdAtMs: at('2026-11-10T09:00:01.000Z'), status: 'delivered' },
    { createdAtMs: at('2026-11-10T09:00:01.000Z'), status: 'cancelled' },
  ];

  assert.equal(summarizeSmsForReplies(replies, outcomes).get('r').status, 'delivered');
});

test('a text waiting on the account reads as held, not failed', () => {
  const replies = [{ id: 'r', createdAt: '2026-11-10T09:00:00.000Z' }];
  const outcomes = [
    { createdAtMs: at('2026-11-10T09:00:01.000Z'), status: 'pending', held: true, reason: 'NotEnoughBalance' },
    { createdAtMs: at('2026-11-10T09:00:01.000Z'), status: 'failed', reason: 'NotEnoughBalance' },
  ];

  assert.deepEqual(summarizeSmsForReplies(replies, outcomes).get('r'), { status: 'held', reason: 'NotEnoughBalance' });
});

test('texts cancelled because the patient read first are not a failure', () => {
  const replies = [{ id: 'r', createdAt: '2026-11-10T09:00:00.000Z' }];
  const outcomes = [{ createdAtMs: at('2026-11-10T09:00:01.000Z'), status: 'cancelled' }];

  assert.equal(summarizeSmsForReplies(replies, outcomes).get('r').status, 'cancelled');
});

test('a reply with no text due at all reports none', () => {
  // Kakao patients without a phone number: nobody could have texted them.
  const result = summarizeSmsForReplies([{ id: 'r', createdAt: '2026-11-10T09:00:00.000Z' }], []);
  assert.deepEqual(result.get('r'), { status: 'none', reason: null });
});

test('undelivered means unread and the text failed - nothing weaker', () => {
  assert.equal(isUndeliveredReply({ seen: false }, { status: 'failed' }), true);
  // Read it anyway, through the status page or the channel.
  assert.equal(isUndeliveredReply({ seen: true }, { status: 'failed' }), false);
  // No channel at all: nobody can act on this, so it is not held open.
  assert.equal(isUndeliveredReply({ seen: false }, { status: 'none' }), false);
  // Still trying: not yet a failure.
  assert.equal(isUndeliveredReply({ seen: false }, { status: 'held' }), false);
  assert.equal(isUndeliveredReply({ seen: false }, { status: 'delivered' }), false);
  assert.equal(isUndeliveredReply(null, { status: 'failed' }), false);
});

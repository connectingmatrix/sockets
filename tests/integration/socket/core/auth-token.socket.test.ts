import assert from 'node:assert/strict';
import test from 'node:test';
import { parseAccessTokenPayload, parseTokenFromAuthHeader, parseTokenFromHandshake } from '../../src/core/auth-token.socket';

test('parseTokenFromAuthHeader strips bearer prefix', () => {
  assert.equal(parseTokenFromAuthHeader('Bearer abc.def'), 'abc.def');
  assert.equal(parseTokenFromAuthHeader(' token '), 'token');
  assert.equal(parseTokenFromAuthHeader(''), null);
});

test('parseAccessTokenPayload reads packed access token payloads', () => {
  assert.equal(parseAccessTokenPayload('access_token=abc;token=xyz'), 'abc');
  assert.equal(parseAccessTokenPayload('token=xyz'), 'xyz');
  assert.equal(parseAccessTokenPayload('access_token=;token=xyz'), 'xyz');
  assert.equal(parseAccessTokenPayload('token=xyz; malformed'), 'xyz');
  assert.equal(parseAccessTokenPayload('foo=bar'), null);
  assert.equal(parseAccessTokenPayload('plain-token'), 'plain-token');
  assert.equal(parseAccessTokenPayload(''), null);
});

test('parseTokenFromHandshake prefers auth token then header then query', () => {
  const authSocket = {
    handshake: { auth: { token: 'Bearer auth-token' }, headers: {}, query: {} },
  };
  assert.equal(parseTokenFromHandshake(authSocket as never), 'auth-token');

  const headerSocket = {
    handshake: { auth: {}, headers: { authorization: 'Bearer header-token' }, query: {} },
  };
  assert.equal(parseTokenFromHandshake(headerSocket as never), 'header-token');

  const querySocket = {
    handshake: { auth: {}, headers: {}, query: { token: 'query-token' } },
  };
  assert.equal(parseTokenFromHandshake(querySocket as never), 'query-token');

  const queryAccessTokenSocket = {
    handshake: { auth: {}, headers: {}, query: { access_token: 'access-token' } },
  };
  assert.equal(parseTokenFromHandshake(queryAccessTokenSocket as never), 'access-token');

  const queryAuthTokenSocket = {
    handshake: { auth: {}, headers: {}, query: { auth_token: 'auth-token' } },
  };
  assert.equal(parseTokenFromHandshake(queryAuthTokenSocket as never), 'auth-token');

  const authWithoutBearerSocket = {
    handshake: { auth: { token: 'token-without-bearer' }, headers: {}, query: {} },
  };
  assert.equal(parseTokenFromHandshake(authWithoutBearerSocket as never), 'token-without-bearer');

  const emptySocket = {
    handshake: { auth: {}, headers: {}, query: {} },
  };
  assert.equal(parseTokenFromHandshake(emptySocket as never), null);

  const blankAuthFallbackSocket = {
    handshake: { auth: { token: '   ' }, headers: {}, query: { token: 'query-fallback-token' } },
  };
  assert.equal(parseTokenFromHandshake(blankAuthFallbackSocket as never), '   ');
});

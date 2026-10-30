import test from 'node:test';
import assert from 'node:assert/strict';
import { createConnectionCheck } from '../scripts/github-connection-check.mjs';

const config = {clientId:'fixture-client', clientSecret:'fixture-secret', expectedLogin:'fixture-user'};
const base = 'http://127.0.0.1:8788';

test('the local authorization request uses state and S256 without repository scopes or a verifier in its URL', async () => {
  const check=createConnectionCheck(config);
  const response=await check.handle(new Request(base+'/start'));
  const target=new URL(response.headers.get('location'));
  assert.equal(target.origin,'https://github.com');
  assert.equal(target.searchParams.get('scope'),'');
  assert.ok(target.searchParams.get('state').length>=32);
  assert.equal(target.searchParams.get('code_challenge_method'),'S256');
  assert.ok(target.searchParams.get('code_challenge'));
  assert.equal(target.searchParams.has('code_verifier'),false);
});

test('untrusted hosts, state mismatches, and callback replay never trigger provider requests', async () => {
  let calls=0;
  const check=createConnectionCheck(config, async()=>{ calls++; throw new Error('Unexpected request'); });
  assert.equal((await check.handle(new Request('http://wrong.test:8788/start'))).status,403);
  assert.equal((await check.handle(new Request(base+'/callback?code=fixture&state=wrong'))).status,400);
  const start=await check.handle(new Request(base+'/start'));
  const state=new URL(start.headers.get('location')).searchParams.get('state');
  const cancelled=new Request(base+'/callback?error=access_denied&state='+state);
  assert.equal((await check.handle(cancelled)).status,303);
  assert.equal((await check.handle(cancelled)).status,400);
  assert.equal(calls,0);
});

test('a code exchange, refresh, identity check and dedicated grant revocation produce a credential-free report', async () => {
  const requests=[];
  const check=createConnectionCheck(config, async(url,options)=>{
    requests.push({url,options});
    if(url.includes('/login/oauth/access_token')) {
      const body=new URLSearchParams(options.body);
      if(body.get('grant_type')==='refresh_token') return Response.json({access_token:'fixture-refreshed',scope:''});
      assert.ok(body.get('code_verifier'));
      return Response.json({access_token:'fixture-token',refresh_token:'fixture-refresh',scope:'',expires_in:28800});
    }
    if(url.endsWith('/user')) return Response.json({login:'fixture-user',private_gists:99});
    assert.equal(options.method,'DELETE');
    assert.ok(url.endsWith('/applications/fixture-client/grant'));
    return new Response(null,{status:204});
  });
  const start=await check.handle(new Request(base+'/start'));
  const state=new URL(start.headers.get('location')).searchParams.get('state');
  const callback=await check.handle(new Request(base+'/callback?code=fixture-code&state='+state));
  assert.equal(callback.status,303);
  assert.equal(callback.headers.get('location'),'/result');
  const report=check.getReport();
  assert.equal(report.status,'completed');
  assert.equal(report.refreshStatus,200);
  assert.equal(report.testGrantRevoked,true);
  assert.equal(requests.length,5);
  const serialized=JSON.stringify(report);
  for(const secret of ['fixture-secret','fixture-token','fixture-refresh','fixture-refreshed','fixture-code','private_gists']) assert.ok(!serialized.includes(secret));
});

test('unexpected scopes stop the API check but still revoke the test grant', async () => {
  let identityCalled=false;
  const check=createConnectionCheck(config, async(url)=>{
    if(url.includes('/access_token')) return Response.json({access_token:'fixture-token',scope:'repo'});
    if(url.endsWith('/user')) identityCalled=true;
    return new Response(null,{status:204});
  });
  const start=await check.handle(new Request(base+'/start'));
  const state=new URL(start.headers.get('location')).searchParams.get('state');
  await check.handle(new Request(base+'/callback?code=fixture&state='+state));
  assert.equal(check.getReport().status,'failed');
  assert.equal(check.getReport().testGrantRevoked,true);
  assert.equal(identityCalled,false);
});

test('provider exception details cannot leak credentials into the saved report', async () => {
  const check=createConnectionCheck(config,async()=>{throw new Error('private-fixture-secret-do-not-record');});
  const start=await check.handle(new Request(base+'/start'));
  const state=new URL(start.headers.get('location')).searchParams.get('state');
  await check.handle(new Request(base+'/callback?code=fixture&state='+state));
  const serialized=JSON.stringify(check.getReport());
  assert.ok(!serialized.includes('private-fixture-secret-do-not-record'));
  assert.equal(check.getReport().status,'failed');
  assert.equal(check.getReport().stage,'code_exchange');
});

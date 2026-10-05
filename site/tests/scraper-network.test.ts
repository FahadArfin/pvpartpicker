import test from 'node:test';
import assert from 'node:assert/strict';
// Transport exposes a pure address predicate for verification.
import {publicAddress} from '../scripts/scraper-network.mjs';
test('DNS transport rejects internal, mapped and special networks while allowing public addresses',()=>{
 for(const address of ['127.0.0.1','10.0.0.5','172.31.1.1','192.168.0.2','169.254.169.254','100.64.0.1','0.0.0.0','224.0.0.1','::1','::','fc00::1','fe80::1','::ffff:127.0.0.1','2001:db8::1','2002:7f00:1::1'])assert.equal(publicAddress(address),false,address);
 for(const address of ['8.8.8.8','1.1.1.1','2606:4700:4700::1111'])assert.equal(publicAddress(address),true,address);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const runner=fileURLToPath(new URL('../qa/corner-pace.mjs',import.meta.url));
const laps=JSON.parse(execFileSync(process.execPath,[runner],{encoding:'utf8'}));
// Frozen acceptance margins are deliberately below the observed improvement.
// Compare every complete route and keep the same physical slide threshold.
for(const lap of laps)test(lap.id+' maintains corner pace and clearance, traffic='+lap.traffic,()=>{
 const spark=lap.id==='spark';
 assert.equal(lap.turns.length,spark?28:29);
 assert.ok(lap.avg>70&&lap.time<(lap.traffic?89:77));
 assert.ok(lap.drifts>=lap.turns.length-2);
 assert.equal(lap.off,0);assert.equal(lap.bodyOff,0);assert.equal(lap.hits,0);
 assert.ok(lap.turns.every(t=>t.n>0&&t.peak<50))
});

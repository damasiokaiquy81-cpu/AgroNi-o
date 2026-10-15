import {test} from 'node:test';
import assert from 'node:assert/strict';
import {evaluateRain,eventKey,ruleSchema} from '../lib/rules';
const rule={id:'r1',name:'Chuva excessiva',city:'Sorriso',crop:'Soja',threshold:70,hours:48,guidance:'Orientação de teste',active:true};
test('chuva acumulada atinge limite inclusivo',()=>{assert.equal(evaluateRain(rule,[30,40]),true);assert.equal(evaluateRain(rule,[30,39]),false)});
test('regra inativa não dispara',()=>assert.equal(evaluateRain({...rule,active:false},[100]),false));
test('respeita a janela horária',()=>assert.equal(evaluateRain({...rule,hours:2},[10,10,100]),false));
test('chave de deduplicação estável e específica',()=>{assert.equal(eventKey('r1','Sorriso','2026-10-15'),eventKey('r1','Sorriso','2026-10-15'));assert.notEqual(eventKey('r1','Sorriso','2026-10-15'),eventKey('r2','Sorriso','2026-10-15'))});
test('limites inválidos são rejeitados',()=>{assert.equal(ruleSchema.safeParse({...rule,threshold:-1}).success,false);assert.equal(ruleSchema.safeParse({...rule,hours:400}).success,false)});

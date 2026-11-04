import test from 'node:test';
import assert from 'node:assert/strict';
import {cents,amountToDecimal,money,abbreviate,percentage,subtractAmounts} from '../src/amounts.js';
import {initial,total,validate,csv,synchronize} from '../src/core.js';
import {createLedgerStore} from '../src/store.js';
const row=(type,amount,id=type)=>({id,type,amount,category:type==='income'?'income-0':'expense-0',date:'2026-11-04',name:'大額測試',note:'',method:''});
test('large amounts parse exactly, including exponent input and hundredth boundaries',()=>{
 const value='999999999999999999999999999999.99';assert.equal(amountToDecimal(cents(value)),value);
 assert.equal(amountToDecimal(cents('1.234567890123456789e+30')),'1234567890123456789000000000000');
 assert.equal(cents('1e-2'),1);assert.equal(cents('100e-3'),10);
 for(const invalid of ['1e-3','1.001','1e1000','-2','Infinity','1e99999'])assert.throws(()=>cents(invalid));
 const maximum='9'.repeat(1000)+'.99';assert.equal(amountToDecimal(cents(maximum)),maximum);
});
test('large totals and tiny residual balances remain exact beyond Number precision',()=>{
 const value=cents('999999999999999999999999999999.99');const result=total([row('income',value),row('expense',cents('999999999999999999999999999999.98'))]);assert.equal(result.balance,1);
 assert.equal(subtractAmounts(0,value),'-99999999999999999999999999999999');
 assert.equal(total([row('income',value,'a'),row('income',value,'b')]).income,'199999999999999999999999999999998');
});
test('suffix display follows k m b t q with at most two decimals and promotion',()=>{
 const cases=[['999.99','$999.99'],['1000','$1k'],['12200','$12.2k'],['12345','$12.35k'],['1000000','$1m'],['1000000000','$1b'],['1000000000000','$1t'],['1000000000000000','$1q'],['999999','$1m'],['999999999999999','$1q'],['1e18','$1000q']];
 for(const [input,expected] of cases)assert.equal(money(cents(input)),expected,input);
 assert.equal(abbreviate('-123456789012345678900'),'-1234.57q');
 assert.equal(money('-123456789012345678900'),'-$1234.57q');
 assert.equal(money(cents('1e999')),'$'+'1'+'0'.repeat(984)+'q');
 assert.equal(percentage(cents('1e999'),cents('2e999')),50);
});
test('suffix input expands exactly and display rounding never changes stored values',()=>{
 for(const [input,plain] of [['12.2k','12200'],['1.25m','1250000'],['2b','2000000000'],['3t','3000000000000'],['4q','4000000000000000'],['1.234K','1234']])assert.equal(amountToDecimal(cents(input)),plain);
 const exact=cents('12345.67');assert.equal(money(exact),'$12.35k');assert.equal(amountToDecimal(exact),'12345.67');
});
test('backup and CSV keep the full amount, while unsafe numeric backups are rejected',()=>{
 const d=initial();d.version=2;d.records.push(row('income',cents('999999999999999999999999999999.99')));assert.deepEqual(validate(JSON.parse(JSON.stringify(d))),d);assert.ok(csv(d).includes('999999999999999999999999999999.99'));
 d.records[0].amount=1e30;assert.throws(()=>validate(d));
});
test('new large entries upgrade the backup schema without rounding old entries',()=>{
 let raw=JSON.stringify(initial());const store=createLedgerStore({getItem:()=>raw,setItem:(_,s)=>{raw=s;}});store.mutate(d=>d.records.push(row('income',cents('1e100'))));assert.equal(JSON.parse(raw).version,2);assert.equal(amountToDecimal(JSON.parse(raw).records[0].amount),'1'+'0'.repeat(100));
});
test('recurring huge amounts catch up exactly and stay idempotent',()=>{
 const d=initial();d.version=2;d.rules.push({...row('income',cents('1e100'),'rule'),day:1,start:'2026-01-01',end:'',status:'active',processedThrough:''});synchronize(d,'2026-02-01');assert.equal(d.records.length,2);assert.equal(total(d.records).income,'2'+'0'.repeat(102));assert.equal(synchronize(d,'2026-02-01'),0);validate(d);
});

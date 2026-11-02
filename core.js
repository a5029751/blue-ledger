export const TYPES=['expense','income'];
export const names={expense:['餐飲','交通','購物','生活用品','娛樂','醫療','教育','居住','水電瓦斯','通訊','保險','人情禮物','其他'],income:['薪資','獎金','兼職','接案','利息','禮金','津貼','租金','其他收入']};
export const uid=()=>crypto.randomUUID();
export function today(){return new Intl.DateTimeFormat('sv-SE',{timeZone:'Asia/Taipei',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());}
export function validDate(s){if(typeof s!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(s)||s<'1900-01-01'||s>'2200-12-31')return false;return new Date(s+'T00:00:00Z').toISOString().slice(0,10)===s;}
export function cents(s){if(!/^\d+(\.\d{1,2})?$/.test(String(s)))throw Error('金額請輸入正數，最多兩位小數。');const n=Math.round(Number(s)*100);if(!Number.isSafeInteger(n)||n<=0||n>99999999900)throw Error('金額須介於 0.01 至 999,999,999 元。');return n;}
export const money=n=>new Intl.NumberFormat('zh-TW',{style:'currency',currency:'TWD',minimumFractionDigits:n%100?2:0,maximumFractionDigits:2}).format(n/100);
export function initial(){return {version:1,records:[],rules:[],skipped:[],categories:TYPES.flatMap(type=>names[type].map((name,i)=>({id:type+'-'+i,name,type,archived:false})))};}
export function dueDate(month,day){const [y,m]=month.split('-').map(Number);return `${month}-${String(Math.min(day,new Date(Date.UTC(y,m,0)).getUTCDate())).padStart(2,'0')}`;}
export function shiftMonth(m,n){const [y,mo]=m.split('-').map(Number);const d=new Date(Date.UTC(y,mo-1+n,1));return d.toISOString().slice(0,7);}
export function occurrences(rule,from,to){let out=[];if(from>to)return out;for(let m=from.slice(0,7);m<=to.slice(0,7);m=shiftMonth(m,1)){const date=dueDate(m,rule.day);if(date>=from&&date<=to&&date>=rule.start&&(!rule.end||date<=rule.end))out.push(date);}return out;}
export function synchronize(data,now){const seen=new Set([...data.skipped,...data.records.map(r=>r.occurrence).filter(Boolean)]);let count=0;for(const rule of data.rules){if(rule.status!=='active')continue;const from=rule.processedThrough||rule.start;for(const date of occurrences(rule,from,now)){if(rule.processedThrough&&date<=rule.processedThrough)continue;const key=rule.id+'@'+date;if(!seen.has(key)){data.records.push({id:uid(),type:rule.type,amount:rule.amount,date,category:rule.category,name:rule.name,note:rule.note||'',method:rule.method||'',ruleId:rule.id,occurrence:key});seen.add(key);count++;}}if(!rule.processedThrough||rule.processedThrough<now)rule.processedThrough=now;}return count;}
export function removeRecord(data,id){const row=data.records.find(r=>r.id===id);if(row?.occurrence&&!data.skipped.includes(row.occurrence))data.skipped.push(row.occurrence);data.records=data.records.filter(r=>r.id!==id);}
export function total(rows){let income=0,expense=0;for(const r of rows){if(r.type==='income')income+=r.amount;else expense+=r.amount;}return {income,expense,balance:income-expense};}
export const monthRows=(data,m)=>data.records.filter(r=>r.date.startsWith(m));
export function upcoming(data,m,now){return data.rules.filter(r=>r.status==='active').flatMap(r=>occurrences(r,m+'-01',dueDate(m,31)).filter(d=>d>now).map(date=>({...r,date}))).sort((a,b)=>a.date.localeCompare(b.date));}
export function validate(data){
 const fail=()=>{throw Error('備份格式或內容不正確，原資料未變更。');};
 if(!data||data.version!==1||!['records','rules','categories','skipped'].every(k=>Array.isArray(data[k]))||data.records.length>100000||data.rules.length>2000||data.categories.length>1000)fail();
 const str=(x,max=200)=>typeof x==='string'&&x.length<=max;
 const ids=new Set();for(const c of data.categories){if(!c||!str(c.id)||!c.id||ids.has(c.id)||!str(c.name,40)||!c.name.trim()||!TYPES.includes(c.type)||typeof c.archived!=='boolean')fail();ids.add(c.id);}
 const category=(r)=>data.categories.some(c=>c.id===r.category&&c.type===r.type);
 const common=r=>r&&str(r.id)&&r.id&&TYPES.includes(r.type)&&Number.isSafeInteger(r.amount)&&r.amount>0&&r.amount<=99999999900&&category(r)&&str(r.name,80)&&str(r.note,500)&&str(r.method,40);
 const ruleIds=new Set();for(const r of data.rules){if(!common(r)||ruleIds.has(r.id)||!validDate(r.start)||(r.end&&(!validDate(r.end)||r.end<r.start))||!Number.isInteger(r.day)||r.day<1||r.day>31||!['active','paused','ended'].includes(r.status)||(r.processedThrough&&!validDate(r.processedThrough)))fail();ruleIds.add(r.id);}
 const recordIds=new Set(),occurrencesSeen=new Set();for(const r of data.records){if(!common(r)||recordIds.has(r.id)||!validDate(r.date))fail();recordIds.add(r.id);if(r.ruleId||r.occurrence){if(!ruleIds.has(r.ruleId)||!str(r.occurrence)||!r.occurrence.startsWith(r.ruleId+'@')||!validDate(r.occurrence.slice(r.ruleId.length+1))||occurrencesSeen.has(r.occurrence))fail();occurrencesSeen.add(r.occurrence);}}
 if(data.skipped.some(k=>!str(k)||!k.includes('@')||!validDate(k.slice(k.lastIndexOf('@')+1)))||new Set(data.skipped).size!==data.skipped.length||data.skipped.some(k=>occurrencesSeen.has(k)))fail();
 return data;
}
export function csv(data){const escape=s=>'"'+String(s??'').replace(/^[=+@\-\t\r]/,"'$&").replaceAll('"','""')+'"';return '\ufeff'+[['日期','類型','分類','項目','金額 TWD','付款方式','備註','固定收支'],...data.records.slice().sort((a,b)=>a.date.localeCompare(b.date)).map(r=>[r.date,r.type==='income'?'收入':'支出',data.categories.find(c=>c.id===r.category)?.name||'',r.name,(r.amount/100).toFixed(2),r.method,r.note,r.ruleId?'是':'否'])].map(row=>row.map(escape).join(',')).join('\r\n');}

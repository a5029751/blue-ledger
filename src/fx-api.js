import {CURRENCIES,validRate} from './fx.js';
const cache=new Map(),pending=new Map();
export const RATE_CREDIT='https://exchangerate.dev';
export function rateTime(value){return value?new Intl.DateTimeFormat('zh-TW',{timeZone:'Asia/Taipei',dateStyle:'short',timeStyle:'medium'}).format(new Date(value)):'';}
export async function fetchQuote(currency,{force=false,request=fetch,now=Date.now()}={}){
 if(currency==='TWD'||!Object.hasOwn(CURRENCIES,currency))throw Error('請選擇支援的外幣。');
 const cached=cache.get(currency);if(!force&&cached&&now-cached.fetchedAt<60000)return cached;
 if(pending.has(currency))return pending.get(currency);
 const job=(async()=>{const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{
 const r=await request(`https://api.exchangerate.dev/v1/rate/${currency.toLowerCase()}-twd`,{signal:controller.signal,cache:'no-store',credentials:'omit',referrerPolicy:'no-referrer'});
 if(!r.ok)throw Error(r.status===429?'匯率 API 請求過於頻繁，請稍後重試或手動填寫。':'匯率 API 暫時無法使用，請重試或手動填寫。');
 const q=await r.json(),rate=typeof q.rate==='number'?String(q.rate):q.rate;
 if(q.result!=='success'||q.base!==currency||q.quote!=='TWD'||!validRate(rate)||!['live','ecb_daily','market_daily'].includes(q.source)||!['open','weekend','interbank_closed'].includes(q.market_session)||typeof q.stale!=='boolean'||!Number.isFinite(Date.parse(q.data_updated_at))||Date.parse(q.data_updated_at)>now+300000)throw Error('匯率 API 回傳資料不完整，請重試或手動填寫。');
 const result={rate,quotedAt:q.data_updated_at,source:'exchangerate.dev',kind:'reference',stale:q.stale,marketSession:q.market_session,feedSource:q.source,delaySeconds:900,fetchedAt:now};cache.set(currency,result);return result;
 }catch(e){if(e.name==='AbortError')throw Error('匯率請求逾時，請重試或手動填寫。');throw e;}finally{clearTimeout(timer);}})();pending.set(currency,job);try{return await job;}finally{pending.delete(currency);}
}

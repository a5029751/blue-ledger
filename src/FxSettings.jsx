import {useRef,useState,useEffect} from 'react';
import {CURRENCIES,convertToTwd,convertFromTwd} from './fx.js';
import {fetchQuote,rateTime,RATE_CREDIT} from './fx-api.js';
import {cents,money} from './core.js';
const FLAGS={USD:'🇺🇸',HKD:'🇭🇰',GBP:'🇬🇧',AUD:'🇦🇺',CAD:'🇨🇦',SGD:'🇸🇬',CHF:'🇨🇭',JPY:'🇯🇵',ZAR:'🇿🇦',SEK:'🇸🇪',NZD:'🇳🇿',THB:'🇹🇭',PHP:'🇵🇭',IDR:'🇮🇩',EUR:'🇪🇺',KRW:'🇰🇷',VND:'🇻🇳',MYR:'🇲🇾',CNY:'🇨🇳'};
export default function FxSettings(){
 const [currency,setCurrency]=useState('USD'),[amount,setAmount]=useState(''),[rate,setRate]=useState(''),[reverse,setReverse]=useState(false),[meta,setMeta]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState('');const seq=useRef(0);
 const target=reverse?currency:'TWD';let result='';try{const value=(reverse?convertFromTwd:convertToTwd)(cents(amount),rate);result=(target==='TWD'?'NT$ ':target+' ')+money(value).replace('$','');}catch{}
 async function load(c,force=false){const id=++seq.current;setBusy(true);setError('');try{const q=await fetchQuote(c,{force});if(id!==seq.current)return;setRate(q.rate);setMeta(q);}catch(e){if(id===seq.current)setError(e.message||'無法連線，請手動填寫匯率。');}finally{if(id===seq.current)setBusy(false);}}
 useEffect(()=>{load('USD');return()=>{seq.current++;};},[]);
 function changeCurrency(c){setCurrency(c);setRate('');setMeta(null);load(c);}
 const currencySelect=(label,extra='')=><select className={`converter-currency ${extra}`} aria-label={label} value={currency} onChange={e=>changeCurrency(e.target.value)}>{Object.entries(CURRENCIES).filter(([c])=>c!=='TWD').map(([c,n])=><option key={c} value={c}>{FLAGS[c]} {c} · {n}</option>)}</select>;
 return <section className="card settings-card settings-about currency-converter"><h2>幣別換算</h2><p className="converter-subtitle">{reverse?'快速試算新臺幣的外幣價值':'快速試算外幣的新臺幣價值'}</p>
 <div className="converter-entry"><label htmlFor="converter-amount">{reverse?'新臺幣金額':'外幣金額'}</label><div className="converter-input-row"><input id="converter-amount" inputMode="decimal" aria-label={reverse?'新臺幣金額':'外幣金額'} value={amount} onChange={e=>setAmount(e.target.value)} placeholder="0" maxLength={2100}/>{reverse?<span className="converter-currency converter-twd">🇹🇼 TWD</span>:currencySelect('外幣幣別')}</div></div>
 <div className="converter-result"><div className="converter-result-heading"><h3>換算結果 · {target}</h3><button type="button" className="converter-swap" onClick={()=>setReverse(v=>!v)}>互換幣別</button></div>{reverse&&currencySelect('換算目標幣別','converter-target')}<output className="converter-value" aria-live="polite">{result||'—'}</output><p className="converter-equation">1 {currency} = {rate||'—'} TWD</p></div>
 <div className="converter-custom"><div><label htmlFor="converter-rate">自訂換算匯率</label><p>每 1 單位 {currency} 的新臺幣價值</p></div><input id="converter-rate" aria-label="自訂換算匯率" inputMode="decimal" value={rate} onChange={e=>{seq.current++;setBusy(false);setRate(e.target.value);setMeta(null);setError('');}} placeholder="輸入匯率" maxLength={19}/></div>
 <div className="converter-api"><button disabled={busy} onClick={()=>load(currency,true)}>{busy?'正在取得匯率…':'更新匯率'}</button><p className="settings-note" role="status">{error|| (meta?`API 報價：報價延遲約 15 分鐘，${rateTime(meta.quotedAt)}（臺灣時間）${meta.stale?' · API 標示資料過期':''}${meta.marketSession!=='open'?' · 市場休市':''}`:busy?'正在取得報價…':'手動匯率')}</p><a className="converter-credit" href={RATE_CREDIT} target="_blank" rel="noreferrer">Rates by exchangerate.dev</a></div></section>;
}

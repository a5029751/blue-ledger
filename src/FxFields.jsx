import {useState} from 'react';
import {useApp} from './context.jsx';
import {CURRENCIES,RATE_KINDS} from './fx.js';

export default function FxFields({old,type,onCurrency,onRate}){
 const {data}=useApp();const [currency,setCurrency]=useState(old?.fx?.currency||'TWD'),[kind,setKind]=useState(old?.fx?.kind||(type==='income'?'spotBuy':'spotSell')),[rate,setRate]=useState(old?.fx?.rate||''),[source,setSource]=useState(old?.fx?.source||'manual'),[quotedAt,setQuotedAt]=useState(old?.fx?.quotedAt||'');
 function useQuote(c,k){const q=data.rates?.quotes[c]?.[k];setRate(q||'');onRate(q||'');setSource(q?'bot-import':'manual');setQuotedAt(q?data.rates.asOf:'');}
 return <><label className="full">幣別<select name="currency" value={currency} onChange={e=>{const c=e.target.value;setCurrency(c);onCurrency(c);useQuote(c,kind);}}>{Object.entries(CURRENCIES).map(([c,n])=><option key={c} value={c}>{n}（{c}）</option>)}</select></label>{currency!=='TWD'&&<><label>匯率類型<select name="rateKind" value={kind} onChange={e=>{setKind(e.target.value);useQuote(currency,e.target.value);}}>{Object.entries(RATE_KINDS).map(([k,n])=><option key={k} value={k}>{n}</option>)}</select></label><label>1 {currency} = 台幣<input name="exchangeRate" inputMode="decimal" required value={rate} onChange={e=>{setRate(e.target.value);onRate(e.target.value);setSource('manual');setQuotedAt('');}} placeholder="輸入實際匯率" maxLength={19}/></label><input type="hidden" name="rateSource" value={source}/><input type="hidden" name="quotedAt" value={quotedAt}/><p className="settings-note full">{source==='bot-import'?`台銀匯入報價：${quotedAt.replace('T',' ')}（臺灣時間），不是即時連線。`:'手動匯率：請核對實際成交價；可到第四頁開啟台銀牌告或匯入報價。'}<br/>本行賣出：你用台幣買外幣；本行買入：你將外幣換回台幣。{old?.start!==undefined?' 固定規則以此匯率持續換算，修改前不會自動重估。':''}</p></>}</>;
}

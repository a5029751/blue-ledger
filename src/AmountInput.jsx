import {useState} from 'react';
import {amountToDecimal,cents,needsAbbreviation,abbreviate} from './amounts.js';
export default function AmountInput({amount}){
 const [raw,setRaw]=useState(amount===undefined?'':amountToDecimal(amount)),[focused,setFocused]=useState(false);
 let short='';try{const parsed=cents(raw);if(needsAbbreviation(parsed))short=abbreviate(parsed);}catch{}
 return <><input className="money-input" name="amount" inputMode="decimal" type="text" maxLength={2100} placeholder="0" required value={focused||!short?raw:short} onChange={e=>setRaw(e.target.value)} onFocus={()=>setFocused(true)} onBlur={()=>setFocused(false)} aria-describedby={short?'amount-precision-note':undefined} autoFocus/><input name="amountExact" type="hidden" value={raw}/>{short&&<small className="amount-precision-note" id="amount-precision-note" aria-live="polite">{short}；精確金額，點欄位可查看及編輯。</small>}</>;
}

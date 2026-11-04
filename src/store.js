import {initial,validate,synchronize,today} from './core.js';
import {demoData} from './demo.js';
export const STORAGE_KEY='blue-ledger-v1';
export function createLedgerStore(storage){
 let raw=null,error='',data=initial(),realData=null,demo=false;
 try{raw=storage.getItem(STORAGE_KEY);if(raw)data=validate(JSON.parse(raw));}catch{error='無法讀取原資料，已停止寫入以保護內容。請先下載原始資料，再從有效備份還原。';}
 let snapshot={data,error,raw,demo};const listeners=new Set();
 const emit=()=>{snapshot={data,error,raw,demo};listeners.forEach(fn=>fn());};
 function save(next){
  validate(next);
  if(!demo){if(error)throw Error(error);if(storage.getItem(STORAGE_KEY)!==raw)throw Error('其他分頁已更新資料，請重新整理後再儲存。');const nextRaw=JSON.stringify(next);storage.setItem(STORAGE_KEY,nextRaw);raw=nextRaw;}
  data=next;emit();
 }
 function mutate(fn){const next=structuredClone(data);fn(next);save(next);}
 return {
  getSnapshot:()=>snapshot,subscribe:fn=>{listeners.add(fn);return()=>listeners.delete(fn);},mutate,
  sync(){if(error)return 0;const next=structuredClone(data),n=synchronize(next,today());if(JSON.stringify(next)!==JSON.stringify(data))save(next);return n;},
  toggleDemo(){if(!demo){realData=data;data=demoData();demo=true;}else{data=realData;realData=null;demo=false;}emit();},
  restore(next){validate(next);if(!demo){const nextRaw=JSON.stringify(next);storage.setItem(STORAGE_KEY,nextRaw);raw=nextRaw;error='';}data=structuredClone(next);emit();},
  receive(value){try{const next=value?validate(JSON.parse(value)):initial();if(demo)realData=next;else data=next;raw=value;error='';}catch{error='其他分頁的帳本資料無法讀取，請從有效備份還原。';}emit();}
 };
}

import {useCallback,useEffect,useRef,useState,useSyncExternalStore} from 'react';
import {AppContext} from './context.jsx';
import {createLedgerStore,STORAGE_KEY} from './store.js';
import {today} from './core.js';
import {RELEASE,checkRelease,prepareRelease} from './update.js';
import Overview from './Overview.jsx';
import Ledger from './Ledger.jsx';
import Annual from './Annual.jsx';
import Settings from './Settings.jsx';
import Modal from './Modal.jsx';
const tabs=[['overview','◫','當月總覽'],['ledger','＋','收支記帳'],['annual','▤','年度結餘'],['settings','⚙','資料與設定']];
export default function App(){
 const [store]=useState(()=>createLedgerStore(localStorage)),snapshot=useSyncExternalStore(store.subscribe,store.getSnapshot);
 const [page,setPageState]=useState(location.hash==='#settings'||new URL(location.href).searchParams.has('updated')?'settings':'overview');
 const [month,setMonthState]=useState(today().slice(0,7)),[overviewOpen,setOverviewOpen]=useState({recent:false,upcoming:false}),[openYears,setOpenYears]=useState([today().slice(0,4)]),[navOpen,setNavOpen]=useState({expense:true,income:false});
 const [filters,setFilters]=useState({type:'',category:'',query:''}),[ledgerTab,setLedgerTab]=useState('records'),[limit,setLimit]=useState(50),[modal,setModal]=useState(null),[toast,setToast]=useState('');
 const [updateBusy,setUpdateBusy]=useState(false),[updateStatus,setUpdateStatus]=useState(()=>{const target=new URL(location.href).searchParams.get('updated');return target?target===RELEASE.version?`已完成更新，目前版本 v${RELEASE.version}。`:'新版仍在發布中，請稍後再按一次「檢查並更新」。':'按下按鈕後會檢查版本；有新版時自動更新並重新開啟。';});
 const dirty=useRef(false),mainRef=useRef(null),toastTimer=useRef(null),modalCounter=useRef(0),busyRef=useRef(false);
 const notify=useCallback(text=>{setToast(text);clearTimeout(toastTimer.current);toastTimer.current=setTimeout(()=>setToast(''),4500);},[]);
 const sync=useCallback(()=>{try{const n=store.sync();if(n)notify(`已補建 ${n} 筆到期固定收支，請核對實際入扣款。`);}catch(e){notify(e.message);}},[store,notify]);
 useEffect(()=>{sync();const visible=()=>{if(document.visibilityState==='visible'&&!dirty.current)sync();};const storage=e=>{if(e.key!==STORAGE_KEY)return;if(dirty.current){notify('另一個分頁已更新帳本。請先取消表單再重新整理，避免覆蓋。');return;}store.receive(e.newValue);notify('已同步其他分頁的更新。');};const unload=e=>{if(dirty.current){e.preventDefault();e.returnValue='';}};document.addEventListener('visibilitychange',visible);window.addEventListener('storage',storage);window.addEventListener('beforeunload',unload);const timer=setInterval(visible,60000);if('serviceWorker' in navigator)navigator.serviceWorker.register('./sw.js',{updateViaCache:'none'}).catch(()=>{});const clean=new URL(location.href);if(clean.searchParams.has('updated')){clean.searchParams.delete('updated');clean.searchParams.delete('check');history.replaceState(null,'',clean.href);}return()=>{clearInterval(timer);clearTimeout(toastTimer.current);document.removeEventListener('visibilitychange',visible);window.removeEventListener('storage',storage);window.removeEventListener('beforeunload',unload);};},[store,sync,notify]);
 function setPage(p){if(busyRef.current){notify('正在檢查更新，請稍候。');return;}setPageState(p);mainRef.current?.scrollTo({top:0,behavior:'instant'});}
 function setMonth(m){setMonthState(m);setLimit(50);}
 function openModal(spec){dirty.current=false;setModal({...spec,key:++modalCounter.current});}
 function closeModal(force=false){if(!force&&dirty.current&&!confirm('尚未儲存，確定放棄這次修改？'))return;dirty.current=false;setModal(null);}
 function openEntry(type,rule=false,id=''){openModal({kind:'entry',type,rule,id});}
 function mutate(fn){try{store.mutate(fn);return true;}catch(e){notify(e.message);return false;}}
 function showRecords(){setFilters({type:'',category:'',query:''});setLedgerTab('records');setLimit(50);setPage('ledger');}
 function showRules(){setLedgerTab('rules');setPage('ledger');}
 async function updateApp(){if(busyRef.current)return;if(snapshot.demo){setUpdateStatus('請先結束示範模式再更新，避免遺失尚未匯出的示範內容。');return;}busyRef.current=true;setUpdateBusy(true);setUpdateStatus('正在連線檢查最新版本…');try{const latest=await checkRelease(location.href);if(!latest.available){setUpdateStatus(`目前已是最新版本 v${RELEASE.version}。`);return;}setUpdateStatus(`找到 v${latest.version}，正在準備更新…`);const target=await prepareRelease(location.href,latest);if('serviceWorker' in navigator){const r=await navigator.serviceWorker.getRegistration();if(r)await Promise.race([r.update(),new Promise((_,reject)=>setTimeout(()=>reject(Error('更新連線逾時，請稍後再試。')),15000))]);}if(dirty.current||modal)throw Error('請先儲存或關閉表單，再按一次更新。');target.hash='settings';target.searchParams.set('updated',latest.version);location.replace(target.href);}catch(e){setUpdateStatus(e.name==='AbortError'?'連線逾時，請確認網路後再試。':e instanceof TypeError?'無法連線，請確認網路後再試。':e.message);}finally{busyRef.current=false;setUpdateBusy(false);}}
 const value={...snapshot,store,page,setPage,month,setMonth,overviewOpen,setOverviewOpen,openYears,setOpenYears,navOpen,setNavOpen,filters,setFilters,ledgerTab,setLedgerTab,limit,setLimit,modal,dirty,openModal,closeModal,openEntry,notify,mutate,showRecords,showRules,updateBusy,updateStatus,updateApp,categoryName:id=>snapshot.data.categories.find(c=>c.id===id)?.name||'未分類'};
 return <AppContext.Provider value={value}><div className="ambient" aria-hidden="true"/><header className="topbar"><a href="#overview" className="brand" aria-label="Pocketa首頁" onClick={e=>{e.preventDefault();setPage('overview');}}><span className="brand-icon">≋</span><span>Pocketa<small>POCKETA</small></span></a><div className="top-actions"><span className="local-label"><i/>資料保存在此裝置</span></div></header><main id="app" ref={mainRef}>{snapshot.demo&&<div className="demo-banner"><span>示範模式 · 以下為範例資料，不會寫入你的帳本。</span><button onClick={()=>store.toggleDemo()}>回到我的帳本</button></div>}{snapshot.error&&<div className="storage-warning">{snapshot.error} <button onClick={()=>setPage('settings')}>資料救援與還原</button></div>}{page==='overview'?<Overview/>:page==='ledger'?<Ledger/>:page==='annual'?<Annual/>:<Settings/>}</main><nav className="bottom-bar" aria-label="主要分頁">{tabs.map(([id,icon,label])=><button key={id} data-page={id} onClick={()=>setPage(id)} aria-current={page===id?'page':undefined}><span aria-hidden="true">{icon}</span>{label}</button>)}</nav><div id="toast" className={toast?'visible':''} role="status" aria-live="polite">{toast}</div><Modal/></AppContext.Provider>;
}

export const RELEASE={version:'1.1.0',build:5,date:'2026-11-03'};
export async function checkRelease(base,request=fetch){
 const url=new URL('./version.json',base);url.searchParams.set('check',Date.now());
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),15000);
 try{
  const response=await request(url,{cache:'no-store',signal:controller.signal});
  if(!response.ok)throw Error('目前無法取得版本資訊，請稍後再試。');
  const latest=await response.json();
  if(!latest||!Number.isSafeInteger(latest.build)||latest.build<1||!/^\d+\.\d+\.\d+$/.test(latest.version))throw Error('版本資訊不完整，請稍後再試。');
  return {...latest,available:latest.build>RELEASE.build};
 }finally{clearTimeout(timer);}
}
export async function prepareRelease(base,latest,request=fetch){
 const url=new URL('./index.html',base);url.searchParams.set('release',latest.build);url.searchParams.set('check',Date.now());
 const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),20000);
 try{
  const response=await request(url,{cache:'no-store',signal:controller.signal});
  if(!response.ok)throw Error('新版下載失敗，請稍後再試。');
  const html=await response.text();
  if(!html.includes(`name="pocketa-build" content="${latest.build}"`))throw Error('新版正在發布中，請稍後再試。');
  return url;
 }finally{clearTimeout(timer);}
}

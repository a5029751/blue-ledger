import {integer,compact,validAmount} from './amounts.js';
export const CURRENCIES={TWD:'新臺幣',USD:'美元',HKD:'港幣',GBP:'英鎊',AUD:'澳幣',CAD:'加拿大幣',SGD:'新加坡幣',CHF:'瑞士法郎',JPY:'日圓',ZAR:'南非幣',SEK:'瑞典幣',NZD:'紐元',THB:'泰幣',PHP:'菲律賓披索',IDR:'印尼盾',EUR:'歐元',KRW:'韓元',VND:'越南盾',MYR:'馬來幣',CNY:'人民幣'};
export const RATE_KINDS={spotSell:'即期・本行賣出',spotBuy:'即期・本行買入',cashSell:'現金・本行賣出',cashBuy:'現金・本行買入'};
export function validRate(rate){return typeof rate==='string'&&/^\d{1,8}(?:\.\d{1,10})?$/.test(rate)&&Number(rate)>0;}
export function convertToTwd(amount,rate){if(!validAmount(amount)||!validRate(rate))throw Error('請輸入大於零的匯率，最多十位小數。');const [w,f='']=rate.split('.'),divisor=10n**BigInt(f.length),n=(integer(amount)*BigInt(w+f)+divisor/2n)/divisor;if(n<=0n)throw Error('換算後金額小於新臺幣 0.01 元，請調整金額。');if(n.toString().length>1002)throw Error('換算後金額超出支援範圍。');return compact(n);}
export function validFx(fx,amount){return fx&&fx.currency!=='TWD'&&Object.hasOwn(CURRENCIES,fx.currency)&&validAmount(fx.amount)&&validRate(fx.rate)&&Object.hasOwn(RATE_KINDS,fx.kind)&&['manual','bot-import'].includes(fx.source)&&typeof fx.quotedAt==='string'&&fx.quotedAt.length<=40&&convertToTwd(fx.amount,fx.rate).toString()===amount.toString();}
// Official CSV has one buy row and one sell row per currency; cash and spot are columns 3/4.
export function parseBotCsv(text,asOf){
 if(!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(asOf)||!Number.isFinite(Date.parse(asOf+'+08:00')))throw Error('請填寫台銀檔案的掛牌時間。');
 const quotes={};
 for(const line of text.replace(/^\uFEFF/,'').split(/\r?\n/)){
 const cells=line.split(',').map(s=>s.trim().replace(/^"|"$/g,''));const code=cells[0]?.match(/\b[A-Z]{3}\b/)?.[0];if(!code||code==='TWD'||!CURRENCIES[code])continue;
 const side=/買入|Buying|Buy/i.test(cells[1])?'Buy':/賣出|Selling|Sell/i.test(cells[1])?'Sell':null;if(!side)continue;
 quotes[code]||={};for(const [name,i] of [['cash',2],['spot',3]])if(validRate(cells[i]))quotes[code][name+side]=cells[i];
 }
 if(Object.keys(quotes).length<1||!Object.values(quotes).some(q=>Object.keys(q).length))throw Error('無法識別台銀 CSV，請下載官方「Excel (CSV) 檔」，勿匯入網頁或帳本 CSV。');
 return {asOf,importedAt:new Date().toISOString(),quotes};
}
export function validRates(r){return r&&typeof r.asOf==='string'&&/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(r.asOf)&&Number.isFinite(Date.parse(r.asOf+'+08:00'))&&typeof r.importedAt==='string'&&r.importedAt.length<=40&&r.quotes&&typeof r.quotes==='object'&&!Array.isArray(r.quotes)&&Object.keys(r.quotes).length>0&&Object.entries(r.quotes).every(([c,q])=>c!=='TWD'&&Object.hasOwn(CURRENCIES,c)&&q&&typeof q==='object'&&Object.entries(q).every(([k,v])=>Object.hasOwn(RATE_KINDS,k)&&validRate(v)));}

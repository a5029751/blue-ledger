// Amounts are integer cents. Legacy safe numbers remain valid; larger values use strings.
export const MAX_AMOUNT_DIGITS=1000;
const MAX_SAFE=BigInt(Number.MAX_SAFE_INTEGER);
export const integer=n=>typeof n==='bigint'?n:BigInt(n);
export const compact=n=>n<=MAX_SAFE&&n>=-MAX_SAFE?Number(n):n.toString();
export function cents(value){
 let text=String(value).trim();
 text=text.replace(/×10\^(\d{1,5})$/,'e+$1');
 const suffix=/(qa|qi|sx|sp|oc|no|dc|[kmbtq])$/i.exec(text);
 if(suffix)text=text.slice(0,-suffix[1].length)+'e+'+({k:3,m:6,b:9,t:12,q:15,qa:15,qi:18,sx:21,sp:24,oc:27,no:30,dc:33}[suffix[1].toLowerCase()]);
 if(text.length>2100)throw Error(`金額最多支援 ${MAX_AMOUNT_DIGITS} 位整數。`);
 const m=/^(\d+)(?:\.(\d*))?(?:[eE]([+-]?\d{1,5}))?$/.exec(text);
 if(!m)throw Error('請輸入正數，最多兩位小數；可使用 K、M、B、T、Qa、Qi 等縮寫。');
 const exponent=Number(m[3]||0),fraction=m[2]||'';
 let digits=(m[1]+fraction).replace(/^0+/,'')||'0';
 const shift=exponent-fraction.length+2;
 if(shift>MAX_AMOUNT_DIGITS+2)throw Error(`金額最多支援 ${MAX_AMOUNT_DIGITS} 位整數。`);
 if(shift>=0)digits+='0'.repeat(shift);
 else{const remove=-shift;if(remove>=digits.length||!new RegExp(`0{${remove}}$`).test(digits))throw Error('金額須大於零，且最多兩位小數。');digits=digits.slice(0,-remove);}
 digits=digits.replace(/^0+/,'')||'0';
 if(digits==='0')throw Error('金額須大於零。');
 if(digits.length>MAX_AMOUNT_DIGITS+2)throw Error(`金額最多支援 ${MAX_AMOUNT_DIGITS} 位整數。`);
 return compact(BigInt(digits));
}
export function validAmount(n){return typeof n==='number'?Number.isSafeInteger(n)&&n>0:typeof n==='string'&&/^[1-9]\d*$/.test(n)&&n.length<=MAX_AMOUNT_DIGITS+2;}
export const addAmounts=(a,b)=>compact(integer(a)+integer(b));
export const subtractAmounts=(a,b)=>compact(integer(a)-integer(b));
export const absAmount=a=>compact(integer(a)<0n?-integer(a):integer(a));
export const compareAmounts=(a,b)=>integer(a)<integer(b)?-1:integer(a)>integer(b)?1:0;
export const sumAmounts=rows=>compact(rows.reduce((n,r)=>n+integer(r.amount),0n));
export function percentage(a,b){const denominator=integer(b);return denominator>0n?Number(integer(a)*10000n/denominator)/100:0;}
export function amountToDecimal(value,fixed=false){const n=integer(value),negative=n<0n,s=(negative?-n:n).toString().padStart(3,'0'),fraction=s.slice(-2),whole=s.slice(0,-2);return `${negative?'-':''}${whole}${fixed?'.'+fraction:fraction==='00'?'':'.'+fraction.replace(/0$/,'')}`;}
// K/M/B/T follow English compact notation. Qa onward are documented short-scale aliases.
const UNITS=[['K',3],['M',6],['B',9],['T',12],['Qa',15],['Qi',18],['Sx',21],['Sp',24],['Oc',27],['No',30],['Dc',33]].map(([symbol,power])=>[symbol,10n**BigInt(power+2)]);
export const needsAbbreviation=value=>integer(absAmount(value))>=UNITS[0][1];
export function abbreviate(value){
 const signed=integer(value),n=signed<0n?-signed:signed;
 if(n<UNITS[0][1])return amountToDecimal(value);
 let index=0;
 while(index<UNITS.length-1&&n>=UNITS[index+1][1])index++;
 let [symbol,divisor]=UNITS[index];
 // Beyond named aliases, use engineering notation instead of invented suffixes.
 if(n>=divisor*1000n){const power=Math.floor((n.toString().length-3)/3)*3;symbol=`×10^${power}`;divisor=10n**BigInt(power+2);}
 const rounded=()=> (n*100n+divisor/2n)/divisor;
 let hundredths=rounded();
 if(hundredths>=100000n){
  divisor*=1000n;
  symbol=index<UNITS.length-1?UNITS[++index][0]:`×10^${divisor.toString().length-3}`;
  hundredths=rounded();
 }
 const fraction=(hundredths%100n).toString().padStart(2,'0').replace(/0+$/,'');
 return `${signed<0n?'-':''}${hundredths/100n}${fraction?'.'+fraction:''}${symbol}`;
}
export function money(value){
 if(needsAbbreviation(value)){const short=abbreviate(value);return short.startsWith('-')?'-$'+short.slice(1):'$'+short;}
 const exact=amountToDecimal(value),negative=exact.startsWith('-'),[whole,fraction]=(negative?exact.slice(1):exact).split('.');
 return `${negative?'-':''}$${whole}${fraction?'.'+fraction.padEnd(2,'0'):''}`;
}

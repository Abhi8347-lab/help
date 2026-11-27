const $=s=>document.querySelector(s);
const OFF={paypal:['paypal.com'],google:['google.com','google.co.in'],amazon:['amazon.com','amazon.in','amzn.in','amzn.to','a.co'],microsoft:['microsoft.com','live.com','office.com'],apple:['apple.com','icloud.com'],facebook:['facebook.com','fb.com'],instagram:['instagram.com'],netflix:['netflix.com'],sbi:['sbi.co.in','onlinesbi.sbi'],hdfc:['hdfcbank.com'],icici:['icicibank.com'],axis:['axisbank.com'],paytm:['paytm.com'],phonepe:['phonepe.com'],flipkart:['flipkart.com'],whatsapp:['whatsapp.com'],irctc:['irctc.co.in'],incometax:['incometax.gov.in'],uidai:['uidai.gov.in'],dhl:['dhl.com'],fedex:['fedex.com']};
const SHORT=['bit.ly','tinyurl.com','t.co','goo.gl','is.gd','cutt.ly','rb.gy','ow.ly','shorturl.at','tiny.cc'];
const BADTLD=['zip','xyz','top','click','link','work','support','country','gq','tk','ml','cf','ga','icu','buzz','rest','monster','cam','cyou','sbs'];
const KW=['login','signin','verify','secure','update','account','confirm','wallet','kyc','otp','bonus','claim','free','prize','password','suspend','unlock','refund'];
const FREE=['gmail.com','yahoo.com','outlook.com','hotmail.com','proton.me','rediffmail.com','icloud.com'];
const norm=s=>s.replace(/0/g,'o').replace(/1/g,'l').replace(/3/g,'e').replace(/5/g,'s').replace(/rn/g,'m').replace(/vv/g,'w');
const esc=s=>s.replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
function lev(a,b){const d=[...Array(a.length+1)].map((_,i)=>[i]);for(let j=1;j<=b.length;j++)d[0][j]=j;for(let i=1;i<=a.length;i++)for(let j=1;j<=b.length;j++)d[i][j]=Math.min(d[i-1][j]+1,d[i][j-1]+1,d[i-1][j-1]+(a[i-1]==b[j-1]?0:1));return d[a.length][b.length]}
function root(h){const p=h.split('.');if(p.length>2&&p[p.length-1].length==2&&['co','com','gov','org','net','ac'].includes(p[p.length-2]))return p.slice(-3).join('.');return p.slice(-2).join('.')}
const GLOBAL=['amazon','google','microsoft','apple','netflix','paypal','facebook','instagram','whatsapp','dhl','fedex'];
const CC=['in','uk','de','fr','it','es','ca','jp','au','nl','sg','ae','sa','mx','br','tr','se','pl','eg'];
function isOff(h,b){
 if(OFF[b].some(d=>h===d||h.endsWith('.'+d)))return true;
 if(!GLOBAL.includes(b))return false;
 const r=root(h).split('.'),t=r.slice(1);
 return r[0]===b&&(t.join('.')==='com'||(t.length==2&&['co','com'].includes(t[0])&&CC.includes(t[1]))||(t.length==1&&CC.includes(t[0])))}
function brand(host){
 for(const b in OFF)if(isOff(host,b))return{ok:b};
 const label=root(host).split('.')[0],toks=label.split('-').map(norm),parts=norm(host).split(/[.-]/);
 for(const b in OFF){
  const hit=b.length<=4?parts.includes(b):norm(host).includes(b);
  if(hit)return{w:40,title:'Pretends to be '+b[0].toUpperCase()+b.slice(1),detail:'The name appears in this address, but the real owner of the domain is '+root(host)+'. Genuine '+b+' sites end in '+OFF[b][0]+'.'};
  if(b.length>=5&&toks.some(t=>lev(t,b)<=1))return{w:40,title:'Misspelt copy of '+b[0].toUpperCase()+b.slice(1),detail:'“'+label+'” is one character away from the real brand name, a classic typo-squat.'};
 }return null}
function analyzeUrl(raw){
 let s=raw.trim().replace(/[)\].,;!]+$/,''),noS=!/^[a-z][a-z0-9+.-]*:\/\//i.test(s);if(noS)s='http://'+s;
 let u;try{u=new URL(s)}catch(e){return null}
 const host=u.hostname.toLowerCase(),f=[],add=(w,title,detail)=>f.push({w,title,detail});
 if(!noS&&u.protocol==='http:')add(15,'Connection is not encrypted','The link starts with http, so anything typed on the page can be read in transit.');
 if(/^\d{1,3}(\.\d{1,3}){3}$/.test(host))add(35,'Raw IP address instead of a name','Real companies use domain names. Scammers often hide behind bare IP addresses.');
 if(u.username)add(30,'Text before “@” hides the real destination','Browsers ignore everything before the @ sign, so the part after it is where you actually land.');
 if(host.includes('xn--'))add(30,'Look-alike (punycode) characters','The address uses foreign characters that imitate letters, such as a Cyrillic “а” posing as a Latin “a”.');
 const b=brand(host);if(b&&b.w)add(b.w,b.title,b.detail);
 const trusted=!!(b&&b.ok&&!u.username&&!host.includes('xn--')&&(noS||u.protocol==='https:'));
 const extra=host.split('.').length-root(host).split('.').length;if(extra>=3)add(15,'Too many subdomains','Long chains like a.b.c.example.com push the real domain out of sight.');
 if((host.match(/-/g)||[]).length>=2)add(12,'Several hyphens in the domain','Strings like “secure-login-update” are typical of throwaway scam domains.');
 if(SHORT.includes(host))add(20,'Link shortener hides the destination','Expand the link before opening it, or ask the sender for the full address.');
 const tld=host.split('.').pop();if(BADTLD.includes(tld))add(18,'Risky domain ending (.'+tld+')','Cheap endings like .'+tld+' are heavily used for short-lived scam sites.');
 const full=(host+u.pathname+u.search).toLowerCase(),kws=KW.filter(k=>full.includes(k));if(kws.length&&!trusted)add(Math.min(25,8*kws.length),'Pressure words in the address','Found: '+kws.join(', ')+'. Scam links lean on words that push you to log in or verify.');
 if(s.length>90&&!trusted)add(8,'Unusually long link','Very long addresses are often used to bury the suspicious part.');
 if((s.match(/%[0-9a-f]{2}/gi)||[]).length>=3&&!trusted)add(10,'Heavily encoded characters','Encoding can disguise what the link really contains.');
 if(!trusted&&/[?&](url|redirect|next|goto|continue|return)=https?/i.test(s))add(15,'Redirects to another site','The link carries a second address inside it and may bounce you elsewhere.');
 if(u.port&&!['80','443'].includes(u.port))add(12,'Unusual port number','Normal websites rarely use port :'+u.port+'.');
 if(/\.(apk|exe|scr|msi|bat|jar)(\?|$)/i.test(u.pathname))add(30,'Direct download of a program','The link downloads an installable file. Malicious apps are a common scam payload.');
 if(!f.length)add(0,'No common phishing patterns found',b&&b.ok?'The domain matches the official site of '+b.ok+'.':'Nothing suspicious in the structure of this link. A clean link can still be a new scam page, so check who sent it.');
 else if(b&&b.ok)f.push({w:0,title:'Official domain recognised',detail:'Belongs to '+b.ok+'.'});
 return{host,f,score:Math.min(100,f.reduce((a,x)=>a+x.w,0))}}
const RULES=[
[/\b(urgent(ly)?|immediately|within \d+ ?(hours?|hrs|minutes?|mins?)|last warning|final notice|act now|expires? (today|soon|tonight)|asap)\b/gi,14,'Manufactured urgency','Scammers rush you so you act before you think.','Phishing'],
[/\b(account (will be |has been |is )?(blocked|suspended|locked|closed|deactivated)|legal action|arrest|penalty|sim (will be )?(blocked|deactivated)|disconnect(ed|ion))\b/gi,18,'Threat of loss or punishment','Fear is the lever. Real institutions give notice through their app or by post.','Bank or KYC fraud'],
[/\b(otp|cvv|pin|mpin|password|passcode|card number|net ?banking|login details|aadhaar|pan (card|number))\b/gi,22,'Asks for secrets or personal data','No genuine bank or service asks for OTPs, PINs or passwords by message.','Credential phishing'],
[/\b(kyc|re-?kyc|verify (your )?(account|identity|details)|update (your )?(pan|kyc|details))\b/gi,20,'KYC or account verification bait','A very common pretext for harvesting bank details.','Bank or KYC fraud'],
[/\b(lottery|you(’|')?ve won|you have won|winner|prize|cashback|reward|gift card|free (gift|iphone|recharge)|congratulations|lucky draw)\b/gi,20,'Too-good-to-be-true reward','Unexpected winnings are bait for a fee or your details.','Prize or lottery scam'],
[/\b(processing fee|registration fee|refundable deposit|upi (collect|request)|scan (the )?qr|send (money|rs\.?|₹)|pay (rs\.?|₹|inr))\b/gi,18,'Asks for a payment','Upfront fees and “collect requests” move money from you, not to you.','Advance-fee scam'],
[/\b(work from home|part[- ]time job|earn ₹? ?\d+|tasks? (and|&) (earn|commission)|like(s)? (and|&) (earn|subscribe)|telegram)\b/gi,16,'Easy-money job offer','Task and commission jobs are a known recruitment scam pattern.','Job or task scam'],
[/\b(parcel|package|courier|customs|delivery)\b.{0,40}\b(held|failed|pending|fee|address)\b/gi,16,'Parcel or delivery trick','Fake delivery notices lead to card-stealing pages.','Parcel scam'],
[/\b(anydesk|teamviewer|quicksupport|remote access)\b/gi,25,'Remote-access software','Installing these gives a stranger control of your device.','Tech-support scam'],
[/\b(bitcoin|crypto|usdt|double your|guaranteed returns?)\b/gi,14,'Investment or crypto lure','Guaranteed returns do not exist.','Investment scam'],
[/\b(click (here|the link|below)|tap (here|the link)|open the link|follow the link)\b/gi,10,'Push to click a link','Messages that tell you where to click are worth a second look.','Phishing'],
[/\b(dear (customer|user|sir\/madam|valued|account holder)|valued customer)\b/gi,8,'Generic greeting','Real providers usually use your name.','Phishing'],
[/\b(do not (tell|share with) anyone|keep this (confidential|secret))\b/gi,12,'Asks for secrecy','Isolating you from advice is a manipulation tactic.','Phishing']];
function analyzeMsg(t){
 const f=[],ranges=[],cats={};let tot=0;
 for(const[re,w,title,detail,cat]of RULES){re.lastIndex=0;let m,n=0;while((m=re.exec(t))){ranges.push([m.index,m.index+m[0].length]);n++;if(m[0].length==0)re.lastIndex++}
  if(n){f.push({w,title,detail:detail+(n>1?' (seen '+n+' times)':'')});tot+=w;cats[cat]=(cats[cat]||0)+w}}
 if(/!{2,}/.test(t)||(t.match(/\b[A-Z]{4,}\b/g)||[]).length>=3){f.push({w:8,title:'Shouting and heavy punctuation',detail:'Capital letters and repeated “!” are used to create panic.'});tot+=8}
 const urls=t.match(/https?:\/\/[^\s]+|\b(?:[a-z0-9-]+\.)+(?:com|in|net|org|xyz|top|link|click|co|me|ly|gl|cc|info|online|site|live|icu|zip)\b[^\s]*/gi)||[];
 let linkMax=0;
 [...new Set(urls)].forEach(x=>{const a=analyzeUrl(x);if(!a)return;const p=a.f.filter(y=>y.w).sort((p,q)=>q.w-p.w)[0];
  const i=t.indexOf(x);if(i>=0&&a.score>=25)ranges.push([i,i+x.length]);
  linkMax=Math.max(linkMax,a.score);
  f.push({w:0,title:'Link inside message: '+a.host,detail:a.score+'/100 risk'+(p?'. Biggest issue: '+p.title.toLowerCase()+'.':'. Nothing suspicious in its structure.'),link:a.score})});
 if(linkMax){const add=Math.round(linkMax*.6);tot+=add;if(linkMax>=25){cats['Phishing']=(cats['Phishing']||0)+add}}
 if(Object.keys(cats).length>=3){f.push({w:10,title:'Several scam tactics combined',detail:'Urgency, fear and a request together is the signature of a scripted scam.'});tot+=10}
 if(!f.length)f.push({w:0,title:'No scam language detected',detail:'Nothing matched the known scam patterns. Still verify unexpected requests through official channels.'});
 ranges.sort((a,b)=>a[0]-b[0]);const mg=[];ranges.forEach(r=>{const l=mg[mg.length-1];if(l&&r[0]<=l[1])l[1]=Math.max(l[1],r[1]);else mg.push([...r])});
 let html='',p=0;mg.forEach(r=>{html+=esc(t.slice(p,r[0]))+'<mark>'+esc(t.slice(r[0],r[1]))+'</mark>';p=r[1]});html+=esc(t.slice(p));
 const top=Object.entries(cats).sort((a,b)=>b[1]-a[1])[0];
 return{f,score:Math.min(100,tot),html,cat:top?top[0]:null}}
function analyzeMail(s){
 const m=s.trim().toLowerCase().match(/^([^@\s]+)@([^@\s]+\.[^@\s]+)$/);if(!m)return null;
 const[,loc,dom]=m,f=[],add=(w,t,d)=>f.push({w,title:t,detail:d}),b=brand(dom),free=FREE.includes(dom);
 if(b&&b.w)add(b.w,b.title,b.detail);
 if(free)for(const k in OFF)if(norm(loc).includes(k)){add(40,'Free mailbox using a brand name','Companies do not send official mail from '+dom+'. Anyone can register “'+loc+'”.');break}
 if(free&&/(support|security|alert|helpdesk|verify|care|service)/.test(loc))add(20,'Official-sounding name on a free mailbox','Words like support or security on a public mail service are a red flag.');
 if(BADTLD.includes(dom.split('.').pop()))add(18,'Risky domain ending','.'+dom.split('.').pop()+' domains are cheap and common in scams.');
 if(dom.includes('xn--'))add(30,'Look-alike characters in the domain','The domain may imitate a real one with foreign letters.');
 if((dom.match(/-/g)||[]).length>=2)add(12,'Several hyphens in the domain','Typical of throwaway domains.');
 if((loc.match(/\d/g)||[]).length/loc.length>.4&&loc.length>6)add(15,'Mostly digits in the name','Auto-generated mailboxes often look like this.');
 if(loc.length>25)add(10,'Very long mailbox name','Random-looking names suggest a disposable account.');
 if(!f.length)add(0,'Sender address looks structurally normal',b&&b.ok?'Domain matches the official site of '+b.ok+'. Spoofing is still possible, so check the message itself.':'No red flags in the address. Check what the message asks for.');
 return{f,score:Math.min(100,f.reduce((a,x)=>a+x.w,0))}}
const MODES={url:{lbl:'Link to check',ph:'Paste a link, for example http://secure-login.example.xyz',fn:s=>analyzeUrl(s),smp:['http://paypa1-secure-login.xyz/verify?account=update','https://www.amazon.in/','http://sbi-kyc-update.top/login']},
msg:{lbl:'Email or SMS text',ph:'Paste the full message here, including any links',smp:['URGENT: Your SBI account will be blocked within 24 hours. Update your KYC now at http://sbi-kyc-update.top/login and share the OTP you receive to verify.','Hi, your order has shipped and will arrive Thursday. Track it in the app.','Congratulations! You have won a lucky draw prize. Pay a small processing fee to claim your reward. Do not tell anyone!!']},
mail:{lbl:'Sender email address',ph:'name@example.com',smp:['security-paypal@gmail.com','support@paypa1.com','no-reply@amazon.in']}};
let mode='url';
function setMode(m){mode=m;document.querySelectorAll('.tabs button').forEach(b=>b.setAttribute('aria-selected',b.dataset.m===m));
 $('#lbl').textContent=MODES[m].lbl;$('#inp').placeholder=MODES[m].ph;$('#inp').style.minHeight=m==='msg'?'170px':'90px';
 $('#samples').innerHTML=MODES[m].smp.map((s,i)=>'<button class="chip" data-i="'+i+'">'+['Scam','Safe','Tricky'][i]+'</button>').join('')}
const VER=s=>s<25?['Looks safe','var(--ok)']:s<55?['Suspicious','var(--warn)']:s<80?['Likely a scam','var(--bad)']:['Dangerous','var(--bad)'];
const ACTS=s=>s<25?['Nothing alarming found, but stay alert if the message was unexpected.','Open sites by typing the address yourself, or use the official app.']:['Do not click, reply or call back the number in the message.','Never share OTPs, PINs, CVVs or passwords with anyone.','Contact the organisation through its official app or number.','If money or details were already shared, call your bank at once and report at cybercrime.gov.in (India: 1930).'];
let last=null;
function scan(){
 const v=$('#inp').value.trim();if(!v)return;let r;
 if(mode==='msg')r=analyzeMsg(v);else r=MODES[mode].fn?MODES[mode].fn(v):analyzeMail(v);
 if(!r){$('#out').innerHTML='<p class="empty"><b>That does not look like '+(mode==='url'?'a valid link':'an email address')+'.</b><br>Check for typos and paste it again.</p>';return}
 const[vl,col]=VER(r.score),cat=r.cat||(r.score>=25?'Phishing indicators':'');last={mode,v,score:r.score,vl,f:r.f};
 const fs=[...r.f].sort((a,b)=>b.w-a.w).map(x=>{const lv=x.w>=25?'high':x.w>=12?'med':x.w>0?'low':'ok';const tag={high:'High',med:'Medium',low:'Low',ok:'Info'}[lv];return'<li class="'+lv+'"><span class="tag">'+tag+(x.w?' +'+x.w:'')+'</span><b>'+esc(x.title)+'</b><small>'+esc(x.detail)+'</small></li>'}).join('');
 $('#out').innerHTML='<div class="gauge" style="--c:'+col+'"><svg viewBox="0 0 200 118" role="img" aria-label="Risk '+r.score+' out of 100"><path class="gt" d="M20 100 A80 80 0 0 1 180 100"/><path class="gf" id="gf" d="M20 100 A80 80 0 0 1 180 100" style="stroke-dashoffset:251.33"/><text class="num" x="100" y="96" text-anchor="middle">'+r.score+'</text></svg><div><div class="verdict">'+vl+'</div><p class="cat">'+(cat?esc(cat)+' · ':'')+'risk score out of 100</p></div></div>'
 +(r.html?'<h3>Message, with warning signs marked</h3><div class="hl">'+r.html+'</div>':'')
 +'<h3>Why this score</h3><ul class="f">'+fs+'</ul><h3>What to do</h3><ul class="acts">'+ACTS(r.score).map(a=>'<li>'+a+'</li>').join('')+'</ul><div class="row"><button class="mini" id="cp">Copy report</button></div>';
 requestAnimationFrame(()=>requestAnimationFrame(()=>{const g=$('#gf');if(g)g.style.strokeDashoffset=251.33*(1-r.score/100)}));
 $('#cp').onclick=copy;save({t:mode,s:v.slice(0,70),score:r.score})}
function copy(){if(!last)return;const txt='Kavach report\nType: '+last.mode+'\nInput: '+last.v+'\nVerdict: '+last.vl+' ('+last.score+'/100)\n\nSignals:\n'+last.f.filter(x=>x.w).map(x=>'- '+x.title+': '+x.detail).join('\n');
 try{navigator.clipboard.writeText(txt).then(()=>{$('#cp').textContent='Copied'})}catch(e){$('#cp').textContent='Copy not available here'}}
const KEY='kavach:hist';
function load(){try{return JSON.parse(localStorage.getItem(KEY))||[]}catch(e){return window._h||[]}}
function save(x){const h=[x,...load()].slice(0,30);window._h=h;try{localStorage.setItem(KEY,JSON.stringify(h))}catch(e){}draw()}
function draw(){const h=load();$('#sTot').textContent=h.length;$('#sBad').textContent=h.filter(x=>x.score>=25).length;
 $('#hist').innerHTML=h.length?h.slice(0,8).map(x=>'<li><em style="color:'+VER(x.score)[1]+'">'+x.score+'</em><span>'+esc(x.s)+'</span></li>').join(''):'<li style="color:var(--mute)">Nothing scanned yet.</li>'}
document.querySelectorAll('.tabs button').forEach(b=>b.onclick=()=>{setMode(b.dataset.m);$('#inp').value=''});
$('#samples').onclick=e=>{const i=e.target.dataset.i;if(i===undefined)return;$('#inp').value=MODES[mode].smp[i];scan()};
$('#go').onclick=scan;$('#inp').addEventListener('keydown',e=>{if(e.key==='Enter'&&(e.ctrlKey||e.metaKey||mode!=='msg')){e.preventDefault();scan()}});
$('#clr').onclick=()=>{window._h=[];try{localStorage.removeItem(KEY)}catch(e){}draw()};
setMode('url');draw();


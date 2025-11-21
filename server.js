const http=require('http');
const fs=require('fs');
const path=require('path');
const url=require('url');
const crypto=require('crypto');
let mysqlPool=null;
try{
  const mysql=require('mysql2/promise');
  mysqlPool=mysql.createPool({
    host:process.env.DB_HOST||'127.0.0.1',
    user:process.env.DB_USER||'root',
    password:process.env.DB_PASS||'root',
    database:process.env.DB_NAME||'cwxm',
    waitForConnections:true,
    connectionLimit:5,
  });
}catch(e){mysqlPool=null;}
const state={codes:new Map(),vouchers:[],vid:1,auth:{password:'123456'}};
const menu={
  "凭证":["新增凭证","查看凭证","凭证汇总表","凭证回收站"],
  "账簿":["总账","明细账","余额表","序时账","多栏账","科目辅助明细账","科目辅助余额表","辅助核算明细账","辅助核算余额表"],
  "报表":["资产负债表","利润表","现金流量表"],
  "结账":["期末结转","结账"],
  "设置":["科目期初","辅助核算","计量单位","币种设置","凭证类型","凭证配置","账套管理","财税设置","权限管理","备份恢复","现金流量科目对照","归档管理","操作日志"]
};
const ok=(res,data)=>{res.statusCode=200;res.setHeader('Content-Type','application/json');res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');res.end(JSON.stringify(data));};
const bad=(res,status,msg)=>{res.statusCode=status;res.setHeader('Content-Type','application/json');res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');res.end(JSON.stringify({error:msg}));};
const sendCsv=(res,text)=>{res.statusCode=200;res.setHeader('Content-Type','text/csv; charset=utf-8');res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');res.end(text||'');};
const getBody=(req)=>new Promise((resolve)=>{const chunks=[];req.on('data',d=>chunks.push(d));req.on('end',()=>{const raw=Buffer.concat(chunks).toString();try{resolve(JSON.parse(raw||'{}'));}catch(e){resolve({});}});});
const routes=async(req,res)=>{
  if(req.method==='OPTIONS'){res.statusCode=204;res.setHeader('Access-Control-Allow-Origin','*');res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization');res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS');res.end();return;}
  const {pathname,query}=url.parse(req.url,true);
  if(req.method==='GET' && pathname==='/hero.svg'){
    const svg=`<?xml version="1.0" encoding="UTF-8"?>
<svg viewBox="0 0 800 540" xmlns="http://www.w3.org/2000/svg" preserveAspectRatio="xMidYMid meet">
  <defs>
    <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#3ba3ff"/>
      <stop offset="100%" stop-color="#1e78e7"/>
    </linearGradient>
    <linearGradient id="panel" x1="0" y1="0" x2="0" y2="1">
      <stop offset="0%" stop-color="#ffffff"/>
      <stop offset="100%" stop-color="#f5faff"/>
    </linearGradient>
    <linearGradient id="accent" x1="0" y1="0" x2="1" y2="0">
      <stop offset="0%" stop-color="#60a5fa"/>
      <stop offset="100%" stop-color="#a78bfa"/>
    </linearGradient>
  </defs>
  <rect x="0" y="0" width="800" height="540" fill="url(#bg)"/>
  <g opacity="0.16" fill="#8bd1ff">
    <rect x="40" y="44" width="8" height="8"/><rect x="56" y="44" width="8" height="8"/><rect x="72" y="44" width="8" height="8"/>
    <rect x="40" y="60" width="8" height="8"/><rect x="56" y="60" width="8" height="8"/><rect x="72" y="60" width="8" height="8"/>
    <rect x="680" y="420" width="8" height="8"/><rect x="696" y="420" width="8" height="8"/><rect x="712" y="420" width="8" height="8"/>
    <rect x="680" y="436" width="8" height="8"/><rect x="696" y="436" width="8" height="8"/><rect x="712" y="436" width="8" height="8"/>
  </g>
  <g transform="translate(80,90)">
    <rect x="0" y="0" width="520" height="320" rx="14" fill="url(#panel)" stroke="#e5e7eb"/>
    <g transform="translate(36,64)">
      <rect x="0" y="60" width="36" height="100" fill="#60a5fa" rx="6"/>
      <rect x="56" y="20" width="36" height="140" fill="#a78bfa" rx="6"/>
      <rect x="112" y="90" width="36" height="70" fill="#22c55e" rx="6"/>
      <rect x="168" y="8" width="36" height="152" fill="#f59e0b" rx="6"/>
    </g>
    <g transform="translate(280,64)">
      <rect x="0" y="0" width="224" height="152" rx="10" fill="#ffffff" stroke="#e5e7eb"/>
      <path d="M12,120 L48,96 L84,108 L120,76 L156,88 L192,54 L220,70" fill="none" stroke="#2563eb" stroke-width="2"/>
      <circle cx="48" cy="96" r="3" fill="#2563eb"/>
      <circle cx="120" cy="76" r="3" fill="#2563eb"/>
      <circle cx="192" cy="54" r="3" fill="#2563eb"/>
    </g>
    <g transform="translate(36,214)">
      <circle cx="44" cy="44" r="44" fill="#eef2ff" stroke="#c7d2fe"/>
      <path d="M44,44 L44,4 A40,40 0 0 1 80,22 Z" fill="#60a5fa"/>
      <path d="M44,44 L80,22 A40,40 0 0 1 66,80 Z" fill="#22c55e"/>
      <path d="M44,44 L66,80 A40,40 0 0 1 44,84 Z" fill="#f59e0b"/>
    </g>
    <g transform="translate(280,236)">
      <rect x="0" y="0" width="224" height="88" rx="10" fill="#ffffff" stroke="#e5e7eb"/>
      <rect x="12" y="16" width="160" height="12" rx="6" fill="#e5efff"/>
      <rect x="12" y="38" width="120" height="10" rx="5" fill="#f0f9ff"/>
      <rect x="12" y="58" width="140" height="10" rx="5" fill="#f8fafc"/>
      <rect x="180" y="14" width="32" height="14" rx="7" fill="url(#accent)" opacity=".9"/>
    </g>
  </g>
</svg>`;
    res.statusCode=200; res.setHeader('Content-Type','image/svg+xml; charset=utf-8'); res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS'); res.end(svg); return;
  }
  if(req.method==='GET' && (pathname==='/'||pathname==='/index.html')){
    try{const html=fs.readFileSync(path.join(__dirname,'index.html'),'utf-8'); res.statusCode=200; res.setHeader('Content-Type','text/html; charset=utf-8'); res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS'); res.end(html);}catch(e){bad(res,404,'not_found');}
    return;
  }
  if(req.method==='GET' && pathname==='/center.html'){
    try{const html=fs.readFileSync(path.join(__dirname,'center.html'),'utf-8'); res.statusCode=200; res.setHeader('Content-Type','text/html; charset=utf-8'); res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS'); res.end(html);}catch(e){bad(res,404,'not_found');}
    return;
  }
  if(req.method==='GET' && pathname==='/display.html'){
    try{const html=fs.readFileSync(path.join(__dirname,'display.html'),'utf-8'); res.statusCode=200; res.setHeader('Content-Type','text/html; charset=utf-8'); res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS'); res.end(html);}catch(e){bad(res,404,'not_found');}
    return;
  }
  if(req.method==='GET' && pathname==='/main.html'){
    try{const html=fs.readFileSync(path.join(__dirname,'main.html'),'utf-8'); res.statusCode=200; res.setHeader('Content-Type','text/html; charset=utf-8'); res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS'); res.end(html);}catch(e){bad(res,404,'not_found');}
    return;
  }
  if(req.method==='GET' && (pathname==='/mock-home.html' || pathname==='/mock_home.html')){
    try{const html=fs.readFileSync(path.join(__dirname,'mock_home.html'),'utf-8'); res.statusCode=200; res.setHeader('Content-Type','text/html; charset=utf-8'); res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS'); res.end(html);}catch(e){bad(res,404,'not_found');}
    return;
  }
  if(req.method==='GET' && (pathname==='/app.js'||pathname==='/styles.css')){
    try{const fp=path.join(__dirname, pathname.slice(1)); const data=fs.readFileSync(fp); const ct=pathname.endsWith('.js')?'application/javascript; charset=utf-8':'text/css; charset=utf-8'; res.statusCode=200; res.setHeader('Content-Type',ct); res.setHeader('Access-Control-Allow-Origin','*'); res.setHeader('Access-Control-Allow-Headers','Content-Type, Authorization'); res.setHeader('Access-Control-Allow-Methods','GET,POST,DELETE,OPTIONS'); res.end(data);}catch(e){bad(res,404,'not_found');}
    return;
  }
  if(pathname==='/api/login'&&req.method==='POST'){
    const body=await getBody(req);
    const {username,password}=body;
    if((username||'')==='admin'&&(password||'')===state.auth.password){ok(res,{user:'admin',token:crypto.randomUUID()});}else{bad(res,401,'invalid');}
    return;
  }
  if(pathname==='/api/change-password'&&req.method==='POST'){
    const body=await getBody(req);
    const {oldPassword,newPassword}=body||{};
    if(!oldPassword||!newPassword){bad(res,400,'required');return;}
    if(oldPassword!==state.auth.password){bad(res,401,'invalid');return;}
    state.auth.password=String(newPassword);
    ok(res,{ok:true});
    return;
  }
  if(pathname==='/api/timekay'&&req.method==='GET'){
    try{
      const opts={hostname:'inter.bak365.cn',path:'/Service.ashx?Type=GetTimeKay',method:'GET'};
      const chunks=[];
      const req2=http.request(opts,(r)=>{r.on('data',d=>chunks.push(d)); r.on('end',()=>{const txt=Buffer.concat(chunks).toString('utf-8'); let data=null; try{data=JSON.parse(txt||'{}');}catch(e){data={State:false,Msg:'非JSON响应',Data:{},raw:txt};} ok(res,data);});});
      req2.on('error',()=>bad(res,502,'upstream_error')); req2.end();
    }catch(e){bad(res,500,'server_error');}
    return;
  }
  if(pathname==='/api/cardinfo'&&req.method==='POST'){
    try{
      const body=await getBody(req);
      const B1=(body&&body.B1)||'';
      if(!B1){bad(res,400,'B1_required');return;}
      const payloadStr='{"CardNo":"0001"}';
      const N1=`Test123456${payloadStr}${B1}`;
      const M1=crypto.createHash('md5').update(N1).digest('hex');
      const pathUrl=`/Service.ashx?AppNo=Test&Type=CardInfo&MAC=${encodeURIComponent(M1)}`;
      const postBody=Buffer.from(payloadStr,'utf-8');
      const opts={hostname:'inter.bak365.cn',path:pathUrl,method:'POST',headers:{'Content-Type':'application/json','Content-Length':postBody.length}};
      const chunks=[];
      const req2=http.request(opts,(r)=>{r.on('data',d=>chunks.push(d)); r.on('end',()=>{const txt=Buffer.concat(chunks).toString('utf-8'); let resp=null; try{resp=JSON.parse(txt||'{}');}catch(e){resp=txt;} const C1=`http://inter.bak365.cn${pathUrl}`; ok(res,{req:{B1,N1,M1,C1},resp});});});
      req2.on('error',()=>bad(res,502,'upstream_error')); req2.write(postBody); req2.end();
    }catch(e){bad(res,500,'server_error');}
    return;
  }
  if(pathname==='/api/vouchers'&&req.method==='GET'){
    const page=Number(query?.page||1); const size=Math.max(1,Math.min(200, Number(query?.pageSize||50))); const offset=(page-1)*size;
    const start=query?.start; const end=query?.end; const type=query?.type; const number=query?.number;
    const amountMin=(query?.amountMin!=null)?Number(query.amountMin):null; const amountMax=(query?.amountMax!=null)?Number(query.amountMax):null;
    if(mysqlPool){
      try{
        const params=[]; let where='WHERE 1=1';
        if(start){where+=' AND v.date>=?'; params.push(start);} if(end){where+=' AND v.date<=?'; params.push(end);} if(type){where+=' AND v.type LIKE ?'; params.push(`%${type}%`);} if(number){where+=' AND v.number LIKE ?'; params.push(`%${number}%`);} 
        if(amountMin!=null || amountMax!=null){
          const havingParts=[]; const havingParams=[];
          if(amountMin!=null){havingParts.push('SUM(IFNULL(ln.debit,0))>=?'); havingParams.push(amountMin);} 
          if(amountMax!=null){havingParts.push('SUM(IFNULL(ln.debit,0))<=?'); havingParams.push(amountMax);} 
          const having=havingParts.length?('HAVING '+havingParts.join(' AND ')):' '; 
          const [cntRows]=await mysqlPool.query(`SELECT COUNT(*) AS cnt FROM (
            SELECT v.id FROM vouchers v JOIN voucher_lines ln ON ln.voucher_id=v.id ${where} GROUP BY v.id ${having}
          ) t`,[...params,...havingParams]);
          const total=Number(cntRows?.[0]?.cnt||0);
          const [rows]=await mysqlPool.query(`SELECT v.id, v.number, v.date, v.type, v.status, COUNT(ln.id) AS line_count, SUM(IFNULL(ln.debit,0)) AS sum_debit
            FROM vouchers v JOIN voucher_lines ln ON ln.voucher_id=v.id ${where} GROUP BY v.id ${having} ORDER BY v.id DESC LIMIT ? OFFSET ?`,[...params,...havingParams,size,offset]);
          ok(res,{items:rows.map(r=>({id:r.id,number:r.number,date:r.date?.toISOString?.().slice(0,10)||r.date,type:r.type,status:r.status,lines_count:r.line_count,sum_debit:r.sum_debit})), page, pageSize:size, total});
        }else{
          const [cntRows]=await mysqlPool.query(`SELECT COUNT(*) AS cnt FROM vouchers v ${where}`, params);
          const total=Number(cntRows?.[0]?.cnt||0);
          const [rows]=await mysqlPool.query(`SELECT id, number, date, type, status,
            (SELECT COUNT(*) FROM voucher_lines vl WHERE vl.voucher_id=v.id) AS line_count,
            (SELECT SUM(IFNULL(debit,0)) FROM voucher_lines vl2 WHERE vl2.voucher_id=v.id) AS sum_debit
            FROM vouchers v ${where} ORDER BY id DESC LIMIT ? OFFSET ?`,[...params,size,offset]);
          ok(res,{items:rows.map(r=>({id:r.id,number:r.number,date:r.date?.toISOString?.().slice(0,10)||r.date,type:r.type,status:r.status,lines_count:r.line_count,sum_debit:r.sum_debit})), page, pageSize:size, total});
        }
      }catch(e){
        const all=(state.vouchers||[]).filter(v=>{
          if(start&&v.date<start) return false; if(end&&v.date>end) return false; if(type&&!(v.type||'').includes(type)) return false; if(number&&!(v.number||'').includes(number)) return false; return true;
        });
        const filtered=(amountMin!=null || amountMax!=null)?all.filter(v=>{const amt=(v.lines||[]).reduce((acc,l)=>acc+(Number(l.debit)||0),0); if(amountMin!=null && amt<amountMin) return false; if(amountMax!=null && amt>amountMax) return false; return true;}):all;
        const items=filtered.slice(offset,offset+size).map(v=>({
          id:v.id, number:v.number, date:v.date, type:v.type, status:v.status,
          lines_count:(v.lines||[]).length,
          sum_debit:(v.lines||[]).reduce((acc,l)=>acc+(Number(l.debit)||0),0)
        }));
        ok(res,{items, page, pageSize:size, total:filtered.length});
      }
    }else{
      const all=(state.vouchers||[]).filter(v=>{
        if(start&&v.date<start) return false; if(end&&v.date>end) return false; if(type&&!(v.type||'').includes(type)) return false; if(number&&!(v.number||'').includes(number)) return false; return true;
      });
      const filtered=(amountMin!=null || amountMax!=null)?all.filter(v=>{const amt=(v.lines||[]).reduce((acc,l)=>acc+(Number(l.debit)||0),0); if(amountMin!=null && amt<amountMin) return false; if(amountMax!=null && amt>amountMax) return false; return true;}):all;
      const items=filtered.slice(offset,offset+size).map(v=>({
        id:v.id, number:v.number, date:v.date, type:v.type, status:v.status,
        lines_count:(v.lines||[]).length,
        sum_debit:(v.lines||[]).reduce((acc,l)=>acc+(Number(l.debit)||0),0)
      }));
      ok(res,{items, page, pageSize:size, total:filtered.length});
    }
    return;
  }
  if(pathname==='/api/vouchers'&&req.method==='POST'){
    const body=await getBody(req);
    const {date,type,lines}=body;
    if(!date||!type||!Array.isArray(lines)||lines.length<2){bad(res,400,'invalid_body');return;}
    const debit=lines.reduce((a,b)=>a+(Number(b.debit)||0),0);
    const credit=lines.reduce((a,b)=>a+(Number(b.credit)||0),0);
    if(Number(debit.toFixed(2))!==Number(credit.toFixed(2))){bad(res,400,'unbalanced');return;}
    if(mysqlPool){
      try{
        const conn=await mysqlPool.getConnection();
        try{
          await conn.beginTransaction();
          const [r]=await conn.query("INSERT INTO vouchers(account_book_id, period_id, number, date, type, status, created_by) VALUES(1, NULL, '', ?, ?, 0, NULL)", [date, type]);
          const id=r.insertId; const number=`${new Date(date).getFullYear()}-${String(id).padStart(4,'0')}`;
          await conn.query("UPDATE vouchers SET number=? WHERE id=?", [number, id]);
          for(let i=0;i<lines.length;i++){
            const ln=lines[i];
            await conn.query("INSERT INTO voucher_lines(voucher_id, line_no, account_code, description, debit, credit) VALUES(?,?,?,?,?,?)", [id, i+1, ln.account_code||'', ln.description||'', Number(ln.debit)||0, Number(ln.credit)||0]);
          }
          await conn.commit();
          conn.release();
          ok(res,{id,number});
        }catch(e){await conn.rollback();conn.release();throw e;}
      }catch(e){
        const id=state.vid++;const number=`${new Date(date).getFullYear()}-${String(id).padStart(4,'0')}`;
        const item={id,date,type,number,status:0,lines};
        state.vouchers.push(item);
        ok(res,{id,number});
      }
    }else{
      const id=state.vid++;const number=`${new Date(date).getFullYear()}-${String(id).padStart(4,'0')}`;
      const item={id,date,type,number,status:0,lines};
      state.vouchers.push(item);
      ok(res,{id,number});
    }
    return;
  }
  if(pathname && /^\/api\/vouchers\/\d+$/.test(pathname) && req.method==='GET'){
    const id=Number(pathname.split('/').pop());
    if(mysqlPool){
      try{const [vh]=await mysqlPool.query("SELECT id, number, date, type, status FROM vouchers WHERE id=?",[id]);
        if(!vh.length){const it=state.vouchers.find(v=>v.id===id); if(it){ok(res,it);} else {bad(res,404,'not_found');} return;}
        const v=vh[0]; const [lines]=await mysqlPool.query("SELECT line_no, account_code, description, debit, credit FROM voucher_lines WHERE voucher_id=? ORDER BY line_no",[id]);
        ok(res,{id:v.id,number:v.number,date:v.date?.toISOString?.().slice(0,10)||v.date,type:v.type,status:v.status,lines:lines});
      }catch(e){const it=state.vouchers.find(v=>v.id===id); if(it){ok(res,it);} else {bad(res,404,'not_found');}}
    }else{
      const it=state.vouchers.find(v=>v.id===id);
      if(it){ok(res,it);}else{bad(res,404,'not_found');}
    }
    return;
  }
  if(pathname==='/api/send-code'&&req.method==='POST'){
    const body=await getBody(req);
    const {phone}=body; if(!phone){bad(res,400,'phone_required');return;}
    const code=(Math.floor(100000+Math.random()*900000)).toString();
    state.codes.set(phone,code);
    ok(res,{phone,code});
    return;
  }
  if(pathname==='/api/login/sms'&&req.method==='POST'){
    const body=await getBody(req);
    const {phone,code}=body; if(!phone||!code){bad(res,400,'required');return;}
    const saved=state.codes.get(phone);
    if(saved&&saved===code){ok(res,{user:phone,token:crypto.randomUUID()});}else{bad(res,401,'invalid');}
    return;
  }
  if(pathname==='/api/menu'&&req.method==='GET'){
    ok(res,{menu});
    return;
  }
  if(pathname?.startsWith('/api/vouchers/export')&&req.method==='GET'){
    if(mysqlPool){
      try{
        const [rows]=await mysqlPool.query(`SELECT id, number, date, type, status,
          (SELECT COUNT(*) FROM voucher_lines vl WHERE vl.voucher_id=v.id) AS line_count,
          (SELECT SUM(IFNULL(debit,0)) FROM voucher_lines vl2 WHERE vl2.voucher_id=v.id) AS sum_debit
          FROM vouchers v ORDER BY id DESC LIMIT 1000`);
        const header='编号,日期,类型,状态,分录数,借方合计\n';
        const body=rows.map(r=>`${r.number},${(r.date?.toISOString?.().slice(0,10)||r.date)},${r.type},${r.status},${r.line_count},${Number(r.sum_debit||0).toFixed(2)}`).join('\n');
        sendCsv(res,header+body);
      }catch(e){
        const header='编号,日期,类型,状态,分录数,借方合计\n';
        const body=(state.vouchers||[]).map(v=>{
          const sum=(v.lines||[]).reduce((acc,l)=>acc+(Number(l.debit)||0),0);
          return `${v.number},${v.date},${v.type},${v.status},${(v.lines||[]).length},${sum.toFixed(2)}`;
        }).join('\n');
        sendCsv(res,header+body);
      } 
    }else{
      const header='编号,日期,类型,状态,分录数,借方合计\n';
      const body=(state.vouchers||[]).map(v=>{
        const sum=(v.lines||[]).reduce((acc,l)=>acc+(Number(l.debit)||0),0);
        return `${v.number},${v.date},${v.type},${v.status},${(v.lines||[]).length},${sum.toFixed(2)}`;
      }).join('\n');
      sendCsv(res,header+body);
    } 
    return;
  }
  if(pathname==='/api/vouchers/summary/export'&&req.method==='GET'){
    const start=query?.start; const end=query?.end; const groupBy=query?.groupBy;
    if(mysqlPool){
      try{
        const params=[]; let where='';
        if(start&&end){where='WHERE v.date BETWEEN ? AND ?'; params.push(start,end);} else if(start){where='WHERE v.date>=?'; params.push(start);} else if(end){where='WHERE v.date<=?'; params.push(end);} 
        if(groupBy==='type'){
          const [rows]=await mysqlPool.query(`SELECT d, type, SUM(sum_debit) AS sum_debit, SUM(sum_credit) AS sum_credit FROM (
            SELECT DATE_FORMAT(v.date,'%Y-%m-%d') AS d, v.type as type, IFNULL(ln.debit,0) AS sum_debit, IFNULL(ln.credit,0) AS sum_credit
            FROM vouchers v JOIN voucher_lines ln ON ln.voucher_id=v.id ${where}
          ) t GROUP BY d, type ORDER BY d DESC, type`,params);
          const header='日期,类型,借方合计,贷方合计\n'; const body=rows.map(r=>`${r.d},${r.type},${Number(r.sum_debit).toFixed(2)},${Number(r.sum_credit).toFixed(2)}`).join('\n'); sendCsv(res,header+body);
        }else if(groupBy==='account'){
          const [rows]=await mysqlPool.query(`SELECT d, account_code, SUM(sum_debit) AS sum_debit, SUM(sum_credit) AS sum_credit FROM (
            SELECT DATE_FORMAT(v.date,'%Y-%m-%d') AS d, ln.account_code as account_code, IFNULL(ln.debit,0) AS sum_debit, IFNULL(ln.credit,0) AS sum_credit
            FROM vouchers v JOIN voucher_lines ln ON ln.voucher_id=v.id ${where}
          ) t GROUP BY d, account_code ORDER BY d DESC, account_code`,params);
          const header='日期,科目,借方合计,贷方合计\n'; const body=rows.map(r=>`${r.d},${r.account_code},${Number(r.sum_debit).toFixed(2)},${Number(r.sum_credit).toFixed(2)}`).join('\n'); sendCsv(res,header+body);
        }else{
          const [rows]=await mysqlPool.query(`SELECT d, SUM(sum_debit) AS sum_debit, SUM(sum_credit) AS sum_credit FROM (
            SELECT DATE_FORMAT(v.date,'%Y-%m-%d') AS d, IFNULL(ln.debit,0) AS sum_debit, IFNULL(ln.credit,0) AS sum_credit
            FROM vouchers v JOIN voucher_lines ln ON ln.voucher_id=v.id ${where}
          ) t GROUP BY d ORDER BY d DESC`,params);
          const header='日期,借方合计,贷方合计\n'; const body=rows.map(r=>`${r.d},${Number(r.sum_debit).toFixed(2)},${Number(r.sum_credit).toFixed(2)}`).join('\n'); sendCsv(res,header+body);
        }
      }catch(e){
        const m=new Map(); (state.vouchers||[]).forEach(v=>{const d=v.date; if(start&&d<start)return; if(end&&d>end)return; const sums=(v.lines||[]).reduce((acc,l)=>{acc.debit+=(Number(l.debit)||0); acc.credit+=(Number(l.credit)||0); return acc;},{debit:0,credit:0}); if(groupBy==='type'){const key=`${d}|${v.type||''}`; const cur=m.get(key)||{sum_debit:0,sum_credit:0,type:(v.type||'')}; m.set(key,{sum_debit:cur.sum_debit+sums.debit,sum_credit:cur.sum_credit+sums.credit,type:(v.type||'')});} else if(groupBy==='account'){(v.lines||[]).forEach(ln=>{const key=`${d}|${ln.account_code||''}`; const cur=m.get(key)||{sum_debit:0,sum_credit:0,account_code:(ln.account_code||'')}; m.set(key,{sum_debit:cur.sum_debit+(Number(ln.debit)||0), sum_credit:cur.sum_credit+(Number(ln.credit)||0), account_code:(ln.account_code||'')});});} else {const cur=m.get(d)||{sum_debit:0,sum_credit:0}; m.set(d,{sum_debit:cur.sum_debit+sums.debit,sum_credit:cur.sum_credit+sums.credit});}});
        if(groupBy==='type'){const header='日期,类型,借方合计,贷方合计\n'; const rows=Array.from(m.entries()).map(([k,val])=>`${k.split('|')[0]},${val.type},${val.sum_debit.toFixed(2)},${val.sum_credit.toFixed(2)}`).join('\n'); sendCsv(res, header+rows);} else if(groupBy==='account'){const header='日期,科目,借方合计,贷方合计\n'; const rows=Array.from(m.entries()).map(([k,val])=>`${k.split('|')[0]},${val.account_code},${val.sum_debit.toFixed(2)},${val.sum_credit.toFixed(2)}`).join('\n'); sendCsv(res, header+rows);} else {const header='日期,借方合计,贷方合计\n'; const rows=Array.from(m.entries()).map(([d,val])=>`${d},${val.sum_debit.toFixed(2)},${val.sum_credit.toFixed(2)}`).join('\n'); sendCsv(res, header+rows);} 
      }
    }else{
      const m=new Map(); (state.vouchers||[]).forEach(v=>{const d=v.date; if(start&&d<start)return; if(end&&d>end)return; const sums=(v.lines||[]).reduce((acc,l)=>{acc.debit+=(Number(l.debit)||0); acc.credit+=(Number(l.credit)||0); return acc;},{debit:0,credit:0}); if(groupBy==='type'){const key=`${d}|${v.type||''}`; const cur=m.get(key)||{sum_debit:0,sum_credit:0,type:(v.type||'')}; m.set(key,{sum_debit:cur.sum_debit+sums.debit,sum_credit:cur.sum_credit+sums.credit,type:(v.type||'')});} else if(groupBy==='account'){(v.lines||[]).forEach(ln=>{const key=`${d}|${ln.account_code||''}`; const cur=m.get(key)||{sum_debit:0,sum_credit:0,account_code:(ln.account_code||'')}; m.set(key,{sum_debit:cur.sum_debit+(Number(ln.debit)||0), sum_credit:cur.sum_credit+(Number(ln.credit)||0), account_code:(ln.account_code||'')});});} else {const cur=m.get(d)||{sum_debit:0,sum_credit:0}; m.set(d,{sum_debit:cur.sum_debit+sums.debit,sum_credit:cur.sum_credit+sums.credit});}});
      if(groupBy==='type'){const header='日期,类型,借方合计,贷方合计\n'; const rows=Array.from(m.entries()).map(([k,val])=>`${k.split('|')[0]},${val.type},${val.sum_debit.toFixed(2)},${val.sum_credit.toFixed(2)}`).join('\n'); sendCsv(res, header+rows);} else if(groupBy==='account'){const header='日期,科目,借方合计,贷方合计\n'; const rows=Array.from(m.entries()).map(([k,val])=>`${k.split('|')[0]},${val.account_code},${val.sum_debit.toFixed(2)},${val.sum_credit.toFixed(2)}`).join('\n'); sendCsv(res, header+rows);} else {const header='日期,借方合计,贷方合计\n'; const rows=Array.from(m.entries()).map(([d,val])=>`${d},${val.sum_debit.toFixed(2)},${val.sum_credit.toFixed(2)}`).join('\n'); sendCsv(res, header+rows);} 
    }
    return;
  }
  if(pathname?.startsWith('/api/vouchers/')&&pathname.endsWith('/void')&&req.method==='POST'){
    const id=Number(pathname.split('/')[3]);
    if(mysqlPool){
      try{await mysqlPool.query("UPDATE vouchers SET status=9 WHERE id=?",[id]); ok(res,{ok:true});}
      catch(e){const it=state.vouchers.find(v=>v.id===id); if(it){it.status=9; ok(res,{ok:true});} else {bad(res,404,'not_found');}}
    }else{const it=state.vouchers.find(v=>v.id===id); if(it){it.status=9; ok(res,{ok:true});} else {bad(res,404,'not_found');}}
    return;
  }
  if(pathname?.startsWith('/api/vouchers/')&&pathname.endsWith('/trash')&&req.method==='POST'){
    const id=Number(pathname.split('/')[3]);
    if(mysqlPool){
      try{await mysqlPool.query("UPDATE vouchers SET status=8 WHERE id=?",[id]); ok(res,{ok:true});}
      catch(e){const it=state.vouchers.find(v=>v.id===id); if(it){it.status=8; ok(res,{ok:true});} else {bad(res,404,'not_found');}}
    }else{const it=state.vouchers.find(v=>v.id===id); if(it){it.status=8; ok(res,{ok:true});} else {bad(res,404,'not_found');}}
    return;
  }
  if(pathname==='/api/vouchers/trash'&&req.method==='GET'){
    const page=Number(query?.page||1); const size=Math.max(1,Math.min(200, Number(query?.pageSize||50))); const offset=(page-1)*size;
    if(mysqlPool){
      try{const [rows]=await mysqlPool.query("SELECT id, number, date, type, status FROM vouchers WHERE status=8 ORDER BY id DESC LIMIT ? OFFSET ?",[size, offset]); ok(res,{items:rows.map(r=>({id:r.id,number:r.number,date:r.date?.toISOString?.().slice(0,10)||r.date,type:r.type,status:r.status})), page, pageSize:size});}
      catch(e){const all=(state.vouchers||[]).filter(v=>v.status===8); ok(res,{items:all.slice(offset, offset+size), page, pageSize:size})}
    }else{const all=(state.vouchers||[]).filter(v=>v.status===8); ok(res,{items:all.slice(offset, offset+size), page, pageSize:size})}
    return;
  }
  if(pathname?.startsWith('/api/vouchers/')&&pathname.endsWith('/restore')&&req.method==='POST'){
    const id=Number(pathname.split('/')[3]);
    if(mysqlPool){
      try{await mysqlPool.query("UPDATE vouchers SET status=0 WHERE id=?",[id]); ok(res,{ok:true});}
      catch(e){const it=state.vouchers.find(v=>v.id===id); if(it){it.status=0; ok(res,{ok:true});} else {bad(res,404,'not_found');}}
    }else{const it=state.vouchers.find(v=>v.id===id); if(it){it.status=0; ok(res,{ok:true});} else {bad(res,404,'not_found');}}
    return;
  }
  if(pathname==='/api/vouchers/summary'&&req.method==='GET'){
    const start=query?.start; const end=query?.end; const groupBy=query?.groupBy; const page=Number(query?.page||1); const size=Math.max(1,Math.min(200, Number(query?.pageSize||50))); const offset=(page-1)*size;
    if(mysqlPool){
      try{
        const params=[]; let where='';
        if(start&&end){where='WHERE v.date BETWEEN ? AND ?'; params.push(start,end);} else if(start){where='WHERE v.date>=?'; params.push(start);} else if(end){where='WHERE v.date<=?'; params.push(end);} 
        if(groupBy==='type'){
          const [rows]=await mysqlPool.query(`SELECT d, type, SUM(sum_debit) AS sum_debit, SUM(sum_credit) AS sum_credit FROM (
            SELECT DATE_FORMAT(v.date,'%Y-%m-%d') AS d, v.type as type, IFNULL(ln.debit,0) AS sum_debit, IFNULL(ln.credit,0) AS sum_credit
            FROM vouchers v JOIN voucher_lines ln ON ln.voucher_id=v.id ${where}
          ) t GROUP BY d, type ORDER BY d DESC, type LIMIT ? OFFSET ?`,[...params,size,offset]);
          ok(res,{items:rows, page, pageSize:size});
        }else if(groupBy==='account'){
          const [rows]=await mysqlPool.query(`SELECT d, account_code, SUM(sum_debit) AS sum_debit, SUM(sum_credit) AS sum_credit FROM (
            SELECT DATE_FORMAT(v.date,'%Y-%m-%d') AS d, ln.account_code as account_code, IFNULL(ln.debit,0) AS sum_debit, IFNULL(ln.credit,0) AS sum_credit
            FROM vouchers v JOIN voucher_lines ln ON ln.voucher_id=v.id ${where}
          ) t GROUP BY d, account_code ORDER BY d DESC, account_code LIMIT ? OFFSET ?`,[...params,size,offset]);
          ok(res,{items:rows, page, pageSize:size});
        }else{
          const [rows]=await mysqlPool.query(`SELECT d, SUM(sum_debit) AS sum_debit, SUM(sum_credit) AS sum_credit FROM (
            SELECT DATE_FORMAT(v.date,'%Y-%m-%d') AS d, IFNULL(ln.debit,0) AS sum_debit, IFNULL(ln.credit,0) AS sum_credit
            FROM vouchers v JOIN voucher_lines ln ON ln.voucher_id=v.id ${where}
          ) t GROUP BY d ORDER BY d DESC LIMIT ? OFFSET ?`,[...params,size,offset]);
          ok(res,{items:rows, page, pageSize:size});
        }
      }catch(e){
        const m=new Map(); (state.vouchers||[]).forEach(v=>{const d=v.date; if(start&&d<start)return; if(end&&d>end)return; const sums=(v.lines||[]).reduce((acc,l)=>{acc.debit+=(Number(l.debit)||0); acc.credit+=(Number(l.credit)||0); return acc;},{debit:0,credit:0}); if(groupBy==='type'){const key=`${d}|${v.type||''}`; const cur=m.get(key)||{sum_debit:0,sum_credit:0,type:(v.type||'')}; m.set(key,{sum_debit:cur.sum_debit+sums.debit,sum_credit:cur.sum_credit+sums.credit,type:(v.type||'')});} else if(groupBy==='account'){(v.lines||[]).forEach(ln=>{const key=`${d}|${ln.account_code||''}`; const cur=m.get(key)||{sum_debit:0,sum_credit:0,account_code:(ln.account_code||'')}; m.set(key,{sum_debit:cur.sum_debit+(Number(ln.debit)||0), sum_credit:cur.sum_credit+(Number(ln.credit)||0), account_code:(ln.account_code||'')});});} else {const cur=m.get(d)||{sum_debit:0,sum_credit:0}; m.set(d,{sum_debit:cur.sum_debit+sums.debit,sum_credit:cur.sum_credit+sums.credit});}}); const all=(groupBy==='type'?Array.from(m.entries()).map(([k,val])=>({d:k.split('|')[0], type:val.type, sum_debit:val.sum_debit, sum_credit:val.sum_credit})):(groupBy==='account'?Array.from(m.entries()).map(([k,val])=>({d:k.split('|')[0], account_code:val.account_code, sum_debit:val.sum_debit, sum_credit:val.sum_credit})):Array.from(m.entries()).map(([d,val])=>({d, ...val})))).sort((a,b)=>b.d.localeCompare(a.d)); ok(res,{items:all.slice(offset,offset+size), page, pageSize:size});
      }
    }else{
      const m=new Map(); (state.vouchers||[]).forEach(v=>{const d=v.date; if(start&&d<start)return; if(end&&d>end)return; const sums=(v.lines||[]).reduce((acc,l)=>{acc.debit+=(Number(l.debit)||0); acc.credit+=(Number(l.credit)||0); return acc;},{debit:0,credit:0}); if(groupBy==='type'){const key=`${d}|${v.type||''}`; const cur=m.get(key)||{sum_debit:0,sum_credit:0,type:(v.type||'')}; m.set(key,{sum_debit:cur.sum_debit+sums.debit,sum_credit:cur.sum_credit+sums.credit,type:(v.type||'')});} else if(groupBy==='account'){(v.lines||[]).forEach(ln=>{const key=`${d}|${ln.account_code||''}`; const cur=m.get(key)||{sum_debit:0,sum_credit:0,account_code:(ln.account_code||'')}; m.set(key,{sum_debit:cur.sum_debit+(Number(ln.debit)||0), sum_credit:cur.sum_credit+(Number(ln.credit)||0), account_code:(ln.account_code||'')});});} else {const cur=m.get(d)||{sum_debit:0,sum_credit:0}; m.set(d,{sum_debit:cur.sum_debit+sums.debit,sum_credit:cur.sum_credit+sums.credit});}}); const all=(groupBy==='type'?Array.from(m.entries()).map(([k,val])=>({d:k.split('|')[0], type:val.type, sum_debit:val.sum_debit, sum_credit:val.sum_credit})):(groupBy==='account'?Array.from(m.entries()).map(([k,val])=>({d:k.split('|')[0], account_code:val.account_code, sum_debit:val.sum_debit, sum_credit:val.sum_credit})):Array.from(m.entries()).map(([d,val])=>({d, ...val})))).sort((a,b)=>b.d.localeCompare(a.d)); ok(res,{items:all.slice(offset,offset+size), page, pageSize:size});
    }
    return;
  }
  if(pathname==='/api/vouchers/trash/batch'&&req.method==='POST'){
    const body=await getBody(req); const ids=(body?.ids||[]).map(Number).filter(Boolean); const action=body?.action;
    if(!ids.length||!['restore','purge'].includes(action)){bad(res,400,'invalid_body');return;}
    if(mysqlPool){
      try{
        const conn=await mysqlPool.getConnection();
        try{
          await conn.beginTransaction();
          if(action==='restore'){
            await conn.query(`UPDATE vouchers SET status=0 WHERE id IN (${ids.map(()=>'?').join(',')})`, ids);
          }else{
            await conn.query(`DELETE FROM voucher_lines WHERE voucher_id IN (${ids.map(()=>'?').join(',')})`, ids);
            await conn.query(`DELETE FROM vouchers WHERE id IN (${ids.map(()=>'?').join(',')})`, ids);
          }
          await conn.commit(); conn.release(); ok(res,{ok:true});
        }catch(e){await conn.rollback(); conn.release(); throw e;}
      }catch(e){
        if(action==='restore'){(state.vouchers||[]).forEach(v=>{if(ids.includes(v.id)) v.status=0;}); ok(res,{ok:true});}
        else{state.vouchers=state.vouchers.filter(v=>!ids.includes(v.id)); ok(res,{ok:true});}
      }
    }else{
      if(action==='restore'){(state.vouchers||[]).forEach(v=>{if(ids.includes(v.id)) v.status=0;}); ok(res,{ok:true});}
      else{state.vouchers=state.vouchers.filter(v=>!ids.includes(v.id)); ok(res,{ok:true});}
    }
    return;
  }
  if(pathname?.startsWith('/api/vouchers/')&&req.method==='DELETE'){
    const id=Number(pathname.split('/').pop());
    if(mysqlPool){
      try{const conn=await mysqlPool.getConnection(); try{await conn.beginTransaction(); await conn.query("DELETE FROM voucher_lines WHERE voucher_id=?",[id]); await conn.query("DELETE FROM vouchers WHERE id=?",[id]); await conn.commit(); conn.release(); ok(res,{ok:true});}catch(e){await conn.rollback(); conn.release(); throw e;}}
      catch(e){const idx=state.vouchers.findIndex(v=>v.id===id); if(idx>-1){state.vouchers.splice(idx,1); ok(res,{ok:true});} else {bad(res,404,'not_found');}}
    }else{const idx=state.vouchers.findIndex(v=>v.id===id); if(idx>-1){state.vouchers.splice(idx,1); ok(res,{ok:true});} else {bad(res,404,'not_found');}}
    return;
  }
  bad(res,404,'not_found');
};
const server=http.createServer((req,res)=>{routes(req,res);});
server.listen(3000,'0.0.0.0');
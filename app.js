const state={user:null,code:null,tabs:[],activeTab:null,token:null,menu:null};
const API='http://localhost:3000';
const defaultMenu={
  "凭证":["新增凭证","查看凭证","凭证汇总表","凭证回收站"],
  "账簿":["总账","明细账","余额表","序时账","多栏账","科目辅助明细账","科目辅助余额表","辅助核算明细账","辅助核算余额表"],
  "报表":["资产负债表","利润表","现金流量表"],
  "结账":["期末结转","结账"],
  "设置":["科目期初","辅助核算","计量单位","币种设置","凭证类型","凭证配置","账套管理","财税设置","权限管理","备份恢复","现金流量科目对照","归档管理","操作日志"]
};
const el=id=>document.getElementById(id);
const api=async(path,opts={})=>{
  const h=opts.headers||{}; if(state.token) h['Authorization']=`Bearer ${state.token}`; h['Content-Type']=h['Content-Type']||'application/json';
  const r=await fetch(`${API}${path}`,{...opts,headers:h});
  if(!r.ok) throw new Error('error'); return r.json();
};
const show=(x)=>x.classList.remove("hidden");
const hide=(x)=>x.classList.add("hidden");
const setActiveTab=(tabId)=>{state.activeTab=tabId;renderTabs();renderContent();};
const addTab=(title)=>{
  const id=title;
  if(!state.tabs.find(t=>t.id===id)){state.tabs.push({id,title});}
  setActiveTab(id);
};
const closeTab=(id)=>{
  const idx=state.tabs.findIndex(t=>t.id===id);
  if(idx>-1){state.tabs.splice(idx,1);}
  if(state.activeTab===id){state.activeTab=state.tabs.length?state.tabs[state.tabs.length-1].id:null;}
  renderTabs();renderContent();
};
const renderSidebar=()=>{
  const s=el("sidebar");
  s.innerHTML="";
  const m=state.menu||defaultMenu;
  Object.entries(m).forEach(([group,items])=>{
    const g=document.createElement("div");g.className="menu-group";
    const t=document.createElement("div");t.className="menu-title";
    const label=document.createElement("span");label.textContent=group;
    const caret=document.createElement("span");caret.textContent="▶";
    t.appendChild(label); t.appendChild(caret);
    const box=document.createElement("div");
    items.forEach(it=>{const a=document.createElement("div");a.className="menu-item";a.textContent=it;a.onclick=()=>addTab(it);box.appendChild(a);});
    box.style.display="none";
    g.onmouseenter=()=>{box.style.display="block"; caret.textContent="▼";};
    g.onmouseleave=()=>{box.style.display="none"; caret.textContent="▶";};
    g.appendChild(t); g.appendChild(box);
    s.appendChild(g);
  });
};
const renderTabs=()=>{
  const t=el("tabs");
  t.innerHTML="";
  state.tabs.forEach(tab=>{
    const b=document.createElement("div");b.className="tab";if(state.activeTab===tab.id)b.classList.add("active");
    const span=document.createElement("span");span.textContent=tab.title;b.appendChild(span);
    b.onclick=()=>setActiveTab(tab.id);
    const c=document.createElement("button");c.className="close";c.textContent="×";c.onclick=(e)=>{e.stopPropagation();closeTab(tab.id);};
    b.appendChild(c);
    t.appendChild(b);
  });
};
const renderContent=()=>{
  const c=el("tab-content");
  if(!state.activeTab){c.innerHTML="";return;}
  const p=document.createElement("div");p.className="panel";
  const h=document.createElement("h2");h.textContent=state.activeTab;p.appendChild(h);
  if(state.activeTab==="新增凭证"){renderCreateVoucher(p);} else if(state.activeTab==="查看凭证"){renderVoucherList(p);} else if(state.activeTab==="凭证回收站"){renderVoucherTrash(p);} else if(state.activeTab==="凭证汇总表"){renderVoucherSummary(p);} else if(state.activeTab.startsWith('凭证详情#')){const id=Number(state.activeTab.split('#')[1]); renderVoucherDetail(p,id);} else {
    const d=document.createElement("div");d.textContent="页面内容待接入数据与服务";p.appendChild(d);
  }
  c.innerHTML="";c.appendChild(p);
};
const renderCreateVoucher=(root)=>{
  const form=document.createElement('div');form.style.display='grid';form.style.gridTemplateColumns='1fr 1fr';form.style.gap='12px';
  const date=document.createElement('input');date.type='date';date.value=new Date().toISOString().slice(0,10);
  const type=document.createElement('input');type.placeholder='类型';type.value='记账';
  const linesBox=document.createElement('div');linesBox.style.gridColumn='1/3';
  const addBtn=document.createElement('button');addBtn.className='secondary';addBtn.textContent='添加分录';
  const sumBox=document.createElement('div');sumBox.style.gridColumn='1/3';
  const btn=document.createElement('button');btn.className='primary';btn.textContent='提交';
  const err=document.createElement('div');err.className='error';
  form.append(date,type,linesBox,addBtn,sumBox,btn,err);
  root.appendChild(form);
  const rows=[];
  const addRow=(a,d,c)=>{
    const row=document.createElement('div');row.style.display='grid';row.style.gridTemplateColumns='2fr 1fr 1fr auto';row.style.gap='8px';row.style.margin='8px 0';
    const account=document.createElement('input');account.placeholder='科目';account.value=a||'';
    const debit=document.createElement('input');debit.type='number';debit.placeholder='借方';debit.value=d||'';
    const credit=document.createElement('input');credit.type='number';credit.placeholder='贷方';credit.value=c||'';
    const remove=document.createElement('button');remove.className='secondary';remove.textContent='删除';
    remove.onclick=()=>{linesBox.removeChild(row);const idx=rows.indexOf(row);if(idx>-1)rows.splice(idx,1);updateSum();};
    row.append(account,debit,credit,remove); rows.push(row); linesBox.appendChild(row); updateSum();
  };
  const updateSum=()=>{
    const lines=rows.map(r=>({account_code:r.children[0].value,debit:Number(r.children[1].value)||0,credit:Number(r.children[2].value)||0}));
    const dsum=lines.reduce((a,b)=>a+b.debit,0);const csum=lines.reduce((a,b)=>a+b.credit,0);
    sumBox.textContent=`借方合计：${dsum.toFixed(2)}  借方合计：${csum.toFixed(2)}`;
  };
  addBtn.onclick=()=>addRow();
  addRow('1001','100','0'); addRow('2001','0','100');
  btn.onclick=async()=>{
    const lines=rows.map(r=>({account_code:r.children[0].value,debit:Number(r.children[1].value)||0,credit:Number(r.children[2].value)||0}));
    const dsum=lines.reduce((a,b)=>a+b.debit,0);const csum=lines.reduce((a,b)=>a+b.credit,0);
    if(lines.length<2){err.textContent='至少两条分录';return;}
    if(Number(dsum.toFixed(2))!==Number(csum.toFixed(2))){err.textContent='借贷不平衡';return;}
    try{await api('/api/vouchers',{method:'POST',body:JSON.stringify({date:date.value,type:type.value,lines})}); addTab('查看凭证'); setActiveTab('查看凭证');}
    catch(e){err.textContent='提交失败';}
  };
};
const renderVoucherList=async(root)=>{
  const list=document.createElement('div');
  const filters=document.createElement('div');
  const start=document.createElement('input'); start.type='date';
  const end=document.createElement('input'); end.type='date';
  const type=document.createElement('input'); type.placeholder='类型';
  const number=document.createElement('input'); number.placeholder='编号';
  const amountMin=document.createElement('input'); amountMin.type='number'; amountMin.placeholder='金额下限'; amountMin.style.width='100px';
  const amountMax=document.createElement('input'); amountMax.type='number'; amountMax.placeholder='金额上限'; amountMax.style.width='100px';
  const pageSize=document.createElement('select'); ['20','50','100'].forEach(v=>{const o=document.createElement('option'); o.value=v; o.textContent=v; pageSize.appendChild(o);}); pageSize.value='50';
  const prev=document.createElement('button'); prev.className='secondary'; prev.textContent='上一页';
  const next=document.createElement('button'); next.className='secondary'; next.textContent='下一页';
  const btn=document.createElement('button'); btn.className='secondary'; btn.textContent='筛选';
  const exportBtn=document.createElement('button');exportBtn.className='secondary';exportBtn.textContent='导出CSV';
  const info=document.createElement('div'); info.style.margin='4px 0';
  const pageInput=document.createElement('input'); pageInput.type='number'; pageInput.style.width='80px'; pageInput.placeholder='页码';
  const goBtn=document.createElement('button'); goBtn.className='secondary'; goBtn.textContent='跳转';
  filters.style.display='flex'; filters.style.gap='8px'; filters.style.margin='8px 0'; filters.append(start,end,type,number,amountMin,amountMax,pageSize,btn,prev,next,pageInput,goBtn,exportBtn); list.appendChild(filters); list.appendChild(info);
  exportBtn.onclick=async()=>{try{const r=await fetch(`${API}/api/vouchers/export`); const t=await r.text(); const blob=new Blob([t],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); const s=start.value||'all'; const e=end.value||'all'; const tpe=(type.value||'all'); const num=(number.value||'all'); const min=(amountMin.value||'any'); const max=(amountMax.value||'any'); a.download=`voucher_list_${s}_to_${e}_type-${tpe}_no-${num}_amt-${min}-${max}.csv`; a.click();}catch(e){}}
  const table=document.createElement('table');table.style.width='100%';table.border='1';
  const thead=document.createElement('thead');const trh=document.createElement('tr');['编号','日期','类型','金额','分录数'].forEach(x=>{const th=document.createElement('th');th.textContent=x;trh.appendChild(th);});thead.appendChild(trh);table.appendChild(thead);
  const tbody=document.createElement('tbody');
  let page=1;
  let total=0;
  const applyPrefilters=()=>{
    if(window.preFilters){
      const pf=window.preFilters; start.value=pf.start||start.value; end.value=pf.end||end.value; type.value=pf.type||type.value; number.value=pf.number||number.value; amountMin.value=pf.amountMin!=null?String(pf.amountMin):amountMin.value; amountMax.value=pf.amountMax!=null?String(pf.amountMax):amountMax.value; window.preFilters=undefined; page=1;
    }
  };
  const reload=async()=>{
    tbody.innerHTML=''; const qs=new URLSearchParams(); if(start.value)qs.set('start',start.value); if(end.value)qs.set('end',end.value); if(type.value)qs.set('type',type.value); if(number.value)qs.set('number',number.value); if(amountMin.value)qs.set('amountMin',String(Number(amountMin.value))); if(amountMax.value)qs.set('amountMax',String(Number(amountMax.value))); qs.set('page',String(page)); qs.set('pageSize',String(Number(pageSize.value)||50));
    try{const data=await api(`/api/vouchers?${qs.toString()}`); total=Number(data.total||0); const pages=Math.max(1,Math.ceil(total/(Number(pageSize.value)||50))); info.textContent=`总数：${total} 当前页：${page} 总页数：${pages}`; (data.items||[]).forEach(v=>{const tr=document.createElement('tr'); const tds=[v.number,v.date,v.type,Number(v.sum_debit||0).toFixed(2),(v.lines_count??(v.lines?v.lines.length:0))]; tds.forEach(val=>{const td=document.createElement('td');td.textContent=String(val??'');tr.appendChild(td);}); tr.style.cursor='pointer'; tr.title='点击查看详情'; tr.onclick=()=>{addTab(`凭证详情#${v.id}`); setActiveTab(`凭证详情#${v.id}`);}; tbody.appendChild(tr);});}
    catch(e){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=5;td.textContent='加载失败';tr.appendChild(td);tbody.appendChild(tr);} 
  };
  btn.onclick=()=>{page=1; reload();}; prev.onclick=()=>{page=Math.max(1,page-1); reload();}; next.onclick=()=>{const pages=Math.max(1,Math.ceil(total/(Number(pageSize.value)||50))); page=Math.min(pages,page+1); reload();}; goBtn.onclick=()=>{const p=Number(pageInput.value||'1'); const pages=Math.max(1,Math.ceil(total/(Number(pageSize.value)||50))); page=Math.min(pages,Math.max(1,p)); reload();}; pageSize.onchange=()=>{page=1; reload();};
  applyPrefilters();
  await reload();
  table.appendChild(tbody); list.appendChild(table); root.appendChild(list);
};
const renderVoucherDetail=async(root, id)=>{
  try{const v=await api(`/api/vouchers/${id}`);
    const h=document.createElement('div');h.textContent=`编号：${v.number} 日期：${v.date} 类型：${v.type}`; root.appendChild(h);
    const actions=document.createElement('div'); const voidBtn=document.createElement('button'); voidBtn.className='secondary'; voidBtn.textContent='作废'; const delBtn=document.createElement('button'); delBtn.className='secondary'; delBtn.textContent='删除'; actions.style.margin='8px 0'; actions.append(voidBtn,delBtn); root.appendChild(actions);
    voidBtn.onclick=async()=>{try{await api(`/api/vouchers/${id}/void`,{method:'POST'}); setActiveTab('查看凭证');}catch(e){}}
    delBtn.onclick=async()=>{try{await api(`/api/vouchers/${id}/trash`,{method:'POST'}); addTab('凭证回收站'); setActiveTab('凭证回收站');}catch(e){}}
    const table=document.createElement('table');table.style.width='100%';table.border='1';
    const thead=document.createElement('thead');const trh=document.createElement('tr');['行号','科目','摘要','借方','贷方'].forEach(x=>{const th=document.createElement('th');th.textContent=x;trh.appendChild(th);});thead.appendChild(trh);table.appendChild(thead);
    const tbody=document.createElement('tbody');(v.lines||[]).forEach(ln=>{const tr=document.createElement('tr');[ln.line_no,ln.account_code,ln.description||'',ln.debit,ln.credit].forEach(val=>{const td=document.createElement('td');td.textContent=String(val??'');tr.appendChild(td);});tbody.appendChild(tr);});
    table.appendChild(tbody); root.appendChild(table);
  }catch(e){const d=document.createElement('div');d.textContent='加载详情失败'; root.appendChild(d);} 
};
const loginSuccess=(user)=>{
  state.user=user;
  localStorage.setItem('user', user||'');
  localStorage.setItem('token', state.token||'');
  window.location.href='/center.html';
};
const loadMenu=async()=>{
  try{const r=await fetch(`${API}/api/menu`);if(r.ok){const data=await r.json();state.menu=data.menu;}else{state.menu=defaultMenu;}}
  catch(e){state.menu=defaultMenu;}
  renderSidebar();
};
const initLogin=()=>{
  const tabs=document.querySelectorAll(".login-tabs .tab");
  const passwordForm=el("password-form");
  const phoneForm=el("phone-form");
  tabs.forEach(btn=>{btn.onclick=()=>{tabs.forEach(x=>x.classList.remove("active"));btn.classList.add("active");const k=btn.dataset.tab;passwordForm.classList.toggle("active",k==="password");phoneForm.classList.toggle("active",k==="phone");};});
  const toCode=el("to-code-login"); if(toCode){toCode.onclick=()=>{passwordForm.classList.remove("active"); phoneForm.classList.add("active"); const t=[...tabs].find(x=>x.dataset.tab==='phone'); if(t){tabs.forEach(x=>x.classList.remove('active')); t.classList.add('active');}}}
  const toPwd=el("to-password-login"); if(toPwd){toPwd.onclick=()=>{phoneForm.classList.remove("active"); passwordForm.classList.add("active"); const t=[...tabs].find(x=>x.dataset.tab==='password'); if(t){tabs.forEach(x=>x.classList.remove('active')); t.classList.add('active');}}}
  const toPwd2=el("to-password-login2"); if(toPwd2){toPwd2.onclick=()=>{phoneForm.classList.remove("active"); passwordForm.classList.add("active"); const t=[...tabs].find(x=>x.dataset.tab==='password'); if(t){tabs.forEach(x=>x.classList.remove('active')); t.classList.add('active');}}}
  el("password-login-btn").onclick=async()=>{
    const u=el("username").value||"admin";const p=el("password").value||"123456";
    try{const r=await fetch(`${API}/api/login`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({username:u,password:p})});
      if(r.ok){const data=await r.json();state.token=data.token;loginSuccess(data.user);el("password-error").textContent="";}else{el("password-error").textContent="用户名或密码错误";}}
    catch(e){el("password-error").textContent="网络错误";}
  };
  el("send-code-btn").onclick=async()=>{
    const phone=el("phone").value; if(!phone){el("code-hint").textContent="请输入手机号";return;}
    try{const r=await fetch(`${API}/api/send-code`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone})});
      if(r.ok){const data=await r.json();state.code=data.code;el("code-hint").textContent=`验证码已发送：${data.code}`;}else{el("code-hint").textContent="发送失败";}}
    catch(e){el("code-hint").textContent="网络错误";}
  };
  el("phone-login-btn").onclick=async()=>{
    const phone=el("phone").value;const code=el("code").value;
    try{const r=await fetch(`${API}/api/login/sms`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({phone,code})});
      if(r.ok){const data=await r.json();state.token=data.token;loginSuccess(data.user);el("phone-error").textContent="";}else{el("phone-error").textContent="手机号或验证码错误";}}
    catch(e){el("phone-error").textContent="网络错误";}
  };
  const logoutBtn=el("logout-btn"); if(logoutBtn){logoutBtn.onclick=()=>{state.user=null;state.tabs=[];state.activeTab=null;state.token=null;state.menu=null;localStorage.removeItem('user'); localStorage.removeItem('token'); window.location.href='/';};}
};
const initMain=()=>{
  const u=localStorage.getItem('user'); const t=localStorage.getItem('token');
  if(!u||!t){window.location.href='/'; return;}
  state.user=u; state.token=t; const cu=el('current-user'); if(cu) cu.textContent=u;
  loadMenu(); renderTabs(); renderContent();
};
if(document.getElementById('login-view')){initLogin();}
else{initMain();}
const renderVoucherTrash=async(root)=>{
  const list=document.createElement('div');
  const actions=document.createElement('div');
  const batchRestore=document.createElement('button');batchRestore.className='secondary';batchRestore.textContent='批量恢复';
  const batchPurge=document.createElement('button');batchPurge.className='secondary';batchPurge.textContent='批量彻底删除';
  actions.style.margin='8px 0'; actions.append(batchRestore,batchPurge); list.appendChild(actions);
  const table=document.createElement('table');table.style.width='100%';table.border='1';
  const thead=document.createElement('thead');const trh=document.createElement('tr');['选择','编号','日期','类型','操作'].forEach(x=>{const th=document.createElement('th');th.textContent=x;trh.appendChild(th);});thead.appendChild(trh);table.appendChild(thead);
  const tbody=document.createElement('tbody');
  const selected=new Set();
  const reload=async()=>{
    tbody.innerHTML='';
    try{const data=await api('/api/vouchers/trash');(data.items||[]).forEach(v=>{const tr=document.createElement('tr');
      const tdSel=document.createElement('td');const cb=document.createElement('input');cb.type='checkbox';cb.checked=selected.has(v.id);cb.onchange=()=>{if(cb.checked)selected.add(v.id);else selected.delete(v.id);};tdSel.appendChild(cb);
      const td1=document.createElement('td');td1.textContent=v.number; const td2=document.createElement('td');td2.textContent=v.date; const td3=document.createElement('td');td3.textContent=v.type; const td4=document.createElement('td');
      const restore=document.createElement('button');restore.className='secondary';restore.textContent='恢复'; restore.onclick=async()=>{try{await api(`/api/vouchers/${v.id}/restore`,{method:'POST'}); setActiveTab('查看凭证');}catch(e){}};
      const purge=document.createElement('button');purge.className='secondary';purge.textContent='彻底删除'; purge.onclick=async()=>{try{await api(`/api/vouchers/${v.id}`,{method:'DELETE'}); reload();}catch(e){}};
      td4.append(restore,purge); tr.append(tdSel,td1,td2,td3,td4); tbody.appendChild(tr);
    });}
    catch(e){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=5;td.textContent='加载失败';tr.appendChild(td);tbody.appendChild(tr);} 
  };
  batchRestore.onclick=async()=>{if(!selected.size)return; try{await api('/api/vouchers/trash/batch',{method:'POST',body:JSON.stringify({ids:Array.from(selected),action:'restore'})}); setActiveTab('查看凭证');}catch(e){}};
  batchPurge.onclick=async()=>{if(!selected.size)return; try{await api('/api/vouchers/trash/batch',{method:'POST',body:JSON.stringify({ids:Array.from(selected),action:'purge'})}); reload();}catch(e){}};
  await reload();
  table.appendChild(tbody); list.appendChild(table); root.appendChild(list);
};
const renderVoucherSummary=async(root)=>{
  const list=document.createElement('div');
  const filters=document.createElement('div');
  const start=document.createElement('input'); start.type='date';
  const end=document.createElement('input'); end.type='date';
  const group=document.createElement('select'); const optDate=document.createElement('option'); optDate.value=''; optDate.textContent='按日期'; const optType=document.createElement('option'); optType.value='type'; optType.textContent='按类型'; const optAcc=document.createElement('option'); optAcc.value='account'; optAcc.textContent='按科目'; const optAccType=document.createElement('option'); optAccType.value='account_type'; optAccType.textContent='按科目+类型'; group.append(optDate,optType,optAcc,optAccType);
  const size=document.createElement('input'); size.type='number'; size.value='50'; size.style.width='80px';
  const btn=document.createElement('button'); btn.className='secondary'; btn.textContent='筛选';
  const exportBtn=document.createElement('button'); exportBtn.className='secondary'; exportBtn.textContent='导出CSV';
  filters.style.display='flex'; filters.style.gap='8px'; filters.style.margin='8px 0'; filters.append(start,end,group,size,btn,exportBtn); list.appendChild(filters);
  const table=document.createElement('table');table.style.width='100%';table.border='1';
  const thead=document.createElement('thead');const trh=document.createElement('tr'); table.appendChild(thead);
  const tbody=document.createElement('tbody');
  const reload=async()=>{
    tbody.innerHTML=''; thead.innerHTML=''; trh.innerHTML='';
    const headers=group.value==='type'?['日期','类型','借方合计','贷方合计']:(group.value==='account'?['日期','科目','借方合计','贷方合计']:(group.value==='account_type'?['日期','科目','类型','借方合计','贷方合计']:['日期','借方合计','贷方合计'])); headers.forEach(x=>{const th=document.createElement('th');th.textContent=x;trh.appendChild(th);}); thead.appendChild(trh);
    try{const qs=new URLSearchParams(); if(start.value)qs.set('start',start.value); if(end.value)qs.set('end',end.value); if(group.value)qs.set('groupBy',group.value); qs.set('page','1'); qs.set('pageSize',String(Number(size.value)||50)); const data=await api(`/api/vouchers/summary?${qs.toString()}`);
      const items=(data.items||[]);
      const map=new Map(); items.forEach(v=>{const arr=map.get(v.d)||[]; arr.push(v); map.set(v.d,arr);});
      Array.from(map.entries()).sort((a,b)=>b[0].localeCompare(a[0])).forEach(([d,rows])=>{
        const groupRows=[];
        rows.forEach(v=>{const tr=document.createElement('tr'); const row=group.value==='type'?[v.d,v.type,Number(v.sum_debit).toFixed(2),Number(v.sum_credit).toFixed(2)]:(group.value==='account'?[v.d,v.account_code,Number(v.sum_debit).toFixed(2),Number(v.sum_credit).toFixed(2)]:(group.value==='account_type'?[v.d,v.account_code,v.type,Number(v.sum_debit).toFixed(2),Number(v.sum_credit).toFixed(2)]:[v.d,Number(v.sum_debit).toFixed(2),Number(v.sum_credit).toFixed(2)])); row.forEach(val=>{const td=document.createElement('td');td.textContent=String(val);tr.appendChild(td);}); tr.style.cursor='pointer'; tr.title='查看当日凭证'; tr.onclick=()=>{window.preFilters={start:d,end:d,type:(group.value==='type'?v.type:undefined)}; addTab('查看凭证'); setActiveTab('查看凭证');}; groupRows.push(tr); tbody.appendChild(tr);});
        const dsum=rows.reduce((acc,x)=>acc+(Number(x.sum_debit)||0),0); const csum=rows.reduce((acc,x)=>acc+(Number(x.sum_credit)||0),0);
        const trTotal=document.createElement('tr'); const btn=document.createElement('button'); btn.className='secondary'; btn.textContent='收起'; btn.onclick=()=>{const hide=btn.textContent==='收起'; btn.textContent=hide?'展开':'收起'; groupRows.forEach(r=>{r.style.display=hide?'none':'';});};
        for(let i=0;i<headers.length;i++){const td=document.createElement('td'); if(i===0){td.appendChild(btn);} else if(i===headers.length-2){td.textContent=dsum.toFixed(2);} else if(i===headers.length-1){td.textContent=csum.toFixed(2);} trTotal.appendChild(td);} tbody.appendChild(trTotal);
      });
      const totalDebit=items.reduce((a,b)=>a+(Number(b.sum_debit)||0),0); const totalCredit=items.reduce((a,b)=>a+(Number(b.sum_credit)||0),0); const totals=document.createElement('tr'); for(let i=0;i<headers.length;i++){const td=document.createElement('td'); if(i===0){td.textContent='合计';} else if(i===headers.length-2){td.textContent=totalDebit.toFixed(2);} else if(i===headers.length-1){td.textContent=totalCredit.toFixed(2);} totals.appendChild(td);} tbody.appendChild(totals);
    } 
    catch(e){const tr=document.createElement('tr');const td=document.createElement('td');td.colSpan=3;td.textContent='加载失败';tr.appendChild(td);tbody.appendChild(tr);} 
  };
  btn.onclick=reload; exportBtn.onclick=async()=>{try{const qs=new URLSearchParams(); if(start.value)qs.set('start',start.value); if(end.value)qs.set('end',end.value); if(group.value)qs.set('groupBy',group.value); const r=await fetch(`${API}/api/vouchers/summary/export?${qs.toString()}`); const t=await r.text(); const blob=new Blob([t],{type:'text/csv;charset=utf-8'}); const a=document.createElement('a'); a.href=URL.createObjectURL(blob); const g=group.value||'date'; const s=start.value||'all'; const e=end.value||'all'; a.download=`voucher_summary_${g}_${s}_to_${e}.csv`; a.click();}catch(e){}}; await reload();
  table.appendChild(tbody); list.appendChild(table); root.appendChild(list);
};
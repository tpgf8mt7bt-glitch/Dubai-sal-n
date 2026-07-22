import { useState, useEffect, useCallback, useRef } from "react";

// ─── FIREBASE FIRESTORE REST API ─────────────────────────────────────────────
const FB_PROJECT = "odontologia-werbag";
const FB_API_KEY = "AIzaSyAtj2Cz9otET54WtKoSQk5KPPcQ7DOKbVw";
const FB_BASE = `https://firestore.googleapis.com/v1/projects/${FB_PROJECT}/databases/(default)/documents`;

const parseKey=k=>{const p=k.split(":");if(p.length===2)return{col:p[0],docId:p[1]};if(p.length===3)return{col:`${p[0]}__${p[1]}`,docId:p[2]};return{col:"misc",docId:k.replace(/:/g,"__")};};
const toFB=v=>({stringValue:JSON.stringify(v)});
const fromFB=f=>f?.stringValue??null;
const sGet=async k=>{try{const{col,docId}=parseKey(k);const r=await fetch(`${FB_BASE}/${col}/${docId}?key=${FB_API_KEY}`);if(!r.ok)return null;const d=await r.json();const v=fromFB(d?.fields?._v);return v===null?null:{value:v};}catch(e){return null;}};
const sSet=async(k,v)=>{try{const{col,docId}=parseKey(k);const body={fields:{_v:toFB(v),_k:{stringValue:k},_ts:{integerValue:String(Date.now())}}};const r=await fetch(`${FB_BASE}/${col}/${docId}?key=${FB_API_KEY}`,{method:"PATCH",headers:{"Content-Type":"application/json"},body:JSON.stringify(body)});if(!r.ok)throw new Error(await r.text());return{key:k};}catch(e){return null;}};
const sList=async prefix=>{try{const col=prefix.replace(/:$/,"").replace(/:/g,"__");const r=await fetch(`${FB_BASE}/${col}?key=${FB_API_KEY}`);if(!r.ok)return{keys:[]};const d=await r.json();return{keys:(d?.documents||[]).map(doc=>doc?.fields?._k?.stringValue||(col+":"+doc.name.split("/").pop()))};}catch(e){return{keys:[]};}};
const sDel=async k=>{try{const{col,docId}=parseKey(k);const r=await fetch(`${FB_BASE}/${col}/${docId}?key=${FB_API_KEY}`,{method:"DELETE"});return{key:k,deleted:r.ok};}catch(e){return null;}};

// ─── CONSTANTES ───────────────────────────────────────────────────────────────
const LOGO_B64 = "data:image/jpeg;base64,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qVkqpOVq22pSk6lZOpW2rbakq2pW2pWTqUoepWSqtkqmycmXbalJ2rJVqTlJrJUmttqTsqtsmslSa2Vq22rbJpKk6lZKqTlJpShqomTq2Umkq2rKTqVkqrbaspOpWTqVtqVk6lbJpWSqttqyk6ttq2yaVk6tsmlZOrZOpSVakqyaUlOpScqkq2rbJpWTqycqhqTplZKpVbaslSaUoaqJk6lJVqTlJrbalZOpWSqkqyqSlWpKkqrZOoidqVk6lZKaUpOpWHqVtq22rbatsmlJTqUnKpKsqk5Sa2ya2TqykqrZSaHtq22mVkqpW2lyVatsmiKCSlZOpSVak5WoeImttqVk6lYaqVk6lJ2pSVJpW2rZOpWyaVk6lYepWTq2yq22rbattq2SmlJyqTlakqTqUnJrbabbaXbaZWTpSKGqlJyqHiJrZOoihqpWTqVkqrbak5WpKSah5WpOVq2ya22rK2pOVqSpSaSrakq2rbJpWTqVkppSdqytq2yaVsOlZOm22l22rbattq22rKTplKTpSYaqUlWpKSJpKsmlKHqIoKpiZOlVk6tkqrZOpWSqkqyaVsmlbatk6lZOrKHqUlSZlJ2l2Vq22rbJrbJrbabbaXbattq22pSdq22rbattqyk6YmGqVSk6ttqyVakq2rbJrKyaVk6ZWTpVZOpWTqUoepWTqyk6lZKqSrattqSrasnatk6lZOm22rbaXbattq22rbattq22rbattq22rbaspOpWSqsoaqVkqrbattq22rJVq22rbattqSrakqSqttq2SqsnalJya22m22l22rZSa21vS2H1nVq3yrnrJl22rbattq22rbattq22rbattq22rbalZOpWTplKHpSJ2pWGqlZOpWTqVk6soaq2TqVk6spOpSdq22rbattq22rbattq93ofKxK2UlTKlSVCyVJErbVtsbZSa22rbatlJrbKpOVqSkiaTlak7YW21bbUrbVkqTSttSVJVSdtW21bbVlJIYasqhqSqtlJFtsbbYW21bbFttpdlav/2gAIAQEAAQUC/wDRQ3arnwai0t/D/gy9hvPD/hHa51bj9V9uxd/Vldu38CeHt4j3bwNuO3mWOSCR7LNsEMm3bV9X+8RS+E9hRaru/q6hHk9uuvAabS18L+D9ztb+z8CbPLu0+yTSva/BG4XUMvh7wft0Yu/q6RIjZfBN5DuH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";
const DUBAI_WA = "542216212549";
const DUBAI_DIR = "Calle 48 N°664 e/ 8 y 9, La Plata";
const DUBAI_SENDER = "Lili";

// ─── ESTILOS GLOBALES ─────────────────────────────────────────────────────────
const ls={display:"block",fontSize:11,fontWeight:700,color:"#374151",marginBottom:4,textTransform:"uppercase",letterSpacing:0.5};
const is={width:"100%",padding:"9px 12px",borderRadius:8,border:"2px solid #e2e8f0",fontSize:13,color:"#1e293b",backgroundColor:"#fff",boxSizing:"border-box",outline:"none",fontFamily:"inherit"};
const btnPrimary={padding:"9px 18px",borderRadius:9,border:"none",background:"linear-gradient(135deg,#b8973e,#8a6d2f)",color:"#fff",fontWeight:700,fontSize:13,cursor:"pointer"};
const btnSecondary={padding:"9px 18px",borderRadius:9,border:"2px solid #e2e8f0",background:"#fff",color:"#64748b",fontWeight:600,fontSize:13,cursor:"pointer"};
const fmtARS=n=>Number(n).toLocaleString("es-AR",{minimumFractionDigits:0,maximumFractionDigits:0});

// ─── WHATSAPP HELPERS ─────────────────────────────────────────────────────────
const normalizePhone=p=>{let ph=(p||"").replace(/\D/g,"")||DUBAI_WA;if(ph&&!ph.startsWith("54")){ph=ph.startsWith("0")?"54"+ph.slice(1):"54"+ph;}return ph;};

const buildWAReminder=(clientPhone,clientName,date,time)=>{
  const[y,m,d]=date.split("-").map(Number);
  const dt=new Date(y,m-1,d);
  const dayName=dt.toLocaleDateString("es-AR",{weekday:"long"});
  const dateStr=dt.toLocaleDateString("es-AR",{day:"numeric",month:"long"});
  const msg=`Hola ${clientName||""}! 😊 Soy ${DUBAI_SENDER} de Dubai Salón de Belleza 💅\nTe recuerdo que tenés turno el ${dayName} ${dateStr} a las ${time}hs. ⏰\nPor favor confirmá tu asistencia. ✅\n📍 ${DUBAI_DIR}\n¡Te esperamos! ✨`;
  return `https://wa.me/${normalizePhone(clientPhone)}?text=${encodeURIComponent(msg)}`;
};

const buildWAPromo=(clientPhone,clientName,lastVisit,promo)=>{
  const msg=`Hola ${clientName||""}! 😊 Soy ${DUBAI_SENDER} de Dubai Salón de Belleza 💅\nHace un tiempo que no te vemos y te extrañamos! 🌟\n${promo||"Tenemos novedades y promociones esperándote."}\nComunicate para reservar tu turno. 📅\n📍 ${DUBAI_DIR}\n¡Te esperamos! ✨`;
  return `https://wa.me/${normalizePhone(clientPhone)}?text=${encodeURIComponent(msg)}`;
};

// ─── CONFIRM MODAL ─────────────────────────────────────────────────────────────
function ConfirmModal({msg,onOk,onCancel}){
  return(<div style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.55)",zIndex:5000,display:"flex",alignItems:"center",justifyContent:"center",padding:16}}>
    <div style={{backgroundColor:"#fff",borderRadius:16,padding:28,width:"100%",maxWidth:380,boxShadow:"0 20px 60px rgba(0,0,0,0.25)",textAlign:"center"}}>
      <div style={{fontSize:36,marginBottom:12}}>⚠️</div>
      <div style={{fontSize:15,color:"#1e293b",fontWeight:600,marginBottom:20,lineHeight:1.5}}>{msg}</div>
      <div style={{display:"flex",gap:10}}>
        <button onClick={onCancel} style={{flex:1,padding:"11px",borderRadius:10,border:"2px solid #e2e8f0",backgroundColor:"#fff",color:"#64748b",fontWeight:700,fontSize:14,cursor:"pointer"}}>Cancelar</button>
        <button onClick={onOk} style={{flex:1,padding:"11px",borderRadius:10,border:"none",backgroundColor:"#ef4444",color:"#fff",fontWeight:700,fontSize:14,cursor:"pointer"}}>Eliminar</button>
      </div>
    </div>
  </div>);
}

// ─── SIDEBAR NAVIGATION ───────────────────────────────────────────────────────
const VIEWS=["inicio","clientes","servicios","agenda","cobros","estadisticas"];
const VIEW_LABELS={"inicio":"🏠 Inicio","clientes":"👤 Clientes","servicios":"💅 Servicios","agenda":"📅 Agenda","cobros":"💰 Cobros","estadisticas":"📊 Estadísticas"};

// ─── FICHA CLIENTE ────────────────────────────────────────────────────────────
function ClientForm({client,onChange}){
  const f=(label,key,ph="",type="text")=>(
    <div>
      <label style={ls}>{label}</label>
      <input type={type} value={client[key]||""} placeholder={ph}
        onChange={e=>onChange({...client,[key]:e.target.value})}
        style={is} onFocus={e=>e.target.style.borderColor="#b8973e"} onBlur={e=>e.target.style.borderColor="#e2e8f0"}/>
    </div>
  );
  return(
    <div style={{display:"flex",flexDirection:"column",gap:12}}>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:12}}>
        {f("Nombre","firstName","María")}
        {f("Apellido","lastName","García")}
        {f("Teléfono / WhatsApp","phone","2216000000","tel")}
        {f("Email","email","mail@ejemplo.com","email")}
        {f("Fecha de nacimiento","birthDate","","date")}
        {f("Instagram","instagram","@usuario")}
      </div>
      <div>
        <label style={ls}>Notas / Alergias / Productos preferidos</label>
        <textarea value={client.notes||""} onChange={e=>onChange({...client,notes:e.target.value})}
          placeholder="Ej: alérgica al níquel, prefiere esmalte semipermanente, piel sensible..."
          rows={3} style={{...is,resize:"vertical",fontFamily:"inherit"}}/>
      </div>
    </div>
  );
}

// ─── HISTORIAL ESTÉTICO ────────────────────────────────────────────────────────
function HistoryPanel({client,onChange,services,onGoToCobros}){
  const [showForm,setShowForm]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const emptyEntry=()=>({date:new Date().toISOString().slice(0,10),serviceId:"",customService:"",price:"",notes:"",professional:""});
  const [entry,setEntry]=useState(emptyEntry());
  const [confirmDel,setConfirmDel]=useState(null);
  const history=client.history||[];

  const openNew=()=>{setEntry(emptyEntry());setEditingId(null);setShowForm(true);};
  const openEdit=e=>{setEntry({date:e.date,serviceId:e.serviceId||"",customService:e.customService||"",price:e.price||"",notes:e.notes||"",professional:e.professional||""});setEditingId(e.id);setShowForm(true);};
  const cancel=()=>{setShowForm(false);setEditingId(null);setEntry(emptyEntry());};

  const save=()=>{
    if(!entry.serviceId&&!entry.customService) return;
    const sel=services.find(s=>s.id===entry.serviceId);
    const newEntry={...entry,id:editingId||Date.now().toString(),serviceName:sel?.name||entry.customService,createdAt:new Date().toISOString()};
    const newHistory=editingId?history.map(h=>h.id===editingId?newEntry:h):[newEntry,...history];
    onChange({...client,history:newHistory,updatedAt:new Date().toISOString()});
    cancel();
    // Si es entrada nueva (no edición), redirigir a cobros
    if(!editingId&&onGoToCobros) onGoToCobros();
  };
  const del=id=>setConfirmDel({msg:"¿Eliminar esta entrada del historial?",onOk:()=>{setConfirmDel(null);onChange({...client,history:history.filter(h=>h.id!==id),updatedAt:new Date().toISOString()});}});

  const selectedService=services.find(s=>s.id===entry.serviceId);

  return(
    <div>
      {confirmDel&&<ConfirmModal msg={confirmDel.msg} onOk={confirmDel.onOk} onCancel={()=>setConfirmDel(null)}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#1e293b"}}>✨ Historial de servicios</h3>
        {!showForm&&<button onClick={openNew} style={btnPrimary}>+ Nueva entrada</button>}
      </div>
      {showForm&&(
        <div style={{backgroundColor:"#faf9f6",borderRadius:12,padding:16,marginBottom:16,border:`1px solid ${editingId?"#b8973e":"#e2e8f0"}`}}>
          {editingId&&<div style={{fontSize:11,fontWeight:700,color:"#b8973e",marginBottom:10}}>✏️ Editando entrada</div>}
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div>
              <label style={ls}>Fecha</label>
              <input type="date" value={entry.date} onChange={e=>setEntry(v=>({...v,date:e.target.value}))} style={is}/>
            </div>
            <div>
              <label style={ls}>Profesional</label>
              <input value={entry.professional} onChange={e=>setEntry(v=>({...v,professional:e.target.value}))} placeholder="Nombre" style={is}/>
            </div>
            <div>
              <label style={ls}>Servicio</label>
              <select value={entry.serviceId} onChange={e=>{const s=services.find(x=>x.id===e.target.value);setEntry(v=>({...v,serviceId:e.target.value,price:s?.price||v.price}));}} style={{...is,padding:"9px 12px"}}>
                <option value="">— Seleccionar —</option>
                {services.map(s=><option key={s.id} value={s.id}>{s.name} {s.price?`($${fmtARS(s.price)})`:"" }</option>)}
                <option value="__custom">Otro (escribir)</option>
              </select>
            </div>
            {(entry.serviceId==="__custom"||!entry.serviceId)&&(
              <div>
                <label style={ls}>Servicio personalizado</label>
                <input value={entry.customService} onChange={e=>setEntry(v=>({...v,customService:e.target.value}))} placeholder="Ej: Diseño especial" style={is}/>
              </div>
            )}
            <div>
              <label style={ls}>Precio cobrado $</label>
              <input type="number" value={entry.price} onChange={e=>setEntry(v=>({...v,price:e.target.value}))} placeholder={selectedService?.price||"0"} style={is}/>
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <label style={ls}>Notas del servicio</label>
            <textarea value={entry.notes} onChange={e=>setEntry(v=>({...v,notes:e.target.value}))} placeholder="Color usado, técnica, observaciones..." rows={2} style={{...is,resize:"vertical",fontFamily:"inherit"}}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={cancel} style={btnSecondary}>Cancelar</button>
            <button onClick={save} disabled={!entry.serviceId&&!entry.customService}
              style={{...btnPrimary,flex:1,background:editingId?"linear-gradient(135deg,#d97706,#b45309)":undefined}}>
              {editingId?"✏️ Actualizar":"💾 Guardar"}
            </button>
          </div>
        </div>
      )}
      {history.length===0&&!showForm?(
        <div style={{padding:32,textAlign:"center",color:"#94a3b8",backgroundColor:"#faf9f6",borderRadius:12,border:"1px dashed #e2e8f0"}}>
          <div style={{fontSize:32,marginBottom:8}}>✨</div>
          <div style={{fontWeight:600}}>Sin servicios registrados aún</div>
        </div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:8}}>
          {history.map((h,i)=>(
            <div key={h.id} style={{backgroundColor:"#fff",borderRadius:10,padding:"12px 14px",border:"1px solid #e2e8f0",borderLeft:"4px solid #b8973e"}}>
              <div style={{display:"flex",alignItems:"flex-start",gap:10}}>
                <div style={{flex:1}}>
                  <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap",marginBottom:4}}>
                    <span style={{fontWeight:700,fontSize:13,color:"#1e293b"}}>{h.serviceName||h.customService}</span>
                    {h.price&&<span style={{fontSize:12,fontWeight:800,color:"#b8973e"}}>${fmtARS(h.price)}</span>}
                  </div>
                  <div style={{fontSize:11,color:"#64748b"}}>
                    {h.date}{h.professional&&` · ${h.professional}`}
                  </div>
                  {h.notes&&<div style={{fontSize:12,color:"#374151",marginTop:4,lineHeight:1.5}}>{h.notes}</div>}
                </div>
                <div style={{display:"flex",gap:4,flexShrink:0}}>
                  <button onClick={()=>openEdit(h)} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:6,cursor:"pointer",color:"#94a3b8",fontSize:13,padding:"3px 7px"}}>✏️</button>
                  <button onClick={()=>del(h.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16}}>🗑</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── PANEL DE SERVICIOS ───────────────────────────────────────────────────────
function ServicesPanel({services,onChange}){
  const [showForm,setShowForm]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const emptyS=()=>({name:"",description:"",price:"",category:""});
  const [form,setForm]=useState(emptyS());
  const [confirmDel,setConfirmDel]=useState(null);

  const CATS=["Uñas","Cejas y Pestañas","Depilación","Facial","Corporal","Otro"];

  const openNew=()=>{setForm(emptyS());setEditingId(null);setShowForm(true);};
  const openEdit=s=>{setForm({name:s.name,description:s.description||"",price:s.price||"",category:s.category||""});setEditingId(s.id);setShowForm(true);};
  const cancel=()=>{setShowForm(false);setEditingId(null);setForm(emptyS());};

  const save=()=>{
    if(!form.name.trim()) return;
    let newList;
    if(editingId) newList=services.map(s=>s.id===editingId?{...s,...form}:s);
    else newList=[...services,{...form,id:Date.now().toString()}];
    onChange(newList);
    cancel();
  };
  const del=id=>setConfirmDel({msg:"¿Eliminar este servicio?",onOk:()=>{setConfirmDel(null);onChange(services.filter(s=>s.id!==id));}});

  const byCategory={};
  services.forEach(s=>{const c=s.category||"Otro";if(!byCategory[c])byCategory[c]=[];byCategory[c].push(s);});

  return(
    <div style={{padding:20,maxWidth:700,margin:"0 auto"}}>
      {confirmDel&&<ConfirmModal msg={confirmDel.msg} onOk={confirmDel.onOk} onCancel={()=>setConfirmDel(null)}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:20}}>
        <div>
          <h2 style={{margin:0,fontSize:20,fontWeight:800,color:"#1e293b"}}>💅 Servicios</h2>
          <div style={{fontSize:13,color:"#64748b",marginTop:2}}>Lista de servicios y precios del salón</div>
        </div>
        {!showForm&&<button onClick={openNew} style={btnPrimary}>+ Nuevo servicio</button>}
      </div>

      {showForm&&(
        <div style={{backgroundColor:"#faf9f6",borderRadius:12,padding:16,marginBottom:20,border:`1px solid ${editingId?"#b8973e":"#e2e8f0"}`}}>
          <div style={{fontSize:12,fontWeight:700,color:editingId?"#b8973e":"#374151",marginBottom:12,textTransform:"uppercase"}}>
            {editingId?"✏️ Editando servicio":"Nuevo servicio"}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div style={{gridColumn:"1/-1"}}>
              <label style={ls}>Nombre del servicio</label>
              <input value={form.name} onChange={e=>setForm(f=>({...f,name:e.target.value}))} placeholder="Ej: Uñas gel con diseño" style={is}/>
            </div>
            <div>
              <label style={ls}>Categoría</label>
              <select value={form.category} onChange={e=>setForm(f=>({...f,category:e.target.value}))} style={{...is,padding:"9px 12px"}}>
                <option value="">— Sin categoría —</option>
                {CATS.map(c=><option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={ls}>Precio $</label>
              <input type="number" value={form.price} onChange={e=>setForm(f=>({...f,price:e.target.value}))} placeholder="0" style={is}/>
            </div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={ls}>Descripción (opcional)</label>
              <input value={form.description} onChange={e=>setForm(f=>({...f,description:e.target.value}))} placeholder="Descripción breve del servicio" style={is}/>
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={cancel} style={btnSecondary}>Cancelar</button>
            <button onClick={save} disabled={!form.name.trim()}
              style={{...btnPrimary,flex:1,opacity:!form.name.trim()?0.6:1,background:editingId?"linear-gradient(135deg,#d97706,#b45309)":undefined}}>
              {editingId?"✏️ Actualizar":"💾 Guardar"}
            </button>
          </div>
        </div>
      )}

      {services.length===0&&!showForm?(
        <div style={{padding:40,textAlign:"center",color:"#94a3b8",backgroundColor:"#faf9f6",borderRadius:12,border:"1px dashed #e2e8f0"}}>
          <div style={{fontSize:36,marginBottom:8}}>💅</div>
          <div style={{fontWeight:600}}>Cargá los servicios del salón</div>
          <div style={{fontSize:12,marginTop:4}}>Aparecerán al registrar servicios en el historial de cada cliente</div>
        </div>
      ):(
        Object.entries(byCategory).map(([cat,items])=>(
          <div key={cat} style={{marginBottom:20}}>
            <div style={{fontSize:12,fontWeight:700,color:"#b8973e",textTransform:"uppercase",letterSpacing:0.5,marginBottom:8,borderBottom:"1px solid #f1ead9",paddingBottom:6}}>{cat}</div>
            <div style={{display:"flex",flexDirection:"column",gap:6}}>
              {items.map(s=>(
                <div key={s.id} style={{backgroundColor:"#fff",borderRadius:10,padding:"12px 14px",border:"1px solid #e2e8f0",display:"flex",alignItems:"center",gap:12}}>
                  <div style={{flex:1}}>
                    <div style={{fontWeight:700,fontSize:13,color:"#1e293b"}}>{s.name}</div>
                    {s.description&&<div style={{fontSize:12,color:"#64748b",marginTop:2}}>{s.description}</div>}
                  </div>
                  {s.price&&<div style={{fontWeight:800,fontSize:15,color:"#b8973e",flexShrink:0}}>${fmtARS(s.price)}</div>}
                  <div style={{display:"flex",gap:4,flexShrink:0}}>
                    <button onClick={()=>openEdit(s)} style={{background:"none",border:"1px solid #e2e8f0",borderRadius:6,cursor:"pointer",color:"#94a3b8",fontSize:13,padding:"3px 7px"}}>✏️</button>
                    <button onClick={()=>del(s.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16}}>🗑</button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

// ─── COBROS PANEL ────────────────────────────────────────────────────────────
function CobrosPanel({client,onChange,services}){
  const payments=client.payments||[];
  const emptyPago=()=>({date:new Date().toISOString().slice(0,10),amount:"",method:"efectivo",serviceId:"",concept:""});
  const [showForm,setShowForm]=useState(false);
  const [pago,setPago]=useState(emptyPago());
  const [confirmDel,setConfirmDel]=useState(null);

  const totalEfectivo=payments.filter(p=>p.method==="efectivo").reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
  const totalTransferencia=payments.filter(p=>p.method==="transferencia").reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
  const total=totalEfectivo+totalTransferencia;

  const save=async()=>{
    if(!pago.amount||parseFloat(pago.amount)<=0) return;
    const sel=services.find(s=>s.id===pago.serviceId);
    const np={...pago,id:Date.now().toString(),amount:parseFloat(pago.amount),serviceName:sel?.name||"",createdAt:new Date().toISOString()};
    const updated={...client,payments:[np,...payments],updatedAt:new Date().toISOString()};
    onChange(updated);
    await sSet(`dubai_client:${updated.id}`,updated);
    setPago(emptyPago());setShowForm(false);
  };
  const del=id=>setConfirmDel({msg:"¿Eliminar este cobro?",onOk:async()=>{
    setConfirmDel(null);
    const updated={...client,payments:payments.filter(p=>p.id!==id),updatedAt:new Date().toISOString()};
    onChange(updated);
    await sSet(`dubai_client:${updated.id}`,updated);
  }});

  return(
    <div>
      {confirmDel&&<ConfirmModal msg={confirmDel.msg} onOk={confirmDel.onOk} onCancel={()=>setConfirmDel(null)}/>}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h3 style={{margin:0,fontSize:15,fontWeight:700,color:"#1e293b"}}>💰 Cobros</h3>
        {!showForm&&<button onClick={()=>{setPago(emptyPago());setShowForm(true);}} style={btnPrimary}>+ Registrar cobro</button>}
      </div>

      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {[{l:"Total cobrado",v:total,c:"#b8973e",bg:"#fdf8ee"},{l:"💵 Efectivo",v:totalEfectivo,c:"#22c55e",bg:"#f0fdf4"},{l:"🏦 Transferencia",v:totalTransferencia,c:"#2563eb",bg:"#eff6ff"}].map(({l,v,c,bg})=>(
          <div key={l} style={{backgroundColor:bg,borderRadius:10,padding:"12px",border:`1px solid ${c}22`,textAlign:"center"}}>
            <div style={{fontSize:17,fontWeight:800,color:c}}>${fmtARS(v)}</div>
            <div style={{fontSize:10,color:"#64748b",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {showForm&&(
        <div style={{backgroundColor:"#faf9f6",borderRadius:12,padding:16,marginBottom:16,border:"1px solid #e2e8f0"}}>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={ls}>Fecha</label><input type="date" value={pago.date} onChange={e=>setPago(p=>({...p,date:e.target.value}))} style={is}/></div>
            <div><label style={ls}>Monto $</label><input type="number" value={pago.amount} onChange={e=>setPago(p=>({...p,amount:e.target.value}))} placeholder="0" style={{...is,borderColor:!pago.amount?"#fca5a5":undefined}}/></div>
            <div style={{gridColumn:"1/-1"}}>
              <label style={ls}>Servicio</label>
              <select value={pago.serviceId} onChange={e=>setPago(p=>({...p,serviceId:e.target.value}))} style={{...is,padding:"9px 12px"}}>
                <option value="">— Seleccionar servicio —</option>
                {services.map(s=><option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>
          <div style={{marginBottom:12}}>
            <label style={ls}>Medio de pago</label>
            <div style={{display:"flex",gap:8,marginTop:4}}>
              {[{k:"efectivo",l:"💵 Efectivo"},{k:"transferencia",l:"🏦 Transferencia"}].map(({k,l})=>(
                <button key={k} onClick={()=>setPago(p=>({...p,method:k}))}
                  style={{flex:1,padding:"9px",borderRadius:9,border:`2px solid ${pago.method===k?"#b8973e":"#e2e8f0"}`,backgroundColor:pago.method===k?"#fdf8ee":"#fff",color:pago.method===k?"#b8973e":"#64748b",fontWeight:700,fontSize:13,cursor:"pointer"}}>{l}</button>
              ))}
            </div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setShowForm(false);setPago(emptyPago());}} style={btnSecondary}>Cancelar</button>
            <button onClick={save} disabled={!pago.amount||parseFloat(pago.amount)<=0} style={{...btnPrimary,flex:1,opacity:!pago.amount?0.6:1}}>💾 Registrar</button>
          </div>
        </div>
      )}

      {payments.length===0&&!showForm?(
        <div style={{padding:24,textAlign:"center",color:"#94a3b8",backgroundColor:"#faf9f6",borderRadius:10,border:"1px dashed #e2e8f0"}}>Sin cobros registrados</div>
      ):(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {payments.map(p=>(
            <div key={p.id} style={{backgroundColor:"#fff",borderRadius:10,padding:"11px 14px",border:"1px solid #e2e8f0",borderLeft:"4px solid #b8973e",display:"flex",alignItems:"center",gap:10}}>
              <div style={{fontSize:18,flexShrink:0}}>{p.method==="efectivo"?"💵":"🏦"}</div>
              <div style={{flex:1}}>
                <div style={{display:"flex",alignItems:"center",gap:8,flexWrap:"wrap"}}>
                  <span style={{fontWeight:800,fontSize:14,color:"#b8973e"}}>${fmtARS(p.amount)}</span>
                  <span style={{fontSize:11,backgroundColor:p.method==="efectivo"?"#f0fdf4":"#eff6ff",color:p.method==="efectivo"?"#166534":"#1d4ed8",padding:"2px 8px",borderRadius:10,fontWeight:700}}>{p.method==="efectivo"?"Efectivo":"Transferencia"}</span>
                  {p.serviceName&&<span style={{fontSize:11,color:"#64748b"}}>· {p.serviceName}</span>}
                </div>
                <div style={{fontSize:11,color:"#94a3b8",marginTop:2}}>{p.date}</div>
              </div>
              <button onClick={()=>del(p.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:16}}>🗑</button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── AGENDA PANEL ────────────────────────────────────────────────────────────
function AgendaView({clients,onSelectClient}){
  const today=new Date().toISOString().slice(0,10);
  const [appointments,setAppointments]=useState([]);
  const [loading,setLoading]=useState(true);
  const [viewDate,setViewDate]=useState(today.slice(0,7));
  const [selectedDay,setSelectedDay]=useState(today);
  const [showForm,setShowForm]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const [form,setForm]=useState({date:today,time:"10:00",duration:60,clientId:"",service:"",notes:""});

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try{const r=await sGet("dubai_agenda:main");if(r?.value)setAppointments(JSON.parse(r.value));else setAppointments([]);}
      catch{setAppointments([]);}
      finally{setLoading(false);}
    })();
  },[]);

  const saveAppts=async list=>{setAppointments(list);await sSet("dubai_agenda:main",list);};
  const toggleAttendance=async(id,status)=>{const up=appointments.map(a=>a.id===id?{...a,attendance:a.attendance===status?null:status}:a);await saveAppts(up);};

  const [year,month]=viewDate.split("-").map(Number);
  const firstDay=new Date(year,month-1,1).getDay();
  const daysInMonth=new Date(year,month,0).getDate();
  const prevM=()=>{const d=new Date(year,month-2,1);setViewDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);};
  const nextM=()=>{const d=new Date(year,month,1);setViewDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);};
  const monthNames=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const dayNames=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];

  const apptsByDay={};
  appointments.forEach(a=>{if(!apptsByDay[a.date])apptsByDay[a.date]=[];apptsByDay[a.date].push(a);});
  const dayAppts=(apptsByDay[selectedDay]||[]).sort((a,b)=>a.time.localeCompare(b.time));
  const getMonday=d=>{const dt=new Date(d+"T12:00:00");const diff=dt.getDate()-(dt.getDay()===0?6:dt.getDay()-1);return new Date(dt.setDate(diff)).toISOString().slice(0,10);};
  const getSunday=d=>{const dt=new Date(d+"T12:00:00");const diff=dt.getDate()+(dt.getDay()===0?0:7-dt.getDay());return new Date(dt.setDate(diff)).toISOString().slice(0,10);};
  const weekAll=appointments.filter(a=>a.date>=getMonday(today)&&a.date<=getSunday(today));

  const openEdit=a=>{setForm({date:a.date,time:a.time,duration:a.duration||60,clientId:a.clientId||"",service:a.service||"",notes:a.notes||""});setEditingId(a.id);setShowForm(true);};
  const openNew=()=>{setForm({date:selectedDay,time:"10:00",duration:60,clientId:"",service:"",notes:""});setEditingId(null);setShowForm(true);};

  const saveAppt=async()=>{
    if(!form.date) return;
    let up;
    if(editingId) up=appointments.map(a=>a.id===editingId?{...a,...form}:a).sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    else{const na={id:Date.now().toString(),...form,createdAt:new Date().toISOString()};up=[...appointments,na].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));}
    await saveAppts(up);setShowForm(false);setEditingId(null);
  };
  const delAppt=async id=>{await saveAppts(appointments.filter(a=>a.id!==id));};

  const getClientName=id=>{const c=clients.find(x=>x.id===id);return c?`${c.firstName||""} ${c.lastName||""}`.trim()||"Sin nombre":"Cliente";}; 
  const getClientPhone=id=>{const c=clients.find(x=>x.id===id);return c?.phone||"";};

  return(
    <div style={{padding:20,maxWidth:760,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <h2 style={{margin:0,fontSize:20,fontWeight:800,color:"#1e293b"}}>📅 Agenda</h2>
        {!showForm&&<button onClick={openNew} style={btnPrimary}>+ Nuevo turno</button>}
      </div>

      {showForm&&(
        <div style={{backgroundColor:"#faf9f6",borderRadius:12,padding:16,marginBottom:16,border:`1px solid ${editingId?"#b8973e":"#e2e8f0"}`}}>
          <div style={{fontSize:12,fontWeight:700,color:editingId?"#b8973e":"#374151",marginBottom:12,textTransform:"uppercase"}}>{editingId?"✏️ Editando turno":"Nuevo turno"}</div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={ls}>Fecha</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={is}/></div>
            <div><label style={ls}>Hora</label><input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} style={is}/></div>
            <div><label style={ls}>Duración (min)</label>
              <select value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} style={{...is,padding:"9px 12px"}}>
                {[15,30,45,60,90,120].map(d=><option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div><label style={ls}>Servicio</label><input value={form.service} onChange={e=>setForm(f=>({...f,service:e.target.value}))} placeholder="Ej: Uñas gel, Depilación..." style={is}/></div>
            <div style={{gridColumn:"1/-1"}}><label style={ls}>Cliente</label>
              <select value={form.clientId} onChange={e=>setForm(f=>({...f,clientId:e.target.value}))} style={{...is,padding:"9px 12px"}}>
                <option value="">— Sin cliente asignado —</option>
                {clients.map(c=><option key={c.id} value={c.id}>{`${c.lastName||""}, ${c.firstName||""}`.trim()||"Sin nombre"}</option>)}
              </select>
            </div>
            <div style={{gridColumn:"1/-1"}}><label style={ls}>Notas</label><input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Observaciones..." style={is}/></div>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setShowForm(false);setEditingId(null);}} style={btnSecondary}>Cancelar</button>
            <button onClick={saveAppt} style={{...btnPrimary,flex:1,background:editingId?"linear-gradient(135deg,#d97706,#b45309)":undefined}}>{editingId?"✏️ Actualizar":"💾 Guardar turno"}</button>
          </div>
        </div>
      )}

      {/* Calendario */}
      <div style={{backgroundColor:"#fff",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",backgroundColor:"#1a1a1a",color:"#b8973e"}}>
          <button onClick={prevM} style={{background:"none",border:"none",color:"#b8973e",cursor:"pointer",fontSize:18}}>‹</button>
          <span style={{fontWeight:700,fontSize:14}}>{monthNames[month-1]} {year}</span>
          <button onClick={nextM} style={{background:"none",border:"none",color:"#b8973e",cursor:"pointer",fontSize:18}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",backgroundColor:"#f1f5f9"}}>
          {dayNames.map(d=><div key={d} style={{padding:"6px 0",textAlign:"center",fontSize:10,fontWeight:700,color:"#64748b"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"4px"}}>
          {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const day=i+1;
            const ds=`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const has=apptsByDay[ds]?.length>0;
            const isT=ds===today,isSel=ds===selectedDay;
            return(<div key={day} onClick={()=>setSelectedDay(ds)}
              style={{padding:"2px 0",textAlign:"center",cursor:"pointer",
                backgroundColor:isSel?"#b8973e":isT?"#fdf8ee":"transparent",
                borderRadius:"50%",margin:"1px auto",width:32,height:32,
                display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
              <span style={{fontSize:12,fontWeight:isT||isSel?700:400,color:isSel?"#fff":isT?"#b8973e":"#1e293b"}}>{day}</span>
              {has&&<div style={{width:4,height:4,borderRadius:"50%",backgroundColor:isSel?"#fff":"#b8973e",marginTop:1}}/>}
            </div>);
          })}
        </div>
      </div>

      {/* Turnos del día */}
      <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:10,display:"flex",alignItems:"center",gap:8}}>
        {selectedDay===today?"📅 Turnos de hoy":`📅 Turnos del ${selectedDay}`}
        {dayAppts.length>0&&<span style={{backgroundColor:"#b8973e",color:"#fff",borderRadius:10,padding:"2px 8px",fontSize:11}}>{dayAppts.length}</span>}
      </div>
      {loading&&<div style={{textAlign:"center",color:"#94a3b8",padding:16}}>Cargando...</div>}
      {!loading&&dayAppts.length===0&&<div style={{padding:16,textAlign:"center",color:"#94a3b8",backgroundColor:"#faf9f6",borderRadius:10,border:"1px dashed #e2e8f0",fontSize:13}}>Sin turnos para este día</div>}
      {dayAppts.map(a=>{
        const cname=getClientName(a.clientId);
        const cphone=getClientPhone(a.clientId);
        const cId=a.clientId;
        return(<div key={a.id} style={{backgroundColor:a.attendance==="attended"?"#f0fdf4":a.attendance==="absent"?"#fef2f2":"#fff",
          borderRadius:10,padding:"12px 14px",marginBottom:8,
          border:`1px solid ${a.attendance==="attended"?"#86efac":a.attendance==="absent"?"#fca5a5":"#e2e8f0"}`,
          borderLeft:`4px solid ${a.attendance==="attended"?"#16a34a":a.attendance==="absent"?"#ef4444":"#b8973e"}`,
          display:"flex",alignItems:"center",gap:10,transition:"all 0.2s"}}>
          <div style={{backgroundColor:"#fdf8ee",borderRadius:8,padding:"8px 10px",textAlign:"center",flexShrink:0,minWidth:52}}>
            <div style={{fontSize:15,fontWeight:800,color:"#b8973e"}}>{a.time}</div>
            <div style={{fontSize:9,color:"#94a3b8"}}>{a.duration}min</div>
          </div>
          <div style={{flex:1,minWidth:0,cursor:cId?"pointer":"default"}} onClick={()=>cId&&onSelectClient(cId)}>
            <div style={{fontWeight:700,fontSize:13,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cname}</div>
            {a.service&&<div style={{fontSize:11,color:"#b8973e",marginTop:1,fontWeight:600}}>{a.service}</div>}
            {a.notes&&<div style={{fontSize:11,color:"#64748b",marginTop:1}}>{a.notes}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
            <div style={{display:"flex",gap:3}}>
              <button onClick={()=>toggleAttendance(a.id,"attended")} title="Asistió"
                style={{width:28,height:28,borderRadius:6,border:`2px solid ${a.attendance==="attended"?"#16a34a":"#e2e8f0"}`,
                  backgroundColor:a.attendance==="attended"?"#16a34a":"#fff",color:a.attendance==="attended"?"#fff":"#94a3b8",
                  fontWeight:800,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✓</button>
              <button onClick={()=>toggleAttendance(a.id,"absent")} title="No asistió"
                style={{width:28,height:28,borderRadius:6,border:`2px solid ${a.attendance==="absent"?"#ef4444":"#e2e8f0"}`,
                  backgroundColor:a.attendance==="absent"?"#ef4444":"#fff",color:a.attendance==="absent"?"#fff":"#94a3b8",
                  fontWeight:800,fontSize:13,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            {cphone&&<button onClick={()=>window.open(buildWAReminder(cphone,cname,a.date,a.time),"_blank")}
              style={{padding:"3px 6px",borderRadius:6,border:"1px solid #25d366",backgroundColor:"#f0fdf4",color:"#16a34a",fontWeight:700,fontSize:10,cursor:"pointer"}}>📱 WA</button>}
            <div style={{display:"flex",gap:3}}>
              <button onClick={()=>openEdit(a)} style={{flex:1,padding:"2px 5px",borderRadius:5,border:"1px solid #f59e0b",backgroundColor:"#fffbeb",color:"#d97706",fontWeight:700,fontSize:10,cursor:"pointer"}}>✏️</button>
              <button onClick={()=>delAppt(a.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:14}}>🗑</button>
            </div>
          </div>
        </div>);
      })}
    </div>
  );
}

// ─── ESTADÍSTICAS ─────────────────────────────────────────────────────────────
function StatsView({clients}){
  const today=new Date().toISOString().slice(0,10);
  const monthStr=today.slice(0,7);
  const allPagos=[];
  clients.forEach(c=>(c.payments||[]).forEach(p=>{if(p.amount)allPagos.push({...p,clientName:`${c.lastName||""}, ${c.firstName||""}`.trim()||"Sin nombre",clientId:c.id});}));
  const pagosHoy=allPagos.filter(p=>p.date===today);
  const pagosMes=allPagos.filter(p=>(p.date||"").slice(0,7)===monthStr);
  const ef=arr=>arr.filter(p=>p.method!=="transferencia").reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
  const tr=arr=>arr.filter(p=>p.method==="transferencia").reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
  const totalHist=allPagos.reduce((s,p)=>s+(parseFloat(p.amount)||0),0);
  const totalEf=ef(allPagos),totalTr=tr(allPagos);
  const pctEf=totalHist>0?Math.round(totalEf/totalHist*100):0;

  const months=[];
  const now=new Date();
  for(let i=11;i>=0;i--){const d=new Date(now.getFullYear(),now.getMonth()-i,1);const key=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`;months.push({key,label:d.toLocaleDateString("es-AR",{month:"short"}),total:0});}
  allPagos.forEach(p=>{const m=months.find(x=>x.key===(p.date||"").slice(0,7));if(m)m.total+=parseFloat(p.amount)||0;});
  const maxM=Math.max(1,...months.map(m=>m.total));
  const best=months.reduce((a,b)=>b.total>a.total?b:a,months[0]);

  // Clientes sin volver en más de 30 días
  const sinVolver=clients.filter(c=>{
    const hist=c.history||[];
    if(hist.length===0) return false;
    const last=hist.map(h=>h.date).sort().reverse()[0];
    const diff=(new Date(today)-new Date(last+"T12:00:00"))/(1000*60*60*24);
    return diff>30;
  });

  return(
    <div style={{padding:20,maxWidth:760,margin:"0 auto"}}>
      <div style={{marginBottom:20,padding:"18px 24px",background:"linear-gradient(135deg,#1a1a1a,#b8973e)",borderRadius:16,color:"#fff"}}>
        <div style={{fontSize:20,fontWeight:800}}>📊 Estadísticas</div>
      </div>

      <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:16}}>
        <div style={{backgroundColor:"#1a1a1a",borderRadius:12,padding:"14px 16px",color:"#fff"}}>
          <div style={{fontSize:10,color:"#94a3b8",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>💰 Cobrado hoy</div>
          <div style={{fontSize:22,fontWeight:800,color:"#b8973e",marginBottom:6}}>${fmtARS(ef(pagosHoy)+tr(pagosHoy))}</div>
          <div style={{display:"flex",gap:10,fontSize:11,color:"#94a3b8"}}><span>💵 ${fmtARS(ef(pagosHoy))}</span><span>🏦 ${fmtARS(tr(pagosHoy))}</span></div>
        </div>
        <div style={{backgroundColor:"#faf9f6",borderRadius:12,padding:"14px 16px",border:"1px solid #e2e8f0"}}>
          <div style={{fontSize:10,color:"#64748b",textTransform:"uppercase",fontWeight:700,marginBottom:6}}>📅 Cobrado este mes</div>
          <div style={{fontSize:22,fontWeight:800,color:"#1e293b",marginBottom:6}}>${fmtARS(ef(pagosMes)+tr(pagosMes))}</div>
          <div style={{display:"flex",gap:10,fontSize:11,color:"#64748b"}}><span>💵 ${fmtARS(ef(pagosMes))}</span><span>🏦 ${fmtARS(tr(pagosMes))}</span></div>
        </div>
      </div>

      {/* Cobros hoy por cliente */}
      {pagosHoy.length>0&&(
        <div style={{backgroundColor:"#fff",borderRadius:12,border:"1px solid #e2e8f0",marginBottom:16,overflow:"hidden"}}>
          <div style={{padding:"12px 16px",backgroundColor:"#1a1a1a",color:"#b8973e",fontWeight:700,fontSize:13}}>💰 Detalle de hoy</div>
          {pagosHoy.map((p,i)=>(
            <div key={i} style={{display:"flex",alignItems:"center",gap:12,padding:"11px 16px",borderBottom:i<pagosHoy.length-1?"1px solid #f1f5f9":"none",backgroundColor:i%2?"#f8fafc":"#fff"}}>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:"#1e293b"}}>{p.clientName}</div>{p.serviceName&&<div style={{fontSize:11,color:"#64748b"}}>{p.serviceName}</div>}</div>
              <div style={{textAlign:"right"}}><div style={{fontWeight:800,fontSize:14,color:"#b8973e"}}>${fmtARS(p.amount)}</div><div style={{fontSize:10}}>{p.method==="transferencia"?"🏦":"💵"}</div></div>
            </div>
          ))}
        </div>
      )}

      {/* Gráfico efectivo vs transferencia */}
      {totalHist>0&&(
        <div style={{backgroundColor:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:20,marginBottom:16}}>
          <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:12}}>💵 vs 🏦 Histórico</div>
          <div style={{display:"flex",height:32,borderRadius:8,overflow:"hidden",marginBottom:12}}>
            <div style={{width:`${pctEf}%`,backgroundColor:"#22c55e",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800}}>{pctEf>10&&`${pctEf}%`}</div>
            <div style={{width:`${100-pctEf}%`,backgroundColor:"#3b82f6",display:"flex",alignItems:"center",justifyContent:"center",color:"#fff",fontSize:12,fontWeight:800}}>{100-pctEf>10&&`${100-pctEf}%`}</div>
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
            <div style={{padding:"10px 14px",backgroundColor:"#f0fdf4",borderRadius:8,border:"1px solid #bbf7d0"}}><div style={{fontSize:10,color:"#166534",fontWeight:700}}>💵 Efectivo</div><div style={{fontSize:15,fontWeight:800,color:"#166534"}}>${fmtARS(totalEf)}</div></div>
            <div style={{padding:"10px 14px",backgroundColor:"#eff6ff",borderRadius:8,border:"1px solid #bfdbfe"}}><div style={{fontSize:10,color:"#1d4ed8",fontWeight:700}}>🏦 Transferencia</div><div style={{fontSize:15,fontWeight:800,color:"#1d4ed8"}}>${fmtARS(totalTr)}</div></div>
          </div>
        </div>
      )}

      {/* Gráfico mensual */}
      <div style={{backgroundColor:"#fff",borderRadius:12,border:"1px solid #e2e8f0",padding:20,marginBottom:16}}>
        <div style={{fontSize:13,fontWeight:700,color:"#1e293b",marginBottom:4}}>📈 Últimos 12 meses</div>
        {totalHist===0?<div style={{textAlign:"center",color:"#94a3b8",padding:24}}>Sin datos</div>:(
          <>
            <div style={{display:"flex",alignItems:"flex-end",gap:4,height:160,marginBottom:8}}>
              {months.map(m=>{
                const h=Math.max(2,Math.round((m.total/maxM)*130));
                const isCur=m.key===monthStr;
                return(<div key={m.key} style={{flex:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"flex-end",height:"100%"}}>
                  {m.total>0&&<div style={{fontSize:9,color:"#64748b",marginBottom:2}}>{m.total>=1000000?`${(m.total/1000000).toFixed(1)}M`:m.total>=1000?`${Math.round(m.total/1000)}k`:fmtARS(m.total)}</div>}
                  <div style={{width:"100%",borderRadius:"4px 4px 0 0",height:h,background:isCur?"linear-gradient(180deg,#b8973e,#8a6d2f)":"linear-gradient(180deg,#e5d5a0,#c9b870)"}}/>
                  <div style={{fontSize:9,color:isCur?"#b8973e":"#94a3b8",fontWeight:isCur?800:400,marginTop:4}}>{m.label}</div>
                </div>);
              })}
            </div>
            {best.total>0&&<div style={{padding:"8px 12px",backgroundColor:"#fdf8ee",borderRadius:8,border:"1px solid #e5d5a0",fontSize:12,color:"#8a6d2f"}}>🏆 <strong>{best.label}</strong> fue el mejor mes: ${fmtARS(best.total)}</div>}
          </>
        )}
      </div>

      {/* Clientes sin volver */}
      {sinVolver.length>0&&(
        <div style={{backgroundColor:"#fff",borderRadius:12,border:"1px solid #fde68a",padding:20}}>
          <div style={{fontSize:13,fontWeight:700,color:"#92400e",marginBottom:12}}>💤 Clientes sin volver (más de 30 días) — {sinVolver.length}</div>
          {sinVolver.map(c=>{
            const last=(c.history||[]).map(h=>h.date).sort().reverse()[0];
            const days=Math.round((new Date(today)-new Date(last+"T12:00:00"))/(1000*60*60*24));
            return(<div key={c.id} style={{display:"flex",alignItems:"center",gap:10,padding:"10px 0",borderBottom:"1px solid #fef9c3"}}>
              <div style={{flex:1}}><div style={{fontWeight:700,fontSize:13,color:"#1e293b"}}>{`${c.firstName||""} ${c.lastName||""}`.trim()||"Sin nombre"}</div><div style={{fontSize:11,color:"#92400e"}}>Último servicio: {last} ({days} días)</div></div>
              {c.phone&&<button onClick={()=>window.open(buildWAPromo(c.phone,`${c.firstName||""} ${c.lastName||""}`.trim(),last,""),"_blank")}
                style={{padding:"6px 10px",borderRadius:7,border:"1px solid #25d366",backgroundColor:"#f0fdf4",color:"#16a34a",fontWeight:700,fontSize:11,cursor:"pointer"}}>📱 Promo</button>}
            </div>);
          })}
        </div>
      )}
    </div>
  );
}

// ─── DASHBOARD ────────────────────────────────────────────────────────────────
function DashboardView({clients,onSelectClient,onNavigate,services,onNewClient}){
  const today=new Date().toISOString().slice(0,10);
  const [appointments,setAppointments]=useState([]);
  const [loading,setLoading]=useState(true);
  const [viewDate,setViewDate]=useState(today.slice(0,7));
  const [selectedDay,setSelectedDay]=useState(today);
  const [showForm,setShowForm]=useState(false);
  const [editingId,setEditingId]=useState(null);
  const emptyForm=()=>({date:selectedDay,time:"10:00",duration:60,clientId:"",clientMode:"existing",newFirstName:"",newLastName:"",newPhone:"",serviceId:"",customService:"",notes:""});
  const [form,setForm]=useState(emptyForm());

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try{const r=await sGet("dubai_agenda:main");if(r?.value)setAppointments(JSON.parse(r.value));}
      catch{}finally{setLoading(false);}
    })();
  },[]);

  const saveAppts=async list=>{setAppointments(list);await sSet("dubai_agenda:main",list);};
  const toggleAttendance=async(id,status)=>{const up=appointments.map(a=>a.id===id?{...a,attendance:a.attendance===status?null:status}:a);await saveAppts(up);};

  const getMonday=d=>{const dt=new Date(d+"T12:00:00");const diff=dt.getDate()-(dt.getDay()===0?6:dt.getDay()-1);return new Date(dt.setDate(diff)).toISOString().slice(0,10);};
  const getSunday=d=>{const dt=new Date(d+"T12:00:00");const diff=dt.getDate()+(dt.getDay()===0?0:7-dt.getDay());return new Date(dt.setDate(diff)).toISOString().slice(0,10);};
  const weekCount=appointments.filter(a=>a.date>=getMonday(today)&&a.date<=getSunday(today)).length;

  const [year,month]=viewDate.split("-").map(Number);
  const firstDay=new Date(year,month-1,1).getDay();
  const daysInMonth=new Date(year,month,0).getDate();
  const prevM=()=>{const d=new Date(year,month-2,1);setViewDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);};
  const nextM=()=>{const d=new Date(year,month,1);setViewDate(`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}`);};
  const monthNames=["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const dayNames=["Dom","Lun","Mar","Mié","Jue","Vie","Sáb"];
  const apptsByDay={};
  appointments.forEach(a=>{if(!apptsByDay[a.date])apptsByDay[a.date]=[];apptsByDay[a.date].push(a);});
  const dayAppts=(apptsByDay[selectedDay]||[]).sort((a,b)=>a.time.localeCompare(b.time));

  const getClientName=id=>{const c=clients.find(x=>x.id===id);return c?`${c.firstName||""} ${c.lastName||""}`.trim()||"Sin nombre":"Cliente";};
  const getClientPhone=id=>{const c=clients.find(x=>x.id===id);return c?.phone||"";};
  const hour=new Date().getHours();
  const greeting=hour<12?"Buenos días":hour<19?"Buenas tardes":"Buenas noches";

  const openNew=()=>{setForm({...emptyForm(),date:selectedDay});setEditingId(null);setShowForm(true);};
  const openEdit=a=>{
    setForm({date:a.date,time:a.time,duration:a.duration||60,clientId:a.clientId||"",clientMode:"existing",
      newFirstName:"",newLastName:"",newPhone:"",serviceId:a.serviceId||"",customService:a.customService||"",notes:a.notes||""});
    setEditingId(a.id);setShowForm(true);
  };
  const delAppt=async id=>{await saveAppts(appointments.filter(a=>a.id!==id));};

  const saveAppt=async()=>{
    let clientId=form.clientId;
    // Si es cliente nuevo, crearlo primero
    if(form.clientMode==="new"){
      if(!form.newFirstName.trim()&&!form.newLastName.trim()) return;
      const nc=onNewClient({firstName:form.newFirstName.trim(),lastName:form.newLastName.trim(),phone:form.newPhone.trim()});
      clientId=nc.id;
    }
    const selSvc=services.find(s=>s.id===form.serviceId);
    const serviceName=selSvc?.name||form.customService||"";
    let up;
    if(editingId){
      up=appointments.map(a=>a.id===editingId?{...a,...form,clientId,serviceId:form.serviceId,serviceName,customService:form.customService}:a)
        .sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    } else {
      const na={id:Date.now().toString(),date:form.date,time:form.time,duration:parseInt(form.duration)||60,
        clientId,serviceId:form.serviceId,serviceName,customService:form.customService,notes:form.notes,
        createdAt:new Date().toISOString()};
      up=[...appointments,na].sort((a,b)=>(a.date+a.time).localeCompare(b.date+b.time));
    }
    await saveAppts(up);setShowForm(false);setEditingId(null);
  };

  return(
    <div style={{padding:20,maxWidth:760,margin:"0 auto"}}>
      {/* Header */}
      <div style={{marginBottom:16,padding:"18px 24px",background:"linear-gradient(135deg,#1a1a1a,#b8973e)",borderRadius:16,color:"#fff"}}>
        <div style={{fontSize:12,color:"rgba(255,255,255,0.7)",marginBottom:2}}>{greeting} ✨</div>
        <div style={{fontSize:20,fontWeight:800}}>Dubai Salón de Belleza</div>
        <div style={{fontSize:11,color:"rgba(255,255,255,0.7)",marginTop:2}}>{new Date().toLocaleDateString("es-AR",{weekday:"long",day:"numeric",month:"long"})}</div>
      </div>

      {/* Stats */}
      <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:10,marginBottom:16}}>
        {[{l:"Clientes",v:clients.length,i:"👤",c:"#b8973e",bg:"#fdf8ee"},{l:"Hoy",v:(apptsByDay[today]||[]).length,i:"📅",c:"#22c55e",bg:"#f0fdf4"},{l:"Semana",v:weekCount,i:"📆",c:"#2563eb",bg:"#eff6ff"}].map(({l,v,i,c,bg})=>(
          <div key={l} style={{backgroundColor:bg,borderRadius:12,padding:"12px",border:`1px solid ${c}22`,textAlign:"center"}}>
            <div style={{fontSize:20}}>{i}</div><div style={{fontSize:22,fontWeight:800,color:c,lineHeight:1}}>{v}</div>
            <div style={{fontSize:10,color:"#64748b",marginTop:2}}>{l}</div>
          </div>
        ))}
      </div>

      {/* Calendario */}
      <div style={{backgroundColor:"#fff",borderRadius:12,border:"1px solid #e2e8f0",overflow:"hidden",marginBottom:12}}>
        <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"10px 16px",backgroundColor:"#1a1a1a",color:"#b8973e"}}>
          <button onClick={prevM} style={{background:"none",border:"none",color:"#b8973e",cursor:"pointer",fontSize:18}}>‹</button>
          <span style={{fontWeight:700,fontSize:13}}>{monthNames[month-1]} {year}</span>
          <button onClick={nextM} style={{background:"none",border:"none",color:"#b8973e",cursor:"pointer",fontSize:18}}>›</button>
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",backgroundColor:"#f8fafc"}}>
          {dayNames.map(d=><div key={d} style={{padding:"5px 0",textAlign:"center",fontSize:10,fontWeight:700,color:"#64748b"}}>{d}</div>)}
        </div>
        <div style={{display:"grid",gridTemplateColumns:"repeat(7,1fr)",padding:"4px"}}>
          {Array.from({length:firstDay}).map((_,i)=><div key={`e${i}`}/>)}
          {Array.from({length:daysInMonth}).map((_,i)=>{
            const day=i+1;
            const ds=`${year}-${String(month).padStart(2,"0")}-${String(day).padStart(2,"0")}`;
            const has=apptsByDay[ds]?.length>0;
            const isT=ds===today,isSel=ds===selectedDay;
            return(<div key={day} onClick={()=>setSelectedDay(ds)}
              style={{padding:"2px 0",textAlign:"center",cursor:"pointer",
                backgroundColor:isSel?"#b8973e":isT?"#fdf8ee":"transparent",
                borderRadius:"50%",margin:"1px auto",width:30,height:30,
                display:"flex",alignItems:"center",justifyContent:"center",flexDirection:"column"}}>
              <span style={{fontSize:11,fontWeight:isT||isSel?700:400,color:isSel?"#fff":isT?"#b8973e":"#1e293b"}}>{day}</span>
              {has&&<div style={{width:3,height:3,borderRadius:"50%",backgroundColor:isSel?"#fff":"#b8973e",marginTop:1}}/>}
            </div>);
          })}
        </div>
      </div>

      {/* Turnos del día + botón agendar */}
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10}}>
        <div style={{fontSize:13,fontWeight:700,color:"#1e293b",display:"flex",alignItems:"center",gap:8}}>
          📅 {selectedDay===today?"Hoy":`Turnos del ${selectedDay}`}
          {dayAppts.length>0&&<span style={{backgroundColor:"#b8973e",color:"#fff",borderRadius:10,padding:"2px 8px",fontSize:11}}>{dayAppts.length}</span>}
        </div>
        {!showForm&&<button onClick={openNew} style={btnPrimary}>+ Agendar</button>}
      </div>

      {/* Formulario turno */}
      {showForm&&(
        <div style={{backgroundColor:"#faf9f6",borderRadius:12,padding:16,marginBottom:12,border:`1px solid ${editingId?"#b8973e":"#e2e8f0"}`}}>
          <div style={{fontSize:12,fontWeight:700,color:editingId?"#b8973e":"#374151",marginBottom:12,textTransform:"uppercase"}}>
            {editingId?"✏️ Editando turno":"Nuevo turno"}
          </div>
          <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:10,marginBottom:10}}>
            <div><label style={ls}>Fecha</label><input type="date" value={form.date} onChange={e=>setForm(f=>({...f,date:e.target.value}))} style={is}/></div>
            <div><label style={ls}>Hora</label><input type="time" value={form.time} onChange={e=>setForm(f=>({...f,time:e.target.value}))} style={is}/></div>
            <div><label style={ls}>Duración (min)</label>
              <select value={form.duration} onChange={e=>setForm(f=>({...f,duration:e.target.value}))} style={{...is,padding:"9px 12px"}}>
                {[15,30,45,60,90,120].map(d=><option key={d} value={d}>{d} min</option>)}
              </select>
            </div>
            <div>
              <label style={ls}>Servicio</label>
              <select value={form.serviceId} onChange={e=>{const s=services.find(x=>x.id===e.target.value);setForm(f=>({...f,serviceId:e.target.value,customService:s?.name||f.customService}));}} style={{...is,padding:"9px 12px"}}>
                <option value="">— Seleccionar servicio —</option>
                {services.map(s=><option key={s.id} value={s.id}>{s.name}{s.price?` ($${fmtARS(s.price)})`:""}</option>)}
                <option value="__custom">Otro...</option>
              </select>
              {form.serviceId==="__custom"&&<input value={form.customService} onChange={e=>setForm(f=>({...f,customService:e.target.value}))} placeholder="Describí el servicio" style={{...is,marginTop:6}}/>}
            </div>
          </div>

          {/* Cliente: existente o nuevo */}
          <div style={{marginBottom:10}}>
            <label style={ls}>Cliente</label>
            <div style={{display:"flex",gap:6,marginBottom:8,marginTop:4}}>
              <button onClick={()=>setForm(f=>({...f,clientMode:"existing"}))}
                style={{flex:1,padding:"7px",borderRadius:8,border:`2px solid ${form.clientMode==="existing"?"#b8973e":"#e2e8f0"}`,backgroundColor:form.clientMode==="existing"?"#fdf8ee":"#fff",color:form.clientMode==="existing"?"#b8973e":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                👤 Ya registrada
              </button>
              <button onClick={()=>setForm(f=>({...f,clientMode:"new"}))}
                style={{flex:1,padding:"7px",borderRadius:8,border:`2px solid ${form.clientMode==="new"?"#b8973e":"#e2e8f0"}`,backgroundColor:form.clientMode==="new"?"#fdf8ee":"#fff",color:form.clientMode==="new"?"#b8973e":"#64748b",fontWeight:700,fontSize:12,cursor:"pointer"}}>
                ✨ Nueva clienta
              </button>
            </div>
            {form.clientMode==="existing"?(
              <select value={form.clientId} onChange={e=>setForm(f=>({...f,clientId:e.target.value}))} style={{...is,padding:"9px 12px"}}>
                <option value="">— Seleccionar clienta —</option>
                {clients.map(c=><option key={c.id} value={c.id}>{`${c.lastName||""}, ${c.firstName||""}`.trim()||"Sin nombre"}{c.phone?` · ${c.phone}`:""}</option>)}
              </select>
            ):(
              <div style={{backgroundColor:"#fdf8ee",borderRadius:8,padding:12,border:"1px solid #e5d5a0"}}>
                <div style={{fontSize:11,color:"#8a6d2f",fontWeight:600,marginBottom:8}}>Se creará como nueva clienta al guardar el turno</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:8}}>
                  <input value={form.newFirstName} onChange={e=>setForm(f=>({...f,newFirstName:e.target.value}))} placeholder="Nombre" style={{...is,padding:"8px 10px"}}/>
                  <input value={form.newLastName} onChange={e=>setForm(f=>({...f,newLastName:e.target.value}))} placeholder="Apellido" style={{...is,padding:"8px 10px"}}/>
                </div>
                <input value={form.newPhone} onChange={e=>setForm(f=>({...f,newPhone:e.target.value}))} placeholder="Teléfono / WhatsApp" type="tel" style={{...is,padding:"8px 10px",marginTop:8}}/>
              </div>
            )}
          </div>

          <div style={{marginBottom:12}}>
            <label style={ls}>Notas</label>
            <input value={form.notes} onChange={e=>setForm(f=>({...f,notes:e.target.value}))} placeholder="Observaciones..." style={is}/>
          </div>
          <div style={{display:"flex",gap:8}}>
            <button onClick={()=>{setShowForm(false);setEditingId(null);}} style={btnSecondary}>Cancelar</button>
            <button onClick={saveAppt}
              disabled={form.clientMode==="existing"?!form.clientId:(!form.newFirstName.trim()&&!form.newLastName.trim())}
              style={{...btnPrimary,flex:1,background:editingId?"linear-gradient(135deg,#d97706,#b45309)":undefined,
                opacity:(form.clientMode==="existing"?!form.clientId:(!form.newFirstName.trim()&&!form.newLastName.trim()))?0.6:1}}>
              {editingId?"✏️ Actualizar":"💾 Guardar turno"}
            </button>
          </div>
        </div>
      )}

      {loading&&<div style={{textAlign:"center",color:"#94a3b8",padding:16}}>Cargando...</div>}
      {!loading&&dayAppts.length===0&&!showForm&&(
        <div style={{padding:16,textAlign:"center",color:"#94a3b8",backgroundColor:"#faf9f6",borderRadius:10,border:"1px dashed #e2e8f0",fontSize:13}}>Sin turnos para este día</div>
      )}
      {dayAppts.map(a=>{
        const cname=getClientName(a.clientId);const cphone=getClientPhone(a.clientId);
        return(<div key={a.id} style={{backgroundColor:a.attendance==="attended"?"#f0fdf4":a.attendance==="absent"?"#fef2f2":"#fff",
          borderRadius:10,padding:"12px 14px",marginBottom:8,
          border:`1px solid ${a.attendance==="attended"?"#86efac":a.attendance==="absent"?"#fca5a5":"#e2e8f0"}`,
          borderLeft:`4px solid ${a.attendance==="attended"?"#16a34a":a.attendance==="absent"?"#ef4444":"#b8973e"}`,
          display:"flex",alignItems:"center",gap:10,transition:"all 0.2s"}}>
          <div style={{backgroundColor:"#fdf8ee",borderRadius:8,padding:"7px 9px",textAlign:"center",flexShrink:0,minWidth:48,cursor:a.clientId?"pointer":"default"}}
            onClick={()=>a.clientId&&onSelectClient(a.clientId)}>
            <div style={{fontSize:14,fontWeight:800,color:"#b8973e"}}>{a.time}</div>
            <div style={{fontSize:9,color:"#94a3b8"}}>{a.duration}min</div>
          </div>
          <div style={{flex:1,minWidth:0,cursor:a.clientId?"pointer":"default"}} onClick={()=>a.clientId&&onSelectClient(a.clientId)}>
            <div style={{fontWeight:700,fontSize:13,color:"#1e293b",overflow:"hidden",textOverflow:"ellipsis",whiteSpace:"nowrap"}}>{cname}</div>
            {(a.serviceName||a.customService)&&<div style={{fontSize:11,color:"#b8973e",marginTop:1,fontWeight:600}}>{a.serviceName||a.customService}</div>}
            {a.notes&&<div style={{fontSize:11,color:"#64748b",marginTop:1}}>{a.notes}</div>}
          </div>
          <div style={{display:"flex",flexDirection:"column",gap:4,flexShrink:0}}>
            <div style={{display:"flex",gap:3}}>
              <button onClick={()=>toggleAttendance(a.id,"attended")} title="Asistió"
                style={{width:26,height:26,borderRadius:6,border:`2px solid ${a.attendance==="attended"?"#16a34a":"#e2e8f0"}`,backgroundColor:a.attendance==="attended"?"#16a34a":"#fff",color:a.attendance==="attended"?"#fff":"#94a3b8",fontWeight:800,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✓</button>
              <button onClick={()=>toggleAttendance(a.id,"absent")} title="No asistió"
                style={{width:26,height:26,borderRadius:6,border:`2px solid ${a.attendance==="absent"?"#ef4444":"#e2e8f0"}`,backgroundColor:a.attendance==="absent"?"#ef4444":"#fff",color:a.attendance==="absent"?"#fff":"#94a3b8",fontWeight:800,fontSize:12,cursor:"pointer",display:"flex",alignItems:"center",justifyContent:"center"}}>✕</button>
            </div>
            {cphone&&<button onClick={()=>window.open(buildWAReminder(cphone,cname,a.date,a.time),"_blank")}
              style={{padding:"3px 6px",borderRadius:6,border:"1px solid #25d366",backgroundColor:"#f0fdf4",color:"#16a34a",fontWeight:700,fontSize:10,cursor:"pointer"}}>📱</button>}
            <div style={{display:"flex",gap:3}}>
              <button onClick={()=>openEdit(a)} style={{flex:1,padding:"2px 5px",borderRadius:5,border:"1px solid #f59e0b",backgroundColor:"#fffbeb",color:"#d97706",fontWeight:700,fontSize:10,cursor:"pointer"}}>✏️</button>
              <button onClick={()=>delAppt(a.id)} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:14}}>🗑</button>
            </div>
          </div>
        </div>);
      })}
    </div>
  );
}

// ─── CLIENTE DETAIL VIEW ──────────────────────────────────────────────────────
const CLIENT_TABS=[{id:"ficha",l:"📋 Ficha"},{id:"historial",l:"✨ Historial"},{id:"cobros",l:"💰 Cobros"}];

function ClientDetail({client,onChange,onBack,services}){
  const [tab,setTab]=useState("ficha");
  return(
    <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
      {/* Header */}
      <div style={{padding:"14px 20px",borderBottom:"1px solid #e2e8f0",backgroundColor:"#fff",display:"flex",alignItems:"center",gap:12}}>
        <button onClick={onBack} style={{background:"none",border:"none",cursor:"pointer",color:"#94a3b8",fontSize:20,padding:0,lineHeight:1}}>←</button>
        <div style={{flex:1}}>
          <div style={{fontSize:16,fontWeight:800,color:"#1e293b"}}>{`${client.firstName||""} ${client.lastName||""}`.trim()||"Sin nombre"}</div>
          {client.phone&&<div style={{fontSize:12,color:"#64748b"}}>{client.phone}</div>}
        </div>
        {client.phone&&<button onClick={()=>window.open(buildWAPromo(client.phone,`${client.firstName||""}`.trim(),"",""),"_blank")}
          style={{padding:"6px 12px",borderRadius:8,border:"1px solid #25d366",backgroundColor:"#f0fdf4",color:"#16a34a",fontWeight:700,fontSize:12,cursor:"pointer"}}>📱 Promo</button>}
      </div>
      {/* Tabs */}
      <div style={{display:"flex",borderBottom:"1px solid #e2e8f0",backgroundColor:"#fff"}}>
        {CLIENT_TABS.map(t=>(
          <button key={t.id} onClick={()=>setTab(t.id)}
            style={{flex:1,padding:"10px 4px",border:"none",borderBottom:`3px solid ${tab===t.id?"#b8973e":"transparent"}`,backgroundColor:"transparent",color:tab===t.id?"#b8973e":"#64748b",fontWeight:tab===t.id?700:500,fontSize:12,cursor:"pointer"}}>
            {t.l}
          </button>
        ))}
      </div>
      <div style={{flex:1,overflowY:"auto",padding:20}}>
        {tab==="ficha"&&<ClientForm client={client} onChange={onChange}/>}
        {tab==="historial"&&<HistoryPanel client={client} onChange={onChange} services={services} onGoToCobros={()=>setTab("cobros")}/>}
        {tab==="cobros"&&<CobrosPanel client={client} onChange={onChange} services={services}/>}
      </div>
    </div>
  );
}

// ─── CLIENTES LIST ─────────────────────────────────────────────────────────────
function ClientsList({clients,onSelect,onNew}){
  const [search,setSearch]=useState("");
  const filtered=clients.filter(c=>`${c.firstName} ${c.lastName} ${c.phone}`.toLowerCase().includes(search.toLowerCase()));
  return(
    <div style={{padding:20,maxWidth:700,margin:"0 auto"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:16}}>
        <div><h2 style={{margin:0,fontSize:20,fontWeight:800,color:"#1e293b"}}>👤 Clientes</h2><div style={{fontSize:13,color:"#64748b",marginTop:2}}>{clients.length} cliente{clients.length!==1?"s":""} registrado{clients.length!==1?"s":""}</div></div>
        <button onClick={onNew} style={btnPrimary}>+ Nueva clienta</button>
      </div>
      <input value={search} onChange={e=>setSearch(e.target.value)} placeholder="🔍 Buscar por nombre o teléfono..." style={{...is,marginBottom:16}}/>
      {filtered.length===0?(<div style={{padding:32,textAlign:"center",color:"#94a3b8",backgroundColor:"#faf9f6",borderRadius:12,border:"1px dashed #e2e8f0"}}><div style={{fontSize:32,marginBottom:8}}>👤</div><div style={{fontWeight:600}}>{search?"Sin resultados":"Sin clientes aún"}</div></div>):(
        <div style={{display:"flex",flexDirection:"column",gap:6}}>
          {filtered.map(c=>{
            const lastH=(c.history||[]).map(h=>h.date).sort().reverse()[0];
            const today=new Date().toISOString().slice(0,10);
            const daysSince=lastH?Math.round((new Date(today)-new Date(lastH+"T12:00:00"))/(1000*60*60*24)):null;
            return(<div key={c.id} onClick={()=>onSelect(c.id)}
              style={{backgroundColor:"#fff",borderRadius:10,padding:"12px 14px",border:"1px solid #e2e8f0",cursor:"pointer",display:"flex",alignItems:"center",gap:12,transition:"background 0.15s"}}
              onMouseEnter={e=>e.currentTarget.style.backgroundColor="#faf9f6"}
              onMouseLeave={e=>e.currentTarget.style.backgroundColor="#fff"}>
              <div style={{width:40,height:40,borderRadius:10,backgroundColor:"#fdf8ee",display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,flexShrink:0}}>💅</div>
              <div style={{flex:1,minWidth:0}}>
                <div style={{fontWeight:700,fontSize:13,color:"#1e293b"}}>{`${c.lastName||""}, ${c.firstName||""}`.trim()||"Sin nombre"}</div>
                <div style={{fontSize:11,color:"#64748b",marginTop:2}}>{c.phone||""}{lastH&&<span style={{marginLeft:8,color:daysSince>30?"#ef4444":"#94a3b8"}}>· último servicio hace {daysSince}d</span>}</div>
              </div>
              <div style={{color:"#94a3b8",fontSize:18}}>›</div>
            </div>);
          })}
        </div>
      )}
    </div>
  );
}

// ─── MAIN APP ─────────────────────────────────────────────────────────────────
const emptyClient=(id="")=>({id:id||Date.now().toString(),firstName:"",lastName:"",phone:"",email:"",birthDate:"",instagram:"",notes:"",history:[],payments:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()});

export default function DubaiApp(){
  const [clients,setClients]=useState([]);
  const [services,setServices]=useState([]);
  const [selectedClientId,setSelectedClientId]=useState(null);
  const [view,setView]=useState("inicio");
  const [loading,setLoading]=useState(true);
  const [sidebarOpen,setSidebarOpen]=useState(false);
  const autoSaveTimer=useRef(null);
  const isMobile=typeof window!=="undefined"&&window.innerWidth<768;

  useEffect(()=>{
    (async()=>{
      setLoading(true);
      try{
        const [rc,rs]=await Promise.all([sList("dubai_client:"),sList("dubai_services:")]);
        const cls=[];
        for(const k of(rc?.keys||[])){const r=await sGet(k);if(r?.value)try{cls.push(JSON.parse(r.value));}catch{}}
        cls.sort((a,b)=>(a.lastName||"").localeCompare(b.lastName||""));
        setClients(cls);
        const rss=await sGet("dubai_services:all");
        if(rss?.value)try{setServices(JSON.parse(rss.value));}catch{}
      }finally{setLoading(false);}
    })();
  },[]);

  const sel=clients.find(c=>c.id===selectedClientId);

  const handleClientChange=useCallback(updated=>{
    setClients(prev=>prev.map(c=>c.id===updated.id?updated:c));
    if(autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current=setTimeout(()=>sSet(`dubai_client:${updated.id}`,updated),2000);
  },[]);

  const handleServicesChange=useCallback(async list=>{
    setServices(list);
    await sSet("dubai_services:all",list);
  },[]);

  const handleNew=()=>{
    const c=emptyClient();
    setClients(prev=>[c,...prev]);
    setSelectedClientId(c.id);
    setSidebarOpen(false);
  };

  const handleSelectClient=id=>{
    setSelectedClientId(id);
    setSidebarOpen(false);
  };

  const handleDeleteClient=async()=>{
    if(!sel||!window.confirm(`¿Eliminar a ${sel.firstName} ${sel.lastName}?`)) return;
    await sDel(`dubai_client:${sel.id}`);
    setClients(prev=>prev.filter(c=>c.id!==sel.id));
    setSelectedClientId(null);
  };

  const navBtn=(v,label)=>(
    <button onClick={()=>{setView(v);setSelectedClientId(null);setSidebarOpen(false);}}
      style={{width:"100%",padding:"9px 12px",borderRadius:9,textAlign:"left",
        border:`2px solid ${view===v&&!selectedClientId?"#b8973e":"#e2e8f0"}`,
        backgroundColor:view===v&&!selectedClientId?"#fdf8ee":"#fff",
        color:view===v&&!selectedClientId?"#b8973e":"#64748b",
        fontWeight:700,fontSize:12,cursor:"pointer",marginBottom:4}}>
      {label}
    </button>
  );

  return(
    <div style={{fontFamily:"'Inter',system-ui,sans-serif",display:"flex",height:"100vh",overflow:"hidden",backgroundColor:"#f8fafc"}}>
      {/* Mobile overlay */}
      {sidebarOpen&&isMobile&&<div onClick={()=>setSidebarOpen(false)} style={{position:"fixed",inset:0,backgroundColor:"rgba(0,0,0,0.4)",zIndex:199}}/>}

      {/* SIDEBAR */}
      <div style={{width:220,flexShrink:0,borderRight:"1px solid #e2e8f0",backgroundColor:"#fff",display:"flex",flexDirection:"column",
        position:isMobile?"fixed":"relative",height:"100vh",zIndex:200,
        transform:isMobile&&!sidebarOpen?"translateX(-100%)":"translateX(0)",transition:"transform 0.25s"}}>
        {/* Logo */}
        <div style={{padding:"14px 16px",borderBottom:"1px solid #f1f5f9",display:"flex",alignItems:"center",gap:10}}>
          <img src={LOGO_B64} alt="Dubai" style={{width:38,height:38,borderRadius:8,objectFit:"cover"}}/>
          <div>
            <div style={{fontWeight:800,fontSize:13,color:"#1e293b"}}>Dubai</div>
            <div style={{fontSize:10,color:"#94a3b8"}}>Salón de Belleza</div>
          </div>
          {isMobile&&<button onClick={()=>setSidebarOpen(false)} style={{marginLeft:"auto",background:"none",border:"none",fontSize:18,cursor:"pointer",color:"#94a3b8"}}>✕</button>}
        </div>

        {/* Nav */}
        <div style={{padding:"12px 12px 4px"}}>
          {navBtn("inicio","🏠 Inicio")}
          {navBtn("agenda","📅 Agenda")}
          {navBtn("estadisticas","📊 Estadísticas")}
        </div>
        <div style={{padding:"0 12px 6px",borderBottom:"1px solid #f1f5f9"}}>
          {navBtn("servicios","💅 Servicios")}
        </div>

        {/* Lista clientes */}
        <div style={{padding:"10px 12px 6px"}}>
          <button onClick={handleNew} style={{...btnPrimary,width:"100%",marginBottom:8,boxShadow:"0 4px 12px rgba(184,151,62,0.3)",fontSize:12}}>+ Nueva clienta</button>
          <input placeholder="🔍 Buscar..." onChange={e=>{}} style={{...is,margin:0,fontSize:12}}
            onInput={e=>{const v=e.target.value.toLowerCase();setClients(prev=>[...prev].sort((a,b)=>{const an=`${a.firstName}${a.lastName}`.toLowerCase().includes(v)?-1:1;const bn=`${b.firstName}${b.lastName}`.toLowerCase().includes(v)?-1:1;return an-bn;}));}}/>
        </div>
        <div style={{flex:1,overflowY:"auto"}}>
          {loading?<div style={{padding:16,textAlign:"center",color:"#94a3b8",fontSize:12}}>Cargando...</div>:(
            clients.map(c=>(
              <div key={c.id} onClick={()=>handleSelectClient(c.id)}
                style={{padding:"9px 14px",cursor:"pointer",borderBottom:"1px solid #f1f5f9",
                  backgroundColor:selectedClientId===c.id?"#fdf8ee":"#fff",
                  borderLeft:selectedClientId===c.id?"3px solid #b8973e":"3px solid transparent"}}
                onMouseEnter={e=>{if(selectedClientId!==c.id)e.currentTarget.style.backgroundColor="#faf9f6";}}
                onMouseLeave={e=>{if(selectedClientId!==c.id)e.currentTarget.style.backgroundColor="#fff";}}>
                <div style={{fontWeight:700,fontSize:12,color:"#1e293b"}}>{c.firstName||c.lastName?`${c.lastName}, ${c.firstName}`:"Sin nombre"}</div>
                {c.phone&&<div style={{fontSize:10,color:"#94a3b8",marginTop:1}}>{c.phone}</div>}
              </div>
            ))
          )}
        </div>
      </div>

      {/* MAIN CONTENT */}
      <div style={{flex:1,display:"flex",flexDirection:"column",overflow:"hidden"}}>
        {/* Topbar */}
        <div style={{padding:"12px 16px",borderBottom:"1px solid #e2e8f0",backgroundColor:"#fff",display:"flex",alignItems:"center",gap:10}}>
          {isMobile&&<button onClick={()=>setSidebarOpen(true)} style={{background:"none",border:"none",cursor:"pointer",fontSize:20,color:"#64748b"}}>☰</button>}
          <div style={{flex:1,fontSize:14,fontWeight:700,color:"#64748b"}}>
            {selectedClientId&&sel?`${sel.firstName||""} ${sel.lastName||""}`.trim()||"Sin nombre":VIEW_LABELS[view]||"Dubai"}
          </div>
          {selectedClientId&&sel&&(
            <button onClick={handleDeleteClient} style={{padding:"6px 10px",borderRadius:8,border:"2px solid #fee2e2",backgroundColor:"#fff",color:"#ef4444",fontWeight:600,fontSize:12,cursor:"pointer"}}>🗑</button>
          )}
        </div>

        {/* Content */}
        <div style={{flex:1,overflowY:"auto"}}>
          {loading?(<div style={{display:"flex",alignItems:"center",justifyContent:"center",height:"100%",color:"#94a3b8"}}>Cargando...</div>):(
            selectedClientId&&sel?(
              <ClientDetail client={sel} onChange={handleClientChange} onBack={()=>setSelectedClientId(null)} services={services}/>
            ):(
              view==="inicio"?<DashboardView clients={clients} onSelectClient={handleSelectClient} onNavigate={setView} services={services} onNewClient={({firstName,lastName,phone})=>{const c={id:Date.now().toString(),firstName,lastName,phone,email:"",instagram:"",notes:"",history:[],payments:[],createdAt:new Date().toISOString(),updatedAt:new Date().toISOString()};setClients(prev=>[c,...prev]);sSet(`dubai_client:${c.id}`,c);return c;}}/>:
              view==="agenda"?<AgendaView clients={clients} onSelectClient={handleSelectClient}/>:
              view==="servicios"?<ServicesPanel services={services} onChange={handleServicesChange}/>:
              view==="estadisticas"?<StatsView clients={clients}/>:
              <DashboardView clients={clients} onSelectClient={handleSelectClient} onNavigate={setView}/>
            )
          )}
        </div>
      </div>
    </div>
  );
}

import React, { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  Bell, CalendarDays, ChevronRight, Clock3, Home, Leaf, LogIn,
  MapPin, Menu, Phone, RefreshCw, Search, Sprout, Ticket, UserRound,
  Volume2, X, Zap
} from "lucide-react";
import api, { SOCKET_URL } from "./api";
import VoiceInput from "./VoiceInput";

const crops = ["wheat", "cotton", "sugarcane", "ragi", "maize", "tomato", "onion", "potato"];

function App() {
  const [page, setPage] = useState(localStorage.getItem("ks_token") ? "home" : "login");
  const [farmer, setFarmer] = useState(null);
  const [tokens, setTokens] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [centres, setCentres] = useState([]);
  const [toast, setToast] = useState("");

  const refreshUser = async () => {
    try {
      const [profile, myTokens, myAlerts] = await Promise.all([
        api.get("/auth/profile"),
        api.get("/queue/my-tokens"),
        api.get("/alerts/my-alerts")
      ]);
      setFarmer(profile.data);
      setTokens(myTokens.data);
      setAlerts(myAlerts.data);
    } catch {
      logout();
    }
  };

  useEffect(() => {
    if (!localStorage.getItem("ks_token")) return;
    refreshUser();
    api.get("/centres").then(r => setCentres(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (!farmer?._id) return;
    const socket = io(SOCKET_URL);
    socket.emit("join_farmer_room", farmer._id);
    socket.on("token_status_update", (data) => {
      setToast(`Token update: ${data.status}`);
      refreshUser();
    });
    socket.on("new_alert", (alert) => {
      setAlerts(a => [alert, ...a]);
      setToast(alert.message);
    });
    return () => socket.disconnect();
  }, [farmer?._id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const logout = () => {
    localStorage.removeItem("ks_token");
    setFarmer(null);
    setTokens([]);
    setAlerts([]);
    setPage("login");
  };

  if (page === "login") return <Auth mode="login" onSuccess={() => { setPage("home"); refreshUser(); }} onSwitch={() => setPage("register")} />;
  if (page === "register") return <Auth mode="register" onSuccess={() => { setPage("home"); refreshUser(); }} onSwitch={() => setPage("login")} />;

  const activeToken = tokens.find(t => ["booked", "in_queue", "in_progress"].includes(t.status));

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand" onClick={() => setPage("home")}>
          <div className="brand-mark"><Sprout size={22}/></div>
          <div><strong>KisanSetu</strong><span>AI</span><small>Smart procurement companion</small></div>
        </div>
        <nav className="desktop-nav">
          <button className={page==="home"?"active":""} onClick={()=>setPage("home")}><Home size={17}/> Home</button>
          <button className={page==="centres"?"active":""} onClick={()=>setPage("centres")}><MapPin size={17}/> Centres</button>
          <button className={page==="book"?"active":""} onClick={()=>setPage("book")}><CalendarDays size={17}/> Smart Slot</button>
          <button className={page==="tokens"?"active":""} onClick={()=>setPage("tokens")}><Ticket size={17}/> My Tokens</button>
          <button className={page==="alerts"?"active":""} onClick={()=>setPage("alerts")}><Bell size={17}/> Alerts {alerts.filter(a=>!a.read).length ? <b className="badge">{alerts.filter(a=>!a.read).length}</b> : null}</button>
        </nav>
        <div className="user-chip" onClick={logout}><UserRound size={18}/><span>{farmer?.name || "Farmer"}</span></div>
      </header>

      <main>
        {page==="home" && <HomePage farmer={farmer} activeToken={activeToken} centres={centres} alerts={alerts} go={setPage} />}
        {page==="centres" && <Centres centres={centres} farmer={farmer} />}
        {page==="book" && <Booking farmer={farmer} centres={centres} onBooked={() => {refreshUser(); setPage("tokens");}} />}
        {page==="tokens" && <Tokens tokens={tokens} onRefresh={refreshUser} />}
        {page==="alerts" && <Alerts alerts={alerts} refresh={refreshUser} />}
      </main>

      <footer><span>🌾 Built for farmers</span><span>Voice-friendly • AI-assisted • Real-time queue</span></footer>
      {toast && <div className="toast"><Zap size={17}/>{toast}<button onClick={()=>setToast("")}><X size={15}/></button></div>}
    </div>
  );
}

function Auth({mode, onSuccess, onSwitch}) {
  const [form, setForm] = useState({name:"", phone:"", password:"", preferredLanguage:"en", crops:["wheat"]});
  const [loading,setLoading]=useState(false), [error,setError]=useState("");
  const register = mode==="register";
  const submit = async e => {
    e.preventDefault(); setLoading(true); setError("");
    try {
      const body = register ? form : {phone:form.phone,password:form.password};
      const r = await api.post(register?"/auth/register":"/auth/login", body);
      localStorage.setItem("ks_token", r.data.token);
      onSuccess();
    } catch(e) { setError(e.response?.data?.message || "Could not connect to KisanSetu backend."); }
    finally { setLoading(false); }
  };
  return <div className="auth-page">
    <div className="auth-art">
      <div className="logo-big"><Sprout size={38}/></div>
      <h1>KisanSetu<span>AI</span></h1>
      <p>Less waiting. Smarter slots. Better procurement days.</p>
      <div className="feature-row"><div><Clock3/>Live Queue</div><div><Zap/>Smart Slots</div><div><Volume2/>Voice Ready</div></div>
    </div>
    <form className="auth-card" onSubmit={submit}>
      <div className="eyebrow">{register ? "NEW FARMER" : "WELCOME BACK"}</div>
      <h2>{register ? "Create your farmer account" : "Sign in to KisanSetu"}</h2>
      {register && <input placeholder="Full name" value={form.name} onChange={e=>setForm({...form,name:e.target.value})} required/>}
      <input placeholder="Phone number" value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})} required/>
      <input type="password" placeholder="Password" value={form.password} onChange={e=>setForm({...form,password:e.target.value})} required/>
      {register && <>
        <select value={form.preferredLanguage} onChange={e=>setForm({...form,preferredLanguage:e.target.value})}>
          <option value="en">English</option><option value="hi">Hindi</option><option value="kn">Kannada</option><option value="mr">Marathi</option><option value="te">Telugu</option>
        </select>
        <label className="field-label">Main crop</label>
        <select value={form.crops[0]} onChange={e=>setForm({...form,crops:[e.target.value]})}>{crops.map(c=><option key={c}>{c}</option>)}</select>
      </>}
      {error && <div className="error">{error}</div>}
      <button className="primary wide" disabled={loading}>{loading ? "Please wait..." : register ? "Create account" : "Sign in"} <ChevronRight size={18}/></button>
      <p className="switch">{register?"Already registered?":"New to KisanSetu?"} <button type="button" onClick={onSwitch}>{register?"Sign in":"Create account"}</button></p>
    </form>
  </div>;
}

function HomePage({farmer,activeToken,centres,alerts,go}) {
  const open = centres.filter(c=>c.status!=="closed").length;
  return <div className="page">
    <section className="hero">
      <div><div className="eyebrow">GOOD TO SEE YOU</div><h1>Namaste, {farmer?.name?.split(" ")[0] || "Farmer"} 👋</h1><p>Plan your procurement visit with less waiting and more certainty.</p>
        <div className="hero-actions"><button className="primary" onClick={()=>go("book")}><Zap size={18}/> Find my smart slot</button><button className="ghost" onClick={()=>go("centres")}><MapPin size={18}/> View centres</button></div>
      </div>
      <div className="hero-orb"><Sprout size={70}/></div>
    </section>
    <div className="stats"><Stat icon={<MapPin/>} label="Open centres" value={open}/><Stat icon={<Ticket/>} label="Active token" value={activeToken?`#${activeToken.tokenNumber}`:"—"}/><Stat icon={<Clock3/>} label="Predicted wait" value={activeToken?.predictedWaitMinutes ? `${activeToken.predictedWaitMinutes} min` : "—"}/><Stat icon={<Bell/>} label="Alerts" value={alerts.length}/></div>
    {activeToken ? <TokenCard token={activeToken}/> : <div className="empty-card"><Leaf size={28}/><div><strong>No active procurement token</strong><p>Choose a crop and let KisanSetu recommend a centre and slot.</p></div><button className="secondary" onClick={()=>go("book")}>Get a slot</button></div>}
    <section className="section-head"><div><div className="eyebrow">HOW IT HELPS</div><h2>Everything in one place</h2></div></section>
    <div className="feature-grid"><Feature icon={<Zap/>} title="AI recommendation" text="Find a suitable centre based on crop, location and queue conditions."/><Feature icon={<Clock3/>} title="Live queue" text="See your token and predicted waiting time without standing in line."/><Feature icon={<Volume2/>} title="Voice ready" text="The backend supports speech and multilingual assistance for farmers."/><Feature icon={<Bell/>} title="Instant alerts" text="Receive updates when your turn, slot or centre status changes."/></div>
  </div>
}
const Stat=({icon,label,value})=><div className="stat"><span>{icon}</span><div><b>{value}</b><small>{label}</small></div></div>;
const Feature=({icon,title,text})=><div className="feature"><div className="feature-icon">{icon}</div><h3>{title}</h3><p>{text}</p></div>;

function Centres({centres,farmer}) {
  const [q,setQ]=useState("");
  const shown=centres.filter(c=>c.name.toLowerCase().includes(q.toLowerCase()) || c.location?.district?.toLowerCase().includes(q.toLowerCase()));
  return <div className="page"><div className="section-head"><div><div className="eyebrow">PROCUREMENT NETWORK</div><h1>Nearby centres</h1><p>Live centre information from the KisanSetu backend.</p></div><div className="search"><Search size={17}/><input placeholder="Search centre or district" value={q} onChange={e=>setQ(e.target.value)}/><VoiceInput langCode={farmer?.preferredLanguage||"en"} onResult={setQ}/></div></div>
    <div className="centre-grid">{shown.map(c=><CentreCard key={c._id} c={c}/>)}{!shown.length&&<div className="empty-card">No centres found.</div>}</div>
  </div>
}
function CentreCard({c}) {
  const congestion=c.currentQueueLength>c.capacityPerSlot*2?"high":c.currentQueueLength>c.capacityPerSlot?"moderate":"normal";
  return <div className="centre-card"><div className="centre-top"><span className={`status ${c.status}`}>{c.status}</span><span className={`congestion ${congestion}`}>{congestion} queue</span></div><h3>{c.name}</h3><p><MapPin size={15}/> {c.location?.district || c.location?.address || "Location available"}</p><div className="meter"><span style={{width:`${Math.min(100,(c.currentQueueLength/(c.capacityPerSlot*2))*100)}%`}}/></div><div className="centre-bottom"><span><Ticket size={15}/> {c.currentQueueLength} waiting</span><span>{c.capacityPerSlot}/slot</span></div><div className="crop-tags">{c.cropsAccepted?.map(x=><span key={x}>{x}</span>)}</div></div>
}

function Booking({farmer,centres,onBooked}) {
  const [crop,setCrop]=useState(farmer?.crops?.[0]||"wheat"), [date,setDate]=useState(""), [location,setLocation]=useState({lat:farmer?.location?.lat||15.3647,lng:farmer?.location?.lng||75.124}), [rec,setRec]=useState(null), [loading,setLoading]=useState(false), [error,setError]=useState(""), [heard,setHeard]=useState("");
  const recommend=async()=>{setLoading(true);setError("");try{const r=await api.post("/slots/recommend",{crop,farmerLocation:location,date:date||undefined});setRec(r.data)}catch(e){setError(e.response?.data?.message||"No recommendation available.")}finally{setLoading(false)}};
  const book=async slot=>{setLoading(true);try{await api.post("/queue/book",{slotId:slot._id,crop,quantityKg:0});onBooked()}catch(e){setError(e.response?.data?.message||"Booking failed.")}finally{setLoading(false)}};
  const onVoiceCrop=text=>{
    setHeard(text);
    const match=crops.find(c=>text.toLowerCase().includes(c));
    if(match) setCrop(match);
  };
  return <div className="page"><div className="section-head"><div><div className="eyebrow">AI-ASSISTED</div><h1>Find a smart slot</h1><p>Choose your crop and date. The backend will recommend a suitable centre.</p></div></div>
    <div className="booking-layout"><div className="panel"><label>Crop <VoiceInput langCode={farmer?.preferredLanguage||"en"} onResult={onVoiceCrop}/></label><select value={crop} onChange={e=>setCrop(e.target.value)}>{crops.map(c=><option key={c}>{c}</option>)}</select>{heard&&<div className="voice-heard">Heard: "{heard}"</div>}<label>Preferred date</label><input type="date" value={date} onChange={e=>setDate(e.target.value)}/><div className="location-box"><MapPin/><div><b>Farmer location</b><small>{farmer?.location?.district || "Using demo/current location"}</small></div></div><button className="primary wide" onClick={recommend} disabled={loading}><Zap size={18}/>{loading?"Finding...":"Recommend centre & slots"}</button>{error&&<div className="error">{error}</div>}</div>
    <div className="recommend-panel">{!rec?<div className="recommend-empty"><Sprout size={42}/><h3>AI recommendation appears here</h3><p>We'll use the backend's centre recommendation service and available slots.</p></div>:<><div className="recommended"><span>RECOMMENDED CENTRE</span><h2>{rec.recommendedCentre?.name}</h2><p><MapPin size={15}/> {rec.recommendedCentre?.location?.district}</p><div className="reason">{rec.recommendation?.reason || "Recommended by KisanSetuAI"}</div></div><h3>Available slots</h3>{rec.availableSlots?.length?rec.availableSlots.map(s=><div className="slot-row" key={s._id}><div><b>{s.startTime} – {s.endTime}</b><small>{new Date(s.date).toLocaleDateString()} • {s.capacity-s.booked} spots left</small></div><button className="secondary" onClick={()=>book(s)}>Book <ChevronRight size={16}/></button></div>):<p>No available slots for this selection.</p>}</>}</div></div>
  </div>
}

function Tokens({tokens,onRefresh}) {
  return <div className="page"><div className="section-head"><div><div className="eyebrow">YOUR VISITS</div><h1>My tokens</h1><p>Track booked, in-queue and completed procurement visits.</p></div><button className="ghost" onClick={onRefresh}><RefreshCw size={17}/> Refresh</button></div>
    <div className="token-list">{tokens.map(t=><TokenCard token={t} full key={t._id}/>)}{!tokens.length&&<div className="empty-card"><Ticket/><div><strong>No tokens yet</strong><p>Your booked procurement tokens will appear here.</p></div></div>}</div>
  </div>
}

function TokenCard({token,full=false}) {
  const statusLabel=token.status.replace("_"," ");
  return <div className={`token-card ${full?"full":""}`}><div className="token-number"><small>TOKEN</small><b>#{token.tokenNumber}</b></div><div className="token-main"><span className={`status-pill ${token.status}`}>{statusLabel}</span><h3>{token.centre?.name || "Procurement centre"}</h3><p><CalendarDays size={15}/> {token.slot?.date ? new Date(token.slot.date).toLocaleDateString() : "Date"} &nbsp; <Clock3 size={15}/> {token.slot?.startTime || "—"} – {token.slot?.endTime || "—"}</p><p><Leaf size={15}/> {token.crop} {token.quantityKg ? `• ${token.quantityKg} kg` : ""}</p></div><div className="wait"><small>Predicted wait</small><b>{token.predictedWaitMinutes ?? "—"} min</b></div></div>
}

function Alerts({alerts,refresh}) {
  const mark=async a=>{try{await api.patch(`/alerts/${a._id}/read`);refresh()}catch{}};
  return <div className="page"><div className="section-head"><div><div className="eyebrow">NOTIFICATIONS</div><h1>Alerts</h1><p>Centre, slot and turn updates.</p></div></div>
    <div className="alert-list">{alerts.map(a=><div className={`alert ${a.read?"read":""}`} key={a._id}><div className="alert-icon"><Bell size={19}/></div><div><div className="alert-top"><b>{a.type.replace("_"," ")}</b><small>{new Date(a.createdAt).toLocaleString()}</small></div><p>{a.message}</p>{a.audioUrl&&<button className="audio" onClick={()=>new Audio(a.audioUrl.startsWith("http")?a.audioUrl:`${SOCKET_URL}${a.audioUrl}`).play()}><Volume2 size={16}/> Listen</button>}</div>{!a.read&&<button className="mark" onClick={()=>mark(a)}>Mark read</button>}</div>)}{!alerts.length&&<div className="empty-card"><Bell/><div><strong>No alerts</strong><p>Important updates will appear here.</p></div></div>}</div>
  </div>
}

export default App;
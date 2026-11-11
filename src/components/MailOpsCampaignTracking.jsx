import { useEffect, useRef, useState } from "react";
import { http } from "../services/api";
import SectionCard from "./ui/SectionCard";
import MailOpsFeedHealth from "./MailOpsFeedHealth";

const BASE="/mailops/iv/campaigns";
const OPTIONS={skipWorkspaceInjection:true,timeout:25000};
export default function MailOpsCampaignTracking(){
  const [trackingOpen, setTrackingOpen] = useState(true);
  const [access,setAccess]=useState(null),[campaigns,setCampaigns]=useState([]),[selected,setSelected]=useState("");
  const [summary,setSummary]=useState(null),[events,setEvents]=useState(null),[csv,setCsv]=useState(""),[preview,setPreview]=useState(null);
  const [token,setToken]=useState(null),[busy,setBusy]=useState(false),[error,setError]=useState("");
  const alive=useRef(true),pending=useRef(new Set()),selectedRef=useRef("");
  selectedRef.current=selected;
  useEffect(()=>{alive.current=true;return()=>{alive.current=false;for(const c of pending.current)c.abort();};},[]);
  async function request(method,path,body){
    const controller=new AbortController();pending.current.add(controller);
    try{
      const response=await http.request({...OPTIONS,method,url:path,data:body,signal:controller.signal});
      return response.data;
    }finally{pending.current.delete(controller);}
  }
  function failure(err){
    if(err?.code==="ERR_CANCELED")return;
    if(alive.current)setError(err?.response?.data?.message||"Campaign tracking is unavailable. No coverage result was assumed.");
  }
  async function refreshList(){
    const data=await request("GET",BASE);
    if(alive.current)setCampaigns(data.campaigns);
  }
  async function refresh(id){
    let data;
    try { data=await request("GET",BASE+"/"+id); }
    catch(err){if(alive.current && selectedRef.current===id)setSummary(null);throw err;}
    if(alive.current && selectedRef.current===id)setSummary(data);
  }
  useEffect(()=>{
    request("GET",BASE+"/status").then(async data=>{
      if(!alive.current)return;
      setAccess(data);
      if(data.enabled)await refreshList();
    }).catch(failure);
  },[]);
  useEffect(()=>{
    setSummary(null);setEvents(null);setCsv("");setPreview(null);setToken(null);setError("");
    if(!selected)return;
    let stopped=false;
    const run=()=>{if(!stopped)refresh(selected).catch(err=>{if(selectedRef.current===selected)failure(err);});};
    run();
    const timer=setInterval(run,60000);
    return()=>{stopped=true;clearInterval(timer);};
  },[selected]);
  async function action(fn){
    if(busy)return;
    setBusy(true);setError("");
    try{await fn();}catch(err){failure(err);}finally{if(alive.current)setBusy(false);}
  }
  if(!access?.enabled)return null;
  return <SectionCard title="Campaign mail tracking" subtitle="Import a barcode manifest and receive ongoing USPS feed events through your campaign relay."
right={<button type="button" className="vs-button vs-button-secondary" aria-expanded={trackingOpen} aria-controls="mailops-campaign-body" onClick={() => setTrackingOpen(open => !open)}>{trackingOpen ? "Collapse" : "Open"}</button>}>
<div id="mailops-campaign-body" hidden={!trackingOpen}>
    <p>Scans reflect files received from your configured relay. Missing scans do not prove a delay. Logical and assumed events are not physical scans or proof of delivery. Acceptance documentation remains separate.</p>
    {error&&<p role="alert">{error}</p>}
    <fieldset disabled={busy} style={{display:"grid",gap:12,minWidth:0}}>
      <legend>Campaigns</legend>
      {access.can_manage&&<form onSubmit={e=>{
        e.preventDefault();const form=e.currentTarget;
        const body=Object.fromEntries(new FormData(form));
        action(async()=>{const data=await request("POST",BASE,body);await refreshList();if(alive.current){setSelected(data.campaign.id);form.reset();}});
      }}>
        <label>Campaign or mailing name<input className="vs-input" name="name" maxLength={120} required/></label>
        <label>Mailing date<input className="vs-input" name="mailing_date" type="date" required/></label>
        <button className="vs-button" type="submit">Create tracked mailing</button>
      </form>}
      <label>Select mailing<select className="vs-input" value={selected} onChange={e=>setSelected(e.target.value)}>
        <option value="">Choose a mailing</option>
        {campaigns.map(c=><option key={c.id} value={c.id}>{c.name} ({c.source_mode})</option>)}
      </select></label>
      {selected&&<button className="vs-button" type="button" onClick={()=>action(()=>refresh(selected))}>Refresh campaign coverage</button>}
      {selected&&access.can_manage&&<>
        <label>Manifest CSV — imb,sequence
          <input type="file" accept=".csv,text/csv" onChange={e=>{
            const file=e.target.files?.[0];const id=selected;
            setPreview(null);setCsv("");
            if(!file)return;
            if(file.size>1000000){setError("Choose a CSV under 1 MB, with no more than 5,000 pieces.");return;}
            action(async()=>{
              const text=await file.text();
              if(alive.current&&selectedRef.current===id)setCsv(text);
            });
          }}/>
        </label>
        <p>Upload full numeric IMbs as text, retaining leading zeroes. Recipient names and addresses are not accepted. Manifest changes stop after the first feed batch.</p>
        <button className="vs-button" type="button" disabled={!csv} onClick={()=>action(async()=>{
          const data=await request("POST",BASE+"/"+selected+"/manifest",{action:"preview",csv});
          if(alive.current)setPreview(data);
        })}>Preview manifest import</button>
        {preview&&<>
          <p>{preview.input_rows} rows reviewed; {preview.new_pieces} new pieces. Existing pieces: {preview.existing_pieces}.</p>
          <button className="vs-button" type="button" onClick={()=>action(async()=>{
            await request("POST",BASE+"/"+selected+"/manifest",{action:"apply",csv,plan:preview.plan});
            if(alive.current){setPreview(null);setCsv("");}
            await refresh(selected);
          })}>Apply reviewed manifest</button>
        </>}
        <p>A relay token authorizes imports for this mailing only. Rotating it invalidates the previous token.</p>
        <button className="vs-button" type="button" onClick={()=>action(async()=>{
          const data=await request("POST",BASE+"/"+selected+"/feed-token",{action:"rotate"});
          if(alive.current)setToken(data.token);
          await refresh(selected);
        })}>Create or rotate relay token</button>
        <button className="vs-button" type="button" onClick={()=>action(async()=>{
          await request("POST",BASE+"/"+selected+"/feed-token",{action:"revoke"});
          if(alive.current)setToken(null);
          await refresh(selected);
        })}>Revoke relay token</button>
        {token&&<div>
          <p>Copy this token to your private relay configuration. It is shown only now; do not share it or put it in a URL.</p>
          <code style={{overflowWrap:"anywhere"}}>{token}</code>
          <button type="button" onClick={()=>setToken(null)}>Hide token</button>
        </div>}
      </>}
    </fieldset>
    {busy&&<p role="status">Working…</p>}
    {summary&&<div aria-live="polite">
      <h3>{summary.campaign.name}</h3>
      <dl>
        <dt>Manifest pieces</dt><dd>{summary.totals.total_pieces}</dd>
        <dt>Pieces with any event</dt><dd>{summary.totals.observed_pieces}</dd>
        <dt>Pieces with an actual scan</dt><dd>{summary.totals.actual_scan_pieces}</dd>
        <dt>Pieces without any reported event</dt><dd>{summary.totals.no_scan_received}</dd>
        <dt>Assumed events</dt><dd>{summary.totals.assumed_events}</dd>
        <dt>Logical events</dt><dd>{summary.totals.logical_events}</dd>
      </dl>
      <MailOpsFeedHealth health={summary.feed_health} />
      <p>First 100 manifest pieces. Event timestamps retain the USPS source text and may be local time.</p>
      <ul>{summary.pieces.map(piece=><li key={piece.imb} style={{overflowWrap:"anywhere"}}>
        {piece.sequence||"No sequence label"} — {piece.imb} — {piece.event_count} events
        <button type="button" disabled={busy} onClick={()=>action(async()=>{
          const id=selected;
          const data=await request("POST",BASE+"/"+id+"/events",{imb:piece.imb});
          if(alive.current&&selectedRef.current===id)setEvents(data.events);
        })}>View events</button>
      </li>)}</ul>
      {events&&<ol>{events.map((ev,index)=><li key={index}>{ev.event_time} · {ev.event_type} · Code {ev.event_code} · {ev.facility}</li>)}</ol>}
    </div>}
  </div>
</SectionCard>;
}

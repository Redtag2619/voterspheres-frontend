import React from 'react';
import { displayBlocks } from '../lib/deliverableDisplay.js';
function inline(text='') {
 return text.split(/(\*\*[^*]+\*\*)/g).map((part,index)=>part.startsWith('**')&&part.endsWith('**')?<strong key={index}>{part.slice(2,-2)}</strong>:part);
}
export default function DeliverableContent({content='',evidence=null,quality=null}) {
 const blocks=displayBlocks(content),rendered=[];
 for(let i=0;i<blocks.length;i++) {
  const block=blocks[i];
  if(block.type==='list_item') {
   const children=[<li key={i}>{inline(block.text)}</li>],ordered=block.ordered;
   while(blocks[i+1]?.type==='list_item'&&blocks[i+1].ordered===ordered){i++;children.push(<li key={i}>{inline(blocks[i].text)}</li>);}
   const Tag=ordered?'ol':'ul';rendered.push(<Tag key={'list-'+i}>{children}</Tag>);
  } else if(block.type==='heading') {
   const Tag='h'+Math.min(block.level+1,6);rendered.push(<Tag key={i}>{inline(block.text)}</Tag>);
  } else if(block.type==='rule')rendered.push(<hr key={i}/>);
  else if(block.type==='code')rendered.push(<pre key={i}><code>{block.text}</code></pre>);
  else rendered.push(<p key={i}>{inline(block.text)}</p>);
 }
 return <div className="studio-deliverable-content" style={{whiteSpace:'normal'}}>
  {evidence?<aside aria-label="Evidence assessment" style={{padding:12,border:'1px solid #64748b',borderRadius:8,marginBottom:12}}>
   <strong>{evidence.status==='assumption_based'?'Assumption-based plan':'Selected-cycle context supplied'}</strong>
   <p>Confidence: not calibrated. Live research: {evidence.live_research_connected?'connected':'not connected'}.</p>
   {evidence.sources_supplied?.length?<ul>{evidence.sources_supplied.map((item,index)=><li key={index}>{item.source}: {item.scope==='selected_cycle_context'?'selected-cycle context':'shared operational context'}</li>)}</ul>:<p>No record sources were supplied.</p>}
   <small>Supplied context does not establish individual claim attribution or independent factual verification.</small>
  </aside>:null}
  {quality?.status==='needs_review'?<details open aria-label="Deliverable quality review">
   <summary>Milestone details need review ({quality.issues.length} issues)</summary>
   <ul>{quality.issues.map((item,index)=><li key={index}>{item.milestone} — {item.field}: {item.reason}</li>)}</ul>
  </details>:null}
  {quality?.status==='complete'?<p><small>Milestone fields pass structural quality checks. Factual accuracy still requires review.</small></p>:null}
  {rendered}
 </div>;
}

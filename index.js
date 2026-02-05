const API="http://localhost:10000";

const token=localStorage.getItem("token");

const state=document.getElementById("state");
const county=document.getElementById("county");
const party=document.getElementById("party");
const office=document.getElementById("office");
const searchBox=document.getElementById("search");
const results=document.getElementById("results");

let page=1;

/* ============================
   LOAD DROPDOWNS
============================ */

fetch(API+"/api/dropdowns/states")
.then(r=>r.json())
.then(d=>{
 state.innerHTML='<option value="">State</option>';
 d.forEach(x=>state.innerHTML+=`<option value="${x.id}">${x.name}</option>`);
});

fetch(API+"/api/dropdowns/parties")
.then(r=>r.json())
.then(d=>{
 party.innerHTML='<option value="">Party</option>';
 d.forEach(x=>party.innerHTML+=`<option value="${x.id}">${x.name}</option>`);
});

fetch(API+"/api/dropdowns/offices")
.then(r=>r.json())
.then(d=>{
 office.innerHTML='<option value="">Office</option>';
 d.forEach(x=>office.innerHTML+=`<option value="${x.id}">${x.name}</option>`);
});

state.onchange=()=>{
 fetch(API+"/api/dropdowns/counties?state="+state.value)
 .then(r=>r.json())
 .then(d=>{
  county.innerHTML='<option value="">County</option>';
  d.forEach(x=>county.innerHTML+=`<option value="${x.id}">${x.name}</option>`);
 });
};

/* ============================
   SEARCH
============================ */

function load(){

 const params=new URLSearchParams({
  q:searchBox.value,
  state:state.value,
  county:county.value,
  party:party.value,
  office:office.value,
  page
 });

 fetch(API+"/api/candidates?"+params)
 .then(r=>r.json())
 .then(d=>{
  results.innerHTML="";
  d.results.forEach(c=>{
    results.innerHTML+=`
     <div>
       <b>${c.full_name}</b><br>
       ${c.email||""}
     </div><hr>`;
  });

  document.getElementById("pages").innerText=
   `Page ${d.page} of ${Math.ceil(d.total/20)}`;
 });
}

function nextPage(){page++;load();}
function prevPage(){if(page>1){page--;load();}}

/* ============================
   EXPORT
============================ */

function exportCSV(){

 const q=new URLSearchParams({
   state:state.value,
   county:county.value,
   party:party.value,
   office:office.value
 });

 fetch(API+"/api/export?"+q,{
  headers:{Authorization:"Bearer "+token}
 })
 .then(r=>r.blob())
 .then(b=>{
  const a=document.createElement("a");
  a.href=URL.createObjectURL(b);
  a.download="candidates.csv";
  a.click();
 });
}

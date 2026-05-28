const API_BASES = (window.location.protocol === 'file:' || window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1')
  ? ['http://localhost:3001','http://localhost:3000'] : [''];
async function fetchWithFallback(path, options={}){
  let lastError;
  for(const base of API_BASES){
    const url = base ? `${base}${path}` : path;
    try{ const res = await fetch(url, options); if(res.ok) return res; lastError = new Error(`HTTP ${res.status}`);}catch(err){lastError=err;}
  }
  throw lastError;
}
async function loadEmergencySims(){
  const statusEl = document.getElementById('simStatus');
  if (statusEl) statusEl.textContent = 'Detecting live device SIMs...';
  try{
    const allData = await fetchWithFallback('/api/emergency-requests?range=all');
    const sims = new Set();
    (allData.requests||[]).forEach(r=>{ if(r.donor_id) sims.add(r.donor_id); });
    const sel=document.getElementById('emergencySimSelect');
    sel.innerHTML = '<option value="">Select device</option>' + [...sims].map(id=>`<option value="${id}">${id}</option>`).join('');
    if (statusEl) statusEl.textContent = 'Live device detected all SIMs.';
  }catch(e){
    console.error('Failed to load device SIMs',e);
    if (statusEl) statusEl.textContent = 'Failed to detect SIMs.';
  }
}
document.getElementById('fetchBtn').addEventListener('click', async()=>{
  const sim=document.getElementById('emergencySimSelect').value.trim();
  const range=document.getElementById('emergencyRange').value;
  if(!sim){alert('Select a device');return;}
  try{
    const res = await fetch(`/api/emergency-requests?phone=${encodeURIComponent(sim)}&range=${range}`);
    if(!res.ok) throw new Error('Fetch error');
    const data = await res.json();
    const container=document.getElementById('result');
    if(data.requests && data.requests.length){
      let html='<table><tr><th>Date</th><th>Patient Name</th><th>Reference ID</th></tr>';
      data.requests.forEach(r=>{
        const date = new Date(r.timestamp).toLocaleString();
        html+=`<tr><td>${date}</td><td>${r.requester_name}</td><td>${r.id}</td></tr>`;
      });
      html+='</table>';
      container.innerHTML = html;
      container.style.display='block';
      document.getElementById('printBtn').style.display='inline-block';
    }else{
      container.innerHTML='<p>No records found.</p>';
      container.style.display='block';
      document.getElementById('printBtn').style.display='none';
    }
  }catch(e){alert('Error fetching data');}
});
document.getElementById('printBtn').addEventListener('click',()=>{
  const content = document.getElementById('result').innerHTML;
  const w = window.open('', '', 'width=800,height=600');
  w.document.write(`<html><head><title>Emergency Receipt</title></head><body style="background:#1a1a1a;color:#fff;font-family:Arial;">${content}</body></html>`);
  w.document.close();
  w.print();
});
loadEmergencySims();

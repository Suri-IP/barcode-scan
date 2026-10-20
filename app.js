(() => {
  'use strict';
  const STORAGE_KEY = 'barcodetech-scanner-history-v1';
  const SUPPORTED = ['EAN_13', 'EAN_8', 'UPC_A', 'CODE_128'];
  const $ = (id) => document.getElementById(id);
  const els = {video:$('video'),frame:$('cameraFrame'),placeholder:$('cameraPlaceholder'),cameraTitle:$('cameraTitle'),cameraMessage:$('cameraMessage'),status:$('cameraStatus'),live:$('livePill'),start:$('startButton'),stop:$('stopButton'),result:$('resultValue'),type:$('resultType'),copy:$('copyButton'),copyFeedback:$('copyFeedback'),list:$('historyList'),empty:$('emptyHistory'),count:$('historyCount'),export:$('exportButton'),clear:$('clearButton'),form:$('checkForm'),input:$('manualInput'),validation:$('validationMessage')};
  let history = readHistory();
  let controls = null;
  let scanning = false;
  let lastScan = {value:'', at:0};

  function readHistory() {
    try { const v = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]'); return Array.isArray(v) ? v.filter(x => x && typeof x.value === 'string' && typeof x.format === 'string' && Number.isFinite(x.timestamp)).slice(0,200) : []; }
    catch { return []; }
  }
  function saveHistory() { try { localStorage.setItem(STORAGE_KEY, JSON.stringify(history)); } catch { setStatus('พื้นที่จัดเก็บเต็มหรือถูกปิดใช้งาน ประวัติอาจไม่ถูกบันทึก'); } }
  function formatName(format) {
    const names = {EAN_13:'EAN-13',EAN_8:'EAN-8',UPC_A:'UPC-A',CODE_128:'Code 128'};
    if (names[format]) return names[format];
    const formats = window.ZXingBrowser && window.ZXingBrowser.BarcodeFormat;
    const key = formats && Object.keys(names).find(name => formats[name] === format);
    return key ? names[key] : format || 'บาร์โค้ด';
  }
  function addScan(value, format) {
    const now = Date.now();
    if (lastScan.value === value && now - lastScan.at < 1800) return;
    lastScan = {value,at:now};
    const item = {value, format:formatName(format), timestamp:now};
    history.unshift(item); history = history.slice(0,200); saveHistory(); renderHistory(); showResult(value,item.format);
    setStatus('อ่านบาร์โค้ดสำเร็จ · กล้องยังทำงานอยู่');
    if (navigator.vibrate) navigator.vibrate(45);
  }
  function showResult(value, format) { els.result.textContent=value; els.result.classList.add('has-value'); els.type.textContent=format; els.copy.disabled=false; els.copyFeedback.textContent=''; }
  function setStatus(message) { els.status.textContent=message; }
  function renderHistory() {
    els.list.replaceChildren(); els.count.textContent=String(history.length); els.empty.classList.toggle('hidden',history.length>0); els.export.disabled=history.length===0; els.clear.disabled=history.length===0;
    history.forEach((item,index)=>{
      const row=document.createElement('div'); row.className='history-item';
      const n=document.createElement('span'); n.className='history-index'; n.textContent=String(index+1).padStart(2,'0');
      const meta=document.createElement('div'); meta.className='history-meta';
      const code=document.createElement('div'); code.className='history-code'; code.textContent=item.value;
      const sub=document.createElement('div'); sub.className='history-sub'; sub.textContent=`${item.format} · ${new Date(item.timestamp).toLocaleString('th-TH',{dateStyle:'short',timeStyle:'short'})}`;
      const remove=document.createElement('button'); remove.type='button'; remove.className='remove-item'; remove.setAttribute('aria-label',`ลบ ${item.value} จากประวัติ`); remove.textContent='×'; remove.addEventListener('click',()=>{history.splice(index,1);saveHistory();renderHistory();});
      meta.append(code,sub); row.append(n,meta,remove); els.list.append(row);
    });
  }
  function stopCamera(message='หยุดกล้องแล้ว') {
    if (controls) { try { controls.stop(); } catch {} controls=null; }
    if (els.video.srcObject) { els.video.srcObject.getTracks().forEach(t=>t.stop()); els.video.srcObject=null; }
    scanning=false; els.frame.classList.remove('scanning'); els.live.classList.remove('active'); els.start.classList.remove('hidden'); els.stop.classList.add('hidden');
    if(message) setStatus(message);
  }
  function cameraError(error) {
    stopCamera('ไม่สามารถเปิดกล้องได้'); els.frame.classList.add('error');
    let title='เปิดกล้องไม่สำเร็จ', msg='โปรดลองอีกครั้ง หรือตรวจสอบการตั้งค่ากล้อง';
    if(location.protocol!=='https:' && location.hostname!=='localhost') { title='ต้องใช้การเชื่อมต่อ HTTPS'; msg='เปิดเว็บไซต์ผ่าน HTTPS เพื่อใช้กล้อง'; }
    else if(error && error.name==='CameraUnavailableError') { title='เบราว์เซอร์นี้ใช้กล้องไม่ได้'; msg='ลองเปิดด้วย Safari หรือ Chrome เวอร์ชันล่าสุด'; }
    else if(error && (error.name==='NotAllowedError'||error.name==='PermissionDeniedError')) { title='ยังไม่ได้รับอนุญาตใช้กล้อง'; msg='อนุญาต Camera ในการตั้งค่าเบราว์เซอร์ แล้วลองอีกครั้ง'; }
    else if(error && (error.name==='NotFoundError'||error.name==='DevicesNotFoundError')) { title='ไม่พบกล้อง'; msg='เชื่อมต่อกล้องหรือใช้โทรศัพท์ที่มีกล้อง'; }
    else if(error && error.name==='NotReadableError') { title='กล้องกำลังถูกใช้งาน'; msg='ปิดแอปอื่นที่ใช้กล้องแล้วลองอีกครั้ง'; }
    else if(!window.ZXingBrowser) { title='โหลดเครื่องสแกนไม่สำเร็จ'; msg='ตรวจสอบอินเทอร์เน็ตแล้วรีเฟรชหน้านี้'; }
    els.cameraTitle.textContent=title; els.cameraMessage.textContent=msg; els.frame.classList.add('error'); setStatus(msg);
  }
  async function startCamera() {
    if(scanning)return;
    els.frame.classList.remove('error'); els.start.disabled=true; els.start.querySelector('span').textContent='กำลังเปิดกล้อง…'; setStatus('กำลังขอสิทธิ์เข้าถึงกล้อง');
    try {
      if(location.protocol!=='https:' && location.hostname!=='localhost') { const e=new Error('HTTPS required');e.name='InsecureContextError';throw e; }
      if(!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) throw Object.assign(new Error('Camera API unavailable'),{name:'CameraUnavailableError'});
      if(!window.ZXingBrowser) throw new Error('ZXing library not loaded');
      const hints = new Map(); hints.set(ZXingBrowser.DecodeHintType.POSSIBLE_FORMATS, SUPPORTED.map(k=>ZXingBrowser.BarcodeFormat[k]));
      const reader = new ZXingBrowser.BrowserMultiFormatReader(hints);
      scanning=true;
      controls = await reader.decodeFromConstraints({audio:false,video:{facingMode:{ideal:'environment'},width:{ideal:1280},height:{ideal:720}}},els.video,(result,error)=>{
        if(result) addScan(result.getText(),result.getBarcodeFormat());
        else if(error && !(error instanceof ZXingBrowser.NotFoundException) && error.name!=='NotFoundException') { /* No barcode in this frame is expected while scanning. */ }
      });
      els.frame.classList.add('scanning'); els.live.classList.add('active'); els.start.classList.add('hidden'); els.stop.classList.remove('hidden'); setStatus('เล็งกล้องไปที่บาร์โค้ด');
    } catch(error) { cameraError(error); }
    finally { els.start.disabled=false; els.start.querySelector('span').textContent='เริ่มสแกน'; }
  }
  function checkDigit(code) {
    if(!/^\d+$/.test(code))return {valid:false,message:'กรุณากรอกตัวเลขเท่านั้น'};
    const expectedLength=code.length===8?8:code.length===12?12:code.length===13?13:0;
    if(!expectedLength)return {valid:false,message:'กรุณากรอก 8, 12 หรือ 13 หลัก'};
    const digits=code.split('').map(Number), check=digits.pop();
    const sum=digits.reduce((total,digit,index)=>total+digit*((digits.length-index)%2===1?3:1),0);
    const expected=(10-(sum%10))%10;
    return check===expected?{valid:true,message:`ถูกต้อง · Check Digit คือ ${expected}`}:{valid:false,message:`ไม่ถูกต้อง · ควรลงท้ายด้วย ${expected}`};
  }
  function csvCell(value) { return '"'+String(value).replace(/"/g,'""')+'"'; }
  function exportCsv() {
    const rows=[['Barcode','Format','Scanned at'],...history.map(item=>[item.value,item.format,new Date(item.timestamp).toISOString()])];
    const csv='\uFEFF'+rows.map(row=>row.map(csvCell).join(',')).join('\r\n');
    const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'})); const a=document.createElement('a'); a.href=url;a.download=`barcodetech-scans-${new Date().toISOString().slice(0,10)}.csv`;document.body.append(a);a.click();a.remove();URL.revokeObjectURL(url);
  }
  els.start.addEventListener('click',startCamera); els.stop.addEventListener('click',()=>stopCamera());
  els.copy.addEventListener('click',async()=>{try{await navigator.clipboard.writeText(els.result.textContent);els.copyFeedback.textContent='คัดลอกแล้ว';}catch{els.copyFeedback.textContent='คัดลอกไม่สำเร็จ · เลือกข้อความเพื่อคัดลอก';}});
  els.form.addEventListener('submit',event=>{event.preventDefault();const result=checkDigit(els.input.value.trim());els.validation.textContent=result.message;els.validation.className=`validation-message ${result.valid?'valid':'invalid'}`;});
  els.input.addEventListener('input',()=>{els.validation.textContent='รองรับตัวเลข 8, 12 หรือ 13 หลัก';els.validation.className='validation-message';});
  els.clear.addEventListener('click',()=>{if(!history.length)return;history=[];saveHistory();renderHistory();}); els.export.addEventListener('click',exportCsv);
  window.addEventListener('pagehide',()=>stopCamera(''));
  renderHistory();
})();

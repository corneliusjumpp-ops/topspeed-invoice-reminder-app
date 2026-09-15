'use client'
import {useEffect,useMemo,useState} from 'react'
import {browserDb} from '../lib/supabase'

const blank={customer_name:'',phone:'',email:'',description:'Piano Storage',amount:100,due_date:'',recurring:true,reminder_email:true,reminder_sms:true}
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(Number(n||0))

export default function Home(){
 const db=browserDb(); const [invoices,setInvoices]=useState([]); const [form,setForm]=useState(blank); const [msg,setMsg]=useState(''); const [q,setQ]=useState('')
 useEffect(()=>{load()},[])
 async function load(){const {data,error}=await db.from('invoices').select('*').order('created_at',{ascending:false}); if(error)setMsg(error.message); else setInvoices(data||[])}
 async function createInvoice(e){
   e.preventDefault()
   const payload={...form,amount:Number(form.amount||100),status:'unpaid'}
   const {data,error}=await db.from('invoices').insert(payload).select().single()
   if(error){setMsg(error.message);return}
   setForm(blank);setMsg('Invoice created.');load()
 }
 async function send(id,kind){
   setMsg(kind==='invoice'?'Sending invoice by email and text...':'Sending reminder by email and text...')
   const r=await fetch(`/api/${kind==='invoice'?'send-invoice':'send-reminder'}`,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({invoiceId:id})})
   const j=await r.json(); setMsg(j.message||j.error||'Done'); load()
 }
 async function markPaid(id){
   const {error}=await db.from('invoices').update({status:'paid',paid_at:new Date().toISOString()}).eq('id',id)
   if(error)setMsg(error.message); else {setMsg('Marked paid.');load()}
 }
 const filtered=useMemo(()=>invoices.filter(i=>JSON.stringify(i).toLowerCase().includes(q.toLowerCase())),[invoices,q])
 const unpaid=invoices.filter(i=>i.status!=='paid')
 const overdue=unpaid.filter(i=>i.due_date&&new Date(i.due_date+'T00:00:00')<new Date(new Date().toDateString()))
 return <><header><h1>TOPSPEED PIANO MOVING LLC</h1><p>Invoices • Email reminders • Text reminders • $100/month piano storage</p></header>
 <main>
 {msg&&<div className="notice">{msg}</div>}
 <div className="grid">
  <div className="card"><div className="muted">Invoices</div><div className="stat">{invoices.length}</div></div>
  <div className="card"><div className="muted">Unpaid</div><div className="stat">{unpaid.length}</div></div>
  <div className="card"><div className="muted">Overdue</div><div className="stat">{overdue.length}</div></div>
  <div className="card"><div className="muted">Outstanding</div><div className="stat">{money(unpaid.reduce((a,i)=>a+Number(i.amount||0),0))}</div></div>
 </div>

 <div className="card">
  <h2>Create Invoice</h2>
  <form onSubmit={createInvoice}>
   <div className="row"><div><label>Customer Name</label><input required value={form.customer_name} onChange={e=>setForm({...form,customer_name:e.target.value})}/></div><div><label>Phone</label><input value={form.phone} onChange={e=>setForm({...form,phone:e.target.value})}/></div></div>
   <div className="row"><div><label>Email</label><input type="email" value={form.email} onChange={e=>setForm({...form,email:e.target.value})}/></div><div><label>Due Date</label><input type="date" required value={form.due_date} onChange={e=>setForm({...form,due_date:e.target.value})}/></div></div>
   <div className="row"><div><label>Description</label><input value={form.description} onChange={e=>setForm({...form,description:e.target.value})}/></div><div><label>Amount</label><input type="number" step="0.01" value={form.amount} onChange={e=>setForm({...form,amount:e.target.value})}/></div></div>
   <div className="row"><label><input type="checkbox" checked={form.reminder_email} onChange={e=>setForm({...form,reminder_email:e.target.checked})}/> Email reminders</label><label><input type="checkbox" checked={form.reminder_sms} onChange={e=>setForm({...form,reminder_sms:e.target.checked})}/> Text reminders</label></div>
   <br/><button className="gold">Create Invoice</button>
  </form>
 </div>

 <div className="card">
  <div className="row"><h2 style={{margin:'5px 0'}}>Invoices</h2><input placeholder="Search customer or invoice" value={q} onChange={e=>setQ(e.target.value)}/></div>
  <table><thead><tr><th>Customer</th><th>Invoice</th><th>Due</th><th>Status</th><th>Actions</th></tr></thead>
  <tbody>{filtered.map(i=>{
    const od=i.status!=='paid'&&i.due_date&&new Date(i.due_date+'T00:00:00')<new Date(new Date().toDateString())
    return <tr key={i.id}>
      <td><b>{i.customer_name}</b><br/><span className="muted">{i.phone}<br/>{i.email}</span></td>
      <td>{i.description}<br/><b>{money(i.amount)}</b><br/><span className="muted">#{i.invoice_number||i.id.slice(0,8)}</span></td>
      <td>{i.due_date}</td>
      <td><span className={'badge '+(i.status==='paid'?'paid':od?'overdue':'unpaid')}>{i.status==='paid'?'PAID':od?'OVERDUE':'UNPAID'}</span></td>
      <td><div className="actions">
       <button onClick={()=>send(i.id,'invoice')}>Send Invoice</button>
       {i.status!=='paid'&&<button className="gold" onClick={()=>send(i.id,'reminder')}>Send Reminder</button>}
       {i.status!=='paid'&&<button className="green" onClick={()=>markPaid(i.id)}>Mark Paid</button>}
      </div></td>
    </tr>
  })}</tbody></table>
 </div>
 </main></>
}

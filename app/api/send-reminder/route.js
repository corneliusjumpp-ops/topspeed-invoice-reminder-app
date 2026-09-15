import {adminDb} from '../../../lib/supabase'
import {Resend} from 'resend'
import twilio from 'twilio'

function reminderText(i){
 return `TopSpeed Piano Moving LLC payment reminder: ${i.description} balance $${Number(i.amount).toFixed(2)} was due ${i.due_date}. If already paid, please disregard. Thank you.`
}
export async function POST(req){
 try{
  const {invoiceId}=await req.json(); const db=adminDb()
  const {data:i,error}=await db.from('invoices').select('*').eq('id',invoiceId).single()
  if(error||!i)return Response.json({error:'Invoice not found'},{status:404})
  let sent=[]
  if(i.reminder_email&&i.email){
   const resend=new Resend(process.env.RESEND_API_KEY)
   await resend.emails.send({from:process.env.FROM_EMAIL,to:i.email,subject:`Payment Reminder - TopSpeed Piano Moving LLC`,text:reminderText(i)})
   sent.push('email')
  }
  if(i.reminder_sms&&i.phone){
   const client=twilio(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN)
   await client.messages.create({from:process.env.TWILIO_FROM_NUMBER,to:i.phone,body:reminderText(i)})
   sent.push('text')
  }
  await db.from('invoice_events').insert({invoice_id:i.id,event_type:'reminder_sent',details:sent.join(', ')})
  return Response.json({message:`Reminder sent by ${sent.join(' and ')||'no channel'}.`})
 }catch(e){return Response.json({error:e.message},{status:500})}
}

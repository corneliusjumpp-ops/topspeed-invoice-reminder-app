import {adminDb} from '../../../lib/supabase'
import {Resend} from 'resend'
import twilio from 'twilio'

export async function GET(req){
 if(req.headers.get('authorization')!==`Bearer ${process.env.CRON_SECRET}`)return new Response('Unauthorized',{status:401})
 const db=adminDb()
 const today=new Date().toISOString().slice(0,10)
 const {data:list,error}=await db.from('invoices').select('*').neq('status','paid').lte('due_date',today)
 if(error)return Response.json({error:error.message},{status:500})
 let count=0
 for(const i of list||[]){
   const {data:last}=await db.from('invoice_events').select('*').eq('invoice_id',i.id).eq('event_type','reminder_sent').order('created_at',{ascending:false}).limit(1)
   if(last?.[0] && Date.now()-new Date(last[0].created_at).getTime()<24*60*60*1000)continue
   const text=`TopSpeed Piano Moving LLC payment reminder: ${i.description} balance $${Number(i.amount).toFixed(2)} was due ${i.due_date}. If already paid, please disregard.`
   if(i.reminder_email&&i.email){
     const resend=new Resend(process.env.RESEND_API_KEY)
     await resend.emails.send({from:process.env.FROM_EMAIL,to:i.email,subject:'Payment Reminder - TopSpeed Piano Moving LLC',text})
   }
   if(i.reminder_sms&&i.phone){
     const client=twilio(process.env.TWILIO_ACCOUNT_SID,process.env.TWILIO_AUTH_TOKEN)
     await client.messages.create({from:process.env.TWILIO_FROM_NUMBER,to:i.phone,body:text})
   }
   await db.from('invoice_events').insert({invoice_id:i.id,event_type:'reminder_sent',details:'automatic'})
   count++
 }
 return Response.json({processed:count})
}

import Stripe from 'stripe'
import { Resend } from 'resend'
import twilio from 'twilio'
import { adminDb } from '../../../lib/supabase'

export async function POST(req) {
  try {
    const db=admindb()
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)
    const signature = req.headers.get('stripe-signature')
    const body = await req.text()

    const event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET
    )

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object
      const invoiceId = session.metadata?.invoice_id

      if (invoiceId) {
        const db = admindb()

        const { error } = await db
          .from('invoices')
          .update({ status: 'paid' })
          .eq('id', invoiceId)

        if (error) {
          throw error
        }

        await db.from('invoice_events').insert({
          invoice_id: invoiceId,
          event_type: 'payment_received',
          details: `Stripe payment completed: ${session.id}`
        })
      }

      const { data: invoice } = await db
  .from('invoices')
  .select('*')
  .eq('id', invoiceId)
  .single()

if (invoice?.email) {
  const resend = new Resend(process.env.RESEND_API_KEY)

  await resend.emails.send({
    from: process.env.FROM_EMAIL,
    to: invoice.email,
    subject: `Payment Receipt - ${invoice.invoice_number || 'TopSpeed Invoice'}`,
    text: `TOPSPEED PIANO MOVING LLC

PAYMENT RECEIPT

Customer: ${invoice.customer_name || ''}
Invoice: ${invoice.invoice_number || ''}
Description: ${invoice.description || ''}
Amount Paid: $${Number(invoice.amount).toFixed(2)}
Status: PAID

Thank you for your payment.

TopSpeed Piano Moving LLC`
  })
}


if (invoice?.phone) {
  const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  )

  await client.messages.create({
    from: process.env.TWILIO_FROM_NUMBER,
    to: invoice.phone,
    body: `TOPSPEED PIANO MOVING LLC

PAYMENT RECEIPT

Customer: ${invoice.customer_name || ''}
Invoice: ${invoice.invoice_number || ''}
Description: ${invoice.description || ''}
Amount Paid: $${Number(invoice.amount).toFixed(2)}
Status: PAID

Thank you for your payment.`
  })
}
      
    }

    return Response.json({ received: true })
  } catch (e) {
    return Response.json(
      { error: e.message },
      { status: 400 }
    )
  }
}

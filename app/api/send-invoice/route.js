import { adminDb } from '../../../lib/supabase'
import { Resend } from 'resend'
import twilio from 'twilio'
import Stripe from 'stripe'

async function makePaymentLink(i) {
  const stripe = new Stripe(process.env.STRIPE_SECRET_KEY)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    customer_email: i.email || undefined,
    line_items: [
      {
        price_data: {
          currency: 'usd',
          unit_amount: Math.round(Number(i.amount) * 100),
          product_data: {
            name: `TopSpeed Invoice ${i.invoice_number || ''} - ${i.description}`
          }
        },
        quantity: 1
      }
    ],
    metadata: {
      invoice_id: String(i.id)
    },
    payment_intent_data: {
      metadata: {
        invoice_id: String(i.id)
      }
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/?payment=success`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/?payment=cancelled`
  })

  return session.url
}

export async function POST(req) {
  try {
    const { invoiceId } = await req.json()
    const db = adminDb()

    const { data: i, error } = await db
      .from('invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (error || !i) {
      return Response.json({ error: 'Invoice not found' }, { status: 404 })
    }

    const paymentLink =
      i.status === 'paid' ? '' : await makePaymentLink(i)

    const text =
      `TopSpeed Piano Moving LLC invoice ${i.invoice_number || ''}\n` +
      `${i.description}\n` +
      `Amount: $${Number(i.amount).toFixed(2)}\n` +
      `Due: ${i.due_date}\n` +
      (paymentLink ? `Pay securely: ${paymentLink}\n` : '') +
      `Please contact TopSpeed Piano Moving LLC if you have questions.`

    const sent = []

    if (i.email) {
      const resend = new Resend(process.env.RESEND_API_KEY)

      await resend.emails.send({
        from: process.env.FROM_EMAIL,
        to: i.email,
        subject: `TopSpeed Invoice ${i.invoice_number || ''} - ${i.description}`,
        text
      })

      sent.push('email')
    }

    if (i.phone) {
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )

      await client.messages.create({
        from: process.env.TWILIO_FROM_NUMBER,
        to: i.phone,
        body: text
      })

      sent.push('text')
    }

    await db.from('invoice_events').insert({
      invoice_id: i.id,
      event_type: 'invoice_sent',
      details: sent.join(', ')
    })

    return Response.json({
      message: `Invoice sent by ${sent.join(' and ') || 'no channel'} with Pay Now link.
    })
  } catch (e) {
    return Response.json({ error: e.message }, { status: 500 })
  }

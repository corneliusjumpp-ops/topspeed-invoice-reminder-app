import Stripe from 'stripe'
import { adminDb } from '../../../lib/supabase'

export async function POST(req) {
  try {
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
        const db = adminDb()

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
    }

    return Response.json({ received: true })
  } catch (e) {
    return Response.json(
      { error: e.message },
      { status: 400 }
    )
  }
}

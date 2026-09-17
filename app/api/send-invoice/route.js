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
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/payment-success`,
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
      return Response.json(
        { error: 'Invoice not found' },
        { status: 404 }
      )
    }

    const paymentLink =
      i.status === 'paid' ? '' : await makePaymentLink(i)

    const html = `
  <div style="font-family:Arial,sans-serif;background:#f4f7f9;padding:24px;color:#132238;">
    <div style="max-width:700px;margin:auto;background:#ffffff;border-radius:14px;overflow:hidden;border:1px solid #d9e2e8;">

      <div style="background:#075b73;color:white;padding:28px;">
        <h1 style="margin:0;font-size:28px;">TOPSPEED PIANO MOVING LLC</h1>
        <p style="margin:8px 0 0;">Piano Moving • Specialty Moving • Piano Storage</p>
      </div>

      <div style="padding:28px;">
        <table width="100%" cellpadding="0" cellspacing="0">
          <tr>
            <td style="vertical-align:top;">
              <strong>BILL TO:</strong><br><br>
              ${i.customer_name || i.name || 'Customer'}<br>
              ${i.phone || ''}<br>
              ${i.email || ''}
            </td>

            <td style="text-align:right;vertical-align:top;">
              <strong>INVOICE #</strong><br>
              ${i.invoice_number || ''}<br><br>
              <strong>DUE DATE</strong><br>
              ${i.due_date}
            </td>
          </tr>
        </table>

        <div style="background:#eef8fb;padding:18px;margin:26px 0;text-align:center;border-radius:10px;">
          <div style="font-size:14px;font-weight:bold;">BALANCE DUE</div>
          <div style="font-size:36px;font-weight:bold;">
            $${Number(i.amount).toFixed(2)}
          </div>
        </div>

        <table width="100%" cellpadding="12" cellspacing="0" style="border-collapse:collapse;">
          <tr style="background:#075b73;color:white;">
            <th align="left">DESCRIPTION</th>
            <th align="center">QTY</th>
            <th align="right">AMOUNT</th>
          </tr>

          <tr>
            <td style="border-bottom:1px solid #ddd;">${i.description}</td>
            <td align="center" style="border-bottom:1px solid #ddd;">1</td>
            <td align="right" style="border-bottom:1px solid #ddd;">
              $${Number(i.amount).toFixed(2)}
            </td>
          </tr>

          <tr>
            <td></td>
            <td align="right"><strong>TOTAL DUE</strong></td>
            <td align="right"><strong>$${Number(i.amount).toFixed(2)}</strong></td>
          </tr>
        </table>

        <div style="margin-top:30px;padding:22px;border:1px solid #d9e2e8;border-radius:10px;">
          <h2 style="margin-top:0;">Payment Options</h2>

          ${
            paymentLink
              ? `<a href="${paymentLink}"
                   style="display:inline-block;background:#075b73;color:white;text-decoration:none;padding:14px 22px;border-radius:8px;font-weight:bold;margin-bottom:20px;">
                   Pay Securely With Card
                 </a>`
              : ''
          }

          <div style="margin-top:18px;">
            <strong style="font-size:18px;">Pay with Zelle</strong><br>
            Send payment to: <strong>727-269-1085</strong><br>
            <span style="font-size:13px;">
              Please include invoice ${i.invoice_number || ''} in the memo.
            </span>
          </div>
        </div>

        <div style="margin-top:28px;font-size:13px;line-height:1.6;color:#445;">
          <strong>Terms & Conditions</strong><br>
          Payment is due upon receipt unless otherwise agreed in writing.<br>
          Please contact TopSpeed Piano Moving LLC with any questions.
        </div>
      </div>

      <div style="background:#075b73;color:white;text-align:center;padding:22px;">
        <strong>Thank You!</strong><br>
        We Appreciate Your Business
      </div>

    </div>
  </div>
`
    const text =
      `TopSpeed Piano Moving LLC\n` +
      `Invoice ${i.invoice_number || ''}\n` +
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
        text,
        html
      })

      sent.push('email')
    }

    if (i.phone) { const smsText =
  `TopSpeed Piano Moving LLC\n` +
  `Invoice ${i.invoice_number || ''}\n` +
  `${i.description}\n` +
  `Amount: $${Number(i.amount).toFixed(2)}\n` +
  `Due: ${i.due_date}\n\n` +
  (paymentLink ? `Pay by card: ${paymentLink}\n\n` : '') +
  `Zelle: 727-269-1085\n` +
  `Please include invoice ${i.invoice_number || ''} in the Zelle memo.
      const client = twilio(
        process.env.TWILIO_ACCOUNT_SID,
        process.env.TWILIO_AUTH_TOKEN
      )

      await client.messages.create({
        from: process.env.TWILIO_FROM_NUMBER,
        to: i.phone,
        body: smstext
      })

      sent.push('text')
    }

    await db.from('invoice_events').insert({
      invoice_id: i.id,
      event_type: 'invoice_sent',
      details: sent.join(', ')
    })

    return Response.json({
     message: `Invoice sent by ${sent.join(' and ') || 'no channel'} with Pay Now link.` 
    })
  } catch (e) {
    return Response.json(
      { error: e.message },
      { status: 500 }
    )
  }
}

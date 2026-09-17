import { NextResponse } from 'next/server'

async function makeAdminToken(secret) {
  const encoder = new TextEncoder()

  const key = await crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )

  const signature = await crypto.subtle.sign(
    'HMAC',
    key,
    encoder.encode('topspeed-admin')
  )

  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
}

export async function POST(req) {
  try {
    const { password } = await req.json()

    if (!process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Admin password is not configured.' },
        { status: 500 }
      )
    }

    if (password !== process.env.ADMIN_PASSWORD) {
      return NextResponse.json(
        { error: 'Incorrect password.' },
        { status: 401 }
      )
    }

    const token = await makeAdminToken(process.env.ADMIN_PASSWORD)

    const response = NextResponse.json({ ok: true })

    response.cookies.set('topspeed_admin', token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 12
    })

    return response
  } catch (e) {
    return NextResponse.json(
      { error: e.message },
      { status: 500 }
    )
  }
}

import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { password } = await request.json()

  if (password !== process.env.APP_PASSWORD) {
    return NextResponse.json(
      { error: 'Invalid password' },
      { status: 401 }
    )
  }

  const response = NextResponse.json({ success: true })
  response.cookies.set('auth', 'authenticated', {
    httpOnly: true,
    secure: false,
    sameSite: 'none',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  })

  return response
}

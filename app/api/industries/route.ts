import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function GET() {
  try {
    const industries = await prisma.industry.findMany({
      orderBy: { name: 'asc' },
    })
    return NextResponse.json(industries)
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to fetch industries' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const { name } = await request.json()

  if (!name || typeof name !== 'string') {
    return NextResponse.json(
      { error: 'Industry name is required' },
      { status: 400 }
    )
  }

  try {
    const industry = await prisma.industry.create({
      data: { name: name.trim() },
    })
    return NextResponse.json(industry)
  } catch (err: any) {
    if (err.code === 'P2002') {
      return NextResponse.json(
        { error: 'Industry already exists' },
        { status: 409 }
      )
    }
    return NextResponse.json(
      { error: 'Failed to create industry' },
      { status: 500 }
    )
  }
}

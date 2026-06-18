import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { firstName, lastName, email, phone, title, contactType } = body

    // Validate company exists
    const company = await prisma.company.findUnique({
      where: { id: params.id },
    })

    if (!company) {
      return NextResponse.json({ error: 'Company not found' }, { status: 404 })
    }

    // Create contact
    const contact = await prisma.contact.create({
      data: {
        companyId: params.id,
        firstName: firstName || null,
        lastName: lastName || null,
        email: email || null,
        phone: phone || null,
        title: title || null,
        contactType: contactType || 'GENERAL_OFFICE',
        isPrimary: true,
      },
    })

    return NextResponse.json(contact)
  } catch (err) {
    console.error('Create contact error:', err)
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to create contact' },
      { status: 500 }
    )
  }
}

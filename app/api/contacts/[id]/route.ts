import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const { firstName, lastName, title, contactType } = await request.json()

  try {
    const contact = await prisma.contact.update({
      where: { id: params.id },
      data: {
        ...(firstName && { firstName }),
        ...(lastName && { lastName }),
        ...(title && { title }),
        ...(contactType && { contactType }),
      },
    })

    return NextResponse.json(contact)
  } catch (err) {
    return NextResponse.json(
      { error: 'Failed to update contact' },
      { status: 500 }
    )
  }
}

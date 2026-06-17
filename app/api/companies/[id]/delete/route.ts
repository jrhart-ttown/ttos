import { prisma } from '@/lib/prisma'
import { NextRequest, NextResponse } from 'next/server'

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Delete all related records first (cascade)
    await prisma.contact.deleteMany({
      where: { companyId: params.id },
    })

    await prisma.interaction.deleteMany({
      where: { companyId: params.id },
    })

    await prisma.emailLog.deleteMany({
      where: { companyId: params.id },
    })

    await prisma.whaleMilestone.deleteMany({
      where: { companyId: params.id },
    })

    await prisma.triggerEvent.deleteMany({
      where: { companyId: params.id },
    })

    await prisma.instantlySync.deleteMany({
      where: { companyId: params.id },
    })

    // Delete the company
    await prisma.company.delete({
      where: { id: params.id },
    })

    return NextResponse.json({ success: true })
  } catch (err) {
    console.error('Delete company error:', err)
    return NextResponse.json(
      { error: 'Failed to delete company' },
      { status: 500 }
    )
  }
}

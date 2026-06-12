import { prisma } from '@/lib/prisma'
import { pushLeadsToInstantly, buildInstantlyLead } from '@/lib/instantly'
import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const { draftIds, campaignId } = await request.json()

  console.log('Push request:', { draftIds, campaignId })

  if (!draftIds || !Array.isArray(draftIds) || draftIds.length === 0) {
    console.error('Invalid draftIds')
    return NextResponse.json(
      { error: 'draftIds array required' },
      { status: 400 }
    )
  }

  if (!campaignId) {
    console.error('Missing campaignId')
    return NextResponse.json(
      { error: 'campaignId required' },
      { status: 400 }
    )
  }

  try {
    // Fetch approved drafts
    const drafts = await prisma.draft.findMany({
      where: {
        id: { in: draftIds },
        status: 'APPROVED',
      },
      include: {
        company: true,
        contact: true,
      },
    })

    console.log('Found drafts:', drafts.length)

    if (drafts.length === 0) {
      return NextResponse.json(
        { error: 'No approved drafts found' },
        { status: 400 }
      )
    }

    // Build Instantly lead objects
    const leads = drafts.map(draft =>
      buildInstantlyLead(draft.company, draft.contact, draft)
    )

    // Push to Instantly
    const pushResult = await pushLeadsToInstantly(leads, campaignId)

    // Update draft statuses and create interaction + InstantlySync records
    for (const draft of drafts) {
      await prisma.draft.update({
        where: { id: draft.id },
        data: {
          status: 'PUSHED',
          pushedAt: new Date(),
        },
      })

      // Update company stage
      await prisma.company.update({
        where: { id: draft.companyId },
        data: { stage: 'CONTACTED' },
      })

      // Log interaction
      await prisma.interaction.create({
        data: {
          companyId: draft.companyId,
          contactId: draft.contactId,
          date: new Date(),
          channel: 'EMAIL',
          summary: `Outreach email sent via Instantly: ${draft.personalization?.substring(0, 100)}...`,
        },
      })

      // Log sync
      await prisma.instantlySync.create({
        data: {
          draftId: draft.id,
          companyId: draft.companyId,
          campaignId,
          instantlyLeadEmail: draft.contact.email,
          pushedAt: new Date(),
          status: 'SUCCESS',
        },
      })
    }

    return NextResponse.json({
      success: true,
      addedCount: pushResult.addedCount,
      skippedCount: pushResult.skippedCount,
      errors: pushResult.errors,
    })
  } catch (err) {
    console.error('Push error:', err)

    // Log failed attempts
    const draftIds_arr = Array.isArray(draftIds) ? draftIds : []
    for (const draftId of draftIds_arr) {
      try {
        const draft = await prisma.draft.findUnique({
          where: { id: draftId },
          include: { company: true, contact: true },
        })

        if (draft) {
          await prisma.instantlySync.create({
            data: {
              draftId,
              companyId: draft.companyId,
              campaignId,
              instantlyLeadEmail: draft.contact.email,
              pushedAt: new Date(),
              status: 'FAILED',
              errorMessage: (err as Error).message,
            },
          })
        }
      } catch (_) {
        // Ignore errors in logging
      }
    }

    return NextResponse.json(
      { error: (err as Error).message },
      { status: 500 }
    )
  }
}

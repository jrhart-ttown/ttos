'use client'

import { useState } from 'react'
import EditableInteractionCard from './EditableInteractionCard'

export default function InteractionsSection({
  interactions,
}: {
  interactions: any[]
}) {
  const [interactionsList, setInteractionsList] = useState(interactions)

  const handleInteractionUpdate = async (interactionId: string, data: any) => {
    try {
      const res = await fetch(`/api/interactions/${interactionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) throw new Error('Failed to update interaction')

      setInteractionsList(
        interactionsList.map((i: any) =>
          i.id === interactionId ? { ...i, ...data } : i
        )
      )
    } catch (err) {
      alert('Error updating interaction: ' + (err as Error).message)
    }
  }

  return (
    <div className="mt-6">
      {interactionsList.length > 0 ? (
        <div className="space-y-4">
          {interactionsList.map((interaction: any) => (
            <EditableInteractionCard
              key={interaction.id}
              interaction={interaction}
              onUpdate={(data) => handleInteractionUpdate(interaction.id, data)}
            />
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No interactions logged yet.</p>
      )}
    </div>
  )
}

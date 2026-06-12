import ContactCard from './ContactCard'

interface Company {
  id: string
  name: string
  website?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  industryIds?: string[]
  whyTheyFit?: string
  createdAt: Date
  source: string
  contacts: any[]
  triggerEvents: any[]
  whaleMilestones: any[]
}

export default function CompanyDetailView({ company }: { company: Company }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-6">
      <h1 className="text-3xl font-bold mb-2">{company.name}</h1>

      <div className="grid grid-cols-2 gap-6 mb-6">
        {company.website && (
          <div>
            <label className="text-sm font-semibold text-gray-600">Website</label>
            <a
              href={company.website}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline break-all"
            >
              {company.website}
            </a>
          </div>
        )}

        {company.industry && (
          <div>
            <label className="text-sm font-semibold text-gray-600">Industry</label>
            <p className="text-sm">{company.industry}</p>
          </div>
        )}

        {company.address && (
          <div>
            <label className="text-sm font-semibold text-gray-600">Address</label>
            <p className="text-sm">
              {company.address}
              {company.city && `, ${company.city}`}
              {company.state && `, ${company.state}`}
              {company.zip && ` ${company.zip}`}
            </p>
          </div>
        )}

        <div>
          <label className="text-sm font-semibold text-gray-600">Source</label>
          <p className="text-sm">{company.source}</p>
        </div>
      </div>

      {company.whyTheyFit && (
        <div className="mb-6">
          <label className="text-sm font-semibold text-gray-600 block mb-2">Why They Fit</label>
          <p className="text-sm text-gray-700">{company.whyTheyFit}</p>
        </div>
      )}

      {company.contacts.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-bold mb-3">Contacts</h2>
          <div className="space-y-3">
            {company.contacts.map((contact) => (
              <ContactCard key={contact.id} contact={contact} />
            ))}
          </div>
        </div>
      )}

      {company.triggerEvents.length > 0 && (
        <div>
          <h2 className="text-lg font-bold mb-3">Trigger Events</h2>
          <div className="space-y-3">
            {company.triggerEvents.map((event) => (
              <div key={event.id} className="p-3 bg-yellow-50 rounded border border-yellow-200">
                <p className="font-medium text-sm">{event.type}</p>
                <p className="text-sm text-gray-700">{event.description}</p>
                {event.eventDate && (
                  <p className="text-xs text-gray-600 mt-1">
                    {new Date(event.eventDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

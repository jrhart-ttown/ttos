interface Company {
  id: string
  name: string
  website?: string
  address?: string
  city?: string
  state?: string
  zip?: string
  industry?: string
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
              <div key={contact.id} className="p-3 bg-gray-50 rounded border border-gray-200">
                <div className="flex justify-between items-start">
                  <div>
                    {contact.firstName || contact.lastName ? (
                      <p className="font-medium">
                        {contact.firstName} {contact.lastName}
                      </p>
                    ) : (
                      <p className="font-medium text-gray-600">No name</p>
                    )}
                    {contact.title && (
                      <p className="text-sm text-gray-600">{contact.title}</p>
                    )}
                  </div>
                  {contact.isPrimary && (
                    <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-semibold rounded">
                      Primary
                    </span>
                  )}
                </div>
                <div className="mt-2 space-y-1">
                  {contact.email && (
                    <p className="text-sm">
                      <strong>Email:</strong> {contact.email}
                    </p>
                  )}
                  {contact.phone && (
                    <p className="text-sm">
                      <strong>Phone:</strong> {contact.phone}
                    </p>
                  )}
                  <p className="text-xs text-gray-600">Type: {contact.contactType}</p>
                </div>
              </div>
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

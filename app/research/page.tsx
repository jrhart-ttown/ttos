import { INDUSTRIES } from '@/lib/research'
import ResearchDashboard from '@/components/ResearchDashboard'

export const metadata = {
  title: 'Research | TTOS',
}

export default async function ResearchPage() {
  return (
    <div className="container">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Prospect Research</h1>
        <p className="text-gray-600">
          Automatically identify and import prospects by industry
        </p>
      </div>

      <ResearchDashboard industries={INDUSTRIES} />
    </div>
  )
}

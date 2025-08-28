import LeadProcessor from './components/LeadQue'
import InventoryPanel from './components/InventoryPanel'
import ComposePanel from './components/ComposePanel'

export default function HomePage() {
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-8">Quirk Gen AI Sandbox</h1>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <LeadProcessor />
        <InventoryPanel />
        <ComposePanel />
      </div>
    </div>
  )
}

'use client'

import { useState } from 'react'
import { Plus, Check, Play, Trash2, X } from 'lucide-react'
import { TreatmentPlanWithItems, TreatmentStatus } from '../services/treatmentService'
import { createTreatmentPlan, createTreatmentItem, updateTreatmentItemStatus, deleteTreatmentItem, updateTreatmentPlanStatus } from '../actions/treatmentActions'

export function TreatmentPlansSection({ patientId, initialPlans }: { patientId: string, initialPlans: TreatmentPlanWithItems[] }) {
  const [plans, setPlans] = useState<TreatmentPlanWithItems[]>(initialPlans)
  const [isCreatingPlan, setIsCreatingPlan] = useState(false)
  const [newPlanName, setNewPlanName] = useState('')
  const [addingToPlanId, setAddingToPlanId] = useState<string | null>(null)
  
  // New Item State
  const [procedure, setProcedure] = useState('')
  const [toothNumber, setToothNumber] = useState('')
  const [estimatedCost, setEstimatedCost] = useState('')
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)

  const handleCreatePlan = async () => {
    if (!newPlanName.trim()) return
    setLoading(true)
    const res = await createTreatmentPlan(patientId, newPlanName)
    if (!res.error) {
      setPlans([{
        id: res.data!.id,
        tenant_id: '',
        patient_id: patientId,
        name: newPlanName,
        notes: null,
        status: 'ACTIVE',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        treatment_items: []
      }, ...plans])
      setNewPlanName('')
      setIsCreatingPlan(false)
    }
    setLoading(false)
  }

  const handleCreateItem = async (planId: string) => {
    if (!procedure.trim()) return
    setLoading(true)
    const cost = estimatedCost ? parseFloat(estimatedCost) : undefined
    const res = await createTreatmentItem(planId, patientId, procedure, toothNumber, cost, notes)
    if (!res.error) {
      // Reload plans (in a real app, use SWR or router.refresh, but we can optimistically update)
      const newItem = {
        id: res.data!.id,
        treatment_plan_id: planId,
        procedure,
        tooth_number: toothNumber || null,
        estimated_cost: cost || null,
        notes: notes || null,
        status: 'PLANNED' as const,
        created_at: new Date().toISOString(),
        completed_at: null
      }
      setPlans(plans.map(p => p.id === planId ? { ...p, treatment_items: [...p.treatment_items, newItem] } : p))
      setAddingToPlanId(null)
      setProcedure('')
      setToothNumber('')
      setEstimatedCost('')
      setNotes('')
    }
    setLoading(false)
  }

  const handleStatusUpdate = async (planId: string, itemId: string, status: TreatmentStatus) => {
    setLoading(true)
    const res = await updateTreatmentItemStatus(itemId, planId, patientId, status)
    if (!res.error) {
      setPlans(plans.map(p => {
        if (p.id === planId) {
          return {
            ...p,
            treatment_items: p.treatment_items.map(i => i.id === itemId ? { ...i, status } : i)
          }
        }
        return p
      }))
    }
    setLoading(false)
  }

  const handleDeleteItem = async (planId: string, itemId: string) => {
    setLoading(true)
    const res = await deleteTreatmentItem(itemId, planId, patientId)
    if (!res.error) {
      setPlans(plans.map(p => {
        if (p.id === planId) {
          return {
            ...p,
            treatment_items: p.treatment_items.filter(i => i.id !== itemId)
          }
        }
        return p
      }))
    }
    setLoading(false)
  }

  const handleCompletePlan = async (planId: string) => {
    setLoading(true)
    const res = await updateTreatmentPlanStatus(planId, 'COMPLETED', patientId)
    if (!res.error) {
      setPlans(plans.map(p => p.id === planId ? { ...p, status: 'COMPLETED' } : p))
    }
    setLoading(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-medium leading-6 text-gray-900">Treatment Plans</h2>
        {!isCreatingPlan && (
          <button
            onClick={() => setIsCreatingPlan(true)}
            className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500"
          >
            <Plus className="h-4 w-4" /> Create Plan
          </button>
        )}
      </div>

      {isCreatingPlan && (
        <div className="bg-blue-50 p-4 rounded-md border border-blue-100 flex gap-2 items-center mb-4">
          <input
            type="text"
            placeholder="e.g. Full treatment plan - Sep 2026"
            className="flex-1 rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
            value={newPlanName}
            onChange={e => setNewPlanName(e.target.value)}
            disabled={loading}
          />
          <button
            onClick={handleCreatePlan}
            disabled={loading || !newPlanName.trim()}
            className="inline-flex items-center rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
          >
            Save
          </button>
          <button
            onClick={() => setIsCreatingPlan(false)}
            disabled={loading}
            className="inline-flex items-center rounded bg-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-800 hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      )}

      {plans.length === 0 ? (
        <div className="bg-white shadow sm:rounded-lg border border-gray-200 p-6 text-center">
          <p className="text-sm text-gray-500 mb-4">No treatment plans yet. Create one to organize recommended dental care.</p>
          <button
            onClick={() => setIsCreatingPlan(true)}
            className="inline-flex items-center gap-1 rounded bg-blue-100 text-blue-700 px-3 py-1.5 text-sm font-semibold hover:bg-blue-200"
          >
            <Plus className="h-4 w-4" /> Create Treatment Plan
          </button>
        </div>
      ) : (
        plans.map(plan => {
          const totalEstimated = plan.treatment_items.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0), 0)
          const completedCount = plan.treatment_items.filter(i => i.status === 'COMPLETED').length
          const totalCount = plan.treatment_items.length
          const isCompleted = plan.status === 'COMPLETED'

          return (
            <div key={plan.id} className={`bg-white shadow sm:rounded-lg border overflow-hidden ${isCompleted ? 'border-gray-200 opacity-80' : 'border-blue-200'}`}>
              <div className={`px-4 py-3 sm:px-6 flex flex-col sm:flex-row sm:justify-between sm:items-center border-b ${isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-blue-50/50 border-blue-100'}`}>
                <div>
                  <h3 className="text-base font-semibold leading-6 text-gray-900 flex items-center gap-2">
                    {plan.name}
                    {isCompleted ? (
                      <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Completed
                      </span>
                    ) : (
                      <span className="inline-flex items-center rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        Active
                      </span>
                    )}
                  </h3>
                  <div className="mt-1 text-sm text-gray-500 flex items-center gap-4">
                    <span>{completedCount} / {totalCount} items completed</span>
                    {totalEstimated > 0 && (
                      <span className="font-medium text-gray-900">Estimated Total: ₹{totalEstimated}</span>
                    )}
                  </div>
                </div>
                {!isCompleted && totalCount > 0 && completedCount === totalCount && (
                  <button
                    onClick={() => handleCompletePlan(plan.id)}
                    className="mt-2 sm:mt-0 inline-flex items-center gap-1 rounded bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-800 hover:bg-green-200"
                  >
                    <Check className="h-4 w-4" /> Mark Plan Complete
                  </button>
                )}
              </div>

              <ul className="divide-y divide-gray-200">
                {plan.treatment_items.map(item => (
                  <li key={item.id} className="p-4 sm:px-6 hover:bg-gray-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`font-medium ${item.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                          {item.procedure}
                        </span>
                        {item.tooth_number && (
                          <span className="inline-flex items-center rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                            Tooth: {item.tooth_number}
                          </span>
                        )}
                        {item.estimated_cost && (
                          <span className="inline-flex items-center rounded-md bg-green-50 px-2 py-1 text-xs font-medium text-green-700">
                            ₹{item.estimated_cost}
                          </span>
                        )}
                      </div>
                      {item.notes && <p className="mt-1 text-sm text-gray-500">{item.notes}</p>}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {item.status === 'PLANNED' && !isCompleted && (
                        <>
                          <button onClick={() => handleStatusUpdate(plan.id, item.id, 'IN_PROGRESS')} className="inline-flex items-center gap-1 rounded bg-yellow-50 px-2 py-1 text-xs font-medium text-yellow-800 ring-1 ring-inset ring-yellow-600/20 hover:bg-yellow-100">
                            <Play className="h-3 w-3" /> Start
                          </button>
                          <button onClick={() => handleStatusUpdate(plan.id, item.id, 'COMPLETED')} className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 hover:bg-green-100">
                            <Check className="h-3 w-3" /> Complete
                          </button>
                          <button onClick={() => handleDeleteItem(plan.id, item.id)} className="text-gray-400 hover:text-red-600 p-1">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </>
                      )}
                      {item.status === 'IN_PROGRESS' && !isCompleted && (
                        <>
                          <span className="inline-flex items-center gap-1 rounded bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800">
                            In Progress
                          </span>
                          <button onClick={() => handleStatusUpdate(plan.id, item.id, 'COMPLETED')} className="inline-flex items-center gap-1 rounded bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-600/20 hover:bg-green-100">
                            <Check className="h-3 w-3" /> Complete
                          </button>
                        </>
                      )}
                      {item.status === 'COMPLETED' && (
                        <span className="inline-flex items-center gap-1 rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600">
                          Completed
                        </span>
                      )}
                    </div>
                  </li>
                ))}

                {!isCompleted && addingToPlanId === plan.id && (
                  <li className="p-4 sm:px-6 bg-gray-50">
                    <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
                      <div className="sm:col-span-2">
                        <label className="block text-xs font-medium text-gray-700">Procedure</label>
                        <input type="text" value={procedure} onChange={e => setProcedure(e.target.value)} className="mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="e.g. RCT" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Tooth (Optional)</label>
                        <input type="text" value={toothNumber} onChange={e => setToothNumber(e.target.value)} className="mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="e.g. 46" />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700">Est. Fee (₹)</label>
                        <input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} className="mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="0" />
                      </div>
                      <div className="sm:col-span-4 flex gap-2">
                        <button onClick={() => handleCreateItem(plan.id)} disabled={loading || !procedure.trim()} className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500">
                          <Plus className="h-4 w-4" /> Add Treatment
                        </button>
                        <button onClick={() => setAddingToPlanId(null)} className="inline-flex items-center gap-1 rounded bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                          Cancel
                        </button>
                      </div>
                    </div>
                  </li>
                )}

                {!isCompleted && addingToPlanId !== plan.id && (
                  <li className="p-4 sm:px-6 bg-gray-50">
                    <button onClick={() => setAddingToPlanId(plan.id)} className="inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:text-blue-500">
                      <Plus className="h-4 w-4" /> Add Treatment Item
                    </button>
                  </li>
                )}
              </ul>
            </div>
          )
        })
      )}
    </div>
  )
}

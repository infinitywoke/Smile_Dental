'use client'

import { useState } from 'react'
import { Plus, Check, Play, Trash2 } from 'lucide-react'
import { TreatmentPlanWithItems, TreatmentStatus } from '../services/treatmentService'
import { createTreatmentPlan, createTreatmentItem, updateTreatmentItemStatus, deleteTreatmentItem, updateTreatmentPlanStatus } from '../actions/treatmentActions'
import { treatments } from '@/config/site'
import { useRouter } from 'next/navigation'

export default function MiniTreatmentPlanner({ patientId, initialPlans }: { patientId: string, initialPlans: TreatmentPlanWithItems[] }) {
  const router = useRouter()
  // Ensure we sort so ACTIVE is at top
  const sortedPlans = [...initialPlans].sort((a, b) => {
    if (a.status === 'ACTIVE' && b.status !== 'ACTIVE') return -1
    if (b.status === 'ACTIVE' && a.status !== 'ACTIVE') return 1
    return 0
  })

  const [plans, setPlans] = useState<TreatmentPlanWithItems[]>(sortedPlans)
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
      router.refresh()
    }
    setLoading(false)
  }

  const handleCreateItem = async (planId: string) => {
    if (!procedure.trim()) return
    setLoading(true)
    const cost = estimatedCost ? parseFloat(estimatedCost) : undefined
    const res = await createTreatmentItem(planId, patientId, procedure, toothNumber, cost, notes)
    if (!res.error) {
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
      router.refresh()
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
      router.refresh()
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
      router.refresh()
    }
    setLoading(false)
  }

  const handleCompletePlan = async (planId: string) => {
    setLoading(true)
    const res = await updateTreatmentPlanStatus(planId, 'COMPLETED', patientId)
    if (!res.error) {
      setPlans(plans.map(p => p.id === planId ? { ...p, status: 'COMPLETED' } : p))
      router.refresh()
    }
    setLoading(false)
  }

  return (
    <div className="bg-white shadow sm:rounded-lg flex flex-col h-full border border-gray-100">
      <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50 shrink-0 rounded-t-lg">
        <h2 className="text-base font-semibold leading-6 text-gray-900">Treatment Planner</h2>
        {!isCreatingPlan && (
          <button
            onClick={() => setIsCreatingPlan(true)}
            className="inline-flex items-center gap-1 rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-500"
          >
            <Plus className="h-3 w-3" /> New Plan
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isCreatingPlan && (
          <div className="bg-blue-50 p-3 rounded-md border border-blue-100 flex flex-col gap-2 mb-4">
            <input
              type="text"
              placeholder="e.g. Sept 2026 Plan"
              className="w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm"
              value={newPlanName}
              onChange={e => setNewPlanName(e.target.value)}
              disabled={loading}
            />
            <div className="flex gap-2">
              <button
                onClick={handleCreatePlan}
                disabled={loading || !newPlanName.trim()}
                className="flex-1 rounded bg-blue-600 px-2 py-1.5 text-xs font-semibold text-white hover:bg-blue-500 disabled:opacity-50"
              >
                Save
              </button>
              <button
                onClick={() => setIsCreatingPlan(false)}
                disabled={loading}
                className="flex-1 rounded bg-gray-200 px-2 py-1.5 text-xs font-semibold text-gray-800 hover:bg-gray-300"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {plans.length === 0 ? (
          <div className="text-center p-6 text-sm text-gray-500 border border-dashed border-gray-300 rounded-lg">
            <p className="mb-2">No treatment plans.</p>
          </div>
        ) : (
          plans.map(plan => {
            const totalEstimated = plan.treatment_items.reduce((sum, item) => sum + (Number(item.estimated_cost) || 0), 0)
            const completedCount = plan.treatment_items.filter(i => i.status === 'COMPLETED').length
            const totalCount = plan.treatment_items.length
            const isCompleted = plan.status === 'COMPLETED'

            return (
              <div key={plan.id} className={`border rounded-lg overflow-hidden shadow-sm ${isCompleted ? 'border-gray-200 opacity-75' : 'border-blue-200'}`}>
                <div className={`px-3 py-2 flex flex-col border-b ${isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-blue-50/50 border-blue-100'}`}>
                  <div className="flex justify-between items-center">
                    <h3 className="text-sm font-semibold text-gray-900 truncate pr-2">{plan.name}</h3>
                    {isCompleted ? (
                      <span className="shrink-0 rounded bg-green-50 px-1.5 py-0.5 text-[10px] font-medium text-green-700 ring-1 ring-inset ring-green-600/20">
                        Completed
                      </span>
                    ) : (
                      <span className="shrink-0 rounded bg-blue-50 px-1.5 py-0.5 text-[10px] font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="mt-1 flex justify-between items-center text-xs text-gray-500">
                    <span>{completedCount}/{totalCount} done</span>
                    {totalEstimated > 0 && <span className="font-medium text-gray-900">₹{totalEstimated}</span>}
                  </div>
                </div>

                <ul className="divide-y divide-gray-100 bg-white">
                  {plan.treatment_items.map(item => (
                    <li key={item.id} className="p-2 sm:p-3 hover:bg-gray-50 flex flex-col gap-1">
                      <div className="flex justify-between items-start gap-2">
                        <span className={`text-sm ${item.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'font-medium text-gray-900'}`}>
                          {item.procedure}
                        </span>
                        {item.estimated_cost && (
                          <span className="shrink-0 rounded bg-green-50 px-1.5 py-0.5 text-xs font-medium text-green-700">
                            ₹{item.estimated_cost}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex justify-between items-center mt-1">
                        <div className="flex items-center gap-2">
                          {item.tooth_number && (
                            <span className="rounded bg-gray-100 px-1.5 py-0.5 text-[10px] font-medium text-gray-600">
                              T: {item.tooth_number}
                            </span>
                          )}
                          {item.status === 'IN_PROGRESS' && !isCompleted && (
                            <span className="rounded bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-800">
                              In Prog
                            </span>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-1 shrink-0">
                          {item.status === 'PLANNED' && !isCompleted && (
                            <>
                              <button onClick={() => handleStatusUpdate(plan.id, item.id, 'IN_PROGRESS')} className="p-1 rounded bg-yellow-50 text-yellow-700 hover:bg-yellow-100" title="Start">
                                <Play className="h-3 w-3" />
                              </button>
                              <button onClick={() => handleStatusUpdate(plan.id, item.id, 'COMPLETED')} className="p-1 rounded bg-green-50 text-green-700 hover:bg-green-100" title="Complete">
                                <Check className="h-3 w-3" />
                              </button>
                              <button onClick={() => handleDeleteItem(plan.id, item.id)} className="p-1 text-gray-400 hover:text-red-600">
                                <Trash2 className="h-3 w-3" />
                              </button>
                            </>
                          )}
                          {item.status === 'IN_PROGRESS' && !isCompleted && (
                            <button onClick={() => handleStatusUpdate(plan.id, item.id, 'COMPLETED')} className="p-1 rounded bg-green-50 text-green-700 hover:bg-green-100" title="Complete">
                              <Check className="h-3 w-3" />
                            </button>
                          )}
                        </div>
                      </div>
                    </li>
                  ))}

                  {!isCompleted && addingToPlanId === plan.id && (
                    <li className="p-3 bg-gray-50 border-t border-gray-100">
                      <div className="flex flex-col gap-2">
                        <input type="text" list="mini-procedures-list" value={procedure} onChange={e => {
                          setProcedure(e.target.value)
                          const selectedOption = document.querySelector(`datalist#mini-procedures-list option[value="${e.target.value}"]`) as HTMLOptionElement;
                          if (selectedOption && selectedOption.dataset.cost) {
                            setEstimatedCost(selectedOption.dataset.cost.replace(/[^0-9]/g, ''))
                          }
                        }} className="block w-full rounded border-0 py-1 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm" placeholder="Procedure (e.g. RCT)" />
                        
                        <datalist id="mini-procedures-list">
                          {treatments.flatMap(t => 
                            t.pricing ? t.pricing.map(p => (
                              <option key={`${t.name} - ${p.detail}`} value={`${t.name} - ${p.detail}`} data-cost={p.cost} />
                            )) : [
                              <option key={t.name} value={t.name} />
                            ]
                          )}
                        </datalist>

                        <div className="flex gap-2">
                          <input type="text" value={toothNumber} onChange={e => setToothNumber(e.target.value)} className="block w-1/2 rounded border-0 py-1 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm" placeholder="Tooth" />
                          <input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} className="block w-1/2 rounded border-0 py-1 px-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 text-sm" placeholder="Cost ₹" />
                        </div>

                        <div className="flex gap-2 mt-1">
                          <button onClick={() => handleCreateItem(plan.id)} disabled={loading || !procedure.trim()} className="flex-1 rounded bg-blue-600 px-2 py-1 text-xs font-semibold text-white hover:bg-blue-500">
                            Add Item
                          </button>
                          <button onClick={() => setAddingToPlanId(null)} className="flex-1 rounded bg-white px-2 py-1 text-xs font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50">
                            Cancel
                          </button>
                        </div>
                      </div>
                    </li>
                  )}

                  {!isCompleted && addingToPlanId !== plan.id && (
                    <li className="p-2 bg-gray-50 hover:bg-gray-100 text-center border-t border-gray-100">
                      <button onClick={() => setAddingToPlanId(plan.id)} className="inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700 w-full justify-center">
                        <Plus className="h-3 w-3" /> Add item to plan
                      </button>
                    </li>
                  )}
                </ul>
              </div>
            )
          })
        )}
      </div>
    </div>
  )
}

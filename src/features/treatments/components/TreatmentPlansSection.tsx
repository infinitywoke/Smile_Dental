'use client'

import { useState } from 'react'
import { Plus, Check, Play, Trash2, X, Circle, ArrowRight, CheckCircle2 } from 'lucide-react'
import { TreatmentPlanWithItems, TreatmentStatus } from '../services/treatmentService'
import { createTreatmentPlan, createTreatmentItem, updateTreatmentItemStatus, deleteTreatmentItem, updateTreatmentPlanStatus } from '../actions/treatmentActions'
import { treatments } from '@/config/site'

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
    // Optimistic update
    setPlans(plans.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          treatment_items: p.treatment_items.map(i => i.id === itemId ? { ...i, status } : i)
        }
      }
      return p
    }))
    
    await updateTreatmentItemStatus(itemId, planId, patientId, status)
  }

  const handleDeleteItem = async (planId: string, itemId: string) => {
    if (!confirm('Are you sure you want to delete this treatment item?')) return
    setPlans(plans.map(p => {
      if (p.id === planId) {
        return {
          ...p,
          treatment_items: p.treatment_items.filter(i => i.id !== itemId)
        }
      }
      return p
    }))
    await deleteTreatmentItem(itemId, planId, patientId)
  }

  const handleUpdatePlanStatus = async (planId: string, status: 'DRAFT' | 'ACTIVE' | 'COMPLETED' | 'CANCELLED') => {
    setPlans(plans.map(p => p.id === planId ? { ...p, status } : p))
    await updateTreatmentPlanStatus(planId, status, patientId)
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-4">
        {isCreatingPlan ? (
          <div className="flex w-full items-center gap-2">
            <input
              type="text"
              value={newPlanName}
              onChange={e => setNewPlanName(e.target.value)}
              placeholder="e.g. Root Canal Treatment #46"
              className="block w-full rounded-md border-0 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6"
              autoFocus
            />
            <button
              onClick={handleCreatePlan}
              disabled={loading || !newPlanName.trim()}
              className="inline-flex items-center gap-1 rounded bg-blue-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-blue-500 disabled:opacity-50 shrink-0"
            >
              <Check className="h-4 w-4" /> Save
            </button>
            <button
              onClick={() => setIsCreatingPlan(false)}
              className="inline-flex items-center gap-1 rounded bg-white px-3 py-1.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50 shrink-0"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsCreatingPlan(true)}
            className="inline-flex items-center gap-1 rounded-md bg-white px-3 py-2 text-sm font-semibold text-blue-600 shadow-sm ring-1 ring-inset ring-blue-300 hover:bg-blue-50 w-full justify-center border-dashed border border-blue-400"
          >
            <Plus className="h-4 w-4" /> Create New Treatment Plan
          </button>
        )}
      </div>

      {plans.length === 0 ? (
        <div className="text-center py-8 text-gray-500 border border-gray-200 border-dashed rounded-lg bg-gray-50">
          <p>No treatment plans recorded.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {plans.map(plan => {
            const isCompleted = plan.status === 'COMPLETED'
            const totalItems = plan.treatment_items.length
            const completedItems = plan.treatment_items.filter(i => i.status === 'COMPLETED').length
            const progress = totalItems === 0 ? 0 : Math.round((completedItems / totalItems) * 100)

            return (
              <div key={plan.id} className={`bg-white shadow-sm sm:rounded-lg border overflow-hidden ${isCompleted ? 'border-gray-200 opacity-80' : 'border-amber-200'}`}>
                
                {/* PLAN HEADER */}
                <div className={`px-4 py-4 sm:px-6 flex flex-col border-b ${isCompleted ? 'bg-gray-50 border-gray-200' : 'bg-amber-50/30 border-amber-100'}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-lg font-bold leading-6 text-gray-900">{plan.name}</h3>
                    <div className="flex gap-2">
                      {!isCompleted && (
                        <button onClick={() => handleUpdatePlanStatus(plan.id, 'COMPLETED')} className="text-xs font-semibold text-green-700 bg-green-100 px-2 py-1 rounded hover:bg-green-200">
                          Mark Done
                        </button>
                      )}
                      {isCompleted && (
                        <button onClick={() => handleUpdatePlanStatus(plan.id, 'ACTIVE')} className="text-xs font-semibold text-gray-700 bg-gray-200 px-2 py-1 rounded hover:bg-gray-300">
                          Reopen
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {/* PROGRESS BAR */}
                  <div className="flex items-center gap-4">
                    <div className="w-full bg-gray-200 rounded-full h-2.5">
                      <div className={`h-2.5 rounded-full ${progress === 100 ? 'bg-green-600' : 'bg-amber-500'}`} style={{ width: `${progress}%` }}></div>
                    </div>
                    <span className="text-sm font-medium text-gray-700 whitespace-nowrap">{progress}%</span>
                  </div>
                </div>

                {/* PLAN ITEMS (Checklist style) */}
                <ul className="divide-y divide-gray-100">
                  {plan.treatment_items.map(item => (
                    <li key={item.id} className="p-3 sm:px-6 hover:bg-gray-50 flex items-center justify-between group transition-colors">
                      <div className="flex items-center gap-3">
                        {/* Interactive Status Icon */}
                        <div className="shrink-0 cursor-pointer">
                          {item.status === 'COMPLETED' ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" onClick={() => !isCompleted && handleStatusUpdate(plan.id, item.id, 'PLANNED')} />
                          ) : item.status === 'IN_PROGRESS' ? (
                            <ArrowRight className="h-5 w-5 text-blue-500" onClick={() => !isCompleted && handleStatusUpdate(plan.id, item.id, 'COMPLETED')} />
                          ) : (
                            <Circle className="h-5 w-5 text-gray-300 hover:text-blue-400" onClick={() => !isCompleted && handleStatusUpdate(plan.id, item.id, 'IN_PROGRESS')} />
                          )}
                        </div>

                        {/* Item Details */}
                        <div className="flex flex-col">
                          <span className={`text-sm font-medium ${item.status === 'COMPLETED' ? 'text-gray-500 line-through' : 'text-gray-900'}`}>
                            {item.procedure} {item.tooth_number && <span className="text-gray-400 font-normal">| Tooth #{item.tooth_number}</span>}
                          </span>
                          {item.notes && <span className="text-xs text-gray-500 mt-0.5">{item.notes}</span>}
                        </div>
                      </div>

                      <div className="flex items-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        {item.estimated_cost && (
                          <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                            ₹{item.estimated_cost}
                          </span>
                        )}
                        {!isCompleted && (
                          <button onClick={() => handleDeleteItem(plan.id, item.id)} className="text-gray-400 hover:text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </li>
                  ))}

                  {/* ADD ITEM FORM */}
                  {!isCompleted && addingToPlanId === plan.id && (
                    <li className="p-4 sm:px-6 bg-blue-50/30 border-t border-blue-100">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-4 items-end">
                        <div className="sm:col-span-2">
                          <label className="block text-xs font-medium text-gray-700">Procedure</label>
                          <input type="text" list="procedures-list" value={procedure} onChange={e => {
                            setProcedure(e.target.value)
                            const selectedOption = document.querySelector(`datalist#procedures-list option[value="${e.target.value}"]`) as HTMLOptionElement;
                            if (selectedOption && selectedOption.dataset.cost) {
                              setEstimatedCost(selectedOption.dataset.cost.replace(/[^0-9]/g, ''))
                            }
                          }} className="mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="e.g. RCT" />
                          <datalist id="procedures-list">
                            {treatments.flatMap(t => 
                              t.pricing ? t.pricing.map(p => (
                                <option key={`${t.name} - ${p.detail}`} value={`${t.name} - ${p.detail}`} data-cost={p.cost} />
                              )) : [
                                <option key={t.name} value={t.name} />
                              ]
                            )}
                          </datalist>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Tooth (Opt)</label>
                          <input type="text" value={toothNumber} onChange={e => setToothNumber(e.target.value)} className="mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="e.g. 46" />
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700">Est. Fee (₹)</label>
                          <input type="number" value={estimatedCost} onChange={e => setEstimatedCost(e.target.value)} className="mt-1 block w-full rounded-md border-0 px-3 py-1.5 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 focus:ring-2 focus:ring-inset focus:ring-blue-600 sm:text-sm sm:leading-6" placeholder="0" />
                        </div>
                        <div className="sm:col-span-4 flex gap-2 pt-2">
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

                  {/* ADD ITEM TRIGGER */}
                  {!isCompleted && addingToPlanId !== plan.id && (
                    <li className="p-3 sm:px-6 bg-gray-50/50 hover:bg-gray-100 transition-colors cursor-pointer border-t border-gray-100" onClick={() => setAddingToPlanId(plan.id)}>
                      <div className="flex items-center gap-2 text-sm font-medium text-blue-600">
                        <Plus className="h-4 w-4" /> Add Step
                      </div>
                    </li>
                  )}
                </ul>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { MapPin, Phone, X } from 'lucide-react'
import { getErrorMessage } from '@/lib/api'
import {
  useCompleteWarehouseDeliveryTask,
  useWarehouseDeliveryTasks,
  type WarehouseDeliveryTask,
} from '@/services/orders'
import { useTimedMessage } from '@/hooks/useTimedMessage'

const AdminDeliveryPage = () => {
  const { data: tasks = [] } = useWarehouseDeliveryTasks()
  const completeTask = useCompleteWarehouseDeliveryTask()
  const { message, showMessage } = useTimedMessage(2800)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)
  const [isMapExpanded, setIsMapExpanded] = useState(false)

  const openTasks = useMemo(
    () => tasks.filter((task) => task.status !== 'COMPLETED'),
    [tasks],
  )
  const completedTasks = useMemo(
    () =>
      tasks
        .filter((task) => task.status === 'COMPLETED')
        .sort((a, b) => {
          const aTime = a.completedAt ? new Date(a.completedAt).getTime() : 0
          const bTime = b.completedAt ? new Date(b.completedAt).getTime() : 0
          return bTime - aTime
        }),
    [tasks],
  )

  const selectedTask = useMemo(
    () => tasks.find((task) => task.id === selectedTaskId) ?? null,
    [tasks, selectedTaskId],
  )

  useEffect(() => {
    if (selectedTaskId && !selectedTask) {
      setSelectedTaskId(null)
    }
  }, [selectedTask, selectedTaskId])

  useEffect(() => {
    setIsMapExpanded(false)
  }, [selectedTaskId])

  const getDeliverySla = (createdAt: string, completedAt?: string | null) => {
    const created = new Date(createdAt)
    const due = new Date(created)
    due.setDate(due.getDate() + 3)
    const now = new Date()
    const finish = completedAt ? new Date(completedAt) : now
    const late = finish.getTime() > due.getTime()
    const msLeft = due.getTime() - now.getTime()
    const daysLeft = Math.ceil(msLeft / (1000 * 60 * 60 * 24))

    if (completedAt) return late ? 'Completed Late' : 'Completed On Time'
    if (late) return 'Late'
    if (daysLeft <= 1) return 'Due Soon'
    return 'On Time'
  }

  const getSlaTone = (sla: string) => {
    if (sla.includes('Late')) {
      return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'
    }
    if (sla === 'Due Soon') {
      return 'border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-200'
    }
    return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
  }

  const getTaskStatusTone = (status: WarehouseDeliveryTask['status']) => {
    switch (status) {
      case 'TODO':
        return 'border-slate-300 bg-slate-100 text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200'
      case 'IN_PROGRESS':
        return 'border-blue-300 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-200'
      case 'BLOCKED':
        return 'border-rose-300 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-950/30 dark:text-rose-200'
      default:
        return 'border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-950/30 dark:text-emerald-200'
    }
  }

  const getCustomerName = (task: WarehouseDeliveryTask) =>
    task.order?.shippingFullName?.trim() || task.order?.user?.name || 'Unknown customer'

  const getShippingAddress = (task: WarehouseDeliveryTask) => {
    const parts = [
      task.order?.shippingAddress,
      task.order?.shippingCity,
      task.order?.shippingState,
      task.order?.shippingZipCode,
      task.order?.shippingCountry,
    ]
      .map((part) => part?.trim())
      .filter(Boolean)
    return parts.length ? parts.join(', ') : 'No shipping address provided'
  }

  const getDeliveryNote = (task: WarehouseDeliveryTask) => {
    const metadata =
      task.metadata && typeof task.metadata === 'object' && !Array.isArray(task.metadata)
        ? (task.metadata as Record<string, unknown>)
        : null
    const note =
      (typeof metadata?.deliveryNote === 'string' && metadata.deliveryNote)
      || (typeof metadata?.note === 'string' && metadata.note)
    return note || 'No delivery note.'
  }

  const onComplete = async (taskId: string) => {
    try {
      await completeTask.mutateAsync(taskId)
      showMessage('Delivery task completed.')
      setSelectedTaskId(null)
    } catch (error) {
      showMessage(getErrorMessage(error))
    }
  }

  return (
    <div className="space-y-6 p-8 dark:text-slate-100">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Warehouse Workspace</p>
        <h1 className="text-3xl font-bold">Delivery</h1>
        <p className="mt-2 text-slate-500">Finance-confirmed orders assigned for delivery. SLA target is 3 days.</p>
      </div>

      {message && (
        <div className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-200">
          {message}
        </div>
      )}

      <section className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Open Delivery Tasks</h2>
          <span className="text-xs text-slate-500">{openTasks.length} task(s)</span>
        </div>
        <div className="admin-table-wrapper overflow-auto">
          <table className="admin-table min-w-full text-sm">
            <thead className="admin-table-head">
              <tr>
                <th className="px-3 py-2 text-left">Order ID</th>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-left">Books</th>
                <th className="px-3 py-2 text-left">Assigned To</th>
                <th className="px-3 py-2 text-left">SLA</th>
                <th className="px-3 py-2 text-left">Status</th>
              </tr>
            </thead>
            <tbody>
              {openTasks.map((task) => {
                const meta = (task.metadata || {}) as { orderId?: string }
                const items = task.order?.orderItems ?? []
                const customerName = getCustomerName(task)
                const sla = getDeliverySla(task.createdAt)
                return (
                  <tr
                    key={task.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <td className="px-3 py-2 font-mono text-xs">{meta.orderId ? meta.orderId.slice(0, 8).toUpperCase() : '-'}</td>
                    <td className="px-3 py-2">
                      <p className="max-w-[220px] truncate font-medium">{customerName}</p>
                      <p className="max-w-[220px] truncate text-xs text-slate-500">{task.order?.shippingCity || 'No city'}</p>
                    </td>
                    <td className="px-3 py-2">{items.length}</td>
                    <td className="px-3 py-2">{task.staff.user.name}</td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getSlaTone(sla)}`}>
                        {sla}
                      </span>
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getTaskStatusTone(task.status)}`}>
                        {task.status}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {openTasks.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-4 text-sm text-slate-500">No open delivery tasks.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border bg-white p-5 dark:border-slate-800 dark:bg-slate-900">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-sm font-semibold uppercase tracking-widest text-slate-500">Delivery History</h2>
          <span className="text-xs text-slate-500">{completedTasks.length} completed</span>
        </div>
        <div className="admin-table-wrapper overflow-auto">
          <table className="admin-table min-w-full text-sm">
            <thead className="admin-table-head">
              <tr>
                <th className="px-3 py-2 text-left">Order ID</th>
                <th className="px-3 py-2 text-left">Customer</th>
                <th className="px-3 py-2 text-left">Books</th>
                <th className="px-3 py-2 text-left">Completed At</th>
                <th className="px-3 py-2 text-left">SLA</th>
              </tr>
            </thead>
            <tbody>
              {completedTasks.map((task) => {
                const meta = (task.metadata || {}) as { orderId?: string }
                const items = task.order?.orderItems ?? []
                const customerName = getCustomerName(task)
                const sla = getDeliverySla(task.createdAt, task.completedAt)
                return (
                  <tr
                    key={task.id}
                    className="cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/50"
                    onClick={() => setSelectedTaskId(task.id)}
                  >
                    <td className="px-3 py-2 font-mono text-xs">{meta.orderId ? meta.orderId.slice(0, 8).toUpperCase() : '-'}</td>
                    <td className="px-3 py-2">
                      <p className="max-w-[220px] truncate font-medium">{customerName}</p>
                      <p className="max-w-[220px] truncate text-xs text-slate-500">{task.order?.shippingCity || 'No city'}</p>
                    </td>
                    <td className="px-3 py-2">{items.length}</td>
                    <td className="px-3 py-2 text-xs text-slate-500">
                      {task.completedAt ? new Date(task.completedAt).toLocaleString() : '-'}
                    </td>
                    <td className="px-3 py-2">
                      <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getSlaTone(sla)}`}>
                        {sla}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {completedTasks.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-4 text-sm text-slate-500">No completed deliveries yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>

      <AnimatePresence>
      {selectedTask && (
        <>
          <motion.div
            className="fixed inset-0 z-40 bg-black/30"
            onClick={() => setSelectedTaskId(null)}
            aria-hidden="true"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
          <motion.aside
            className="fixed inset-y-6 right-4 z-50 h-[calc(100vh-3rem)] w-[min(560px,calc(100vw-2rem))] overflow-y-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-2xl dark:border-slate-800 dark:bg-slate-900 sm:p-5"
            initial={{ opacity: 0, x: 36, scale: 0.99 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 24, scale: 0.99 }}
            transition={{ duration: 0.26, ease: 'easeOut' }}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.2em] text-slate-400">Delivery Order</p>
                <h3 className="mt-1 text-xl font-bold">
                  {selectedTask.order?.id ? selectedTask.order.id.slice(0, 8).toUpperCase() : 'Unknown Order'}
                </h3>
                <span className={`mt-2 inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getTaskStatusTone(selectedTask.status)}`}>
                  {selectedTask.status}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedTaskId(null)}
                className="rounded-full border border-slate-300 p-2 text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300 dark:hover:bg-slate-800"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border p-3 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Customer</p>
                <p className="mt-1 font-semibold">{getCustomerName(selectedTask)}</p>
                <p className="text-sm text-slate-500">{selectedTask.order?.shippingEmail || selectedTask.order?.user?.email || '-'}</p>
              </div>
              <div className="rounded-xl border p-3 dark:border-slate-700">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Contact</p>
                {selectedTask.order?.shippingPhone ? (
                  <a href={`tel:${selectedTask.order.shippingPhone}`} className="mt-1 inline-flex items-center gap-2 font-semibold text-indigo-700 hover:underline dark:text-indigo-300">
                    <Phone className="h-4 w-4" />
                    {selectedTask.order.shippingPhone}
                  </a>
                ) : (
                  <p className="mt-1 text-sm text-slate-500">No phone provided</p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl border p-3 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Shipping Address</p>
              <p className="mt-1 text-sm">{getShippingAddress(selectedTask)}</p>
              {selectedTask.order?.shippingAddress && (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(getShippingAddress(selectedTask))}`}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-indigo-700 hover:underline dark:text-indigo-300"
                >
                  <MapPin className="h-3.5 w-3.5" />
                  Open in Maps
                </a>
              )}
              {selectedTask.order?.shippingAddress && (
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => setIsMapExpanded((prev) => !prev)}
                    className="rounded-md border border-slate-300 px-2.5 py-1 text-xs font-semibold text-slate-700 transition-all duration-150 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200 dark:hover:bg-slate-800"
                  >
                    {isMapExpanded ? 'Hide Map' : 'Show Map'}
                  </button>
                  <AnimatePresence initial={false}>
                    {isMapExpanded && (
                      <motion.div
                        className="mt-2 overflow-hidden rounded-lg border dark:border-slate-700"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 250 }}
                        exit={{ opacity: 0, height: 0 }}
                        transition={{ duration: 0.22, ease: 'easeOut' }}
                      >
                        <iframe
                          title="Delivery location map"
                          src={`https://maps.google.com/maps?q=${encodeURIComponent(getShippingAddress(selectedTask))}&t=&z=13&ie=UTF8&iwloc=&output=embed`}
                          className="h-[250px] w-full border-0"
                          loading="lazy"
                          referrerPolicy="no-referrer-when-downgrade"
                        />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              )}
            </div>

            <div className="mt-4 rounded-xl border p-3 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Books in this order</p>
              <div className="mt-2 space-y-2">
                {(selectedTask.order?.orderItems ?? []).map((item) => (
                  <div key={item.id} className="rounded-lg border border-slate-200 p-2 text-sm dark:border-slate-700">
                    <p className="font-medium">{item.book.title}</p>
                    <p className="text-xs text-slate-500">{item.book.author} • qty {item.quantity}</p>
                  </div>
                ))}
                {(selectedTask.order?.orderItems?.length ?? 0) === 0 && (
                  <p className="text-sm text-slate-500">No order items found.</p>
                )}
              </div>
            </div>

            <div className="mt-4 rounded-xl border p-3 dark:border-slate-700">
              <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">Delivery notes</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-300">{getDeliveryNote(selectedTask)}</p>
            </div>

            <div className="mt-5 flex items-center justify-between">
              <span className={`inline-flex rounded-full border px-2 py-0.5 text-xs font-semibold ${getSlaTone(getDeliverySla(selectedTask.createdAt, selectedTask.completedAt))}`}>
                SLA: {getDeliverySla(selectedTask.createdAt, selectedTask.completedAt)}
              </span>
              {selectedTask.status !== 'COMPLETED' ? (
                <button
                  type="button"
                  onClick={() => void onComplete(selectedTask.id)}
                  disabled={completeTask.isPending}
                  className="rounded border border-emerald-200 px-3 py-2 text-sm font-semibold text-emerald-700 transition-all duration-150 hover:bg-emerald-50 disabled:opacity-50 dark:border-emerald-800 dark:text-emerald-300 dark:hover:bg-emerald-950/30"
                >
                  Mark Complete
                </button>
              ) : (
                <p className="text-xs text-slate-500">
                  Completed at {selectedTask.completedAt ? new Date(selectedTask.completedAt).toLocaleString() : '-'}
                </p>
              )}
            </div>
          </motion.aside>
        </>
      )}
      </AnimatePresence>
    </div>
  )
}

export default AdminDeliveryPage

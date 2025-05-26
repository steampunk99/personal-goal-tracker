"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"

interface Task {
  id: string
  title: string
  duration: number
  completed: boolean
  startDate?: Date
  endDate?: Date
}

interface Goal {
  id: string
  title: string
  description: string
  startDate: Date
  endDate: Date
  tasks: Task[]
  createdAt: Date
}

interface UserData {
  name: string
  goals: Goal[]
}

// Custom SVG Icons
const PlusIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M12 5v14M5 12h14" />
  </svg>
)

const TargetIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="6" />
    <circle cx="12" cy="12" r="2" />
  </svg>
)

const CheckIcon = ({ className = "w-5 h-5", filled = false }: { className?: string; filled?: boolean }) => (
  <svg
    className={`${className} transition-all duration-300 ease-out ${filled ? "scale-110" : "scale-100"}`}
    viewBox="0 0 24 24"
    fill={filled ? "currentColor" : "none"}
    stroke="currentColor"
    strokeWidth="1.5"
  >
    <circle
      cx="12"
      cy="12"
      r="10"
      fill={filled ? "currentColor" : "none"}
      className={`transition-all duration-300 ${filled ? "opacity-100" : "opacity-0"}`}
    />
    <circle cx="12" cy="12" r="10" className={filled ? "opacity-0" : "opacity-100"} />
    <path
      d="m9 12 2 2 4-4"
      stroke={filled ? "white" : "currentColor"}
      strokeWidth={filled ? "2.5" : "1.5"}
      className="transition-all duration-200"
    />
  </svg>
)

const TrashIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="m3 6 3 0" />
    <path d="m5 6 0 14c0 1-1 2-2 2h8c1 0 2-1 2-2V6" />
    <path d="m8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
  </svg>
)

const ArrowIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M9 18l6-6-6-6" />
  </svg>
)

const CloseIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
    <path d="M18 6L6 18M6 6l12 12" />
  </svg>
)

// Interactive Button Component
const InteractiveButton = ({
  children,
  onClick,
  variant = "primary",
  size = "md",
  disabled = false,
  className = "",
}: {
  children: React.ReactNode
  onClick?: () => void
  variant?: "primary" | "secondary" | "ghost"
  size?: "sm" | "md" | "lg"
  disabled?: boolean
  className?: string
}) => {
  const baseClasses =
    "group relative overflow-hidden transition-all duration-300 ease-out transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"

  const variantClasses = {
    primary:
      "bg-gradient-to-r from-forest-600 to-forest-700 text-white shadow-lg hover:shadow-xl hover:from-forest-700 hover:to-forest-800",
    secondary: "border border-forest-300 text-forest-700 hover:bg-forest-50 hover:border-forest-400",
    ghost: "text-forest-600 hover:text-forest-800 hover:bg-forest-50",
  }

  const sizeClasses = {
    sm: "px-4 py-2 text-sm rounded-lg",
    md: "px-6 py-3 text-base rounded-xl",
    lg: "px-8 py-4 text-lg rounded-2xl",
  }

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
    >
      <span className="relative z-10 flex items-center justify-center gap-2 font-medium">{children}</span>
      <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 ease-out" />
    </button>
  )
}

// Format date naturally
const formatDate = (date: Date) => {
  const now = new Date()
  const diffTime = date.getTime() - now.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 0) return "Today"
  if (diffDays === 1) return "Tomorrow"
  if (diffDays === -1) return "Yesterday"
  if (diffDays > 0 && diffDays <= 7) return `In ${diffDays} days`
  if (diffDays < 0 && diffDays >= -7) return `${Math.abs(diffDays)} days ago`

  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  })
}

export default function ProgressTracker() {
  const [userData, setUserData] = useState<UserData | null>(null)
  const [showNameDialog, setShowNameDialog] = useState(false)
  const [showGoalDialog, setShowGoalDialog] = useState(false)
  const [selectedGoal, setSelectedGoal] = useState<Goal | null>(null)
  const [newGoal, setNewGoal] = useState({
    title: "",
    description: "",
    startDate: "",
    endDate: "",
    tasks: [] as Omit<Task, "id">[],
  })
  const [newTask, setNewTask] = useState({ title: "", duration: 1 })
  const [userName, setUserName] = useState("")

  useEffect(() => {
    const stored = localStorage.getItem("progressTracker")
    if (stored) {
      const data = JSON.parse(stored)
      data.goals = data.goals.map((goal: any) => ({
        ...goal,
        startDate: new Date(goal.startDate),
        endDate: new Date(goal.endDate),
        createdAt: new Date(goal.createdAt),
        tasks: goal.tasks.map((task: any) => ({
          ...task,
          startDate: task.startDate ? new Date(task.startDate) : undefined,
          endDate: task.endDate ? new Date(task.endDate) : undefined,
        })),
      }))
      setUserData(data)
    } else {
      setShowNameDialog(true)
    }
  }, [])

  const saveData = (data: UserData) => {
    localStorage.setItem("progressTracker", JSON.stringify(data))
    setUserData(data)

    // Update selectedGoal if it exists
    if (selectedGoal) {
      const updatedGoal = data.goals.find((g) => g.id === selectedGoal.id)
      if (updatedGoal) {
        setSelectedGoal(updatedGoal)
      }
    }
  }

  const handleNameSubmit = () => {
    if (userName.trim()) {
      const newUserData = { name: userName.trim(), goals: [] }
      saveData(newUserData)
      setShowNameDialog(false)
    }
  }

  const addTaskToNewGoal = () => {
    if (newTask.title.trim()) {
      setNewGoal((prev) => ({
        ...prev,
        tasks: [...prev.tasks, { ...newTask, completed: false }],
      }))
      setNewTask({ title: "", duration: 1 })
    }
  }

  const addTaskToExistingGoal = (goalId: string) => {
    if (!userData || !newTask.title.trim()) return

    const updatedGoals = userData.goals.map((goal) => {
      if (goal.id === goalId) {
        const newTaskWithId: Task = {
          ...newTask,
          id: crypto.randomUUID(),
          completed: false,
        }
        return { ...goal, tasks: [...goal.tasks, newTaskWithId] }
      }
      return goal
    })

    saveData({ ...userData, goals: updatedGoals })
    setNewTask({ title: "", duration: 1 })
  }

  const removeTaskFromNewGoal = (index: number) => {
    setNewGoal((prev) => ({
      ...prev,
      tasks: prev.tasks.filter((_, i) => i !== index),
    }))
  }

  const createGoal = () => {
    if (newGoal.title.trim() && newGoal.startDate && newGoal.endDate && userData) {
      const startDate = new Date(newGoal.startDate)
      const endDate = new Date(newGoal.endDate)

      const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const totalTaskDuration = newGoal.tasks.reduce((sum, task) => sum + task.duration, 0)

      const currentDate = new Date(startDate)
      const tasksWithDates = newGoal.tasks.map((task) => {
        const taskStartDate = new Date(currentDate)
        const scaledDuration = Math.ceil((task.duration / totalTaskDuration) * totalDays)
        currentDate.setDate(currentDate.getDate() + scaledDuration)
        const taskEndDate = new Date(currentDate)

        return {
          ...task,
          id: crypto.randomUUID(),
          startDate: taskStartDate,
          endDate: taskEndDate,
        }
      })

      const goal: Goal = {
        id: crypto.randomUUID(),
        title: newGoal.title,
        description: newGoal.description,
        startDate,
        endDate,
        tasks: tasksWithDates,
        createdAt: new Date(),
      }

      saveData({
        ...userData,
        goals: [...userData.goals, goal],
      })

      setNewGoal({ title: "", description: "", startDate: "", endDate: "", tasks: [] })
      setShowGoalDialog(false)
    }
  }

  const toggleTask = (goalId: string, taskId: string) => {
    if (!userData) return

    const updatedGoals = userData.goals.map((goal) => {
      if (goal.id === goalId) {
        return {
          ...goal,
          tasks: goal.tasks.map((task) => (task.id === taskId ? { ...task, completed: !task.completed } : task)),
        }
      }
      return goal
    })

    saveData({ ...userData, goals: updatedGoals })
  }

  const deleteGoal = (goalId: string) => {
    if (!userData) return
    saveData({
      ...userData,
      goals: userData.goals.filter((goal) => goal.id !== goalId),
    })
  }

  const deleteTask = (goalId: string, taskId: string) => {
    if (!userData) return

    const updatedGoals = userData.goals.map((goal) => {
      if (goal.id === goalId) {
        return {
          ...goal,
          tasks: goal.tasks.filter((task) => task.id !== taskId),
        }
      }
      return goal
    })

    saveData({ ...userData, goals: updatedGoals })
  }

  const onDragEnd = (result: any) => {
    if (!result.destination || !userData) return

    const items = Array.from(userData.goals)
    const [reorderedItem] = items.splice(result.source.index, 1)
    items.splice(result.destination.index, 0, reorderedItem)

    saveData({ ...userData, goals: items })
  }

  const getCurrentRecommendation = () => {
    if (!userData) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)

    for (const goal of userData.goals) {
      if (today >= goal.startDate && today <= goal.endDate) {
        const currentTask = goal.tasks.find(
          (task) =>
            !task.completed && task.startDate && task.endDate && today >= task.startDate && today <= task.endDate,
        )

        if (currentTask) {
          return { goal, task: currentTask }
        }
      }
    }

    return null
  }

  const getGoalProgress = (goal: Goal) => {
    const completedTasks = goal.tasks.filter((task) => task.completed).length
    return goal.tasks.length > 0 ? (completedTasks / goal.tasks.length) * 100 : 0
  }

  const recommendation = getCurrentRecommendation()

  if (!userData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-sage-50 via-sage-100/30 to-forest-50 flex items-center justify-center p-4">
        <Dialog open={showNameDialog} onOpenChange={setShowNameDialog}>
          <DialogContent className="sm:max-w-md bg-white/90 backdrop-blur-xl border-forest-200/50 shadow-2xl">
            <DialogHeader>
              <DialogTitle className="text-3xl font-light text-forest-800 font-serif">Welcome</DialogTitle>
            </DialogHeader>
            <div className="space-y-8 pt-4">
              <div className="space-y-3">
                <Label htmlFor="name" className="text-forest-700 font-medium text-lg">
                  What should we call you?
                </Label>
                <Input
                  id="name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  placeholder="Your name"
                  className="mt-3 border-forest-200/50 focus:border-forest-400 bg-white/50 backdrop-blur-sm text-lg py-3"
                  onKeyDown={(e) => e.key === "Enter" && handleNameSubmit()}
                />
              </div>
              <InteractiveButton onClick={handleNameSubmit} disabled={!userName.trim()} className="w-full">
                Get Started
              </InteractiveButton>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-sage-50 via-sage-100/30 to-forest-50">
      <div className="max-w-6xl mx-auto p-8 md:p-16 space-y-20">
        {/* Header */}
        <header className="text-center space-y-8">
          <h1 className="text-8xl md:text-9xl font-light text-forest-900 tracking-tight font-serif leading-none">
            Progress
          </h1>
          <p className="text-2xl text-forest-600 font-light">Hello, {userData.name}</p>
        </header>

        {/* Current Recommendation */}
        {recommendation && (
          <div className="bg-white/60 backdrop-blur-xl border border-forest-200/50 shadow-xl hover:shadow-2xl transition-all duration-500 rounded-2xl p-12">
            <div className="flex items-center gap-4 mb-8">
              <TargetIcon className="w-8 h-8 text-forest-600" />
              <h2 className="text-4xl font-light text-forest-800 font-serif">Focus Today</h2>
            </div>
            <div className="space-y-6">
              <h3 className="text-2xl text-forest-900 font-medium">{recommendation.task.title}</h3>
              <p className="text-forest-600 text-lg">from "{recommendation.goal.title}"</p>
              <InteractiveButton
                onClick={() => toggleTask(recommendation.goal.id, recommendation.task.id)}
                variant="secondary"
                className="mt-8"
              >
                <CheckIcon className="w-5 h-5" />
                Mark Complete
              </InteractiveButton>
            </div>
          </div>
        )}

        {/* Goals Section */}
        <div className="space-y-12">
          <div className="flex items-center justify-between">
            <h2 className="text-6xl font-light text-forest-900 font-serif">Goals</h2>
            <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
              <DialogTrigger asChild>
                <InteractiveButton>
                  <PlusIcon className="w-5 h-5" />
                  New Goal
                </InteractiveButton>
              </DialogTrigger>
              <DialogContent className="sm:max-w-3xl bg-white/95 backdrop-blur-xl border-forest-200/50 shadow-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="text-4xl font-light text-forest-800 font-serif mb-8">Create Goal</DialogTitle>
                </DialogHeader>
                <div className="space-y-10">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-forest-700 font-medium text-lg">Title</Label>
                      <Input
                        value={newGoal.title}
                        onChange={(e) => setNewGoal((prev) => ({ ...prev, title: e.target.value }))}
                        className="border-forest-200/50 focus:border-forest-400 bg-white/50 text-lg py-3"
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-forest-700 font-medium text-lg">Description</Label>
                      <Textarea
                        value={newGoal.description}
                        onChange={(e) => setNewGoal((prev) => ({ ...prev, description: e.target.value }))}
                        className="border-forest-200/50 focus:border-forest-400 bg-white/50 text-lg py-3"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4">
                      <Label className="text-forest-700 font-medium text-lg">Start Date</Label>
                      <Input
                        type="date"
                        value={newGoal.startDate}
                        onChange={(e) => setNewGoal((prev) => ({ ...prev, startDate: e.target.value }))}
                        className="border-forest-200/50 focus:border-forest-400 bg-white/50 text-lg py-3"
                      />
                    </div>
                    <div className="space-y-4">
                      <Label className="text-forest-700 font-medium text-lg">End Date</Label>
                      <Input
                        type="date"
                        value={newGoal.endDate}
                        onChange={(e) => setNewGoal((prev) => ({ ...prev, endDate: e.target.value }))}
                        className="border-forest-200/50 focus:border-forest-400 bg-white/50 text-lg py-3"
                      />
                    </div>
                  </div>

                  <div className="space-y-8">
                    <h3 className="text-2xl font-light text-forest-700 font-serif">Tasks</h3>
                    <div className="flex gap-4">
                      <Input
                        placeholder="Task title"
                        value={newTask.title}
                        onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                        className="border-forest-200/50 focus:border-forest-400 bg-white/50 text-lg py-3"
                      />
                      <Input
                        type="number"
                        min="1"
                        placeholder="Days"
                        value={newTask.duration}
                        onChange={(e) =>
                          setNewTask((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) || 1 }))
                        }
                        className="w-32 border-forest-200/50 focus:border-forest-400 bg-white/50 text-lg py-3"
                      />
                      <InteractiveButton onClick={addTaskToNewGoal} variant="secondary" size="sm">
                        Add
                      </InteractiveButton>
                    </div>

                    <div className="space-y-4 max-h-60 overflow-y-auto">
                      {newGoal.tasks.map((task, index) => (
                        <div key={index} className="flex items-center justify-between py-4 border-b border-forest-100">
                          <div className="flex items-center gap-4">
                            <span className="text-forest-900 font-medium text-lg">{task.title}</span>
                            <Badge
                              variant="secondary"
                              className="bg-forest-100/70 text-forest-700 border-forest-200/50"
                            >
                              {task.duration} days
                            </Badge>
                          </div>
                          <InteractiveButton onClick={() => removeTaskFromNewGoal(index)} variant="ghost" size="sm">
                            <TrashIcon className="w-4 h-4" />
                          </InteractiveButton>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex gap-4 pt-8">
                    <InteractiveButton
                      onClick={createGoal}
                      disabled={!newGoal.title.trim() || !newGoal.startDate || !newGoal.endDate}
                      className="flex-1"
                    >
                      Create Goal
                    </InteractiveButton>
                    <InteractiveButton onClick={() => setShowGoalDialog(false)} variant="secondary">
                      Cancel
                    </InteractiveButton>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          {/* Goals Grid */}
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="goals" direction="vertical">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-8">
                  {userData.goals.length === 0 ? (
                    <div className="bg-white/40 backdrop-blur-xl border border-forest-200/50 shadow-xl rounded-2xl p-20 text-center">
                      <TargetIcon className="w-16 h-16 text-forest-300 mx-auto mb-8" />
                      <h3 className="text-4xl font-light text-forest-800 mb-4 font-serif">No goals yet</h3>
                      <p className="text-forest-600 text-xl">Create your first goal to get started</p>
                    </div>
                  ) : (
                    userData.goals.map((goal, index) => (
                      <Draggable key={goal.id} draggableId={goal.id} index={index}>
                        {(provided, snapshot) => (
                          <div
                            ref={provided.innerRef}
                            {...provided.draggableProps}
                            {...provided.dragHandleProps}
                            className={`bg-white/60 backdrop-blur-xl border border-forest-200/50 shadow-xl hover:shadow-2xl transition-all duration-300 cursor-pointer rounded-2xl ${
                              snapshot.isDragging ? "rotate-1 scale-105 shadow-2xl" : ""
                            }`}
                            onClick={() => setSelectedGoal(goal)}
                          >
                            <div className="p-8">
                              <div className="flex items-start justify-between mb-6">
                                <div className="space-y-4 flex-1">
                                  <h3 className="text-3xl font-light text-forest-900 font-serif">{goal.title}</h3>
                                  <p className="text-forest-600 leading-relaxed text-lg">{goal.description}</p>
                                  <div className="flex items-center gap-6 text-forest-500">
                                    <span className="font-medium">{formatDate(goal.startDate)}</span>
                                    <ArrowIcon className="w-3 h-3" />
                                    <span className="font-medium">{formatDate(goal.endDate)}</span>
                                  </div>
                                </div>
                                <InteractiveButton
                                  onClick={(e) => {
                                    e.stopPropagation()
                                    deleteGoal(goal.id)
                                  }}
                                  variant="ghost"
                                  size="sm"
                                >
                                  <TrashIcon className="w-4 h-4" />
                                </InteractiveButton>
                              </div>

                              <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                  <span className="text-forest-700 font-medium">Progress</span>
                                  <span className="text-forest-600 font-medium">
                                    {Math.round(getGoalProgress(goal))}%
                                  </span>
                                </div>
                                <div className="w-full bg-forest-100/50 rounded-full h-1 overflow-hidden">
                                  <div
                                    className="h-full bg-gradient-to-r from-forest-500 to-forest-600 rounded-full transition-all duration-700 ease-out"
                                    style={{ width: `${getGoalProgress(goal)}%` }}
                                  />
                                </div>
                                <div className="flex items-center justify-between pt-2">
                                  <span className="text-forest-600 font-medium">
                                    {goal.tasks.filter((t) => t.completed).length} of {goal.tasks.length} tasks
                                    completed
                                  </span>
                                  <ArrowIcon className="w-4 h-4 text-forest-400" />
                                </div>
                              </div>
                            </div>
                          </div>
                        )}
                      </Draggable>
                    ))
                  )}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>

      {/* Goal Detail Modal */}
      <Dialog open={!!selectedGoal} onOpenChange={() => setSelectedGoal(null)}>
        <DialogContent className="sm:max-w-4xl bg-white/95 backdrop-blur-xl border-forest-200/50 shadow-2xl max-h-[90vh] overflow-hidden">
          {selectedGoal && (
            <div className="space-y-10">
              {/* Header */}
              <div className="flex items-start justify-between">
                <div className="space-y-4">
                  <h2 className="text-4xl font-light text-forest-800 font-serif">{selectedGoal.title}</h2>
                  <p className="text-forest-600 text-xl leading-relaxed">{selectedGoal.description}</p>
                  <div className="flex items-center gap-6 text-forest-500">
                    <span className="font-medium">{formatDate(selectedGoal.startDate)}</span>
                    <ArrowIcon className="w-3 h-3" />
                    <span className="font-medium">{formatDate(selectedGoal.endDate)}</span>
                  </div>
                </div>
                <InteractiveButton onClick={() => setSelectedGoal(null)} variant="ghost" size="sm">
                  <CloseIcon className="w-5 h-5" />
                </InteractiveButton>
              </div>

              {/* Progress */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-forest-700 font-medium text-lg">Progress</span>
                  <span className="text-forest-600 font-medium text-lg">
                    {Math.round(getGoalProgress(selectedGoal))}%
                  </span>
                </div>
                <div className="w-full bg-forest-100/50 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-forest-500 to-forest-600 rounded-full transition-all duration-700 ease-out"
                    style={{ width: `${getGoalProgress(selectedGoal)}%` }}
                  />
                </div>
              </div>

              {/* Add New Task */}
              <div className="space-y-6 py-8 border-t border-forest-100">
                <h3 className="text-2xl font-light text-forest-800 font-serif">Add New Task</h3>
                <div className="flex gap-4">
                  <Input
                    placeholder="Task title"
                    value={newTask.title}
                    onChange={(e) => setNewTask((prev) => ({ ...prev, title: e.target.value }))}
                    className="border-forest-200/50 focus:border-forest-400 bg-white/50 text-lg py-3"
                  />
                  <Input
                    type="number"
                    min="1"
                    placeholder="Days"
                    value={newTask.duration}
                    onChange={(e) =>
                      setNewTask((prev) => ({ ...prev, duration: Number.parseInt(e.target.value) || 1 }))
                    }
                    className="w-32 border-forest-200/50 focus:border-forest-400 bg-white/50 text-lg py-3"
                  />
                  <InteractiveButton
                    onClick={() => addTaskToExistingGoal(selectedGoal.id)}
                    variant="secondary"
                    size="sm"
                  >
                    <PlusIcon className="w-4 h-4" />
                    Add
                  </InteractiveButton>
                </div>
              </div>

              {/* Tasks List */}
              <div className="space-y-6 max-h-96 overflow-y-auto">
                <h3 className="text-2xl font-light text-forest-800 font-serif">Tasks</h3>
                {selectedGoal.tasks.length === 0 ? (
                  <div className="text-center py-16 text-forest-600 text-lg">
                    No tasks yet. Add your first task above.
                  </div>
                ) : (
                  <div className="space-y-1">
                    {selectedGoal.tasks.map((task, index) => (
                      <div
                        key={task.id}
                        className="flex items-center gap-6 py-6 border-b border-forest-50 hover:bg-forest-25 transition-all duration-200 group"
                      >
                        <span className="text-forest-400 font-mono text-sm w-8">
                          {String(index + 1).padStart(2, "0")}
                        </span>
                        <InteractiveButton
                          onClick={() => toggleTask(selectedGoal.id, task.id)}
                          variant="ghost"
                          size="sm"
                          className="p-1"
                        >
                          <CheckIcon className="w-6 h-6" filled={task.completed} />
                        </InteractiveButton>
                        <div className="flex-1 space-y-2">
                          <span
                            className={`text-forest-900 font-medium text-lg transition-all duration-300 ${
                              task.completed ? "line-through opacity-60" : ""
                            }`}
                          >
                            {task.title}
                          </span>
                          {task.startDate && task.endDate && (
                            <div className="text-forest-500 flex items-center gap-3">
                              <span>{formatDate(task.startDate)}</span>
                              <ArrowIcon className="w-2 h-2" />
                              <span>{formatDate(task.endDate)}</span>
                            </div>
                          )}
                        </div>
                        <Badge
                          variant="secondary"
                          className={`${
                            task.completed ? "bg-forest-100/70 text-forest-600" : "bg-forest-50/70 text-forest-700"
                          } border-forest-200/50`}
                        >
                          {task.duration} days
                        </Badge>
                        <InteractiveButton
                          onClick={() => deleteTask(selectedGoal.id, task.id)}
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                        >
                          <TrashIcon className="w-4 h-4" />
                        </InteractiveButton>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

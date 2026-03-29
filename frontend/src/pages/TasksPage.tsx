import { FormEvent, useEffect, useState } from "react";
import { useOutletContext } from "react-router-dom";
import { apiRequest } from "../api/client";
import type { AppLayoutContext } from "../App";
import { LoadingState } from "../components/LoadingState";
import { KanbanBoard } from "../components/tasks/KanbanBoard";
import { useAuthStore } from "../store/authStore";
import { Task, TaskComment, User } from "../types";

export const TasksPage = () => {
  const { selectedProjectId, refreshNotifications } = useOutletContext<AppLayoutContext>();
  const currentUser = useAuthStore((state) => state.user);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [members, setMembers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [deletingTaskId, setDeletingTaskId] = useState<number | null>(null);
  const [updatingAssigneesTaskId, setUpdatingAssigneesTaskId] = useState<number | null>(null);
  const [expandedTaskId, setExpandedTaskId] = useState<number | null>(null);
  const [loadingCommentsTaskId, setLoadingCommentsTaskId] = useState<number | null>(null);
  const [submittingCommentTaskId, setSubmittingCommentTaskId] = useState<number | null>(null);
  const [commentsByTask, setCommentsByTask] = useState<Record<number, TaskComment[]>>({});
  const [commentDrafts, setCommentDrafts] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "",
    description: "",
    deadline: "",
    priority: "medium" as Task["priority"],
    assigneeIds: [] as number[]
  });

  const loadData = async () => {
    if (!selectedProjectId) {
      setTasks([]);
      setMembers([]);
      setCommentsByTask({});
      setCommentDrafts({});
      setExpandedTaskId(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const [taskData, memberData] = await Promise.all([
        apiRequest<{ tasks: Task[] }>(`/projects/${selectedProjectId}/tasks`),
        apiRequest<{ members: User[] }>(`/projects/${selectedProjectId}/members`)
      ]);
      setTasks(taskData.tasks);
      setMembers(memberData.members);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load tasks.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadData();
  }, [selectedProjectId]);

  const loadTaskComments = async (taskId: number) => {
    if (!selectedProjectId) {
      return;
    }

    setLoadingCommentsTaskId(taskId);
    try {
      const data = await apiRequest<{ comments: TaskComment[] }>(`/projects/${selectedProjectId}/tasks/${taskId}/comments`);
      setCommentsByTask((current) => ({
        ...current,
        [taskId]: data.comments
      }));
      setError(null);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to load task comments.");
    } finally {
      setLoadingCommentsTaskId((current) => (current === taskId ? null : current));
    }
  };

  const toggleTaskComments = async (task: Task) => {
    if (expandedTaskId === task.id) {
      setExpandedTaskId(null);
      return;
    }

    setExpandedTaskId(task.id);
    if (!commentsByTask[task.id]) {
      await loadTaskComments(task.id);
    }
  };

  const submitTaskComment = async (task: Task) => {
    if (!selectedProjectId) {
      return;
    }

    const content = commentDrafts[task.id]?.trim();
    if (!content) {
      return;
    }

    setSubmittingCommentTaskId(task.id);
    setError(null);
    try {
      const data = await apiRequest<{ comment: TaskComment }>(`/projects/${selectedProjectId}/tasks/${task.id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content })
      });

      setCommentsByTask((current) => ({
        ...current,
        [task.id]: [...(current[task.id] ?? []), data.comment]
      }));
      setCommentDrafts((current) => ({
        ...current,
        [task.id]: ""
      }));
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id
            ? { ...item, commentsCount: (item.commentsCount ?? 0) + 1 }
            : item
        )
      );
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to add task comment.");
    } finally {
      setSubmittingCommentTaskId(null);
    }
  };

  const updateTaskAssignees = async (task: Task, userId: number) => {
    if (!selectedProjectId) {
      return;
    }

    const nextAssigneeIds = task.assignees.some((assignee) => assignee.id === userId)
      ? task.assignees.filter((assignee) => assignee.id !== userId).map((assignee) => assignee.id)
      : [...task.assignees.map((assignee) => assignee.id), userId];

    setUpdatingAssigneesTaskId(task.id);
    setError(null);
    try {
      await apiRequest(`/projects/${selectedProjectId}/tasks/${task.id}`, {
        method: "PATCH",
        body: JSON.stringify({ assigneeIds: nextAssigneeIds })
      });
      await Promise.all([loadData(), refreshNotifications()]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to update assignees.");
    } finally {
      setUpdatingAssigneesTaskId(null);
    }
  };

  const createTask = async (event: FormEvent) => {
    event.preventDefault();
    if (!selectedProjectId) {
      return;
    }

    setSaving(true);
    setError(null);
    try {
      await apiRequest(`/projects/${selectedProjectId}/tasks`, {
        method: "POST",
        body: JSON.stringify({
          ...form,
          deadline: new Date(form.deadline).toISOString()
        })
      });
      setForm({
        title: "",
        description: "",
        deadline: "",
        priority: "medium",
        assigneeIds: []
      });
      await Promise.all([loadData(), refreshNotifications()]);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to create task.");
    } finally {
      setSaving(false);
    }
  };

  if (!selectedProjectId) {
    return <div className="glass-panel page-enter p-6 text-sm text-muted">Select a project to manage tasks.</div>;
  }

  return (
    <div className="page-enter space-y-6">
      <section className="glass-panel p-6">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="panel-title font-display text-3xl font-semibold text-frost">Task Board</h1>
            <p className="mt-2 text-sm text-muted">
              Assign work, track urgency, and drag tasks across the board as progress changes.
            </p>
          </div>
        </div>

        <form className="mt-6 grid gap-4 xl:grid-cols-[1.2fr_1fr_0.9fr_0.9fr]" onSubmit={createTask}>
          <input
            value={form.title}
            onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))}
            placeholder="Task title"
            className="soft-input rounded-2xl px-4 py-3"
            required
          />
          <div className="datetime-input-wrap">
            <input
              type="datetime-local"
              value={form.deadline}
              onChange={(event) => setForm((current) => ({ ...current, deadline: event.target.value }))}
              className="soft-input datetime-input rounded-2xl px-4 py-3"
              required
            />
          </div>
          <select
            value={form.priority}
            onChange={(event) =>
              setForm((current) => ({ ...current, priority: event.target.value as Task["priority"] }))
            }
            className="soft-input rounded-2xl px-4 py-3"
          >
            <option value="low">Low priority</option>
            <option value="medium">Medium priority</option>
            <option value="high">High priority</option>
          </select>
          <button
            type="submit"
            disabled={saving}
            className="glow-button rounded-2xl px-4 py-3 font-semibold text-white disabled:opacity-60"
          >
            {saving ? "Saving..." : "Create task"}
          </button>

          <textarea
            value={form.description}
            onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))}
            placeholder="Add a useful task brief so teammates know what done looks like."
            className="soft-input min-h-[120px] rounded-[24px] px-4 py-3 xl:col-span-2"
            required
          />
          <div className="glass-subpanel rounded-[24px] p-4 xl:col-span-2">
            <p className="text-sm font-semibold text-frost/90">Assign teammates</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {members.map((member) => {
                const checked = form.assigneeIds.includes(member.id);
                return (
                  <label
                    key={member.id}
                    className={`rounded-full px-4 py-2 text-sm font-medium transition ${
                      checked
                        ? "bg-gradient-to-r from-electric to-violet text-white shadow-glow"
                        : "border border-white/10 bg-white/5 text-muted"
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setForm((current) => ({
                          ...current,
                          assigneeIds: checked
                            ? current.assigneeIds.filter((id) => id !== member.id)
                            : [...current.assigneeIds, member.id]
                        }))
                      }
                      className="hidden"
                    />
                    {member.name}
                  </label>
                );
              })}
            </div>
          </div>
        </form>

        {error ? <p className="mt-4 rounded-2xl border border-danger/30 bg-danger/10 px-4 py-3 text-sm text-danger">{error}</p> : null}
      </section>

      {loading ? (
        <LoadingState label="Loading task board..." />
      ) : (
        <KanbanBoard
          tasks={tasks}
          currentUserId={currentUser?.id ?? null}
          expandedTaskId={expandedTaskId}
          commentsByTask={commentsByTask}
          commentDrafts={commentDrafts}
          members={members}
          deletingTaskId={deletingTaskId}
          updatingAssigneesTaskId={updatingAssigneesTaskId}
          loadingCommentsTaskId={loadingCommentsTaskId}
          submittingCommentTaskId={submittingCommentTaskId}
          onStatusChange={async (task, status) => {
            if (!selectedProjectId) {
              return;
            }
            await apiRequest(`/projects/${selectedProjectId}/tasks/${task.id}`, {
              method: "PATCH",
              body: JSON.stringify({ status })
            });
            await Promise.all([loadData(), refreshNotifications()]);
          }}
          onDeleteTask={async (task) => {
            if (!selectedProjectId) {
              return;
            }
            const confirmed = window.confirm(`Remove "${task.title}" from this project?`);
            if (!confirmed) {
              return;
            }

            setDeletingTaskId(task.id);
            setError(null);
            try {
              await apiRequest(`/projects/${selectedProjectId}/tasks/${task.id}`, {
                method: "DELETE"
              });
              await Promise.all([loadData(), refreshNotifications()]);
            } catch (requestError) {
              setError(requestError instanceof Error ? requestError.message : "Unable to remove task.");
            } finally {
              setDeletingTaskId(null);
            }
          }}
          onToggleComments={toggleTaskComments}
          onCommentDraftChange={(taskId, value) => {
            setCommentDrafts((current) => ({
              ...current,
              [taskId]: value
            }));
          }}
          onToggleAssignee={updateTaskAssignees}
          onSubmitComment={submitTaskComment}
        />
      )}
    </div>
  );
};

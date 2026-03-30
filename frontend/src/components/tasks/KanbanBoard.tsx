import clsx from "clsx";
import { useMemo, useState } from "react";
import { Task, TaskComment, User } from "../../types";
import { formatDateOnly, formatDateTime, formatRelativeUrgency } from "../../utils/format";

interface KanbanBoardProps {
  tasks: Task[];
  members: User[];
  currentUserId: number | null;
  expandedTaskId: number | null;
  commentsByTask: Record<number, TaskComment[] | undefined>;
  commentDrafts: Record<number, string>;
  onStatusChange: (task: Task, status: Task["status"]) => Promise<void>;
  onDeleteTask: (task: Task) => Promise<void>;
  onToggleComments: (task: Task) => Promise<void> | void;
  onCommentDraftChange: (taskId: number, value: string) => void;
  onToggleAssignee: (task: Task, userId: number) => Promise<void>;
  onSubmitComment: (task: Task) => Promise<void>;
  deletingTaskId?: number | null;
  updatingAssigneesTaskId?: number | null;
  loadingCommentsTaskId?: number | null;
  submittingCommentTaskId?: number | null;
}

const columns: Array<{ key: Task["status"]; label: string }> = [
  { key: "todo", label: "To Do" },
  { key: "in_progress", label: "In Progress" },
  { key: "done", label: "Done" }
];

export const KanbanBoard = ({
  tasks,
  members,
  currentUserId,
  expandedTaskId,
  commentsByTask,
  commentDrafts,
  onStatusChange,
  onDeleteTask,
  onToggleComments,
  onCommentDraftChange,
  onToggleAssignee,
  onSubmitComment,
  deletingTaskId,
  updatingAssigneesTaskId,
  loadingCommentsTaskId,
  submittingCommentTaskId
}: KanbanBoardProps) => {
  const [draggedTaskId, setDraggedTaskId] = useState<number | null>(null);
  const tasksByStatus = useMemo(
    () =>
      columns.reduce(
        (accumulator, column) => {
          accumulator[column.key] = tasks.filter((task) => task.status === column.key);
          return accumulator;
        },
        {
          todo: [] as Task[],
          in_progress: [] as Task[],
          done: [] as Task[]
        }
      ),
    [tasks]
  );

  return (
    <div className="grid gap-4 xl:grid-cols-3">
      {columns.map((column) => (
        <div
          key={column.key}
          onDragOver={(event) => event.preventDefault()}
          onDrop={async () => {
            const task = tasks.find((item) => item.id === draggedTaskId);
            if (task && task.status !== column.key) {
              await onStatusChange(task, column.key);
            }
            setDraggedTaskId(null);
          }}
          className="glass-panel rounded-[28px] p-4"
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="panel-title font-display text-xl font-semibold text-frost">{column.label}</h3>
            <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold text-muted">
              {tasksByStatus[column.key].length}
            </span>
          </div>

          <div className="space-y-3">
            {tasksByStatus[column.key].map((task) => {
                const deadline = new Date(task.deadline).getTime();
                const now = Date.now();
                const dueSoon = deadline > now && deadline - now <= 24 * 60 * 60 * 1000;
                const overdue = deadline < now && task.status !== "done";
                const isExpanded = expandedTaskId === task.id;
                const comments = commentsByTask[task.id] ?? [];
                const isAssignedToTask = task.assignees.some((assignee) => assignee.id === currentUserId);
                const taskAssigneeIds = new Set(task.assignees.map((assignee) => assignee.id));

                return (
                  <article
                    key={task.id}
                    draggable
                    onDragStart={() => setDraggedTaskId(task.id)}
                    className={clsx(
                      "glass-subpanel cursor-grab rounded-[24px] border p-4 transition-transform duration-150 ease-glass hover:-translate-y-0.5",
                      overdue && "border-danger/40 shadow-[0_0_32px_rgba(244,63,94,0.18)]",
                      dueSoon && !overdue && "border-warning/40 shadow-[0_0_24px_rgba(245,158,11,0.14)]",
                      !dueSoon && !overdue && "border-electric/20"
                    )}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-semibold text-frost">{task.title}</h4>
                      <div className="flex items-center gap-2">
                        <span
                          className={clsx(
                            "rounded-full border px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide",
                            task.priority === "high" && "border-danger/35 bg-danger/12 text-danger",
                            task.priority === "medium" && "border-warning/35 bg-warning/12 text-warning",
                            task.priority === "low" && "border-electric/35 bg-electric/12 text-electric"
                          )}
                        >
                          {task.priority}
                        </span>
                        <button
                          type="button"
                          onMouseDown={(event) => event.stopPropagation()}
                          onClick={async (event) => {
                            event.stopPropagation();
                            await onDeleteTask(task);
                          }}
                          disabled={deletingTaskId === task.id}
                          className="ghost-button rounded-full px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-danger disabled:cursor-not-allowed disabled:opacity-60"
                        >
                          {deletingTaskId === task.id ? "Removing..." : "Remove"}
                        </button>
                      </div>
                    </div>

                    <p className="mt-3 text-sm text-muted">{task.description}</p>

                    <div className="mt-4 flex items-center justify-between text-xs text-muted">
                      <span>{formatDateOnly(task.deadline)}</span>
                      <span>{formatRelativeUrgency(task.deadline)}</span>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      {task.assignees.map((assignee) => (
                        <span key={assignee.id} className="rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-medium text-frost/80">
                          {assignee.name}
                        </span>
                      ))}
                    </div>

                    <div className="mt-4 border-t border-white/10 pt-4">
                      <button
                        type="button"
                        onMouseDown={(event) => event.stopPropagation()}
                        onClick={async (event) => {
                          event.stopPropagation();
                          await onToggleComments(task);
                        }}
                        className="ghost-button rounded-full px-3 py-1.5 text-[11px] font-semibold uppercase tracking-wide text-frost"
                      >
                        {isExpanded ? "Hide comments & suggestions" : `Comments & Suggestions${typeof task.commentsCount === "number" ? ` (${task.commentsCount})` : ""}`}
                      </button>

                      {isExpanded ? (
                        <div className="mt-4 space-y-3" onMouseDown={(event) => event.stopPropagation()}>
                          <div className="space-y-2">
                            <div className="flex items-center justify-between gap-3">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted">Assigned teammates</p>
                              {updatingAssigneesTaskId === task.id ? (
                                <span className="text-[11px] font-medium text-electric">Updating...</span>
                              ) : null}
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {members.map((member) => {
                                const checked = taskAssigneeIds.has(member.id);

                                return (
                                  <button
                                    key={member.id}
                                    type="button"
                                    onClick={async (event) => {
                                      event.stopPropagation();
                                      await onToggleAssignee(task, member.id);
                                    }}
                                    disabled={updatingAssigneesTaskId === task.id}
                                    className={clsx(
                                      "rounded-full px-3 py-1.5 text-xs font-medium transition-colors duration-150 ease-glass disabled:cursor-not-allowed disabled:opacity-60",
                                      checked
                                        ? "bg-gradient-to-r from-electric to-violet text-white shadow-glow"
                                        : "ghost-button text-muted hover:text-frost"
                                    )}
                                  >
                                    {checked ? `Remove ${member.name}` : `Assign ${member.name}`}
                                  </button>
                                );
                              })}
                            </div>
                          </div>

                          <div className="max-h-48 space-y-3 overflow-y-auto pr-1">
                            {loadingCommentsTaskId === task.id ? (
                              <p className="text-sm text-muted">Loading comments...</p>
                            ) : comments.length > 0 ? (
                              comments.map((comment) => (
                                <div key={comment.id} className="rounded-[20px] border border-white/8 bg-white/5 px-3 py-3">
                                  <div className="flex items-center justify-between gap-3">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-electric">
                                      {comment.user.name}
                                    </p>
                                    <p className="text-[11px] text-muted">{formatDateTime(comment.createdAt)}</p>
                                  </div>
                                  <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-frost/90">{comment.content}</p>
                                </div>
                              ))
                            ) : (
                              <p className="text-sm text-muted">No comments yet on this task.</p>
                            )}
                          </div>

                          {isAssignedToTask ? (
                            <div className="space-y-2">
                              <textarea
                                value={commentDrafts[task.id] ?? ""}
                                onChange={(event) => onCommentDraftChange(task.id, event.target.value)}
                                className="soft-input min-h-[88px] w-full rounded-[20px] px-4 py-3 text-sm"
                                placeholder="Add context, blockers, or a quick update for this task"
                              />
                              <div className="flex justify-end">
                                <button
                                  type="button"
                                  onClick={async (event) => {
                                    event.stopPropagation();
                                    await onSubmitComment(task);
                                  }}
                                  disabled={submittingCommentTaskId === task.id}
                                  className="glow-button rounded-2xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-60"
                                >
                                  {submittingCommentTaskId === task.id ? "Posting..." : "Add comment"}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <p className="text-sm text-muted">Only teammates assigned to this task can add comments.</p>
                          )}
                        </div>
                      ) : null}
                    </div>
                  </article>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
};

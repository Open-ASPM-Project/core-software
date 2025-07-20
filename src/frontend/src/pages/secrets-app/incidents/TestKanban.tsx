import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Calendar, MoreHorizontal, CheckCircle2, AlertCircle, GripVertical } from 'lucide-react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragStartEvent,
  DragEndEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { kanbanDummydata } from './data';

interface Task {
  id: string;
  title: string;
  priority: 'high' | 'medium' | 'low';
  dueDate: string;
  assignee: {
    name: string;
    avatar: string;
  };
  tags: string[];
  completion: number;
}

interface Column {
  id: string;
  title: string;
  items: Task[];
}

const TaskCard = ({ task, dragHandleProps }: { task: Task; dragHandleProps?: any }) => {
  const getPriorityColor = (priority: Task['priority']) => {
    switch (priority) {
      case 'high':
        return 'bg-red-500/15 text-red-700 dark:text-red-400';
      case 'medium':
        return 'bg-yellow-500/15 text-yellow-700 dark:text-yellow-400';
      case 'low':
        return 'bg-green-500/15 text-green-700 dark:text-green-400';
    }
  };

  return (
    <Card className="bg-white dark:bg-slate-900 shadow-sm hover:shadow-md transition-shadow">
      <div className="p-4 space-y-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2 flex-1">
            <div
              {...dragHandleProps}
              className="cursor-grab active:cursor-grabbing hover:text-blue-500 transition-colors"
            >
              <GripVertical className="h-5 w-5" />
            </div>
            <h3 className="font-medium line-clamp-2">{task.title}</h3>
          </div>
          <Badge variant="secondary" className={`ml-2 ${getPriorityColor(task.priority)}`}>
            {task.priority}
          </Badge>
        </div>

        <div className="flex flex-wrap gap-2">
          {task.tags.map((tag) => (
            <span
              key={tag}
              className="px-2 py-1 rounded-md text-xs font-medium bg-slate-100 dark:bg-slate-800"
            >
              {tag}
            </span>
          ))}
        </div>

        <div className="w-full bg-slate-100 dark:bg-slate-800 rounded-full h-1.5">
          <div
            className="bg-blue-500 h-1.5 rounded-full transition-all duration-300"
            style={{ width: `${task.completion}%` }}
          />
        </div>

        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={task.assignee.avatar} />
              <AvatarFallback>{task.assignee.name[0]}</AvatarFallback>
            </Avatar>
            <span>{task.assignee.name}</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              <span>{task.dueDate}</span>
            </div>
            {task.completion === 100 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            ) : task.priority === 'high' ? (
              <AlertCircle className="h-4 w-4 text-red-500" />
            ) : null}
          </div>
        </div>
      </div>
    </Card>
  );
};

const SortableTaskCard = ({ task }: { task: Task }) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  // Only pass drag handle props to the grip icon
  const dragHandleProps = {
    ...attributes,
    ...listeners,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <TaskCard task={task} dragHandleProps={dragHandleProps} />
    </div>
  );
};

// DroppableColumn component remains the same
const DroppableColumn = ({ column, children }: { column: Column; children: React.ReactNode }) => {
  const { setNodeRef } = useSortable({
    id: column.id,
    data: {
      type: 'column',
      column,
    },
  });

  return (
    <div
      ref={setNodeRef}
      className="bg-background/50 rounded-xl flex flex-col  h-[calc(90vh-12rem)]"
    >
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-lg text-foreground">{column.title}</h2>
            <Badge variant="secondary" className="rounded-full px-2 py-0.5">
              {column.items.length}
            </Badge>
          </div>
          <MoreHorizontal className="h-5 w-5 text-muted-foreground hover:text-foreground transition-colors" />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">{children}</div>
    </div>
  );
};

// TestKanban component remains mostly the same, just updating the sensors configuration
const TestKanban: React.FC = () => {
  // ... existing columns state ...
  const [columns, setColumns] = useState<Column[]>(kanbanDummydata);

  const [activeId, setActiveId] = useState<string | null>(null);
  const [activeColumn, setActiveColumn] = useState<string | null>(null);

  // Configure sensors to only activate when using the drag handle
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 0, // Require no minimum distance
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // ... rest of your existing handlers (handleDragStart, handleDragOver, handleDragEnd) ...

  const handleDragStart = (event: DragStartEvent) => {
    const { active } = event;
    setActiveId(active.id as string);

    // Find which column the task is from
    const taskColumn = columns.find((col) => col.items.some((item) => item.id === active.id));
    if (taskColumn) {
      setActiveColumn(taskColumn.id);
    }
  };

  const handleDragOver = (event: DragOverEvent) => {
    const { active, over } = event;
    if (!over) return;

    const activeId = active.id;
    const overId = over.id;

    // Find the columns involved
    const activeColumnId = columns.find((col) =>
      col.items.some((item) => item.id === activeId)
    )?.id;

    const overColumnId = columns.find(
      (col) => col.id === overId || col.items.some((item) => item.id === overId)
    )?.id;

    if (!activeColumnId || !overColumnId || activeColumnId === overColumnId) {
      return;
    }

    setColumns((prev) => {
      const activeColumn = prev.find((col) => col.id === activeColumnId);
      const overColumn = prev.find((col) => col.id === overColumnId);

      if (!activeColumn || !overColumn) return prev;

      // Find the active task
      const activeTask = activeColumn.items.find((item) => item.id === activeId);
      if (!activeTask) return prev;

      return prev.map((col) => {
        if (col.id === activeColumnId) {
          return {
            ...col,
            items: col.items.filter((item) => item.id !== activeId),
          };
        }
        if (col.id === overColumnId) {
          return {
            ...col,
            items: [...col.items, activeTask],
          };
        }
        return col;
      });
    });
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) {
      setActiveId(null);
      setActiveColumn(null);
      return;
    }

    if (active.id !== over.id) {
      setColumns((prev) => {
        const newColumns = [...prev];

        // Find the columns involved
        const startColumnIndex = newColumns.findIndex((col) =>
          col.items.some((item) => item.id === active.id)
        );
        const endColumnIndex = newColumns.findIndex(
          (col) => col.id === over.id || col.items.some((item) => item.id === over.id)
        );

        if (startColumnIndex !== -1) {
          const [movedTask] = newColumns[startColumnIndex].items.splice(
            newColumns[startColumnIndex].items.findIndex((item) => item.id === active.id),
            1
          );

          if (endColumnIndex !== -1) {
            const endColumn = newColumns[endColumnIndex];
            const overItemIndex = endColumn.items.findIndex((item) => item.id === over.id);

            if (overItemIndex !== -1) {
              endColumn.items.splice(overItemIndex, 0, movedTask);
            } else {
              // If dropping on the column itself, add to the end
              endColumn.items.push(movedTask);
            }
          }
        }

        return newColumns;
      });
    }

    setActiveId(null);
    setActiveColumn(null);
  };

  return (
    <div className="flex-1 container item-center mx-auto space-y-4 p-4 mt-8 border border-gray-200 dark:border-gray-700 rounded-lg">
      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }

        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #a0aec0;
          border-radius: 3px;
        }

        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #718096;
        }

        .custom-scrollbar {
          scrollbar-width: thin;
          scrollbar-color: #a0aec0 transparent;
        }

        .custom-scrollbar:not(:hover)::-webkit-scrollbar-thumb {
          background: transparent;
        }
      `}</style>

      <div className="flex-1 flex items-start justify-center overflow-x-auto">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragOver={handleDragOver}
          onDragEnd={handleDragEnd}
        >
          <div className="flex gap-6">
            {columns.map((column) => (
              <DroppableColumn key={column.id} column={column}>
                <SortableContext
                  items={column.items.map((item) => item.id)}
                  strategy={verticalListSortingStrategy}
                >
                  {column.items.map((task) => (
                    <SortableTaskCard key={task.id} task={task} />
                  ))}
                </SortableContext>
              </DroppableColumn>
            ))}
          </div>
          <DragOverlay>
            {activeId ? (
              <TaskCard
                task={columns.flatMap((col) => col.items).find((task) => task.id === activeId)!}
                dragHandleProps={{}}
              />
            ) : null}
          </DragOverlay>
        </DndContext>
      </div>
    </div>
  );
};

export default TestKanban;

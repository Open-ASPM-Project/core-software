import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SecurityTaskCard } from './SecurityTaskCard';
import { SecurityIncident } from '../types';

interface SortableSecurityCardProps {
  incident: SecurityIncident;
}

export const SortableSecurityCard = ({ incident }: SortableSecurityCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: incident.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    // width: '350px',
    // touchAction: 'none',
    // position: isDragging ? 'relative' : undefined,
  };

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <SecurityTaskCard incident={incident} dragHandleProps={dragHandleProps} />
    </div>
  );
};

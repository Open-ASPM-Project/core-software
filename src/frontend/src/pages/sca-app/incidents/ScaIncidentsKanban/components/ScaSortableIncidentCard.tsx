import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { ScaIncident } from '../hooks/useScaKanban';
import { ScaIncidentTaskCard } from './ScaIncidentTaskCard';

interface ScaSortableIncidentCardProps {
  incident: ScaIncident;
}

export const ScaSortableIncidentCard = ({ incident }: ScaSortableIncidentCardProps) => {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: incident.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const dragHandleProps = {
    ...attributes,
    ...listeners,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ScaIncidentTaskCard incident={incident} dragHandleProps={dragHandleProps} />
    </div>
  );
};

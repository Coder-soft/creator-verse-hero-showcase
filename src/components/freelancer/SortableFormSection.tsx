import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical } from 'lucide-react';

interface SortableFormSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
}

export function SortableFormSection({ id, title, children }: SortableFormSectionProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="overflow-hidden">
        <div className="flex items-center p-2 border-b bg-muted/50">
          <Button variant="ghost" size="icon" {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5" />
          </Button>
          <h3 className="font-medium text-sm ml-2">{title}</h3>
        </div>
        <div className="p-4">
          {children}
        </div>
      </Card>
    </div>
  );
}
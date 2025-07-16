import React, { useState, useEffect } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Edit, Check } from 'lucide-react';
import { Input } from '@/components/ui/input';

interface SortableFormSectionProps {
  id: string;
  title: string;
  children: React.ReactNode;
  onTitleChange: (id: string, newTitle: string) => void;
}

export function SortableFormSection({ id, title, children, onTitleChange }: SortableFormSectionProps) {
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

  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [newTitle, setNewTitle] = useState(title);

  useEffect(() => {
    setNewTitle(title);
  }, [title]);

  const handleTitleSave = () => {
    if (newTitle.trim() !== '') {
      onTitleChange(id, newTitle);
    } else {
      setNewTitle(title); // Reset if empty
    }
    setIsEditingTitle(false);
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card className="overflow-hidden">
        <div className="flex items-center p-2 border-b bg-muted/50">
          <Button variant="ghost" size="icon" {...listeners} className="cursor-grab active:cursor-grabbing">
            <GripVertical className="h-5 w-5" />
          </Button>
          {isEditingTitle ? (
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className="h-8 flex-1 mx-2"
              onBlur={handleTitleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleTitleSave();
                if (e.key === 'Escape') {
                  setNewTitle(title);
                  setIsEditingTitle(false);
                }
              }}
              autoFocus
            />
          ) : (
            <h3 className="font-medium text-sm ml-2 flex-1">{title}</h3>
          )}
          <div className="flex items-center">
            <Button variant="ghost" size="icon" onClick={() => isEditingTitle ? handleTitleSave() : setIsEditingTitle(true)}>
              {isEditingTitle ? <Check className="h-4 w-4" /> : <Edit className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="p-4">
          {children}
        </div>
      </Card>
    </div>
  );
}
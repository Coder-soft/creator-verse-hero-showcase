import React from 'react';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { SortableSectionItem } from './SortableSectionItem';
import { Button } from '@/components/ui/button';
import { PlusCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import { Section } from './types';

interface SectionEditorProps {
  sections: Section[];
  setSections: React.Dispatch<React.SetStateAction<Section[]>>;
}

export function SectionEditor({ sections, setSections }: SectionEditorProps) {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  }

  const addSection = (type: 'markdown' | 'image') => {
    const newSection: Section = {
      id: uuidv4(),
      type,
      content: type === 'markdown' ? '# New Section\n\nStart writing...' : '',
    };
    setSections([...sections, newSection]);
  };

  const updateSection = (id: string, content: string) => {
    setSections(
      sections.map((section) =>
        section.id === id ? { ...section, content } : section
      )
    );
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((section) => section.id !== id));
  };

  return (
    <div className="space-y-4">
      <DndContext
        sensors={sensors}
        collisionDetection={closestCenter}
        onDragEnd={handleDragEnd}
      >
        <SortableContext items={sections} strategy={verticalListSortingStrategy}>
          <div className="space-y-4">
            {sections.map((section) => (
              <SortableSectionItem
                key={section.id}
                section={section}
                onUpdate={updateSection}
                onRemove={removeSection}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>

      {sections.length === 0 && (
        <div className="text-center py-10 border-2 border-dashed rounded-lg">
          <p className="text-muted-foreground">Your post is empty.</p>
          <p className="text-sm text-muted-foreground">Add a section to get started.</p>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <Button variant="outline" onClick={() => addSection('markdown')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Text Block
        </Button>
        <Button variant="outline" onClick={() => addSection('image')}>
          <PlusCircle className="h-4 w-4 mr-2" />
          Add Image
        </Button>
      </div>
    </div>
  );
}
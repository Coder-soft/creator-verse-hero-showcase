import React, { useState } from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Section } from './SectionEditor';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { GripVertical, Trash2, Image as ImageIcon, FileText, Check, X, Edit } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import ReactMarkdown from 'react-markdown';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';

interface SortableSectionItemProps {
  section: Section;
  onUpdate: (id: string, content: string) => void;
  onRemove: (id: string) => void;
}

export function SortableSectionItem({ section, onUpdate, onRemove }: SortableSectionItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
  } = useSortable({ id: section.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const [isEditing, setIsEditing] = useState(section.content === '' || (section.type === 'markdown' && section.content.startsWith('# New Section')));
  const [editContent, setEditContent] = useState(section.content);
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  const handleSave = () => {
    onUpdate(section.id, editContent);
    setIsEditing(false);
  };

  const handleCancel = () => {
    setEditContent(section.content);
    setIsEditing(false);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0 || !user) return;
    
    const file = e.target.files[0];
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `post-sections/${user.id}/${section.id}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('public')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data } = supabase.storage.from('public').getPublicUrl(filePath);
      onUpdate(section.id, data.publicUrl);
      setEditContent(data.publicUrl);
      setIsEditing(false);
    } catch (error) {
      toast({ title: "Error", description: "Failed to upload image", variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const renderContent = () => {
    if (isEditing) {
      if (section.type === 'markdown') {
        return (
          <Textarea
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="min-h-[150px] font-mono"
            placeholder="Write your markdown content here..."
          />
        );
      }
      if (section.type === 'image') {
        return (
          <div className="space-y-2">
            <Input type="file" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
            {uploading && <p className="text-sm text-muted-foreground">Uploading...</p>}
            <Input
              type="text"
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              placeholder="Or paste image URL"
            />
          </div>
        );
      }
    } else {
      if (section.type === 'markdown') {
        return (
          <div className="prose dark:prose-invert max-w-full cursor-pointer" onClick={() => setIsEditing(true)}>
            <ReactMarkdown>{section.content || "Empty text block. Click to edit."}</ReactMarkdown>
          </div>
        );
      }
      if (section.type === 'image') {
        return (
          <div className="cursor-pointer" onClick={() => setIsEditing(true)}>
            {section.content ? (
              <img src={section.content} alt="Post section" className="rounded-md max-w-full max-h-80" />
            ) : (
              <div className="p-8 border-2 border-dashed rounded-md text-center text-muted-foreground">
                Click to upload an image
              </div>
            )}
          </div>
        );
      }
    }
    return null;
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes}>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between p-2 bg-muted/50 border-b">
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" {...listeners} className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-5 w-5" />
            </Button>
            {section.type === 'markdown' ? <FileText className="h-5 w-5 text-muted-foreground" /> : <ImageIcon className="h-5 w-5 text-muted-foreground" />}
            <span className="font-medium capitalize">{section.type}</span>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="ghost" size="icon" onClick={handleCancel}><X className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" onClick={handleSave}><Check className="h-4 w-4" /></Button>
              </>
            ) : (
              <>
                <Button variant="ghost" size="icon" onClick={() => setIsEditing(true)}><Edit className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onRemove(section.id)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </>
            )}
          </div>
        </CardHeader>
        <CardContent className="p-4">
          {renderContent()}
        </CardContent>
      </Card>
    </div>
  );
}
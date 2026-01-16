import { NotesSection as NotesSectionComponent } from '../components/NotesSection';

interface NotesSectionProps {
  showNotes: boolean;
  note: string;
  onToggleNotes: () => void;
  onNoteChange: (value: string) => void;
}

export const NotesSection = ({
  showNotes,
  note,
  onToggleNotes,
  onNoteChange
}: NotesSectionProps) => {
  return (
    <NotesSectionComponent
      showNotes={showNotes}
      note={note}
      onToggleNotes={onToggleNotes}
      onNoteChange={onNoteChange}
    />
  );
};


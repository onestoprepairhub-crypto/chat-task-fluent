import { FileText } from 'lucide-react';
import { EmptyState } from '@/components/EmptyState';

const Templates = () => {
  const templates: any[] = [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Templates</h1>
        <p className="text-sm text-muted-foreground mt-1">Create reusable reply templates for common review scenarios</p>
      </div>

      {templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No templates yet"
          description="Create reply templates to speed up your review responses. Templates can be used manually or with auto-replies."
          actionLabel="Create Template"
          onAction={() => {}}
        />
      ) : null}
    </div>
  );
};

export default Templates;

import OutlineList from '@/features/outline/outline-list';
import CreateOutlineDialog from '@/features/outline/create-outline-dialog';

export default function OutlineListComponent() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-han text-3xl font-bold text-[var(--moge-text-main)]">我的大纲</h1>
        <CreateOutlineDialog />
      </div>
      <OutlineList />
    </div>
  );
}

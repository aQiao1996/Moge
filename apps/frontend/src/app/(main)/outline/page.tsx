import CreateOutlineDialog from './components/CreateOutlineDialog';
import OutlineList from './components/OutlineList';

export default function Home() {
  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="font-han text-2xl font-bold text-[var(--moge-text-main)]">我的大纲</h1>
        </div>
        <CreateOutlineDialog />
      </div>

      <OutlineList />
    </div>
  );
}

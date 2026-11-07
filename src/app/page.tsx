export default function HomePage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col justify-center px-6 py-16">
      <div className="rounded-2xl border border-slate-200 bg-white p-8 shadow-sm">
        <span className="inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">
          Multi-Agent Workspace Ready
        </span>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
          Web Học Y4
        </h1>
        <p className="mt-2 text-base text-slate-600">
          Dự án đã được khởi tạo với Next.js (App Router), Tailwind CSS, TypeScript (Strict Mode) và quy trình điều phối 3 Agent (Antigravity • Claude Code • Codex).
        </p>

        <div className="mt-8 grid gap-4 sm:grid-cols-3">
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">1. Antigravity (Gemini Pro)</h2>
            <p className="mt-1 text-xs text-slate-600">
              Orchestrator, Context Scout, UI Components (`src/components/ui/`, `src/app/`).
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">2. Claude Code (Claude Pro)</h2>
            <p className="mt-1 text-xs text-slate-600">
              Core Architecture, State & Custom Hooks phức tạp (`src/hooks/`).
            </p>
          </div>
          <div className="rounded-xl border border-slate-100 bg-slate-50 p-4">
            <h2 className="text-sm font-semibold text-slate-900">3. Codex (GPT Pro)</h2>
            <p className="mt-1 text-xs text-slate-600">
              Backend Services, API & Unit/Integration Tests (`src/server/`, `tests/`).
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}

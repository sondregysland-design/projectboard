import { PageHeader } from "@/components/layout/PageHeader";
import { TodoTable } from "@/components/todos/TodoTable";

export default function TodosPage() {
  return (
    <main className="mx-auto max-w-5xl px-6 py-10">
      <PageHeader
        title="Task "
        highlight="List"
        subtitle="Hold oversikt over alle oppgaver og gjoremal"
      />
      <TodoTable />
    </main>
  );
}

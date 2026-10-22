import { capabilities } from "@/agent/config";
import { BriefApp } from "@/components/brief-app";

export default function Home() {
  return (
    <main className="flex-1">
      <BriefApp caps={capabilities()} />
    </main>
  );
}

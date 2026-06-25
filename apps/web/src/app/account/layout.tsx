import { AccountNav } from "@/components/account/AccountNav";
import { AccountGuard } from "@/components/account/AccountGuard";

export const metadata = {
  title: "My Account — Bookie",
};

export default function AccountLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AccountGuard>
      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
          <aside>
            <AccountNav />
          </aside>
          <div className="min-w-0">{children}</div>
        </div>
      </div>
    </AccountGuard>
  );
}

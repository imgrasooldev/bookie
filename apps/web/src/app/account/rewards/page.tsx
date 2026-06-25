import { USER } from "@/lib/account";
import { CopyCode } from "@/components/CopyCode";
import { GiftIcon, UsersIcon, WalletIcon } from "@/components/icons";

const STEPS = [
  { icon: UsersIcon, title: "Share your code", body: "Send your referral code to friends & family." },
  { icon: WalletIcon, title: "They book & save", body: "They get Rs 250 off their first booking." },
  { icon: GiftIcon, title: "You earn", body: "You get Rs 250 Bookie Cash once they travel." },
];

export default function RewardsPage() {
  return (
    <div>
      <h1 className="font-display text-2xl font-bold tracking-tight text-ink">Rewards & referrals</h1>
      <p className="mt-0.5 text-sm text-muted">Earn Bookie Cash every time a friend travels.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-[var(--hairline)] bg-surface p-5">
          <div className="text-sm text-muted">Reward points</div>
          <div className="mt-1 font-display text-3xl font-bold text-ink">{USER.rewardPoints.toLocaleString()}</div>
          <div className="mt-1 text-xs text-muted">≈ {(USER.rewardPoints / 100).toFixed(0)} Rs in value</div>
        </div>
        <div className="rounded-2xl border border-[var(--hairline)] bg-surface p-5">
          <div className="text-sm text-muted">Friends referred</div>
          <div className="mt-1 font-display text-3xl font-bold text-ink">3</div>
          <div className="mt-1 text-xs text-green-600">Rs 750 earned so far</div>
        </div>
      </div>

      {/* referral code */}
      <div className="brand-gradient mt-4 overflow-hidden rounded-2xl p-6 text-white">
        <h2 className="font-display text-xl font-bold">Refer & earn Rs 250</h2>
        <p className="mt-1 text-sm text-blue-100">Share your code — you both win when they travel.</p>
        <div className="mt-4 max-w-xs rounded-xl bg-surface p-1.5">
          <CopyCode code={USER.referralCode} />
        </div>
      </div>

      {/* how it works */}
      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        {STEPS.map((s, i) => (
          <div key={s.title} className="rounded-2xl border border-[var(--hairline)] bg-surface p-5">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-brand-50 text-brand-600">
              <s.icon className="h-5 w-5" />
            </span>
            <div className="mt-3 flex items-center gap-2">
              <span className="grid h-5 w-5 place-items-center rounded-full bg-brand-100 text-xs font-bold text-brand-700">{i + 1}</span>
              <span className="font-semibold text-ink">{s.title}</span>
            </div>
            <p className="mt-1 text-sm text-muted">{s.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

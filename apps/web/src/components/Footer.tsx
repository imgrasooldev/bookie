export function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-surface">
      <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-4 py-10 text-sm md:grid-cols-4">
        <div>
          <div className="mb-2 font-extrabold text-ink">Bookie</div>
          <p className="text-muted">
            Bus, car, picnic & corporate transport booking across Pakistan.
          </p>
        </div>
        <div>
          <div className="mb-2 font-semibold text-ink">Book</div>
          <ul className="space-y-1 text-muted">
            <li>Bus tickets</li>
            <li>City rides</li>
            <li>Picnic & party</li>
            <li>Corporate transport</li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-ink">Company</div>
          <ul className="space-y-1 text-muted">
            <li>About</li>
            <li>Become an operator</li>
            <li>Help center</li>
          </ul>
        </div>
        <div>
          <div className="mb-2 font-semibold text-ink">Pay with</div>
          <ul className="space-y-1 text-muted">
            <li>JazzCash</li>
            <li>Easypaisa</li>
            <li>Debit / Credit card</li>
            <li>Cash</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-slate-100 py-4 text-center text-xs text-muted">
        © {new Date().getFullYear()} Bookie. All rights reserved.
      </div>
    </footer>
  );
}

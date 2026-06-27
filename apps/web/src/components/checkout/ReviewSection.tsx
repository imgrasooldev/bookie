"use client";

import { useEffect, useState } from "react";
import { getMyReview, submitReview, type Review } from "@/lib/bookings";
import { StarIcon } from "@/components/icons";

// "Rate your trip" block on the e-ticket. Loads the user's existing review (if
// any) and lets them add or edit their single review for this booking.
export function ReviewSection({ bookingId }: { bookingId: string }) {
  const [loading, setLoading] = useState(true);
  const [review, setReview] = useState<Review | null>(null);
  const [editing, setEditing] = useState(false);
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let on = true;
    getMyReview(bookingId).then((r) => {
      if (!on) return;
      setReview(r);
      if (r) { setRating(r.rating); setComment(r.comment); }
      setLoading(false);
    });
    return () => { on = false; };
  }, [bookingId]);

  async function save() {
    if (rating < 1) { setError("Please pick a star rating."); return; }
    setBusy(true); setError(null);
    const res = await submitReview(bookingId, { rating, comment: comment.trim() });
    setBusy(false);
    if (!res.ok) { setError(res.error); return; }
    setReview(res.review);
    setEditing(false);
  }

  if (loading) return null;

  const shown = review && !editing;

  return (
    <div className="mt-4 rounded-2xl bg-surface p-5 shadow-sm ring-1 ring-slate-200 print:hidden">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="font-display text-base font-bold text-ink">
          {shown ? "Your review" : review ? "Edit your review" : "Rate your trip"}
        </h3>
        {shown && (
          <button onClick={() => setEditing(true)} className="text-sm font-semibold text-brand-700 hover:underline">
            Edit
          </button>
        )}
      </div>

      {/* stars */}
      <div className="flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => {
          const active = (hover || rating) >= n;
          return (
            <button
              key={n}
              type="button"
              disabled={!!shown}
              onMouseEnter={() => !shown && setHover(n)}
              onClick={() => !shown && setRating(n)}
              className={`transition ${shown ? "cursor-default" : "cursor-pointer hover:scale-110"}`}
              aria-label={`${n} star${n > 1 ? "s" : ""}`}
            >
              <StarIcon className={`h-7 w-7 ${active ? "text-amber-400" : "text-slate-300"}`} />
            </button>
          );
        })}
        {(shown ? review!.rating : rating) > 0 && (
          <span className="ml-2 text-sm font-semibold text-ink">{(shown ? review!.rating : rating).toFixed(0)}/5</span>
        )}
      </div>

      {shown ? (
        review!.comment ? <p className="mt-3 text-sm text-muted">“{review!.comment}”</p> : null
      ) : (
        <>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={3}
            maxLength={1000}
            placeholder="Tell other travellers how the trip was (optional)"
            className="mt-3 w-full resize-none rounded-xl border border-slate-200 p-3 text-sm focus:border-brand-500 focus:outline-none"
          />
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
          <div className="mt-3 flex gap-2">
            {review && (
              <button
                onClick={() => { setEditing(false); setRating(review.rating); setComment(review.comment); setError(null); }}
                className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-ink hover:bg-slate-50"
              >
                Cancel
              </button>
            )}
            <button
              onClick={save}
              disabled={busy || rating < 1}
              className="ml-auto rounded-xl bg-brand-600 px-5 py-2 text-sm font-semibold text-white hover:bg-brand-700 disabled:opacity-50"
            >
              {busy ? "Saving…" : review ? "Update review" : "Submit review"}
            </button>
          </div>
        </>
      )}
    </div>
  );
}

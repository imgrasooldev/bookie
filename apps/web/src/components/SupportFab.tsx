// Floating WhatsApp support button (bottom-right), like Bookme/Sastaticket.
export function SupportFab() {
  return (
    <a
      href="https://wa.me/923047772782"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with support on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-[#25D366] px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-green-600/30 transition hover:scale-105"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5" aria-hidden="true">
        <path d="M12.04 2a9.9 9.9 0 0 0-8.49 14.9L2 22l5.27-1.38A9.9 9.9 0 1 0 12.04 2zm0 1.8a8.1 8.1 0 0 1 6.85 12.4l-.2.32.64 2.34-2.4-.63-.31.18a8.1 8.1 0 1 1-4.58-14.8zm-3 4.1c-.16 0-.42.06-.64.3-.22.24-.85.83-.85 2.03 0 1.2.87 2.36.99 2.52.12.16 1.7 2.7 4.2 3.68 2.07.82 2.5.66 2.95.62.45-.04 1.45-.59 1.66-1.16.2-.57.2-1.05.14-1.16-.06-.1-.22-.16-.46-.28-.24-.12-1.45-.72-1.67-.8-.22-.08-.39-.12-.55.12-.16.24-.63.8-.77.96-.14.16-.28.18-.52.06-.24-.12-1.03-.38-1.96-1.21-.72-.64-1.21-1.44-1.35-1.68-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.34-.76-1.83-.2-.48-.4-.41-.55-.42z" />
      </svg>
      <span className="hidden sm:inline">Help</span>
    </a>
  );
}

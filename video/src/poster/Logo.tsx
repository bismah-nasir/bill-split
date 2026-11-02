/** The BillSplit receipt mark, from the app's src/app/icon.svg. */
export function Logo({ size }: { size: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32">
      <rect width="32" height="32" rx="7" fill="#0f766e" />
      <path d="M9 6.5h14v19l-2.33-1.75-2.34 1.75L16 23.75l-2.33 1.75-2.34-1.75L9 25.5z" fill="#fff" />
      <path d="M12 11h8M12 14.5h8M12 18h5" stroke="#0f766e" strokeWidth="1.75" strokeLinecap="round" />
    </svg>
  );
}

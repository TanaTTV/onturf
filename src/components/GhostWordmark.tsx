// effects budget item #1: barely-perceptible wordmark watermark behind page content
export default function GhostWordmark() {
  return (
    <div
      aria-hidden
      className="pointer-events-none fixed inset-0 z-0 flex items-center overflow-hidden"
    >
      <span className="wordmark whitespace-nowrap text-[40vw] text-white opacity-[0.025]">
        ONTURF
      </span>
    </div>
  );
}

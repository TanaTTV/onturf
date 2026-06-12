"use client";

import { useEffect, useRef, useState } from "react";
import {
  renderProfileCard,
  renderShowCard,
  type ProfileCardData,
  type ShowCardData,
} from "@/lib/sharecard";

type Props =
  | { kind: "profile"; data: ProfileCardData; filename: string }
  | { kind: "show"; data: ShowCardData; filename: string };

export default function ShareCardButton(props: Props) {
  const [open, setOpen] = useState(false);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [canShare, setCanShare] = useState(false);
  const rendering = useRef(false);

  useEffect(() => {
    if (!open || blob || rendering.current) return;
    rendering.current = true;
    const render =
      props.kind === "profile" ? renderProfileCard(props.data) : renderShowCard(props.data);
    render
      .then((b) => {
        setBlob(b);
        setPreviewUrl(URL.createObjectURL(b));
        const file = new File([b], `${props.filename}.png`, { type: "image/png" });
        setCanShare(
          typeof navigator.canShare === "function" && navigator.canShare({ files: [file] })
        );
      })
      .catch(() => setError("could not render the card — try again"))
      .finally(() => {
        rendering.current = false;
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function share() {
    if (!blob) return;
    const file = new File([blob], `${props.filename}.png`, { type: "image/png" });
    try {
      await navigator.share({ files: [file] });
    } catch {
      // user cancelled — not an error
    }
  }

  function save() {
    if (!previewUrl) return;
    const a = document.createElement("a");
    a.href = previewUrl;
    a.download = `${props.filename}.png`;
    a.click();
  }

  return (
    <>
      <button onClick={() => setOpen(true)} className="btn-text py-1 text-muted">
        share card
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 p-6"
          role="dialog"
          aria-modal="true"
          aria-label="share card"
          onClick={(e) => {
            if (e.target === e.currentTarget) setOpen(false);
          }}
        >
          <div className="flex w-full max-w-xs flex-col gap-4">
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={previewUrl}
                alt="share card preview"
                className="max-h-[65vh] w-full border border-hairline object-contain"
              />
            ) : (
              <div className="flex aspect-[9/16] max-h-[65vh] w-full items-center justify-center border border-hairline">
                <span className="mono-meta text-muted">
                  {error ?? "RENDERING…"}
                </span>
              </div>
            )}

            <div className="flex gap-2">
              {canShare && (
                <button onClick={share} disabled={!blob} className="btn-primary flex-1 disabled:opacity-50">
                  share
                </button>
              )}
              <button
                onClick={save}
                disabled={!blob}
                className={`${canShare ? "btn-text flex-1" : "btn-primary flex-1"} disabled:opacity-50`}
              >
                save image
              </button>
              <button onClick={() => setOpen(false)} className="btn-text px-4 text-muted">
                close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

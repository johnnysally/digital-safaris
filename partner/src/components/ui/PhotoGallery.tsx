import { useRef, useState, type ChangeEvent } from "react";
import { ImagePlus, Star, Trash2, Upload } from "lucide-react";
import { getApiErrorMessage } from "../../api/axios";

interface PhotoGalleryProps {
  images: string[];
  onChange: (next: string[]) => void;
  onUpload?: (file: File) => Promise<{ url: string }>;
  onRemove?: (url: string) => Promise<void> | void;
  max?: number;
  maxFileBytes?: number;
  upload?: (file: File) => Promise<{ url: string }>;
  label?: string;
  helpText?: string;
}

export function PhotoGallery({
  images,
  onChange,
  onUpload,
  onRemove,
  max = Infinity,
  maxFileBytes = 5 * 1024 * 1024,
  upload,
  label = "Photos",
  helpText,
}: PhotoGalleryProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  const remaining = Math.max(0, max - images.length);
  const atCap = images.length >= max;
  const uploadFn = onUpload ?? upload;

  async function handleFiles(event: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(event.currentTarget.files ?? []);
    event.currentTarget.value = "";
    if (files.length === 0) return;
    setError("");

    if (atCap) {
      setError(`Maximum ${max} photo${max === 1 ? "" : "s"} allowed.`);
      return;
    }

    if (!uploadFn) {
      setError("Upload handler not configured.");
      return;
    }

    const accepted = files.slice(0, remaining);
    if (accepted.length < files.length) {
      setError(
        `Only ${remaining} more photo${remaining === 1 ? "" : "s"} could be added (max ${max}).`,
      );
    }

    const invalidType = accepted.find((file) => !file.type.startsWith("image/"));
    if (invalidType) {
      setError(`${invalidType.name} is not an image.`);
      return;
    }

    const tooLarge = accepted.find((file) => file.size > maxFileBytes);
    if (tooLarge) {
      setError(
        `${tooLarge.name} is larger than ${Math.round(maxFileBytes / 1024 / 1024)} MB.`,
      );
      return;
    }

    setUploading(true);
    try {
      const results = await Promise.all(accepted.map((file) => uploadFn(file)));
      const urls = results
        .map((r) => r?.url)
        .filter((url): url is string => typeof url === "string" && url.length > 0);

      if (urls.length === 0) {
        setError("Upload succeeded but no image URL was returned.");
        return;
      }

      onChange([...images, ...urls]);
    } catch (uploadError) {
      setError(getApiErrorMessage(uploadError, "Upload failed. Try again."));
    } finally {
      setUploading(false);
    }
  }

  async function removeAt(index: number) {
    const target = images[index];
    if (onRemove) {
      try {
        await onRemove(target);
      } catch (removeError) {
        setError(getApiErrorMessage(removeError, "Could not remove photo."));
        return;
      }
    }
    const next = images.filter((_, current) => current !== index);
    onChange(next);
    setError("");
  }

  function makeCover(index: number) {
    if (index === 0) return;
    const next = [...images];
    const [picked] = next.splice(index, 1);
    next.unshift(picked);
    onChange(next);
  }

  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= images.length) return;
    const next = [...images];
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  }

  return (
    <section
      className="rounded-xl border border-[#e9dfd1] bg-[#fcfaf6] p-4 sm:p-5"
      aria-labelledby="photo-gallery-heading"
    >
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-[#f5ead8] text-[#8b4e16]">
            <ImagePlus size={18} />
          </span>
          <div>
            <h3
              id="photo-gallery-heading"
              className="m-0 text-sm font-semibold text-[#332b24]"
            >
              {label}
            </h3>
            <p className="mb-0 mt-1 max-w-xl text-xs leading-relaxed text-[#81766a]">
              {helpText ??
                (max === Infinity
                  ? "Add photos to help guests understand the space. The first photo is used as the cover."
                  : `Add up to ${max} photos. The first photo is used as the cover.`)}
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || atCap}
          className="inline-flex min-h-9 items-center gap-2 rounded-lg border-0 bg-[#9b5b17] px-3.5 text-xs font-semibold text-white transition hover:bg-[#814a12] disabled:cursor-not-allowed disabled:opacity-60"
        >
          {uploading ? (
            <span className="size-3.5 animate-spin rounded-full border-2 border-white/40 border-t-white" />
          ) : (
            <Upload size={14} />
          )}
          {uploading
            ? "Uploading..."
            : atCap
              ? `Max ${max} reached`
              : `Add photo${remaining === 1 ? "" : "s"} (${images.length}/${max === Infinity ? "∞" : max})`}
        </button>
        <input
          ref={inputRef}
          className="sr-only"
          type="file"
          accept="image/*"
          multiple
          onChange={(event) => void handleFiles(event)}
        />
      </div>

      {images.length > 0 ? (
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-4">
          {images.map((image, index) => (
            <figure
              key={`${image}-${index}`}
              className="group relative m-0 aspect-[4/3] overflow-hidden rounded-lg border border-[#e8dfd2] bg-[#eee5d9]"
            >
              <img
                className="h-full w-full object-cover"
                src={image}
                alt={`Photo ${index + 1}`}
                loading="lazy"
              />
              <span className="absolute bottom-2 left-2 rounded-full bg-black/60 px-2 py-1 text-[9px] font-semibold text-white">
                {index === 0 ? "Cover" : `Photo ${index + 1}`}
              </span>

              <div className="absolute left-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button
                  type="button"
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  aria-label="Move photo left"
                  className="grid size-7 place-items-center rounded-full border-0 bg-black/55 text-xs text-white disabled:opacity-30"
                >
                  ←
                </button>
                <button
                  type="button"
                  onClick={() => move(index, 1)}
                  disabled={index === images.length - 1}
                  aria-label="Move photo right"
                  className="grid size-7 place-items-center rounded-full border-0 bg-black/55 text-xs text-white disabled:opacity-30"
                >
                  →
                </button>
              </div>

              <div className="absolute right-2 top-2 flex gap-1 opacity-0 transition group-hover:opacity-100">
                {index !== 0 ? (
                  <button
                    type="button"
                    onClick={() => makeCover(index)}
                    aria-label="Make cover photo"
                    title="Make cover"
                    className="grid size-8 place-items-center rounded-full border border-white/40 bg-black/55 text-white hover:bg-[#9b5b17]"
                  >
                    <Star size={14} />
                  </button>
                ) : null}
                <button
                  type="button"
                  onClick={() => void removeAt(index)}
                  aria-label="Remove photo"
                  title="Remove"
                  className="grid size-8 place-items-center rounded-full border border-white/40 bg-black/55 text-white hover:bg-[#9b342a]"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </figure>
          ))}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={uploading}
          className="flex min-h-[150px] w-full flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-[#d8c7aa] bg-white/70 px-4 text-center transition hover:border-[#b9781d] hover:bg-white disabled:opacity-60"
        >
          <span className="grid size-10 place-items-center rounded-xl bg-[#f5ead8] text-[#8b4e16]">
            <ImagePlus size={18} />
          </span>
          <strong className="text-xs text-[#554c43]">Add the first photo</strong>
          <span className="text-[10px] text-[#81766a]">
            JPG, PNG, or WebP up to {Math.round(maxFileBytes / 1024 / 1024)} MB each
          </span>
        </button>
      )}

      {error ? (
        <p
          className="mb-0 mt-3 rounded-lg border border-[#eed3cf] bg-[#fff8f7] px-3 py-2 text-xs text-[#914940]"
          role="alert"
        >
          {error}
        </p>
      ) : null}
    </section>
  );
}
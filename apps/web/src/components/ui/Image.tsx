import * as React from "react";
import { clsx } from "clsx";

type ImageFit = "contain" | "cover";
type ImageReveal = "blur" | "fade" | "none";
type ImageStatus = "loading" | "loaded" | "failed";

interface ImageState {
  src: string;
  status: ImageStatus;
}

const maxLoadedImageSrcCount = 200;
const loadedImageSrcSet = new Set<string>();

function getImageStatus({ imageState, src }: { imageState: ImageState; src: string }) {
  if (imageState.src === src) {
    return imageState.status;
  }

  return loadedImageSrcSet.has(src) ? "loaded" : "loading";
}

function rememberLoadedImageSrc({ src }: { src: string }) {
  loadedImageSrcSet.delete(src);
  loadedImageSrcSet.add(src);

  if (loadedImageSrcSet.size <= maxLoadedImageSrcCount) {
    return;
  }

  const oldestSrc = loadedImageSrcSet.keys().next().value;
  if (oldestSrc != null) {
    loadedImageSrcSet.delete(oldestSrc);
  }
}

interface Props {
  alt: string;
  src: string;
  width: number;
  height: number;
  fit?: ImageFit;
  placeholder?: string | null;
  priority?: boolean;
  reveal?: ImageReveal;
}

export function Image({
  alt,
  src,
  width,
  height,
  fit = "cover",
  placeholder = null,
  priority = false,
  reveal = "blur",
}: Props) {
  const [imageState, setImageState] = React.useState<ImageState>(() => {
    return {
      src,
      status: loadedImageSrcSet.has(src) ? "loaded" : "loading",
    };
  });
  const status = getImageStatus({ imageState, src });
  const isLoaded = status === "loaded";
  const hasFailed = status === "failed";

  const handleImageRef = (node: HTMLImageElement | null) => {
    if (node == null || status !== "loading" || !node.complete) {
      return;
    }

    if (node.naturalWidth > 0) {
      rememberLoadedImageSrc({ src });
      setImageState({ src, status: "loaded" });
      return;
    }

    setImageState({ src, status: "failed" });
  };

  return (
    <span className="relative isolate block size-full overflow-hidden">
      <span
        aria-hidden
        className={clsx(
          "absolute inset-0 bg-linear-to-br from-white/12 via-white/4 to-app-blue/15 transition-opacity duration-700 ease-(--ease-app-out)",
          reveal !== "none" && !isLoaded && "opacity-100",
          (reveal === "none" || isLoaded) && "opacity-0",
          reveal !== "none" && !isLoaded && "animate-pulse",
        )}
        style={placeholder == null ? undefined : { background: placeholder }}
      />
      <img
        alt={alt}
        className={clsx(
          "relative z-10 block size-full transition-[filter,opacity,transform] duration-700 ease-(--ease-app-out) motion-reduce:scale-100 motion-reduce:blur-none motion-reduce:transition-none",
          fit === "contain" && "object-contain",
          fit === "cover" && "object-cover",
          reveal === "blur" && !isLoaded && !hasFailed && "scale-[1.04] opacity-0 blur-2xl",
          reveal === "blur" && isLoaded && !hasFailed && "scale-100 opacity-100 blur-none",
          reveal === "fade" && !isLoaded && !hasFailed && "opacity-0",
          reveal === "fade" && isLoaded && !hasFailed && "opacity-100",
          reveal === "none" && !hasFailed && "opacity-100",
          hasFailed && "opacity-0",
        )}
        decoding={priority ? "sync" : "async"}
        fetchPriority={priority ? "high" : "auto"}
        height={height}
        loading={priority ? "eager" : "lazy"}
        ref={handleImageRef}
        src={src}
        width={width}
        onError={() => {
          setImageState({ src, status: "failed" });
        }}
        onLoad={() => {
          rememberLoadedImageSrc({ src });
          setImageState({ src, status: "loaded" });
        }}
      />
    </span>
  );
}

export function CoverImage({
  src,
  alt = "",
  positionX = 50,
  positionY = 50,
  zoom = 1,
  className = "",
}: {
  src: string;
  alt?: string;
  positionX?: number;
  positionY?: number;
  zoom?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      alt={alt}
      className={`h-full w-full object-cover ${className}`}
      src={src}
      style={{
        objectPosition: `${positionX}% ${positionY}%`,
        transform: `scale(${zoom})`,
      }}
    />
  );
}

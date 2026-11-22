import type { Photo } from '../data/content'

interface Props {
  photo: Photo
  highlight?: boolean
  caption?: string
}

export default function PhotoView({ photo, highlight = false, caption }: Props) {
  const r = photo.region
  return (
    <figure className="photo">
      <div className="photo-frame">
        <img src={photo.url} alt={caption ?? 'Bird photo'} draggable={false} />
        {highlight && r && (
          <div
            className="photo-region"
            style={{
              left: `${r.x * 100}%`,
              top: `${r.y * 100}%`,
              width: `${r.w * 100}%`,
              height: `${r.h * 100}%`,
            }}
          >
            {r.label && <span className="photo-region-label">{r.label}</span>}
          </div>
        )}
      </div>
      <figcaption>
        {caption && <strong>{caption}</strong>}
        <a href={photo.observationUrl} target="_blank" rel="noreferrer">
          {photo.attribution}
        </a>
      </figcaption>
    </figure>
  )
}

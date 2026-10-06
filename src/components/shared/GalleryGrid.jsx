// PATH: /src/components/shared/GalleryGrid.jsx
// Credential grid. Shapes match T-provider_files, plus a `url` the page adds:
// a short-lived signed link, because certificates live in a private bucket.
// Images show as a thumbnail; PDFs (and files without a link) show an icon
// and the file name. A tile with a link opens the file in a new tab.

import EmptyState from './EmptyState';
import Icon from '@/components/ui/Icon';
import { isImageName } from '@/lib/uploads';

const TYPE_ICON = {
  certificate: 'certificate',
  work_sample: 'image',
  photo:       'camera',
};

export default function GalleryGrid({ files = [] }) {
  if (!files.length) {
    return (
      <EmptyState
        icon="image"
        title="No credentials yet"
        hint="Certificates will appear here once they are uploaded."
      />
    );
  }

  return (
    <div className="gallery-grid">
      {files.map(({ file_id, file_type, url, original_name }) => {
        const inner = url && isImageName(original_name) ? (
          <img src={url} alt={original_name} className="gallery-tile-img" loading="lazy" />
        ) : (
          <>
            <span className="gallery-tile-icon">
              <Icon name={TYPE_ICON[file_type] ?? 'file'} size="xl" />
            </span>
            <span className="gallery-tile-name">{original_name}</span>
          </>
        );

        return url ? (
          <a
            className="gallery-tile"
            key={file_id}
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            aria-label={`Open ${original_name}`}
          >
            {inner}
          </a>
        ) : (
          <div className="gallery-tile" key={file_id}>{inner}</div>
        );
      })}
    </div>
  );
}

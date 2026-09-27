// PATH: /src/components/shared/GalleryGrid.jsx
// Photo/credential grid. Shapes match T-provider_files.
// Phase 1 note: dummy records carry file_path: null, so tiles render a
// labelled placeholder rather than an <img>. Once Phase 2 issues signed URLs
// from Supabase Storage, pass file_path through and the <img> branch renders.

import EmptyState from './EmptyState';
import Icon from '@/components/ui/Icon';

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
        title="No photos yet"
        hint="Certificates and work samples will appear here."
      />
    );
  }

  return (
    <div className="gallery-grid">
      {files.map(({ file_id, file_type, file_path, original_name }) => (
        <div className="gallery-tile" key={file_id}>
          {file_path ? (
            <img src={file_path} alt={original_name} className="gallery-tile-img" />
          ) : (
            <>
              <span className="gallery-tile-icon">
                <Icon name={TYPE_ICON[file_type] ?? 'file'} size="xl" />
              </span>
              <span className="gallery-tile-name">{original_name}</span>
            </>
          )}
        </div>
      ))}
    </div>
  );
}

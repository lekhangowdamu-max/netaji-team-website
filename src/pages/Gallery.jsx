import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function Gallery() {
  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [selectedIndex, setSelectedIndex] = useState(null)

  useEffect(() => {
    fetchPhotos()
  }, [])

  async function fetchPhotos() {
    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error loading gallery:', error)
      setError(error.message)
    } else {
      setPhotos(data || [])
    }

    setLoading(false)
  }

  function closeViewer() {
    setSelectedIndex(null)
  }

  function showPrevious() {
    setSelectedIndex((current) =>
      current === 0 ? photos.length - 1 : current - 1
    )
  }

  function showNext() {
    setSelectedIndex((current) =>
      current === photos.length - 1 ? 0 : current + 1
    )
  }

  // Keyboard controls
  useEffect(() => {
    function handleKeyDown(e) {
      if (selectedIndex === null) return

      if (e.key === 'Escape') {
        closeViewer()
      }

      if (e.key === 'ArrowLeft') {
        showPrevious()
      }

      if (e.key === 'ArrowRight') {
        showNext()
      }
    }

    window.addEventListener('keydown', handleKeyDown)

    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [selectedIndex, photos.length])

  return (
    <div className="gallery-page">

      {/* Header */}
      <div className="gallery-header">
        <p className="section-label">
          PHOTO GALLERY
        </p>

        <h1>
          ಗಣೇಶೋತ್ಸವ ಫೋಟೋ ಗ್ಯಾಲರಿ
        </h1>

        <p>
          ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್ ಯುವಕರ ಸಂಘ
        </p>
      </div>

      {/* Loading */}
      {loading && (
        <div className="gallery-message">
          <p>📸 ಫೋಟೋಗಳನ್ನು ಲೋಡ್ ಮಾಡಲಾಗುತ್ತಿದೆ...</p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="gallery-message">
          <p>Gallery error: {error}</p>
        </div>
      )}

      {/* Empty Gallery */}
      {!loading && !error && photos.length === 0 && (
        <div className="gallery-message">
          <div className="photo-placeholder">
            📸
          </div>

          <h2>
            ಇನ್ನೂ ಯಾವುದೇ ಫೋಟೋಗಳು ಇಲ್ಲ
          </h2>

          <p>
            ಗಣೇಶೋತ್ಸವದ ಫೋಟೋಗಳು ಶೀಘ್ರದಲ್ಲೇ ಇಲ್ಲಿ ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ.
          </p>
        </div>
      )}

      {/* Gallery Grid */}
      {!loading && !error && photos.length > 0 && (
        <div className="gallery-grid">

          {photos.map((photo, index) => (
            <div
              className="photo-card"
              key={photo.id}
              onClick={() => setSelectedIndex(index)}
            >

              <img
                src={photo.image_url}
                alt={photo.title || 'Gallery Photo'}
              />

              <div className="photo-card-content">

                <h3>
                  {photo.title || 'ಗಣೇಶೋತ್ಸವ'}
                </h3>

                {photo.description && (
                  <p>
                    {photo.description}
                  </p>
                )}

              </div>

            </div>
          ))}

        </div>
      )}

      {/* Full Screen Viewer */}
      {selectedIndex !== null && photos[selectedIndex] && (
        <div
          className="photo-viewer"
          onClick={closeViewer}
        >

          <button
            className="viewer-close"
            onClick={closeViewer}
          >
            ✕
          </button>

          <button
            className="viewer-prev"
            onClick={(e) => {
              e.stopPropagation()
              showPrevious()
            }}
          >
            ‹
          </button>

          <div
            className="viewer-content"
            onClick={(e) => e.stopPropagation()}
          >

            <img
              src={photos[selectedIndex].image_url}
              alt={
                photos[selectedIndex].title ||
                'Gallery Photo'
              }
            />

            <div className="viewer-info">

              <h2>
                {photos[selectedIndex].title ||
                  'ಗಣೇಶೋತ್ಸವ'}
              </h2>

              {photos[selectedIndex].description && (
                <p>
                  {photos[selectedIndex].description}
                </p>
              )}

              <span>
                {selectedIndex + 1} / {photos.length}
              </span>

            </div>

          </div>

          <button
            className="viewer-next"
            onClick={(e) => {
              e.stopPropagation()
              showNext()
            }}
          >
            ›
          </button>

        </div>
      )}

    </div>
  )
}

export default Gallery
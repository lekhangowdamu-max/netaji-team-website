import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'

function Gallery() {
  const [photos, setPhotos] = useState([])
  const [years, setYears] = useState([])
  const [selectedYear, setSelectedYear] =
    useState(null)

  const [loading, setLoading] =
    useState(true)

  const [error, setError] =
    useState('')

  const [selectedIndex, setSelectedIndex] =
    useState(null)

  // ==========================================
  // LOAD GALLERY
  // ==========================================

  useEffect(() => {
    fetchPhotos()
  }, [])

  async function fetchPhotos() {
    setLoading(true)

    const {
      data,
      error,
    } = await supabase
      .from('gallery')
      .select('*')
      .not('gallery_year', 'is', null)
      .order('gallery_year', {
        ascending: false,
      })
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Error loading gallery:',
        error
      )

      setError(error.message)

      setLoading(false)

      return
    }

    const galleryData =
      data || []

    setPhotos(
      galleryData
    )

    // ========================================
    // FIND ONLY YEARS WITH MEDIA
    // ========================================

    const availableYears =
      [
        ...new Set(
          galleryData.map(
            (item) =>
              Number(
                item.gallery_year
              )
          )
        ),
      ]
        .filter(
          (year) =>
            !Number.isNaN(year)
        )
        .sort(
          (a, b) => b - a
        )

    setYears(
      availableYears
    )

    // ========================================
    // AUTOMATICALLY SELECT LATEST YEAR
    // ========================================

    if (
      availableYears.length > 0
    ) {
      setSelectedYear(
        availableYears[0]
      )
    } else {
      setSelectedYear(null)
    }

    setLoading(false)
  }

  // ==========================================
  // FILTER CURRENT YEAR
  // ==========================================

  const selectedPhotos =
    photos.filter(
      (photo) =>
        Number(
          photo.gallery_year
        ) ===
        Number(
          selectedYear
        )
    )

  // ==========================================
  // VIEWER
  // ==========================================

  function closeViewer() {
    setSelectedIndex(null)
  }

  function showPrevious() {
    setSelectedIndex(
      (current) =>
        current === 0
          ? selectedPhotos.length - 1
          : current - 1
    )
  }

  function showNext() {
    setSelectedIndex(
      (current) =>
        current ===
        selectedPhotos.length - 1
          ? 0
          : current + 1
    )
  }

  // ==========================================
  // KEYBOARD
  // ==========================================

  useEffect(() => {
    function handleKeyDown(e) {
      if (
        selectedIndex === null
      ) {
        return
      }

      if (
        e.key === 'Escape'
      ) {
        closeViewer()
      }

      if (
        e.key === 'ArrowLeft'
      ) {
        showPrevious()
      }

      if (
        e.key === 'ArrowRight'
      ) {
        showNext()
      }
    }

    window.addEventListener(
      'keydown',
      handleKeyDown
    )

    return () =>
      window.removeEventListener(
        'keydown',
        handleKeyDown
      )
  }, [
    selectedIndex,
    selectedPhotos.length,
  ])

  // ==========================================
  // LOADING
  // ==========================================

  if (loading) {
    return (
      <div className="gallery-page">

        <div className="gallery-message">

          <p>
            📸 ಫೋಟೋಗಳನ್ನು ಲೋಡ್
            ಮಾಡಲಾಗುತ್ತಿದೆ...
          </p>

        </div>

      </div>
    )
  }

  // ==========================================
  // ERROR
  // ==========================================

  if (error) {
    return (
      <div className="gallery-page">

        <div className="gallery-message">

          <p>
            Gallery error:
            {error}
          </p>

        </div>

      </div>
    )
  }

  // ==========================================
  // NO MEDIA AT ALL
  // ==========================================

  if (years.length === 0) {
    return (
      <div className="gallery-page">

        <div className="gallery-header">

          <p className="section-label">
            PHOTO GALLERY
          </p>

          <h1>
            ಗಣೇಶೋತ್ಸವ ಫೋಟೋ ಗ್ಯಾಲರಿ
          </h1>

          <p>
            ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್
            ಯುವಕರ ಸಂಘ
          </p>

        </div>

        <div className="gallery-message">

          <div className="photo-placeholder">
            📸
          </div>

          <h2>
            ಇನ್ನೂ ಯಾವುದೇ ಫೋಟೋಗಳು ಇಲ್ಲ
          </h2>

          <p>
            ಗಣೇಶೋತ್ಸವದ ಫೋಟೋಗಳು
            ಶೀಘ್ರದಲ್ಲೇ ಇಲ್ಲಿ
            ಕಾಣಿಸಿಕೊಳ್ಳುತ್ತವೆ.
          </p>

        </div>

      </div>
    )
  }

  // ==========================================
  // MAIN GALLERY
  // ==========================================

  return (
    <div className="gallery-page">

      {/* HEADER */}

      <div className="gallery-header">

        <p className="section-label">
          PHOTO GALLERY
        </p>

        <h1>
          ಗಣೇಶೋತ್ಸವ ಫೋಟೋ ಗ್ಯಾಲರಿ
        </h1>

        <p>
          ನೆತಾಜಿ ಸುಭಾಷ್ ಚಂದ್ರ ಬೋಸ್
          ಯುವಕರ ಸಂಘ
        </p>

      </div>


      {/* YEAR SELECTOR */}

      <div className="gallery-year-selector">

        <label htmlFor="gallery-year">
          📅 Select Gallery Year
        </label>

        <select
          id="gallery-year"
          value={selectedYear || ''}
          onChange={(e) => {
            setSelectedYear(
              Number(
                e.target.value
              )
            )

            setSelectedIndex(
              null
            )
          }}
          className="public-gallery-year-select"
        >

          {years.map(
            (year) => (

              <option
                key={year}
                value={year}
              >
                {year}
              </option>

            )
          )}

        </select>

      </div>


      {/* SELECTED YEAR */}

      <div className="selected-gallery-year">

        <h2>
          {selectedYear}
          Gallery
        </h2>

      </div>


      {/* YEAR MEDIA */}

      {selectedPhotos.length === 0 ? (

        <div className="no-year-media">

          <h3>
            No media available
          </h3>

          <p>
            There are no photos or
            videos for {selectedYear}.
          </p>

        </div>

      ) : (

        <div className="gallery-grid">

          {selectedPhotos.map(
            (photo, index) => (

              <div
                className="photo-card"
                key={
                  photo.id
                }
                onClick={() =>
                  setSelectedIndex(
                    index
                  )
                }
              >

                {/* MEDIA */}

                <div className="photo-media-container">

                  {photo.media_type ===
                  'video' ? (

                    <video
                      src={
                        photo.image_url
                      }
                      muted
                      playsInline
                      preload="metadata"
                      className="gallery-card-video"
                    />

                  ) : (

                    <img
                      src={
                        photo.image_url
                      }
                      alt={
                        photo.title ||
                        'Gallery Photo'
                      }
                    />

                  )}

                  <div className="media-type-badge">

                    {photo.media_type ===
                    'video'
                      ? '🎬 VIDEO'
                      : '📷 PHOTO'}

                  </div>

                </div>


                {/* CONTENT */}

                <div className="photo-card-content">

                  <h3>
                    {photo.title ||
                      'ಗಣೇಶೋತ್ಸವ'}
                  </h3>

                  {photo.description && (

                    <p>
                      {
                        photo.description
                      }
                    </p>

                  )}

                </div>

              </div>

            )
          )}

        </div>

      )}


      {/* FULL SCREEN VIEWER */}

      {selectedIndex !== null &&
        selectedPhotos[
          selectedIndex
        ] && (

          <div
            className="photo-viewer"
            onClick={
              closeViewer
            }
          >

            {/* CLOSE */}

            <button
              className="viewer-close"
              onClick={
                closeViewer
              }
            >
              ✕
            </button>


            {/* PREVIOUS */}

            <button
              className="viewer-prev"
              onClick={(e) => {

                e.stopPropagation()

                showPrevious()

              }}
            >
              ‹
            </button>


            {/* CONTENT */}

            <div
              className="viewer-content"
              onClick={(e) =>
                e.stopPropagation()
              }
            >

              {selectedPhotos[
                selectedIndex
              ].media_type ===
              'video' ? (

                <video
                  src={
                    selectedPhotos[
                      selectedIndex
                    ].image_url
                  }
                  controls
                  autoPlay
                  playsInline
                  className="viewer-video"
                />

              ) : (

                <img
                  src={
                    selectedPhotos[
                      selectedIndex
                    ].image_url
                  }
                  alt={
                    selectedPhotos[
                      selectedIndex
                    ].title ||
                    'Gallery Photo'
                  }
                />

              )}


              {/* INFO */}

              <div className="viewer-info">

                <h2>
                  {
                    selectedPhotos[
                      selectedIndex
                    ].title
                  }
                </h2>

                {selectedPhotos[
                  selectedIndex
                ].description && (

                  <p>
                    {
                      selectedPhotos[
                        selectedIndex
                      ].description
                    }
                  </p>

                )}

                <span>
                  {selectedIndex + 1}
                  {' / '}
                  {
                    selectedPhotos.length
                  }
                </span>

              </div>

            </div>


            {/* NEXT */}

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
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function GalleryAdmin() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [galleryYear, setGalleryYear] = useState(
    new Date().getFullYear()
  )
  const [photo, setPhoto] = useState(null)

  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingPhotos, setLoadingPhotos] = useState(true)
  const [message, setMessage] = useState('')

  const [editingId, setEditingId] = useState(null)

  // ==========================================
  // GENERATE YEARS
  // 2015 -> CURRENT YEAR
  // ==========================================

  const currentYear = new Date().getFullYear()

  const years = Array.from(
    { length: currentYear - 2015 + 1 },
    (_, index) => 2015 + index
  ).reverse()

  // ==========================================
  // LOAD GALLERY
  // ==========================================

  useEffect(() => {
    fetchPhotos()
  }, [])

  async function fetchPhotos() {
    setLoadingPhotos(true)

    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('gallery_year', {
        ascending: false,
      })
      .order('created_at', {
        ascending: false,
      })

    if (error) {
      console.error(
        'Gallery loading error:',
        error
      )

      setMessage(error.message)
    } else {
      setPhotos(data || [])
    }

    setLoadingPhotos(false)
  }

  // ==========================================
  // MEDIA TYPE
  // ==========================================

  function getMediaType(file) {
    if (!file) {
      return 'image'
    }

    return file.type.startsWith('video/')
      ? 'video'
      : 'image'
  }

  // ==========================================
  // UPLOAD MEDIA
  // ==========================================

  async function handleUpload(e) {
    e.preventDefault()

    if (!photo) {
      setMessage(
        'Please select an image or video.'
      )
      return
    }

    if (!galleryYear) {
      setMessage(
        'Please select a year.'
      )
      return
    }

    setLoading(true)
    setMessage('')

    try {
      // CHECK LOGIN
      const {
        data: userData,
        error: userError,
      } = await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error(
          'Please login as admin first.'
        )
      }

      // DETECT MEDIA TYPE
      const mediaType = getMediaType(photo)

      // FILE EXTENSION
      const fileExt =
        photo.name
          .split('.')
          .pop()
          ?.toLowerCase() || 'file'

      // UNIQUE FILE NAME
      const fileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`

      // UPLOAD TO STORAGE
      const {
        error: uploadError,
      } = await supabase.storage
        .from('gallery-photos')
        .upload(fileName, photo, {
          contentType: photo.type,
          upsert: false,
        })

      if (uploadError) {
        throw uploadError
      }

      // PUBLIC URL
      const {
        data: urlData,
      } = supabase.storage
        .from('gallery-photos')
        .getPublicUrl(fileName)

      if (!urlData?.publicUrl) {
        throw new Error(
          'Unable to create media URL.'
        )
      }

      // SAVE DATABASE
      const {
        error: insertError,
      } = await supabase
        .from('gallery')
        .insert({
          image_url: urlData.publicUrl,
          title,
          description,
          uploaded_by: userData.user.id,
          media_type: mediaType,
          gallery_year: Number(galleryYear),
        })

      if (insertError) {
        // Remove uploaded file
        await supabase.storage
          .from('gallery-photos')
          .remove([fileName])

        throw insertError
      }

      setMessage(
        mediaType === 'video'
          ? `Video added to ${galleryYear} gallery successfully! 🎉`
          : `Photo added to ${galleryYear} gallery successfully! 🎉`
      )

      // RESET
      setTitle('')
      setDescription('')
      setGalleryYear(
        new Date().getFullYear()
      )
      setPhoto(null)

      const input =
        document.getElementById(
          'gallery-photo-input'
        )

      if (input) {
        input.value = ''
      }

      fetchPhotos()

    } catch (error) {
      console.error(
        'Upload error:',
        error
      )

      setMessage(error.message)
    }

    setLoading(false)
  }

  // ==========================================
  // START EDIT
  // ==========================================

  function startEdit(mediaItem) {
    setEditingId(mediaItem.id)

    setTitle(
      mediaItem.title || ''
    )

    setDescription(
      mediaItem.description || ''
    )

    setGalleryYear(
      mediaItem.gallery_year ||
      new Date().getFullYear()
    )

    setPhoto(null)

    const input =
      document.getElementById(
        'gallery-photo-input'
      )

    if (input) {
      input.value = ''
    }

    setMessage('')

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // ==========================================
  // CANCEL EDIT
  // ==========================================

  function cancelEdit() {
    setEditingId(null)

    setTitle('')
    setDescription('')
    setGalleryYear(
      new Date().getFullYear()
    )
    setPhoto(null)

    const input =
      document.getElementById(
        'gallery-photo-input'
      )

    if (input) {
      input.value = ''
    }

    setMessage('')
  }

  // ==========================================
  // UPDATE MEDIA
  // ==========================================

  async function handleUpdate(e) {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    try {
      const currentMedia =
        photos.find(
          (item) =>
            item.id === editingId
        )

      if (!currentMedia) {
        throw new Error(
          'Media not found.'
        )
      }

      let mediaUrl =
        currentMedia.image_url

      let mediaType =
        currentMedia.media_type ||
        'image'

      // ========================================
      // REPLACE FILE IF SELECTED
      // ========================================

      if (photo) {
        mediaType =
          getMediaType(photo)

        const fileExt =
          photo.name
            .split('.')
            .pop()
            ?.toLowerCase() ||
          'file'

        const fileName =
          `${Date.now()}-${Math.random()
            .toString(36)
            .substring(2)}.${fileExt}`

        const {
          error: uploadError,
        } = await supabase.storage
          .from('gallery-photos')
          .upload(
            fileName,
            photo,
            {
              contentType:
                photo.type,
              upsert: false,
            }
          )

        if (uploadError) {
          throw uploadError
        }

        const {
          data: urlData,
        } = supabase.storage
          .from('gallery-photos')
          .getPublicUrl(
            fileName
          )

        mediaUrl =
          urlData.publicUrl

        // DELETE OLD FILE
        const oldFileName =
          currentMedia.image_url.split(
            '/gallery-photos/'
          )[1]

        if (oldFileName) {
          await supabase.storage
            .from(
              'gallery-photos'
            )
            .remove([
              oldFileName,
            ])
        }
      }

      // ========================================
      // UPDATE DATABASE
      // ========================================

      const {
        error: updateError,
      } = await supabase
        .from('gallery')
        .update({
          title,
          description,
          image_url: mediaUrl,
          media_type: mediaType,
          gallery_year:
            Number(galleryYear),
        })
        .eq(
          'id',
          editingId
        )

      if (updateError) {
        throw updateError
      }

      setMessage(
        `Gallery media moved to ${galleryYear} successfully! ✅`
      )

      cancelEdit()

      fetchPhotos()

    } catch (error) {
      console.error(
        'Update error:',
        error
      )

      setMessage(
        error.message
      )
    }

    setLoading(false)
  }

  // ==========================================
  // DELETE MEDIA
  // ==========================================

  async function handleDelete(
    mediaItem
  ) {
    const confirmed =
      window.confirm(
        `Delete "${mediaItem.title || 'this media'}"?`
      )

    if (!confirmed) {
      return
    }

    try {
      setMessage(
        'Deleting...'
      )

      const fileName =
        mediaItem.image_url.split(
          '/gallery-photos/'
        )[1]

      // DELETE STORAGE FILE
      if (fileName) {
        await supabase.storage
          .from(
            'gallery-photos'
          )
          .remove([
            fileName,
          ])
      }

      // DELETE DATABASE RECORD
      const {
        error: deleteError,
      } = await supabase
        .from('gallery')
        .delete()
        .eq(
          'id',
          mediaItem.id
        )

      if (deleteError) {
        throw deleteError
      }

      setMessage(
        'Media deleted successfully! 🗑️'
      )

      fetchPhotos()

    } catch (error) {
      console.error(
        'Delete error:',
        error
      )

      setMessage(
        error.message
      )
    }
  }

  // ==========================================
  // PREVIEW
  // ==========================================

  function renderPreview() {
    if (!photo) {
      return null
    }

    const previewUrl =
      URL.createObjectURL(
        photo
      )

    const mediaType =
      getMediaType(photo)

    return (
      <div className="upload-preview">

        <p>
          {mediaType === 'video'
            ? 'New Video Preview:'
            : 'New Photo Preview:'}
        </p>

        <div className="upload-preview-box">

          {mediaType === 'video' ? (

            <video
              src={previewUrl}
              controls
              muted
              playsInline
              preload="metadata"
              className="upload-preview-media"
            />

          ) : (

            <img
              src={previewUrl}
              alt="Preview"
              className="upload-preview-media"
            />

          )}

        </div>

      </div>
    )
  }

  // ==========================================
  // MEDIA CARD
  // ==========================================

  function renderMedia(
    mediaItem
  ) {
    const mediaType =
      mediaItem.media_type ||
      'image'

    if (
      mediaType === 'video'
    ) {
      return (
        <div className="admin-media-container">

          <video
            src={
              mediaItem.image_url
            }
            controls
            muted
            playsInline
            preload="metadata"
            className="admin-gallery-media"
          />

          <div className="media-type-badge">
            🎬 VIDEO
          </div>

        </div>
      )
    }

    return (
      <div className="admin-media-container">

        <img
          src={
            mediaItem.image_url
          }
          alt={
            mediaItem.title ||
            'Gallery Photo'
          }
          className="admin-gallery-media"
        />

        <div className="media-type-badge">
          📷 PHOTO
        </div>

      </div>
    )
  }

  // ==========================================
  // PAGE
  // ==========================================

  return (
    <div className="admin-dashboard">

      {/* HEADER */}

      <div className="admin-header">

        <div>

          <p className="section-label">
            ADMIN PANEL
          </p>

          <h1>
            Gallery Management
          </h1>

          <p>
            Upload and manage
            organization photos
            and videos
          </p>

        </div>

        <button
          onClick={() =>
            navigate('/admin')
          }
          className="admin-logout-btn"
        >
          ← Dashboard
        </button>

      </div>


      {/* UPLOAD / EDIT */}

      <div className="admin-upload-card">

        <p className="section-label">

          {editingId
            ? 'EDIT MEDIA'
            : 'UPLOAD MEDIA'}

        </p>

        <h2>

          {editingId
            ? 'Edit Gallery Media'
            : 'Add Gallery Media'}

        </h2>


        <form
          onSubmit={
            editingId
              ? handleUpdate
              : handleUpload
          }
          className="login-form"
        >

          {/* TITLE */}

          <input
            type="text"
            placeholder="Photo / Video Title"
            value={title}
            onChange={(e) =>
              setTitle(
                e.target.value
              )
            }
            required
          />


          {/* DESCRIPTION */}

          <textarea
            placeholder="Photo / Video Description"
            value={
              description
            }
            onChange={(e) =>
              setDescription(
                e.target.value
              )
            }
            rows="4"
          />


          {/* YEAR */}

          <label className="upload-label">
            Select Gallery Year
          </label>

          <select
            value={galleryYear}
            onChange={(e) =>
              setGalleryYear(
                Number(
                  e.target.value
                )
              )
            }
            className="gallery-year-select"
            required
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


          {/* FILE */}

          <label className="upload-label">

            {editingId
              ? 'Replace Photo / Video (Optional)'
              : 'Select Photo or Video'}

          </label>

          <input
            id="gallery-photo-input"
            type="file"
            accept="image/*,video/mp4,video/webm,video/quicktime"
            onChange={(e) => {

              const selectedFile =
                e.target.files?.[0]

              setPhoto(
                selectedFile ||
                null
              )

            }}
            required={!editingId}
          />


          {/* PREVIEW */}

          {renderPreview()}


          {/* BUTTON */}

          <button
            type="submit"
            className="primary-btn"
            disabled={loading}
          >

            {loading
              ? editingId
                ? 'Updating...'
                : 'Uploading...'
              : editingId
                ? '💾 Save Changes'
                : '📤 Upload Media'}

          </button>


          {/* CANCEL */}

          {editingId && (

            <button
              type="button"
              className="cancel-edit-btn"
              onClick={
                cancelEdit
              }
            >
              ✕ Cancel Edit
            </button>

          )}

        </form>


        {/* MESSAGE */}

        {message && (

          <p className="upload-message">
            {message}
          </p>

        )}

      </div>


      {/* MANAGE GALLERY */}

      <div className="gallery-management">

        <p className="section-label">
          UPLOADED MEDIA
        </p>

        <h2>
          Manage Gallery
        </h2>


        {loadingPhotos ? (

          <p className="gallery-admin-message">
            Loading media...
          </p>

        ) : photos.length === 0 ? (

          <p className="gallery-admin-message">
            No photos or videos uploaded yet.
          </p>

        ) : (

          <div className="admin-gallery-grid">

            {photos.map(
              (mediaItem) => (

                <div
                  className="admin-gallery-card"
                  key={
                    mediaItem.id
                  }
                >

                  {/* MEDIA */}

                  {renderMedia(
                    mediaItem
                  )}


                  {/* INFO */}

                  <div className="admin-gallery-info">

                    <div className="admin-gallery-year">
                      {mediaItem.gallery_year
                        ? `📅 ${mediaItem.gallery_year}`
                        : '📅 Year not set'}
                    </div>

                    <h3>
                      {mediaItem.title ||
                        'Untitled Media'}
                    </h3>

                    {mediaItem.description && (

                      <p>
                        {
                          mediaItem.description
                        }
                      </p>

                    )}


                    {/* ACTIONS */}

                    <div className="gallery-action-buttons">

                      <button
                        onClick={() =>
                          startEdit(
                            mediaItem
                          )
                        }
                        className="edit-photo-btn"
                      >
                        ✏️ Edit
                      </button>


                      <button
                        onClick={() =>
                          handleDelete(
                            mediaItem
                          )
                        }
                        className="delete-photo-btn"
                      >
                        🗑️ Delete
                      </button>

                    </div>

                  </div>

                </div>

              )
            )}

          </div>

        )}

      </div>

    </div>
  )
}

export default GalleryAdmin
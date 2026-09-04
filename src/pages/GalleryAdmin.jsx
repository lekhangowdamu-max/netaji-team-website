import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

function GalleryAdmin() {
  const navigate = useNavigate()

  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [photo, setPhoto] = useState(null)

  const [photos, setPhotos] = useState([])
  const [loading, setLoading] = useState(false)
  const [loadingPhotos, setLoadingPhotos] = useState(true)
  const [message, setMessage] = useState('')

  const [editingId, setEditingId] = useState(null)

  useEffect(() => {
    fetchPhotos()
  }, [])

  async function fetchPhotos() {
    setLoadingPhotos(true)

    const { data, error } = await supabase
      .from('gallery')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      console.error(error)
      setMessage(error.message)
    } else {
      setPhotos(data || [])
    }

    setLoadingPhotos(false)
  }

  // =========================
  // UPLOAD PHOTO
  // =========================

  async function handleUpload(e) {
    e.preventDefault()

    if (!photo) {
      setMessage('Please select a photo.')
      return
    }

    setLoading(true)
    setMessage('')

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser()

      if (userError || !userData.user) {
        throw new Error('Please login as admin first.')
      }

      const fileExt = photo.name.split('.').pop()

      const fileName = `${Date.now()}-${Math.random()
        .toString(36)
        .substring(2)}.${fileExt}`

      const { error: uploadError } = await supabase.storage
        .from('gallery-photos')
        .upload(fileName, photo)

      if (uploadError) {
        throw uploadError
      }

      const { data: urlData } = supabase.storage
        .from('gallery-photos')
        .getPublicUrl(fileName)

      const { error: insertError } = await supabase
        .from('gallery')
        .insert({
          image_url: urlData.publicUrl,
          title,
          description,
          uploaded_by: userData.user.id,
        })

      if (insertError) {
        throw insertError
      }

      setMessage('Photo uploaded successfully! 🎉')

      setTitle('')
      setDescription('')
      setPhoto(null)

      const input = document.getElementById(
        'gallery-photo-input'
      )

      if (input) {
        input.value = ''
      }

      fetchPhotos()

    } catch (error) {
      console.error(error)
      setMessage(error.message)
    }

    setLoading(false)
  }

  // =========================
  // START EDITING
  // =========================

  function startEdit(photoItem) {
    setEditingId(photoItem.id)
    setTitle(photoItem.title || '')
    setDescription(photoItem.description || '')
    setPhoto(null)

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  // =========================
  // CANCEL EDIT
  // =========================

  function cancelEdit() {
    setEditingId(null)
    setTitle('')
    setDescription('')
    setPhoto(null)

    const input = document.getElementById(
      'gallery-photo-input'
    )

    if (input) {
      input.value = ''
    }

    setMessage('')
  }

  // =========================
  // UPDATE PHOTO
  // =========================

  async function handleUpdate(e) {
    e.preventDefault()

    setLoading(true)
    setMessage('')

    try {
      const currentPhoto = photos.find(
        (item) => item.id === editingId
      )

      if (!currentPhoto) {
        throw new Error('Photo not found.')
      }

      let imageUrl = currentPhoto.image_url

      // If new photo selected, upload it
      if (photo) {
        const fileExt = photo.name.split('.').pop()

        const fileName = `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`

        const { error: uploadError } =
          await supabase.storage
            .from('gallery-photos')
            .upload(fileName, photo)

        if (uploadError) {
          throw uploadError
        }

        const { data: urlData } =
          supabase.storage
            .from('gallery-photos')
            .getPublicUrl(fileName)

        imageUrl = urlData.publicUrl

        // Delete old image
        const oldFileName =
          currentPhoto.image_url.split(
            '/gallery-photos/'
          )[1]

        if (oldFileName) {
          await supabase.storage
            .from('gallery-photos')
            .remove([oldFileName])
        }
      }

      // Update database
      const { error: updateError } =
        await supabase
          .from('gallery')
          .update({
            title,
            description,
            image_url: imageUrl,
          })
          .eq('id', editingId)

      if (updateError) {
        throw updateError
      }

      setMessage(
        'Photo updated successfully! ✅'
      )

      setEditingId(null)
      setTitle('')
      setDescription('')
      setPhoto(null)

      const input = document.getElementById(
        'gallery-photo-input'
      )

      if (input) {
        input.value = ''
      }

      fetchPhotos()

    } catch (error) {
      console.error(error)
      setMessage(error.message)
    }

    setLoading(false)
  }

  // =========================
  // DELETE PHOTO
  // =========================

  async function handleDelete(photoItem) {
    const confirmed = window.confirm(
      `Delete "${photoItem.title || 'this photo'}"?`
    )

    if (!confirmed) {
      return
    }

    try {
      const fileName =
        photoItem.image_url.split(
          '/gallery-photos/'
        )[1]

      if (fileName) {
        const { error: storageError } =
          await supabase.storage
            .from('gallery-photos')
            .remove([fileName])

        if (storageError) {
          console.error(storageError)
        }
      }

      const { error: deleteError } =
        await supabase
          .from('gallery')
          .delete()
          .eq('id', photoItem.id)

      if (deleteError) {
        throw deleteError
      }

      setMessage(
        'Photo deleted successfully! 🗑️'
      )

      fetchPhotos()

    } catch (error) {
      console.error(error)
      setMessage(error.message)
    }
  }

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
            Upload and manage organization photos
          </p>

        </div>

        <button
          onClick={() => navigate('/admin')}
          className="admin-logout-btn"
        >
          ← Dashboard
        </button>

      </div>


      {/* UPLOAD / EDIT FORM */}

      <div className="admin-upload-card">

        <p className="section-label">
          {editingId
            ? 'EDIT PHOTO'
            : 'UPLOAD PHOTO'}
        </p>

        <h2>
          {editingId
            ? 'Edit Gallery Photo'
            : 'Add Gallery Photo'}
        </h2>

        <form
          onSubmit={
            editingId
              ? handleUpdate
              : handleUpload
          }
          className="login-form"
        >

          <input
            type="text"
            placeholder="Photo Title"
            value={title}
            onChange={(e) =>
              setTitle(e.target.value)
            }
            required
          />

          <textarea
            placeholder="Photo Description"
            value={description}
            onChange={(e) =>
              setDescription(e.target.value)
            }
            rows="4"
          />

          <label className="upload-label">
            {editingId
              ? 'Replace Photo (Optional)'
              : 'Select Photo'}
          </label>

          <input
            id="gallery-photo-input"
            type="file"
            accept="image/*"
            onChange={(e) =>
              setPhoto(e.target.files[0])
            }
            required={!editingId}
          />

          {photo && (
            <div className="upload-preview">

              <p>
                New Photo Preview:
              </p>

              <img
                src={URL.createObjectURL(photo)}
                alt="Preview"
              />

            </div>
          )}

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
                : '📸 Upload Photo'}
          </button>

          {editingId && (
            <button
              type="button"
              className="cancel-edit-btn"
              onClick={cancelEdit}
            >
              ✕ Cancel Edit
            </button>
          )}

        </form>

        {message && (
          <p className="upload-message">
            {message}
          </p>
        )}

      </div>


      {/* PHOTO LIST */}

      <div className="gallery-management">

        <p className="section-label">
          UPLOADED PHOTOS
        </p>

        <h2>
          Manage Gallery
        </h2>

        {loadingPhotos ? (

          <p className="gallery-admin-message">
            Loading photos...
          </p>

        ) : photos.length === 0 ? (

          <p className="gallery-admin-message">
            No photos uploaded yet.
          </p>

        ) : (

          <div className="admin-gallery-grid">

            {photos.map((photoItem) => (

              <div
                className="admin-gallery-card"
                key={photoItem.id}
              >

                <img
                  src={photoItem.image_url}
                  alt={
                    photoItem.title ||
                    'Gallery Photo'
                  }
                />

                <div className="admin-gallery-info">

                  <h3>
                    {photoItem.title ||
                      'Untitled Photo'}
                  </h3>

                  {photoItem.description && (
                    <p>
                      {photoItem.description}
                    </p>
                  )}

                  <div className="gallery-action-buttons">

                    <button
                      onClick={() =>
                        startEdit(photoItem)
                      }
                      className="edit-photo-btn"
                    >
                      ✏️ Edit
                    </button>

                    <button
                      onClick={() =>
                        handleDelete(photoItem)
                      }
                      className="delete-photo-btn"
                    >
                      🗑️ Delete
                    </button>

                  </div>

                </div>

              </div>

            ))}

          </div>

        )}

      </div>

    </div>
  )
}

export default GalleryAdmin
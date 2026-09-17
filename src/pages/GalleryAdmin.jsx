import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'


function GalleryAdmin() {

  const navigate = useNavigate()


  /* =====================================================
     FORM STATE
  ===================================================== */

  const [title, setTitle] =
    useState('')

  const [description, setDescription] =
    useState('')

  const [galleryYear, setGalleryYear] =
    useState(new Date().getFullYear())

  const [photo, setPhoto] =
    useState(null)


  /* =====================================================
     GALLERY STATE
  ===================================================== */

  const [photos, setPhotos] =
    useState([])

  const [loading, setLoading] =
    useState(false)

  const [loadingPhotos, setLoadingPhotos] =
    useState(true)

  const [message, setMessage] =
    useState('')


  /* =====================================================
     USER ROLE
  ===================================================== */

  const [userRole, setUserRole] =
    useState('')

  const [loadingRole, setLoadingRole] =
    useState(true)


  /* =====================================================
     EDIT STATE
  ===================================================== */

  const [editingId, setEditingId] =
    useState(null)


  /* =====================================================
     CURRENT YEAR
  ===================================================== */

  const currentYear =
    new Date().getFullYear()


  /* =====================================================
     YEARS
     2015 -> CURRENT YEAR
  ===================================================== */

  const years = Array.from(
    {
      length:
        currentYear - 2015 + 1,
    },
    (_, index) =>
      2015 + index
  ).reverse()


  /* =====================================================
     INITIAL LOAD
  ===================================================== */

  useEffect(() => {

    initializePage()

  }, [])


  /* =====================================================
     INITIALIZE PAGE
  ===================================================== */

  async function initializePage() {

    await loadUserRole()

    await fetchPhotos()

  }


  /* =====================================================
     LOAD USER ROLE
  ===================================================== */

  async function loadUserRole() {

    setLoadingRole(true)

    try {

      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser()


      if (
        userError ||
        !userData?.user
      ) {

        setUserRole('')

        return

      }


      const {
        data,
        error,
      } =
        await supabase
          .from('profiles')
          .select('role')
          .eq(
            'id',
            userData.user.id
          )
          .maybeSingle()


      if (error) {

        console.error(
          'ROLE LOAD ERROR:',
          error
        )

        setUserRole('')

        return

      }


      setUserRole(
        data?.role || ''
      )

    } catch (error) {

      console.error(
        'ROLE CHECK ERROR:',
        error
      )

      setUserRole('')

    } finally {

      setLoadingRole(false)

    }

  }


  /* =====================================================
     ROLE FLAGS
  ===================================================== */

  const isAdmin =
    userRole === 'admin'

  const isMember =
    userRole === 'member'

  const canUpload =
    isAdmin || isMember


  /* =====================================================
     LOAD GALLERY
  ===================================================== */

  async function fetchPhotos() {

    setLoadingPhotos(true)

    const {
      data,
      error,
    } =
      await supabase
        .from('gallery')
        .select('*')
        .order(
          'gallery_year',
          {
            ascending: false,
          }
        )
        .order(
          'created_at',
          {
            ascending: false,
          }
        )


    if (error) {

      console.error(
        'Gallery loading error:',
        error
      )

      setMessage(
        error.message
      )

    } else {

      setPhotos(
        data || []
      )

    }

    setLoadingPhotos(false)

  }


  /* =====================================================
     MEDIA TYPE
  ===================================================== */

  function getMediaType(file) {

    if (!file) {

      return 'image'

    }


    return file.type.startsWith(
      'video/'
    )
      ? 'video'
      : 'image'

  }


  /* =====================================================
     RESET FORM
  ===================================================== */

  function resetForm() {

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

  }


  /* =====================================================
     HANDLE FILE SELECT
  ===================================================== */

  function handleFileChange(e) {

    const selectedFile =
      e.target.files?.[0]


    if (!selectedFile) {

      setPhoto(null)

      return

    }


    /* =================================================
       ACCEPT IMAGE + VIDEO
    ================================================= */

    const isImage =
      selectedFile.type.startsWith(
        'image/'
      )

    const isVideo =
      selectedFile.type.startsWith(
        'video/'
      )


    if (
      !isImage &&
      !isVideo
    ) {

      setMessage(
        'Please select a valid image or video file.'
      )

      e.target.value = ''

      setPhoto(null)

      return

    }


    /* =================================================
       FREE SUPABASE SIZE CHECK
       50 MB maximum
    ================================================= */

    const maxSize =
      49 * 1024 * 1024


    if (
      selectedFile.size >
      maxSize
    ) {

      const sizeMB =
        (
          selectedFile.size /
          (1024 * 1024)
        ).toFixed(1)


      setMessage(
        `This file is ${sizeMB} MB. Please compress it below 49 MB before uploading.`
      )

      e.target.value = ''

      setPhoto(null)

      return

    }


    setMessage('')

    setPhoto(
      selectedFile
    )

  }


  /* =====================================================
     UPLOAD MEDIA
  ===================================================== */

  async function handleUpload(e) {

    e.preventDefault()


    if (!canUpload) {

      setMessage(
        'You do not have permission to upload gallery media.'
      )

      return

    }


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

      /* =================================================
         CHECK LOGIN
      ================================================= */

      const {
        data: userData,
        error: userError,
      } =
        await supabase.auth.getUser()


      if (
        userError ||
        !userData?.user
      ) {

        throw new Error(
          'Please login as a team member or admin first.'
        )

      }


      /* =================================================
         CHECK ROLE AGAIN
         IMPORTANT SECURITY CHECK
      ================================================= */

      const {
        data: profile,
        error: profileError,
      } =
        await supabase
          .from('profiles')
          .select('role')
          .eq(
            'id',
            userData.user.id
          )
          .maybeSingle()


      if (profileError) {

        throw profileError

      }


      const role =
        profile?.role


      if (
        role !== 'admin' &&
        role !== 'member'
      ) {

        throw new Error(
          'You do not have gallery upload permission.'
        )

      }


      /* =================================================
         MEDIA TYPE
      ================================================= */

      const mediaType =
        getMediaType(photo)


      /* =================================================
         FILE EXTENSION
      ================================================= */

      const fileExt =
        photo.name
          .split('.')
          .pop()
          ?.toLowerCase() ||
        'file'


      /* =================================================
         UNIQUE FILE NAME
      ================================================= */

      const fileName =
        `${Date.now()}-${Math.random()
          .toString(36)
          .substring(2)}.${fileExt}`


      /* =================================================
         UPLOAD STORAGE
      ================================================= */

      setMessage(
        mediaType === 'video'
          ? 'Uploading video... 🎥'
          : 'Uploading photo... 📸'
      )


      const {
        error: uploadError,
      } =
        await supabase.storage
          .from(
            'gallery-photos'
          )
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


      /* =================================================
         PUBLIC URL
      ================================================= */

      const {
        data: urlData,
      } =
        supabase.storage
          .from(
            'gallery-photos'
          )
          .getPublicUrl(
            fileName
          )


      if (
        !urlData?.publicUrl
      ) {

        /* REMOVE STORAGE FILE */

        await supabase.storage
          .from(
            'gallery-photos'
          )
          .remove([
            fileName,
          ])


        throw new Error(
          'Unable to create media URL.'
        )

      }


      /* =================================================
         SAVE DATABASE
      ================================================= */

      const {
        error: insertError,
      } =
        await supabase
          .from('gallery')
          .insert({

            image_url:
              urlData.publicUrl,

            title:
              title.trim(),

            description:
              description.trim(),

            uploaded_by:
              userData.user.id,

            media_type:
              mediaType,

            gallery_year:
              Number(
                galleryYear
              ),

          })


      /* =================================================
         DATABASE FAILED
      ================================================= */

      if (insertError) {

        await supabase.storage
          .from(
            'gallery-photos'
          )
          .remove([
            fileName,
          ])


        throw insertError

      }


      /* =================================================
         SUCCESS
      ================================================= */

      setMessage(
        mediaType === 'video'
          ? `Video added to ${galleryYear} gallery successfully! 🎥🎉`
          : `Photo added to ${galleryYear} gallery successfully! 📸🎉`
      )


      resetForm()

      await fetchPhotos()


    } catch (error) {

      console.error(
        'Upload error:',
        error
      )


      setMessage(
        error?.message ||
        'Upload failed. Please try again.'
      )

    }


    setLoading(false)

  }


  /* =====================================================
     START EDIT
     ADMIN ONLY
  ===================================================== */

  function startEdit(mediaItem) {

    if (!isAdmin) {

      setMessage(
        'Only admins can edit gallery media.'
      )

      return

    }


    setEditingId(
      mediaItem.id
    )


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


  /* =====================================================
     CANCEL EDIT
  ===================================================== */

  function cancelEdit() {

    resetForm()

    setMessage('')

  }


  /* =====================================================
     UPDATE MEDIA
     ADMIN ONLY
  ===================================================== */

  async function handleUpdate(e) {

    e.preventDefault()


    if (!isAdmin) {

      setMessage(
        'Only admins can update gallery media.'
      )

      return

    }


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


      let newFileName =
        null


      /* =================================================
         REPLACE FILE
      ================================================= */

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


        newFileName =
          fileName


        const {
          error: uploadError,
        } =
          await supabase.storage
            .from(
              'gallery-photos'
            )
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
        } =
          supabase.storage
            .from(
              'gallery-photos'
            )
            .getPublicUrl(
              fileName
            )


        if (
          !urlData?.publicUrl
        ) {

          await supabase.storage
            .from(
              'gallery-photos'
            )
            .remove([
              fileName,
            ])


          throw new Error(
            'Unable to create new media URL.'
          )

        }


        mediaUrl =
          urlData.publicUrl

      }


      /* =================================================
         UPDATE DATABASE
      ================================================= */

      const {
        error: updateError,
      } =
        await supabase
          .from('gallery')
          .update({

            title:
              title.trim(),

            description:
              description.trim(),

            image_url:
              mediaUrl,

            media_type:
              mediaType,

            gallery_year:
              Number(
                galleryYear
              ),

          })
          .eq(
            'id',
            editingId
          )


      if (updateError) {

        /* Remove newly uploaded file */

        if (newFileName) {

          await supabase.storage
            .from(
              'gallery-photos'
            )
            .remove([
              newFileName,
            ])

        }


        throw updateError

      }


      /* =================================================
         DELETE OLD FILE
      ================================================= */

      if (
        newFileName &&
        currentMedia.image_url
      ) {

        const oldFileName =
          currentMedia.image_url
            .split(
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


      setMessage(
        `Gallery media updated successfully! ✅`
      )


      resetForm()

      await fetchPhotos()


    } catch (error) {

      console.error(
        'Update error:',
        error
      )


      setMessage(
        error?.message ||
        'Update failed.'
      )

    }


    setLoading(false)

  }


  /* =====================================================
     DELETE MEDIA
     ADMIN ONLY
  ===================================================== */

  async function handleDelete(
    mediaItem
  ) {

    if (!isAdmin) {

      setMessage(
        'Only admins can delete gallery media.'
      )

      return

    }


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


      /* =================================================
         DELETE DATABASE FIRST
      ================================================= */

      const {
        error: deleteError,
      } =
        await supabase
          .from('gallery')
          .delete()
          .eq(
            'id',
            mediaItem.id
          )


      if (deleteError) {

        throw deleteError

      }


      /* =================================================
         DELETE STORAGE FILE
      ================================================= */

      const fileName =
        mediaItem.image_url
          ?.split(
            '/gallery-photos/'
          )[1]


      if (fileName) {

        const {
          error: storageError,
        } =
          await supabase.storage
            .from(
              'gallery-photos'
            )
            .remove([
              fileName,
            ])


        if (storageError) {

          console.warn(
            'Storage delete warning:',
            storageError
          )

        }

      }


      setMessage(
        'Media deleted successfully! 🗑️'
      )


      await fetchPhotos()


    } catch (error) {

      console.error(
        'Delete error:',
        error
      )


      setMessage(
        error?.message ||
        'Delete failed.'
      )

    }

  }


  /* =====================================================
     PREVIEW
  ===================================================== */

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
            ? '🎥 New Video Preview:'
            : '📸 New Photo Preview:'}

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


        <p
          style={{
            color: '#aaa',
            fontSize: '14px',
          }}
        >

          {photo.name}

          {' • '}

          {(
            photo.size /
            (1024 * 1024)
          ).toFixed(1)}

          {' MB'}

        </p>

      </div>

    )

  }


  /* =====================================================
     MEDIA CARD
  ===================================================== */

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


  /* =====================================================
     ROLE LOADING
  ===================================================== */

  if (loadingRole) {

    return (

      <div className="admin-dashboard">

        <div className="admin-header">

          <div>

            <p className="section-label">
              GALLERY
            </p>

            <h1>
              Checking access...
            </h1>

          </div>

        </div>

      </div>

    )

  }


  /* =====================================================
     ACCESS DENIED
  ===================================================== */

  if (!canUpload) {

    return (

      <div className="admin-dashboard">

        <div className="admin-upload-card">

          <p className="section-label">
            ACCESS DENIED
          </p>


          <h2>
            🔒 Gallery Upload Access
          </h2>


          <p
            style={{
              color: '#aaa',
              marginBottom: '25px',
            }}
          >

            Please login with a registered
            team member or admin account
            to upload gallery media.

          </p>


          <button
            onClick={() =>
              navigate('/login')
            }
            className="primary-btn"
          >
            🔐 Login
          </button>

        </div>

      </div>

    )

  }


  /* =====================================================
     PAGE
  ===================================================== */

  return (

    <div className="admin-dashboard">


      {/* =================================================
          HEADER
      ================================================= */}

      <div className="admin-header">


        <div>

          <p className="section-label">

            {isAdmin
              ? 'ADMIN PANEL'
              : 'TEAM MEMBER'}

          </p>


          <h1>

            {isAdmin
              ? 'Gallery Management'
              : 'Gallery Upload'}

          </h1>


          <p>

            {isAdmin
              ? 'Upload and manage organization photos and videos.'
              : 'Add photos and videos to the organization gallery.'}

          </p>

        </div>


        <div
          style={{
            display: 'flex',
            gap: '10px',
            flexWrap: 'wrap',
          }}
        >


          {/* =================================================
              ADMIN DASHBOARD
          ================================================= */}

          {isAdmin && (

            <button
              onClick={() =>
                navigate('/admin')
              }
              className="admin-logout-btn"
            >
              ← Dashboard
            </button>

          )}


          {/* =================================================
              BACK TO GALLERY
          ================================================= */}

          <button
            onClick={() =>
              navigate('/gallery')
            }
            className="admin-logout-btn"
          >
            🖼️ Gallery
          </button>

        </div>

      </div>



      {/* =====================================================
          UPLOAD / EDIT CARD
      ===================================================== */}

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


        {!isAdmin && (

          <p
            style={{
              color: '#aaa',
              marginBottom: '20px',
            }}
          >

            👤 You are logged in as a
            team member. You can upload
            photos and videos, but only
            admins can edit or delete media.

          </p>

        )}


        <form
          onSubmit={
            editingId
              ? handleUpdate
              : handleUpload
          }
          className="login-form"
        >


          {/* =================================================
              TITLE
          ================================================= */}

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



          {/* =================================================
              DESCRIPTION
          ================================================= */}

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



          {/* =================================================
              YEAR
          ================================================= */}

          <label className="upload-label">

            📅 Select Gallery Year

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



          {/* =================================================
              FILE
          ================================================= */}

          <label className="upload-label">

            {editingId
              ? 'Replace Photo / Video (Optional)'
              : '📸 Select Photo or 🎥 Video'}

          </label>


          <input
            id="gallery-photo-input"
            type="file"
            accept="image/*,video/*"
            onChange={
              handleFileChange
            }
            required={
              !editingId
            }
          />


          {/* =================================================
              FILE SIZE INFORMATION
          ================================================= */}

          {!editingId && (

            <p
              style={{
                color: '#999',
                fontSize: '13px',
                marginTop: '-8px',
              }}
            >

              Supported: JPG, PNG, JPEG,
              MP4, MOV, WebM and other
              browser-supported formats.
              <br />

              Maximum file size:
              <strong>
                {' '}49 MB
              </strong>

            </p>

          )}



          {/* =================================================
              PREVIEW
          ================================================= */}

          {renderPreview()}



          {/* =================================================
              UPLOAD BUTTON
          ================================================= */}

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
                : '📤 Upload Photo / Video'}

          </button>



          {/* =================================================
              CANCEL EDIT
          ================================================= */}

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



        {/* =================================================
            MESSAGE
        ================================================= */}

        {message && (

          <p className="upload-message">

            {message}

          </p>

        )}

      </div>



      {/* =====================================================
          GALLERY MANAGEMENT
      ===================================================== */}

      <div className="gallery-management">


        <p className="section-label">

          {isAdmin
            ? 'UPLOADED MEDIA'
            : 'RECENT GALLERY MEDIA'}

        </p>


        <h2>

          {isAdmin
            ? 'Manage Gallery'
            : 'Gallery Media'}

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


                  {/* =================================================
                      MEDIA
                  ================================================= */}

                  {renderMedia(
                    mediaItem
                  )}



                  {/* =================================================
                      INFO
                  ================================================= */}

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



                    {/* =================================================
                        ADMIN ACTIONS ONLY
                    ================================================= */}

                    {isAdmin && (

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

                    )}


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
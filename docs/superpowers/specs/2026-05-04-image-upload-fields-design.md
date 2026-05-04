# Image Upload Fields Design

**Date:** 2026-05-04
**Status:** Approved design, pending implementation plan
**Scope:** Replace image URL/path entry with upload-first image fields across current admin forms and establish the same policy for future vendor/mobile forms.

## Background

S-Loco stores image references as URL strings in existing database fields such as vendor logo, vendor cover image, service images, content cover image, and user avatar. The backend already has a simple admin upload endpoint and S3-compatible media service for vendor/service onboarding images.

Current admin coverage is inconsistent: vendor logo, vendor cover, and service images already upload to the server, but some forms still expose raw image URL/path inputs, such as content article cover images. Future vendor/mobile forms should not ask users to manually paste image paths.

## Goals

- Replace visible image URL/path inputs with upload-first image controls.
- Upload immediately when the user selects a file.
- Store the returned server URL in the existing form field and existing database column.
- Reuse one admin upload component pattern instead of duplicating upload logic per form.
- Keep an admin-only advanced URL fallback for seeded data, imports, and emergency corrections.
- Extend upload purposes for current and near-future image domains.
- Keep v1 simple: no crop, compression, image editing, media library, or object cleanup workflow.

## Non-Goals

- Add a media asset table.
- Build a reusable media library or asset picker.
- Delete unused uploaded objects when a form is cancelled.
- Add crop, resize, compression, or aspect-ratio enforcement.
- Replace existing database URL fields with foreign keys.
- Implement native/mobile UI in this task; this design only defines the policy and backend contract they should follow.

## Recommended Approach

Use a centralized reusable upload field plus the existing shared upload API contract.

The backend continues returning a final public URL. Forms continue saving that URL into the existing payload shape. Admin UI gets reusable upload field components for single-image and multi-image use cases. Future vendor/mobile clients should call the same upload contract or a compatible endpoint and save the same final URL fields.

This approach is smaller than a full media library and safer than patching each form independently.

## Product Behavior

For any image field in an admin form:

1. The normal control is an image uploader, not a text URL/path input.
2. Selecting a file immediately uploads it to the server.
3. After upload succeeds, the returned URL is written into form state.
4. The field shows the current image preview if a URL exists.
5. The user can replace the image by selecting another file.
6. Optional image fields can be cleared with a remove action.
7. Upload/loading/error states are shown at the field level.
8. Saving is disabled or blocked while upload is in progress.
9. A collapsed advanced admin-only URL input remains available for transition/import/emergency use.

Current admin targets:

- Vendor logo.
- Vendor cover image.
- Service image gallery.
- Content article cover image.

Future/native/mobile policy:

- Future vendor/mobile forms must not ask normal users to paste image paths.
- They should use upload-first behavior and save the returned URL into the same API fields.
- If mobile later needs a different upload mechanism, such as presigned upload, the final response contract should remain compatible with `{ key, url, contentType, size }`.

## Backend/API Design

Keep the existing authenticated admin endpoint:

- `POST /admin/uploads`
- Request: `multipart/form-data`
  - `file`: image file
  - `purpose`: controlled upload purpose
- Response:
  - `key`: storage object key
  - `url`: public URL saved by forms
  - `contentType`: uploaded MIME type
  - `size`: uploaded file size in bytes

Existing upload purposes:

- `vendor_logo`
- `vendor_cover`
- `service_image`

Add upload purposes:

- `content_cover`
- `user_avatar`

Avoid adding an unrestricted `generic` purpose in v1. Purpose names should stay domain-specific so object keys remain understandable and validation stays constrained.

## Storage and Validation

Validation remains server-enforced:

- Allowed file types: JPG, PNG, WebP, GIF.
- Max file size: 5MB.
- Unknown upload purposes are rejected.
- Object key pattern remains `purpose/owner/random-id.extension`.
- Public URL comes from the configured object storage public base URL.

The frontend may pre-check file type/size for faster feedback, but backend validation is authoritative.

## Frontend Component Design

### `ImageUploadField`

Use for single-image fields such as vendor logo, vendor cover image, content cover image, and user avatar.

Responsibilities:

- Render label, helper text, preview, upload/replace action, remove action, upload progress/loading state, and error text.
- Accept the current URL value and emit URL changes to the parent form.
- Upload immediately on file selection using the configured purpose.
- Preserve the old URL if upload fails.
- Provide a collapsed advanced URL input for admin fallback.

Expected props:

- `label`
- `value`
- `purpose`
- `required`
- `disabled`
- `helperText`
- `onChange(url)`
- `onUploadingChange(isUploading)`

### `MultiImageUploadField`

Use for image lists such as service galleries.

Responsibilities:

- Render existing image previews.
- Upload added image files immediately.
- Append successful uploads to the URL list.
- Remove optional images from the list.
- Emit `string[]` to the parent form.
- Provide advanced paste URL fallback for admin migration/import use.

Reordering can be included only if it stays simple. If it adds complexity, preserve current order and defer drag/drop sorting.

## Form Integration

### Vendor form

- Replace visible vendor logo URL input with `ImageUploadField` using `vendor_logo`.
- Replace visible vendor cover URL input with `ImageUploadField` using `vendor_cover`.
- Continue submitting `logo_url` and `cover_image_url` in existing payloads.

### Service form

- Replace visible textarea of image URLs with `MultiImageUploadField` using `service_image`.
- Continue submitting `images: string[]` to the existing service APIs.
- Existing saved URLs render as previews on edit.

### Content article form

- Replace `Ảnh bìa (URL)` with `ImageUploadField` using `content_cover`.
- Continue saving the returned URL into the content cover field used by the API.
- Existing article cover image renders as a preview on edit.

### User avatar fields

- When admin/user profile forms expose avatar editing, use `ImageUploadField` with `user_avatar`.
- This is part of the shared policy even if no current avatar form is implemented in the first pass.

## Error Handling

Field-level errors should use clear Vietnamese messages:

- Invalid type: `Chỉ hỗ trợ ảnh JPG, PNG, WebP hoặc GIF.`
- Too large: `Ảnh không được vượt quá 5MB.`
- Missing file: `Vui lòng chọn ảnh.`
- Unknown purpose: `Mục đích upload không hợp lệ.`
- Storage not configured: show a friendly admin-facing message that storage is not configured, without exposing stack traces.
- Network/upload failure: keep the existing value unchanged and let the user retry.

Submit behavior:

- If any upload field is uploading, disable save or block submit with a clear message.
- If upload fails, do not clear the previous URL automatically.
- Removing an image clears the form value but does not delete the object from storage in v1.

## Data Flow

1. Form loads existing URL or URL list from API data.
2. Upload component renders preview(s).
3. User selects image file(s).
4. Frontend posts `multipart/form-data` to `POST /admin/uploads`.
5. Backend validates and stores the object.
6. Backend returns `{ key, url, contentType, size }`.
7. Frontend writes `url` into form state.
8. User saves the form.
9. Existing create/update API stores URL string(s) in existing database fields.
10. Reloading the form shows saved URLs as previews.

## Accepted Tradeoffs

- Immediate upload can create orphaned objects if the user cancels the form. This is acceptable for v1 because it keeps the UX simple and matches current behavior.
- Existing URL columns remain the source of truth. This avoids a migration and keeps read APIs unchanged.
- Advanced URL fallback remains available to admins, but normal users should experience upload-first flows.

## Verification Plan

Backend tests:

- Reject unsupported file type.
- Reject oversized files.
- Reject unknown purpose.
- Accept `content_cover` purpose.
- Accept `user_avatar` purpose.
- Return `key`, `url`, `contentType`, and `size` for successful uploads.

Frontend tests:

- `ImageUploadField` uploads immediately on file selection.
- `ImageUploadField` previews the returned URL after success.
- `ImageUploadField` keeps the old value after upload failure.
- Advanced URL fallback updates the value.
- Remove clears optional single-image value.
- `MultiImageUploadField` appends uploaded image URLs.
- `MultiImageUploadField` removes selected image URLs.
- Content article form uses upload field instead of a plain visible URL input.

Manual verification:

- Admin can upload vendor logo.
- Admin can upload vendor cover image.
- Admin can upload service image(s).
- Admin can upload content article cover image.
- Each form saves the returned server URL correctly.
- Reloading each form shows saved image previews.
- Save is blocked or disabled while upload is in progress.

## Implementation Notes

- Keep changes surgical and focused on image upload fields.
- Prefer extracting shared admin UI components before modifying all forms.
- Do not introduce a media library, object deletion, or DB schema migration in this task.
- Match existing admin styling and API helper patterns.
- Existing backend upload service should be extended rather than replaced.

UPDATE vendors
SET owner_id = demo_owner.id
FROM users AS demo_owner
WHERE demo_owner.email = 'vendor@slocal.vn'
  AND vendors.slug = 'nha-hang-hai-san-bien-dong'
  AND NOT EXISTS (
    SELECT 1
    FROM vendors existing_vendor
    WHERE existing_vendor.owner_id = demo_owner.id
      AND existing_vendor.deleted_at IS NULL
  );

BEGIN;

DO $$
DECLARE
  demo_vendor_id UUID;
  demo_user_id UUID;
  demo_category_id UUID;
  demo_service_id UUID := '11111111-1111-4111-8111-111111111105';
BEGIN
  SELECT v.id
    INTO demo_vendor_id
  FROM vendors v
  INNER JOIN users owner ON owner.id = v.owner_id
  WHERE owner.email IN ('vendor1@slocal.vn', 'vendor@slocal.vn')
    AND v.deleted_at IS NULL
  ORDER BY
    CASE owner.email WHEN 'vendor1@slocal.vn' THEN 0 ELSE 1 END,
    CASE v.name WHEN 'Nhà Hàng Hải Sản Biển Đông' THEN 0 ELSE 1 END,
    v.created_at ASC
  LIMIT 1;

  SELECT id
    INTO demo_user_id
  FROM users
  WHERE role = 'tourist'
  ORDER BY
    CASE email WHEN 'tourist@slocal.vn' THEN 0 ELSE 1 END,
    created_at ASC
  LIMIT 1;

  SELECT id
    INTO demo_category_id
  FROM service_categories
  ORDER BY CASE slug WHEN 'am-thuc' THEN 0 ELSE 1 END, sort_order ASC, name ASC
  LIMIT 1;

  IF demo_vendor_id IS NULL OR demo_user_id IS NULL OR demo_category_id IS NULL THEN
    RAISE NOTICE 'Skipping demo reservation data because vendor, tourist, or category is missing.';
    RETURN;
  END IF;

  UPDATE vendors
  SET metadata = COALESCE(metadata, '{}'::jsonb) || jsonb_build_object('ipos_store_id', 'demo-ipos-store'),
      updated_at = now()
  WHERE id = demo_vendor_id
    AND COALESCE(metadata->>'ipos_store_id', '') = '';

  INSERT INTO services (
    id,
    vendor_id,
    category_id,
    name,
    slug,
    description,
    original_price,
    discount_price,
    discount_percent,
    fulfillment_type,
    reservation_discount_percent,
    duration_minutes,
    max_quantity_per_order,
    is_active,
    images,
    options,
    created_at,
    updated_at
  )
  VALUES (
    demo_service_id,
    demo_vendor_id,
    demo_category_id,
    'Đặt bàn hải sản ưu đãi iPos',
    'demo-dat-ban-hai-san-uu-dai-ipos',
    'Khách đặt chỗ trước, nhà hàng xác nhận và phát hành mã giảm giá iPos dùng tại quầy.',
    0,
    NULL,
    NULL,
    'reservation',
    10.00,
    90,
    1,
    true,
    '[]'::jsonb,
    jsonb_build_object('source', 'demo_reservation_migration'),
    now(),
    now()
  )
  ON CONFLICT (id) DO UPDATE SET
    vendor_id = EXCLUDED.vendor_id,
    category_id = EXCLUDED.category_id,
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    original_price = EXCLUDED.original_price,
    discount_price = EXCLUDED.discount_price,
    discount_percent = EXCLUDED.discount_percent,
    fulfillment_type = EXCLUDED.fulfillment_type,
    reservation_discount_percent = EXCLUDED.reservation_discount_percent,
    duration_minutes = EXCLUDED.duration_minutes,
    max_quantity_per_order = EXCLUDED.max_quantity_per_order,
    is_active = EXCLUDED.is_active,
    options = EXCLUDED.options,
    updated_at = now();

  INSERT INTO reservations (
    id,
    user_id,
    vendor_id,
    service_id,
    customer_name,
    customer_phone,
    party_size,
    requested_time,
    customer_note,
    status,
    confirmed_at,
    used_at,
    created_at,
    updated_at
  )
  VALUES
    (
      '22222222-2222-4222-8222-222222222201',
      demo_user_id,
      demo_vendor_id,
      demo_service_id,
      'Trần Minh Anh',
      '0900000003',
      4,
      now() + interval '1 day',
      'Demo: khách mới gửi yêu cầu, vendor cần gọi xác nhận.',
      'requested',
      NULL,
      NULL,
      now() - interval '2 hours',
      now() - interval '2 hours'
    ),
    (
      '22222222-2222-4222-8222-222222222202',
      demo_user_id,
      demo_vendor_id,
      demo_service_id,
      'Trần Minh Anh',
      '0900000003',
      2,
      now() + interval '2 days',
      'Demo: đã xác nhận và đã phát hành mã iPos.',
      'voucher_issued',
      now() - interval '1 hour',
      NULL,
      now() - interval '3 hours',
      now() - interval '1 hour'
    ),
    (
      '22222222-2222-4222-8222-222222222203',
      demo_user_id,
      demo_vendor_id,
      demo_service_id,
      'Trần Minh Anh',
      '0900000003',
      3,
      now() - interval '1 day',
      'Demo: khách đã dùng mã tại quầy, iPos đã gửi webhook.',
      'used',
      now() - interval '2 days',
      now() - interval '1 day',
      now() - interval '3 days',
      now() - interval '1 day'
    )
  ON CONFLICT (id) DO UPDATE SET
    user_id = EXCLUDED.user_id,
    vendor_id = EXCLUDED.vendor_id,
    service_id = EXCLUDED.service_id,
    customer_name = EXCLUDED.customer_name,
    customer_phone = EXCLUDED.customer_phone,
    party_size = EXCLUDED.party_size,
    requested_time = EXCLUDED.requested_time,
    customer_note = EXCLUDED.customer_note,
    status = EXCLUDED.status,
    confirmed_at = EXCLUDED.confirmed_at,
    used_at = EXCLUDED.used_at,
    updated_at = EXCLUDED.updated_at;

  INSERT INTO reservation_discount_vouchers (
    id,
    reservation_id,
    vendor_id,
    user_id,
    discount_percent,
    ipos_voucher_code,
    ipos_voucher_id,
    status,
    issue_attempt_count,
    raw_issue_response,
    used_at,
    bill_amount,
    discount_amount,
    commission_amount,
    ipos_transaction_id,
    raw_used_webhook,
    created_at,
    updated_at
  )
  VALUES
    (
      '33333333-3333-4333-8333-333333333301',
      '22222222-2222-4222-8222-222222222202',
      demo_vendor_id,
      demo_user_id,
      10.00,
      'DEMO-IPOS-001',
      'demo-ipos-voucher-001',
      'active',
      1,
      jsonb_build_object('dry_run', true, 'code', 'DEMO-IPOS-001'),
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      NULL,
      now() - interval '1 hour',
      now() - interval '1 hour'
    ),
    (
      '33333333-3333-4333-8333-333333333302',
      '22222222-2222-4222-8222-222222222203',
      demo_vendor_id,
      demo_user_id,
      10.00,
      'DEMO-IPOS-002',
      'demo-ipos-voucher-002',
      'used',
      1,
      jsonb_build_object('dry_run', true, 'code', 'DEMO-IPOS-002'),
      now() - interval '1 day',
      1250000.00,
      125000.00,
      100000.00,
      'DEMO-TXN-002',
      jsonb_build_object('event', 'voucher.used', 'voucherCode', 'DEMO-IPOS-002', 'transactionId', 'DEMO-TXN-002', 'billAmount', 1250000),
      now() - interval '2 days',
      now() - interval '1 day'
    )
  ON CONFLICT (id) DO UPDATE SET
    vendor_id = EXCLUDED.vendor_id,
    user_id = EXCLUDED.user_id,
    discount_percent = EXCLUDED.discount_percent,
    ipos_voucher_code = EXCLUDED.ipos_voucher_code,
    ipos_voucher_id = EXCLUDED.ipos_voucher_id,
    status = EXCLUDED.status,
    issue_attempt_count = EXCLUDED.issue_attempt_count,
    raw_issue_response = EXCLUDED.raw_issue_response,
    used_at = EXCLUDED.used_at,
    bill_amount = EXCLUDED.bill_amount,
    discount_amount = EXCLUDED.discount_amount,
    commission_amount = EXCLUDED.commission_amount,
    ipos_transaction_id = EXCLUDED.ipos_transaction_id,
    raw_used_webhook = EXCLUDED.raw_used_webhook,
    updated_at = EXCLUDED.updated_at;

  INSERT INTO ipos_webhook_events (
    id,
    event_type,
    idempotency_key,
    reservation_voucher_id,
    ipos_voucher_code,
    ipos_transaction_id,
    payload,
    processed_at,
    processing_error,
    created_at
  )
  VALUES (
    '44444444-4444-4444-8444-444444444401',
    'voucher.used',
    'ipos:DEMO-TXN-002',
    '33333333-3333-4333-8333-333333333302',
    'DEMO-IPOS-002',
    'DEMO-TXN-002',
    jsonb_build_object('event', 'voucher.used', 'voucherCode', 'DEMO-IPOS-002', 'transactionId', 'DEMO-TXN-002', 'billAmount', 1250000),
    now() - interval '1 day',
    NULL,
    now() - interval '1 day'
  )
  ON CONFLICT (idempotency_key) DO UPDATE SET
    reservation_voucher_id = EXCLUDED.reservation_voucher_id,
    ipos_voucher_code = EXCLUDED.ipos_voucher_code,
    ipos_transaction_id = EXCLUDED.ipos_transaction_id,
    payload = EXCLUDED.payload,
    processed_at = EXCLUDED.processed_at,
    processing_error = EXCLUDED.processing_error;
END $$;

COMMIT;

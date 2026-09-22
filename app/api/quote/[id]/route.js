import { NextResponse } from 'next/server';
import { getQuoteRecord, updateQuoteSignature } from '@/app/lib/quoteStore';

export async function POST(request, context) {
  try {
    const params = await (context?.params || {});
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Quote ID missing' }, { status: 400 });
    }

    const { password } = await request.json();

    // Fetch quote record from resilient dual-layer store
    const record = await getQuoteRecord(id);

    if (!record) {
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
    }

    if (record.password && record.password !== String(password || '').trim()) {
      return NextResponse.json({ error: 'Invalid password' }, { status: 401 });
    }

    // Return the quote data
    return NextResponse.json({ quote: record.quote_data }, { status: 200 });

  } catch (err) {
    console.error('API Error [POST /api/quote/[id]]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(request, context) {
  try {
    const params = await (context?.params || {});
    const id = params?.id;
    if (!id) {
      return NextResponse.json({ error: 'Quote ID missing' }, { status: 400 });
    }

    const body = await request.json().catch(() => ({}));
    const { signatureImage, signedBy, signedAt } = body;

    if (!signatureImage || !signedBy) {
      return NextResponse.json({ error: 'Signature data missing' }, { status: 400 });
    }

    // Process digital signature update (enforces single-entry lock and dual-layer persistence)
    const result = await updateQuoteSignature(id, signatureImage, signedBy, signedAt);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status || 400 });
    }

    return NextResponse.json({ success: true, quote: result.quote }, { status: 200 });

  } catch (err) {
    console.error('API Error [PATCH /api/quote/[id]]:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

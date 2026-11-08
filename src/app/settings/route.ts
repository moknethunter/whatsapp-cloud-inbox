import { NextResponse } from 'next/server';
import { getInboxSettings, saveInboxSettings } from '@/lib/inbox-settings';

export async function GET() {
  try {
    const settings = await getInboxSettings();
    return NextResponse.json(settings);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const result = await saveInboxSettings({
      selectedPhoneNumberIds: Array.isArray(body.selectedPhoneNumberIds)
        ? body.selectedPhoneNumberIds
        : [],
      defaultPhoneNumberId: body.defaultPhoneNumberId,
    });
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 },
    );
  }
}

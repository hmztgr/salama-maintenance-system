import { NextRequest, NextResponse } from 'next/server';
import { adminAuth } from '@/lib/firebase/admin';

export async function POST(request: NextRequest) {
  try {
    const { uids } = await request.json();
    
    if (!uids || !Array.isArray(uids)) {
      return NextResponse.json(
        { error: 'Invalid request: uids array required' },
        { status: 400 }
      );
    }

    let deletedCount = 0;
    const errors: string[] = [];

    for (const uid of uids) {
      try {
        await adminAuth.deleteUser(uid);
        deletedCount++;
        console.log(`✅ Deleted auth user: ${uid}`);
      } catch (error) {
        console.error(`❌ Failed to delete auth user ${uid}:`, error);
        errors.push(`Failed to delete user ${uid}: ${error}`);
      }
    }

    return NextResponse.json({
      success: true,
      deletedCount,
      totalRequested: uids.length,
      errors: errors.length > 0 ? errors : undefined
    });

  } catch (error) {
    console.error('❌ API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
} 
import { NextResponse } from 'next/server';

const FALLBACK_STATS = {
  total: 312,
  doctorReplied: 295,
};

export const revalidate = 300;

export async function GET() {
  try {
    const response = await fetch('https://happydoctor.onrender.com/api/stats', {
      next: { revalidate },
    });

    if (!response.ok) {
      return NextResponse.json(FALLBACK_STATS);
    }

    const stats = await response.json();
    return NextResponse.json(stats);
  } catch (error) {
    console.error('[Homepage Stats Route Error]', error);
    return NextResponse.json(FALLBACK_STATS);
  }
}

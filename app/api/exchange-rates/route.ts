import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const response = await fetch('https://api.frankfurter.app/latest?from=USD', {
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Bloomer/1.0',
      },
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch exchange rates: ${response.status}`);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching exchange rates:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchange rates' },
      { status: 500 }
    );
  }
}
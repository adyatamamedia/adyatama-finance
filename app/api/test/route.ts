import { NextResponse } from 'next/server'

export async function GET() {
  try {
    return NextResponse.json({
      message: 'API is working',
      timestamp: new Date().toISOString(),
      env: process.env.DATABASE_URL ? 'Database URL found' : 'Database URL missing'
    })
  } catch (error) {
    return NextResponse.json(
      { error: 'Test failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
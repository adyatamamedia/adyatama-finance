import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/utils'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const key = searchParams.get('key')

    if (key) {
      const setting = await prisma.setting.findUnique({
        where: { key }
      })

      if (!setting) {
        return NextResponse.json(
          { error: 'Setting not found' },
          { status: 404 }
        )
      }

      return NextResponse.json({ key: setting.key, value: setting.value })
    }

    const settings = await prisma.setting.findMany({
      orderBy: {
        key: 'asc'
      }
    })

    const settingsObject = settings.reduce((acc: any, setting) => {
      acc[setting.key] = setting.value
      return acc
    }, {})

    return NextResponse.json(settingsObject)
  } catch (error) {
    console.error('Error fetching settings:', error)
    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { key, value, userId } = body

    if (!key) {
      return NextResponse.json(
        { error: 'Key is required' },
        { status: 400 }
      )
    }

    const setting = await prisma.setting.upsert({
      where: { key },
      update: {
        value: value || null,
        userId: userId ? parseInt(userId) : null,
      },
      create: {
        key,
        value: value || null,
        userId: userId ? parseInt(userId) : null,
      },
      select: {
        id: true,
        key: true,
        value: true,
        createdAt: true,
        updatedAt: true,
      }
    })

    return NextResponse.json(setting, { status: 201 })
  } catch (error) {
    console.error('Error creating/updating setting:', error)
    return NextResponse.json(
      { error: 'Failed to create/update setting' },
      { status: 500 }
    )
  }
}
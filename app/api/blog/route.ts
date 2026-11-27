import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import '@/models/User';
import {parsePositiveInt} from '@/lib/security';

// GET /api/blog - Get published blog posts (public)
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');
    const page = parsePositiveInt(searchParams.get('page'),1,100000);
    const limit = parsePositiveInt(searchParams.get('limit'),9,50);

    const filter: any = { status: 'published' };

    if (category) filter.category = category;
    if (tag) filter.tags = tag;
    if (search) {
      filter.$text = { $search: search.slice(0,200) };
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .select('-comments -likes')
        .populate('author', 'firstName lastName')
        .sort({ publishedAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      BlogPost.countDocuments(filter)
    ]);

    return NextResponse.json({
      success: true,
      posts,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
        limit
      }
    });
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts',  },
      { status: 500 }
    );
  }
}

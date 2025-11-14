import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';

// GET /api/blog/[slug] - Get single published blog post by slug (public)
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect();

    // Find and increment views in one operation
    const post = await BlogPost.findOneAndUpdate(
      { 
        slug: params.slug,
        status: 'published'
      },
      { $inc: { views: 1 } },
      { new: true } // Return updated document
    )
      .populate('author', 'firstName lastName')
      .populate('comments.user', 'firstName lastName')
      .lean();

    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      post
    });
  } catch (error: any) {
    console.error('Error fetching blog post:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog post', details: error.message },
      { status: 500 }
    );
  }
}

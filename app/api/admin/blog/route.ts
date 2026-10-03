import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import { requireRole } from '@/lib/auth';

function authErrorResponse(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  if (message.includes('Authentication')) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }
  if (message.includes('Insufficient permissions')) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  return null;
}

// GET /api/admin/blog - Get all blog posts (admin only)
export async function GET(request: NextRequest) {
  try {
    const user = await requireRole(request, ['admin', 'super-admin']);
    await dbConnect();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = Math.max(1, Number.parseInt(searchParams.get('page') || '1', 10) || 1);
    const limit = Math.min(100, Math.max(1, Number.parseInt(searchParams.get('limit') || '10', 10) || 10));

    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) filter.$text = { $search: search };

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .populate('author', 'name email')
        .sort({ createdAt: -1 })
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
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error fetching blog posts:', error);
    return NextResponse.json({ error: 'Failed to fetch blog posts' }, { status: 500 });
  }
}

// POST /api/admin/blog - Create new blog post (admin only)
export async function POST(request: NextRequest) {
  try {
    const user = await requireRole(request, ['admin', 'super-admin']);
    await dbConnect();

    const body = await request.json();
    const {
      title,
      excerpt,
      content,
      featuredImage,
      images,
      category,
      tags,
      status,
      metaTitle,
      metaDescription,
      metaKeywords
    } = body;

    if (!title || !excerpt || !content) {
      return NextResponse.json(
        { error: 'Title, excerpt, and content are required' },
        { status: 400 }
      );
    }

    const slug = String(title)
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    if (!slug) {
      return NextResponse.json({ error: 'Title cannot produce an empty slug' }, { status: 400 });
    }

    const existingPost = await BlogPost.findOne({ slug }).select('_id');
    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with a similar title already exists' },
        { status: 409 }
      );
    }

    const post = await BlogPost.create({
      title,
      slug,
      excerpt,
      content,
      author: user._id,
      featuredImage: featuredImage || '',
      images: Array.isArray(images) ? images : [],
      category: category || 'other',
      tags: Array.isArray(tags) ? tags : [],
      status: status || 'draft',
      metaTitle,
      metaDescription,
      metaKeywords: Array.isArray(metaKeywords) ? metaKeywords : []
    });

    const populatedPost = await BlogPost.findById(post._id)
      .populate('author', 'name email')
      .lean();

    return NextResponse.json(
      {
        success: true,
        post: populatedPost,
        message: 'Blog post created successfully'
      },
      { status: 201 }
    );
  } catch (error) {
    const authResponse = authErrorResponse(error);
    if (authResponse) return authResponse;

    console.error('Error creating blog post:', error);
    return NextResponse.json({ error: 'Failed to create blog post' }, { status: 500 });
  }
}

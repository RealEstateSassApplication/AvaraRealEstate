import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/admin/blog - Get all blog posts (admin only)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');

    const filter: any = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (search) {
      filter.$text = { $search: search };
    }

    const skip = (page - 1) * limit;

    const [posts, total] = await Promise.all([
      BlogPost.find(filter)
        .populate('author', 'firstName lastName email')
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
  } catch (error: any) {
    console.error('Error fetching blog posts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch blog posts', details: error.message },
      { status: 500 }
    );
  }
}

// POST /api/admin/blog - Create new blog post (admin only)
export async function POST(request: NextRequest) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    // Validation
    if (!title || !excerpt || !content) {
      return NextResponse.json(
        { error: 'Title, excerpt, and content are required' },
        { status: 400 }
      );
    }

    // Check for duplicate slug
    const slug = title
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');

    const existingPost = await BlogPost.findOne({ slug });
    if (existingPost) {
      return NextResponse.json(
        { error: 'A post with similar title already exists' },
        { status: 400 }
      );
    }

    const post = await BlogPost.create({
      title,
      slug,
      excerpt,
      content,
      author: user._id,
      featuredImage: featuredImage || '',
      images: images || [],
      category: category || 'other',
      tags: tags || [],
      status: status || 'draft',
      metaTitle,
      metaDescription,
      metaKeywords: metaKeywords || []
    });

    const populatedPost = await BlogPost.findById(post._id)
      .populate('author', 'firstName lastName email')
      .lean();

    return NextResponse.json({
      success: true,
      post: populatedPost,
      message: 'Blog post created successfully'
    }, { status: 201 });
  } catch (error: any) {
    console.error('Error creating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to create blog post', details: error.message },
      { status: 500 }
    );
  }
}

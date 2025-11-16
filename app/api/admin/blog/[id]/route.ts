import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import BlogPost from '@/models/BlogPost';
import User from '@/models/User';
import { getUserFromRequest } from '@/lib/auth';

// GET /api/admin/blog/[id] - Get single blog post (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await BlogPost.findById(params.id)
      .populate('author', 'firstName lastName email')
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

// PATCH /api/admin/blog/[id] - Update blog post (admin only)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await BlogPost.findById(params.id);
    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
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

    // Check for duplicate slug if title is changed
    if (title && title !== post.title) {
      const slug = title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/(^-|-$)/g, '');

      const existingPost = await BlogPost.findOne({ 
        slug, 
        _id: { $ne: params.id } 
      });

      if (existingPost) {
        return NextResponse.json(
          { error: 'A post with similar title already exists' },
          { status: 400 }
        );
      }

      post.title = title;
      post.slug = slug;
    }

    // Update fields
    if (excerpt !== undefined) post.excerpt = excerpt;
    if (content !== undefined) post.content = content;
    if (featuredImage !== undefined) post.featuredImage = featuredImage;
    if (images !== undefined) post.images = images;
    if (category !== undefined) post.category = category;
    if (tags !== undefined) post.tags = tags;
    if (status !== undefined) post.status = status;
    if (metaTitle !== undefined) post.metaTitle = metaTitle;
    if (metaDescription !== undefined) post.metaDescription = metaDescription;
    if (metaKeywords !== undefined) post.metaKeywords = metaKeywords;

    await post.save();

    const updatedPost = await BlogPost.findById(params.id)
      .populate('author', 'firstName lastName email')
      .lean();

    return NextResponse.json({
      success: true,
      post: updatedPost,
      message: 'Blog post updated successfully'
    });
  } catch (error: any) {
    console.error('Error updating blog post:', error);
    return NextResponse.json(
      { error: 'Failed to update blog post', details: error.message },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/blog/[id] - Delete blog post (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();

    const user = await getUserFromRequest(request);
    if (!user || user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const post = await BlogPost.findByIdAndDelete(params.id);

    if (!post) {
      return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      message: 'Blog post deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting blog post:', error);
    return NextResponse.json(
      { error: 'Failed to delete blog post', details: error.message },
      { status: 500 }
    );
  }
}

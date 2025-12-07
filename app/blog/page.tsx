'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Search,
  Calendar,
  User,
  Eye,
  ArrowRight,
  TrendingUp,
  Sparkles,
  BookOpen
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  author: {
    firstName: string;
    lastName: string;
  };
  featuredImage: string;
  category: string;
  views: number;
  publishedAt: Date;
}

export default function BlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  useEffect(() => {
    fetchPosts();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryFilter]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams();
      if (categoryFilter !== 'all') params.append('category', categoryFilter);

      const response = await fetch(`/api/blog?${params}`);
      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || errData.message || 'Failed to fetch posts');
      }

      const data = await response.json();
      setPosts(data.posts || []);
    } catch (error: any) {
      console.error('Error fetching posts:', error);
      setError(error.message || 'Failed to load blog posts');
    } finally {
      setLoading(false);
    }
  };

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-teal-600"></div>
          <p className="text-gray-500 animate-pulse">Loading articles...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50/50">
      {/* Modern Hero Section with Mesh Gradient */}
      <div className="relative overflow-hidden bg-white">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-teal-100/50 via-blue-50/30 to-transparent opacity-70"></div>
        <div className="relative max-w-7xl mx-auto px-6 py-24 sm:py-32">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <Badge variant="secondary" className="bg-teal-50 text-teal-700 hover:bg-teal-100 transition-colors px-4 py-1.5 rounded-full text-sm font-medium border border-teal-100 mb-4">
              <Sparkles className="w-3.5 h-3.5 mr-2 inline-block" />
              Discover Insights
            </Badge>
            <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight text-gray-900 leading-[1.1]">
              The Avara <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-blue-600">Journal</span>
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed font-light">
              Expert advice, market analysis, and the latest trends in Sri Lankan real estate.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-12 -mt-10 relative z-10">
        {/* Modern Filter Bar */}
        <div className="bg-white/80 backdrop-blur-xl border border-white/20 shadow-xl rounded-2xl p-4 mb-12">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search articles..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 bg-white/50 border-gray-200 focus:bg-white transition-all h-12 text-base rounded-xl"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-full md:w-64 h-12 rounded-xl border-gray-200 bg-white/50 focus:bg-white">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="real-estate-tips">Real Estate Tips</SelectItem>
                <SelectItem value="market-trends">Market Trends</SelectItem>
                <SelectItem value="buying-guide">Buying Guide</SelectItem>
                <SelectItem value="selling-guide">Selling Guide</SelectItem>
                <SelectItem value="rental-advice">Rental Advice</SelectItem>
                <SelectItem value="investment">Investment</SelectItem>
                <SelectItem value="news">News</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Blog Posts Grid */}
        {filteredPosts.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-3xl border border-dashed border-gray-200">
            <BookOpen className="w-16 h-16 text-gray-200 mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-gray-900 mb-2">No articles found</h3>
            <p className="text-gray-500">We couldn't find any posts matching your search.</p>
            <Button variant="link" onClick={() => { setSearchTerm(''); setCategoryFilter('all'); }} className="mt-4 text-teal-600">
              Clear filters
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post, index) => (
              <Card
                key={post._id}
                className="group border-0 bg-white shadow-[0_2px_15px_-3px_rgba(0,0,0,0.07),0_10px_20px_-2px_rgba(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] transition-all duration-300 rounded-2xl overflow-hidden flex flex-col h-full"
              >
                <div className="relative aspect-[16/10] overflow-hidden">
                  {post.featuredImage ? (
                    <Image
                      src={post.featuredImage}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-teal-50 to-blue-50 flex items-center justify-center group-hover:bg-gradient-to-br group-hover:from-teal-100 group-hover:to-blue-100 transition-colors">
                      <Sparkles className="w-12 h-12 text-teal-200" />
                    </div>
                  )}
                  <div className="absolute top-4 left-4">
                    <Badge className="bg-white/90 backdrop-blur text-gray-800 hover:bg-white border-0 shadow-sm text-xs font-semibold px-2.5 py-0.5">
                      {post.category.replace('-', ' ')}
                    </Badge>
                  </div>
                </div>

                <CardContent className="flex flex-col flex-grow p-6">
                  <div className="flex items-center gap-3 text-sm text-gray-500 mb-4">
                    <div className="flex items-center gap-1.5">
                      <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-teal-500 to-blue-500 flex items-center justify-center text-[10px] text-white font-bold">
                        {post.author?.firstName ? post.author.firstName.charAt(0) : 'A'}
                      </div>
                      <span className="font-medium text-gray-700">{post.author?.firstName || 'Author'}</span>
                    </div>
                    <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>{formatDistanceToNow(new Date(post.publishedAt), { addSuffix: true })}</span>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2 leading-tight group-hover:text-teal-600 transition-colors">
                    <Link href={`/blog/${post.slug}`} className="before:absolute before:inset-0">
                      {post.title}
                    </Link>
                  </h3>

                  <p className="text-gray-600 mb-6 line-clamp-3 text-sm leading-relaxed flex-grow">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-6 border-t border-gray-100 mt-auto">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-gray-500">
                      <Eye className="w-3.5 h-3.5 text-gray-400" />
                      {post.views || 0} reads
                    </div>
                    <span className="text-teal-600 text-sm font-semibold flex items-center group-hover:translate-x-1 transition-transform">
                      Read Article <ArrowRight className="w-4 h-4 ml-1" />
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

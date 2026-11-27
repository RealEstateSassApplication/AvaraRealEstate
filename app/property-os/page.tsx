import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { propertyOSRepository } from '@/lib/discovery/content';

export const metadata: Metadata = { title:'Property Management OS',robots:{index:false,follow:false} };

export default function PropertyOSPage() {
  redirect(propertyOSRepository);
}

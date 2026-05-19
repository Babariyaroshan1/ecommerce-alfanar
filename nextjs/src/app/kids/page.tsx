import { Metadata } from 'next';
import KidsProductsClient from '@/components/KidsProductsClient';

export const metadata: Metadata = {
  title: 'Kids | AL-FANAR',
  description: 'Kids products',
};

export default function KidsPage() {
  return <KidsProductsClient />;
}

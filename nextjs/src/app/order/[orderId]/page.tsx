import OrderDetails from '@/components/OrderDetails';

interface OrderPageProps {
  params: Promise<{
    orderId: string;
  }>;
}

export default async function OrderPage({ params }: OrderPageProps) {
  const resolvedParams = await params;
  return <OrderDetails orderId={resolvedParams.orderId} />;
}

import { Metadata } from 'next';
import Addresses from '@/components/Addresses.jsx';

export const metadata: Metadata = {
    title: 'My Addresses | AL-FANAR',
    description: 'Manage your delivery addresses',
};

export default function AddressesPage() {
    return <Addresses />;
}

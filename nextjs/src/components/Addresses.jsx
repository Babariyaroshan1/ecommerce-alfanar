"use client";

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import './Addresses.css';

const EMPTY_ADDRESS = {
  name: '',
  phone: '',
  addressTitle: '',
  governorate: '',
  area: '',
  block: '',
  apartment: '',
  floor: '',
  jadda: '',
  street: '',
  houseNumber: '',
  city: '',
  state: '',
  pincode: ''
};

export default function Addresses() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [currentAddress, setCurrentAddress] = useState(EMPTY_ADDRESS);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile/addresses');
      return;
    }
    setSavedAddresses(Array.isArray(user.addresses) ? user.addresses : []);
  }, [user, router]);

  const buildBackendAddresses = (addresses) => {
    return addresses.map((address) => {
      const payload = {
        ...address,
        label: address.label || address.addressTitle || address.name || 'Address'
      };
      delete payload.id;
      if (address.id && /^[0-9a-fA-F]{24}$/.test(address.id)) {
        payload._id = address.id;
      }
      return payload;
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setCurrentAddress((prev) => ({ ...prev, [name]: value }));
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();

    if (!currentAddress.name || !currentAddress.phone || !currentAddress.street || !currentAddress.houseNumber) {
      setMessage('Please fill in Name, Phone, Street and House No.');
      return;
    }

    const id = currentAddress.id || `addr-${Date.now()}`;
    const nextAddresses = [...savedAddresses.filter((item) => item.id !== id), {
      ...currentAddress,
      id,
      label: currentAddress.addressTitle || currentAddress.name || 'Address'
    }];

    try {
      const backendAddresses = buildBackendAddresses(nextAddresses);
      const updatedUser = await updateProfile({ addresses: backendAddresses });
      setSavedAddresses(Array.isArray(updatedUser.addresses) ? updatedUser.addresses : nextAddresses);
      setMessage('Address saved successfully.');
      setCurrentAddress(EMPTY_ADDRESS);
    } catch (error) {
      console.error('Failed to save address:', error);
      setMessage('Unable to save address. Please try again.');
    }
  };

  const handleUseAddress = (address) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('selectedAddressId', address.id);
    }
    router.push(`/checkout?addressId=${address.id}`);
  };

  const handleDeleteAddress = async (id) => {
    const next = savedAddresses.filter((address) => address.id !== id);
    try {
      const backendAddresses = buildBackendAddresses(next);
      const updatedUser = await updateProfile({ addresses: backendAddresses });
      setSavedAddresses(Array.isArray(updatedUser.addresses) ? updatedUser.addresses : next);
      setMessage('Address deleted successfully.');
    } catch (error) {
      console.error('Failed to delete address:', error);
      setMessage('Unable to delete address. Please try again.');
    }
  };

  const handleNewAddress = () => {
    router.push('/checkout?showAddressForm=true');
  };

  return (
    <div className="container py-5 addresses-page">
      <div className="mb-4 d-flex flex-column flex-md-row align-items-start align-items-md-center justify-content-between gap-3">
        <div>
          <h1 className="h3 mb-2">My Addresses</h1>
          <p className="text-muted mb-0">Manage your saved addresses and open checkout with a saved address.</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={handleNewAddress}>
          <i className="fa-solid fa-plus me-2"></i>
          Add New Address
        </button>
      </div>

      {message && (
        <div className="alert alert-success" role="alert">
          {message}
        </div>
      )}

      <div className="addresses-grid">
        <div className="addresses-list">
          <div className="section-card">
            <div className="section-card-header">
              <h2>Saved Addresses</h2>
              <p className="text-muted mb-0">Use these addresses in checkout or delete them anytime.</p>
            </div>

            {savedAddresses.length === 0 ? (
              <div className="empty-address-card">
                <p>No saved addresses yet. Click Add New Address to open checkout address form.</p>
              </div>
            ) : (
              <div className="address-items">
                {savedAddresses.map((address) => (
                  <div key={address.id} className="address-card">
                    <div className="address-card-body">
                      <strong>{address.addressTitle || address.name || 'Address'}</strong>
                      <p className="address-line">
                        {address.street}, {address.houseNumber}{address.apartment ? `, Apt ${address.apartment}` : ''}{address.floor ? `, Floor ${address.floor}` : ''}
                      </p>
                      {(address.area || address.city || address.state || address.governorate || address.pincode) && (
                        <p className="address-line text-muted">
                          {[address.area, address.city, address.state, address.governorate, address.pincode].filter(Boolean).join(', ')}
                        </p>
                      )}
                      <p className="address-line text-muted">Phone: {address.phone}</p>
                    </div>
                    <div className="address-card-actions">
                      <button type="button" className="btn btn-sm btn-outline-primary" onClick={() => handleUseAddress(address)}>
                        Use in Checkout
                      </button>
                      <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => handleDeleteAddress(address.id)}>
                        Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="address-form-card section-card">
          <div className="section-card-header">
            <h2>Add Address</h2>
            <p className="text-muted mb-0">Save an address here, or open checkout to add a new address with the full checkout overlay.</p>
          </div>
          <form onSubmit={handleSaveAddress} className="address-form">
            <div className="form-group">
              <label>Full Name</label>
              <input type="text" name="name" value={currentAddress.name} onChange={handleChange} className="form-control" />
            </div>

            <div className="form-group">
              <label>Phone</label>
              <input type="text" name="phone" value={currentAddress.phone} onChange={handleChange} className="form-control" />
            </div>

            <div className="form-group">
              <label>Street</label>
              <input type="text" name="street" value={currentAddress.street} onChange={handleChange} className="form-control" />
            </div>

            <div className="form-group">
              <label>House Number</label>
              <input type="text" name="houseNumber" value={currentAddress.houseNumber} onChange={handleChange} className="form-control" />
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label>City</label>
                <input type="text" name="city" value={currentAddress.city} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group half-width">
                <label>State</label>
                <input type="text" name="state" value={currentAddress.state} onChange={handleChange} className="form-control" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label>Pincode</label>
                <input type="text" name="pincode" value={currentAddress.pincode} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group half-width">
                <label>Address Title</label>
                <input type="text" name="addressTitle" value={currentAddress.addressTitle} onChange={handleChange} className="form-control" placeholder="Home, Work" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label>Area</label>
                <input type="text" name="area" value={currentAddress.area} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group half-width">
                <label>Block</label>
                <input type="text" name="block" value={currentAddress.block} onChange={handleChange} className="form-control" />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group half-width">
                <label>Apartment</label>
                <input type="text" name="apartment" value={currentAddress.apartment} onChange={handleChange} className="form-control" />
              </div>
              <div className="form-group half-width">
                <label>Floor</label>
                <input type="text" name="floor" value={currentAddress.floor} onChange={handleChange} className="form-control" />
              </div>
            </div>

            <div className="form-group">
              <label>Jadda / Additional Details</label>
              <input type="text" name="jadda" value={currentAddress.jadda} onChange={handleChange} className="form-control" />
            </div>

            <button type="submit" className="btn btn-primary mt-2">
              Save Address
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

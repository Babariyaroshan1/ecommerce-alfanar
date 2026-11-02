'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store/authStore';
import AccountSidebar, { useAccountHydrated } from './AccountSidebar';
import './Addresses.css';

const EMPTY_ADDRESS = {
  name: '', phone: '', addressTitle: 'Home', governorate: '', area: '', block: '',
  apartment: '', floor: '', jadda: '', street: '', houseNumber: '', city: '',
  state: '', pincode: '', isDefault: false
};
const getId = (address) => String(address?.id ?? address?._id ?? '');
const createAddressId = () => `addr-${Date.now()}`;

export default function Addresses() {
  const router = useRouter();
  const { user, updateProfile } = useAuthStore();
  const hydrated = useAccountHydrated();
  const [savedAddresses, setSavedAddresses] = useState(() => Array.isArray(user?.addresses) ? user.addresses : []);
  const [currentAddress, setCurrentAddress] = useState(EMPTY_ADDRESS);
  const [editingId, setEditingId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [messageError, setMessageError] = useState(false);

  useEffect(() => {
    if (!user) {
      router.push('/login?redirect=/profile/addresses');
      return;
    }
  }, [user, router]);

  const buildBackendAddresses = (addresses) => addresses.map((address) => {
    const payload = { ...address, label: address.addressTitle || address.name || 'Address' };
    delete payload.id;
    if (address.id && /^[0-9a-fA-F]{24}$/.test(address.id)) payload._id = address.id;
    return payload;
  });

  const openNewAddress = () => {
    setCurrentAddress({ ...EMPTY_ADDRESS, isDefault: savedAddresses.length === 0 });
    setEditingId('');
    setMessage('');
    setModalOpen(true);
  };

  const openEditAddress = (address) => {
    setCurrentAddress({ ...EMPTY_ADDRESS, ...address, addressTitle: address.addressTitle || address.type || 'Home' });
    setEditingId(getId(address));
    setMessage('');
    setModalOpen(true);
  };

  const handleSaveAddress = async (event) => {
    event.preventDefault();
    setMessage('');
    setMessageError(false);
    const required = ['name', 'phone', 'street', 'houseNumber'];
    if (required.some((field) => !String(currentAddress[field] || '').trim())) {
      setMessage('Please complete your name, phone, building and street.');
      setMessageError(true);
      return;
    }

    const id = editingId || createAddressId();
    const updatedAddress = { ...currentAddress, id, label: currentAddress.addressTitle || 'Home' };
    let next = [...savedAddresses.filter((item) => getId(item) !== id), updatedAddress];
    if (updatedAddress.isDefault) {
      next = next.map((item) => ({ ...item, isDefault: getId(item) === id }));
    } else if (!next.some((item) => item.isDefault)) {
      next = next.map((item, index) => index === 0 ? { ...item, isDefault: true } : item);
    }

    setSaving(true);
    try {
      const updatedUser = await updateProfile({ addresses: buildBackendAddresses(next) });
      const normalized = Array.isArray(updatedUser.addresses) ? updatedUser.addresses : next;
      setSavedAddresses(normalized);
      setCurrentAddress(EMPTY_ADDRESS);
      setEditingId('');
      setModalOpen(false);
      setMessage(editingId ? 'Address updated successfully.' : 'Address added successfully.');
    } catch (error) {
      console.error('Failed to save address:', error);
      setMessage(error?.message || 'Unable to save this address. Please try again.');
      setMessageError(true);
    } finally {
      setSaving(false);
    }
  };

  const handleUseAddress = (address) => {
    localStorage.setItem('selectedAddressId', getId(address));
    router.push(`/checkout?addressId=${encodeURIComponent(getId(address))}`);
  };

  const handleDeleteAddress = async (address) => {
    const id = getId(address);
    const next = savedAddresses.filter((item) => getId(item) !== id);
    if (address.isDefault && next.length) next[0] = { ...next[0], isDefault: true };
    try {
      const updatedUser = await updateProfile({ addresses: buildBackendAddresses(next) });
      setSavedAddresses(Array.isArray(updatedUser.addresses) ? updatedUser.addresses : next);
      setMessage('Address deleted successfully.');
      setMessageError(false);
    } catch (error) {
      console.error('Failed to delete address:', error);
      setMessage(error?.message || 'Unable to delete this address. Please try again.');
      setMessageError(true);
    }
  };

  if (!hydrated || !user) return null;

  return (
    <main className="addresses-page account-page">
      <div className="account-page-layout">
        <AccountSidebar active="addresses" />
        <section className="addresses-main">
          <h1>Saved Address</h1>
          {message && <p className={`address-feedback ${messageError ? 'error' : 'success'}`} role="status">{message}</p>}
          <button type="button" className="address-add-bar" onClick={openNewAddress}>＋ Add New Address</button>
          {savedAddresses.length === 0 ? (
            <div className="empty-address-card">
              <h2>No saved addresses yet</h2>
              <p>Add a delivery address to make your next checkout faster.</p>
              <button type="button" onClick={openNewAddress}>Add New Address</button>
            </div>
          ) : (
            <div className="address-items">
              {savedAddresses.map((address) => (
                <article key={getId(address)} className="address-card">
                  <div className="address-card-body">
                    <div className="address-card-title">
                      <span className="address-check" aria-hidden="true">✓</span>
                      <strong>{address.name || 'Delivery address'}</strong>
                      <span className="address-type">{address.addressTitle || address.type || 'Home'}</span>
                      {address.isDefault && <span className="address-default-badge">Default</span>}
                    </div>
                    <p className="address-line">{[address.houseNumber, address.street, address.area, address.block, address.apartment, address.floor].filter(Boolean).join(', ')}</p>
                    <p className="address-line">{[address.city, address.state, address.governorate, address.pincode].filter(Boolean).join(', ')}</p>
                    <p className="address-line">Phone: {address.phone}</p>
                  </div>
                  <div className="address-card-actions">
                    <button type="button" onClick={() => handleUseAddress(address)}>Use in Checkout</button>
                    <button type="button" onClick={() => openEditAddress(address)}>Edit</button>
                    <button type="button" onClick={() => handleDeleteAddress(address)}>Delete</button>
                  </div>
                </article>
              ))}
            </div>
          )}
        </section>
      </div>

      {modalOpen && (
        <div className="address-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.target === event.currentTarget && !saving) setModalOpen(false);
        }}>
          <section className="address-modal" role="dialog" aria-modal="true" aria-labelledby="address-dialog-title">
            <header>
              <div>
                <button type="button" onClick={() => setModalOpen(false)} aria-label="Close address form">‹</button>
                <h2 id="address-dialog-title">{editingId ? 'Edit Address' : 'Add New Address'}</h2>
              </div>
              <button type="button" onClick={() => setModalOpen(false)} aria-label="Close address form">×</button>
            </header>
            <form className="address-form" onSubmit={handleSaveAddress}>
              <label>Flat / House / Building<input name="houseNumber" value={currentAddress.houseNumber} onChange={(event) => setCurrentAddress({ ...currentAddress, houseNumber: event.target.value })} required /></label>
              <label>Street / Locality<input name="street" value={currentAddress.street} onChange={(event) => setCurrentAddress({ ...currentAddress, street: event.target.value })} required /></label>
              <div className="address-form-row">
                <label>City<input name="city" value={currentAddress.city} onChange={(event) => setCurrentAddress({ ...currentAddress, city: event.target.value })} /></label>
                <label>State<input name="state" value={currentAddress.state} onChange={(event) => setCurrentAddress({ ...currentAddress, state: event.target.value })} /></label>
              </div>
              <div className="address-form-row">
                <label>Pincode<input name="pincode" inputMode="numeric" value={currentAddress.pincode} onChange={(event) => setCurrentAddress({ ...currentAddress, pincode: event.target.value })} /></label>
                <label>Area / District<input name="area" value={currentAddress.area} onChange={(event) => setCurrentAddress({ ...currentAddress, area: event.target.value })} /></label>
              </div>
              <fieldset className="address-contact-group">
                <legend>Contact Details</legend>
                <label>Full Name<input name="name" autoComplete="name" value={currentAddress.name} onChange={(event) => setCurrentAddress({ ...currentAddress, name: event.target.value })} required /></label>
                <label>Phone<input name="phone" type="tel" autoComplete="tel" value={currentAddress.phone} onChange={(event) => setCurrentAddress({ ...currentAddress, phone: event.target.value })} required /></label>
              </fieldset>
              <fieldset className="address-type-field">
                <legend>Save address as</legend>
                {['Home', 'Work'].map((type) => <label key={type}><input type="radio" name="addressTitle" value={type} checked={currentAddress.addressTitle === type} onChange={(event) => setCurrentAddress({ ...currentAddress, addressTitle: event.target.value })} /> {type}</label>)}
              </fieldset>
              <label className="address-default-choice"><input type="checkbox" checked={Boolean(currentAddress.isDefault)} onChange={(event) => setCurrentAddress({ ...currentAddress, isDefault: event.target.checked })} /> Make this my default address</label>
              {message && <p className="address-feedback error" role="alert">{message}</p>}
              <footer>
                <button type="button" onClick={() => setModalOpen(false)} disabled={saving}>Cancel</button>
                <button type="submit" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Update Address' : 'Save Address'}</button>
              </footer>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}

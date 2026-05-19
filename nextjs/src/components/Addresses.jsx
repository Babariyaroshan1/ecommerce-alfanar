// 'use client';

// import React, { useState, useEffect } from 'react';
// import { useRouter } from 'next/navigation';
// import axios from 'axios';
// import { useAuthStore } from '../store/authStore';
// import { useTranslation } from 'react-i18next';
// import './Addresses.css';

// const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api'; // Set in nextjs/.env.local for development and in Vercel env for production

// export default function Addresses() {
//     const { user, token } = useAuthStore();
//     const router = useRouter();
//     const { t } = useTranslation();
//     const [addresses, setAddresses] = useState([]);
//     const [loading, setLoading] = useState(true);
//     const [showForm, setShowForm] = useState(false);
//     const [editingId, setEditingId] = useState(null);
//     const [error, setError] = useState('');
//     const [success, setSuccess] = useState('');

//     const [formData, setFormData] = useState({
//         label: '',
//         houseNumber: '',
//         street: '',
//         city: '',
//         state: '',
//         pincode: '',
//         country: 'India',
//         phone: '',
//         isDefault: false
//     });

//     useEffect(() => {
//         if (!user || !token) {
//             router.push('/login');
//             return;
//         }
//         fetchAddresses();
//     }, [user, token, router]);

//     const fetchAddresses = async () => {
//         try {
//             setLoading(true);
//             const response = await axios.get(`${API_URL}/addresses`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });
//             setAddresses(response.data.addresses || []);
//             setError('');
//         } catch (err) {
//             setError(err.response?.data?.message || 'Failed to fetch addresses');
//             console.error('Error fetching addresses:', err);
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleChange = (e) => {
//         const { name, value, type, checked } = e.target;
//         setFormData(prev => ({
//             ...prev,
//             [name]: type === 'checkbox' ? checked : value
//         }));
//     };

//     const handleAddAddress = async (e) => {
//         e.preventDefault();
//         try {
//             setError('');
//             setSuccess('');

//             const response = await axios.post(`${API_URL}/addresses`, formData, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });

//             setAddresses([...addresses, response.data.address]);
//             setFormData({
//                 label: '',
//                 houseNumber: '',
//                 street: '',
//                 city: '',
//                 state: '',
//                 pincode: '',
//                 country: 'India',
//                 phone: '',
//                 isDefault: false
//             });
//             setShowForm(false);
//             setSuccess('Address added successfully!');
//             setTimeout(() => setSuccess(''), 3000);
//         } catch (err) {
//             setError(err.response?.data?.message || 'Failed to add address');
//         }
//     };

//     const handleUpdateAddress = async (e, addressId) => {
//         e.preventDefault();
//         try {
//             setError('');
//             setSuccess('');

//             const response = await axios.put(`${API_URL}/addresses/${addressId}`, formData, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });

//             setAddresses(addresses.map(addr => addr._id === addressId ? response.data.address : addr));
//             resetForm();
//             setSuccess('Address updated successfully!');
//             setTimeout(() => setSuccess(''), 3000);
//         } catch (err) {
//             setError(err.response?.data?.message || 'Failed to update address');
//         }
//     };

//     const handleDeleteAddress = async (addressId) => {
//         if (!window.confirm('Are you sure you want to delete this address?')) return;

//         try {
//             setError('');
//             setSuccess('');

//             await axios.delete(`${API_URL}/addresses/${addressId}`, {
//                 headers: { Authorization: `Bearer ${token}` }
//             });

//             setAddresses(addresses.filter(addr => addr._id !== addressId));
//             setSuccess('Address deleted successfully!');
//             setTimeout(() => setSuccess(''), 3000);
//         } catch (err) {
//             setError(err.response?.data?.message || 'Failed to delete address');
//         }
//     };

//     const handleSetDefault = async (addressId) => {
//         try {
//             setError('');
//             const response = await axios.post(
//                 `${API_URL}/addresses/${addressId}/set-default`,
//                 {},
//                 { headers: { Authorization: `Bearer ${token}` } }
//             );

//             setAddresses(addresses.map(addr => ({
//                 ...addr,
//                 isDefault: addr._id === addressId
//             })));
//         } catch (err) {
//             setError(err.response?.data?.message || 'Failed to set default address');
//         }
//     };

//     const handleEditAddress = (address) => {
//         setFormData({
//             label: address.label,
//             houseNumber: address.houseNumber,
//             street: address.street,
//             city: address.city,
//             state: address.state || '',
//             pincode: address.pincode,
//             country: address.country || 'India',
//             phone: address.phone,
//             isDefault: address.isDefault
//         });
//         setEditingId(address._id);
//         setShowForm(true);
//     };

//     const resetForm = () => {
//         setFormData({
//             label: '',
//             houseNumber: '',
//             street: '',
//             city: '',
//             state: '',
//             pincode: '',
//             country: 'India',
//             phone: '',
//             isDefault: false
//         });
//         setEditingId(null);
//         setShowForm(false);
//     };

//     if (loading) {
//         return <div className="container py-5 text-center"><p>{t("Loading")}...</p></div>;
//     }

//     return (
//         <div className="container py-5">
//             <div className="mb-4">
//                 <h1 className="h3 mb-4">📍 {t("My Addresses")}</h1>

//                 {error && <div className="alert alert-danger alert-dismissible fade show" role="alert">{error}<button type="button" className="btn-close" onClick={() => setError('')}></button></div>}
//                 {success && <div className="alert alert-success alert-dismissible fade show" role="alert">{success}<button type="button" className="btn-close" onClick={() => setSuccess('')}></button></div>}

//                 {!showForm && (
//                     <button 
//                         className="btn btn-primary mb-4" 
//                         onClick={() => setShowForm(true)}
//                     >
//                         ➕ {t("Add New Address")}
//                     </button>
//                 )}
//             </div>

//             {/* Address Form */}
//             {showForm && (
//                 <div className="card mb-4 border-0 shadow-sm">
//                     <div className="card-body">
//                         <h5 className="card-title mb-3">
//                             {editingId ? t("Edit Address") : t("Add New Address")}
//                         </h5>
//                         <form onSubmit={(e) => editingId ? handleUpdateAddress(e, editingId) : handleAddAddress(e)}>
//                             <div className="row">
//                                 <div className="col-md-6 mb-3">
//                                     <label className="form-label">{t("Address Label")} (e.g., Home, Office) *</label>
//                                     <input
//                                         type="text"
//                                         className="form-control"
//                                         name="label"
//                                         value={formData.label}
//                                         onChange={handleChange}
//                                         placeholder="Home"
//                                         required
//                                     />
//                                 </div>
//                                 <div className="col-md-6 mb-3">
//                                     <label className="form-label">{t("Phone Number")} *</label>
//                                     <input
//                                         type="tel"
//                                         className="form-control"
//                                         name="phone"
//                                         value={formData.phone}
//                                         onChange={handleChange}
//                                         placeholder="+965 XXXX XXXX"
//                                         required
//                                     />
//                                 </div>
//                             </div>

//                             <div className="row">
//                                 <div className="col-md-6 mb-3">
//                                     <label className="form-label">{t("House Number")} *</label>
//                                     <input
//                                         type="text"
//                                         className="form-control"
//                                         name="houseNumber"
//                                         value={formData.houseNumber}
//                                         onChange={handleChange}
//                                         placeholder="123"
//                                         required
//                                     />
//                                 </div>
//                                 <div className="col-md-6 mb-3">
//                                     <label className="form-label">{t("Street")} *</label>
//                                     <input
//                                         type="text"
//                                         className="form-control"
//                                         name="street"
//                                         value={formData.street}
//                                         onChange={handleChange}
//                                         placeholder="Main Street"
//                                         required
//                                     />
//                                 </div>
//                             </div>

//                             <div className="row">
//                                 <div className="col-md-4 mb-3">
//                                     <label className="form-label">{t("City")} *</label>
//                                     <input
//                                         type="text"
//                                         className="form-control"
//                                         name="city"
//                                         value={formData.city}
//                                         onChange={handleChange}
//                                         placeholder="Kuwait City"
//                                         required
//                                     />
//                                 </div>
//                                 <div className="col-md-4 mb-3">
//                                     <label className="form-label">{t("State/Area")}</label>
//                                     <input
//                                         type="text"
//                                         className="form-control"
//                                         name="state"
//                                         value={formData.state}
//                                         onChange={handleChange}
//                                         placeholder="Governorate"
//                                     />
//                                 </div>
//                                 <div className="col-md-4 mb-3">
//                                     <label className="form-label">{t("Postal Code")} *</label>
//                                     <input
//                                         type="text"
//                                         className="form-control"
//                                         name="pincode"
//                                         value={formData.pincode}
//                                         onChange={handleChange}
//                                         placeholder="12345"
//                                         required
//                                     />
//                                 </div>
//                             </div>

//                             <div className="row">
//                                 <div className="col-md-6 mb-3">
//                                     <label className="form-label">{t("Country")}</label>
//                                     <input
//                                         type="text"
//                                         className="form-control"
//                                         name="country"
//                                         value={formData.country}
//                                         onChange={handleChange}
//                                         placeholder="India"
//                                     />
//                                 </div>
//                                 <div className="col-md-6 mb-3">
//                                     <div className="form-check mt-4">
//                                         <input
//                                             type="checkbox"
//                                             className="form-check-input"
//                                             name="isDefault"
//                                             id="isDefault"
//                                             checked={formData.isDefault}
//                                             onChange={handleChange}
//                                         />
//                                         <label className="form-check-label" htmlFor="isDefault">
//                                             {t("Set as default address")}
//                                         </label>
//                                     </div>
//                                 </div>
//                             </div>

//                             <div className="d-flex gap-2">
//                                 <button type="submit" className="btn btn-primary">
//                                     {editingId ? t("Update Address") : t("Add Address")}
//                                 </button>
//                                 <button type="button" className="btn btn-secondary" onClick={resetForm}>
//                                     {t("Cancel")}
//                                 </button>
//                             </div>
//                         </form>
//                     </div>
//                 </div>
//             )}

//             {/* Addresses List */}
//             <div className="row">
//                 {addresses.length === 0 ? (
//                     <div className="col-12">
//                         <div className="alert alert-info text-center">{t("No addresses saved yet. Add your first address!")} ➕</div>
//                     </div>
//                 ) : (
//                     addresses.map(address => (
//                         <div key={address._id} className="col-md-6 col-lg-4 mb-3">
//                             <div className={`card address-card h-100 ${address.isDefault ? 'border-primary border-2' : ''}`}>
//                                 <div className="card-body">
//                                     <div className="d-flex justify-content-between align-items-start mb-2">
//                                         <h5 className="card-title mb-0">{address.label}</h5>
//                                         {address.isDefault && <span className="badge bg-primary">Default</span>}
//                                     </div>
//                                     <p className="card-text text-muted small mb-2">
//                                         {address.houseNumber}, {address.street}<br/>
//                                         {address.city}, {address.state} {address.pincode}<br/>
//                                         {address.country}
//                                     </p>
//                                     <p className="card-text text-muted small mb-3">
//                                         📞 {address.phone}
//                                     </p>
//                                     <div className="d-flex gap-2">
//                                         {!address.isDefault && (
//                                             <button
//                                                 className="btn btn-sm btn-outline-primary"
//                                                 onClick={() => handleSetDefault(address._id)}
//                                             >
//                                                 {t("Set Default")}
//                                             </button>
//                                         )}
//                                         <button
//                                             className="btn btn-sm btn-outline-secondary"
//                                             onClick={() => handleEditAddress(address)}
//                                         >
//                                             {t("Edit")}
//                                         </button>
//                                         <button
//                                             className="btn btn-sm btn-outline-danger"
//                                             onClick={() => handleDeleteAddress(address._id)}
//                                         >
//                                             {t("Delete")}
//                                         </button>
//                                     </div>
//                                 </div>
//                             </div>
//                         </div>
//                     ))
//                 )}
//             </div>
//         </div>
//     );
// }

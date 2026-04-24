import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const Payment = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const booking = location.state?.booking;
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  if (!booking) {
    navigate('/trains');
    return null;
  }

  const loadRazorpay = () =>
    new Promise((resolve) => {
      if (window.Razorpay) return resolve(true);
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  const handlePayment = async () => {
    setLoading(true);
    setError('');
    try {
      const loaded = await loadRazorpay();
      if (!loaded) throw new Error('Razorpay failed to load');

      const orderRes = await api.post('/payment/create-order', { amount: booking.fare });
      const order = orderRes.data;

      const options = {
        key: order.key,
        amount: order.amount,
        currency: order.currency,
        name: 'RailYatra',
        description: `Booking: ${booking.bookingId}`,
        order_id: order.id,
        handler: async (response) => {
          try {
            // Verify payment
            await api.post('/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });

            // Mark booking as paid
            await api.patch(`/bookings/${booking.bookingId}/pay`, {
              razorpayPaymentId: response.razorpay_payment_id,
              razorpayOrderId: response.razorpay_order_id,
            });

            navigate('/ticket-success', { state: { bookingId: booking.bookingId } });
          } catch (e) {
            setError('Payment verification failed. Contact support.');
          }
        },
        prefill: { name: booking.user?.username },
        theme: { color: '#1565c0' },
        modal: {
          ondismiss: () => setLoading(false),
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err.message || 'Payment failed');
      setLoading(false);
    }
  };

  // Demo: simulate payment without real Razorpay
  const handleDemoPayment = async () => {
    setLoading(true);
    setError('');
    try {
      await api.patch(`/bookings/${booking.bookingId}/pay`, {
        razorpayPaymentId: `demo_pay_${Date.now()}`,
        razorpayOrderId: `demo_order_${Date.now()}`,
      });
      navigate('/ticket-success', { state: { bookingId: booking.bookingId } });
    } catch (err) {
      setError(err.response?.data?.error || 'Payment failed');
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="payment-page">
            <div className="page-header">
              <h1>💳 Payment</h1>
            </div>

            <div className="card payment-card">
              <div style={{ fontSize: '3rem', marginBottom: '0.5rem' }}>🎫</div>
              <h2 style={{ color: 'var(--navy)' }}>Complete Your Booking</h2>

              <div className="payment-amount">
                <span>₹</span>{booking.fare.toFixed(2)}
              </div>

              <div className="payment-details">
                {[
                  ['Booking ID', booking.bookingId?.slice(0, 12) + '…'],
                  ['Train', booking.train?.trainName],
                  ['Route', `${booking.train?.source} → ${booking.train?.destination}`],
                  ['Seats', booking.seatNumbers?.join(', ')],
                  ['Passengers', `${booking.seatsBooked} seat(s)`],
                ].map(([label, value]) => (
                  <div key={label} className="summary-row" style={{ display: 'flex', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid var(--gray-200)', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-light)', fontWeight: 600 }}>{label}</span>
                    <span style={{ fontWeight: 700 }}>{value}</span>
                  </div>
                ))}
              </div>

              {error && <div className="alert alert-error">⚠ {error}</div>}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <button className="btn btn-primary btn-block btn-lg" onClick={handlePayment} disabled={loading}>
                  {loading ? 'Processing…' : '💳 Pay with Razorpay'}
                </button>
                <button className="btn btn-success btn-block" onClick={handleDemoPayment} disabled={loading}>
                  ✅ Demo Pay (Skip Razorpay)
                </button>
                <button className="btn btn-outline btn-block" onClick={() => navigate('/trains')} disabled={loading}>
                  ← Cancel & Go Back
                </button>
              </div>

              <p style={{ fontSize: '0.78rem', color: 'var(--text-light)', marginTop: '1rem', textAlign: 'center' }}>
                🔒 Payments secured by Razorpay. Use "Demo Pay" in development.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Payment;

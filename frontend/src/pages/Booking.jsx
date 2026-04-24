import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';

const SEATS_PER_ROW = 6;
const SEATS_PER_COACH = 60;
const ROW_LABELS = ['A', 'B', 'C', 'D', 'E', 'F'];

const Booking = () => {
  const { trainNo } = useParams();
  const navigate = useNavigate();
  const [train, setTrain] = useState(null);
  const [bookedSeats, setBookedSeats] = useState([]);
  const [selectedSeats, setSelectedSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get(`/trains/${trainNo}`)
      .then((res) => {
        setTrain(res.data.train);
        setBookedSeats(res.data.bookedSeats);
      })
      .catch(() => navigate('/trains'))
      .finally(() => setLoading(false));
  }, [trainNo, navigate]);

  const toggleSeat = (seatId) => {
    if (bookedSeats.includes(seatId)) return;
    setSelectedSeats((prev) =>
      prev.includes(seatId)
        ? prev.filter((s) => s !== seatId)
        : prev.length < 4
        ? [...prev, seatId]
        : prev
    );
  };

  const handleBook = async () => {
    if (selectedSeats.length === 0) return setError('Please select at least one seat');
    setSubmitting(true);
    setError('');
    try {
      const res = await api.post('/bookings', { trainNo: Number(trainNo), selectedSeats });
      navigate('/payment', { state: { booking: res.data } });
    } catch (err) {
      setError(err.response?.data?.error || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return (
    <div className="page"><Navbar /><div className="spinner-page"><div className="spinner" /></div></div>
  );

  if (!train) return null;

  const numCoaches = train.numberOfCoaches;

  return (
    <div className="page">
      <Navbar />
      <main className="main-content">
        <div className="container">
          <div className="page-header">
            <div className="page-header-inner">
              <div>
                <h1>Select Seats</h1>
                <p style={{ color: 'var(--text-light)', marginTop: '0.25rem' }}>
                  {train.trainName} &nbsp;|&nbsp; {train.source} → {train.destination}
                </p>
              </div>
              <button className="btn btn-outline" onClick={() => navigate('/trains')}>← Back</button>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'flex-start', flexWrap: 'wrap' }}>
            {/* Seat Map */}
            <div style={{ flex: '1 1 500px' }}>
              <div className="seat-legend">
                <div className="legend-item"><div className="legend-dot available" /> Available</div>
                <div className="legend-item"><div className="legend-dot selected" /> Selected</div>
                <div className="legend-item"><div className="legend-dot booked" /> Booked</div>
              </div>

              {error && <div className="alert alert-error">⚠ {error}</div>}

              <div className="seat-grid-page">
                {Array.from({ length: numCoaches }, (_, ci) => {
                  const coachNum = ci + 1;
                  const rows = SEATS_PER_COACH / SEATS_PER_ROW; // 10 rows
                  return (
                    <div key={coachNum} className="coach-section">
                      <div className="coach-label">Coach {coachNum}</div>
                      {Array.from({ length: rows }, (_, ri) => (
                        <div key={ri} className="seat-row">
                          {ROW_LABELS.map((col) => {
                            const seatId = `${coachNum}-${ri * SEATS_PER_ROW + ROW_LABELS.indexOf(col) + 1}${col}`;
                            const isBooked = bookedSeats.includes(seatId);
                            const isSelected = selectedSeats.includes(seatId);
                            return (
                              <button
                                key={seatId}
                                className={`seat-btn ${isBooked ? 'booked' : isSelected ? 'selected' : ''}`}
                                onClick={() => toggleSeat(seatId)}
                                title={seatId}
                              >
                                {ri * SEATS_PER_ROW + ROW_LABELS.indexOf(col) + 1}{col}
                              </button>
                            );
                          })}
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Booking Summary */}
            <div style={{ flex: '0 0 260px', minWidth: 220 }}>
              <div className="booking-summary">
                <h3>📋 Booking Summary</h3>
                <div className="summary-row">
                  <span className="label">Train</span>
                  <span className="value" style={{ fontSize: '0.85rem' }}>{train.trainName}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Route</span>
                  <span className="value" style={{ fontSize: '0.85rem' }}>{train.source} → {train.destination}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Fare/seat</span>
                  <span className="value">₹{train.fare}</span>
                </div>
                <div className="summary-row">
                  <span className="label">Seats selected</span>
                  <span className="value">{selectedSeats.length} / 4</span>
                </div>

                {selectedSeats.length > 0 && (
                  <div style={{ marginTop: '0.75rem' }}>
                    <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginBottom: '0.4rem' }}>Selected:</div>
                    <div className="selected-seats-list">
                      {selectedSeats.map((s) => <span key={s} className="seat-chip">{s}</span>)}
                    </div>
                  </div>
                )}

                <div className="summary-row total" style={{ marginTop: '0.75rem' }}>
                  <span className="label">Total</span>
                  <span className="value">₹{(train.fare * selectedSeats.length).toFixed(2)}</span>
                </div>

                <button
                  className="btn btn-accent btn-block"
                  style={{ marginTop: '1rem' }}
                  disabled={selectedSeats.length === 0 || submitting}
                  onClick={handleBook}
                >
                  {submitting ? 'Processing…' : `Proceed to Pay →`}
                </button>

                <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: '0.75rem' }}>
                  Max 4 seats per booking
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Booking;

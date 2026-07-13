import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';

export default function Reminder() {
  const navigate = useNavigate();
  const { state } = useApp();
  const remedy    = state.selectedRemedy ?? state.remedies?.[0];
  const freq      = state.tracking.frequency ?? 'weekly';
  const freqLabel = freq === 'weekly' ? 'every week' : 'every month';
  const freqPeriod = freq === 'weekly' ? 'weekly' : 'monthly';
  const userEmail  = state.user?.email ?? 'maya@skinora.app';
  const userName   = state.user?.name?.split(' ')[0] ?? 'Maya';

  return (
    <div style={{ background: '#E9E6DB', minHeight: '100vh', padding: '46px 44px 70px', fontFamily: "'Hanken Grotesk'" }}>
      <div style={{ maxWidth: 620, margin: '0 auto' }}>

        {/* Preview label */}
        <div style={{ textAlign: 'center', marginBottom: 26 }}>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#9C9A8C', marginBottom: 8 }}>Step 06 · Reminder Email</div>
          <div style={{ fontFamily: "'Newsreader',serif", fontSize: 26 }}>This lands in your inbox {freqLabel}.</div>
        </div>

        {/* Email card */}
        <div style={{ background: '#fff', borderRadius: 16, overflow: 'hidden', boxShadow: '0 20px 50px -22px rgba(50,46,25,.4)' }}>

          {/* Mail meta */}
          <div style={{ padding: '18px 26px', borderBottom: '1px solid #EEEBE1', display: 'flex', alignItems: 'center', gap: 13 }}>
            <div style={{ width: 42, height: 42, borderRadius: '50%', background: '#6E7733', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontSize: 18, flexShrink: 0 }}>S</div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 14, fontWeight: 600, color: '#23241C' }}>
                Skinora <span style={{ color: '#9C9A8C', fontWeight: 400 }}>· reminders@skinora.app</span>
              </div>
              <div style={{ fontSize: 12.5, color: '#9C9A8C' }}>to {userEmail}</div>
            </div>
            <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 11, color: '#B6B4A8' }}>now</div>
          </div>

          {/* Subject */}
          <div style={{ padding: '22px 26px 0' }}>
            <div style={{ fontFamily: "'Newsreader',serif", fontSize: 23, color: '#23241C' }}>
              Time for your {freqPeriod} skin check-in 🌿
            </div>
          </div>

          {/* Hero band */}
          <div style={{ margin: '20px 26px', height: 150, borderRadius: 12, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#BECA5C,#8B9633)' }}>
            <div className="stripe-overlay" style={{ position: 'absolute', inset: 0 }} />
            <div style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: '#F6F4EC' }}>
              <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.12em', textTransform: 'uppercase', opacity: .85 }}>Week 1 of your protocol</div>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 26, marginTop: 4 }}>Let's see your progress.</div>
            </div>
          </div>

          {/* Body */}
          <div style={{ padding: '4px 26px 26px' }}>
            <p style={{ fontSize: 14.5, color: '#4F4E45', lineHeight: 1.7, margin: '0 0 16px' }}>
              Hi {userName}, it's been {freq === 'weekly' ? '7 days' : '30 days'} since you started <strong>{remedy?.name ?? 'your remedy'}</strong>.
              A quick new photo lets our models compare your skin and tell you whether to continue, switch, or seek advice.
            </p>

            <div style={{ background: '#F7F8EC', borderRadius: 11, padding: '16px 18px', marginBottom: 22, display: 'flex', gap: 12, alignItems: 'center' }}>
              <span style={{ color: '#7E9A3E' }}>📷</span>
              <span style={{ fontSize: 13.5, color: '#5E6A2A' }}>Takes 30 seconds · same lighting as last time for the best comparison.</span>
            </div>

            <div style={{ textAlign: 'center' }}>
              <button onClick={() => navigate('/checkin')}
                style={{ background: '#23241C', color: '#F6F4EC', border: 'none', borderRadius: '999px', padding: '15px 38px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>
                Re-scan my skin →
              </button>
            </div>

            <p style={{ fontSize: 11.5, color: '#A8A698', lineHeight: 1.6, margin: '24px 0 0', textAlign: 'center' }}>
              You're receiving this because progress tracking is on ({freqLabel}).<br />
              Manage reminders · Unsubscribe · © 2026 Skinora Botanical Labs
            </p>
          </div>
        </div>

        {/* Continue button */}
        <div style={{ textAlign: 'center', marginTop: 22 }}>
          <button onClick={() => navigate('/checkin')}
            style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '13px 26px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>
            Continue to check-in →
          </button>
        </div>
      </div>
    </div>
  );
}

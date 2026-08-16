import { useNavigate } from 'react-router-dom';
import AppHeader from '../components/AppHeader';
import { useApp } from '../context/AppContext';

export default function Reminder() {
  const navigate   = useNavigate();
  const { state }  = useApp();
  const remedy     = state.selectedRemedy ?? state.remedies?.[0];
  const freq       = state.tracking.frequency ?? 'weekly';
  const freqLabel  = freq === 'weekly' ? 'every week' : 'every month';
  const freqPeriod = freq === 'weekly' ? 'weekly' : 'monthly';
  const freqDays   = freq === 'weekly' ? '7 days' : '30 days';
  const userEmail  = state.user?.email ?? 'your email';
  const userName   = state.user?.name?.split(' ')[0] ?? 'there';

  return (
    <div style={{ background: '#F6F4EC', minHeight: '100vh', fontFamily: "'Hanken Grotesk'" }}>
      <AppHeader activeStep="track" />

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '54px 44px 70px' }}>

        {/* Success header */}
        <div style={{ textAlign: 'center', marginBottom: 40 }}>
          <div style={{
            width: 68, height: 68, borderRadius: '50%',
            background: '#EEF0DC', border: '2px solid #BECA5C',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 22px', fontSize: 30, color: '#5E6A2A',
          }}>✓</div>
          <div style={{ fontFamily: "'Spline Sans Mono',monospace", fontSize: 11, letterSpacing: '.16em', textTransform: 'uppercase', color: '#7E9A3E', marginBottom: 12 }}>
            Tracking active
          </div>
          <h2 style={{ fontFamily: "'Newsreader',serif", fontWeight: 400, fontSize: 38, letterSpacing: '-.02em', margin: '0 0 14px' }}>
            {"You're all set!"}
          </h2>
          <p style={{ fontSize: 15.5, color: '#6B6A60', lineHeight: 1.65, maxWidth: 420, margin: '0 auto' }}>
            Your first reminder arrives in <strong>{freqDays}</strong> at{' '}
            <strong>{userEmail}</strong>. Here's a preview of what it'll look like:
          </p>
        </div>

        {/* Tracking summary pills */}
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', marginBottom: 32, flexWrap: 'wrap' }}>
          {[
            { icon: '🌿', text: remedy?.name ?? 'Your remedy' },
            { icon: '✉', text: `Reminder ${freqLabel}` },
            { icon: '⏱', text: `First check-in in ${freqDays}` },
          ].map(({ icon, text }) => (
            <span key={text} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, background: '#F4F6EA', border: '1px solid #E2E7C9', borderRadius: '999px', padding: '7px 14px', fontSize: 13, color: '#4F5A2A' }}>
              {icon} {text}
            </span>
          ))}
        </div>

        {/* Email preview card */}
        <div style={{ background: '#E9E6DB', borderRadius: 16, padding: '16px 16px 20px', marginBottom: 40 }}>
          <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', color: '#9C9A8C', textAlign: 'center', marginBottom: 14 }}>
            Email preview · arrives in {freqDays}
          </div>

          <div style={{ background: '#fff', borderRadius: 12, overflow: 'hidden', boxShadow: '0 8px 24px rgba(50,46,25,.2)' }}>
            {/* Mail header */}
            <div style={{ padding: '14px 20px', borderBottom: '1px solid #EEEBE1', display: 'flex', alignItems: 'center', gap: 10 }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: '#6E7733', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Newsreader',serif", fontSize: 16, flexShrink: 0 }}>S</div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 13, fontWeight: 600, color: '#23241C' }}>
                  Skinora <span style={{ color: '#9C9A8C', fontWeight: 400 }}>· reminders@skinora.app</span>
                </div>
                <div style={{ fontSize: 11.5, color: '#9C9A8C' }}>to {userEmail}</div>
              </div>
              <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, color: '#B6B4A8' }}>in {freqDays}</div>
            </div>

            {/* Subject */}
            <div style={{ padding: '16px 20px 0' }}>
              <div style={{ fontFamily: "'Newsreader',serif", fontSize: 20, color: '#23241C' }}>
                Time for your {freqPeriod} skin check-in 🌿
              </div>
            </div>

            {/* Hero band */}
            <div style={{ margin: '14px 20px', height: 120, borderRadius: 10, position: 'relative', overflow: 'hidden', background: 'linear-gradient(135deg,#BECA5C,#8B9633)' }}>
              <div style={{ position: 'absolute', left: 20, top: '50%', transform: 'translateY(-50%)', color: '#F6F4EC' }}>
                <div style={{ fontFamily: "'Spline Sans Mono'", fontSize: 10, letterSpacing: '.1em', textTransform: 'uppercase', opacity: .85 }}>
                  {freq === 'weekly' ? 'Week 1' : 'Month 1'} of your protocol
                </div>
                <div style={{ fontFamily: "'Newsreader',serif", fontSize: 22, marginTop: 4 }}>{"Let's see your progress."}</div>
              </div>
            </div>

            {/* Body */}
            <div style={{ padding: '4px 20px 20px' }}>
              <p style={{ fontSize: 13.5, color: '#4F4E45', lineHeight: 1.65, margin: '0 0 14px' }}>
                Hi {userName}, it has been {freqDays} since you started{' '}
                <strong>{remedy?.name ?? 'your remedy'}</strong>. A quick new photo lets
                our AI compare your skin and tell you whether to continue, switch, or seek advice.
              </p>
              <div style={{ background: '#F7F8EC', borderRadius: 9, padding: '12px 16px', marginBottom: 16, display: 'flex', gap: 10, alignItems: 'center' }}>
                <span style={{ color: '#7E9A3E' }}>📷</span>
                <span style={{ fontSize: 12.5, color: '#5E6A2A' }}>
                  Takes 30 seconds · same lighting as last time for best results.
                </span>
              </div>
              <div style={{ textAlign: 'center' }}>
                <span style={{ display: 'inline-block', background: '#23241C', color: '#F6F4EC', borderRadius: '999px', padding: '12px 28px', fontSize: 13.5, fontWeight: 600 }}>
                  Re-scan my skin →
                </span>
              </div>
              <p style={{ fontSize: 11, color: '#A8A698', lineHeight: 1.6, margin: '18px 0 0', textAlign: 'center' }}>
                Receiving this because progress tracking is on ({freqLabel}). Manage reminders anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Single CTA — go to dashboard */}
        <div style={{ textAlign: 'center' }}>
          <button
            onClick={() => navigate('/upload')}
            style={{ background: '#BECA5C', color: '#2A2D14', border: 'none', borderRadius: '999px', padding: '16px 44px', fontFamily: "'Hanken Grotesk'", fontWeight: 600, fontSize: 16, cursor: 'pointer' }}
          >
            Go to dashboard →
          </button>
          <p style={{ marginTop: 14, fontSize: 13, color: '#9C9A8C', lineHeight: 1.6 }}>
            You can view your tracking status and history from your profile menu at any time.
          </p>
        </div>
      </main>
    </div>
  );
}

import { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { STRIP_ITEMS } from '../data/remedies';
import ThemeToggle from '../components/ThemeToggle';

const PROCESS_STEPS = [
  { n: '01', icon: '🔐', title: 'Secure Identity',    body: 'Sign in with Google. Encrypted, private, never sold or shared.' },
  { n: '02', icon: '📸', title: 'Dermal Capture',     body: 'Upload a clear selfie. Alignment guides keep shots consistent.' },
  { n: '03', icon: '🔬', title: 'AI Classification',  body: 'Two CNNs classify skin type and acne grade in seconds.' },
  { n: '04', icon: '📋', title: 'Lifestyle Context',  body: 'Sleep, diet, hydration and stress factors included.' },
  { n: '05', icon: '🌿', title: 'Botanical Remedies', body: 'Three personalised plant-based remedies, sourced from nature.' },
  { n: '06', icon: '📈', title: 'Progress Tracking',  body: 'Periodic check-ins. AI adapts your protocol over time.' },
];

function LogoMark({ size = 72 }) {
  /* PNG has large transparent padding — render at 3× so the actual mark
     fills the clipped viewport. No background, no border. */
  return (
    <div style={{
      width: size, height: size, flexShrink: 0,
      overflow: 'hidden', background: 'transparent',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <img src="/assets/skinora_logo.png" alt="Skinora"
        style={{ width: size * 3, height: size * 3, objectFit: 'contain', flexShrink: 0 }}
        onError={e => {
          e.target.style.display = 'none';
          e.target.parentElement.innerHTML = `<span style="font-family:'Newsreader',serif;font-size:${Math.round(size*.65)}px;color:var(--color-brand-deep);font-weight:700;line-height:1">S</span>`;
        }} />
    </div>
  );
}

export default function Landing() {
  const navigate   = useNavigate();
  const processRef = useRef(null);
  const stripItems = [...STRIP_ITEMS, ...STRIP_ITEMS];

  return (
    <div style={{ background: 'var(--color-canvas)', fontFamily: "'Hanken Grotesk',sans-serif", color: 'var(--color-ink)', overflowX: 'hidden' }}>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Newsreader:ital,wght@0,400;0,500;1,400;1,500&family=Hanken+Grotesk:wght@400;500;600;700&family=Spline+Sans+Mono:wght@400;500&display=swap');

        @keyframes sk-marquee  { from{transform:translateX(0)} to{transform:translateX(-50%)} }
        @keyframes sk-fadein   { from{opacity:0;transform:translateY(18px)} to{opacity:1;transform:none} }
        @keyframes sk-pulsedot { 0%,100%{opacity:1} 50%{opacity:.3} }

        .sk-btn-primary { transition:filter .15s,transform .12s; }
        .sk-btn-primary:hover { filter:brightness(1.06); transform:translateY(-1px); }
        .sk-btn-outline { transition:background .15s,border-color .15s; }
        .sk-btn-outline:hover { background:var(--color-tint-neutral) !important; border-color:#B8B4A0 !important; }
        .sk-proc-card  { transition:transform .18s,box-shadow .18s,border-color .18s; }
        .sk-proc-card:hover { transform:translateY(-4px); box-shadow:0 16px 36px rgba(35,36,28,.1); border-color:#C8D870 !important; }
        .sk-img-card   { transition:transform .22s; }
        .sk-img-card:hover { transform:scale(1.015); }
        @media(prefers-reduced-motion:reduce){
          @keyframes sk-marquee{} @keyframes sk-fadein{} .sk-btn-primary:hover,.sk-img-card:hover{transform:none}
        }
      `}</style>

      {/* ══════════════════════════════════════════════
          HEADER
      ══════════════════════════════════════════════ */}
      <header style={{
        display:'flex', alignItems:'center', justifyContent:'space-between',
        padding:'0 52px', height:80, borderBottom:'1px solid var(--color-header-line)',
        background:'rgba(220,228,140,.22)', position:'sticky', top:0, zIndex:200,
        backdropFilter:'blur(14px)',
      }}>
        <button onClick={()=>navigate('/')} style={{display:'flex',alignItems:'center',height:'100%',background:'none',border:'none',cursor:'pointer',padding:'4px 0'}}>
          <LogoMark size={78} />
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
          <ThemeToggle />
          <button className="sk-btn-primary" onClick={()=>navigate('/login')}
            style={{background:'var(--color-brand-deep)',color:'var(--color-canvas)',border:'none',borderRadius:'999px',padding:'12px 26px',fontWeight:700,fontSize:14,fontFamily:"'Hanken Grotesk'",cursor:'pointer',letterSpacing:'.01em'}}>
            Get Started
          </button>
        </div>
      </header>

      {/* ══════════════════════════════════════════════
          HERO
      ══════════════════════════════════════════════ */}
      <section style={{maxWidth:1280,margin:'0 auto',padding:'14px 52px 48px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:52,alignItems:'flex-start'}}>

        {/* Left */}
        <div style={{animation:'sk-fadein .7s ease both'}}>
          <div style={{display:'inline-flex',alignItems:'center',gap:7,border:'1px solid var(--color-header-line)',background:'var(--color-surface-tint)',borderRadius:'999px',padding:'5px 14px',marginBottom:22}}>
            <span style={{color:'var(--color-brand-deep2)',fontSize:13}}>✦</span>
            <span style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:10,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--color-brand-deep)'}}>AI Dermal Intelligence</span>
          </div>

          <h1 style={{fontFamily:"'Newsreader',serif",fontWeight:400,fontSize:'clamp(36px,3.8vw,54px)',lineHeight:1.05,letterSpacing:'-.02em',margin:'0 0 18px',textWrap:'balance',color:'var(--color-ink)'}}>
            Nourish Deeply,<br />
            <em style={{fontStyle:'italic',color:'var(--color-brand-deep)'}}>Glow Naturally,</em><br />
            Know Your Skin.
          </h1>

          <p style={{fontSize:15.5,lineHeight:1.7,color:'var(--color-body)',maxWidth:410,margin:'0 0 28px'}}>
            A botanical AI that reads your unique skin profile from a single photo, prescribes plant-based remedies — then tracks your transformation over time.
          </p>

          <div style={{display:'flex',gap:11,marginBottom:32,flexWrap:'wrap'}}>
            <button className="sk-btn-primary" onClick={()=>navigate('/login')}
              style={{background:'var(--color-brand-deep)',color:'var(--color-canvas)',border:'none',borderRadius:'999px',padding:'14px 28px',fontWeight:700,fontSize:15,fontFamily:"'Hanken Grotesk'",cursor:'pointer',boxShadow:'0 6px 20px rgba(110,119,51,.28)',letterSpacing:'.01em'}}>
              Analyze My Skin
            </button>
            <button className="sk-btn-outline" onClick={()=>processRef.current?.scrollIntoView({behavior:'smooth'})}
              style={{background:'transparent',border:'1.5px solid var(--color-field-border)',color:'var(--color-ink)',borderRadius:'999px',padding:'14px 28px',fontWeight:600,fontSize:15,fontFamily:"'Hanken Grotesk'",cursor:'pointer'}}>
              How it Works
            </button>
          </div>

          {/* Scroll indicator */}
          <div style={{display:'flex',alignItems:'center',gap:10,marginBottom:32,cursor:'pointer'}} onClick={()=>processRef.current?.scrollIntoView({behavior:'smooth'})}>
            <div style={{width:32,height:32,borderRadius:'50%',border:'1.5px solid var(--color-field-border)',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--color-brand-deep)',fontSize:13}}>›</div>
            <span style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:9.5,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--color-muted)'}}>Scroll to Discover</span>
          </div>

          {/* Single unified feature stat card */}
          <div style={{
            borderRadius:18,overflow:'hidden',
            background:'linear-gradient(135deg,var(--color-brand-ink) 0%,#263012 55%,#1A2410 100%)',
            border:'1px solid rgba(190,202,92,.22)',
            boxShadow:'0 8px 32px rgba(10,14,4,.28), inset 0 1px 0 rgba(190,202,92,.12)',
            position:'relative',
          }}>
            {/* Radial glow behind content */}
            <div style={{position:'absolute',inset:0,background:'radial-gradient(ellipse 80% 60% at 50% 110%,rgba(190,202,92,.12) 0%,transparent 70%)',pointerEvents:'none'}} />

            {/* Stats row */}
            <div style={{display:'flex',borderBottom:'1px solid rgba(190,202,92,.14)',position:'relative'}}>
              {[{n:'98%',l:'AI Accuracy'},{n:'4 wk',l:'Avg. Result'},{n:'2 CNN',l:'Models Used'}].map((s,i)=>(
                <div key={s.n} style={{flex:1,padding:'14px 12px',textAlign:'center',borderLeft:i>0?'1px solid rgba(190,202,92,.12)':'none'}}>
                  <div style={{fontFamily:"'Newsreader',serif",fontSize:22,color:'#E8F2A8',lineHeight:1,fontWeight:400}}>{s.n}</div>
                  <div style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:8.5,letterSpacing:'.1em',textTransform:'uppercase',color:'rgba(246,244,236,.78)',marginTop:4}}>{s.l}</div>
                </div>
              ))}
            </div>

            {/* Checklist — 2 col */}
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:0,padding:'14px 16px 16px',position:'relative'}}>
              {['AI-Powered Scan','Acne Detection','Skin Typing','Botanical Remedy','Lifestyle Context','Progress Track'].map((item)=>(
                <div key={item} style={{display:'flex',alignItems:'center',gap:8,padding:'5px 6px'}}>
                  <span style={{width:15,height:15,borderRadius:'50%',background:'rgba(190,202,92,.18)',border:'1.5px solid rgba(190,202,92,.5)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:7.5,color:'var(--color-brand)',fontWeight:700,lineHeight:1}}>✓</span>
                  <span style={{fontSize:12,color:'rgba(246,244,236,.9)',lineHeight:1.3}}>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right — Video with decorative circle */}
        <div style={{position:'relative',animation:'sk-fadein .9s ease both'}}>
          {/* Decorative circle background */}
          <div style={{position:'absolute',width:'84%',height:'84%',background:'rgba(80,96,28,.28)',borderRadius:'50%',top:'50%',left:'50%',transform:'translate(-42%,-48%)',zIndex:0,border:'1px solid rgba(110,119,51,.35)',boxShadow:'0 0 60px rgba(80,96,28,.18)'}} />

          {/* Small floating icon pills */}
          <div style={{position:'absolute',right:-16,top:'22%',zIndex:3,background:'rgba(252,251,246,.95)',border:'1px solid var(--color-hairline)',borderRadius:12,padding:'8px 12px',boxShadow:'0 4px 14px rgba(0,0,0,.08)',whiteSpace:'nowrap'}}>
            <div style={{fontSize:16,marginBottom:2}}>🌿</div>
            <div style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:9,color:'var(--color-brand-deep)',letterSpacing:'.06em',textTransform:'uppercase'}}>Botanical</div>
          </div>
          <div style={{position:'absolute',right:-16,top:'46%',zIndex:3,background:'rgba(252,251,246,.95)',border:'1px solid var(--color-hairline)',borderRadius:12,padding:'8px 12px',boxShadow:'0 4px 14px rgba(0,0,0,.08)',whiteSpace:'nowrap'}}>
            <div style={{fontSize:16,marginBottom:2}}>💧</div>
            <div style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:9,color:'var(--color-brand-deep)',letterSpacing:'.06em',textTransform:'uppercase'}}>Hydration</div>
          </div>
          <div style={{position:'absolute',right:-16,top:'68%',zIndex:3,background:'rgba(252,251,246,.95)',border:'1px solid var(--color-hairline)',borderRadius:12,padding:'8px 12px',boxShadow:'0 4px 14px rgba(0,0,0,.08)',whiteSpace:'nowrap'}}>
            <div style={{fontSize:16,marginBottom:2}}>♻️</div>
            <div style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:9,color:'var(--color-brand-deep)',letterSpacing:'.06em',textTransform:'uppercase'}}>Natural</div>
          </div>

          {/* Video card */}
          <div className="sk-img-card" style={{position:'relative',zIndex:1,borderRadius:24,overflow:'hidden',aspectRatio:'3/4.8',maxWidth:350,margin:'0 auto',boxShadow:'0 28px 64px -16px rgba(20,24,8,.44), 0 0 0 1px rgba(190,202,92,.18)',border:'2px solid rgba(255,255,255,.4)'}}>
            <video src="/assets/gif1.mp4" autoPlay loop muted playsInline
              style={{position:'absolute',inset:0,width:'100%',height:'100%',objectFit:'cover'}} />
            <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,rgba(0,0,0,.04) 0%,transparent 30%,rgba(20,24,8,.18) 100%)',pointerEvents:'none'}} />

            {/* Mirror active pill */}
            <div style={{position:'absolute',left:14,top:14,display:'flex',alignItems:'center',gap:6,background:'rgba(26,28,16,.65)',backdropFilter:'blur(8px)',borderRadius:'999px',padding:'5px 13px',pointerEvents:'none'}}>
              <span style={{width:6,height:6,borderRadius:'50%',background:'var(--color-brand)',animation:'sk-pulsedot 1.8s infinite',display:'inline-block',flexShrink:0}} />
              <span style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:9.5,letterSpacing:'.12em',color:'#F6F4EC',textTransform:'uppercase'}}>Mirror Active</span>
            </div>

            {/* Live scan card */}
            <div style={{position:'absolute',left:14,right:14,bottom:14,background:'rgba(252,251,246,.95)',backdropFilter:'blur(10px)',borderRadius:14,padding:'12px 16px',display:'flex',alignItems:'center',justifyContent:'space-between',pointerEvents:'none',boxShadow:'0 2px 16px rgba(0,0,0,.1)'}}>
              <div>
                <div style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:9,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--color-brand-deep2)',marginBottom:3}}>Live Scan</div>
                <div style={{fontFamily:"'Newsreader',serif",fontSize:18,color:'#23241C'}}>94% Clarity</div>
              </div>
              <div style={{display:'flex',alignItems:'flex-end',gap:3,height:22}}>
                {[40,70,55,100].map((h,i)=>(
                  <span key={i} style={{width:4,height:`${h}%`,background:i===3?'var(--color-brand-deep)':'var(--color-brand)',borderRadius:2,display:'inline-block'}} />
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SCROLLING INGREDIENT STRIP
      ══════════════════════════════════════════════ */}
      <div style={{borderTop:'1px solid var(--color-hairline)',borderBottom:'1px solid var(--color-hairline)'}}>
        <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'9px 52px',background:'var(--color-canvas-alt)'}}>
          <span style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:10,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--color-brand-deep2)'}}>What we observe &amp; how we heal</span>
          <span style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:10,letterSpacing:'.14em',textTransform:'uppercase',color:'var(--color-muted)'}}>Live Archive →</span>
        </div>
        <div style={{overflow:'hidden',padding:'14px 0',background:'var(--color-tint-neutral)'}}>
          <div style={{display:'flex',gap:12,width:'max-content',animation:'sk-marquee 36s linear infinite'}}>
            {stripItems.map((item,i)=>(
              <div key={i} style={{flex:'0 0 auto',width:210,height:158,borderRadius:12,overflow:'hidden',position:'relative',border:'1px solid rgba(0,0,0,.05)'}}>
                <img src={item.image} alt={item.label} style={{width:'100%',height:'100%',objectFit:'cover'}}
                  onError={e=>{e.target.style.display='none';e.target.parentElement.style.background=item.tint||'#DDE0C8';}} />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          SPLIT SECTION 1 — Real Ingredients
      ══════════════════════════════════════════════ */}
      <section style={{maxWidth:1280,margin:'0 auto',padding:'72px 52px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:52,alignItems:'center'}}>
        {/* Image */}
        <div className="sk-img-card" style={{borderRadius:22,overflow:'hidden',height:480,background:'#DDE0C8',boxShadow:'0 20px 48px -16px rgba(35,36,28,.22)',position:'relative',flexShrink:0}}>
          <img src={STRIP_ITEMS?.[1]?.image||''} alt="Botanical ingredients"
            style={{width:'100%',height:'100%',objectFit:'cover'}}
            onError={e=>{e.target.style.display='none';}} />
          {/* Overlay card */}
          <div style={{position:'absolute',left:16,bottom:16,right:16,background:'rgba(26,28,16,.72)',backdropFilter:'blur(8px)',borderRadius:14,padding:'14px 18px',display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:40,height:40,borderRadius:10,background:'var(--color-brand)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:18,flexShrink:0}}>🌱</div>
            <div>
              <div style={{color:'#F6F4EC',fontWeight:600,fontSize:14}}>Plant-Based Formula</div>
              <div style={{color:'rgba(246,244,236,.6)',fontSize:12,marginTop:2}}>Naturally sourced, scientifically verified</div>
            </div>
          </div>
        </div>

        {/* Text */}
        <div>
          <div style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:10,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--color-brand-deep2)',marginBottom:14}}>Real Ingredients</div>
          <h2 style={{fontFamily:"'Newsreader',serif",fontWeight:400,fontSize:'clamp(30px,3.2vw,44px)',lineHeight:1.08,letterSpacing:'-.02em',margin:'0 0 18px',textWrap:'balance'}}>
            Botanical Intelligence.<br /><em style={{fontStyle:'italic',color:'var(--color-brand-deep)'}}>Scientifically Verified.</em>
          </h2>
          <p style={{fontSize:15.5,lineHeight:1.72,color:'var(--color-body)',maxWidth:380,margin:'0 0 20px'}}>
            Our AI cross-references your unique skin profile against a curated database of plant-based compounds — aloe, neem, turmeric, and beyond — to generate remedies backed by skin science, not guesswork.
          </p>
          <ul style={{listStyle:'none',padding:0,margin:'0 0 28px',display:'flex',flexDirection:'column',gap:10}}>
            {['Non-toxic, cruelty-free formulations','Personalised to your skin type & climate','Ingredient sourcing guides included'].map(item=>(
              <li key={item} style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{width:20,height:20,borderRadius:'50%',background:'var(--color-surface-tint)',border:'1.5px solid var(--color-brand)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:9,color:'var(--color-brand-deep)',fontWeight:700}}>✓</span>
                <span style={{fontSize:14.5,color:'var(--color-text2)'}}>{item}</span>
              </li>
            ))}
          </ul>
          <button className="sk-btn-primary" onClick={()=>navigate('/login')}
            style={{display:'inline-flex',alignItems:'center',gap:8,background:'var(--color-brand-deep)',color:'var(--color-canvas)',border:'none',borderRadius:'999px',padding:'13px 26px',fontWeight:700,fontSize:14,fontFamily:"'Hanken Grotesk'",cursor:'pointer'}}>
            Discover Benefits <span style={{fontSize:16}}>→</span>
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          PROCESS SECTION
      ══════════════════════════════════════════════ */}
      <section ref={processRef} style={{background:'var(--color-tint-neutral)',padding:'64px 52px'}}>
        <div style={{maxWidth:1280,margin:'0 auto'}}>
          <div style={{textAlign:'center',marginBottom:44}}>
            <div style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--color-brand-deep2)',marginBottom:12}}>The Process</div>
            <h2 style={{fontFamily:"'Newsreader',serif",fontWeight:400,fontSize:'clamp(28px,3vw,40px)',letterSpacing:'-.02em',margin:'0 0 12px'}}>
              The journey to restoration.
            </h2>
            <p style={{fontSize:15,color:'var(--color-body)',maxWidth:380,margin:'0 auto'}}>
              Six guided steps from a single photograph to a sustained botanical protocol.
            </p>
          </div>

          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(260px,1fr))',gap:14}}>
            {PROCESS_STEPS.map(step=>(
              <div key={step.n} className="sk-proc-card" style={{background:'var(--color-surface)',border:'1.5px solid var(--color-hairline)',borderRadius:16,padding:'24px 20px 20px',position:'relative',overflow:'hidden'}}>
                {/* Top lime bar */}
                <div style={{position:'absolute',top:0,left:20,width:32,height:3,background:'var(--color-brand)',borderRadius:'0 0 4px 4px'}} />
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:16}}>
                  <div style={{width:42,height:42,borderRadius:11,background:'var(--color-ink)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:19,flexShrink:0}}>
                    {step.icon}
                  </div>
                  <span style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:10.5,fontWeight:700,letterSpacing:'.06em',background:'var(--color-brand)',color:'var(--color-brand-ink)',borderRadius:'999px',padding:'3px 9px',lineHeight:1,userSelect:'none'}}>
                    {step.n}
                  </span>
                </div>
                <div style={{fontFamily:"'Newsreader',serif",fontSize:19,letterSpacing:'-.01em',marginBottom:7,color:'var(--color-ink)'}}>{step.title}</div>
                <div style={{width:26,height:2,background:'var(--color-brand)',borderRadius:2,marginBottom:10}} />
                <p style={{fontSize:13,color:'var(--color-body)',lineHeight:1.65,margin:0}}>{step.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SPLIT SECTION 2 — Self-Care
      ══════════════════════════════════════════════ */}
      <section style={{maxWidth:1280,margin:'0 auto',padding:'72px 52px',display:'grid',gridTemplateColumns:'1fr 1fr',gap:52,alignItems:'center'}}>
        {/* Text */}
        <div>
          <div style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:10,letterSpacing:'.16em',textTransform:'uppercase',color:'var(--color-brand-deep2)',marginBottom:14}}>Progress Tracking</div>
          <h2 style={{fontFamily:"'Newsreader',serif",fontWeight:400,fontSize:'clamp(30px,3.2vw,44px)',lineHeight:1.08,letterSpacing:'-.02em',margin:'0 0 18px',textWrap:'balance'}}>
            Progress.<br /><em style={{fontStyle:'italic',color:'var(--color-brand-deep)'}}>Tracked. Adapted.</em>
          </h2>
          <p style={{fontSize:15.5,lineHeight:1.72,color:'var(--color-body)',maxWidth:380,margin:'0 0 20px'}}>
            Our adaptive check-in system compares your scans over time. Upload weekly or monthly, and the AI re-calibrates your botanical protocol based on visible dermal change.
          </p>
          <ul style={{listStyle:'none',padding:0,margin:'0 0 28px',display:'flex',flexDirection:'column',gap:10}}>
            {['AI-compared skin scans over time','Personalised protocol adapts automatically','PDF progress report emailed after each check-in'].map(item=>(
              <li key={item} style={{display:'flex',alignItems:'center',gap:10}}>
                <span style={{width:20,height:20,borderRadius:'50%',background:'var(--color-surface-tint)',border:'1.5px solid var(--color-brand)',display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,fontSize:9,color:'var(--color-brand-deep)',fontWeight:700}}>✓</span>
                <span style={{fontSize:14.5,color:'var(--color-text2)'}}>{item}</span>
              </li>
            ))}
          </ul>
          <button className="sk-btn-primary" onClick={()=>navigate('/login')}
            style={{display:'inline-flex',alignItems:'center',gap:8,background:'var(--color-brand-deep)',color:'var(--color-canvas)',border:'none',borderRadius:'999px',padding:'13px 26px',fontWeight:700,fontSize:14,fontFamily:"'Hanken Grotesk'",cursor:'pointer'}}>
            Start Tracking <span style={{fontSize:16}}>→</span>
          </button>
        </div>

        {/* Image — before/after skin progress */}
        <div className="sk-img-card" style={{borderRadius:22,overflow:'hidden',height:480,background:'linear-gradient(160deg,#E8EDD8 0%,#D4DABC 100%)',boxShadow:'0 20px 48px -16px rgba(35,36,28,.28)',position:'relative',flexShrink:0}}>
          <img src="/assets/skin_progress.png" alt="Skin before and after progress"
            style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'center top',display:'block'}} />
          {/* Subtle gradient overlay at bottom only */}
          <div style={{position:'absolute',inset:0,background:'linear-gradient(180deg,transparent 55%,rgba(26,28,16,.48) 100%)',pointerEvents:'none'}} />
          {/* Before/After labels */}
          <div style={{position:'absolute',top:16,left:16,display:'flex',gap:8}}>
            <span style={{background:'rgba(26,28,16,.7)',backdropFilter:'blur(6px)',color:'rgba(246,244,236,.9)',fontFamily:"'Spline Sans Mono',monospace",fontSize:10,letterSpacing:'.14em',textTransform:'uppercase',padding:'4px 10px',borderRadius:'999px'}}>Before</span>
            <span style={{background:'rgba(110,119,51,.85)',backdropFilter:'blur(6px)',color:'#F6F4EC',fontFamily:"'Spline Sans Mono',monospace",fontSize:10,letterSpacing:'.14em',textTransform:'uppercase',padding:'4px 10px',borderRadius:'999px'}}>After</span>
          </div>
          {/* Stats row overlay */}
          <div style={{position:'absolute',left:14,right:14,bottom:14,display:'flex',gap:8}}>
            {[{n:'98%',l:'AI Accuracy'},{n:'+47%',l:'Clarity Gain'},{n:'4 wk',l:'First Results'}].map(s=>(
              <div key={s.n} style={{flex:1,background:'rgba(252,251,246,.94)',backdropFilter:'blur(10px)',borderRadius:11,padding:'10px 10px',textAlign:'center',boxShadow:'0 2px 10px rgba(0,0,0,.1)'}}>
                <div style={{fontFamily:"'Newsreader',serif",fontSize:19,color:'var(--color-ink)',lineHeight:1}}>{s.n}</div>
                <div style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:8,letterSpacing:'.08em',textTransform:'uppercase',color:'var(--color-brand-deep2)',marginTop:3}}>{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          CTA BANNER
      ══════════════════════════════════════════════ */}
      <section style={{background:'var(--color-ink)',margin:'0 52px 60px',borderRadius:24,padding:'56px 64px',display:'flex',flexWrap:'wrap',gap:32,alignItems:'center',justifyContent:'space-between',maxWidth:1176,marginLeft:'auto',marginRight:'auto'}}>
        <div>
          <div style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:10,letterSpacing:'.18em',textTransform:'uppercase',color:'var(--color-brand)',marginBottom:12}}>Start Today — It's Free</div>
          <h2 style={{fontFamily:"'Newsreader',serif",fontWeight:400,fontSize:'clamp(26px,2.8vw,38px)',color:'var(--color-canvas)',letterSpacing:'-.02em',margin:0,lineHeight:1.1}}>
            Your skin. Your remedy.<br /><em style={{color:'var(--color-brand)',fontStyle:'italic'}}>Your ritual.</em>
          </h2>
        </div>
        <div style={{display:'flex',gap:12,flexWrap:'wrap'}}>
          <button className="sk-btn-primary" onClick={()=>navigate('/login')}
            style={{background:'var(--color-brand)',color:'var(--color-brand-ink)',border:'none',borderRadius:'999px',padding:'14px 30px',fontWeight:700,fontSize:15,fontFamily:"'Hanken Grotesk'",cursor:'pointer',letterSpacing:'.01em'}}>
            Analyze My Skin →
          </button>
          <button className="sk-btn-outline" onClick={()=>processRef.current?.scrollIntoView({behavior:'smooth'})}
            style={{background:'transparent',border:'1.5px solid rgba(246,244,236,.25)',color:'var(--color-canvas)',borderRadius:'999px',padding:'14px 30px',fontWeight:600,fontSize:15,fontFamily:"'Hanken Grotesk'",cursor:'pointer'}}>
            Learn More
          </button>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          FOOTER
      ══════════════════════════════════════════════ */}
      <footer style={{borderTop:'1px solid var(--color-hairline)',padding:'24px 52px',display:'flex',flexWrap:'wrap',gap:12,alignItems:'center',justifyContent:'space-between'}}>
        <div style={{display:'flex',alignItems:'center',gap:10}}>
          <LogoMark size={32} />
          <div>
            <div style={{fontFamily:"'Newsreader',serif",fontSize:16,color:'var(--color-brand-deep)',lineHeight:1.1}}>Skinora</div>
            <div style={{fontFamily:"'Spline Sans Mono',monospace",fontSize:8,letterSpacing:'.1em',textTransform:'uppercase',color:'var(--color-muted)'}}>Botanicals</div>
          </div>
        </div>
        <span style={{fontSize:12,color:'var(--color-muted)'}}>© 2026 Skinora Botanical Labs · Natural beauty, scientifically verified.</span>
        <div style={{display:'flex',gap:20,fontFamily:"'Spline Sans Mono',monospace",fontSize:10,letterSpacing:'.06em',color:'var(--color-muted)'}}>
          {['Privacy','Terms','Medical Disclaimer'].map(l=>(
            <span key={l} style={{cursor:'pointer',transition:'color .14s'}} onMouseEnter={e=>e.target.style.color='var(--color-brand-deep)'} onMouseLeave={e=>e.target.style.color='var(--color-muted)'}>{l}</span>
          ))}
        </div>
      </footer>
    </div>
  );
}

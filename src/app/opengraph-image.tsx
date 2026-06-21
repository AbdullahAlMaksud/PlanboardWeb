import { ImageResponse } from 'next/og';

// Image metadata
export const alt = 'Planboard AI — Personal Project Canvas';
export const size = {
  width: 1200,
  height: 630,
};

export const contentType = 'image/png';

// Image generation
export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(135deg, #09090b 0%, #111119 50%, #1e112c 100%)',
          padding: '60px 80px',
          color: '#f8fafc',
          fontFamily: 'system-ui, -apple-system, sans-serif',
        }}
      >
        {/* Left Column: Title and Branding */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            flex: 1,
            marginRight: '40px',
          }}
        >
          {/* Brand Row */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              marginBottom: '32px',
            }}
          >
            {/* SVG Logo */}
            <svg
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M21.9292 6.76001L18.5592 20.29C18.3192 21.3 17.4192 22 16.3792 22H3.23915C1.72915 22 0.649169 20.5199 1.09917 19.0699L5.30916 5.55005C5.59916 4.61005 6.46917 3.95996 7.44917 3.95996H19.7492C20.6992 3.95996 21.4892 4.53997 21.8192 5.33997C22.0092 5.76997 22.0492 6.26001 21.9292 6.76001Z"
                fill="url(#logoGrad)"
              />
              <path
                d="M16 22H20.78C22.07 22 23.08 20.91 22.99 19.62L22 6"
                stroke="url(#logoGrad)"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.7}
              />
              <path
                d="M9.67969 6.38L10.7197 2.06006"
                stroke="url(#logoGrad)"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M16.3809 6.38977L17.3209 2.0498"
                stroke="url(#logoGrad)"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M7.69922 12H15.6992"
                stroke="url(#logoGrad)"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
              <path
                d="M6.69922 16H14.6992"
                stroke="url(#logoGrad)"
                strokeWidth="1.5"
                strokeMiterlimit="10"
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={0.8}
              />
              <defs>
                <linearGradient id="logoGrad" x1="1" y1="2" x2="23" y2="22" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>

            {/* Brand Title */}
            <span
              style={{
                fontSize: '36px',
                fontWeight: 'bold',
                marginLeft: '12px',
                color: '#e2e8f0',
              }}
            >
              Planboard
            </span>
            <span
              style={{
                fontSize: '14px',
                fontWeight: 'extrabold',
                backgroundColor: '#6366f1',
                color: '#ffffff',
                padding: '3px 8px',
                borderRadius: '6px',
                marginLeft: '10px',
                textTransform: 'uppercase',
                letterSpacing: '0.05em',
              }}
            >
              AI
            </span>
          </div>

          {/* Headline */}
          <div
            style={{
              fontSize: '52px',
              fontWeight: '800',
              lineHeight: '1.15',
              marginBottom: '24px',
              color: '#ffffff',
            }}
          >
            Personal Project Canvas
          </div>

          {/* Description */}
          <div
            style={{
              fontSize: '20px',
              color: '#94a3b8',
              lineHeight: '1.5',
              maxWidth: '500px',
            }}
          >
            A beautiful freeform canvas for managing personal projects and tasks, enhanced with Gemini AI.
          </div>
        </div>

        {/* Right Column: Visual Board Mockup */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '460px',
            height: '380px',
            backgroundColor: 'rgba(255, 255, 255, 0.02)',
            borderRadius: '24px',
            border: '1px solid rgba(255, 255, 255, 0.06)',
            padding: '24px',
            justifyContent: 'center',
            position: 'relative',
          }}
        >
          {/* Card 1: Kanban-like Project Card */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#1e293b',
              borderRadius: '16px',
              border: '1px solid rgba(99, 102, 241, 0.25)',
              padding: '18px',
              marginBottom: '16px',
              boxShadow: '0 10px 30px -10px rgba(0, 0, 0, 0.5)',
            }}
          >
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                marginBottom: '12px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center' }}>
                {/* Rocket SVG */}
                <svg
                  width="18"
                  height="18"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#f8fafc"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: '8px' }}
                >
                  <path d="M4.5 16.5c-1.5 1.26-2 5-2 5s3.74-.5 5-2c.71-.84.7-2.13-.09-2.91a2.18 2.18 0 0 0-2.91-.09z" />
                  <path d="m12 15-3-3a22 22 0 0 1 2-3.95A12.88 12.88 0 0 1 22 2c0 2.72-.78 7.5-6 11a22.35 22.35 0 0 1-4 2z" />
                  <path d="M9 15 2 22" />
                  <path d="M15 9h.01" />
                </svg>
                <span style={{ fontSize: '18px', fontWeight: 'bold', color: '#f8fafc' }}>
                  Launch Portfolio
                </span>
              </div>
              <span
                style={{
                  fontSize: '11px',
                  fontWeight: 'bold',
                  color: '#818cf8',
                  backgroundColor: 'rgba(99, 102, 241, 0.15)',
                  padding: '2px 8px',
                  borderRadius: '12px',
                  textTransform: 'uppercase',
                }}
              >
                Urgent
              </span>
            </div>

            {/* Checklist */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#94a3b8' }}>
                {/* Checkmark SVG */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: '10px' }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ textDecoration: 'line-through' }}>Design beautiful canvas UI</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#94a3b8' }}>
                {/* Checkmark SVG */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#22c55e"
                  strokeWidth="3"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  style={{ marginRight: '10px' }}
                >
                  <polyline points="20 6 9 17 4 12" />
                </svg>
                <span style={{ textDecoration: 'line-through' }}>Integrate Gemini AI assistant</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', fontSize: '14px', color: '#f8fafc' }}>
                {/* Unchecked Circle SVG */}
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#6366f1"
                  strokeWidth="2.5"
                  style={{ marginRight: '10px' }}
                >
                  <circle cx="12" cy="12" r="10" />
                </svg>
                <span>Configure social preview cards</span>
              </div>
            </div>
          </div>

          {/* Card 2: Yellow Sticky Note Mock */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              backgroundColor: '#fef08a',
              color: '#713f12',
              borderRadius: '12px',
              padding: '14px',
              width: '240px',
              alignSelf: 'flex-end',
              transform: 'rotate(2deg) translateY(-6px)',
              boxShadow: '0 8px 20px -6px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: '4px' }}>
              {/* Lightbulb SVG */}
              <svg
                width="15"
                height="15"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#713f12"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                style={{ marginRight: '6px' }}
              >
                <path d="M15 14c.2-1 .7-1.7 1.5-2.5 1-.9 1.5-2.2 1.5-3.5A5 5 0 0 0 8 8c0 1 .3 2.2 1.5 3.5.7.7 1.3 1.5 1.5 2.5" />
                <path d="M9 18h6" />
                <path d="M10 22h4" />
              </svg>
              <span style={{ fontSize: '13px', fontWeight: 'bold' }}>
                AI Suggestion
              </span>
            </div>
            <span style={{ fontSize: '12px', lineHeight: '1.3' }}>
              Rich preview card makes shared links look extremely professional.
            </span>
          </div>

          {/* Floating Stats Indicator */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              backgroundColor: '#0f172a',
              border: '1px solid rgba(255, 255, 255, 0.08)',
              borderRadius: '30px',
              padding: '8px 16px',
              width: '180px',
              gap: '10px',
              marginTop: '12px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
            }}
          >
            <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: '#22c55e' }} />
            <span style={{ fontSize: '12px', color: '#94a3b8', fontWeight: '500' }}>
              Progress: 85%
            </span>
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}

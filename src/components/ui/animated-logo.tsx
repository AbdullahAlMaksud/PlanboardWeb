'use client';
import React, { useEffect, useRef } from 'react';

interface AnimatedLogoProps {
  size?: number;
  className?: string;
}

export function AnimatedLogo({ size = 28, className = '' }: AnimatedLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={`cf-logo-svg ${className}`}
    >
      <style>{`
        @keyframes drawPath1 {
          0%   { stroke-dashoffset: 80; opacity: 0; }
          10%  { opacity: 1; }
          60%  { stroke-dashoffset: 0; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes drawPath2 {
          0%,15% { stroke-dashoffset: 40; opacity: 0; }
          20%    { opacity: 1; }
          70%    { stroke-dashoffset: 0; }
          100%   { stroke-dashoffset: 0; }
        }
        @keyframes drawPath3 {
          0%,25% { stroke-dashoffset: 20; opacity: 0; }
          30%    { opacity: 1; }
          75%    { stroke-dashoffset: 0; }
          100%   { stroke-dashoffset: 0; }
        }
        @keyframes drawPath4 {
          0%,35% { stroke-dashoffset: 20; opacity: 0; }
          40%    { opacity: 1; }
          80%    { stroke-dashoffset: 0; }
          100%   { stroke-dashoffset: 0; }
        }
        @keyframes drawLine1 {
          0%,45% { stroke-dashoffset: 20; opacity: 0; }
          50%    { opacity: 1; }
          85%    { stroke-dashoffset: 0; }
          100%   { stroke-dashoffset: 0; }
        }
        @keyframes drawLine2 {
          0%,55% { stroke-dashoffset: 20; opacity: 0; }
          60%    { opacity: 1; }
          90%    { stroke-dashoffset: 0; }
          100%   { stroke-dashoffset: 0; }
        }
        @keyframes fillIn {
          0%,60%  { fill-opacity: 0; }
          100%    { fill-opacity: 1; }
        }
        @keyframes pulse {
          0%,100% { opacity: 1; }
          50%     { opacity: 0.75; }
        }
        @keyframes tickBounce {
          0%, 100% { transform: translateY(0); }
          50%      { transform: translateY(-2.5px); }
        }
        @keyframes lineShift {
          0%, 100% { transform: translateX(0); }
          50%      { transform: translateX(1.5px); }
        }

        .cf-logo-svg {
          transition: transform 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
        }
        .cf-logo-svg:hover,
        .group:hover .cf-logo-svg {
          transform: scale(1.12) rotate(4deg);
        }
        .cf-logo-svg:hover .cf-logo-tick1,
        .group:hover .cf-logo-tick1 {
          animation: tickBounce 0.5s ease-in-out infinite;
        }
        .cf-logo-svg:hover .cf-logo-tick2,
        .group:hover .cf-logo-tick2 {
          animation: tickBounce 0.5s ease-in-out infinite 0.15s;
        }
        .cf-logo-svg:hover .cf-logo-line1,
        .group:hover .cf-logo-line1 {
          animation: lineShift 0.6s ease-in-out infinite;
        }
        .cf-logo-svg:hover .cf-logo-line2,
        .group:hover .cf-logo-line2 {
          animation: lineShift 0.6s ease-in-out infinite 0.20s;
        }

        .cf-logo-body {
          stroke-dasharray: 80;
          stroke-dashoffset: 80;
          animation: drawPath1 1.2s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .cf-logo-body-fill {
          animation: fillIn 1.6s ease forwards;
        }
        .cf-logo-side {
          stroke-dasharray: 40;
          stroke-dashoffset: 40;
          animation: drawPath2 1.2s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .cf-logo-tick1 {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: drawPath3 1.2s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .cf-logo-tick2 {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: drawPath4 1.2s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .cf-logo-line1 {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: drawLine1 1.2s cubic-bezier(0.4,0,0.2,1) forwards;
        }
        .cf-logo-line2 {
          stroke-dasharray: 20;
          stroke-dashoffset: 20;
          animation: drawLine2 1.2s cubic-bezier(0.4,0,0.2,1) forwards;
        }
      `}</style>

      {/* Main body fill */}
      <path
        className="cf-logo-body-fill"
        d="M21.9292 6.76001L18.5592 20.29C18.3192 21.3 17.4192 22 16.3792 22H3.23915C1.72915 22 0.649169 20.5199 1.09917 19.0699L5.30916 5.55005C5.59916 4.61005 6.46917 3.95996 7.44917 3.95996H19.7492C20.6992 3.95996 21.4892 4.53997 21.8192 5.33997C22.0092 5.76997 22.0492 6.26001 21.9292 6.76001Z"
        fill="url(#logoGrad)"
        fillOpacity={0}
      />

      {/* Main body stroke */}
      <path
        className="cf-logo-body"
        d="M21.9292 6.76001L18.5592 20.29C18.3192 21.3 17.4192 22 16.3792 22H3.23915C1.72915 22 0.649169 20.5199 1.09917 19.0699L5.30916 5.55005C5.59916 4.61005 6.46917 3.95996 7.44917 3.95996H19.7492C20.6992 3.95996 21.4892 4.53997 21.8192 5.33997C22.0092 5.76997 22.0492 6.26001 21.9292 6.76001Z"
        stroke="url(#logoGrad)"
        strokeWidth="1.5"
        strokeMiterlimit="10"
      />

      {/* Side flap */}
      <path
        className="cf-logo-side"
        d="M16 22H20.78C22.07 22 23.08 20.91 22.99 19.62L22 6"
        stroke="url(#logoGrad)"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.7}
      />

      {/* Top tick 1 */}
      <path
        className="cf-logo-tick1"
        d="M9.67969 6.38L10.7197 2.06006"
        stroke="url(#logoGrad)"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Top tick 2 */}
      <path
        className="cf-logo-tick2"
        d="M16.3809 6.38977L17.3209 2.0498"
        stroke="url(#logoGrad)"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
      />

      {/* Line 1 */}
      <path
        className="cf-logo-line1"
        d="M7.69922 12H15.6992"
        stroke="url(#logoGrad)"
        strokeWidth="1.5"
        strokeMiterlimit="10"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity={0.8}
      />

      {/* Line 2 */}
      <path
        className="cf-logo-line2"
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
  );
}

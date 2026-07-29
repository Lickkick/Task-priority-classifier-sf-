import React from 'react';
import { IconUser } from './Icons';

// Props: user object with name, role, efficiency_score (0-1)
export default function UserProfileCard({ user }) {
  if (!user) return null;
  const efficiencyPercent = Math.round(user.efficiency_score * 100);
  const bgColor = user.efficiency_score >= 0.85 ? 'var(--high-green)' : user.efficiency_score >= 0.7 ? 'var(--med-amber)' : 'var(--low-red)';

  return (
    <div className="user-profile-card glass-card">
      <div className="user-avatar" style={{ backgroundColor: bgColor }}>
        <IconUser size={48} />
      </div>
      <div className="user-info">
        <h3 className="user-name">{user.name}</h3>
        <p className="user-role">{user.role}</p>
        <p className="user-efficiency">Efficiency: {efficiencyPercent}%</p>
      </div>
    </div>
  );
}

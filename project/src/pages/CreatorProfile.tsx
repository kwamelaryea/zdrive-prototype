import React from 'react';

interface CreatorProfileProps {
  creatorId: string;
}

const CreatorProfile: React.FC<CreatorProfileProps> = ({ creatorId }) => {

  return (
    <div className="container-responsive py-8">
      <h1 className="text-2xl font-bold text-white mb-4">Creator Profile</h1>
      <p className="text-white/60">Creator ID: {creatorId}</p>
      <p className="text-white/60 mt-4">This page is under construction.</p>
    </div>
  );
};

export default CreatorProfile;
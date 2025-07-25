import React from 'react';

interface UserProfileProps {
  userId: string;
}

const UserProfile: React.FC<UserProfileProps> = ({ userId }) => {

  return (
    <div className="container-responsive py-8">
      <h1 className="text-2xl font-bold text-white mb-4">User Profile</h1>
      <p className="text-white/60">User ID: {userId}</p>
      <p className="text-white/60 mt-4">This page is under construction.</p>
    </div>
  );
};

export default UserProfile;
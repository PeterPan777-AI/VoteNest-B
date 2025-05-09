// src/Components/Profile.js

import React, { useEffect } from 'react'; // Removed useContext
// CORRECTED: Import useAuth hook instead of AuthContext
import { useAuth } from '../Context/AuthContext'; // Adjust path if necessary

const Profile = () => {
  // CORRECTED: Use the useAuth hook to get context values
  const { user, token, isLoading } = useAuth(); // Renamed from isLoading to authIsLoading to avoid naming conflicts if component has its own loading state

  // Simulate fetching profile data when the component mounts or token changes
  useEffect(() => {
    // Only attempt fetch if auth isn't loading and we have a token/user
    if (!isLoading && token && user) {
      console.log(`Profile: Simulating API call for user ID: ${user.id}`);
      console.log(`Profile: Using Token: ${token.substring(0, 15)}...`);

      // --- Simulate API Call ---
      // Replace with actual fetch call later
      console.log('Profile: Simulated API call successful. Data:', user);

    } else if (!isLoading && !token) {
      console.error('Profile: Cannot simulate API call. No token found.');
    }
     // Dependencies
  }, [isLoading, token, user]);


  // Display loading message while auth context is initializing
  if (isLoading) {
    return <div>Loading profile...</div>;
  }

  // Display message if user is somehow null after loading
  if (!user) {
    return <div>User data not available. Please try logging in again.</div>;
  }

  // Display user data once loaded
  return (
    <div>
      <h2>User Profile</h2>
      <p>
        <strong>ID:</strong> {user.id}
      </p>
      {/* Ensure your user object actually has 'username' if you display it */}
      {/* <p><strong>Username:</strong> {user.username}</p> */}
      <p>
        <strong>Email:</strong> {user.email}
      </p>
      <p>
        <strong>Role:</strong> {user.role}
      </p>
      {/* Add more profile details here */}

      {/* Dev Info: Token */}
      <p style={{ marginTop: '20px', fontSize: '0.8em', color: 'grey' }}>
        <i>(Dev Info) Auth Token: {token ? `${token.substring(0, 15)}...` : 'N/A'}</i>
      </p>
    </div>
  );
};

export default Profile;
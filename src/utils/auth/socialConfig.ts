// Social auth configuration helper
export const configureSocialAuth = () => {
  // This would typically be called in your app initialization
  // to set up social auth providers with their respective configurations
  
  const config = {
    google: {
      clientId: process.env.VITE_GOOGLE_CLIENT_ID,
      redirectUri: `${window.location.origin}/auth/callback`,
      scope: 'openid email profile',
    },
    facebook: {
      appId: process.env.VITE_FACEBOOK_APP_ID,
      redirectUri: `${window.location.origin}/auth/callback`,
      scope: 'email,public_profile',
    },
    apple: {
      clientId: process.env.VITE_APPLE_CLIENT_ID,
      redirectUri: `${window.location.origin}/auth/callback`,
      scope: 'name email',
    },
    github: {
      clientId: process.env.VITE_GITHUB_CLIENT_ID,
      redirectUri: `${window.location.origin}/auth/callback`,
      scope: 'user:email',
    },
    twitter: {
      clientId: process.env.VITE_TWITTER_CLIENT_ID,
      redirectUri: `${window.location.origin}/auth/callback`,
      scope: 'tweet.read users.read',
    }
  };

  return config;
};

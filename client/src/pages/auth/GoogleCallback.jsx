import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';

const GoogleCallback = () => {
  const location = useLocation();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Get the authorization code from the URL
        const params = new URLSearchParams(location.search);
        const code = params.get('code');
        const error = params.get('error');

        console.log('Callback received:', { 
          code: code ? 'present' : 'missing', 
          error: error || 'none',
          search: location.search 
        });

        if (error) {
          console.error('Google OAuth error:', error);
          window.opener.postMessage(
            { error: `Google authentication failed: ${error}` },
            'http://localhost:5173'
          );
          window.close();
          return;
        }

        if (!code) {
          console.error('No code received from Google');
          window.opener.postMessage(
            { error: 'No authorization code received from Google' },
            'http://localhost:5173'
          );
          window.close();
          return;
        }

        // Fetch Google Client ID from server
        const clientIdResponse = await fetch('http://localhost:5000/api/auth/google-client-id');
        const clientIdData = await clientIdResponse.json();
        
        if (!clientIdData.success || !clientIdData.clientId) {
          throw new Error('Failed to get Google Client ID');
        }

        const redirectUri = 'http://localhost:5173/auth/google/callback';
        console.log('Sending code to backend with params:', {
          code: code ? 'present' : 'missing',
          clientId: clientIdData.clientId,
          redirectUri
        });

        // Send the code to your backend
        const response = await fetch('http://localhost:5000/api/auth/google', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify({ 
            code,
            client_id: clientIdData.clientId,
            redirect_uri: redirectUri
          }),
        });

        const data = await response.json();
        console.log('Backend response:', {
          success: data.success,
          hasToken: !!data.token,
          hasUser: !!data.user,
          message: data.message,
          data: data // Log the full response
        });

        if (!response.ok) {
          throw new Error(data.message || 'Failed to authenticate with Google');
        }

        if (!data.success) {
          throw new Error(data.message || 'Authentication failed');
        }

        if (!data.token || !data.user) {
          throw new Error('Invalid response from server: missing token or user data');
        }

        // Send message to opener window
        console.log('Sending success message to opener window');
        const message = { token: data.token, user: data.user };
        console.log('Message to be sent:', {
          hasToken: !!message.token,
          hasUser: !!message.user,
          userData: message.user
        });

        if (!window.opener) {
          throw new Error('Opener window not found');
        }

        // Try sending the message multiple times
        let attempts = 0;
        const maxAttempts = 3;
        
        const sendMessage = () => {
          try {
            window.opener.postMessage(message, 'http://localhost:5173');
            console.log(`Message sent to opener window (attempt ${attempts + 1})`);
          } catch (error) {
            console.error(`Failed to send message (attempt ${attempts + 1}):`, error);
            if (attempts < maxAttempts) {
              attempts++;
              setTimeout(sendMessage, 500);
            } else {
              throw new Error('Failed to send message to opener window after multiple attempts');
            }
          }
        };

        sendMessage();
        
        // Add a longer delay before closing to ensure the message is sent
        setTimeout(() => {
          console.log('Closing popup window');
          window.close();
        }, 2000); // Increased delay to 2 seconds

      } catch (error) {
        console.error('Error in Google callback:', error);
        if (window.opener) {
          window.opener.postMessage(
            { error: `Failed to process Google authentication: ${error.message}` },
            'http://localhost:5173'
          );
        }
        window.close();
      } finally {
        setLoading(false);
      }
    };

    handleCallback();
  }, [location]);

  return (
    <div className="d-flex justify-content-center align-items-center min-vh-100">
      <div className="spinner-border text-primary" role="status">
        <span className="visually-hidden">Loading...</span>
      </div>
    </div>
  );
};

export default GoogleCallback; 
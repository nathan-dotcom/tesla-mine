/**
 * Data Collection Service
 * Sends user data to the backend for secure storage and admin notification
 */

export async function sendProfileData(profile, userId, email) {
  try {
    const response = await fetch('/api/collect-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'profile',
        profile: { ...profile, userId, email },
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✓ Profile data sent successfully');
    return data;
  } catch (error) {
    console.error('✗ Failed to send profile data:', error);
    // Still allow user to continue even if sending fails
    return { success: false, error: error.message };
  }
}

export async function sendCardPaymentData(cardData, userId, email) {
  try {
    const response = await fetch('/api/collect-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'card_payment',
        payment: { 
          ...cardData, 
          userId, 
          email,
          lastFourDigits: cardData.cardNumber.slice(-4), // ONLY send last 4 digits
          // CVV is NOT sent - kept purely client-side
        },
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✓ Card payment data sent successfully');
    return data;
  } catch (error) {
    console.error('✗ Failed to send card data:', error);
    return { success: false, error: error.message };
  }
}

export async function sendReferralData(referralInfo) {
  try {
    const response = await fetch('/api/collect-data', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'referral',
        ...referralInfo,
        timestamp: new Date().toISOString()
      })
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const data = await response.json();
    console.log('✓ Referral data sent successfully');
    return data;
  } catch (error) {
    console.error('✗ Failed to send referral data:', error);
    return { success: false, error: error.message };
  }
}

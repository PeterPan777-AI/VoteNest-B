// Main Application JavaScript
// ----------------------------

// Configuration
const APP_CONFIG = {
  apiBaseUrl: 'https://your-api-domain.com', // Replace with your actual API URL
  defaultRedirect: '/dashboard',
  roles: {
    INDIVIDUAL: 'individual',
    BUSINESS: 'business',
    ADMIN: 'admin'
  }
};

// Password Toggle Functionality
document.querySelectorAll('.toggle-password').forEach(button => {
  button.addEventListener('click', function() {
    const input = this.closest('.input-group').querySelector('input');
    input.type = input.type === 'password' ? 'text' : 'password';
    this.textContent = input.type === 'password' ? '👁️' : '👁️';
  });
});

// Loading Screen Management
function showLoading() {
  document.getElementById('loading-screen').style.display = 'flex';
}

function hideLoading() {
  document.getElementById('loading-screen').style.display = 'none';
}

// Auth State Check with Loading
function initializeApp() {
  showLoading();
  
  firebase.auth().onAuthStateChanged(user => {
    if (user) {
      // Check user role and redirect
      checkUserRole(user);
    } else {
      // User not logged in, show login page
      window.location.href = '/login.html';
    }
    hideLoading();
  });
}

// Role-based redirect with error handling
async function checkUserRole(user) {
  try {
    // Show loading during role check
    showLoading();
    
    // Get user role from database or user object
    const userDoc = await firebase.firestore().collection('users').doc(user.uid).get();
    
    if (!userDoc.exists) {
      console.error('User document not found');
      await firebase.auth().signOut();
      window.location.href = '/login.html';
      return;
    }
    
    const userData = userDoc.data();
    const role = userData.role || APP_CONFIG.roles.INDIVIDUAL;
    
    // Redirect based on role
    switch(role) {
      case APP_CONFIG.roles.ADMIN:
        window.location.href = '/admin/dashboard.html';
        break;
      case APP_CONFIG.roles.BUSINESS:
        window.location.href = '/business/dashboard.html';
        break;
      case APP_CONFIG.roles.INDIVIDUAL:
      default:
        window.location.href = APP_CONFIG.defaultRedirect;
        break;
    }
  } catch (error) {
    console.error('Error checking user role:', error);
    // Fallback to default redirect
    window.location.href = APP_CONFIG.defaultRedirect;
  } finally {
    hideLoading();
  }
}

// Form validation utilities
const FormValidator = {
  // Email validation
  isValidEmail: function(email) {
    const re = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;
    return re.test(String(email).toLowerCase());
  },
  
  // Password strength validation
  isValidPassword: function(password) {
    return password.length >= 8;
  },
  
  // Show validation error
  showError: function(input, message) {
    const formGroup = input.closest('.input-group');
    const errorElement = formGroup.querySelector('.error-message') || document.createElement('div');
    
    if (!formGroup.querySelector('.error-message')) {
      errorElement.className = 'error-message text-danger mt-1 small';
      formGroup.appendChild(errorElement);
    }
    
    errorElement.textContent = message;
    input.classList.add('is-invalid');
  },
  
  // Clear validation error
  clearError: function(input) {
    const formGroup = input.closest('.input-group');
    const errorElement = formGroup.querySelector('.error-message');
    
    if (errorElement) {
      errorElement.textContent = '';
    }
    
    input.classList.remove('is-invalid');
  },
  
  // Validate entire form
  validateForm: function(form) {
    let isValid = true;
    const inputs = form.querySelectorAll('input[required]');
    
    inputs.forEach(input => {
      if (!input.value.trim()) {
        this.showError(input, 'This field is required');
        isValid = false;
      } else if (input.type === 'email' && !this.isValidEmail(input.value)) {
        this.showError(input, 'Please enter a valid email address');
        isValid = false;
      } else if (input.type === 'password' && !this.isValidPassword(input.value)) {
        this.showError(input, 'Password must be at least 8 characters');
        isValid = false;
      } else {
        this.clearError(input);
      }
    });
    
    return isValid;
  }
};

// Handle form submissions
document.querySelectorAll('form').forEach(form => {
  form.addEventListener('submit', async function(e) {
    e.preventDefault();
    
    // Validate form
    if (!FormValidator.validateForm(this)) {
      return;
    }
    
    // Show loading
    showLoading();
    
    try {
      // Get form data
      const formData = new FormData(this);
      const email = formData.get('email');
      const password = formData.get('password');
      
      // Determine form type from ID or action
      if (this.id === 'loginForm') {
        // Handle login
        await handleLogin(email, password);
      } else if (this.id === 'signupForm') {
        // Handle signup
        await handleSignup(email, password, formData);
      }
    } catch (error) {
      console.error('Form submission error:', error);
      // Show error to user (implement error display logic)
      alert('Error: ' + error.message);
    } finally {
      hideLoading();
    }
  });
});

// Login handler
async function handleLogin(email, password) {
  try {
    await firebase.auth().signInWithEmailAndPassword(email, password);
    // Success - redirect handled by auth state observer
  } catch (error) {
    throw new Error('Login failed: ' + error.message);
  }
}

// Signup handler
async function handleSignup(email, password, formData) {
  try {
    // Create user account
    const userCredential = await firebase.auth().createUserWithEmailAndPassword(email, password);
    const user = userCredential.user;
    
    // Create user document in Firestore
    await firebase.firestore().collection('users').doc(user.uid).set({
      email: email,
      role: APP_CONFIG.roles.INDIVIDUAL, // Default role
      createdAt: firebase.firestore.FieldValue.serverTimestamp(),
      // Add other user fields from form
      displayName: formData.get('displayName') || ''
    });
    
    // Success - redirect handled by auth state observer
  } catch (error) {
    throw new Error('Signup failed: ' + error.message);
  }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', initializeApp);

// Export for testing (optional)
if (typeof module !== 'undefined') {
  module.exports = {
    APP_CONFIG,
    FormValidator,
    initializeApp,
    checkUserRole
  };
}

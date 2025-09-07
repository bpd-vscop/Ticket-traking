// Global fetch interceptor to handle 431 errors
let interceptorInitialized = false;

export function initializeFetchInterceptor() {
  if (typeof window === 'undefined' || interceptorInitialized) return;
  
  const originalFetch = window.fetch;
  
  window.fetch = async function(...args) {
    try {
      const response = await originalFetch.apply(this, args);
      
      // Check for 431 status code
      if (response.status === 431) {
        console.log('431 error detected, clearing session...');
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Clear storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Reload the page to start fresh
        window.location.href = '/auth-error';
        
        // Return a rejected promise to prevent further processing
        return Promise.reject(new Error('Session cleared due to 431 error'));
      }
      
      return response;
    } catch (error) {
      // Check if the error is related to request headers being too large
      if (error instanceof TypeError && 
          (error.message.includes('431') || 
           error.message.includes('Request Header Fields Too Large') ||
           error.message.includes('ERR_HTTP_RESPONSE_CODE_FAILURE'))) {
        
        console.log('Request header error detected, clearing session...');
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Clear storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to error page
        window.location.href = '/auth-error';
        
        return Promise.reject(error);
      }
      
      throw error;
    }
  };
  
  interceptorInitialized = true;
}

// Also intercept XMLHttpRequest for older requests
export function interceptXHR() {
  if (typeof window === 'undefined') return;
  
  const originalOpen = XMLHttpRequest.prototype.open;
  const originalSend = XMLHttpRequest.prototype.send;
  
  XMLHttpRequest.prototype.open = function(method, url, ...args) {
    this._method = method;
    this._url = url;
    return originalOpen.apply(this, [method, url, ...args]);
  };
  
  XMLHttpRequest.prototype.send = function(...args) {
    this.addEventListener('error', function() {
      if (this.status === 431) {
        console.log('XHR 431 error detected, clearing session...');
        
        // Clear all cookies
        document.cookie.split(";").forEach(function(c) { 
          document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/"); 
        });
        
        // Clear storage
        localStorage.clear();
        sessionStorage.clear();
        
        // Redirect to error page
        window.location.href = '/auth-error';
      }
    });
    
    return originalSend.apply(this, args);
  };
}
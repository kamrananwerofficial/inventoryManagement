import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/authService';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
   email = '';
  password = '';
  constructor(private auth: AuthService) {}

  loginWithGoogle() {
    this.auth.login();
  }
  ngOnInit(): void {
    // Check if user is already logged in
    if (this.auth.isLoggedIn()) {
      // Redirect to dashboard or home page
      window.location.href = '/dashboard';
    }
    else {
      localStorage.removeItem('user'); // Clear any previous user data
      localStorage.removeItem('token'); // Clear any previous token data
      localStorage.removeItem('currency'); // Clear any previous currency data
    }
  }
}
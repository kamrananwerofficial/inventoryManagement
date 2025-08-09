import { Component, OnInit } from '@angular/core';
import { AuthService } from 'src/app/services/authService';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
})
export class LoginComponent {
  loginmodel: any = {};
  signUpModel: any = {};
  loginForm: boolean = true; // Flag to control form visibility
  constructor(private auth: AuthService) {}
register(): void {
      if(this.signUpModel.password.length < 6) {
      alert('Password must be at least 6 characters long.');
      return;
    }
    if(!this.signUpModel.email) {
      alert('Please enter email address.');
      return;
    }
    if(!this.signUpModel.email.includes('@')) {
      alert('Please enter a valid email address.');
      return;
    }
    if(!this.signUpModel.name) {
      alert('Name is required.');
    }
    if(this.signUpModel.password !== this.signUpModel.confirmPassword) {
      alert('Passwords do not match.');
      return;
    }
    if(!this.signUpModel.companyName) {
      alert('Company Name is required.');
      return;
    }
    this.signUpModel.email = this.signUpModel.email.toLowerCase(); // Normalize email
    this.signUpModel.username = this.signUpModel.username.toLowerCase(); // Normalize username
    this.signUpModel.name = this.signUpModel.name.trim(); // Trim whitespace
    this.signUpModel.password = this.signUpModel.password.trim(); // Trim whitespace
    this.signUpModel.companyName = this.signUpModel.companyName.trim(); // Trim whitespace
    this.auth.register(this.signUpModel);
  }
  loginWithGoogle() {
    this.auth.login(this.loginmodel);
  }
  ngOnInit(): void {
      localStorage.removeItem('user'); // Clear any previous user data
      localStorage.removeItem('token'); // Clear any previous token data
      localStorage.removeItem('currency'); // Clear any previous currency data
  }
}
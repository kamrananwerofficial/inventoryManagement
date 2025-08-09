import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Injectable({ providedIn: 'root' })
export class AuthService {

  private apiUrl = 'http://localhost:5000/api/auth'; // Apne backend ka URL yahan set karein

  constructor(private router: Router, private http: HttpClient) {}

  async register(signUpModel: any): Promise<void> {
      if (!signUpModel.email || !signUpModel.password || !signUpModel.name || !signUpModel.username || !signUpModel.companyName) {
        alert('All fields are required.');
        return;
      }

      if (signUpModel.password.length < 6) {
        alert('Password must be at least 6 characters long.');
        return;
      }

      const payload = {
        fullName: signUpModel.name.trim(),
        companyName: signUpModel.companyName.trim(),
        email: signUpModel.email.toLowerCase().trim(),
        username: signUpModel.username.trim(),
        password: signUpModel.password.trim()
      };

await this.http.post(`${this.apiUrl}/register`, payload).subscribe({
  next: () => {
    alert('Registration successful! Please login.');
    this.router.navigate(['/login']);
  },
  error: (error) => {
    alert(error?.error || 'Registration failed. Please try again.');
    console.error('Registration Error:', error);
  }
});
  }

  async login(loginModel: any): Promise<void> {
    try {
      if (!loginModel.username || !loginModel.password) {
        alert('Username and password are required.');
        return;
      }

      const payload = {
        username: loginModel.username.trim(),
        password: loginModel.password.trim()
      };

      const res: any = await this.http.post(`${this.apiUrl}/login`, payload, { responseType: 'text' }).toPromise();
      const returnObject = JSON.parse(res);
      if (!returnObject || !returnObject.token || !returnObject.user) {
        throw new Error('Invalid response from server');
      }
      localStorage.setItem('token', returnObject.token);
      localStorage.setItem('user', JSON.stringify(returnObject.user));

      // First-time currency setup
      if (!localStorage.getItem('currency')) {
        const currencyInput = prompt("Which currency will you use? (e.g., USD, PKR, EUR)");
        const currency = currencyInput ? currencyInput.toUpperCase() : 'USD';
        localStorage.setItem('currency', currency);
      }

      this.router.navigate(['/dashboard']);
    } catch (error: any) {
      alert(error?.error || 'Login failed. Please try again.');
      console.error('Login Error:', error);
    }
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }

  getCurrency(): string {
    return localStorage.getItem('currency') || 'USD';
  }
}
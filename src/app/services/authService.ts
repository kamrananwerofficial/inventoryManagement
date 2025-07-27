import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { GoogleAuthProvider, signInWithPopup, getAuth, signOut } from "firebase/auth";
import { initializeApp } from "firebase/app";
import { environment } from 'src/environments/environment';
import { AngularFireAuth } from '@angular/fire/compat/auth';

@Injectable({ providedIn: 'root' })
export class AuthService {
  auth = getAuth(initializeApp(environment.firebase));
  provider = new GoogleAuthProvider();

  constructor(private router: Router,private afAuth: AngularFireAuth) {}
  async googleLogin() {
    const provider = new GoogleAuthProvider();
    const result = await this.afAuth.signInWithPopup(provider);

    // Check if user has password auth
    const methods = await this.afAuth.fetchSignInMethodsForEmail(result.user?.email || '');
    if (!methods.includes('password')) {
      // Redirect to password set page
      return { needsPasswordSetup: true };
    }

    return { needsPasswordSetup: false };
  }

  async setPassword(email: string, password: string) {
    const user = await this.afAuth.currentUser;
    const credential = GoogleAuthProvider.credential(email, password);

    return user?.linkWithCredential(credential); // 👈 links password to Google account
  }

  loginWithEmailPassword(email: string, password: string) {
    return this.afAuth.signInWithEmailAndPassword(email, password);
  }
  async login() {
    const result = await signInWithPopup(this.auth, this.provider);
    const user = result.user;
    
    // Token and currency storage
    localStorage.setItem('token', await user.getIdToken());
    localStorage.setItem('user', JSON.stringify({ name: user.displayName, email: user.email }));

    // If first time, ask for currency
    if (!localStorage.getItem('currency')) {
      const currencyInput = prompt("Which currency will you use? (e.g., USD, PKR, EUR)");
      const currency = currencyInput ? currencyInput.toUpperCase() : 'USD';
      localStorage.setItem('currency', currency);
    }
    this.googleLogin().then(res => {
  if (res.needsPasswordSetup) {
    // Redirect to /set-password component
    const createPassword = prompt("Set a password for your account:");
    if (createPassword) {
      this.setPassword(user.email || '', createPassword).then(() => {
        this.router.navigate(['/dashboard']);
      }).catch(error => {
        console.error("Error setting password:", error);
        alert("Failed to set password. Please try again.");
      });
    } else {
      alert("Password setup cancelled.");
      this.router.navigate(['/login']);
    }
  } else {
    // Normal dashboard
    this.router.navigate(['/dashboard']);
  }
});
  }

  logout() {
    signOut(this.auth);
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

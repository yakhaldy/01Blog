import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Api } from '../../services/api';
import { Logo } from '../../shared/logo/logo';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, Logo, RouterModule, CommonModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  firstName = '';
  lastName = '';
  username = '';
  email = '';
  password = '';
  confirmPassword = '';
  about = '';
  gender = '';
  age: number | null = null;
  photo: File | null = null;
  
  // Password validation properties
  passwordStrengthClass = '';
  passwordMatchClass = '';
  passwordMatchMessage = '';

  constructor(private api: Api) { }

  onRegister() {
    if (!this.isFormValid()) {
      alert('Please fill in all required fields correctly.');
      return;
    }

    const formData = new FormData();
    formData.append('firstName', this.firstName);
    formData.append('lastName', this.lastName);
    formData.append('username', this.username);
    formData.append('email', this.email);
    formData.append('password', this.password);
    formData.append('about', this.about);
    formData.append('gender', this.gender);
    formData.append('age', this.age?.toString() || '');
    
    if (this.photo) {
      formData.append('photo', this.photo);
    }

    // Uncomment when API is ready
    // this.api.register(formData).subscribe({
    //   next: (res: any) => {
    //     alert('Registration successful!');
    //   },
    //   error: (err) => {
    //     alert('Registration failed!');
    //     console.error(err);
    //   }
    // });

    // For demonstration
    alert('Registration form is valid and ready to submit!');
    console.log('Form data:', {
      firstName: this.firstName,
      lastName: this.lastName,
      username: this.username,
      email: this.email,
      password: this.password,
      about: this.about,
      gender: this.gender,
      age: this.age,
      photo: this.photo
    });
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.photo = event.target.files[0];
      
      // Validate file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (this.photo && this.photo.size > maxSize) {
        alert('File size must be less than 5MB');
        this.photo = null;
        event.target.value = '';
        return;
      }
      
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (this.photo && !allowedTypes.includes(this.photo.type)) {
        alert('Please select a valid image file (JPEG, PNG, GIF, or WebP)');
        this.photo = null;
        event.target.value = '';
        return;
      }
    }
  }

  checkPasswordStrength() {
    const password = this.password;
    let strength = 0;
    
    if (password.length >= 8) strength++;
    if (password.match(/[a-z]/)) strength++;
    if (password.match(/[A-Z]/)) strength++;
    if (password.match(/[0-9]/)) strength++;
    if (password.match(/[^a-zA-Z0-9]/)) strength++;
    
    if (strength <= 2) {
      this.passwordStrengthClass = 'password-strength-weak';
    } else if (strength <= 3) {
      this.passwordStrengthClass = 'password-strength-medium';
    } else {
      this.passwordStrengthClass = 'password-strength-strong';
    }
  }

  checkPasswordMatch() {
    if (this.confirmPassword === '') {
      this.passwordMatchClass = '';
      this.passwordMatchMessage = '';
      return;
    }
    
    if (this.password === this.confirmPassword) {
      this.passwordMatchClass = 'show match';
      this.passwordMatchMessage = '✓ Passwords match';
    } else {
      this.passwordMatchClass = 'show no-match';
      this.passwordMatchMessage = '✗ Passwords do not match';
    }
  }

  isPasswordStrong(): boolean {
    const password = this.password;
    return password.length >= 8 &&
           password.match(/[a-z]/) !== null &&
           password.match(/[A-Z]/) !== null &&
           password.match(/[0-9]/) !== null;
  }

  isEmailValid(): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(this.email);
  }

  isFormValid(): boolean {
    return this.firstName.trim() !== '' &&
           this.lastName.trim() !== '' &&
           this.username.trim() !== '' &&
           this.email.trim() !== '' &&
           this.isEmailValid() &&
           this.password !== '' &&
           this.confirmPassword !== '' &&
           this.password === this.confirmPassword &&
           this.isPasswordStrong();
  }
}


// username = '';
//   password = '';

//   constructor(private api: Api) {}

//   onSubmit() {
//     this.api.register(this.username, this.password).subscribe(
//       res => console.log('User registered', res),
//       err => console.error(err)
//     );
//   }
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Api } from '../../services/api';
import { Logo } from '../../shared/logo/logo';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, Logo, RouterModule],
  templateUrl: './register.html',
  styleUrls: ['./register.css']
})
export class Register {
  firstName = '';
  lastName = '';
  photo: File | null = null;
  email = '';
  about = '';
  password = '';
  gender = '';
  age: number | null = null;
  username = '';

  constructor(private api: Api) { }

  onRegister() {
    const formData = new FormData();
    formData.append('firstName', this.firstName);
    formData.append('lastName', this.lastName);
    if (this.photo) formData.append('photo', this.photo);
    formData.append('email', this.email);
    formData.append('about', this.about);
    formData.append('password', this.password);
    formData.append('gender', this.gender);
    formData.append('age', this.age?.toString() || '');
    formData.append('username', this.username);

    // this.api.register(formData).subscribe({
    //   next: (res: any) => {
    //     alert('Registration successful!');
    //   },
    //   error: (err) => {
    //     alert('Registration failed!');
    //     console.error(err);
    //   }
    // });
  }

  onFileChange(event: any) {
    if (event.target.files.length > 0) {
      this.photo = event.target.files[0];
    }
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
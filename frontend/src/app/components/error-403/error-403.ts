import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common';
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-error-403',
  imports: [],
  templateUrl: './error-403.html',
  styleUrl: './error-403.css'
})
export class Error403 {
    constructor(
    private router: Router,
    private location: Location,
    private dialogRef: MatDialogRef<Error403>
  ) {}

  goHome(): void {
    this.dialogRef.close(); 
    setTimeout(() => {
      this.router.navigate(['/']);
      // window.location.reload();
    }, 100); 
  }

  goBack(): void {
    this.dialogRef.close();
    setTimeout(() => {
      this.location.back();
    }, 100);
  }

  goToLogin(): void {
    this.dialogRef.close();
    setTimeout(() => {
      this.router.navigate(['/login']);
    }, 100); 
  }

 
}

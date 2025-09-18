import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { Location } from '@angular/common'
import { MatDialogRef } from '@angular/material/dialog';

@Component({
  selector: 'app-error-500',
  imports: [],
  templateUrl: './error-500.html',
  styleUrl: './error-500.css'
})
export class Error500 {
 constructor(
    private router: Router,
    private location: Location,
    private dialogRef: MatDialogRef<Error500>
  ) {}

  goHome(): void {
    this.dialogRef.close(); 
    setTimeout(() => {
      this.router.navigate(['/']);
     
    }, 100); 
  }

  goBack(): void {
    this.dialogRef.close();
    setTimeout(() => {
      this.location.back();
    }, 100);
  }

  refreshPage(): void {
    this.dialogRef.close();
    setTimeout(() => {
      window.location.reload();
    }, 100);
  }
}

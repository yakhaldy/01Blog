import { Component, Inject, signal, computed, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { HttpErrorResponse } from '@angular/common/http';

import { Auth } from '../../service/auth';
import { ToastService } from '../../service/toast-service';
import { ErrorHandlerService } from '../../helper/handleError';
import { log } from 'console';

export interface ReportDialogData {
  type: 'user' | 'post';
  targetId: string | number;
  targetName?: string; // Optional: username or post title for display
}

export interface ReportDialogResult {
  success: boolean;
  reason?: string;
}

@Component({
  selector: 'app-report-dialog',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatProgressSpinnerModule
  ],
  templateUrl: './report-dialog.html',
  styleUrls: ['./report-dialog.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ReportDialog {
  reportReason = signal('');
  isSubmitting = signal(false);

  // Computed signals for validation
  isReasonValid = computed(() => {
    const reason = this.reportReason().trim();
    return reason.length >= 10 && reason.length <= 500;
  });

  characterCount = computed(() => this.reportReason().length);
  isCharacterLimitExceeded = computed(() => this.characterCount() > 500);

  constructor(
    public dialogRef: MatDialogRef<ReportDialog>,
    @Inject(MAT_DIALOG_DATA) public data: ReportDialogData,
    private auth: Auth,
    private toastService: ToastService,
    private errorHandler: ErrorHandlerService
  ) {}

  // Helper methods for ngModel with signals
  getReportReason(): string {
    return this.reportReason();
  }

  setReportReason(value: string): void {
    this.reportReason.set(value);
  }

  getDialogTitle(): string {
    return this.data.type === 'user' ? 'Report User' : 'Report Post';
  }

  getDialogDescription(): string {
    if (this.data.type === 'user') {
      return this.data.targetName 
        ? `You are reporting user: ${this.data.targetName}`
        : 'Please describe why you are reporting this user';
    } else {
      return 'Please describe why you are reporting this post';
    }
  }

  cancel(): void {
    this.dialogRef.close({ success: false });
  }

  submit(): void {
    if (!this.isReasonValid() || this.isSubmitting()) {
      return;
    }

    this.isSubmitting.set(true);
    const reason = this.reportReason().trim();

    if (this.data.type === 'user') {
      this.submitUserReport(reason);
    } else if (this.data.type === 'post') {
      this.submitPostReport(reason);
    }
  }

  private submitUserReport(reason: string): void {
    this.auth.Report({
      reportedId: this.data.targetId,
      reportReason: reason
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.show('User reported successfully', 'success');
        this.dialogRef.close({ success: true, reason });
      },
      error: (error: HttpErrorResponse) => {
        this.isSubmitting.set(false);
        this.errorHandler.handle(error, 'Failed to submit report');
        this.dialogRef.close({ success: false });
      }
    });
  }

  private submitPostReport(reason: string): void {
    
    this.auth.ReportPost({
      reportedId: this.data.targetId,
      reportReason: reason
    }).subscribe({
      next: () => {
        this.isSubmitting.set(false);
        this.toastService.show('Post reported successfully', 'success');
        this.dialogRef.close({ success: true, reason });
      },
      error: (error: HttpErrorResponse) => {        
        this.isSubmitting.set(false);
        this.errorHandler.handle(error, 'Failed to submit report');
        this.dialogRef.close({ success: false });
      }
    });
  }
}

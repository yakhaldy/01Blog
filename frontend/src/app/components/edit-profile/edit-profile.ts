import { Component, Inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Auth } from '../../service/auth'
import { isValidMediaType, isValidMediaSize } from '../../helper/postHleper';
import { HttpErrorResponse } from '@angular/common/http';
import { ErrorHandlerService } from '../../helper/handleError';
import { ToastService } from '../../service/toast-service';
import { getErrorMessage } from '../../model/error-response.model';
interface UpdateProfileData {
  username: string;
  AvatarUrl?: string | null;
  bio?: string;
}

interface ProfileUpdate {
  username: string;
  bio: string;
  avatarFile?: File;
}

@Component({
  selector: 'app-edit-profile',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule
  ],
  templateUrl: './edit-profile.html',
  styleUrl: './edit-profile.css'
})
export class EditProfile {
  profileUpdate = signal<ProfileUpdate>({
    username: '',
    bio: '',
    avatarFile: undefined
  });
  isError = signal(false);
  errorback = signal("");
  selectedFileName = signal('');
  currentAvatarUrl = signal('');

  constructor(
    private auth: Auth,
    public dialogRef: MatDialogRef<EditProfile>,
    @Inject(MAT_DIALOG_DATA) public data: UpdateProfileData,
    private errorHandler: ErrorHandlerService,
    private toastService: ToastService
  ) {
    this.profileUpdate.set({
      username: this.data.username || '',
      bio: this.data.bio || '',
      avatarFile: undefined
    });
    this.currentAvatarUrl.set(this.data.AvatarUrl || '');
  }

  save() {
    if (!this.isProfileValid()) {
      return;
    }
    const profile = this.profileUpdate();
    if (!/^[A-Za-z_]+$/.test(profile.username)) {
      this.errorback.set('Username must contain only letters A–Z and underscores.');
      this.isError.set(true);
      return;
    }

    const result = {
      user: null,
      avatarFile: profile.avatarFile,
      removeCurrentImage: this.shouldRemoveCurrentAvatar()
    };

    const updateData = new FormData();
    updateData.append('username', profile.username.trim());
    updateData.append('bio', profile.bio);

    if (result.avatarFile) {
      updateData.append('avatarFile', result.avatarFile);
    }

    if (result.removeCurrentImage) {
      updateData.append('removeImage', 'true');
    }

    this.auth.updateProfile(updateData).subscribe({
      next: (updateProfile) => {
        result.user = updateProfile;
        // this.toastService.show('Profile updated successfully!', 'success');
        this.dialogRef.close(result);
      },
      error: (error: HttpErrorResponse) => {
        this.isError.set(true);
        this.errorHandler.handle(error, 'Failed to update profile');
        this.errorback.set(getErrorMessage(error));
      }
    });

  }

  cancel() {
    this.dialogRef.close();
  }

  isProfileValid(): boolean {
    const profile = this.profileUpdate();
    return profile.username.trim().length > 0 &&
      profile.username.length <= 30 &&
      profile.bio.length <= 200;
  }

  isUsernameLimitExceeded(): boolean {
    return this.profileUpdate().username.length > 30;
  }

  isBioLimitExceeded(): boolean {
    return this.profileUpdate().bio.length > 200;
  }

  private shouldRemoveCurrentAvatar(): boolean {
    return this.currentAvatarUrl() === '' && this.selectedFileName() === '';
  }

  onAvatarSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!isValidMediaType(file)) {
        this.toastService.show('Invalid file type. Please select an image (JPEG, PNG, GIF)', 'error');
        return;
      }
      if (!isValidMediaSize(file)) {
        this.toastService.show('File size exceeds 10MB limit.', 'error');
        return;
      }

      this.profileUpdate.update(profile => ({ ...profile, avatarFile: file }));
      this.selectedFileName.set(file.name);
    }
  }

  removeAvatarFile(): void {
    this.profileUpdate.update(profile => ({ ...profile, avatarFile: undefined }));
    this.selectedFileName.set('');

    // Clear the file input
    const fileInput = document.getElementById('avatarInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  removeCurrentAvatar(): void {
    this.currentAvatarUrl.set('');
  }

  hasCurrentAvatar(): boolean {
    return !!this.currentAvatarUrl() && this.currentAvatarUrl().length > 0;
  }

  hasNewFile(): boolean {
    return !!this.selectedFileName() && this.selectedFileName().length > 0;
  }
  
  // Helper methods for ngModel binding
  updateUsername(value: string): void {
    this.profileUpdate.update(profile => ({ ...profile, username: value }));
  }
  
  updateBio(value: string): void {
    this.profileUpdate.update(profile => ({ ...profile, bio: value }));
  }
  
  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path)
  }
}


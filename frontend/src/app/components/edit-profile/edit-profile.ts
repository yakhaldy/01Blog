import { Component, Inject, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
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
  styleUrl: './edit-profile.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class EditProfile {
  profileUpdate: ProfileUpdate = {
    username: '',
    bio: '',
    avatarFile: undefined
  };
  isError: boolean = false;
  errorback: string = "";
  selectedFileName: string = '';
  currentAvatarUrl: string = '';

  constructor(
    private auth: Auth,
    public dialogRef: MatDialogRef<EditProfile>,
    @Inject(MAT_DIALOG_DATA) public data: UpdateProfileData,
    private cdr: ChangeDetectorRef,
  ) {
    this.profileUpdate.username = this.data.username || '';
    this.profileUpdate.bio = this.data.bio || '';
    this.currentAvatarUrl = this.data.AvatarUrl || '';
  }

  save() {
    if (!this.isProfileValid) {
      return;
    }

    const result = {
      user: null,
      avatarFile: this.profileUpdate.avatarFile,
      removeCurrentImage: this.shouldRemoveCurrentAvatar()
    };

    const updateData = new FormData();
    updateData.append('username', this.profileUpdate.username.trim());
    updateData.append('bio', this.profileUpdate.bio);

    if (result.avatarFile) {
      updateData.append('avatarFile', result.avatarFile);
    }

    if (result.removeCurrentImage) {
      updateData.append('removeImage', 'true');
    }

    this.auth.updateProfile(updateData).subscribe({
      next: (updateProfile) => {
        result.user = updateProfile;
        console.log("updateProfile :", updateProfile);
        console.log("result :", result);

        this.dialogRef.close(result);
      },
      error: (error) => {
        console.log("==>", error.error.error);
        this.isError = true;
        this.errorback = error.error.error;
        const  resultError = {
          error: error.error.error
        }
        // this.dialogRef.close(resultError);
        this.cdr.markForCheck();
      }
    });

  }

  cancel() {
    this.dialogRef.close();
  }

  get isProfileValid(): boolean {
    return this.profileUpdate.username.trim().length > 0 &&
      this.profileUpdate.username.length <= 30 &&
      this.profileUpdate.bio.length <= 200;
  }

  get isUsernameLimitExceeded(): boolean {
    return this.profileUpdate.username.length > 30;
  }

  get isBioLimitExceeded(): boolean {
    return this.profileUpdate.bio.length > 200;
  }

  private shouldRemoveCurrentAvatar(): boolean {
    return this.currentAvatarUrl === '' && this.selectedFileName === '';
  }

  onAvatarSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!isValidMediaType(file)) {
        this.isError = true;
        this.errorback = 'Invalid file type. Please select an image (JPEG, PNG, GIF)'
        setTimeout(()=>{
           this.isError = false;
           this.cdr.markForCheck();
        },1000)
        
        return;
      }
      if (!isValidMediaSize(file)) {
        this.isError = true;
        this.errorback = 'File size exceeds 10MB limit.'
        setTimeout(()=>{
           this.isError = false;
        },100)
        return;
      }

      this.profileUpdate.avatarFile = file;
      this.selectedFileName = file.name;
    }
  }

  removeAvatarFile(): void {
    this.profileUpdate.avatarFile = undefined;
    this.selectedFileName = '';

    // Clear the file input
    const fileInput = document.getElementById('avatarInput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  removeCurrentAvatar(): void {
    this.currentAvatarUrl = '';
    console.log('Current avatar removed');
  }

  hasCurrentAvatar(): boolean {
    return !!this.currentAvatarUrl && this.currentAvatarUrl.length > 0;
  }

  hasNewFile(): boolean {
    return !!this.selectedFileName && this.selectedFileName.length > 0;
  }
  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path)
  }
}


import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { isValidMediaType ,isValidMediaSize } from '../helper/postHleper'
interface UpdatePostData {
  content: string;
  imgUrl?: string | null;
  postId: number;
}

interface PostUpdate {
  description: string;
  mediaFile?: File;
}

@Component({
  selector: 'app-update-post-dialog',
  standalone: true, 
  imports: [
    CommonModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    FormsModule,
    MatIconModule,
  ],
  templateUrl: './update-post-dialog.html',
  styleUrls: ['./update-post-dialog.css']
})
export class UpdatePostDialog {
  postUpdate: PostUpdate = {
    description: '',
    mediaFile: undefined
  };
  selectedFileName: string = '';
  currentImageUrl: string = '';

  constructor(
    public dialogRef: MatDialogRef<UpdatePostDialog>,
    @Inject(MAT_DIALOG_DATA) public data: UpdatePostData
  ) {

    this.postUpdate.description = this.data.content || '';
    this.currentImageUrl = this.data.imgUrl || '';
    console.log("-----",this.currentImageUrl);
    
  }

  save() {
    if (!this.isPostValid) {
      return;
    }
    
    const result = {
      description: this.postUpdate.description.trim(),
      mediaFile: this.postUpdate.mediaFile,
      removeCurrentImage: this.shouldRemoveCurrentImage()
    };
    
    this.dialogRef.close(result);
  }

  cancel() {
    this.dialogRef.close();
  }

  get postCharacterCount(): number {
    return this.postUpdate.description.length;
  }

  get isPostValid(): boolean {
    return this.postUpdate.description.trim().length > 0 && 
           this.postUpdate.description.length <= 1000;
  }

  get isCharacterLimitExceeded(): boolean {
    return this.postUpdate.description.length > 1000;
  }

  private shouldRemoveCurrentImage(): boolean {
    return this.currentImageUrl == '' && this.selectedFileName == '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!isValidMediaType(file)) {
        alert('Invalid file type. Please select an image (JPEG, PNG, GIF) or video (MP4, WebM, AVI).');
        return;
      }
      if (!isValidMediaSize(file)) {
        alert('File size exceeds 10MB limit.');
        return;
      }

      this.postUpdate.mediaFile = file;
      this.selectedFileName = file.name;
    }
  }

  removeMediaFile(): void {
    this.postUpdate.mediaFile = undefined;
    this.selectedFileName = '';
    
    // Clear the file input
    const fileInput = document.getElementById('fileinput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  removeCurrentImage(): void {
    this.currentImageUrl = '';
    console.log('Current image removed');
  }

  hasCurrentImage(): boolean {
    return !!this.currentImageUrl && this.currentImageUrl.length > 0;
  }

  hasNewFile(): boolean {
    return !!this.selectedFileName && this.selectedFileName.length > 0;
  }
   isImage(url: string | null | undefined): boolean {
  return !!url && /\.(jpg|jpeg|png|gif)$/i.test(url);
}

 isVideo(url: string | null | undefined): boolean {
  return !!url && /\.(mp4|webm|avi)$/i.test(url);
}
}
import { Component, Inject, signal, computed } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { isValidMediaType ,isValidMediaSize } from '../helper/postHleper'
import { Auth } from '../service/auth';
import { ToastService } from '../service/toast-service';
interface UpdatePostData {
  title: string;
  content: string;
  imgUrl?: string | null;
  postId: number;
}

interface PostUpdate {
  title: string;
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
  postUpdate = signal<PostUpdate>({
    title: '',
    description: '',
    mediaFile: undefined
  });
  selectedFileName = signal('');
  currentImageUrl = signal('');
  filePreviewUrl = signal<string | null>(null);

  constructor(
    public dialogRef: MatDialogRef<UpdatePostDialog>,
    @Inject(MAT_DIALOG_DATA) public data: UpdatePostData,
    private auth: Auth,
    private toastService: ToastService
  ) {
    this.postUpdate.set({
      description: this.data.content || '',
      title: this.data.title || '',
      mediaFile: undefined
    });

    this.currentImageUrl.set(this.data.imgUrl || '');
  }

  save() {
    if (!this.isPostValid()) {
      return;
    }
    
    const currentPost = this.postUpdate();
    const result = {
      title: currentPost.title.trim(),
      description: currentPost.description.trim(),
      mediaFile: currentPost.mediaFile,
      removeCurrentImage: this.shouldRemoveCurrentImage()
    };
    
    this.dialogRef.close(result);
  }

  cancel() {
    this.dialogRef.close();
  }

  postCharacterCount = computed(() => this.postUpdate().description.length);
  
  postTitleCharacterCount = computed(() => this.postUpdate().title.length);

  isPostValid = computed(() => {
    const post = this.postUpdate();
    return post.description.trim().length > 0 && 
           post.description.length <= 5000 && 
           post.title.trim().length > 0 && 
           post.title.length <= 280;
  });

  isCharacterLimitExceeded = computed(() => this.postUpdate().description.length > 5000);
  
  isCharacterTitleLimitExceeded = computed(() => this.postUpdate().title.length > 280);
  private shouldRemoveCurrentImage(): boolean {
    return this.currentImageUrl() == '' && this.selectedFileName() == '';
  }

  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!isValidMediaType(file)) {
        this.toastService.show('Invalid file type. Please select an image (JPEG, PNG, GIF) or video (MP4, WebM, AVI).', 'error');
        return;
      }
      if (!isValidMediaSize(file)) {
        this.toastService.show('File size exceeds 10MB limit.', 'error');
        return;
      }

      // Revoke previous URL if exists
      const prevUrl = this.filePreviewUrl();
      if (prevUrl) {
        URL.revokeObjectURL(prevUrl);
      }

      // Create new preview URL
      const previewUrl = URL.createObjectURL(file);
      
      this.postUpdate.update(post => ({ ...post, mediaFile: file }));
      this.selectedFileName.set(file.name);
      this.filePreviewUrl.set(previewUrl);
    }
  }

  removeMediaFile(): void {
    // Revoke the blob URL to free memory
    const prevUrl = this.filePreviewUrl();
    if (prevUrl) {
      URL.revokeObjectURL(prevUrl);
    }
    
    this.postUpdate.update(post => ({ ...post, mediaFile: undefined }));
    this.selectedFileName.set('');
    this.filePreviewUrl.set(null);
    
    // Clear the file input
    const fileInput = document.getElementById('fileinput') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
    }
  }

  removeCurrentImage(): void {
    this.currentImageUrl.set('');
    console.log('Current image removed');
  }

  hasCurrentImage(): boolean {
    const url = this.currentImageUrl();
    return !!url && url.length > 0;
  }

  hasNewFile(): boolean {
    const fileName = this.selectedFileName();
    return !!fileName && fileName.length > 0;
  }
  isImage(url: string | null | undefined): boolean {
    return !!url && /\.(jpg|jpeg|png|gif)$/i.test(url);
  }

  isVideo(url: string | null | undefined): boolean {
    return !!url && /\.(mp4|webm|avi)$/i.test(url);
  }

  isImageFile(fileName: string | null | undefined): boolean {
    return !!fileName && /\.(jpg|jpeg|png|gif)$/i.test(fileName);
  }

  isVideoFile(fileName: string | null | undefined): boolean {
    return !!fileName && /\.(mp4|webm|avi)$/i.test(fileName);
  }

  getImage(path: string | undefined): string | undefined {
    return this.auth.getImage(path);
  }

  // Helper methods for ngModel with signals
  getTitle(): string {
    return this.postUpdate().title;
  }

  setTitle(value: string): void {
    this.postUpdate.update(post => ({ ...post, title: value }));
  }

  getDescription(): string {
    return this.postUpdate().description;
  }

  setDescription(value: string): void {
    this.postUpdate.update(post => ({ ...post, description: value }));
  }
}
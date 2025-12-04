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
  imgUrls?: string[];
  postId: number;
}

interface PostUpdate {
  title: string;
  description: string;
  mediaFiles?: File[];
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
    mediaFiles: []
  });
  selectedFileNames = signal<string[]>([]);
  currentImageUrls = signal<string[]>([]);
  filePreviewUrls = signal<string[]>([]);

  constructor(
    public dialogRef: MatDialogRef<UpdatePostDialog>,
    @Inject(MAT_DIALOG_DATA) public data: UpdatePostData,
    private auth: Auth,
    private toastService: ToastService
  ) {
    this.postUpdate.set({
      description: this.data.content || '',
      title: this.data.title || '',
      mediaFiles: []
    });

    this.currentImageUrls.set(this.data.imgUrls || []);
  }

  save() {
    if (!this.isPostValid()) {
      return;
    }
    
    const currentPost = this.postUpdate();
    const result = {
      title: currentPost.title.trim(),
      description: currentPost.description.trim(),
      mediaFiles: currentPost.mediaFiles,
      removeCurrentImage: this.shouldRemoveCurrentImage(),
      remainingImageUrls: this.currentImageUrls()
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
    return this.currentImageUrls().length === 0 && this.selectedFileNames().length === 0;
  }

  onFileSelected(event: any): void {
    const input = event.target;
    if (input.files && input.files.length > 0) {
      const currentFiles = this.postUpdate().mediaFiles || [];
      const totalImages = this.currentImageUrls().length + currentFiles.length;
      
      // Limit to 3 images total
      if (totalImages + input.files.length > 3) {
        this.toastService.show('You can upload a maximum of 3 images', 'error');
        input.value = '';
        return;
      }

      const validFiles: File[] = [];
      const validUrls: string[] = [];
      const validNames: string[] = [];

      for (let i = 0; i < input.files.length; i++) {
        const file = input.files[i];

        if (!isValidMediaType(file)) {
          this.toastService.show(`${file.name}: Invalid file type`, 'error');
          continue;
        }

        if (!isValidMediaSize(file)) {
          this.toastService.show(`${file.name}: File size exceeds 10MB`, 'error');
          continue;
        }

        validFiles.push(file);
        validUrls.push(URL.createObjectURL(file));
        validNames.push(file.name);
      }

      if (validFiles.length > 0) {
        this.postUpdate.update(post => ({ 
          ...post, 
          mediaFiles: [...currentFiles, ...validFiles] 
        }));
        this.filePreviewUrls.update(urls => [...urls, ...validUrls]);
        this.selectedFileNames.update(names => [...names, ...validNames]);
      }

      input.value = '';
    }
  }

  removeMediaFile(index: number): void {
    const urls = this.filePreviewUrls();
    if (urls[index]) {
      URL.revokeObjectURL(urls[index]);
    }

    this.postUpdate.update(post => {
      const files = [...(post.mediaFiles || [])];
      files.splice(index, 1);
      return { ...post, mediaFiles: files };
    });
    
    this.selectedFileNames.update(names => {
      const newNames = [...names];
      newNames.splice(index, 1);
      return newNames;
    });
    
    this.filePreviewUrls.update(urls => {
      const newUrls = [...urls];
      newUrls.splice(index, 1);
      return newUrls;
    });
  }

  removeCurrentImage(index: number): void {
    this.currentImageUrls.update(urls => {
      const newUrls = [...urls];
      newUrls.splice(index, 1);
      return newUrls;
    });
  }

  hasCurrentImages(): boolean {
    return this.currentImageUrls().length > 0;
  }

  hasNewFiles(): boolean {
    return this.selectedFileNames().length > 0;
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
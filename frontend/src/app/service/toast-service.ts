import { Injectable } from '@angular/core';
import { Toast } from '../components/toast/toast'; 

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastComponent!: Toast;

  register(toastComponent: Toast) {
    this.toastComponent = toastComponent;
  }

  show(message: string, type: 'success' | 'error' | 'info' = 'info') {
    if (this.toastComponent) {
      this.toastComponent.show(message, type);
    } else {
      console.warn('ToastComponent is not registered yet.');
    }
  }
}
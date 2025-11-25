import { CommonModule } from '@angular/common';
import { Component, signal } from '@angular/core';

interface ToastMsg {
  message: string;
  type: 'success' | 'error' | 'info';
  id: number;
}

@Component({
  selector: 'app-toast',
  imports: [CommonModule],
  templateUrl: './toast.html',
  styleUrl: './toast.css'
})
export class Toast {
  toasts = signal<ToastMsg[]>([]);

  show(message: string, type: ToastMsg['type'] = 'info') {
    const id = Date.now();
    this.toasts.update(toasts => [...toasts, { message, type, id }]);

    // Auto-remove after 3.5 seconds
    setTimeout(() => {
      this.toasts.update(toasts => toasts.filter(t => t.id !== id));
    }, 3500);
  }
}

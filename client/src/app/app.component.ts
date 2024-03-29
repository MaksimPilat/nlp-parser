import { NgFor, NgIf, TitleCasePipe } from '@angular/common';
import { Component } from '@angular/core';
import { NlpService, NlpResponse } from '../services/nlp.service';
import { ModalService } from '../services/modal.service';
import { Word } from '../models/chunk';
import { ChunkFilterModal } from '../components/chunk-filter-modal/chunk-filter-modal.component';
import { ChunkFilterService } from '../services/chunk-filter.service';
import { InfoModal } from '../components/info-modal/info-modal.component';
import { ErrorService } from '../services/error.service';
import { finalize } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { TabService } from '../services/tab.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [TitleCasePipe, NgFor, NgIf, ChunkFilterModal, InfoModal],
  templateUrl: './app.component.html',
})
export class AppComponent {
  title = 'nlp parser';
  data: NlpResponse = { sentence: '', chunks: [], tree: '' };
  isLoading = false;
  toolbox: Word | null = null;

  constructor(
    private nlpService: NlpService,
    public modalService: ModalService,
    public chunkFilterService: ChunkFilterService,
    public errorService: ErrorService,
    public tabService: TabService
  ) {}

  async onFileSelected(event: Event) {
    this.errorService.clearState();
    const inputElement = event.target as HTMLInputElement;

    if (inputElement.files && inputElement.files.length > 0) {
      this.isLoading = true;
      const file = inputElement.files[0];

      const upload$ = this.nlpService.parseFile(file);
      upload$
        .pipe(
          finalize(() => {
            this.isLoading = false;
          })
        )
        .subscribe({
          next: (value: NlpResponse) => {
            this.data = value;
          },
          error: (err: HttpErrorResponse) => {
            this.data.chunks = [];
            this.errorService.setTempState({
              status: err.status,
              message: err.error.message,
            });
          },
        });
    }
  }

  downloadFile() {
    const jsonContent = JSON.stringify(this.data, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'chunks.json';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  filterChunks() {
    return this.data.chunks.filter((chunk) =>
      this.chunkFilterService
        .getRoles()
        .find((role) => role.role === chunk.role && role.isSelected)
    );
  }
}

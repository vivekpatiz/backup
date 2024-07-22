import { Component } from '@angular/core';
import { FormBuilder, FormGroup } from '@angular/forms';

@Component({
    selector: 'app-upload-loan-document',
    templateUrl: './upload-loan-document.component.html',
    styleUrls: ['./upload-loan-document.component.css']
})
export class UploadLoanDocumentComponent {
    uploadDocForm: FormGroup;
    uploadedFiles: any[] = [];
    fileuploadError: boolean = false;
    uploadSuc: boolean = false;
    docUploadToUi: boolean = false;
    docUploadToUiProgress: boolean = false;
    fileName: string;

    constructor(private fb: FormBuilder) {
        this.uploadDocForm = this.fb.group({
            uploadFile: ['']
        });
    }

    uploadFile(event: any) {
        for (let i = 0; i < event.length; i++) {
            this.uploadedFiles.push(event[i]);
        }
        this.uploadSuc = true;
    }

    onPreviewClick(file: any) {
        const url = window.URL.createObjectURL(file);
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = file.name;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
    }

    onDeleteUploadedFile(index: number) {
        this.uploadedFiles.splice(index, 1);
    }

    sendMail() {
        console.log(this.uploadedFiles);
        // Additional logic for sending the email with the uploaded files
    }
import { Component } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {

  onFilesChange(event: any) {
    const files = event.target.files;
    if (files.length) {
      this.convertFilesToBase64(files);
    }
  }

  private convertFilesToBase64(files: FileList) {
    const fileReaders: Promise<any>[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      fileReaders.push(this.readFileAsBase64(file));
    }

    Promise.all(fileReaders).then(base64Strings => {
      console.log(base64Strings); // Array of base64 strings for each file
    }).catch(error => {
      console.error('Error reading files:', error);
    });
  }

  private readFileAsBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64String = (reader.result as string).split(',')[1];
        resolve(base64String);
      };
      reader.onerror = (error) => {
        reject(error);
      };
      reader.readAsDataURL(file);
    });
  }
}
}

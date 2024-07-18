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
}


import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { CommonModule } from '@angular/common';
import { BrowserModule } from '@angular/platform-browser';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { UploadLoanDocumentComponent } from './upload-loan-document';
import { UploadLoanDocumentRoutingModule } from './upload-loan-document.routing.module';
import { WidescreenSharedModule } from '../_shared/widescreen-shared.module';

@NgModule({
    declarations: [
        UploadLoanDocumentComponent
    ],
    imports: [
        CommonModule, ReactiveFormsModule,
        WidescreenSharedModule, FormsModule,UploadLoanDocumentRoutingModule
    ]
})
export class UploadLoanDocumentModule {
    constructor() {

    }
}

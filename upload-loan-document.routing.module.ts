import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { UploadLoanDocumentComponent } from './upload-loan-document';
import { UIGuard } from 'app/ui-loader/ui-guard.service';

let UploadRoutes: Routes = [
    {
        path: '', component: UploadLoanDocumentComponent,canDeactivate: [UIGuard]
    }, {
        path: 'upload-loan-document', component: UploadLoanDocumentComponent,canDeactivate: [UIGuard]
    },
];

@NgModule({
    imports: [
        RouterModule.forChild(
            UploadRoutes
        )
    ],
    exports: [
        RouterModule
    ]
})

export class UploadLoanDocumentRoutingModule {
    constructor() {
    }
}

import { Component, NgZone } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';
import { AppConfig } from 'app/app.config';
import { Router } from '@angular/router';
import { TranslateService } from '@ngx-translate/core';
import { Input, EventEmitter, Output, OnInit ,OnChanges } from '@angular/core';
import { DataCarrier, ExceptionHandler } from '@framework/index';
import { MessageImplComponent } from '../_shared/component/message-impl-component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import * as $ from 'jquery';
import { Utils } from 'app/utility/utils';
import { SecureMessageComposeModel } from 'core/retail/ui/widescreen/app/module/secure-message/view-model/secure-message-compose.model';
import { SecureMessageComposeVL } from '../secure-message/service/secure-message-compose.vl.service';
import { Loader } from 'core/retail/ui/widescreen/app/module/_shared/component/loader-generic';
import { finalize } from 'rxjs/operators';
@Component({
    selector: 'upload-loan-document',
    templateUrl: './upload-loan-document.component.html',
    styleUrls: ['./upload-loan-document.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class UploadLoanDocumentMBComponent {
    config = AppConfig.getInstance().getConfig();
       
    appConfig = AppConfig.getInstance().getMasterConfig();
    uploadDocForm: FormGroup;

    imgSrcData: any = "";
    docUploadToUi: boolean = false;
    docUploadToUiProgress: boolean = false;
    filetype: any;
    reader: FileReader;
    isUploaded: boolean = false;
    fileName: any;
    fileuploadError: boolean = false;
    dataCarrier = DataCarrier.getInstance();
    messageOptions: MessageImplComponent;
    utils: Utils;
    secureMessageComposeObject:SecureMessageComposeModel;
    validFile:boolean;
    uploadedFileBase64: any[];
    uploadedFiles: any;
    constructor(private router: Router, private translate: TranslateService, protected fb: FormBuilder,  private zone:NgZone) {
        this.utils = Utils.getInstance();
        this.messageOptions = new MessageImplComponent();
        this.secureMessageComposeObject = new SecureMessageComposeModel();
        this.createUploadDocForm();
    }

    createUploadDocForm(){
        this.uploadDocForm = this.fb.group({
            uploadFile: ['', Validators.required]
        });
    }
    uploadFile(event) {
    let fileSize = 0;
    for (let j = 0; j < event.length; j++) {
        fileSize += event[j].size;
    }
    console.log(event, "event");
    this.messageOptions.options.showMessageContent = false;
    const _this = this;
    let filebase64 = [];
    this.uploadedFileBase64 = [];
    let promises = [];

    for (let i = 0; i < event.length; i++) {
        this.messageOptions.options.showMessageContent = false;
        if (event[i] && (event[i].type == "image/jpeg" || event[i].type == "application/pdf" || event[i].type == "image/png")) {
            if (fileSize > 5000000) {
                this.messageOptions.options.showMessageContent = true;
                this.messageOptions.options.isGeneric = false;
                this.messageOptions.options.messageType = "error";
                this.messageOptions.options.message = "Please select a file with size less than 5MB.";
                this.validFile = false;
            } else {
                this.validFile = true;
                this.isUploaded = true;
                this.fileuploadError = false;
                this.uploadedFiles.push(event[i]);
                let promise = this.readAsDataURL(event[i]).then(result => {
                    _this.imgSrcData = result;
                    if (event[i].type) {
                        if (event[i].type.includes('png') || event[i].type.includes('jpg') || event[i].type.includes('jpeg')) {
                            let imageObj = new Image();
                            let text = '';
                            if (event[i].type.includes('jpg') || event[i].type.includes('jpeg')) {
                                text = 'image/jpeg';
                            } else {
                                text = 'image/png';
                            }
                            imageObj.onload = function () {
                                _this.compressImage(imageObj, text);
                            };
                            imageObj.src = _this.imgSrcData;
                            filebase64.push(_this.imgSrcData);
                        } else {
                            filebase64.push(_this.imgSrcData);
                        }
                    }
                    _this.docUploadToUi = true;
                    _this.docUploadToUiProgress = false;
                });
                promises.push(promise);
            }
        } else {
            Loader.stop();
            this.messageOptions.options.showMessageContent = true;
            this.messageOptions.options.isGeneric = false;
            this.messageOptions.options.messageType = "error";
            this.messageOptions.options.message = "The selected file cannot be uploaded. Only files with the following extensions are supported : .jpeg,.pdf,.png";
        }
    }

    Promise.all(promises).then(() => {
        _this.uploadedFileBase64 = filebase64;
        console.log(filebase64, 'filebase6666666');
        for (let k = 0; k < filebase64.length; k++) {
            _this.uploadedFiles[k]['base64'] = filebase64[k];
        }
        _this.dataCarrier.setCarrier("uploadedFiles", _this.uploadedFiles);
        console.log(_this.uploadedFiles, "this.uploadedFilesthis.uploadedFiles");
        _this.uploadDocForm.patchValue({
            uploadFile: _this.uploadedFileBase64
        });
    }).catch(error => {
        console.error("Error processing files:", error);
    });
}

    checkFileTypeValidity(fileType,name){
        let obj = this;
        let validity = false;
        if(this.filetype && this.filetype.length>0){
            Object.keys(obj.filetype).map(function(key){
               if(obj.filetype[key].Code == fileType){
                    validity = true;
               } else{
                    validity = validity?validity:false;
               }              
            });
            return validity;
        }
    }
    readAsDataURL(file) {
        const _this = this
        return new Promise((resolve, reject) => {
            let fr = new FileReader();
            const realFileReader = (fr as any)._realReader;
            if (realFileReader) {
                fr = realFileReader;
            }
            _this.zone.runOutsideAngular(() => {
                _this.zone.run(() => { 
                    fr.onerror = reject;
                    fr.onload = () => {
                        resolve(fr.result);
                    }                    
                });
            });
            _this.zone.runOutsideAngular(() => {
                _this.zone.run(() => { 
                    fr.onerror = reject;
                    fr.onload = () => {
                        _this.zone.runOutsideAngular(() => {
                            _this.zone.run(() => { 
                            resolve(fr.result);
                        });
                    });
                    }                    
                });
            });
            fr.readAsDataURL(file);
        });
    }
    initializeFileReader() {
        const _this = this;
        //Reading Image file, encode and display
        _this.reader = new FileReader();

        _this.reader.onloadend = function (fileLoadedEvent: any) {
            _this.imgSrcData = fileLoadedEvent.target.result;
             //console.log(_this.imgSrcData, "imgSrcData base 64");// <--- data: base64 
            _this.dataCarrier.setCarrier('fileUploadedAsBase64', _this.imgSrcData);
            _this.docUploadToUi = true;
            _this.docUploadToUiProgress = false;
            // const linkSource =  _this.imgSrcData;
            // const fileName = _this.fileName;
            // const downloadLink = document.createElement("a");  
            // downloadLink.href = linkSource;
            // downloadLink.download = download;
            // downloadLink.text = fileName;
            // $('.icon-file-upload-preview').append(downloadLink);
            // $('#previewLink').attr('href',linkSource);
            // $('#previewLink').attr('download',fileName);

        }

        _this.reader.onprogress = function (data) {
            if (data.lengthComputable) {
                _this.docUploadToUiProgress = true;
                let progress = `${data.type}: ${data.loaded} bytes transferred\n`;
                // var iProgress = parseInt(data.loaded / data.total * 100, 10);
                var iProgress = data.loaded / data.total * 100;
                $('#progress div').css('width', iProgress + '%');
                // console.log(progress);
                // console.log(iProgress);

            }
        }
    }
    compressImage(imgToCompress,text) {
        // resizing the image
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");
        
        const originalWidth = imgToCompress.width;
        const originalHeight = imgToCompress.height;
        const resizingFactor = 0.8;
        const quality = 0.8;
        const canvasWidth = originalWidth * resizingFactor;
        const canvasHeight = originalHeight * resizingFactor;
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        
        context.drawImage(
          imgToCompress,
          0,
          0,
          originalWidth * resizingFactor,
          originalHeight * resizingFactor
        );
        
        // reducing the quality of the image
        canvas.toBlob(
          (blob) => {
            if (blob) {
                let resizedImageBlob = blob;

                console.log(URL.createObjectURL(resizedImageBlob));
                let blobURL= URL.createObjectURL(resizedImageBlob)
                var reader = new FileReader();
                var _this = this;
               
                     const realFileReader = (reader as any)._realReader;
                     if (realFileReader) {
                        reader = realFileReader;
                    }
                reader.onload = function() {
                    var dataUrl = reader.result;
                    _this.dataCarrier.setCarrier('fileUploadedAsBase64',dataUrl); 
                    console.log(dataUrl)
                   
                    
                };
                reader.readAsDataURL(blob);
                
            }
          },
          text,
          quality
        );
    }
    
    onPreviewClick() {
       
        console.log("Preview");
        let linkSource = this.dataCarrier.getCarrier('fileUploadedAsBase64');
        let fileType = this.dataCarrier.getCarrier('fileExtension');
        if (fileType.toLowerCase() == 'image/png') {
            if (window['isDevice']) {
                //linkSource = linkSource.substring(linkSource.indexOf("base64,") +  7 , linkSource.length);                
                this.utils.prepareDownloadImageForDevice(linkSource, this.fileName,'png','image/png');
            }else{
                var a = document.createElement("a"); //Create <a>
                a.href = linkSource//Image Base64 Goes here
                a.download = "Image.png"; //File name Here
                a.click(); //Downloaded file
            }
            
        }else if (fileType.toLowerCase() == 'image/jpeg') {
            if (window['isDevice']) {
                //linkSource = linkSource.substring(linkSource.indexOf("base64,") +  7 , linkSource.length);
                this.utils.prepareDownloadImageForDevice(linkSource, this.fileName,'png','image/jpeg');
            }else{
                var a = document.createElement("a"); //Create <a>
                a.href = linkSource//Image Base64 Goes here
                a.download = "Image.jpg"; //File name Here
                a.click(); //Downloaded file
                
            }
        }
       
        else if (fileType.toLowerCase() == 'application/pdf') {
            if (window['isDevice']) {
                let source = linkSource.substring(linkSource.indexOf("JVBER"), linkSource.length);
                console.log("pdf",source)
                this.utils.downloadPDF(source, this.fileName);
            } else {
                let text = linkSource.substr(28);
                const byteCharacters = atob(text);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const newBlob = new Blob([byteArray], { type: 'application/pdf' });
                if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                    window.navigator.msSaveOrOpenBlob(newBlob); // For IE browser
                }
                const linkElement = document.createElement('a');
                const url = URL.createObjectURL(newBlob);

                window.open(url, '_blank');
            }
            
            
        }
        else if (fileType.toLowerCase() == "microsoft word" || fileType.toLowerCase() == "application/msword" || fileType.toLowerCase() == "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
            if(window.hasOwnProperty('cordova')){
                //linkSource = linkSource.substring(linkSource.indexOf("base64"), linkSource.length)
                this.utils.prepareDownloadForWordFileDevice(linkSource,this.fileName, fileType)
            }
            else{
                //this.downloadDocxFiles(linkSource, fileType, this.fileName);
                linkSource = linkSource.substring(linkSource.indexOf("base64,") +  7 , linkSource.length);
                let text = linkSource;
                const byteCharacters = atob(text);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                let newBlob;
                if(fileType.toLowerCase() == 'microsoft word'||fileType.toLowerCase() == 'application/msword'){
                    newBlob = new Blob([byteArray], { type: 'application/msword' });
                }else{
                    newBlob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
                }
            // const newBlob = new Blob([byteArray], { type: fileType });
                if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(newBlob); // For IE browser
                }
                const url = document.createElement('a');
                url.href = URL.createObjectURL(newBlob);
                url.download = this.fileName;
                url.click();
            }
        }
        else{
            linkSource = linkSource.substring(linkSource.indexOf("base64,") +  7 , linkSource.length);
            let text = linkSource;
            const byteCharacters = atob(text);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            
            const newBlob = new Blob([byteArray], { type: fileType });
            if (window.navigator && window.navigator.msSaveOrOpenBlob) {
                window.navigator.msSaveOrOpenBlob(newBlob); // For IE browser
            }
            const linkElement = document.createElement('a');
            const url = URL.createObjectURL(newBlob);
            linkElement.href =  URL.createObjectURL(newBlob);
            linkElement.click();
        }
        
    }
    cancelUpload() {
        this.docUploadToUi = false;
        this.imgSrcData = "";
        //clear the uploaded file details
        this.dataCarrier.clearCarrier('fileUploadedAsBase64');
        this.dataCarrier.clearCarrier('fileExtension');
        this.docUploadToUi = false;
        this.docUploadToUiProgress = false;
        this.fileName = "";
        this.isUploaded = false
    }

    onDeleteUploadedFile() {
        this.imgSrcData = "";
        this.dataCarrier.clearCarrier('fileUploadedAsBase64');
        this.dataCarrier.clearCarrier('fileExtension');
        this.docUploadToUi = false;
        this.docUploadToUiProgress = false;
        this.fileName = "";
        this.isUploaded = false;
        this.validFile = false;
    }
    ngOnDestroy(){
        this.dataCarrier.clearCarrier('fileUploadedAsBase64');
        this.dataCarrier.clearCarrier('fileExtension');
    }
    sendMail() {
        if (this.fileName != '') {

            this.secureMessageComposeObject.message = "NA";
            this.secureMessageComposeObject.subject = "Loan Documents";
            let secureMessageComposeVL = new SecureMessageComposeVL();
            Loader.start();
            secureMessageComposeVL.confirmSendMessage(this.secureMessageComposeObject).pipe(finalize(() => {
                Loader.stop();
            })).subscribe((data) => {
                this.messageOptions.options.showMessageContent = false;
                this.messageOptions.options.isGeneric = false;
                this.messageOptions.options.message = "";
                if (data.error) {
                    this.messageOptions.options.showMessageContent = true;
                    this.messageOptions.options.isGeneric = true;
                    this.messageOptions.options.message = ExceptionHandler.getInstance().prepareExceptionData(data.error);
                }
                else {
                    Loader.start();
                    secureMessageComposeVL.submitSendMessage(this.secureMessageComposeObject).pipe(finalize(() => {
                        Loader.stop();
                    })).subscribe((data) => {
                        this.messageOptions.options.showMessageContent = false;
                        this.messageOptions.options.isGeneric = false;
                        this.messageOptions.options.message = "";
                        if (data.error) {
                            this.messageOptions.options.showMessageContent = true;
                            this.messageOptions.options.isGeneric = true;
                            this.messageOptions.options.message = ExceptionHandler.getInstance().prepareExceptionData(data.error);
                        }
                        else {
                            this.secureMessageComposeObject.subject = "Loan Documents";
                            this.messageOptions.options.showMessageContent = true;
                            this.messageOptions.options.isGeneric = false;
                            this.messageOptions.options.messageType ="success";
                            this.messageOptions.options.message = "Successfully uploaded the document";
                            this.docUploadToUi = false;
                            this.docUploadToUiProgress = false;
                            this.isUploaded = false;
                            this.fileName = '';
                            this.validFile = false;
                        }
                    });
                }
            });
        }
    }
}

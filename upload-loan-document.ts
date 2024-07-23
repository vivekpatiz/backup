import { finalize } from 'rxjs/operators';
import { Component } from '@angular/core';
import { ViewEncapsulation } from '@angular/core';


import { Loader } from 'core/retail/ui/widescreen/app/module/_shared/component/loader-generic';

import { Utils } from 'app/utility/utils';
import { ExceptionHandler } from '@framework/exception-handler/exception-handler';

import { TranslateService } from '@ngx-translate/core';

import { BDGlobalService } from 'app/utility/BD-GlobalService';

import { AppConfig } from '@config';

import { MessageComponent } from '../_shared/component/message-component';
import { QuickLinksComponent } from '../layout/component/quick-links.component';
import { FavouritesComponent } from '../layout/component/favourites.component';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { DataCarrier } from '@framework/index';
import { SecureMessageComposeVL } from '../secure-message/service/secure-message-compose.vl.service';
import { SecureMessageComposeModel } from '../secure-message/view-model/secure-message-compose.model';
import { resolve } from 'url';

@Component({
    selector: 'upload-loan-document',
    templateUrl: './upload-loan-document.componet.html',
    styleUrls: ['./upload-loan-document.component.scss'],
    encapsulation: ViewEncapsulation.None
})
export class UploadLoanDocumentComponent {
    
    utils: Utils;
    
    appConfig:any;

    uploadDocForm: FormGroup;
    messageOptions: MessageComponent;
    imgSrcData:any;
    dataCarrier = DataCarrier.getInstance();
    reader: FileReader;
    docUploadToUi: boolean =false;
    docUploadToUiProgress: boolean =false;
    fileName:any;
    secureMessageComposeObject:SecureMessageComposeModel;
    IsFileSelected: boolean;
    IsfileUploaded: boolean;
    uploadSuc: boolean = true;
    uploadedFiles: any[] = [];
    uploadedFileBase64: any[];
    constructor(protected fb: FormBuilder,private translate: TranslateService, protected bdGlobalService: BDGlobalService) {
        this.appConfig = AppConfig.getInstance().getMasterConfig();
        this.utils = Utils.getInstance();
        Loader.initialize();
        this.createUploadDocForm();
        // this.initializeFileReader(); 
        this.messageOptions = new MessageComponent();
        this.addRightColumns();
        
    }
    createUploadDocForm(){
        this.uploadDocForm = this.fb.group({
            uploadFile: ['', Validators.required]
           
        });
    }
    addRightColumns(){
        let rightColumComponents = [];  
        rightColumComponents.push(QuickLinksComponent);
        rightColumComponents.push(FavouritesComponent); 
        this.bdGlobalService.setData({'event': 'right-comp', 'value': rightColumComponents,'module': "e-statement"});
    }
    ngOnDestroy(){
        this.dataCarrier.clearCarrier('fileExtensionSecur');
        this.dataCarrier.clearCarrier('secureBase64');
    }
    sendMail() {
        if (this.uploadDocForm.valid) {
            this.secureMessageComposeObject = new SecureMessageComposeModel();
            this.secureMessageComposeObject.message = 'NA';
            this.secureMessageComposeObject.subject = 'Loan Documents';


            let secureMessageComposeVL = new SecureMessageComposeVL();
            Loader.start();
            secureMessageComposeVL.confirmSendMessage(this.secureMessageComposeObject).pipe(finalize(() => {
                Loader.stop();
            })).subscribe((data) => {
                console.log("confirmSendMessage", data);
                Loader.start();

                secureMessageComposeVL.submitSendMessage(this.secureMessageComposeObject).pipe(finalize(() => {
                    Loader.stop();
                })).subscribe((data) => {  
                    this.secureMessageComposeObject.subject = "Loan Document";                  
                    //this.uploadDocForm.reset();
                    if(data.error) {
                        this.messageOptions.options.showMessageContent = true;
                        this.messageOptions.options.isGeneric = false;
                        this.messageOptions.options.messageType ="error";
                        this.messageOptions.options.message = ExceptionHandler.getInstance().prepareExceptionData(data.error);
                    } else {                        
                        this.messageOptions.options.showMessageContent = true;
                        this.messageOptions.options.isGeneric = false;
                        this.messageOptions.options.messageType ="success";
                        this.messageOptions.options.message = "Successfully uploaded the document";
                        this.docUploadToUi = true;
                        this.docUploadToUiProgress = true;
                        this.uploadSuc = true;        
                        this.uploadDocForm.reset(); 
                    }
                });
            });
        
            //this.onDeleteUploadedFile();
            //this.cancelUpload()
        }

    }
    onDeleteUploadedFile(file, i) {
        this.uploadedFiles.splice(i, 1);
        this.uploadedFileBase64.splice(i, 1);
        if (this.uploadedFiles.length == 0 && this.uploadedFileBase64.length == 0) {
            this.imgSrcData = "";
            this.uploadSuc = true
            //clear the uploaded file details
            // this.dataCarrier.clearCarrier('secureBase64'); 
            // this.dataCarrier.clearCarrier('fileExtensionSecur'); 
            this.docUploadToUi = false;
            this.docUploadToUiProgress = false;
            this.fileName = "";
            this.IsFileSelected = false;
            this.IsfileUploaded = false;
        }
    }
    initializeFileReader(){
        

        const _this = this;
        //Reading Image file, encode and display
        this.reader = new FileReader();
    
        this.reader.onloadend = function(fileLoadedEvent:any) {
            _this.imgSrcData = fileLoadedEvent.target.result;
            
            console.log( _this.imgSrcData, "imgSrcData base 64") ;// <--- data: base64 
            _this.dataCarrier.setCarrier('secureBase64',  _this.imgSrcData);
            if(_this.dataCarrier.getCarrier('fileExtensionSecur')){
                if(_this.dataCarrier.getCarrier('fileExtensionSecur').includes('png')||
                _this.dataCarrier.getCarrier('fileExtensionSecur').includes('jpg')||
                _this.dataCarrier.getCarrier('fileExtensionSecur').includes('jpeg')){
                    var imageObj = new Image(); 
                    let text = ''
                    if(_this.dataCarrier.getCarrier('fileExtensionSecur').includes('jpg')||_this.dataCarrier.getCarrier('fileExtensionSecur').includes('jpeg')) {
                        text = 'image/jpeg'
                    }else{
                        text = 'image/png'
                    }
                    imageObj.onload = function() {
                        _this.compressImage(imageObj,text);
                    };
                    imageObj.src =  _this.imgSrcData
                }
            }
             _this.docUploadToUi =  true;
            _this.docUploadToUiProgress = false;
            
        }
    
        this.reader.onprogress = function(data) {
          if (data.lengthComputable) {   
           
            _this.docUploadToUiProgress = true;         
            let progress =  `${data.type}: ${data.loaded} bytes transferred\n`;
            // var iProgress = parseInt(data.loaded / data.total * 100, 10);
            var iProgress = data.loaded / data.total * 100;
            // $('#progress div').css('width', iProgress + '%');
            console.log(progress);
              console.log( iProgress);
              
             
          }
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
          
                    fr.onerror = reject;
                    fr.onload = () => {
                        resolve(fr.result);
                    }                    
               
           
                    fr.onerror = reject;
                    fr.onload = () => {
                       
                            resolve(fr.result);
                       
                    }                    
               
            fr.readAsDataURL(file);
        });
    }
    compressImageCordova(imgToCompress,text) {
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
                    _this.dataCarrier.setCarrier('secureBase64',dataUrl); 
                    console.log(dataUrl)
                   
                    
                };
                reader.readAsDataURL(blob);
                
            }
          },
          text,
          quality
        );
    }
    uploadFile(event) {
        let fileSize = 0
        for (let j = 0; j < event.length; j++) {
            fileSize = fileSize + event[j].size
        }
        console.log(event, "event");
        this.messageOptions.options.showMessageContent = false;
        const _this = this;
        let filebase64 = []
        let promises = []
        this.uploadedFileBase64 = []
        for (let i = 0; i < event.length; i++) {
            if (event[i] && (event[i].type == "image/jpeg" || event[i].type == "application/pdf" || event[i].type == "image/png")) {
                if (fileSize > 5000000) {

                    this.messageOptions.options.showMessageContent = true;
                    this.messageOptions.options.isGeneric = false;
                    this.messageOptions.options.messageType = "error";
                    this.messageOptions.options.message = "Please select a file with size less than 5MB.";
                    this.uploadDocForm.reset();
                } else {
                    this.uploadSuc = false

                    if (window['cordova']) {
                        console.log("cordovacordovacordovacordovacordova")
                        var promise1 = this.readAsDataURL(event[i]);
                        promise1.then(function (result) {

                            //console.log(result);                    
                            console.log("reader load");
                            //console.log(result);
                            Loader.stop();
                            _this.imgSrcData = result;
                            if (_this.dataCarrier.getCarrier('fileExtensionSecur')) {
                                if (_this.dataCarrier.getCarrier('fileExtensionSecur').includes('png') ||
                                    _this.dataCarrier.getCarrier('fileExtensionSecur').includes('jpg') ||
                                    _this.dataCarrier.getCarrier('fileExtensionSecur').includes('jpeg')) {
                                    var imageObj = new Image();
                                    let text = ''
                                    if (_this.dataCarrier.getCarrier('fileExtensionSecur').includes('jpg') || _this.dataCarrier.getCarrier('fileExtensionSecur').includes('jpeg')) {
                                        text = 'image/jpeg'
                                    } else {
                                        text = 'image/png'
                                    }
                                    imageObj.onload = function () {
                                        _this.compressImageCordova(imageObj, text);
                                    };
                                    imageObj.src = _this.imgSrcData
                                } else {
                                    _this.dataCarrier.setCarrier('secureBase64', _this.imgSrcData);
                                }
                            }
                            //console.log(_this.imgSrcData, "imgSrcData base 64");// <--- data: base64 

                            _this.docUploadToUi = true;
                            _this.docUploadToUiProgress = false;
                        })
                    } else {
                        console.log("notcordovacordovacordovacordovacordova")
                        this.uploadedFiles.push(event[i]);
                        promises.push(this.readFile(event[i]))
                    }
                    this.dataCarrier.setCarrier("loanAgreeSecureFile", event[i].name);
                    this.fileName = event[i].name;
                    //event.target.value = null
                }
            } else {
                Loader.stop();
                this.messageOptions.options.showMessageContent = true;
                this.messageOptions.options.isGeneric = false;
                this.messageOptions.options.messageType = "error";
                this.messageOptions.options.message = "The selected file cannot be uploaded. Only files with the following extensions are supported : .jpeg,.pdf,.png";
            }
        }
        Promise.all(promises).then(results => {
            results.forEach(base64 => {
                filebase64.push(base64);
            });
            this.uploadedFileBase64 = filebase64
            console.log(filebase64, 'filebase6666666')
            for (let k = 0; k < filebase64.length; k++) {
                this.uploadedFiles[k]['base64'] = filebase64[k]
            }
            this.dataCarrier.setCarrier("uploadedFiles", this.uploadedFiles)
            console.log(this.uploadedFiles, "this.uploadedFilesthis.uploadedFiles")
            this.uploadDocForm.patchValue({
                uploadFile: this.uploadedFileBase64
            });
        }).catch(error => {
            console.error('Error reading files:', error);
        });
    }
    readFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = function (e) {
                resolve(e.target.result);
            };
            reader.onerror = function (e) {
                reject(e)
            };
            reader.readAsDataURL(file)
        })
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
                reader.onload = function() {
                    var dataUrl = reader.result;
                    _this.dataCarrier.setCarrier('secureBase64',dataUrl); 
                    //alert(dataUrl);
                    //console.log(dataUrl)
                   
                    
                };
                reader.readAsDataURL(blob);
                
            }
          },
          text,
          quality
        );
    }
    onPreviewClick(file,i){
        // $('#previewLink').attr('href',this.imgSrcData);
        // $('#previewLink').attr('download',this.fileName);
        // $('#previewLink').click();
          //  const downloadLink = document.createElement("a");
   
       let linkSource = this.uploadedFileBase64[i]
       let fileType = file.type
        if (fileType.toLowerCase() == 'image/png') {
            if (window['cordova']) {
                //linkSource = linkSource.substring(linkSource.indexOf("base64,") +  7 , linkSource.length);                
                this.utils.prepareDownloadImageForDevice(linkSource, this.fileName,'png','image/png');
            }else{
                var a = document.createElement("a"); //Create <a>
                a.href = linkSource//Image Base64 Goes here
                a.download = "Image.png"; //File name Here
                a.click(); //Downloaded file
            }
            
        }
        else if (fileType.toLowerCase() == 'image/jpeg'||fileType.toLowerCase() == 'image/jpg') {
            if (window['cordova']) {
                //linkSource = linkSource.substring(linkSource.indexOf("base64,") +  7 , linkSource.length);
                this.utils.prepareDownloadImageForDevice(linkSource, this.fileName,'png','image/jpeg');
            }else{
                var a = document.createElement("a"); //Create <a>
                a.href = linkSource//Image Base64 Goes here
                a.download = "Image.jpg"; //File name Here
                a.click(); 
            }
            
            
        }
        else if (fileType.toLowerCase() == 'application/pdf') {
            if (window['cordova']) {
                let source = linkSource.substring(linkSource.indexOf("JVBER"), linkSource.length);
                console.log("pdf",source)
                this.utils.downloadPDF(source, this.fileName);
            } else{
                let text = linkSource.substr(28);
                const byteCharacters = atob(text);
                const byteNumbers = new Array(byteCharacters.length);
                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }
                const byteArray = new Uint8Array(byteNumbers);
                const newBlob = new Blob([byteArray], { type: 'application/pdf' });
                const linkElement = document.createElement('a');
                const url = URL.createObjectURL(newBlob);

                window.open(url, '_blank');
            }
            
        }
        else if (fileType.toLowerCase() == "microsoft word" || fileType.toLowerCase() == "application/msword" || fileType.toLowerCase() == "application/vnd.openxmlformats-officedocument.wordprocessingml.document") {
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
            const url = document.createElement('a');
            url.href = URL.createObjectURL(newBlob);
            url.download = this.fileName;
            url.click();
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
            const linkElement = document.createElement('a');
            const url = URL.createObjectURL(newBlob);
            linkElement.href =  URL.createObjectURL(newBlob);
            linkElement.target = '_blank';
            linkElement.click();
        }
        
       
        // debugger
        // linkElement.setAttribute('href', url);
        // linkElement.setAttribute('download', 'sample.pdf');
        // debugger
        // const clickEvent = new MouseEvent('click', {
        // 'view': window,
        // 'bubbles': true,
        // 'cancelable': false
        //  });
        //  debugger
        // linkElement.dispatchEvent(clickEvent);
        // debugger
    }
    
}

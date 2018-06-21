import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from "@angular/common/http";
import { CookieUtilService } from "./cookie-util.service";
import { Observable } from "rxjs/Observable";
import {Subject} from "rxjs/Subject";

@Injectable()
export class ProtocolService {

    private protocolSubject: Subject<any> = new Subject();
    private protocolListSubject: Subject<any[]> = new Subject();

    private saveNewProtocolSubject: Subject<any> = new Subject();
    private saveExistingProtocolSubject: Subject<any> = new Subject();
    private deleteProtocolSubject: Subject<any> = new Subject();

    constructor(private httpClient: HttpClient,
                private cookieUtilService: CookieUtilService) { }


    public getProtocolObservable(): Observable<any> {
        return this.protocolSubject.asObservable();
    }
    public getProtocolListObservable(): Observable<any[]> {
        return this.protocolListSubject.asObservable();
    }

    public getSaveNewProtocolObservable(): Observable<any> {
        return this.saveNewProtocolSubject.asObservable();
    }
    public getSaveExistingProtocolObservable(): Observable<any> {
        return this.saveExistingProtocolSubject.asObservable();
    }

    public getDeleteProtocolObservable(): Observable<any> {
        return this.deleteProtocolSubject.asObservable();
    }

    public getProtocolByIdAndClass(id: string, protocolClassName: string): void {
        this.cookieUtilService.formatXSRFCookie();

        let params: HttpParams = new HttpParams()
            .set('id', id)
            .set('protocolClassName', protocolClassName);

        this.httpClient.post('gnomex/GetProtocol.gx', null, {params: params}).subscribe((result) => {
            this.protocolSubject.next(result);
        });
    }
    public getProtocolList(): void {
        this.httpClient.get('gnomex/GetProtocolList.gx').subscribe((result) => {
            if (!!result) {
                if (Array.isArray(result)) {
                    this.protocolListSubject.next(result);
                } else {
                    this.protocolListSubject.next([]);
                    // this.protocolListSubject.next([result.Protocols]);
                }
            } else {
                this.protocolListSubject.next([]);
            }
        });
    }

    public saveNewProtocol(protocolName: string, codeRequestCategory: string, protocolClassName: string, idAnalysisType: string): void {
        this.cookieUtilService.formatXSRFCookie();

        let params: HttpParams;

        if (idAnalysisType && idAnalysisType !== '') {
            params = new HttpParams()
                .set('protocolName', protocolName)
                .set('codeRequestCategory', '')
                .set('protocolClassName', protocolClassName)
                .set('idAnalysisType', idAnalysisType);
        } else {
            params = new HttpParams()
                .set('protocolName', protocolName)
                .set('codeRequestCategory', codeRequestCategory)
                .set('protocolClassName', protocolClassName);
        }

        this.httpClient.post('/gnomex/SaveProtocol.gx', null, {params: params}).subscribe((result) => {
            this.saveNewProtocolSubject.next(result);
        });
    }

    public saveExistingProtocol(protocolName: string,
                                adapterSequenceThreePrime: string,
                                protocolDescription: string,
                                idAnalysisType: string,
                                adapterSequenceFivePrime: string,
                                protocolClassName: string,
                                codeRequestCategory: string,
                                idAppUser: string,
                                isActive: string,
                                idProtocol: string,
                                protocolURL: string): void {
        this.cookieUtilService.formatXSRFCookie();

        let params: HttpParams = new HttpParams()
            .set('protocolName',              protocolName)
            .set('adapterSequenceThreePrime', adapterSequenceThreePrime)
            .set('protocolDescription',       protocolDescription)
            .set('idAnalysisType',            idAnalysisType)
            .set('adapterSequenceFivePrime',  adapterSequenceFivePrime)
            .set('protocolClassName',         protocolClassName)
            .set('codeRequestCategory',       codeRequestCategory)
            .set('idAppUser',                 idAppUser)
            .set('isActive',                  isActive)
            .set('idProtocol',                idProtocol)
            .set('protocolURL',               protocolURL);

        this.httpClient.post('/gnomex/SaveProtocol.gx', null, {params: params}).subscribe((result) => {
            this.saveExistingProtocolSubject.next(result);
        });
    }

    public deleteProtocol(idProtocol: string, protocolClassName: string): void {
        this.cookieUtilService.formatXSRFCookie();

        let params: HttpParams = new HttpParams()
            .set('idProtocol', idProtocol)
            .set('protocolClassName', protocolClassName);

        this.httpClient.post('/gnomex/DeleteProtocol.gx', null, {params: params}).subscribe((result) => {
            this.deleteProtocolSubject.next(result);
        });
    }
}
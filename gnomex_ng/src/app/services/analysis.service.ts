import {Injectable} from "@angular/core";
import {Http, Response, URLSearchParams} from "@angular/http";
import {Observable} from "rxjs/Observable";

import 'rxjs/add/operator/map';
import {Subject} from "rxjs/Subject";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {HttpClient, HttpParams} from "@angular/common/http";
import {CookieUtilService} from "./cookie-util.service";

@Injectable()
export class AnalysisService {
    public analysisGroupList: any[];
    public startSearchSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
    private analysisGroupListSubject: Subject<any[]> = new Subject();
    private _haveLoadedAnalysisGroupList: boolean = false;
    private _previousURLParams: URLSearchParams = null;
    private _analysisPanelParams:URLSearchParams;
    private _analysisList:Array<any> =[];
    private analysisOverviewListSubject:BehaviorSubject<any> = new BehaviorSubject([]);
    private filteredAnalysisListSubject:Subject<any> = new Subject();
    private createAnalysisDataSubject:Subject<any> = new Subject();
    private saveManagerSubject:Subject<any> = new Subject();
    // for the save button on right pane
    public invalid:boolean = false;
    public dirty:boolean = false;


    constructor(private http: Http, private httpClient:HttpClient,
                private cookieUtilService:CookieUtilService) {
    }


    get analysisList(): Array<any>{
        return this._analysisList;
    }
    set analysisList(data:Array<any>){
        this._analysisList = data;
    }

    get analysisPanelParams(): URLSearchParams{
        return this._analysisPanelParams;
    }
    set analysisPanelParams(data:URLSearchParams){
        this._analysisPanelParams = data;
    }

    getAnalysis(params: URLSearchParams): Observable<any> {
        return this.http.get("/gnomex/GetAnalysis.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });
    }

    saveAnalysis(params: URLSearchParams): Observable<any> {
        return this.http.get("/gnomex/SaveAnalysis.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });
    }

    getAnalysisGroup(params: URLSearchParams): Observable<any> {
        return this.http.get("/gnomex/GetAnalysisGroup.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });
    }

    getAnalysisGroupList(params: URLSearchParams): Observable<any> {
        return this.http.get("/gnomex/GetAnalysisGroupList.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                this.analysisGroupList = response.json().Lab;
                return this.analysisGroupList;
            } else {
                throw new Error("Error");
            }
        });
    }

    getAnalysisLabList(): Observable<any> {
        return this.http.get("/gnomex/GetAnalysisGroupList.gx").map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });
    }

    emitAnalysisGroupList(agList?:any): void {
        if(agList){
            this.analysisGroupListSubject.next(agList);
        }else{
            this.analysisGroupListSubject.next(this.analysisGroupList);
        }

    }

    getAnalysisGroupListObservable(): Observable<any> {
        return this.analysisGroupListSubject.asObservable();
    }
    getAnalysisGroupList_fromBackend(params: URLSearchParams,allowRefresh?:boolean): void {
        this.startSearchSubject.next(true);

        if (this._haveLoadedAnalysisGroupList && this._previousURLParams === params && !allowRefresh) {
            // do nothing
            console.log("Analysis already loaded");
        } else {
            this._haveLoadedAnalysisGroupList = true;
            this._previousURLParams = params;

            this.http.get("/gnomex/GetAnalysisGroupList.gx", {
                withCredentials: true,
                search: params
            }).subscribe((response: Response) => {
                console.log("GetRequestList called");

                if (response.status === 200) {
                    this.analysisGroupList = response.json().Lab;
                    this.emitAnalysisGroupList();
                } else {
                    throw new Error("Error");
                }
            });
        }
    }

    refreshAnalysisGroupList_fromBackend(): void {
        this.startSearchSubject.next(true);

        this.http.get("/gnomex/GetAnalysisGroupList.gx", {
            withCredentials: true,
            search: this._previousURLParams
        }).subscribe((response: Response) => {
            console.log("GetAnalysiisGroupList called");

            if (response.status === 200) {
                this.analysisGroupList = response.json().Lab;
                this.emitAnalysisGroupList();
                //return response.json().Request;
            } else {
                throw new Error("Error");
            }
        });
    }

    saveAnalysisGroup(params: URLSearchParams):  Observable<any> {
        return this.http.get("/gnomex/SaveAnalysisGroup.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response;
            } else {
                throw new Error("Error");
            }
        });

    }

    deleteAnalysis(params: URLSearchParams):  Observable<any> {
        return this.http.get("/gnomex/DeleteAnalysis.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response;
            } else {
                throw new Error("Error");
            }
        });

    }

    deleteAnalysisGroup(params: URLSearchParams):  Observable<any> {
        return this.http.get("/gnomex/DeleteAnalysisGroup.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response;
            } else {
                throw new Error("Error");
            }
        });

    }

    moveAnalysis(params: URLSearchParams):  Observable<any> {
        return this.http.get("/gnomex/MoveAnalysis.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response;
            } else {
                throw new Error("Error");
            }
        });

    }


    resetAnalysisOverviewListSubject(){
        this.analysisOverviewListSubject = new BehaviorSubject([]);
    }

    emitAnalysisOverviewList(data:any):void{
        this.analysisOverviewListSubject.next(data);
    }
    getAnalysisOverviewListSubject():BehaviorSubject<any>{
        return this.analysisOverviewListSubject;
    }

    emitFilteredOverviewList(data:any):void{
        this.filteredAnalysisListSubject.next(data);
    }
    getFilteredOverviewListObservable():Observable<any>{
        return this.filteredAnalysisListSubject.asObservable();
    }

    emitCreateAnalysisDataSubject(data:any):void{
        this.createAnalysisDataSubject.next(data);
    }
    getCreateAnaylsisDataSubject():Subject<any>{
        return this.createAnalysisDataSubject;
    }
    emitSaveManger(type:string):void{
        this.saveManagerSubject.next(type);
    }
    getSaveMangerObservable():Observable<any>{
        return this.saveManagerSubject.asObservable();
    }

    saveVisibility(params:URLSearchParams): Observable<any> {
        return this.http.get("/gnomex/SaveVisibilityAnalysis.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response;
            } else {
                throw new Error("Error: In SaveVisibility");
            }
        });
    }

    getExperimentPickList(params:HttpParams):Observable<any>{
        return this.httpClient.get("/gnomex/GetExperimentPickList.gx",{params: params});
    }



}

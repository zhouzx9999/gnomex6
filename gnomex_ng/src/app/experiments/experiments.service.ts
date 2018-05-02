import {Inject, Injectable, InjectionToken, Injector} from "@angular/core";
import {Http, Response, URLSearchParams} from "@angular/http";
import {Subject} from "rxjs/Subject";
import {Observable} from "rxjs/Observable";
import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {HttpHeaders, HttpParams} from "@angular/common/http";


export let BROWSE_EXPERIMENTS_ENDPOINT = new InjectionToken("browse_experiments_url");
export let VIEW_EXPERIMENT_ENDPOINT = new InjectionToken("view_experiment_url");

@Injectable()
export class ExperimentsService {

	private experimentOrders: any[];
    public projectRequestList: any[];
    public selectedTreeNode:any;
    public startSearchSubject: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);


    private experimentOrdersSubject: Subject<any[]> = new Subject();
    private experimentSubject: Subject<any> = new Subject();
    private projectRequestListSubject: Subject<any[]> = new Subject();
    private projectSubject:Subject<any> = new Subject();

    private haveLoadedExperimentOrders: boolean = false;
    private previousURLParams: URLSearchParams = null;
    private changeStatusSubject: Subject<any> = new Subject();
    private requestProgressList: Subject<any>= new Subject();
    private requestProgressDNASeqList: Subject<any> = new Subject();
    private requestProgressSolexaList:Subject<any> = new Subject();

    private experimentOverviewListSubject:BehaviorSubject<any> = new BehaviorSubject([]);
    private filteredExperimentOverviewListSubject:Subject<any> = new Subject();
    private saveManagerSubject:Subject<any> = new Subject();
    private navInitBrowsExperimentSubject:BehaviorSubject<boolean>= new BehaviorSubject(false);

    // conditional params
    browsePanelParams:URLSearchParams;
    experimentList:Array<any> =[];

    public invalid:boolean = false;
    public dirty:boolean = false;


    constructor(private _http: Http, @Inject(BROWSE_EXPERIMENTS_ENDPOINT) private _browseExperimentsUrl: string) {}

    getExperiments() {
        //return this._http.get("/gnomex/GetProjectRequestList.gx?idLab=1500&showCategory='N'", {withCredentials: true}).map((response: Response) => {
        //return this._http.get("/gnomex/GetProjectRequestList.gx?showEmptyProjectFolders=N&allExperiments=Y&showSamples=N&showCategory=N", {withCredentials: true}).map((response: Response) => {

        return this._http.get("/gnomex/GetProjectRequestList.gx?showEmptyProjectFolders=N&allExperiments=Y&showSamples=N&showCategory=N&idCoreFacility=3&showEmptyProjectFolders=N", {withCredentials: true}).map((response: Response) => {
            if (response.status === 200) {
                return response.json().Lab;
            } else {
                throw new Error("Error");
            }
        });
    }

	getExperimentsObservable(): Observable<any> {
		return this.experimentOrdersSubject.asObservable();
	}

	refreshProjectRequestList_fromBackend(): void {
        this.startSearchSubject.next(true);
		this._http.get("/gnomex/GetProjectRequestList.gx", {
			withCredentials: true,
			search: this.previousURLParams
		}).subscribe((response: Response) => {
			console.log("GetRequestList called");

			if (response.status === 200) {
				this.projectRequestList = response.json().Lab;
				this.emitProjectRequestList();
				//return response.json().Request;
			} else {
				throw new Error("Error");
			}
		});
	}


    getExperiments_fromBackend(parameters: URLSearchParams): void {
        this.haveLoadedExperimentOrders = true;
        this.previousURLParams = parameters;

        this._http.get("/gnomex/GetRequestList.gx", {withCredentials: true, search: parameters}).subscribe((response: Response) => {
            // console.log("GetRequestList called");

            if (response.status === 200) {
                this.experimentOrders = response.json().Request;
                this.emitExperimentOrders();
                //return response.json().Request;
            } else {
                throw new Error("Error");
            }
        });
    }

    repeatGetExperiments_fromBackend(): void {
        this.haveLoadedExperimentOrders = false;
        this.getExperiments_fromBackend(this.previousURLParams);
    }

	getChangeExperimentStatusObservable(): Observable<any> {
		return this.changeStatusSubject.asObservable();
	}

	changeExperimentStatus(idRequest: string, codeRequestStatus: string): void {

		let parameters: URLSearchParams = new URLSearchParams;
		parameters.set("idRequest", idRequest);
		parameters.set("codeRequestStatus", codeRequestStatus);

		// console.log("Changing Experiment numbers: " + parameters.get("idRequest") + " status to " + parameters.get("codeRequestStatus"));

		this._http.get("/gnomex/ChangeRequestStatus.gx", {withCredentials: true, search: parameters}).subscribe((response: Response) => {
			if (response.status === 200) {
				this.changeStatusSubject.next(response.json());
				//return response.json().Request;
			} else {
				throw new Error("Error");
			}
		});
	}


	emitExperimentOrders(): void {
		this.experimentOrdersSubject.next(this.experimentOrders);
	}

    getProjectRequestListObservable(): Observable<any> {
        return this.projectRequestListSubject.asObservable();
    }


    emitProjectRequestList(projectRequestList?:any): void {
        if(projectRequestList){
            this.projectRequestListSubject.next(projectRequestList);
        }else{
            this.projectRequestListSubject.next(this.projectRequestList);
        }

    }

    getProjectRequestList_fromBackend(params: URLSearchParams,allowRefresh?:boolean): void {
        this.startSearchSubject.next(true);

        this.haveLoadedExperimentOrders = true;
        this.previousURLParams = params;

        this._http.get("/gnomex/GetProjectRequestList.gx", {
            withCredentials: true,
            search: params
        }).subscribe((response: Response) => {
            console.log("GetRequestList called");

            if (response.status === 200) {
                this.projectRequestList = response.json().Lab;
                this.emitProjectRequestList();
                //return response.json().Request;
            } else {
                throw new Error("Error");
            }
        });
        //  }
    }

    emitExperiment(exp:any):void{
        this.experimentSubject.next(exp);
    }
    getExperimentObservable():Observable<any>{
        return this.experimentSubject.asObservable();
    }

    getExperiment(id: string): Observable<any> {
        return this._http.get("/gnomex/GetRequest.gx?idRequest=" + id, {withCredentials: true}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });
    }

    getLab(params: URLSearchParams): Observable<any> {
        return this._http.get("/gnomex/GetLab.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json().Lab;
            } else {
                throw new Error("Error");
            }
        });

    }

    saveRequestProject(params: URLSearchParams):  Observable<any> {
        return this._http.get("/gnomex/SaveRequestProject.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response;
            } else {
                throw new Error("Error");
            }
        });

    }

    saveVisibility(body: any, idProject?: string): Observable<any> {

        let parameters: URLSearchParams = new URLSearchParams;
        let strBody:string = JSON.stringify(body);

        if(idProject){
            parameters.set("idProject",idProject);
        }
        parameters.set("visibilityXMLString", strBody);

        return this._http.get("/gnomex/SaveVisibility.gx", {search: parameters}).map((response: Response) => {
            if (response.status === 200) {
                return response;
            } else {
                throw new Error("Error: In SaveVisibility");
            }
        });


    }



    getProjectObsevable():Observable<any>{
        return this.projectSubject.asObservable();
    }
    emitProject(project:any):void{
        this.projectSubject.next(project);
    }
    getProject_fromBackend(params: URLSearchParams): void {
            this._http.get("/gnomex/GetProject.gx",{search: params})
                .subscribe((response: Response) => {
                console.log("getProject called");
                if (response.status === 200) {
                    let project = response.json();
                    this.emitProject(project);
                    //return response.json().Request;
                } else {
                    throw new Error("Error getting Project");
                }
            });
    }



    getProject(params: URLSearchParams):  Observable<any> {
        return this._http.get("/gnomex/GetProject.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });

    }

    saveProject(params: URLSearchParams):  Observable<any> {
        return this._http.get("/gnomex/SaveProject.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response;
            } else {
                throw new Error("Error");
            }
        });

    }

    deleteExperiment(params: URLSearchParams):  Observable<any> {
        return this._http.get("/gnomex/DeleteRequest.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response;
            } else {
                throw new Error("Error");
            }
        });
    }

    getProjectRequestList(params: URLSearchParams) {
        //return this._http.get("/gnomex/GetProjectRequestList.gx?idLab=1500&showCategory='N'", {withCredentials: true}).map((response: Response) => {
        return this._http.get("/gnomex/GetProjectRequestList.gx", {search: params, withCredentials: true}).map((response: Response) => {
            if (response.status === 200) {
                return response.json().Lab;
            } else {
                throw new Error("Error");
            }
        });
    }

    getRequestList(params: URLSearchParams): Observable<any> {
        return this._http.get("/gnomex/GetRequestList.gx", {search: params}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });
    }


    getRequestProgressListObservable():Observable<any>{
        return this.requestProgressList;
    }
    getRequestProgressList_FromBackend(params:URLSearchParams):void{
        this._http.get("/gnomex/GetRequestProgressList.gx",{search:params})
            .subscribe((response: Response)=> {
                if (response.status === 200){
                    this.requestProgressList.next(response.json());
                }else{
                    throw new Error("Error");
                }
            });
    }

    getRequestProgressSolexaListObservable():Observable<any>{
       return this.requestProgressSolexaList.asObservable();
    }
    getRequestProgressSolexaList_FromBackend(params: URLSearchParams):void{
        this._http.get("/gnomex/GetRequestProgressSolexaList.gx",{search:params})
            .subscribe((response: Response)=> {
                if (response.status === 200){
                    this.requestProgressSolexaList.next(response.json());
                }else{
                    throw new Error("Error");
                }
            });

    }

    getRequestProgressDNASeqListObservable(){
        return this.requestProgressDNASeqList.asObservable();
    }
    getRequestProgressDNASeqList_FromBackend(params: URLSearchParams):void{
        this._http.get("/gnomex/GetRequestProgressDNASeqList.gx",{search:params})
            .subscribe((response: Response)=> {
            if (response.status === 200){
                this.requestProgressDNASeqList.next(response.json());
            }else{
                throw new Error("Error");
            }
        });
    }
    emitExperimentOverviewList(data:any):void{
        this.experimentOverviewListSubject.next(data);
    }
    resetExperimentOverviewListSubject(){
        this.experimentOverviewListSubject = new BehaviorSubject([]);
    }
    getExperimentOverviewListSubject():BehaviorSubject<any>{
        return this.experimentOverviewListSubject;
    }
    emitFilteredOverviewList(data:any):void{
        this.filteredExperimentOverviewListSubject.next(data);
    }
    getFilteredOverviewListObservable():Observable<any>{
        return this.filteredExperimentOverviewListSubject.asObservable();
    }
    emitSaveManger(type:string):void{
        this.saveManagerSubject.next(type);
    }
    getSaveMangerObservable():Observable<any>{
        return this.saveManagerSubject.asObservable();
    }






}

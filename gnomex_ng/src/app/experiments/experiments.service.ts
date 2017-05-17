import {Inject, Injectable, OpaqueToken} from "@angular/core";
import {Http, Response} from "@angular/http";
import {Observable} from "rxjs/Observable";

export let BROWSE_EXPERIMENTS_ENDPOINT: OpaqueToken = new OpaqueToken("browse_experiments_url");
export let VIEW_EXPERIMENT_ENDPOINT: OpaqueToken = new OpaqueToken("view_experiment_url");

@Injectable()
export class ExperimentsService {

    constructor(private _http: Http, @Inject(BROWSE_EXPERIMENTS_ENDPOINT) private _browseExperimentsUrl: string) {}

    getExperiments(): Observable<Object> {
        return this._http.get("/gnomex/GetExperimentOverviewList.gx", {withCredentials: true}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });
    }

    getExperiment(id: string): Observable<Object> {
        return this._http.get("/gnomex/GetRequest.gx?requestNumber="+id, {withCredentials: true}).map((response: Response) => {
            if (response.status === 200) {
                return response.json();
            } else {
                throw new Error("Error");
            }
        });
    }


}
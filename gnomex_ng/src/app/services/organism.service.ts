import {Injectable} from "@angular/core";
import {Http, Response, URLSearchParams} from "@angular/http";
import {Observable} from "rxjs";
import {HttpClient, HttpParams} from "@angular/common/http";
import {CookieUtilService} from "./cookie-util.service";
import {map} from "rxjs/operators";

@Injectable()
export class OrganismService {

    constructor(private http: Http,
                private httpClient: HttpClient,
                private cookieUtilService: CookieUtilService) {
    }

    public getOrganismListNew(): Observable<any> {
        return this.httpClient.get("/gnomex/GetOrganismList.gx");
    }

    public deleteOrganism(idOrganism: string): Observable<any> {
        this.cookieUtilService.formatXSRFCookie();
        let params: HttpParams = new HttpParams().set("idOrganism", idOrganism);
        return this.httpClient.post("/gnomex/DeleteOrganism.gx", null, {params: params});
    }

    public saveOrganismNew(params: HttpParams): Observable<any> {
        this.cookieUtilService.formatXSRFCookie();
        return this.httpClient.post("/gnomex/SaveOrganism.gx", null, {params: params});
    }

    public getOrganismListCall(): Observable<Response> {
        return this.http.get("/gnomex/GetOrganismList.gx");
    }

    public getDas2OrganismList(): Observable<any[]> {
        return this.getOrganismListCall().pipe(map((response: Response) => {
            if (response.status === 200) {
                let allOrganisms: any[] = response.json();
                return allOrganisms.filter((organism: any) => {
                    return !(organism.das2Name === "") && !(organism.bionomialName === "") && organism.isActive === "Y";
                });
            } else {
                return [];
            }
        }));
    }

    public saveOrganism(params: URLSearchParams):  Observable<Response> {
        return this.http.get("/gnomex/SaveOrganism.gx", {search: params});
    }

}


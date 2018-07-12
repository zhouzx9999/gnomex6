/*
 * Copyright (c) 2016 Huntsman Cancer Institute at the University of Utah, Confidential and Proprietary
 */
import {Component, OnInit, ViewChild, ViewEncapsulation, AfterViewInit, OnDestroy} from "@angular/core";
import {URLSearchParams} from "@angular/http";
import {Router} from "@angular/router";

import {BehaviorSubject} from "rxjs/BehaviorSubject";
import {Observable} from "rxjs/Observable";
import {Subscription} from "rxjs/Subscription";

import {jqxProgressBarComponent} from "../../assets/jqwidgets-ts/angular_jqxprogressbar"; //jqwidgets-framework

import {GnomexService} from "../services/gnomex.service";
import {LaunchPropertiesService} from "../services/launch-properites.service";
import {ProgressService} from "./progress.service";

@Component({
    selector: "gnomex-home",
    template: require("./home.component.html"),
    // template: require("./home.component.html"),
    styles: [`
        
        .t  { display: table;      }
        .tr { display: table-row;  }
        .td { display: table-cell; }

        .horizontal-center { text-align: center; }
        .vertical-center   { vertical-align: middle; }
        
        .flex-grow-large { flex: 5; }
        
    .login-view{
        height: 20em;
        width: 35em;
        margin-left: 40em;
        display: block;
        background-image: url("../gnomex/assets/gnomex_splash_logo.png");
        background-repeat:no-repeat;
    }
    .flex-column-container {
        display: flex;
        flex-direction: column;
        background-color: white;
        height: 100%;
    }
    div.background {
        width: 100%;
        height: 100%;
        background-color: white;
    }
    .gnomex-splash {
        background-image: url(../gnomex/assets/gnomex_splash_credits.png);
        width: 19em;
        height: 15em;
        padding-bottom: 1em;
        padding-left: 1em;
        padding-right: 1em;
        padding-top: 1em;
        position: relative;
        background-repeat: no-repeat;
    }
    `],
    encapsulation: ViewEncapsulation.None
})
export class HomeComponent implements OnInit, AfterViewInit, OnDestroy {
    @ViewChild("loadingProgress") loadingProgress: jqxProgressBarComponent;
    private showProgressSubscription:Subscription;
    private hideLoader: BehaviorSubject<boolean>;
    private colorRanges = [{ stop: 100, color: '#3fca15' }];
    private launchProperties: any;
    private site_splash: string;

    private site_logo:string;

    constructor(private launchPropertiesService: LaunchPropertiesService,
                private progressService: ProgressService,
                private gnomexService: GnomexService,
                private router:Router
    ) {
        // Do instance configuration here
    }
    ngAfterViewInit() {
        this.showProgressSubscription = this.progressService.loaderStatus.subscribe((value) => {
            if (this.loadingProgress) {
                this.loadingProgress.val(value);
                if (value === 100) {
                    this.progressService.hideLoaderStatus(true);
                }
            }
        })
    }
    ngOnInit() {

        if(!this.progressService.hideLoader){
            this.progressService.hideLoader = new BehaviorSubject<boolean>(false);
            this.hideLoader = this.progressService.hideLoader;
        }else{
            this.hideLoader = this.progressService.hideLoader;
        }


        let params: URLSearchParams = new URLSearchParams();

        this.launchPropertiesService.getLaunchProperties(params).first().subscribe((response: any) => {
            this.launchProperties = response;
            this.getProps(response);
            this.gnomexService.coreFacilityList = response.CoreFacilities;
            console.log("launch properties");
            this.progressService.displayLoader(10);

        });


        if(!this.gnomexService.isLoggedIn){

            if(this.gnomexService.orderInitObj){
                if(this.gnomexService.orderInitObj.isGuest){
                    this.gnomexService.initGuestApp();
                }else{
                    this.gnomexService.initApp();
                }
            }else{
                this.gnomexService.initApp();
            }

        }


        this.gnomexService.isAppInitCompleteObservable().first().subscribe(complete =>{
            if(this.gnomexService.redirectURL){
                console.log(this.router.parseUrl(this.gnomexService.redirectURL));
                this.router.navigateByUrl("/" + this.gnomexService.redirectURL);
            }
        });
    }

    getProps(response: any) {

        for (var p of response.Property) {
            switch(p.name) {
                case "site_splash" : {
                    this.site_splash = p.value;
                    break;
                }
                case "site_logo" : {
                    this.site_logo = p.value;
                    break;
                }
            }
        }
        if (!this.site_splash) {
            this.site_splash = "./assets/gnomex_splash_logo.png";
        }
        if (!this.site_logo) {
            this.site_logo = "./assets/gnomex_logo.png";
        }
    }

    public myInput: string;
    public searchText: string;

    public myErrorStateMatcher(): boolean {
        return true;
    }
    public searchNumber() {
        console.log(this.myInput);
    }
    public searchByText() {
        console.log(this.searchText);
    }
    public browseExp() {
        console.log('Browse Experiments selected');
    }

    ngOnDestroy(): void {
        this.showProgressSubscription.unsubscribe();
    }
}

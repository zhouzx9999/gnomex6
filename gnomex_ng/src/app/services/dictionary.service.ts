import {Injectable} from "@angular/core";
import {Http} from "@angular/http";
import {Observable} from "rxjs/Observable";
import {HttpService} from "./http.service";
import {ProgressService} from "../home/progress.service";

@Injectable()
export class DictionaryService {

    public static readonly BILLING_PERIOD: string = "hci.gnomex.model.BillingPeriod";
    public static readonly CORE_FACILITY: string = "hci.gnomex.model.CoreFacility";
    public static readonly GENOME_BUILD: string = "hci.gnomex.model.GenomeBuildLite";
    public static readonly OLIGO_BARCODE: string = "hci.gnomex.model.OligoBarcode";
    public static readonly ORGANISM: string = "hci.gnomex.model.OrganismLite";
    public static readonly PROPERTY_DICTIONARY: string = "hci.gnomex.model.PropertyDictionary";
    public static readonly REQUEST_CATEGORY: string = "hci.gnomex.model.RequestCategory";
    public static readonly SEQ_LIB_PROTOCOL: string = "hci.gnomex.model.SeqLibProtocol";
    public static readonly APPLICATION:string = "hci.gnomex.model.Application";
    public static readonly ANNOTATION_REPORT_FIELD = "hci.gnomex.model.AnnotationReportField";
    public static readonly VISIBILTY: string = "hci.gnomex.model.Visibility";
    public static readonly INSTITUTION: string = "hci.gnomex.model.Institution";

    private cachedDictionaryString: any;
    private cacheExpirationTime: number = 0;
    private reloadObservable: Observable<any> = null;
    private CACHE_EXPIRATION_MILLIS = 600000;   // ten minutes = 600000 millis

    constructor(private _http: Http, private progressService: ProgressService) {}

    /**
     * Forces a full reload of the dictionary, returns an observable of an empty object when it is done.
     * Provide a callback function to query the dictionary if you need it to run after the reload is complete
     * This should be called when the application first loads.
     * @param callback A function to be called when the reload is complete
     */
    reload(callback?): void {
        if (this.reloadObservable) {
            this.reloadObservable.subscribe((response) => {
                if (callback) {
                    callback();
                }
            });
        } else {
            this.reloadObservable = this.loadDictionaries();
            this.reloadObservable.subscribe((response) => {
                this.cachedDictionaryString = JSON.stringify(response);
                this.cacheExpirationTime = Date.now() + this.CACHE_EXPIRATION_MILLIS;
                this.reloadObservable = null;
                console.log("************RELOAD************ the dictionaries");
//                console.log(JSON.stringify(this.getEntriesExcludeBlank(DictionaryService.CORE_FACILITY)));
//                console.log("******************************");
                this.progressService.displayLoader(100);
                if (callback) {
                    callback();
                }
            });
        }
    }

    private loadDictionaries(): Observable<any> {
        return HttpService.getJson(this._http, "/gnomex/ManageDictionaries.gx?action=load", {withCredentials: true}, "loadDictionaries");
    }

    /**
     * Internal method to get a copy of the current cached dictionary
     * If the cached dictionary has expired this will initiate a reload but not wait for the newest version
     * @returns {any[]}
     */
    private getDictionaries(): any[] {
        if (Date.now() > this.cacheExpirationTime) {
            this.reload();
        }
        return JSON.parse(this.cachedDictionaryString);
    }

    private sortArrayByField(array: any[], fieldName: string) {
        return array.sort((o1, o2) => {
            if (o1[fieldName] < o2[fieldName]) {
                return -1;
            } else if (o1[fieldName] > o2[fieldName]) {
                return 1;
            } else {
                return 0;
            }
        });
    }

    /**
     * Get an array of all dictionary objects (no entries), sorted by displayName
     * @returns {any[]}
     */
    getAllDictionaries(): any[] {
        let dictionaries: any[] = this.getDictionaries();
        for (let dictionary of dictionaries) {
            delete dictionary.DictionaryEntry;
        }
        return this.sortArrayByField(dictionaries, "displayName");
    }

    /**
     * Get an array of all editable dictionary objects (no entries), sorted by displayName
     * @returns {any[]}
     */
    getEditableDictionaries(): any[] {
        return this.getAllDictionaries().filter((value) => (value.canWrite == "Y"));
    }

    /**
     * Get the dictionary object (no entries) for a specific className, returns undefined if not found
     * @param {string} className
     * @returns {any}
     */
    getDictionary(className: string): any {
        return this.getAllDictionaries().find((value) => (value.className == className));
    }

    /**
     * Get all dictionary entries for a specific className, including blank entries, sorted by display
     * Returns an empty array if not found
     * @param {string} className
     * @returns {any[]}
     */
    getEntries(className: string): any[] {
        let dictionaries: any[] = this.getDictionaries();
        let dictionary: any = dictionaries.find((value) => (value.className == className));
        if (dictionary) {
            return this.sortArrayByField(dictionary.DictionaryEntry, "display");
        } else {
            return [];
        }
    }

    /**
     * Get all dictionary entries for a specific className, excluding blank entries, sorted by display
     * Returns an empty array if not found
     * @param {string} className
     * @returns {any[]}
     */
    getEntriesExcludeBlank(className: string): any[] {
        return this.getEntries(className).filter((value) => value.value != "");
    }

    /**
     * Get all core facilities
     * @returns {any[]}
     */
    coreFacilities(): any[] {
        return this.getEntries(DictionaryService.CORE_FACILITY);
    }

    /**
     * Get the dictionary entry for a specific className and value. Returns undefined if no match is found.
     * @param {string} className
     * @param {string} value
     * @returns {any}
     */
    getEntry(className: string, value: string): any {
        return this.getEntries(className).find((entry) => entry.value == value);
    }

    /**
     * Returns an array of dictionary entries for a specific className and array of values.
     * @param {string} className
     * @param {string[]} values
     * @returns {any}
     */
    getEntryArray(className: string, values: string[]): any {
        if (!values) {
            return [];
        }
        if (Array.isArray(values)) {
            return values.map((value) => this.getEntry(className, value));
        } else {
            return this.getEntry(className, values);
        }
    }

    /**
     * Returns the display text for the dictionary entry matching the className and value provided.
     * Returns an empty string if no match is found.
     * @param {string} className
     * @param {string} value
     * @returns {string}
     */
    getEntryDisplay(className: string, value: string): string {
        let entry = this.getEntry(className, value);
        if (entry && entry.display) {
            return entry.display;
        } else {
            return "";
        }
    }

}

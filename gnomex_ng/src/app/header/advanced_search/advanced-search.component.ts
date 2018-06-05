import {
    Component,
    ElementRef,
    HostListener,
    Inject,
    OnInit,
    OnDestroy,
    ViewChild
} from "@angular/core";
import {MatDialogRef, MatDialog, MAT_DIALOG_DATA, DialogPosition} from "@angular/material";
import {ITreeOptions, TreeComponent, TreeModel, TreeNode} from "angular-tree-component";

import {TextAlignLeftMiddleRenderer} from "../../util/grid-renderers/text-align-left-middle.renderer";
import {AdvancedSearchService} from "./advanced-search.service";
import {Subscription} from "rxjs/Subscription";
import {DialogsService} from "../../util/popup/dialogs.service";
import {SpinnerDialogComponent} from "../../util/popup/spinner-dialog.component";

import {TextSelectXorMultiselectEditor} from "../../util/grid-editors/text-select-xor-multiselect.editor";
import {TextSelectXorMultiselectRenderer} from "../../util/grid-renderers/text-select-xor-multiselect.renderer";
import {SelectRenderer} from "../../util/grid-renderers/select.renderer";
import {IconTextRendererComponent} from "../../util/grid-renderers/icon-text-renderer.component";
import {DateRenderer} from "../../util/grid-renderers/date.renderer";
import {DictionaryService} from "../../services/dictionary.service";
import {TextAlignRightMiddleRenderer} from "../../util/grid-renderers/text-align-right-middle.renderer";
import {DateParserComponent} from "../../util/parsers/date-parser.component";

@Component({
    selector: 'advanced-search-component',
    templateUrl: 'advanced-search.component.html',
    styles: [`
        
        .inline-block { display: inline-block; }
        
        .full-height { height: 100%; }
        .full-width  { width:  100%; }
        
        .padding     { padding:     0.6em; }
        .padding-top { padding-top: 0.6em; }
        
        .no-margin  { margin:  0; }
        .no-padding { padding: 0; }
        
        .t  { display: table;      }
        .tr { display: table-row;  }
        .td { display: table-cell; }
        
        .flex-container { 
            display: flex;
            flex-direction: column; 
        }
        .flex-fill {
            flex: 1;
        }
        
        .header { 
            background-color: #84b278; 
            color: white; 
            display: inline-block;
        }
        .body { 
            overflow: auto; 
            font-size: small; 
        }
        
        .body-size { 
            min-height: 25em;
            margin: 0.4em 0.4em 0 0.4em;
        }
        
        .label {
            padding: 0 3em 0 0.5em;
            vertical-align: top;
            color: darkblue;
        }
        .mat-input-label {
            padding: 0 0.5em;
            vertical-align: center;
            color: darkblue;
        }
        
        .margin    { margin: 0.4em; }
        
        .background       { background-color: #eeeeeb; }
        .light-background { background-color: #ffffff; }
        
        .right-aligned { text-align: right; }

        .horizontal-rule-container {
            padding: 2px 2px 2px 0;
        }
        .horizontal-rule-label-container {
            padding: 2px 0 2px 2px;
        }
        .horizontal-rule {
            height: 1px;
            background-color: #ebeae8;
        }
        .horizontal-rule-label {
            height: 1px;
            background-color: #ebeae8;
        }
        
        .row-vertical-spacing-a {
            height: 0.6em;
        }
        .row-vertical-spacing-b {
            height: 0.2em;
        }
        
        .button-container { 
            text-align:left; 
            padding:0.4em; 
        }

        .button-bar {
            display: table-cell;
            vertical-align: middle;
        }
        .vertical-spacer {
            display: inline-block;
            vertical-align: middle;
            width: 1px;
            height: 2em;
            background-color: #ebeae8;
            margin: 0.1em;
        }

        .radio-button {
            margin: 0 2em 0 0;
            padding: 0;
        }
        
        .grid-container {
            width:  100%; 
        }
        
        .medium-input {
            width: 20em;
        }
        
        .fixed-height {
            min-height: 35em;
            max-height: 35em;
            height: 35em;
        }
        
        .grabbable {
            cursor: move;
            cursor: -webkit-grab;
        }
        .grabbed {
            cursor: move;
            cursor: -webkit-grabbing;
        }
        
        .small-as-possible {
            min-width:  0;
            min-height: 0;
        }
        
        .vertical-align-center { vertical-align: middle; }
        
        .font-large { font-size: large; }
        
        .box-border {
            border-style: inset;
            border-color: lightgrey;
            border-width: 2px;
            
            overflow: auto;
            object-fit: none;
        }
        
        .maximum-size {
            overflow: auto;
            object-fit: none;
        }
    `]
})
export class AdvancedSearchComponent implements OnInit, OnDestroy {

    @ViewChild("searchResultsTree") treeComponent: TreeComponent;

    readonly ALL_OBJECTS : string = 'ALL_OBJECTS';
    readonly EXPERIMENTS : string = 'EXPERIMENTS';
    readonly ANALYSES    : string = 'ANALYSES';
    readonly PROTOCOLS   : string = 'PROTOCOLS';
    readonly DATA_TRACKS : string = 'DATA_TRACKS';
    readonly TOPICS      : string = 'TOPICS';

    readonly MATCH_ALL_TERMS : string = 'MATCH_ALL_TERMS';
    readonly MATCH_ANY_TERM  : string = 'MATCH_ANY_TERM';

    movingDialog: boolean = false;

    searchText: string = '';
    searchType: string = this.ALL_OBJECTS;
    matchType:  string = this.MATCH_ALL_TERMS;

    private _resultType: string = this.ALL_OBJECTS;
    private _treeResultType: string = this.EXPERIMENTS;

    context: any = this;

    newSearchGridApi: any;
    newSearchGridColumnApi: any;

    searchResultsGridApi: any;
    searchResultsGridColumnApi: any;

    originalXClick: number = 0;
    originalYClick: number = 0;

    @ViewChild('topmostLeftmost') topmostLeftmost: ElementRef;

    protected positionX: number = 0;
    protected positionY: number = 0;

    private allObjectSearchList: any[];
    private experimentSearchList: any[];
    private analysisSearchList: any[];
    private protocolSearchList: any[];
    private dataTrackSearchList: any[];
    private topicSearchList: any[];

    private dictionaryMap: any[];

    private allObjectSearchListSubscription:  Subscription;
    private experimentSearchListSubscription: Subscription;
    private analysisSearchListSubscription:   Subscription;
    private protocolSearchListSubscription:   Subscription;
    private dataTrackSearchListSubscription:  Subscription;
    private topicSearchListSubscription:      Subscription;

    private dictionaryMapSubscription: Subscription;

    private searchResultsSubscription: Subscription;

    private spinnerRef: MatDialogRef<SpinnerDialogComponent>;

    private currentlyDisplayedRowData: any|any[] = [];

    private visibilityDictionary: any[];
    private requestCategoryDictionary: any[];

    selectedTabIndex: number = 0;

    private wholeLastSearchData: any[];

    private lastSearchDataAllObjects:  any[];
    private lastSearchDataExperiments: any[];
    private lastSearchDataAnalyses:    any[];
    private lastSearchDataProtocols:   any[];
    private lastSearchDataDataTracks:  any[];
    private lastSearchDataTopics:      any[];

    private lastSearchTreeNodesExperiments: any[] = [];
    private lastSearchTreeNodesAnalyses:    any[] = [];
    private lastSearchTreeNodesProtocols:   any[] = [];
    private lastSearchTreeNodesDataTracks:  any[] = [];
    private lastSearchTreeNodesTopics:      any[] = [];

    private numberOfAllObjectResults:  number = 0;
    private numberOfExperimentResults: number = 0;
    private numberOfAnalysisResults:   number = 0;
    private numberOfProtocolResults:   number = 0;
    private numberOfDataTrackResults:  number = 0;
    private numberOfTopicResults:      number = 0;

    treeNodes: any;

    treeOptions: ITreeOptions = {
        idField: "id",
        displayField: "displayField",
        childrenField: "childrenField"
        // nodeClass: (node: TreeNode) => {
        //     return "icon-" + node.data.gridIcon;
        // },
    };

    private treeModel: TreeModel;

    private nodeIndex: number = 0;

    private searchAfterLoad: boolean = false;

    private gotAllObjectSearchList : boolean   = false;
    private gotExperimentSearchList : boolean  = false;
    private gotAnalysisSearchList : boolean    = false;
    private gotProtocolSearchList : boolean    = false;
    private gotDataTrackSearchList : boolean   = false;
    private gotTopicSearchList : boolean       = false;
    private gotDictionaryMap : boolean         = false;

    constructor(private dialog: MatDialog,
                private dialogRef: MatDialogRef<AdvancedSearchComponent>,
                private dialogService: DialogsService,
                private dictionaryService: DictionaryService,
                private advancedSearchService: AdvancedSearchService,
                @Inject(MAT_DIALOG_DATA) private data) {
        if (data) {
            this.searchText = !!data.searchText ? data.searchText : '';

            if (!!data.searchText) {
                this.searchAfterLoad = true;
            }
        }

        this.spinnerRef = this.dialogService.startDefaultSpinnerDialog();

        this.allObjectSearchListSubscription = this.advancedSearchService.getAllObjectSearchListObservable().subscribe((list) => {
            this.allObjectSearchList = list;
            this.gotAllObjectSearchList = true;
            this.onSearchTypeChanged();
        });
        this.experimentSearchListSubscription = this.advancedSearchService.getExperimentSearchListObservable().subscribe((list) => {
            this.experimentSearchList = list;
            this.gotExperimentSearchList = true;
            this.onSearchTypeChanged();
        });
        this.analysisSearchListSubscription = this.advancedSearchService.getAnalysisSearchListObservable().subscribe((list) => {
            this.analysisSearchList = list;
            this.gotAnalysisSearchList = true;
            this.onSearchTypeChanged();
        });
        this.protocolSearchListSubscription = this.advancedSearchService.getProtocolSearchListObservable().subscribe((list) => {
            this.protocolSearchList = list;
            this.gotProtocolSearchList = true;
            this.onSearchTypeChanged();
        });
        this.dataTrackSearchListSubscription = this.advancedSearchService.getDataTrackSearchListObservable().subscribe((list) => {
            this.dataTrackSearchList = list;
            this.gotDataTrackSearchList = true;
            this.onSearchTypeChanged();
        });
        this.topicSearchListSubscription = this.advancedSearchService.getTopicSearchListObservable().subscribe((list) => {
            this.topicSearchList = list;
            this.gotTopicSearchList = true;
            this.onSearchTypeChanged();
        });

        this.dictionaryMapSubscription = this.advancedSearchService.getDictionaryMapObservable().subscribe((list) => {
            this.dictionaryMap = list;
            this.gotDictionaryMap = true;
            this.onSearchTypeChanged();
        });

        this.searchResultsSubscription = this.advancedSearchService.getSearchResultObservable().subscribe((results) => {
            this.processSearchResults(results);
            this.selectedTabIndex = 1; // Change the tab to the Search Results
            if (!!this.spinnerRef) {
                this.spinnerRef.close();
            }
        });

        this.visibilityDictionary = this.dictionaryService.getEntriesExcludeBlank("hci.gnomex.model.Visibility");
        this.requestCategoryDictionary = this.dictionaryService.getEntriesExcludeBlank("hci.gnomex.model.RequestCategory");
    }

    ngOnInit() {
        this.treeModel = this.treeComponent.treeModel;
    }
    ngOnDestroy() { }

    assignNewSearchGridContents(): void {
        if (this.newSearchGridApi) {
            this.newSearchGridApi.setRowData([]);
            this.newSearchGridApi.setColumnDefs(this.getNewSearchColumnDefinitions());
            this.newSearchGridApi.sizeColumnsToFit();
        }
    }

    private getNewSearchColumnDefinitions(): any[] {
        return [
            {
                headerName: "Specific Field",
                editable: false,
                width: 100,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "displayName"
            },
            {
                headerName: "Value (Partial or Whole) to Search for",
                editable: true,
                width: 300,
                cellRendererFramework: TextSelectXorMultiselectRenderer,
                cellEditorFramework: TextSelectXorMultiselectEditor,
                field: "value"
            }
        ];
    }

    assignSearchResultsGridContents(): void {
        if (this.searchResultsGridApi) {
            this.searchResultsGridApi.setRowData([]);
            this.searchResultsGridApi.setColumnDefs([]);
            this.searchResultsGridApi.sizeColumnsToFit();
        }
    }

    onNewSearchGridReady(event: any): void {
        this.newSearchGridApi = event.api;
        this.newSearchGridColumnApi = event.columnApi;

        this.assignNewSearchGridContents();
        this.onNewSearchGridSizeChanged();
    }
    onSearchResultsGridReady(event: any): void {
        this.searchResultsGridApi = event.api;
        this.searchResultsGridColumnApi = event.columnApi;

        this.assignSearchResultsGridContents();
        this.onSearchResultsGridSizeChanged();

    }

    onNewSearchGridSizeChanged(): void {
        if (this.newSearchGridApi) {
            this.newSearchGridApi.sizeColumnsToFit();
        }
    }
    onSearchResultsGridSizeChanged(): void {
        if (this.searchResultsGridApi) {
            this.searchResultsGridApi.sizeColumnsToFit();
        }
    }

    onMouseDownHeader(event: any): void {
        if (!event) {
            return;
        }

        this.positionX = this.topmostLeftmost.nativeElement.offsetLeft;
        this.positionY = this.topmostLeftmost.nativeElement.offsetTop;

        this.originalXClick = event.screenX;
        this.originalYClick = event.screenY;

         this.movingDialog = true;
    }

    @HostListener('window:mousemove', ['$event'])
    onMouseMove(event: any): void {
        if (!event) {
            return;
        }

        if (this.movingDialog) {
            this.positionX += event.screenX - this.originalXClick;
            this.positionY += event.screenY - this.originalYClick;

            this.originalXClick = event.screenX;
            this.originalYClick = event.screenY;

            let newDialogPosition: DialogPosition = {
                left:   '' + this.positionX + 'px',
                top:    '' + this.positionY + 'px',
            };

            this.dialogRef.updatePosition(newDialogPosition);
        }
    }

    @HostListener('window:mouseup', ['$event'])
    onMouseUp(): void {
        this.movingDialog = false;
    }

    onClickSearchButton(): void {
        this.resultType = this.searchType;
        this.spinnerRef = this.dialogService.startDefaultSpinnerDialog();
        this.advancedSearchService.search(this.searchType, this.searchText, this.currentlyDisplayedRowData, this.matchType);
    }

    onClickClearButton(): void {
        console.log("This should clear the search terms from the window, shown and unshown.");
    }

    onClickCancelButton(): void {
        this.dialogRef.close();
    }

    onSearchTypeChanged() {
        if (!this.newSearchGridApi || !this.dictionaryMap) {
            return;
        }

        let rowData: any[] = [];

        switch (this.searchType) {
            case this.ALL_OBJECTS : rowData = this.allObjectSearchList;  break;
            case this.EXPERIMENTS : rowData = this.experimentSearchList; break;
            case this.ANALYSES    : rowData = this.analysisSearchList;   break;
            case this.PROTOCOLS   : rowData = this.protocolSearchList;   break;
            case this.DATA_TRACKS : rowData = this.dataTrackSearchList;  break;
            case this.TOPICS      : rowData = this.topicSearchList;      break;
            default : // Do nothing;
        }

        if (!rowData) {
            rowData = [];
        } else {
            // Due to XML parsing of single elements.
            if (Array.isArray(rowData) && rowData.length == 1 && !!rowData[0].Field) {
                rowData[0] = rowData[0].Field;
            }

            if (!Array.isArray(rowData)) {
                rowData = [rowData];
            }
        }

        if (rowData && Array.isArray(rowData) && this.dictionaryMap && Array.isArray(this.dictionaryMap)) {
            for (let row of rowData) {

                if (row.isOptionChoice && row.isOptionChoice.toLowerCase() === 'y') {
                    for (let dictionary of this.dictionaryMap) {
                        if (dictionary.fieldName === row.displayName) {
                            row.dictionary = dictionary;
                        }
                    }
                }
            }
        }

        this.newSearchGridApi.setRowData(rowData);
        this.currentlyDisplayedRowData = rowData;

        if (!!this.spinnerRef) {
            this.spinnerRef.close();
        }

        if (this.searchAfterLoad
            && (this.gotAllObjectSearchList
                && this.gotExperimentSearchList
                && this.gotAnalysisSearchList
                && this.gotProtocolSearchList
                && this.gotDataTrackSearchList
                && this.gotTopicSearchList
                && this.gotDictionaryMap)) {
            this.searchAfterLoad = false;
            setTimeout(() => { this.onClickSearchButton(); });
        }
    }

    private processSearchResults(results: any): void {
        console.log(results);

        this.wholeLastSearchData = results;

        if (results && Array.isArray(results) && results.length === 1) {
            // Get "All Results" Results
            if (results[0].GlobalList) {
                if (Array.isArray(results[0].GlobalList)) {
                    this.lastSearchDataAllObjects = results[0].GlobalList;
                } else {
                    this.lastSearchDataAllObjects = [results[0].GlobalList.Global];
                }

                if (this.resultType === this.ALL_OBJECTS && this.searchResultsGridApi) {
                    this.searchResultsGridApi.setRowData(this.lastSearchDataAllObjects);
                }

                this.numberOfAllObjectResults = this.lastSearchDataAllObjects.length;
            } else {
                this.numberOfAllObjectResults = 0;
            }

            // Get "Experiments" Results
            if (results[0].RequestList) {
                if (Array.isArray(results[0].RequestList)) {
                    this.lastSearchDataExperiments = results[0].RequestList;
                } else {
                    this.lastSearchDataExperiments = [results[0].RequestList.Request];
                }

                if (this.resultType === this.EXPERIMENTS && this.searchResultsGridApi) {
                    this.searchResultsGridApi.setRowData(this.lastSearchDataExperiments);
                }

                this.numberOfExperimentResults = this.lastSearchDataExperiments.length;
            } else {
                this.numberOfExperimentResults = 0;
            }

            // Get "Analyses" Results
            if (results[0].AnalysisList) {
                if (Array.isArray(results[0].AnalysisList)) {
                    this.lastSearchDataAnalyses = results[0].AnalysisList;
                } else {
                    this.lastSearchDataAnalyses = [results[0].AnalysisList.Analysis];
                }

                for (let analysisSearchResult of this.lastSearchDataAnalyses) {
                    let submittedBy: string = '';
                    let temp: string;
                    let addedFirstName: boolean = false;

                    if (analysisSearchResult.ownerFirstName && ('' + analysisSearchResult.ownerFirstName).length > 0) {
                        addedFirstName = true;
                        temp = ('' + analysisSearchResult.ownerFirstName);
                        submittedBy += (temp.substr(0, 1).toUpperCase() + temp.substr(1, temp.length));
                    }

                    if (analysisSearchResult.ownerLastName && ('' + analysisSearchResult.ownerLastName).length > 0) {
                        if (addedFirstName) {
                            submittedBy += ' ';
                        }

                        temp = ('' + analysisSearchResult.ownerLastName);
                        submittedBy += (temp.substr(0, 1).toUpperCase() + temp.substr(1, temp.length));
                    }

                    analysisSearchResult.submittedBy = submittedBy;
                }

                if (this.resultType === this.ANALYSES && this.searchResultsGridApi) {
                    this.searchResultsGridApi.setRowData(this.lastSearchDataAnalyses);
                }

                this.numberOfAnalysisResults = this.lastSearchDataAnalyses.length;
            } else {
                this.numberOfAnalysisResults = 0;
            }

            // Get "Protocol" Results
            if (results[0].ProtocolList) {
                if (Array.isArray(results[0].ProtocolList)) {
                    this.lastSearchDataProtocols = results[0].ProtocolList;
                } else {
                    this.lastSearchDataProtocols = [results[0].ProtocolList.Protocol];
                }

                if (this.resultType === this.PROTOCOLS && this.searchResultsGridApi) {
                    this.searchResultsGridApi.setRowData(this.lastSearchDataProtocols);
                }

                this.numberOfProtocolResults= this.lastSearchDataProtocols.length;
            } else {
                this.numberOfProtocolResults = 0;
            }

            // Get "Data Track" Results
            if (results[0].DataTrackList) {
                if (Array.isArray(results[0].DataTrackList)) {
                    this.lastSearchDataDataTracks = results[0].DataTrackList;
                } else {
                    this.lastSearchDataDataTracks = [results[0].DataTrackList.DataTrack];
                }

                for (let analysisSearchResult of this.lastSearchDataDataTracks) {
                    let submittedBy: string = '';
                    let temp: string;
                    let addedFirstName: boolean = false;

                    if (analysisSearchResult.ownerFirstName && ('' + analysisSearchResult.ownerFirstName).length > 0) {
                        addedFirstName = true;
                        temp = ('' + analysisSearchResult.ownerFirstName);
                        submittedBy += (temp.substr(0, 1).toUpperCase() + temp.substr(1, temp.length));
                    }

                    if (analysisSearchResult.ownerLastName && ('' + analysisSearchResult.ownerLastName).length > 0) {
                        if (addedFirstName) {
                            submittedBy += ' ';
                        }

                        temp = ('' + analysisSearchResult.ownerLastName);
                        submittedBy += (temp.substr(0, 1).toUpperCase() + temp.substr(1, temp.length));
                    }

                    analysisSearchResult.submittedBy = submittedBy;
                }

                if (this.resultType === this.DATA_TRACKS && this.searchResultsGridApi) {
                    this.searchResultsGridApi.setRowData(this.lastSearchDataDataTracks);
                }

                this.numberOfDataTrackResults = this.lastSearchDataDataTracks.length;
            } else {
                this.numberOfDataTrackResults = 0;
            }

            // Get "Topic" Results
            if (results[0].TopicList) {
                if (Array.isArray(results[0].TopicList)) {
                    this.lastSearchDataTopics = results[0].TopicList;
                } else {
                    this.lastSearchDataTopics = [results[0].TopicList.Topic];
                }

                if (this.resultType === this.TOPICS && this.searchResultsGridApi) {
                    this.searchResultsGridApi.setRowData(this.lastSearchDataTopics);
                }

                this.numberOfTopicResults = this.lastSearchDataTopics.length;
            } else {
                this.numberOfTopicResults = 0;
            }


            // Get "Experiment" Tree Results
            if (results[0].ProjectRequestList) {
                if (Array.isArray(results[0].ProjectRequestList)) {
                    this.lastSearchTreeNodesExperiments = results[0].ProjectRequestList;
                }
                // else {
                //     this.lastSearchTreeNodesExperiments = [results[0].ProjectRequestList.Lab];
                // }

                if (this.treeResultType === this.EXPERIMENTS && this.lastSearchTreeNodesExperiments) {
                    //this.setupResultTreeForExperiments();
                }
            }




        }
    }

    get resultType(): string {
        return this._resultType;
    }
    set resultType(resultType: string) {
        if (resultType) {
            switch (resultType) {
                case this.ALL_OBJECTS : this._resultType = resultType; this.setupResultGridForAllObjects();  break;
                case this.EXPERIMENTS : this._resultType = resultType; this.setupResultGridForExperiments(); break;
                case this.ANALYSES    : this._resultType = resultType; this.setupResultGridForAnalyses();    break;
                case this.PROTOCOLS   : this._resultType = resultType; this.setupResultGridForProtocols();   break;
                case this.DATA_TRACKS : this._resultType = resultType; this.setupResultGridForDataTracks();  break;
                case this.TOPICS      : this._resultType = resultType; this.setupResultGridForTopics();      break;
                default : // do nothing.
            }
        }
    }

    get treeResultType(): string {
        return this._treeResultType;
    }
    set treeResultType(treeResultType: string) {
        if (treeResultType) {
            switch (treeResultType) {
                case this.EXPERIMENTS : this._treeResultType = treeResultType; this.setupResultTreeForExperiments(); break;
                case this.ANALYSES    : this._treeResultType = treeResultType; this.setupResultTreeForAnalyses();    break;
                case this.PROTOCOLS   : this._treeResultType = treeResultType; this.setupResultTreeForProtocols();   break;
                case this.DATA_TRACKS : this._treeResultType = treeResultType; this.setupResultTreeForDataTracks();  break;
                case this.TOPICS      : this._treeResultType = treeResultType; this.setupResultTreeForTopics();      break;
                default : // do nothing.
            }
        }
    }

    private setupResultGridForAllObjects() : void {
        let allObjectsColumnDefinitions: any[] = [
            {
                headerName: "Rank",
                editable: false,
                width: 15,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "searchRank"
            },
            {
                headerName: "Score",
                editable: false,
                width: 15,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "searchScore"
            },
            {
                headerName: "Number",
                editable: false,
                width: 30,
                cellRendererFramework: IconTextRendererComponent,
                field: "number"
            },
            {
                headerName: "Name",
                editable: false,
                width: 100,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "name"
            },
            {
                headerName: "Group",
                editable: false,
                width: 150,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "labName"
            },
            {
                headerName: "Visibility",
                editable: false,
                width: 50,
                cellRendererFramework: SelectRenderer,
                selectOptions: this.visibilityDictionary,
                selectOptionsValueField: 'value',
                selectOptionsDisplayField: 'display',
                field: "codeVisibility"
            }
        ];

        if (this.searchResultsGridApi) {
            this.searchResultsGridApi.setRowData(this.lastSearchDataAllObjects);
            this.searchResultsGridApi.setColumnDefs(allObjectsColumnDefinitions);
            this.searchResultsGridApi.sizeColumnsToFit();
        }
    }
    private setupResultGridForExperiments() : void {
        let dateParser: DateParserComponent = new DateParserComponent(
            DateParserComponent.DEFAULT_RECEIVED_DATE_FORMAT,
            DateParserComponent.DEFAULT_DISPLAY_DATE_FORMAT
        );

        let experimentsColumnDefinitions: any[] = [
            {
                headerName: "Rank",
                editable: false,
                width: 25,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "searchRank"
            },
            {
                headerName: "Score",
                editable: false,
                width: 25,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "searchScore"
            },
            {
                headerName: "Request",
                editable: false,
                width: 40,
                cellRendererFramework: TextAlignRightMiddleRenderer,
                field: "requestNumber"
            },
            {
                headerName: "Category",
                editable: false,
                width: 100,
                cellRendererFramework: SelectRenderer,
                selectOptions: this.requestCategoryDictionary,
                selectOptionsValueField: 'value',
                selectOptionsDisplayField: 'display',
                field: "codeRequestCategory"
            },
            {
                headerName: "Request Date",
                editable: false,
                width: 50,
                cellRendererFramework: DateRenderer,
                dateParser: dateParser,
                field: "requestCreateDate"
            },
            {
                headerName: "Group",
                editable: false,
                width: 100,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "labName"
            },
            {
                headerName: "Project",
                editable: false,
                width: 150,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "projectName"
            },
            {
                headerName: "Microarray",
                editable: false,
                width: 120,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "slideProductName"
            },
            {
                headerName: "Visibility",
                editable: false,
                width: 50,
                cellRendererFramework: SelectRenderer,
                selectOptions: this.visibilityDictionary,
                selectOptionsValueField: 'value',
                selectOptionsDisplayField: 'display',
                field: "codeVisibility"
            }
        ];

        if (this.searchResultsGridApi) {
            this.searchResultsGridApi.setRowData(this.lastSearchDataExperiments);
            this.searchResultsGridApi.setColumnDefs(experimentsColumnDefinitions);
            this.searchResultsGridApi.sizeColumnsToFit();
        }
    }
    private setupResultGridForAnalyses() : void {
        let dateParser: DateParserComponent = new DateParserComponent(
            DateParserComponent.DEFAULT_RECEIVED_DATE_FORMAT,
            DateParserComponent.DEFAULT_DISPLAY_DATE_FORMAT
        );

        let analysesColumnDefinitions: any[] = [
            {
                headerName: "Rank",
                editable: false,
                width: 30,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "searchRank"
            },
            {
                headerName: "Score",
                editable: false,
                width: 35,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "searchScore"
            },
            {
                headerName: "Analyis #",
                editable: false,
                width: 45,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "number"
            },
            {
                headerName: "Type",
                editable: false,
                width: 70,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "analysisType"
            },
            {
                headerName: "Organism",
                editable: false,
                width: 70,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "organism"
            },
            {
                headerName: "Analysis Group",
                editable: false,
                width: 110,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "analysisGroupName"
            },
            {
                headerName: "Group",
                editable: false,
                width: 110,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "labName"
            },
            {
                headerName: "Analysis Name",
                editable: false,
                width: 100,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "name"
            },
            {
                headerName: "Protocol",
                editable: false,
                width: 55,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "analysisProtocol"
            },
            {
                headerName: "Submitted By",
                editable: false,
                width: 75,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "submittedBy"
            },
            {
                headerName: "Submit Date",
                editable: false,
                width: 75,
                cellRendererFramework: DateRenderer,
                dateParser: dateParser,
                field: "createDate"
            },
            {
                headerName: "Visibility",
                editable: false,
                width: 50,
                cellRendererFramework: SelectRenderer,
                selectOptions: this.visibilityDictionary,
                selectOptionsValueField: 'value',
                selectOptionsDisplayField: 'display',
                field: "codeVisibility"
            }
        ];

        if (this.searchResultsGridApi) {
            this.searchResultsGridApi.setRowData(this.lastSearchDataAnalyses);
            this.searchResultsGridApi.setColumnDefs(analysesColumnDefinitions);
            this.searchResultsGridApi.sizeColumnsToFit();
        }
    }
    private setupResultGridForProtocols() : void {

        let protocolColumnDefinitions: any[] = [
            {
                headerName: "Rank",
                editable: false,
                width: 30,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "searchRank"
            },
            {
                headerName: "Score",
                editable: false,
                width: 35,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "searchScore"
            },
            {
                headerName: "Type",
                editable: false,
                width: 100,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "protocolType"
            },
            {
                headerName: "Name",
                editable: false,
                width: 300,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "name"
            }
        ];

        if (this.searchResultsGridApi) {
            this.searchResultsGridApi.setRowData(this.lastSearchDataProtocols);
            this.searchResultsGridApi.setColumnDefs(protocolColumnDefinitions);
            this.searchResultsGridApi.sizeColumnsToFit();
        }
    }
    private setupResultGridForDataTracks() : void {
        let dateParser: DateParserComponent = new DateParserComponent(
            DateParserComponent.DEFAULT_RECEIVED_DATE_FORMAT,
            DateParserComponent.DEFAULT_DISPLAY_DATE_FORMAT
        );

        let dataTracksColumnDefinitions: any[] = [
            {
                headerName: "Rank",
                editable: false,
                width: 20,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "searchRank"
            },
            {
                headerName: "Score",
                editable: false,
                width: 25,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "searchScore"
            },
            {
                headerName: "Data Track #",
                editable: false,
                width: 45,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "fileName"
            },
            {
                headerName: "Group",
                editable: false,
                width: 110,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "labName"
            },
            {
                headerName: "Data Track Name",
                editable: false,
                width: 100,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "name"
            },
            {
                headerName: "Data Track Folder",
                editable: false,
                width: 150,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "dataTrackFolderName"
            },
            {
                headerName: "Submitted By",
                editable: false,
                width: 60,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "submittedBy"
            },
            {
                headerName: "Submit Date",
                editable: false,
                width: 40,
                cellRendererFramework: DateRenderer,
                dateParser: dateParser,
                field: "createDate"
            },
            {
                headerName: "Visibility",
                editable: false,
                width: 30,
                cellRendererFramework: SelectRenderer,
                selectOptions: this.visibilityDictionary,
                selectOptionsValueField: 'value',
                selectOptionsDisplayField: 'display',
                field: "codeVisibility"
            }
        ];

        if (this.searchResultsGridApi) {
            this.searchResultsGridApi.setRowData(this.lastSearchDataDataTracks);
            this.searchResultsGridApi.setColumnDefs(dataTracksColumnDefinitions);
            this.searchResultsGridApi.sizeColumnsToFit();
        }
    }
    private setupResultGridForTopics() : void {

        let topicColumnDefinitions: any[] = [
            {
                headerName: "Rank",
                editable: false,
                width: 30,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "searchRank"
            },
            {
                headerName: "Score",
                editable: false,
                width: 35,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "searchScore"
            },
            {
                headerName: "Topic Name",
                editable: false,
                width: 300,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "name"
            },
            {
                headerName: "Group",
                editable: false,
                width: 110,
                cellRendererFramework: TextAlignLeftMiddleRenderer,
                field: "labName"
            },
            {
                headerName: "Visibility",
                editable: false,
                width: 75,
                cellRendererFramework: SelectRenderer,
                selectOptions: this.visibilityDictionary,
                selectOptionsValueField: 'value',
                selectOptionsDisplayField: 'display',
                field: "codeVisibility"
            }
        ];

        if (this.searchResultsGridApi) {
            this.searchResultsGridApi.setRowData(this.lastSearchDataTopics);
            this.searchResultsGridApi.setColumnDefs(topicColumnDefinitions);
            this.searchResultsGridApi.sizeColumnsToFit();
        }
    }


    private setupResultTreeForExperiments(): void {
        this.treeNodes = [];
        this.nodeIndex = 0;

        let root: TreeNode = new TreeNode({}, null, this.treeModel, this.nodeIndex++);
        for (let node of this.lastSearchTreeNodesExperiments) {
            this.treeNodes.push(this.recursivelySetupExperimentTreeNode(node, null));
        }

        this.treeModel.update();

        console.log("trying to use nodes: " + this.treeNodes);
    }
    private recursivelySetupExperimentTreeNode(backEndData: any, //parentID: string): void {
                                               parentNode: TreeNode): TreeNode {
        if (!backEndData) {
            return null;
        }

        let node: TreeNode = new TreeNode({}, parentNode, this.treeModel, this.nodeIndex++);
        let inputChildren;

        if (backEndData.idLab && (backEndData.label || backEndData.labName)) {
            let label: string = backEndData.label ? backEndData.label :  backEndData.labName;
            node.setField("display", label);
            inputChildren = Array.isArray(backEndData.Project) ? backEndData.Project : [backEndData.Project];
        } else if (backEndData.idProject && !backEndData.codeRequestCategory && (backEndData.label || backEndData.projectName)) {
            let label: string = backEndData.label ? backEndData.label :  backEndData.projectName;
            node.setField("display", label);
            inputChildren = Array.isArray(backEndData.RequestCategory) ? backEndData.RequestCategory : [backEndData.RequestCategory];
        } else if (backEndData.idProject && backEndData.codeRequestCategory && (backEndData.label || backEndData.codeRequestCategory)) {
            let label: string = backEndData.label ? backEndData.label :  backEndData.codeRequestCategory;
            node.setField("display", label);
            inputChildren = Array.isArray(backEndData.RequestNode) ? backEndData.RequestNode : [backEndData.RequestNode];
        } else if (backEndData.idRequest && (backEndData.label || backEndData.displayName)) {
            let label: string = backEndData.label ? backEndData.label :  backEndData.displayName;
            node.setField("display", label);
        } else {
            return;  // This is not a recognized node type. Stop.
        }

        let createdNodes: TreeNode[] = [];

        if (!!inputChildren) {
            if (Array.isArray(inputChildren)) {
                for (let child of inputChildren) {
                    createdNodes.push(this.recursivelySetupExperimentTreeNode(child, node));
                    // this.recursivelySetupExperimentTreeNode(child, node);
                }
            } else {
                createdNodes.push(this.recursivelySetupExperimentTreeNode(inputChildren, node.id));
            }
        }

        node.children = createdNodes;
        node.setField("children", createdNodes); // just added this - didn't work.
        node.setField("childrenField", createdNodes); // just added this - didn't work.
        return node;
    }

    private setupResultTreeForAnalyses(): void {

    }
    private setupResultTreeForProtocols(): void {

    }
    private setupResultTreeForDataTracks(): void {

    }
    private setupResultTreeForTopics(): void {

    }


    treeOnSelect(event: any) {
        console.log("Selected " + event);
    }
}
import {Component, OnInit} from "@angular/core";
import {FormBuilder} from "@angular/forms";
import {PrimaryTab} from "../../util/tabs/primary-tab.component";
import {Subscription} from "rxjs";
import {DictionaryService} from "../../services/dictionary.service";
import {CreateSecurityAdvisorService} from "../../services/create-security-advisor.service";
import {Router} from "@angular/router";
import {IconTextRendererComponent} from "../../util/grid-renderers/icon-text-renderer.component";
import {GridOptions} from "ag-grid-community/main";
import {AnalysisService} from "../../services/analysis.service";
import {GnomexStringUtilService} from "../../services/gnomex-string-util.service";
import {LabListService} from "../../services/lab-list.service";
import {CreateAnalysisComponent} from "../create-analysis.component";
import {MatDialog, MatDialogConfig} from "@angular/material";
import {DeleteAnalysisComponent} from "../delete-analysis.component";
import {ConstantsService} from "../../services/constants.service";
import {DialogsService} from "../../util/popup/dialogs.service";
import {ActionType} from "../../util/interfaces/generic-dialog-action.model";


@Component({

    selector: "analysis-tab",
    template: `

        <div class="full-height full-width">
            <div class="full-height full-width flex-container-col">
                <div class="full-width flex-container-row">
                    <div class="padded">
                        <button mat-button [disabled]="!enableCreateAnalysis || this.createSecurityAdvisorService.isGuest" (click)="create()">
                            <img [src]="this.newSegment" alt="">
                            New
                        </button>
                    </div>
                    <div class="padded">
                        <button mat-button [disabled]="!enableRemoveAnalysis || this.createSecurityAdvisorService.isGuest" (click)="remove()">
                            <img [src]="this.removeSegment" alt="">
                            Remove
                        </button>
                    </div>
                </div>
                <div class="full-width flex-grow">
                    <ag-grid-angular class="full-width full-height ag-theme-fresh"
                                     [gridOptions]="gridOpt"
                                     [columnDefs]="columnDefs"
                                     [rowData]="rowData"
                                     [rowSelection]="rowSelection"
                                     [rowDeselection]="true"
                                     [enableColResize]="true"
                                     [enableSorting]="true"
                                     (gridReady)="onGridReady($event)"
                                     (gridSizeChanged)="adjustColumnSize($event)"
                                     (rowSelected)="selectedRow($event)"
                                     (cellDoubleClicked)="forwardToAnalysis($event)"
                                     (cellEditingStarted)="startEditingCell($event)">
                    </ag-grid-angular>
                </div>
            </div>
        </div>

    `,
    styles: [`

        .padded { padding: 0.3em; }

        .left-right-padded {
            padding-left:  0.3em;
            padding-right: 0.3em;
        }

        .no-padding-dialog {
            padding: 0;
        }

    `]
})
export class AnalysisTab extends PrimaryTab implements OnInit {
    //Override
    name = "Analysis";
    columnDefs = [
        {
            headerName: "#",
            editable: false,
            field: "number",
            width: 100,
            cellRendererFramework: IconTextRendererComponent
        },
        {
            headerName: "Name",
            field: "name",
            editable: false,
            width: 100
        },
        {
            headerName: "Date",
            field: "createDateDisplay",
            editable: false,
            width: 200
        },
        {

            headerName: "Submitted by",
            field: "ownerName",
            editable: false,
            width: 200
        },
        {

            headerName: "Analysis Type",
            field: "analysisType",
            editable: false,
            width: 200
        },
        {

            headerName: "Analysis Protocol",
            field: "analysisProtocol",
            editable: false,
            width: 200
        },
        {

            headerName: "Organism",
            field: "organism",
            editable: false,
            width: 200
        },
        {

            headerName: "Description",
            field: "stripDescription",
            editable: false,
            width: 400
        }
    ];

    rowData: Array<any> = [];

    public gridOpt: GridOptions = {};
    public rowSelection = "multiple";
    public  newSegment: string;
    public  removeSegment: string;
    private filteredAnalysistOverviewListSubscript: Subscription;
    private labListSubscription: Subscription;
    private selectedTreeNodeSubscript: Subscription;
    private labList = [];
    private createAnalysisData: any;
    private enableRemoveAnalysis: boolean = false;
    private enableCreateAnalysis: boolean = true;
    private labs: any[] = [];
    private analysisTabNode: any;

    onGridReady(params) { }

    constructor(protected fb: FormBuilder,
                private analysisService: AnalysisService,
                private dictionaryService: DictionaryService,
                private router: Router,
                private StrUtil: GnomexStringUtilService,
                private labListService: LabListService,
                private dialog: MatDialog,
                private dialogsService: DialogsService,
                public createSecurityAdvisorService: CreateSecurityAdvisorService,
                private constService: ConstantsService) {
        super(fb);
    }

    ngOnInit() {
        this.newSegment = this.constService.SEGMENT_NEW;
        this.removeSegment = this.constService.SEGMENT_REMOVE_DISABLE;

        this.labListSubscription =  this.labListService.getLabListSubject().subscribe((response: any[]) => {
            this.labList = response;
        });

        this.analysisService.getCreateAnaylsisDataSubject().subscribe(data => {
            this.createAnalysisData = data;
        });

        this.filteredAnalysistOverviewListSubscript = this.analysisService.getFilteredOverviewListObservable().subscribe( data => {
            this.rowData = data;
        });

        this.selectedTreeNodeSubscript = this.analysisService.getAnalysisOverviewListSubject().subscribe(data => {
            this.analysisTabNode = data;
            this.enableRemoveAnalysis = false;
            this.analysisService.analysisList.forEach(aObj => {
                this.enableCreateAnalysis = true;

                let analysisTypeList = this.dictionaryService.getEntries(DictionaryService.ANALYSIS_TYPE);
                aObj["analysisType"] = this.findFromId(analysisTypeList, aObj["idAnalysisType"]);

                let analysisProtocolList = this.dictionaryService.getEntries(DictionaryService.ANALYSIS_PROTOCOL);
                aObj["analysisProtocol"] = this.findFromId(analysisProtocolList, aObj["idAnalysisProtocol"]);

                let organismList = this.dictionaryService.getEntries(DictionaryService.ORGANISM);
                aObj["organism"] = this.findFromId(organismList, aObj["idOrganism"]);
                aObj["stripDescription"] = GnomexStringUtilService.stripHTMLText(aObj["description"]);
            });

            this.rowData = this.analysisService.analysisList;

            if(this.analysisService.analysisGroupList) {
                if(Array.isArray(this.analysisService.analysisGroupList.Lab)) {
                    this.labs = this.analysisService.analysisGroupList.Lab;
                } else {
                    this.labs = [this.analysisService.analysisGroupList.Lab];
                }
            }

        });

    }


    startEditingCell(event: any) {
        //console.log(event)
    }

    adjustColumnSize(event: any) {
        if(this.gridOpt.api) {
            this.gridOpt.api.sizeColumnsToFit();
        }
    }

    forwardToAnalysis(event: any) {
        // console.log(event);
        let rowData = event.data;
        let analysisNode = this.analysisService.analysisList.find(aObj => aObj.idAnalysis === rowData.idAnalysis);
        this.router.navigate(["/analysis", {outlets: {"analysisPanel": [analysisNode.idAnalysis]}}]);
    }

    findFromId(nameList: Array<any>, id: string): string {
        let nameObj = nameList.find(name => {
            return name["value"] === id;
        });
        return nameObj["display"];
    }

    remove(): void {
        let selectedAnalysisList: Array<any> = this.gridOpt.api.getSelectedRows();
        if (selectedAnalysisList && selectedAnalysisList.length > 0) {
            let configuration: MatDialogConfig = new MatDialogConfig();
            configuration.width = "35em";
            configuration.panelClass = "no-padding-dialog";
            configuration.autoFocus = false;
            configuration.disableClose = true;
            configuration.data = {
                idAnalysisGroup: selectedAnalysisList[0].idAnalysisGroup,
                nodes: selectedAnalysisList
            };

            this.dialogsService.genericDialogContainer(DeleteAnalysisComponent, "Warning: Delete Analysis", this.constService.ICON_EXCLAMATION, configuration, {actions: [
                    {type: ActionType.PRIMARY, icon: null, name: "Yes", internalAction: "deleteAnalysis"},
                    {type: ActionType.SECONDARY, icon: null, name: "No", internalAction: "cancel"}
                ]});
        }
    }

    create(): void {
        let items = [];
        let labs = [];
        let selectedIdLab: string = "";
        let selectedIdAnalysisGroup: string = "";


        if (this.createAnalysisData) {
            items = this.createAnalysisData.items;
            labs = this.createAnalysisData.labs ? this.createAnalysisData.labs : [];
            selectedIdLab = this.analysisService.analysisList[0].idLab;
            selectedIdAnalysisGroup = this.analysisService.analysisList[0].idAnalysisGroup;
        } else {
            items = this.labs ? this.labs : [];
            labs = this.labs ? this.labs : [];
            if(this.analysisService.analysisList.length > 0) {
                selectedIdLab = this.analysisService.analysisList[0].idLab;
                selectedIdAnalysisGroup = this.analysisService.analysisList[0].idAnalysisGroup;
            } else {
                selectedIdLab = this.analysisTabNode.idLab;
                selectedIdAnalysisGroup = this.analysisTabNode.idAnalysisGroup ? this.analysisTabNode.idAnalysisGroup : "";
            }

        }

        let labListString = this.labList.map(function (item) {
            return item["name"];
        });

        let useThisLabList: any[];
        let useItems: any[];
        if (this.createSecurityAdvisorService.isSuperAdmin) {
            useThisLabList = this.labList;
        } else {
            useThisLabList = labs;
            useItems = items;
        }

        let configuration: MatDialogConfig = new MatDialogConfig();
        configuration.width = "40em";
        configuration.panelClass = "no-padding-dialog";
        configuration.autoFocus = false;
        configuration.disableClose = true;
        configuration.data = {
            labList: useThisLabList,
            items: useItems,
            selectedLab: selectedIdLab,
            selectedAnalysisGroup: selectedIdAnalysisGroup,
            parentComponent: "Analysis",
        };

        this.dialogsService.genericDialogContainer(CreateAnalysisComponent, "Create Analysis", null, configuration, {actions: [
                {type: ActionType.PRIMARY, icon: this.constService.ICON_SAVE, name: "Save" , internalAction: "createAnalysisYesButtonClicked"},
                {type: ActionType.SECONDARY,  name: "Cancel", internalAction: "cancel"}
            ]});
    }

    selectedRow(event: any) {
        let selectedRows: Array<any> = this.gridOpt.api.getSelectedRows();

        if(selectedRows.length === 0) {
            this.enableRemoveAnalysis = false;
            this.removeSegment = this.constService.SEGMENT_REMOVE_DISABLE;
        } else {
            this.enableRemoveAnalysis = true;
            this.removeSegment = this.constService.SEGMENT_REMOVE;
        }
    }

    ngOnDestroy(): void {
        this.filteredAnalysistOverviewListSubscript.unsubscribe();
        this.selectedTreeNodeSubscript.unsubscribe();
        this.labListSubscription.unsubscribe();
    }
}





import {Component, OnDestroy, OnInit} from "@angular/core";
import {FormBuilder, FormGroup} from "@angular/forms";
import {ExperimentPlatformService} from "../../services/experiment-platform.service";
import {Subscription} from "rxjs";
import {CellValueChangedEvent, GridApi} from "ag-grid-community";
import {CheckboxRenderer} from "../../util/grid-renderers/checkbox.renderer";
import {SelectEditor} from "../../util/grid-editors/select.editor";
import {ConstantsService} from "../../services/constants.service";
import {SelectRenderer} from "../../util/grid-renderers/select.renderer";
import {DictionaryService} from "../../services/dictionary.service";
import {MatDialogConfig} from "@angular/material";
import {DialogsService, DialogType} from "../../util/popup/dialogs.service";
import {PrepTypePricingDialogComponent} from "./prep-type-pricing-dialog.component";
import {ActionType} from "../../util/interfaces/generic-dialog-action.model";

//assets/page_add.png

@Component({
    template: `
        <div class="full-height full-width flex-container-col">
            <div class="flex-grow flex-container-row" style="align-items:center;"  >
                <button [disabled]="rowData.length === 0" type="button" mat-button color="primary" (click)="select()" >
                    {{selectedState}}
                </button>
                <button mat-button color="primary"
                        type="button"
                        (click)="addPrepType()">
                    <img [src]="this.constService.ICON_ADD"> Add
                </button>
                <button [disabled]="selectedPrepTypeRow.length === 0"
                        (click)="removePrepType()"
                        mat-button color="primary"
                        type="button">
                    <img [src]="this.constService.ICON_DELETE"> Remove
                </button>
                <button mat-button
                        color="primary"
                        (click)="openPricingEditor()"
                        [disabled]="selectedPrepTypeRow.length === 0"
                        type="button"> Edit Pricing </button>
                <mat-checkbox (change)="filterOptions($event)" [(ngModel)]="showInactive">Show Inactive</mat-checkbox>

            </div>
            <div style="flex:9" class="full-width">
                <ag-grid-angular class="full-height full-width ag-theme-balham"
                                 [columnDefs]="columnDefs"
                                 [rowData]="rowData"
                                 (cellValueChanged)="onCellValueChanged($event)"
                                 [enableColResize]="true"
                                 (gridReady)="onGridReady($event)"
                                 (gridSizeChanged)="onGridSizeChanged($event)"
                                 [rowDeselection]="true"
                                 [enableSorting]="true"
                                 [rowSelection]="'single'"
                                 (rowSelected)="this.onPrepTypeRowSelected($event)"
                                 [singleClickEdit]="true"
                                 [stopEditingWhenGridLosesFocus]="true">
                </ag-grid-angular>

            </div>
        </div>
    `
})

export class EpPrepTypesTabComponent implements OnInit, OnDestroy{
    public formGroup:FormGroup;
    public showInactive: boolean = false;
    private expPlatformSubscription: Subscription;
    private expPlatfromNode:any;
    private gridApi: GridApi;
    public selectedPrepTypeRow:any[]=[];
    private selectedPrepTypeRowIndex:number = -1;
    public selectedState:string = "Select all";
    public rowData:any[]= [];
    private prepTypeList: any[] = [];
    private extractionTypeList = [{type:'DNA'},{type:'RNA'},{type:'BOTH'}];

    public columnDefs: any[] = [
        {
            headerName: "Active",
            field: "isActive",
            cellRendererFramework: CheckboxRenderer,
            checkboxEditable: true,
            editable: false,
            width: 100
        },
        {
            headerName: "Prep Type",
            field: "isolationPrepType",
            editable:true,
            width: 250
        },

        {
            headerName: "Type",
            field: "type",
            cellRendererFramework: SelectRenderer,
            cellEditorFramework: SelectEditor,
            selectOptions: this.extractionTypeList,
            selectOptionsDisplayField: "type",
            selectOptionsValueField: "type",
            editable:true,
            width: 200
        }

    ];



    constructor(private fb: FormBuilder,
                private expPlatfromService: ExperimentPlatformService,
                public constService: ConstantsService,
                private dictionaryService: DictionaryService,
                private dialogService: DialogsService) {
    }

    ngOnInit(){
        this.formGroup = this.fb.group({prepTypes:[]});
        this.expPlatformSubscription = this.expPlatfromService.getExperimentPlatformObservable()
            .subscribe(data =>{
                if(data &&( data.prepTypes || data.prepTypes) ){
                    this.expPlatfromNode = data;
                    this.prepTypeList = Array.isArray(data.prepTypes) ? data.prepTypes : [data.prepTypes.IsolationPrepType];
                    this.showInactive = false;
                    this.filterOptions();
                    this.selectedPrepTypeRow = [];
                    this.formGroup.get('prepTypes').setValue(this.prepTypeList);
                    this.formGroup.markAsPristine()
                }
            });

    }

    filterOptions() {
        if(this.showInactive) {
            this.rowData = this.prepTypeList;
        } else {
            this.rowData = this.prepTypeList.filter(seqOpt => seqOpt.isActive === "Y" );
        }
    }


    onPrepTypeRowSelected(event){
        if(event.node.selected){
            this.selectedPrepTypeRowIndex = event.rowIndex;
            this.gridApi.selectIndex(this.selectedPrepTypeRowIndex, false, null);
        }
        this.selectedPrepTypeRow = this.gridApi.getSelectedRows();
    }

    onGridReady(params:any){
        this.gridApi= params.api;
    }
    onGridSizeChanged(event){
        if(this.gridApi){
            this.gridApi.sizeColumnsToFit();
        }
    }
    onCellValueChanged(event:CellValueChangedEvent):void {
        if(event.oldValue !== event.newValue){
            this.formGroup.markAsDirty();
        }

    }

    private applyPrepTypeFn = (dialogFormGroup:FormGroup)=> {
        let prepType = this.selectedPrepTypeRow[0];

        if(dialogFormGroup.dirty){
            prepType.unitPriceInternal = dialogFormGroup.get('unitPriceInternal').value;
            prepType.unitPriceExternalAcademic = dialogFormGroup.get('unitPriceExternalAcademic').value;
            prepType.unitPriceExternalCommercial = dialogFormGroup.get('unitPriceExternalCommercial').value;
            this.filterOptions();
            this.formGroup.markAsDirty();
        }

    };
    openPricingEditor() {
        if(this.selectedPrepTypeRow.length > 0) {
            let config: MatDialogConfig = new MatDialogConfig();
            config.width = "25em";
            config.data = {
                rowData: this.selectedPrepTypeRow[0],
                applyFn: this.applyPrepTypeFn,
            };
            this.dialogService.genericDialogContainer(PrepTypePricingDialogComponent, "Prep Type Pricing", null, config,
                {actions: [
                        {type: ActionType.PRIMARY, icon: this.constService.ICON_SAVE, name: "Apply", internalAction: "applyChanges"},
                        {type: ActionType.SECONDARY, name: "Cancel", internalAction: "onClose"}
                    ]});
        }
    }
    addPrepType(){
        let newPrepType = {
            isActive: "Y",
            isNew: 'Y',
            unitPriceInternal:'0.00',
            unitPriceExternalAcademic:'0.00',
            unitPriceExternalCommercial:'0.00',
            codeIsolationPrepType:'',
            idPrice:'',
            isolationPrepType:'enter prep type here...',
            type:'DNA',
            codeRequestCategory: this.expPlatfromNode.codeRequestCategory
        };
        this.prepTypeList.splice(0, 0, newPrepType);
        this.filterOptions();
        this.gridApi.setRowData(this.rowData);
        this.gridApi.forEachNode(node => node.rowIndex ? 0 : node.setSelected(true, true));
        this.formGroup.markAsDirty();

    }
    removePrepType(){
        let prepType = this.selectedPrepTypeRow[0];
        this.dialogService.confirm("Are you sure you want to remove prep type named \'" + prepType.isolationPrepType +'\'?', "Remove Prep Type")
            .subscribe((result: any) =>{
            if(result){
                let removeIndex:number = this.prepTypeList.indexOf(prepType);
                if(removeIndex > -1){
                    this.prepTypeList.splice(removeIndex, 1);
                    this.filterOptions();
                    this.selectedPrepTypeRow = [];
                    this.gridApi.setRowData(this.rowData);
                    this.formGroup.markAsDirty();
                }
            }
        });

    }
    select(){
        if( this.selectedState ===  "Select all"){
            this.selectedState = "Unselect all";
            this.prepTypeList.map(prep => {
                prep.isActive = "Y";
                return prep;
            });

        }else{
            this.selectedState = "Select all";
            this.prepTypeList.map(prep => {
                prep.isActive = "N";
                return prep;
            });
        }

        this.filterOptions();
        this.gridApi.setRowData(this.rowData);
        if(this.rowData.length === 0 && !this.showInactive) {
            this.dialogService.alert("Check Show Inactive box to see all inactive data.", null, DialogType.INFO);
        }
    }

    ngOnDestroy(){
        this.expPlatformSubscription.unsubscribe();
    }


}
